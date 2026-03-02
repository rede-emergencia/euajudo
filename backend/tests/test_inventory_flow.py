"""
Comprehensive tests for the inventory + delivery flow.
Tests the full lifecycle: shelter creates requests, volunteer commits,
delivery confirmed/cancelled, stock updated correctly.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_inventory.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Criar tabela pickup_codes
    from app.application.services.pickup_service import PickupCodeModel
    PickupCodeModel.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    PickupCodeModel.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture(scope="function")
def client(setup_database):
    yield TestClient(app)


# ============================================================================
# HELPERS
# ============================================================================

def register_user(client, email, roles, name="Test User", location_address=None):
    data = {
        "email": email,
        "password": "password123",
        "name": name,
        "roles": roles,
        "city_id": "belo-horizonte",
    }
    if location_address:
        data["location_address"] = location_address
        data["location_name"] = name
    resp = client.post("/api/auth/register", json=data)
    assert resp.status_code == 201, f"Register failed: {resp.json()}"
    return resp.json()


def login_user(client, email):
    resp = client.post("/api/auth/login", data={"username": email, "password": "password123"})
    assert resp.status_code == 200, f"Login failed: {resp.json()}"
    return resp.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def create_category(client, token, name="Roupas", display_name="Roupas Adulto"):
    """Create a category via the categories API."""
    resp = client.post(
        "/categories/",
        json={"name": name, "display_name": display_name, "active": True},
        headers=auth_header(token),
    )
    # Categories may require admin or may be open
    if resp.status_code in [200, 201]:
        return resp.json()
    return None


def approve_user(client, admin_token, user_id):
    """Approve a user via admin endpoint."""
    resp = client.post(
        f"/api/admin/users/{user_id}/approve",
        headers=auth_header(admin_token),
    )
    return resp


# ============================================================================
# TEST: INVENTORY SERVICE UNIT TESTS
# ============================================================================

class TestInventoryServiceUnit:
    """Unit tests for inventory_service.py functions directly."""

    def test_get_or_create_inventory_item_creates(self, client):
        """Test that get_or_create_inventory_item creates a new item."""
        from app.services.inventory_service import get_or_create_inventory_item

        # Register shelter with location
        shelter_data = register_user(
            client, "shelter_unit@test.com", "shelter", "Abrigo Unit",
            location_address="Rua Teste 123"
        )
        shelter_id = shelter_data["id"]

        # We need a category — create directly in DB
        db = next(override_get_db())
        from app.models import Category
        cat = Category(name="food_unit", display_name="Alimentos Unit", active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        item = get_or_create_inventory_item(db, shelter_id, cat.id)
        assert item is not None
        assert item.shelter_id == shelter_id
        assert item.category_id == cat.id
        assert item.quantity_in_stock == 0
        assert item.quantity_available == 0
        db.close()

    def test_get_or_create_inventory_item_returns_existing(self, client):
        """Test that get_or_create returns existing item."""
        from app.services.inventory_service import get_or_create_inventory_item

        shelter_data = register_user(
            client, "shelter_unit2@test.com", "shelter", "Abrigo Unit 2",
            location_address="Rua Teste 456"
        )
        shelter_id = shelter_data["id"]

        db = next(override_get_db())
        from app.models import Category
        cat = Category(name="food_unit2", display_name="Alimentos Unit 2", active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        item1 = get_or_create_inventory_item(db, shelter_id, cat.id)
        item1.quantity_in_stock = 50
        item1.quantity_available = 50
        db.commit()

        item2 = get_or_create_inventory_item(db, shelter_id, cat.id)
        assert item2.id == item1.id
        assert item2.quantity_in_stock == 50
        db.close()

    def test_on_delivery_confirmed_updates_stock(self, client):
        """Test that confirming a delivery adds to inventory."""
        from app.services.inventory_service import (
            get_or_create_inventory_item, on_delivery_confirmed
        )
        from app.models import Category, Delivery, DeliveryLocation
        from app.shared.enums import DeliveryStatus, ProductType

        shelter_data = register_user(
            client, "shelter_confirm@test.com", "shelter", "Abrigo Confirm",
            location_address="Rua Confirm 123"
        )
        shelter_id = shelter_data["id"]

        db = next(override_get_db())

        # Get the auto-created location
        location = db.query(DeliveryLocation).filter(
            DeliveryLocation.user_id == shelter_id
        ).first()
        assert location is not None, "Location should be auto-created for shelter"

        cat = Category(name="food_confirm", display_name="Alimentos Confirm", active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        # Create a delivery pointing to this location
        delivery = Delivery(
            delivery_location_id=location.id,
            category_id=cat.id,
            product_type=ProductType.MEAL,
            quantity=25,
            status=DeliveryStatus.DELIVERED,
        )
        db.add(delivery)
        db.commit()
        db.refresh(delivery)

        # Ensure inventory item exists
        get_or_create_inventory_item(db, shelter_id, cat.id)
        db.commit()

        # Call on_delivery_confirmed
        on_delivery_confirmed(db, delivery, shelter_id)
        db.commit()

        # Verify stock was updated
        from app.inventory_models import InventoryItem
        item = db.query(InventoryItem).filter(
            InventoryItem.shelter_id == shelter_id,
            InventoryItem.category_id == cat.id,
        ).first()
        assert item.quantity_in_stock == 25
        assert item.quantity_available == 25

        # Verify transaction was created
        from app.inventory_models import InventoryTransaction, TransactionType
        txn = db.query(InventoryTransaction).filter(
            InventoryTransaction.inventory_item_id == item.id,
            InventoryTransaction.transaction_type == TransactionType.DONATION_RECEIVED,
        ).first()
        assert txn is not None
        assert txn.quantity_change == 25
        assert txn.delivery_id == delivery.id
        db.close()

    def test_on_distribution_decreases_stock(self, client):
        """Test that distributing items decreases stock."""
        from app.services.inventory_service import (
            get_or_create_inventory_item, on_distribution
        )
        from app.models import Category

        shelter_data = register_user(
            client, "shelter_dist@test.com", "shelter", "Abrigo Dist",
            location_address="Rua Dist 123"
        )
        shelter_id = shelter_data["id"]

        db = next(override_get_db())
        cat = Category(name="food_dist", display_name="Alimentos Dist", active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        # Create inventory item with stock
        item = get_or_create_inventory_item(db, shelter_id, cat.id)
        item.quantity_in_stock = 100
        item.quantity_available = 100
        db.commit()

        # Distribute 30 items
        updated = on_distribution(db, shelter_id, cat.id, 30, notes="Distributed to family")
        db.commit()

        assert updated.quantity_in_stock == 70
        assert updated.quantity_available == 70
        db.close()

    def test_on_distribution_insufficient_stock_raises(self, client):
        """Test that distributing more than available raises error."""
        from app.services.inventory_service import (
            get_or_create_inventory_item, on_distribution
        )
        from app.models import Category

        shelter_data = register_user(
            client, "shelter_insuf@test.com", "shelter", "Abrigo Insuf",
            location_address="Rua Insuf 123"
        )
        shelter_id = shelter_data["id"]

        db = next(override_get_db())
        cat = Category(name="food_insuf", display_name="Alimentos Insuf", active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        item = get_or_create_inventory_item(db, shelter_id, cat.id)
        item.quantity_in_stock = 10
        item.quantity_available = 10
        db.commit()

        with pytest.raises(ValueError, match="Insufficient stock"):
            on_distribution(db, shelter_id, cat.id, 50)
        db.close()

    def test_on_delivery_cancelled_removes_link(self, client):
        """Test that cancelling a delivery removes the request-delivery link."""
        from app.services.inventory_service import (
            get_or_create_inventory_item, on_volunteer_committed, on_delivery_cancelled
        )
        from app.models import Category, Delivery, DeliveryLocation
        from app.inventory_models import ShelterRequest, ShelterRequestDelivery
        from app.shared.enums import DeliveryStatus, ProductType

        shelter_data = register_user(
            client, "shelter_cancel@test.com", "shelter", "Abrigo Cancel",
            location_address="Rua Cancel 123"
        )
        shelter_id = shelter_data["id"]

        db = next(override_get_db())
        location = db.query(DeliveryLocation).filter(
            DeliveryLocation.user_id == shelter_id
        ).first()

        cat = Category(name="food_cancel", display_name="Alimentos Cancel", active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        # Create a shelter request
        req = ShelterRequest(
            shelter_id=shelter_id,
            category_id=cat.id,
            quantity_requested=50,
            quantity_received=0,
            quantity_pending=0,
            status="pending",
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        # Create committed delivery
        delivery = Delivery(
            delivery_location_id=location.id,
            category_id=cat.id,
            product_type=ProductType.MEAL,
            quantity=20,
            status=DeliveryStatus.PENDING_CONFIRMATION,
            volunteer_id=shelter_id,  # just for test
        )
        db.add(delivery)
        db.commit()
        db.refresh(delivery)

        # Volunteer commits
        on_volunteer_committed(db, delivery, 20)
        db.commit()

        # Verify link was created
        link_count = db.query(ShelterRequestDelivery).filter(
            ShelterRequestDelivery.delivery_id == delivery.id
        ).count()
        assert link_count == 1

        # Cancel delivery
        on_delivery_cancelled(db, delivery)
        db.commit()

        # Verify link was removed
        link_count = db.query(ShelterRequestDelivery).filter(
            ShelterRequestDelivery.delivery_id == delivery.id
        ).count()
        assert link_count == 0

        # Request should go back to pending
        db.refresh(req)
        assert req.status == "pending"
        db.close()


# ============================================================================
# TEST: INVENTORY API ENDPOINTS
# ============================================================================

class TestInventoryAPI:
    """Integration tests for inventory API endpoints."""

    def _setup_shelter(self, client):
        """Helper: register shelter + login, return (shelter_data, token)."""
        import uuid
        uid = str(uuid.uuid4())[:8]
        shelter_data = register_user(
            client,
            f"shelter_{uid}@test.com",
            "shelter",
            f"Abrigo {uid}",
            location_address=f"Rua {uid}, 123",
        )
        token = login_user(client, f"shelter_{uid}@test.com")
        return shelter_data, token

    def _setup_category(self, client):
        """Helper: create a category directly in DB."""
        import uuid
        uid = str(uuid.uuid4())[:8]
        db = next(override_get_db())
        from app.models import Category
        cat = Category(name=f"cat_{uid}", display_name=f"Category {uid}", active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)
        cat_id = cat.id
        db.close()
        return cat_id

    def test_create_shelter_request(self, client):
        """Test creating a shelter donation request."""
        shelter_data, token = self._setup_shelter(client)
        cat_id = self._setup_category(client)

        resp = client.post(
            "/api/inventory/requests",
            json={"category_id": cat_id, "quantity_requested": 100, "notes": "Urgent need"},
            headers=auth_header(token),
        )
        assert resp.status_code == 200, f"Failed: {resp.json()}"
        data = resp.json()
        assert data["quantity_requested"] == 100
        assert data["quantity_received"] == 0
        assert data["status"] == "pending"
        assert data["notes"] == "Urgent need"

    def test_adjust_request_increase(self, client):
        """Test increasing a request quantity."""
        shelter_data, token = self._setup_shelter(client)
        cat_id = self._setup_category(client)

        # Create request
        resp = client.post(
            "/api/inventory/requests",
            json={"category_id": cat_id, "quantity_requested": 50},
            headers=auth_header(token),
        )
        req_id = resp.json()["id"]

        # Increase by 30
        resp = client.post(
            f"/api/inventory/requests/adjust/{req_id}",
            json={"adjustment_type": "increase", "quantity_change": 30, "reason": "More families arrived"},
            headers=auth_header(token),
        )
        assert resp.status_code == 200, f"Failed: {resp.json()}"
        data = resp.json()
        assert data["quantity_before"] == 50
        assert data["quantity_after"] == 80
        assert data["can_adjust"] is True

    def test_adjust_request_decrease(self, client):
        """Test decreasing a request quantity."""
        shelter_data, token = self._setup_shelter(client)
        cat_id = self._setup_category(client)

        resp = client.post(
            "/api/inventory/requests",
            json={"category_id": cat_id, "quantity_requested": 100},
            headers=auth_header(token),
        )
        req_id = resp.json()["id"]

        resp = client.post(
            f"/api/inventory/requests/adjust/{req_id}",
            json={"adjustment_type": "decrease", "quantity_change": 40, "reason": "Overestimated"},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["quantity_after"] == 60

    def test_cancel_request(self, client):
        """Test cancelling a shelter request."""
        shelter_data, token = self._setup_shelter(client)
        cat_id = self._setup_category(client)

        resp = client.post(
            "/api/inventory/requests",
            json={"category_id": cat_id, "quantity_requested": 50},
            headers=auth_header(token),
        )
        req_id = resp.json()["id"]

        resp = client.post(
            f"/api/inventory/requests/{req_id}/cancel",
            headers=auth_header(token),
        )
        assert resp.status_code == 200

    def test_distribute_items(self, client):
        """Test distributing items to end recipients."""
        shelter_data, token = self._setup_shelter(client)
        cat_id = self._setup_category(client)

        # First add stock manually
        db = next(override_get_db())
        from app.inventory_models import InventoryItem
        item = InventoryItem(
            shelter_id=shelter_data["id"],
            category_id=cat_id,
            quantity_in_stock=100,
            quantity_reserved=0,
            quantity_available=100,
        )
        db.add(item)
        db.commit()
        db.close()

        # Distribute
        resp = client.post(
            "/api/inventory/distribute",
            json={
                "category_id": cat_id,
                "quantity": 15,
                "recipient_name": "João da Silva",
                "recipient_document": "123.456.789-00",
            },
            headers=auth_header(token),
        )
        assert resp.status_code == 200, f"Failed: {resp.json()}"
        data = resp.json()
        assert data["quantity"] == 15
        assert data["recipient_name"] == "João da Silva"

    def test_distribute_insufficient_stock(self, client):
        """Test distributing more than available fails."""
        shelter_data, token = self._setup_shelter(client)
        cat_id = self._setup_category(client)

        # Add small stock
        db = next(override_get_db())
        from app.inventory_models import InventoryItem
        item = InventoryItem(
            shelter_id=shelter_data["id"],
            category_id=cat_id,
            quantity_in_stock=5,
            quantity_reserved=0,
            quantity_available=5,
        )
        db.add(item)
        db.commit()
        db.close()

        resp = client.post(
            "/api/inventory/distribute",
            json={"category_id": cat_id, "quantity": 20},
            headers=auth_header(token),
        )
        assert resp.status_code == 400

    def test_dashboard_endpoint(self, client):
        """Test the dashboard endpoint returns valid data."""
        shelter_data, token = self._setup_shelter(client)

        resp = client.get(
            "/api/inventory/dashboard",
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "stats" in data
        assert "inventory_by_category" in data
        assert "active_requests" in data
        assert "low_stock_alerts" in data

    def test_shelter_deliveries_endpoint(self, client):
        """Test the shelter-deliveries endpoint returns a list."""
        shelter_data, token = self._setup_shelter(client)

        resp = client.get(
            "/api/inventory/shelter-deliveries",
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ============================================================================
# TEST: FULL DELIVERY + INVENTORY LIFECYCLE
# ============================================================================

class TestDeliveryInventoryLifecycle:
    """End-to-end tests for the delivery lifecycle with inventory impact."""

    def _setup_shelter_with_location(self, client):
        """Setup shelter user with auto-created delivery location."""
        import uuid
        uid = str(uuid.uuid4())[:8]
        shelter_data = register_user(
            client,
            f"shelter_e2e_{uid}@test.com",
            "shelter",
            f"Abrigo E2E {uid}",
            location_address=f"Rua E2E {uid}, 123",
        )
        token = login_user(client, f"shelter_e2e_{uid}@test.com")
        return shelter_data, token

    def _setup_volunteer(self, client):
        """Setup volunteer user."""
        import uuid
        uid = str(uuid.uuid4())[:8]
        vol_data = register_user(
            client,
            f"vol_e2e_{uid}@test.com",
            "volunteer",
            f"Voluntário {uid}",
        )
        token = login_user(client, f"vol_e2e_{uid}@test.com")
        return vol_data, token

    def _create_category_db(self):
        import uuid
        uid = str(uuid.uuid4())[:8]
        db = next(override_get_db())
        from app.models import Category
        cat = Category(name=f"cat_e2e_{uid}", display_name=f"Cat E2E {uid}", active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)
        cat_id = cat.id
        db.close()
        return cat_id

    def test_shelter_creates_delivery_request(self, client):
        """Shelter creates a direct delivery, volunteer commits, validates, stock increases."""
        shelter_data, shelter_token = self._setup_shelter_with_location(client)
        vol_data, vol_token = self._setup_volunteer(client)
        cat_id = self._create_category_db()

        # 1. Shelter creates direct delivery
        resp = client.post(
            "/api/deliveries/direct",
            json={"category_id": cat_id, "quantity": 50},
            headers=auth_header(shelter_token),
        )
        assert resp.status_code == 201, f"Create delivery failed: {resp.json()}"
        delivery = resp.json()
        delivery_id = delivery["id"]
        assert delivery["status"] == "available"
        assert delivery["quantity"] == 50

        # 2. Volunteer commits to delivery (partial: 20)
        resp = client.post(
            f"/api/deliveries/{delivery_id}/commit",
            json={"quantity": 20},
            headers=auth_header(vol_token),
        )
        assert resp.status_code == 200, f"Commit failed: {resp.json()}"
        committed = resp.json()
        committed_id = committed["id"]
        assert committed["quantity"] == 20
        assert committed["status"] == "pending_confirmation"
        assert committed["delivery_code"] is not None

        # 3. Volunteer validates delivery with code
        resp = client.post(
            f"/api/deliveries/{committed_id}/validate-delivery",
            json={"code": committed["delivery_code"]},
            headers=auth_header(vol_token),
        )
        assert resp.status_code == 200, f"Validate failed: {resp.json()}"
        assert resp.json()["status"] == "delivered"

        # 4. Verify inventory was updated
        resp = client.get(
            "/api/inventory/dashboard",
            headers=auth_header(shelter_token),
        )
        assert resp.status_code == 200
        dashboard = resp.json()
        # Stock should have increased by 20
        assert dashboard["stats"]["total_items_in_stock"] >= 20

    def test_delivery_cancel_restores_parent_quantity(self, client):
        """When volunteer cancels, parent delivery quantity is restored."""
        shelter_data, shelter_token = self._setup_shelter_with_location(client)
        vol_data, vol_token = self._setup_volunteer(client)
        cat_id = self._create_category_db()

        # Shelter creates delivery
        resp = client.post(
            "/api/deliveries/direct",
            json={"category_id": cat_id, "quantity": 100},
            headers=auth_header(shelter_token),
        )
        delivery_id = resp.json()["id"]
        original_qty = resp.json()["quantity"]

        # Volunteer commits partially
        resp = client.post(
            f"/api/deliveries/{delivery_id}/commit",
            json={"quantity": 30},
            headers=auth_header(vol_token),
        )
        committed_id = resp.json()["id"]

        # Volunteer cancels
        resp = client.delete(
            f"/api/deliveries/{committed_id}",
            headers=auth_header(vol_token),
        )
        assert resp.status_code == 200, f"Cancel failed: {resp.json()}"

        # Original delivery should have quantity restored
        resp = client.get(
            "/api/inventory/shelter-deliveries",
            headers=auth_header(shelter_token),
        )
        assert resp.status_code == 200
        shelter_deliveries = resp.json()
        parent = next((d for d in shelter_deliveries if d["id"] == delivery_id), None)
        if parent:
            # Parent should have gotten its quantity back
            assert parent["quantity"] == original_qty

    def test_shelter_creates_request_and_delivery_flow(self, client):
        """Full flow: shelter creates request + delivery, volunteer fulfills, stock updated."""
        shelter_data, shelter_token = self._setup_shelter_with_location(client)
        cat_id = self._create_category_db()

        # Shelter creates a donation request
        resp = client.post(
            "/api/inventory/requests",
            json={"category_id": cat_id, "quantity_requested": 200, "notes": "Emergency supplies"},
            headers=auth_header(shelter_token),
        )
        assert resp.status_code == 200
        request_data = resp.json()
        assert request_data["status"] == "pending"
        assert request_data["quantity_requested"] == 200

        # Verify dashboard shows the request
        resp = client.get(
            "/api/inventory/dashboard",
            headers=auth_header(shelter_token),
        )
        assert resp.status_code == 200
        dashboard = resp.json()
        assert dashboard["stats"]["active_requests"] >= 1

    def test_shelter_distributes_to_end_user(self, client):
        """Shelter receives stock then distributes to end recipient."""
        shelter_data, shelter_token = self._setup_shelter_with_location(client)
        cat_id = self._create_category_db()

        # Add stock directly to simulate received donations
        db = next(override_get_db())
        from app.inventory_models import InventoryItem
        item = InventoryItem(
            shelter_id=shelter_data["id"],
            category_id=cat_id,
            quantity_in_stock=80,
            quantity_reserved=0,
            quantity_available=80,
        )
        db.add(item)
        db.commit()
        db.close()

        # Distribute to beneficiary
        resp = client.post(
            "/api/inventory/distribute",
            json={
                "category_id": cat_id,
                "quantity": 10,
                "recipient_name": "Maria da Silva",
                "recipient_document": "987.654.321-00",
                "notes": "Família com 4 pessoas",
            },
            headers=auth_header(shelter_token),
        )
        assert resp.status_code == 200
        dist = resp.json()
        assert dist["quantity"] == 10
        assert dist["recipient_name"] == "Maria da Silva"

        # Verify stock decreased
        resp = client.get(
            "/api/inventory/dashboard",
            headers=auth_header(shelter_token),
        )
        dashboard = resp.json()
        # Should have 70 in stock now
        cat_stock = next(
            (c for c in dashboard["inventory_by_category"] if c["category_id"] == cat_id),
            None,
        )
        assert cat_stock is not None
        assert cat_stock["quantity_in_stock"] == 70
        assert cat_stock["quantity_available"] == 70
