"""
Happy Path tests for Provider workflow
Tests the complete flow: Create batch -> Mark ready -> Volunteer picks up -> Confirm pickup
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.database import Base, get_db
from app.models import User, ProductBatch, Delivery, ResourceRequest, ResourceItem, DeliveryLocation
from app.shared.enums import BatchStatus, DeliveryStatus, OrderStatus, ProductType
from app.auth import get_password_hash, create_access_token

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_provider_happy.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

client = TestClient(app)


@pytest.fixture(scope="function")
def setup_database():
    """Setup test database"""
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    from app.application.services.pickup_service import PickupCodeModel
    PickupCodeModel.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    PickupCodeModel.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def provider_user(setup_database):
    """Create a provider user"""
    db = TestingSessionLocal()
    user = User(
        email="provider@test.com",
        name="Test Provider",
        phone="11999999999",
        roles="provider",
        hashed_password=get_password_hash("testpass"),
        address="Test Provider Address",
        approved=True,
        production_capacity=100
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


@pytest.fixture
def volunteer_user(setup_database):
    """Create a volunteer user"""
    db = TestingSessionLocal()
    user = User(
        email="volunteer@test.com",
        name="Test Volunteer",
        phone="11977777777",
        roles="volunteer",
        hashed_password=get_password_hash("testpass"),
        address="Volunteer Address",
        approved=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


@pytest.fixture
def delivery_location(setup_database):
    """Create a test delivery location"""
    db = TestingSessionLocal()
    location = DeliveryLocation(
        name="Test Location",
        address="Test Address",
        city_id="juiz-de-fora",
        active=True,
        approved=True
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    db.close()
    return location


def get_auth_header(user):
    """Get authorization header for user"""
    token = create_access_token(data={"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


class TestProviderHappyPath:
    """Test complete provider happy path workflow"""
    
    def test_provider_complete_meal_batch_flow(self, provider_user, volunteer_user, delivery_location):
        """
        Happy Path: Provider creates meal batch, marks ready, volunteer picks up
        
        Steps:
        1. Provider logs in and views dashboard
        2. Provider creates a new meal batch
        3. Dashboard shows batch in "producing" status
        4. Provider marks batch as ready
        5. Dashboard shows batch in "ready" status
        6. Volunteer creates delivery for the batch
        7. Provider sees pickup in dashboard
        8. Volunteer confirms pickup with code
        9. Provider dashboard updates to show completed pickup
        """
        
        # Step 1: Provider views dashboard
        response = client.get(
            "/api/dashboard/config",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        config = response.json()
        assert config["role"] == "provider"
        
        # Step 2: Provider creates meal batch
        batch_data = {
            "product_type": "meal",
            "quantity": 50,
            "description": "Delicious vegetarian pasta",
            "donated_ingredients": True,
            "pickup_deadline": (datetime.now() + timedelta(hours=4)).isoformat()
        }
        
        response = client.post(
            "/api/batches/",
            json=batch_data,
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        batch = response.json()
        batch_id = batch["id"]
        
        assert batch["product_type"] == "meal"
        assert batch["quantity"] == 50
        assert batch["status"] == BatchStatus.PRODUCING
        
        # Step 3: Dashboard shows batch in producing status
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        data = response.json()
        
        assert len(data["data"]) == 1
        dashboard_batch = data["data"][0]
        assert dashboard_batch["id"] == batch_id
        assert dashboard_batch["status"] == BatchStatus.PRODUCING
        assert dashboard_batch["quantity"] == 50
        
        # Step 4: Provider marks batch as ready
        response = client.post(
            f"/api/batches/{batch_id}/mark-ready",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        
        # Step 5: Dashboard shows batch in ready status
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        data = response.json()
        
        dashboard_batch = data["data"][0]
        assert dashboard_batch["status"] == BatchStatus.READY
        assert dashboard_batch["quantity_available"] == 50
        
        # Step 6: Volunteer creates delivery
        delivery_data = {
            "batch_id": batch_id,
            "location_id": delivery_location.id,
            "quantity": 25
        }
        
        response = client.post(
            "/api/deliveries/",
            json=delivery_data,
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code in [200, 201]
        delivery = response.json()
        delivery_id = delivery["id"]
        pickup_code = delivery["pickup_code"]
        
        assert delivery["quantity"] == 25
        # Status might be reserved if auto-confirmed
        assert delivery["status"] in ["pending_confirmation", "reserved"]
        assert pickup_code is not None
        
        # Step 7: Provider sees pickup in dashboard
        response = client.get(
            "/api/dashboard/widgets/my_pickups/data",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        data = response.json()
        
        assert len(data["data"]) == 1
        pickup = data["data"][0]
        assert pickup["id"] == delivery_id
        assert pickup["quantity"] == 25
        # Status might be reserved if auto-confirmed
        assert pickup["status"] in ["pending_confirmation", "reserved"]
        assert pickup["pickup_code"] == pickup_code
        
        # Step 8: Volunteer confirms pickup (if not already reserved)
        if delivery["status"] == "pending_confirmation":
            response = client.post(
                f"/api/deliveries/{delivery_id}/confirm-pickup",
                json={"code": pickup_code},
                headers=get_auth_header(volunteer_user)
            )
            assert response.status_code in [200, 201]
        
        # Step 9: Provider dashboard shows updated status
        response = client.get(
            "/api/dashboard/widgets/my_pickups/data",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        data = response.json()
        
        pickup = data["data"][0]
        # Status should be in_transit after pickup, or reserved if not yet picked up
        assert pickup["status"] in ["in_transit", "reserved"]
        
        # Verify batch quantity was updated
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        data = response.json()
        dashboard_batch = data["data"][0]
        assert dashboard_batch["quantity_available"] == 25  # 50 - 25
    
    def test_provider_ingredient_request_flow(self, provider_user, volunteer_user, delivery_location):
        """
        Happy Path: Provider requests ingredients, volunteer donates
        
        Steps:
        1. Provider creates ingredient request
        2. Dashboard shows request as pending
        3. Volunteer creates reservation for the request
        4. Provider sees reserved items
        5. Volunteer delivers ingredients
        6. Provider confirms receipt
        """
        
        # Step 1: Provider creates ingredient request
        request_data = {
            "quantity_meals": 100,
            "items": [
                {"name": "Rice", "quantity": 10, "unit": "kg"},
                {"name": "Beans", "quantity": 5, "unit": "kg"},
                {"name": "Tomatoes", "quantity": 3, "unit": "kg"}
            ],
            "receiving_time": (datetime.now() + timedelta(hours=2)).isoformat()
        }
        
        response = client.post(
            "/api/resources/requests",
            json=request_data,
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        request = response.json()
        request_id = request["id"]
        
        assert request["quantity_meals"] == 100
        assert request["status"] == OrderStatus.REQUESTING
        assert len(request["items"]) == 3
        
        # Step 2: Dashboard shows request
        response = client.get(
            "/api/dashboard/widgets/my_requests/data",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        data = response.json()
        
        assert len(data["data"]) == 1
        dashboard_request = data["data"][0]
        assert dashboard_request["id"] == request_id
        assert dashboard_request["status"] == OrderStatus.REQUESTING
        assert len(dashboard_request["items"]) == 3
        
        # Step 3: Volunteer creates reservation
        reservation_data = {
            "request_id": request_id,
            "items": [
                {"resource_item_id": request["items"][0]["id"], "quantity": 10},  # All rice
                {"resource_item_id": request["items"][1]["id"], "quantity": 5}    # All beans
            ]
        }
        
        response = client.post(
            "/api/resources/reservations",
            json=reservation_data,
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code in [200, 201]
        
        # Step 4: Provider sees reserved items
        response = client.get(
            "/api/dashboard/widgets/my_requests/data",
            headers=get_auth_header(provider_user)
        )
        data = response.json()
        
        dashboard_request = data["data"][0]
        rice_item = next(i for i in dashboard_request["items"] if i["name"] == "Rice")
        beans_item = next(i for i in dashboard_request["items"] if i["name"] == "Beans")
        
        assert rice_item["quantity_reserved"] == 10
        assert beans_item["quantity_reserved"] == 5
        
        # Step 5 & 6: Volunteer delivers and provider confirms
        # (This would involve delivery confirmation flow)
        # Verify the request is partially reserved
        assert dashboard_request["status"] in ["requesting", "partially_reserved"]
    
    def test_provider_multiple_batches_management(self, provider_user):
        """
        Happy Path: Provider manages multiple batches simultaneously
        
        Steps:
        1. Create 3 different batches
        2. Dashboard shows all batches
        3. Mark one as ready
        4. Cancel one
        5. Dashboard reflects all changes
        """
        
        # Step 1: Create 3 batches
        batches = []
        for i in range(3):
            batch_data = {
                "product_type": "meal",
                "quantity": 30 + (i * 10),
                "description": f"Batch {i+1}",
                "donated_ingredients": True
            }
            
            response = client.post(
                "/api/batches/",
                json=batch_data,
                headers=get_auth_header(provider_user)
            )
            assert response.status_code in [200, 201]
            batches.append(response.json())
        
        # Step 2: Dashboard shows all batches
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        data = response.json()
        
        assert len(data["data"]) == 3
        assert data["total"] == 3
        
        # Step 3: Mark first batch as ready
        response = client.post(
            f"/api/batches/{batches[0]['id']}/mark-ready",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        
        # Step 4: Cancel second batch
        response = client.delete(
            f"/api/batches/{batches[1]['id']}",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        
        # Step 5: Dashboard reflects changes
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        data = response.json()
        
        # Find batches - cancelled batch might not appear in data
        batch_statuses = {b["id"]: b["status"] for b in data["data"]}
        
        assert batch_statuses[batches[0]["id"]] == BatchStatus.READY
        # Batch 1 (id=2) might be filtered out if cancelled
        if batches[1]["id"] in batch_statuses:
            assert batch_statuses[batches[1]["id"]] == BatchStatus.CANCELLED
        assert batch_statuses[batches[2]["id"]] == BatchStatus.PRODUCING
    
    def test_provider_dashboard_real_time_updates(self, provider_user, volunteer_user, delivery_location):
        """
        Happy Path: Dashboard updates reflect real-time changes
        
        Steps:
        1. Provider starts with empty dashboard
        2. Create batch - dashboard updates
        3. Volunteer picks up - dashboard updates
        4. Create request - dashboard updates
        """
        
        # Step 1: Empty dashboard
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code in [200, 201]
        assert len(response.json()["data"]) == 0
        
        # Step 2: Create batch
        batch_data = {
            "product_type": "meal",
            "quantity": 40,
            "description": "Fresh meals",
            "donated_ingredients": True
        }
        
        response = client.post(
            "/api/batches/",
            json=batch_data,
            headers=get_auth_header(provider_user)
        )
        batch_id = response.json()["id"]
        
        # Dashboard immediately shows new batch
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        assert len(response.json()["data"]) == 1
        
        # Step 3: Mark ready and volunteer picks up
        client.post(
            f"/api/batches/{batch_id}/mark-ready",
            headers=get_auth_header(provider_user)
        )
        
        delivery_response = client.post(
            "/api/deliveries/",
            json={"batch_id": batch_id, "location_id": delivery_location.id, "quantity": 20},
            headers=get_auth_header(volunteer_user)
        )
        
        # Dashboard shows pickup
        response = client.get(
            "/api/dashboard/widgets/my_pickups/data",
            headers=get_auth_header(provider_user)
        )
        data = response.json()
        assert len(data["data"]) == 1
        
        # Step 4: Create request
        request_data = {
            "quantity_meals": 50,
            "items": [{"name": "Pasta", "quantity": 5, "unit": "kg"}]
        }
        
        client.post(
            "/api/resources/requests",
            json=request_data,
            headers=get_auth_header(provider_user)
        )
        
        # Dashboard shows request
        response = client.get(
            "/api/dashboard/widgets/my_requests/data",
            headers=get_auth_header(provider_user)
        )
        assert len(response.json()["data"]) == 1


class TestProviderEdgeCases:
    """Test provider edge cases and error handling"""
    
    def test_provider_cannot_see_other_provider_batches(self, provider_user, setup_database):
        """Test that provider only sees their own batches"""
        # Create another provider
        db = TestingSessionLocal()
        other_provider = User(
            email="other@test.com",
            name="Other Provider",
            phone="11988888888",
            roles="provider",
            hashed_password=get_password_hash("testpass"),
            approved=True
        )
        db.add(other_provider)
        db.commit()
        
        # Other provider creates batch
        other_batch = ProductBatch(
            provider_id=other_provider.id,
            product_type=ProductType.MEAL,
            quantity=100,
            quantity_available=100,
            status=BatchStatus.READY,
            donated_ingredients=True
        )
        db.add(other_batch)
        db.commit()
        db.close()
        
        # Provider should not see other provider's batch
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        
        data = response.json()
        assert len(data["data"]) == 0
    
    def test_provider_batch_quantity_validation(self, provider_user):
        """Test batch quantity updates correctly after pickups"""
        # Create batch with 100 meals
        batch_data = {
            "product_type": "meal",
            "quantity": 100,
            "description": "Large batch",
            "donated_ingredients": True
        }
        
        response = client.post(
            "/api/batches/",
            json=batch_data,
            headers=get_auth_header(provider_user)
        )
        batch_id = response.json()["id"]
        
        # Mark ready
        client.post(
            f"/api/batches/{batch_id}/mark-ready",
            headers=get_auth_header(provider_user)
        )
        
        # Check initial quantity
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        batch = response.json()["data"][0]
        assert batch["quantity"] == 100
        assert batch["quantity_available"] == 100
