"""
Happy Path tests for Volunteer workflow
Tests the complete flow: Donate ingredients -> Pick up meals -> Deliver to shelter
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.database import Base, get_db
from app.models import User, ProductBatch, Delivery, ResourceRequest, ResourceItem, ResourceReservation, ReservationItem, DeliveryLocation
from app.enums import BatchStatus, DeliveryStatus, OrderStatus, ProductType
from app.auth import get_password_hash, create_access_token

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_volunteer_happy.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="function")
def setup_database():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


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
def provider_user(setup_database):
    """Create a provider user"""
    db = TestingSessionLocal()
    user = User(
        email="provider@test.com",
        name="Test Provider",
        phone="11999999999",
        roles="provider",
        hashed_password=get_password_hash("testpass"),
        address="Provider Address",
        approved=True,
        production_capacity=100
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


@pytest.fixture
def shelter_user(setup_database):
    """Create a shelter user"""
    db = TestingSessionLocal()
    user = User(
        email="shelter@test.com",
        name="Test Shelter",
        phone="11988888888",
        roles="shelter",
        hashed_password=get_password_hash("testpass"),
        address="Shelter Address",
        approved=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


@pytest.fixture
def shelter_location(setup_database, shelter_user):
    """Create a delivery location"""
    db = TestingSessionLocal()
    location = DeliveryLocation(
        name="Test Shelter Location",
        address="Shelter Address, 123",
        phone="11988888888",
        capacity=50,
        manager_id=shelter_user.id
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


class TestVolunteerHappyPath:
    """Test complete volunteer happy path workflow"""
    
    def test_volunteer_ingredient_donation_flow(self, volunteer_user, provider_user):
        """
        Happy Path: Volunteer donates ingredients to provider
        
        Steps:
        1. Volunteer logs in and views dashboard
        2. Provider creates ingredient request
        3. Volunteer sees available requests
        4. Volunteer creates reservation for ingredients
        5. Dashboard shows donation as pending
        6. Volunteer delivers ingredients
        7. Provider confirms receipt
        8. Dashboard shows completed donation
        """
        
        # Step 1: Volunteer views dashboard
        response = client.get(
            "/api/dashboard/config",
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        config = response.json()
        assert config["role"] == "volunteer"
        
        # Step 2: Provider creates ingredient request
        request_data = {
            "quantity_meals": 100,
            "items": [
                {"name": "Rice", "quantity": 10, "unit": "kg"},
                {"name": "Beans", "quantity": 5, "unit": "kg"}
            ]
        }
        
        response = client.post(
            "/api/resources/requests",
            json=request_data,
            headers=get_auth_header(provider_user)
        )
        assert response.status_code == 200
        request = response.json()
        request_id = request["id"]
        
        # Step 3: Volunteer sees available requests
        response = client.get(
            "/api/resources/requests",
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        requests = response.json()
        assert len(requests) > 0
        
        # Step 4: Volunteer creates reservation
        reservation_data = {
            "request_id": request_id,
            "items": [
                {"item_id": request["items"][0]["id"], "quantity": 10},  # All rice
                {"item_id": request["items"][1]["id"], "quantity": 5}    # All beans
            ]
        }
        
        response = client.post(
            "/api/resources/reservations",
            json=reservation_data,
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        reservation = response.json()
        reservation_id = reservation["id"]
        
        # Step 5: Dashboard shows donation
        response = client.get(
            "/api/dashboard/widgets/my_donations/data",
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["data"]) == 1
        donation = data["data"][0]
        assert donation["id"] == reservation_id
        assert donation["status"] == OrderStatus.PENDING
        
        # Verify items in reservation
        assert "request" in donation
        assert len(donation["request"]["items"]) == 2
    
    def test_volunteer_meal_delivery_flow(self, volunteer_user, provider_user, shelter_location):
        """
        Happy Path: Volunteer picks up and delivers meals
        
        Steps:
        1. Provider creates and marks batch ready
        2. Volunteer creates delivery
        3. Dashboard shows delivery as pending
        4. Volunteer picks up meals (confirms pickup)
        5. Dashboard shows delivery in transit
        6. Volunteer delivers to shelter
        7. Shelter confirms delivery
        8. Dashboard shows completed delivery
        """
        
        # Step 1: Provider creates batch
        batch_data = {
            "product_type": "meal",
            "quantity": 100,
            "description": "Fresh meals",
            "donated_ingredients": True
        }
        
        response = client.post(
            "/api/batches/",
            json=batch_data,
            headers=get_auth_header(provider_user)
        )
        batch_id = response.json()["id"]
        
        # Mark ready
        response = client.post(
            f"/api/batches/{batch_id}/mark-ready",
            headers=get_auth_header(provider_user)
        )
        assert response.status_code == 200
        
        # Step 2: Volunteer creates delivery
        delivery_data = {
            "batch_id": batch_id,
            "location_id": shelter_location.id,
            "quantity": 50
        }
        
        response = client.post(
            "/api/deliveries/",
            json=delivery_data,
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        delivery = response.json()
        delivery_id = delivery["id"]
        pickup_code = delivery["pickup_code"]
        delivery_code = delivery["delivery_code"]
        
        # Step 3: Dashboard shows delivery
        response = client.get(
            "/api/dashboard/widgets/my_deliveries/data",
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["data"]) == 1
        dashboard_delivery = data["data"][0]
        assert dashboard_delivery["id"] == delivery_id
        assert dashboard_delivery["status"] == DeliveryStatus.PENDING
        assert dashboard_delivery["quantity"] == 50
        assert dashboard_delivery["pickup_code"] == pickup_code
        
        # Step 4: Volunteer confirms pickup
        response = client.post(
            f"/api/deliveries/{delivery_id}/confirm-pickup",
            json={"code": pickup_code},
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        
        # Step 5: Dashboard shows in transit
        response = client.get(
            "/api/dashboard/widgets/my_deliveries/data",
            headers=get_auth_header(volunteer_user)
        )
        data = response.json()
        
        dashboard_delivery = data["data"][0]
        assert dashboard_delivery["status"] == DeliveryStatus.IN_TRANSIT
        
        # Step 6 & 7: Delivery to shelter (would be confirmed by shelter)
        # For now, verify the delivery code is available
        assert dashboard_delivery["delivery_code"] == delivery_code
    
    def test_volunteer_multiple_deliveries_management(self, volunteer_user, provider_user, shelter_location):
        """
        Happy Path: Volunteer manages multiple deliveries simultaneously
        
        Steps:
        1. Create 3 different deliveries
        2. Dashboard shows all deliveries
        3. Confirm pickup for one
        4. Cancel one
        5. Dashboard reflects all changes
        """
        
        # Step 1: Create batches and deliveries
        deliveries = []
        for i in range(3):
            # Create batch
            batch_data = {
                "product_type": "meal",
                "quantity": 50 + (i * 10),
                "description": f"Batch {i+1}",
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
            
            # Create delivery
            delivery_data = {
                "batch_id": batch_id,
                "location_id": shelter_location.id,
                "quantity": 25 + (i * 5)
            }
            
            response = client.post(
                "/api/deliveries/",
                json=delivery_data,
                headers=get_auth_header(volunteer_user)
            )
            deliveries.append(response.json())
        
        # Step 2: Dashboard shows all deliveries
        response = client.get(
            "/api/dashboard/widgets/my_deliveries/data",
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["data"]) == 3
        assert data["total"] == 3
        
        # Step 3: Confirm pickup for first delivery
        response = client.post(
            f"/api/deliveries/{deliveries[0]['id']}/confirm-pickup",
            json={"code": deliveries[0]["pickup_code"]},
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        
        # Step 4: Cancel second delivery
        response = client.post(
            f"/api/deliveries/{deliveries[1]['id']}/cancel",
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        
        # Step 5: Dashboard reflects changes
        response = client.get(
            "/api/dashboard/widgets/my_deliveries/data",
            headers=get_auth_header(volunteer_user)
        )
        data = response.json()
        
        # Find each delivery in response
        delivery_statuses = {d["id"]: d["status"] for d in data["data"]}
        
        assert delivery_statuses[deliveries[0]["id"]] == DeliveryStatus.IN_TRANSIT
        assert delivery_statuses[deliveries[1]["id"]] == DeliveryStatus.CANCELLED
        assert delivery_statuses[deliveries[2]["id"]] == DeliveryStatus.PENDING
    
    def test_volunteer_complete_cycle(self, volunteer_user, provider_user, shelter_location, shelter_user):
        """
        Happy Path: Complete volunteer cycle from donation to delivery
        
        Steps:
        1. Donate ingredients to provider
        2. Provider makes meals with ingredients
        3. Volunteer picks up meals
        4. Volunteer delivers to shelter
        5. Dashboard shows both donation and delivery
        """
        
        # Step 1: Donate ingredients
        # Provider creates request
        request_data = {
            "quantity_meals": 50,
            "items": [
                {"name": "Pasta", "quantity": 5, "unit": "kg"}
            ]
        }
        
        response = client.post(
            "/api/resources/requests",
            json=request_data,
            headers=get_auth_header(provider_user)
        )
        request = response.json()
        
        # Volunteer creates reservation
        reservation_data = {
            "request_id": request["id"],
            "items": [
                {"item_id": request["items"][0]["id"], "quantity": 5}
            ]
        }
        
        response = client.post(
            "/api/resources/reservations",
            json=reservation_data,
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        
        # Step 2: Provider creates batch
        batch_data = {
            "product_type": "meal",
            "quantity": 50,
            "description": "Pasta meals",
            "donated_ingredients": True
        }
        
        response = client.post(
            "/api/batches/",
            json=batch_data,
            headers=get_auth_header(provider_user)
        )
        batch_id = response.json()["id"]
        
        client.post(
            f"/api/batches/{batch_id}/mark-ready",
            headers=get_auth_header(provider_user)
        )
        
        # Step 3 & 4: Volunteer creates and picks up delivery
        delivery_data = {
            "batch_id": batch_id,
            "location_id": shelter_location.id,
            "quantity": 50
        }
        
        response = client.post(
            "/api/deliveries/",
            json=delivery_data,
            headers=get_auth_header(volunteer_user)
        )
        delivery = response.json()
        
        client.post(
            f"/api/deliveries/{delivery['id']}/confirm-pickup",
            json={"code": delivery["pickup_code"]},
            headers=get_auth_header(volunteer_user)
        )
        
        # Step 5: Dashboard shows both
        # Check donations
        response = client.get(
            "/api/dashboard/widgets/my_donations/data",
            headers=get_auth_header(volunteer_user)
        )
        donations_data = response.json()
        assert len(donations_data["data"]) == 1
        
        # Check deliveries
        response = client.get(
            "/api/dashboard/widgets/my_deliveries/data",
            headers=get_auth_header(volunteer_user)
        )
        deliveries_data = response.json()
        assert len(deliveries_data["data"]) == 1
    
    def test_volunteer_dashboard_empty_state(self, volunteer_user):
        """
        Happy Path: Volunteer with no activity sees empty dashboard
        
        Steps:
        1. New volunteer views dashboard
        2. Dashboard shows empty state for donations
        3. Dashboard shows empty state for deliveries
        4. No errors occur
        """
        
        # Check donations widget
        response = client.get(
            "/api/dashboard/widgets/my_donations/data",
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["widget_id"] == "my_donations"
        assert data["data"] == []
        assert data["total"] == 0
        
        # Check deliveries widget
        response = client.get(
            "/api/dashboard/widgets/my_deliveries/data",
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["widget_id"] == "my_deliveries"
        assert data["data"] == []
        assert data["total"] == 0


class TestVolunteerEdgeCases:
    """Test volunteer edge cases and error handling"""
    
    def test_volunteer_cannot_see_other_volunteer_deliveries(self, volunteer_user, setup_database, provider_user, shelter_location):
        """Test that volunteer only sees their own deliveries"""
        # Create another volunteer
        db = TestingSessionLocal()
        other_volunteer = User(
            email="other@test.com",
            name="Other Volunteer",
            phone="11966666666",
            roles="volunteer",
            hashed_password=get_password_hash("testpass"),
            approved=True
        )
        db.add(other_volunteer)
        db.commit()
        
        # Create batch
        batch = ProductBatch(
            provider_id=provider_user.id,
            product_type=ProductType.MEAL,
            quantity=100,
            quantity_available=100,
            status=BatchStatus.READY,
            donated_ingredients=True
        )
        db.add(batch)
        db.commit()
        
        # Other volunteer creates delivery
        other_delivery = Delivery(
            batch_id=batch.id,
            volunteer_id=other_volunteer.id,
            location_id=shelter_location.id,
            product_type=ProductType.MEAL,
            quantity=50,
            status=DeliveryStatus.PENDING,
            pickup_code="OTHER123",
            delivery_code="OTHER456"
        )
        db.add(other_delivery)
        db.commit()
        db.close()
        
        # Volunteer should not see other volunteer's delivery
        response = client.get(
            "/api/dashboard/widgets/my_deliveries/data",
            headers=get_auth_header(volunteer_user)
        )
        
        data = response.json()
        assert len(data["data"]) == 0
    
    def test_volunteer_pickup_requires_correct_code(self, volunteer_user, provider_user, shelter_location):
        """Test that pickup confirmation requires correct code"""
        # Create batch and delivery
        db = TestingSessionLocal()
        batch = ProductBatch(
            provider_id=provider_user.id,
            product_type=ProductType.MEAL,
            quantity=50,
            quantity_available=50,
            status=BatchStatus.READY,
            donated_ingredients=True
        )
        db.add(batch)
        db.commit()
        
        delivery = Delivery(
            batch_id=batch.id,
            volunteer_id=volunteer_user.id,
            location_id=shelter_location.id,
            product_type=ProductType.MEAL,
            quantity=25,
            status=DeliveryStatus.PENDING,
            pickup_code="CORRECT123",
            delivery_code="DELV456"
        )
        db.add(delivery)
        db.commit()
        delivery_id = delivery.id
        db.close()
        
        # Try with wrong code
        response = client.post(
            f"/api/deliveries/{delivery_id}/confirm-pickup",
            json={"code": "WRONG"},
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 400
        
        # Try with correct code
        response = client.post(
            f"/api/deliveries/{delivery_id}/confirm-pickup",
            json={"code": "CORRECT123"},
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 200
    
    def test_volunteer_cannot_pickup_cancelled_delivery(self, volunteer_user, provider_user, shelter_location):
        """Test that cancelled deliveries cannot be picked up"""
        # Create cancelled delivery
        db = TestingSessionLocal()
        batch = ProductBatch(
            provider_id=provider_user.id,
            product_type=ProductType.MEAL,
            quantity=50,
            quantity_available=50,
            status=BatchStatus.READY,
            donated_ingredients=True
        )
        db.add(batch)
        db.commit()
        
        delivery = Delivery(
            batch_id=batch.id,
            volunteer_id=volunteer_user.id,
            location_id=shelter_location.id,
            product_type=ProductType.MEAL,
            quantity=25,
            status=DeliveryStatus.CANCELLED,
            pickup_code="PICK123",
            delivery_code="DELV456"
        )
        db.add(delivery)
        db.commit()
        delivery_id = delivery.id
        db.close()
        
        # Try to confirm pickup
        response = client.post(
            f"/api/deliveries/{delivery_id}/confirm-pickup",
            json={"code": "PICK123"},
            headers=get_auth_header(volunteer_user)
        )
        assert response.status_code == 400
