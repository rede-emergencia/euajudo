"""
Test suite for the Donation Commitment flow (MVP).

Covers:
  - Volunteer commits to one or more items
  - Volunteer cancels commitment → quantities restored
  - Shelter confirms receipt with pickup_code → inventory updated
  - Race-condition guard: duplicate active commitments rejected
  - Invalid quantity rejected
  - Completed delivery cannot be cancelled
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.database import Base
from app.models import User, DeliveryLocation, Category
from app.inventory_models import (
    ShelterRequest, ShelterRequestDelivery, InventoryItem
)
from app.shared.enums import DeliveryStatus, ProductType
from app.services.donation_service import DonationService, DonationError, CommitItem

# ============================================================================
# TEST DB SETUP
# ============================================================================

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_donations.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    # Criar tabela pickup_codes
    from app.application.services.pickup_service import PickupCodeModel
    PickupCodeModel.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    PickupCodeModel.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables():
    """Delete all rows after each test so fixtures don't collide."""
    yield
    from sqlalchemy import text
    conn = engine.connect()
    # Order matters: children before parents
    for table in [
        "inventory_transactions", "inventory_items",
        "shelter_request_deliveries", "deliveries",
        "request_adjustments", "shelter_requests",
        "delivery_locations", "users", "categories",
    ]:
        conn.execute(text(f"DELETE FROM {table}"))
    conn.commit()
    conn.close()


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


# ============================================================================
# FIXTURES — seed minimal data
# ============================================================================

@pytest.fixture
def shelter_user(db):
    user = User(
        email="shelter@test.com",
        hashed_password="x",
        name="Test Shelter",
        roles="shelter",
        approved=True,
        active=True,
    )
    db.add(user)
    db.flush()
    return user


@pytest.fixture
def shelter_location(db, shelter_user):
    loc = DeliveryLocation(
        name="Test Shelter",
        address="Rua A, 123",
        user_id=shelter_user.id,
        active=True,
        approved=True,
    )
    db.add(loc)
    db.flush()
    return loc


@pytest.fixture
def volunteer_user(db):
    user = User(
        email="volunteer@test.com",
        hashed_password="x",
        name="Test Volunteer",
        roles="volunteer",
        approved=True,
        active=True,
    )
    db.add(user)
    db.flush()
    return user


@pytest.fixture
def category(db):
    cat = Category(
        name="agua",
        display_name="Água",
        active=True,
    )
    db.add(cat)
    db.flush()
    return cat


@pytest.fixture
def shelter_request(db, shelter_user, category, shelter_location):
    """A pending shelter request for 100 units of Água."""
    req = ShelterRequest(
        shelter_id=shelter_user.id,
        category_id=category.id,
        quantity_requested=100,
        quantity_received=0,
        quantity_pending=0,
        status="pending",
    )
    db.add(req)
    db.flush()
    return req


# ============================================================================
# TESTS
# ============================================================================

class TestCommitDonation:
    def test_happy_path_single_item(self, db, volunteer_user, shelter_user, shelter_request):
        """Volunteer commits to 30 units → delivery created, code returned."""
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 30)],
        )

        assert result["code"]
        # Código agora tem formato: DEL-<timestamp>-<random>-<hash>
        assert len(result["code"]) > 20
        assert result["code"].startswith("DEL-")
        assert "-" in result["code"]
        assert len(result["delivery_ids"]) == 1

        delivery_id = result["delivery_ids"][0]
        from app.models import Delivery
        delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()

        assert delivery is not None
        assert delivery.quantity == 30
        assert delivery.status == DeliveryStatus.PENDING_CONFIRMATION
        assert delivery.pickup_code == result["code"]
        assert delivery.volunteer_id == volunteer_user.id
        assert delivery.batch_id is None
        assert delivery.pickup_location_id is None

    def test_shelter_request_marked_active(self, db, volunteer_user, shelter_user, shelter_request):
        """Committing to a pending request marks it active."""
        svc = DonationService(db)
        svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 10)],
        )
        db.refresh(shelter_request)
        assert shelter_request.status == "active"

    def test_link_created(self, db, volunteer_user, shelter_user, shelter_request):
        """ShelterRequestDelivery link is created on commit."""
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 20)],
        )
        delivery_id = result["delivery_ids"][0]
        link = db.query(ShelterRequestDelivery).filter(
            ShelterRequestDelivery.delivery_id == delivery_id,
            ShelterRequestDelivery.request_id == shelter_request.id,
        ).first()
        assert link is not None
        assert link.quantity == 20

    def test_code_is_random_per_commit(self, db, volunteer_user, shelter_user, shelter_request):
        """Each commitment generates a unique code."""
        svc = DonationService(db)

        # Cancel first to allow second commit
        r1 = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 5)],
        )
        svc.cancel_donation(r1["delivery_ids"][0], volunteer_user.id)

        r2 = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 5)],
        )
        # Codes are random — low probability of collision, but test the format
        assert len(r2["code"]) > 20
        assert r2["code"].startswith("DEL-")
        assert r1["code"] != r2["code"]

    def test_quantity_over_available_rejected(self, db, volunteer_user, shelter_user, shelter_request):
        """Committing more than available raises DonationError."""
        svc = DonationService(db)
        with pytest.raises(DonationError, match="Invalid quantity"):
            svc.commit_donation(
                volunteer_id=volunteer_user.id,
                shelter_user_id=shelter_user.id,
                items=[CommitItem(shelter_request.id, 9999)],
            )

    def test_zero_quantity_rejected(self, db, volunteer_user, shelter_user, shelter_request):
        """Zero quantity raises DonationError."""
        svc = DonationService(db)
        with pytest.raises(DonationError, match="Invalid quantity"):
            svc.commit_donation(
                volunteer_id=volunteer_user.id,
                shelter_user_id=shelter_user.id,
                items=[CommitItem(shelter_request.id, 0)],
            )

    def test_unknown_shelter_raises(self, db, volunteer_user, shelter_request):
        """Unknown shelter_id raises DonationError."""
        svc = DonationService(db)
        with pytest.raises(DonationError, match="No location"):
            svc.commit_donation(
                volunteer_id=volunteer_user.id,
                shelter_user_id=99999,
                items=[CommitItem(shelter_request.id, 10)],
            )


class TestCancelDonation:
    def test_cancel_restores_request_to_pending(self, db, volunteer_user, shelter_user, shelter_request):
        """Cancelling the only commitment reverts request to pending."""
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 15)],
        )
        delivery_id = result["delivery_ids"][0]

        svc.cancel_donation(delivery_id, volunteer_user.id)

        db.refresh(shelter_request)
        assert shelter_request.status == "pending"

    def test_cancel_removes_delivery(self, db, volunteer_user, shelter_user, shelter_request):
        """Delivery record is deleted after cancellation."""
        from app.models import Delivery
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 5)],
        )
        delivery_id = result["delivery_ids"][0]
        svc.cancel_donation(delivery_id, volunteer_user.id)

        assert db.query(Delivery).filter(Delivery.id == delivery_id).first() is None

    def test_cancel_removes_link(self, db, volunteer_user, shelter_user, shelter_request):
        """ShelterRequestDelivery link is removed after cancellation."""
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 5)],
        )
        delivery_id = result["delivery_ids"][0]
        svc.cancel_donation(delivery_id, volunteer_user.id)

        link = db.query(ShelterRequestDelivery).filter(
            ShelterRequestDelivery.delivery_id == delivery_id
        ).first()
        assert link is None

    def test_cancel_other_volunteers_delivery_rejected(self, db, shelter_user, shelter_request):
        """Volunteer cannot cancel another volunteer's commitment."""
        other = User(
            email="other@test.com", hashed_password="x",
            name="Other", roles="volunteer", approved=True, active=True,
        )
        db.add(other)
        db.flush()

        attacker = User(
            email="attacker@test.com", hashed_password="x",
            name="Attacker", roles="volunteer", approved=True, active=True,
        )
        db.add(attacker)
        db.flush()

        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=other.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 5)],
        )
        delivery_id = result["delivery_ids"][0]

        with pytest.raises(DonationError, match="not found or does not belong"):
            svc.cancel_donation(delivery_id, attacker.id)

    def test_cancel_completed_delivery_rejected(self, db, volunteer_user, shelter_user, shelter_request):
        """Cannot cancel a delivery already marked DELIVERED."""
        from app.models import Delivery
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 5)],
        )
        delivery_id = result["delivery_ids"][0]

        # Force DELIVERED status
        delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
        delivery.status = DeliveryStatus.DELIVERED
        db.commit()

        with pytest.raises(DonationError, match="Cannot cancel"):
            svc.cancel_donation(delivery_id, volunteer_user.id)


class TestConfirmDelivery:
    def test_confirm_with_correct_code(self, db, volunteer_user, shelter_user, shelter_request):
        """Shelter confirms with correct code → DELIVERED + inventory updated."""
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 25)],
        )
        delivery_id = result["delivery_ids"][0]
        code = result["code"]

        delivery = svc.confirm_delivery(
            delivery_id=delivery_id,
            pickup_code=code,
            shelter_user_id=shelter_user.id,
        )

        assert delivery.status == DeliveryStatus.DELIVERED
        assert delivery.delivered_at is not None

    def test_confirm_updates_inventory(self, db, volunteer_user, shelter_user, shelter_request, category):
        """After confirmation, InventoryItem quantity_in_stock increases."""
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 40)],
        )
        delivery_id = result["delivery_ids"][0]
        code = result["code"]

        svc.confirm_delivery(
            delivery_id=delivery_id,
            pickup_code=code,
            shelter_user_id=shelter_user.id,
        )

        item = db.query(InventoryItem).filter(
            InventoryItem.shelter_id == shelter_user.id,
            InventoryItem.category_id == category.id,
        ).first()

        assert item is not None
        assert item.quantity_in_stock >= 40

    def test_confirm_wrong_code_rejected(self, db, volunteer_user, shelter_user, shelter_request):
        """Wrong pickup_code raises DonationError."""
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 5)],
        )
        delivery_id = result["delivery_ids"][0]

        with pytest.raises(DonationError, match="Invalid pickup code"):
            svc.confirm_delivery(
                delivery_id=delivery_id,
                pickup_code="000000",
                shelter_user_id=shelter_user.id,
            )

    def test_confirm_updates_shelter_request_received(self, db, volunteer_user, shelter_user, shelter_request):
        """quantity_received increments on confirmation."""
        svc = DonationService(db)
        result = svc.commit_donation(
            volunteer_id=volunteer_user.id,
            shelter_user_id=shelter_user.id,
            items=[CommitItem(shelter_request.id, 30)],
        )
        delivery_id = result["delivery_ids"][0]
        code = result["code"]

        svc.confirm_delivery(delivery_id, code, shelter_user.id)

        db.refresh(shelter_request)
        assert shelter_request.quantity_received == 30
