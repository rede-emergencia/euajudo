"""
Comprehensive tests for MVP features
Tests all core backend functionality
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.auth import get_password_hash
from app.models import User, DeliveryLocation, ProductBatch, Delivery, ResourceRequest, ResourceItem
from app.shared.enums import ProductType, BatchStatus, DeliveryStatus, OrderStatus, UserRole
from sqlalchemy import text

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_mvp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client():
    """Create test client with fresh database"""
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    from app.application.services.pickup_service import PickupCodeModel
    PickupCodeModel.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)
    PickupCodeModel.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
def auth_headers(client):
    """Get auth headers for testing"""
    # Register provider
    resp = client.post("/api/auth/register", json={
        "email": "p1@j.com",
        "password": "123456",
        "name": "Provider Test",
        "roles": "provider",
        "city_id": "juiz-de-fora"
    })
    provider_id = resp.json()["id"]
    
    # Register volunteer
    resp = client.post("/api/auth/register", json={
        "email": "v1@j.com",
        "password": "123456",
        "name": "Volunteer Test",
        "roles": "volunteer",
        "city_id": "juiz-de-fora"
    })
    volunteer_id = resp.json()["id"]
    
    # Approve users directly in database
    db = TestingSessionLocal()
    try:
        provider = db.query(User).filter(User.id == provider_id).first()
        volunteer = db.query(User).filter(User.id == volunteer_id).first()
        provider.approved = True
        volunteer.approved = True
        db.commit()
    finally:
        db.close()
    
    # Login as provider
    response = client.post("/api/auth/login", data={
        "username": "p1@j.com",
        "password": "123456"
    })
    provider_token = response.json()["access_token"]
    
    # Login as volunteer
    response = client.post("/api/auth/login", data={
        "username": "v1@j.com",
        "password": "123456"
    })
    volunteer_token = response.json()["access_token"]
    
    return {
        "provider": {"Authorization": f"Bearer {provider_token}"},
        "volunteer": {"Authorization": f"Bearer {volunteer_token}"}
    }


class TestAuthentication:
    """Test authentication MVP features"""
    
    def test_register_user(self, client):
        """User can register"""
        response = client.post("/api/auth/register", json={
            "email": "test@j.com",
            "password": "123456",
            "name": "Test User",
            "roles": "provider",
            "city_id": "juiz-de-fora"
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["email"] == "test@j.com"
        assert "id" in data
    
    def test_login_user(self, client, auth_headers):
        """User can login"""
        response = client.post("/api/auth/login", data={
            "username": "p1@j.com",
            "password": "123456"
        })
        assert response.status_code in [200, 201]
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client):
        """Wrong password returns error"""
        # Register first
        client.post("/api/auth/register", json={
            "email": "wrong@j.com",
            "password": "123456",
            "name": "Wrong User",
            "roles": "provider"
        })
        
        # Try wrong password
        response = client.post("/api/auth/login", data={
            "username": "wrong@j.com",
            "password": "wrong"
        })
        assert response.status_code == 401


class TestProductBatches:
    """Test Product Batch MVP features"""
    
    def test_create_batch(self, client, auth_headers):
        """Provider can create product batch"""
        response = client.post("/api/batches/", 
            headers=auth_headers["provider"],
            json={
                "product_type": "meal",
                "quantity": 50,
                "description": "Test meals",
                "donated_ingredients": True,
                "pickup_deadline": "18:00"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["product_type"] == "meal"
        assert data["quantity"] == 50
        assert data["status"] == "producing"
    
    def test_mark_batch_ready(self, client, auth_headers):
        """Provider can mark batch as ready"""
        # Create batch
        response = client.post("/api/batches/", 
            headers=auth_headers["provider"],
            json={
                "product_type": "meal",
                "quantity": 50,
                "description": "Test meals"
            }
        )
        batch_id = response.json()["id"]
        
        # Mark as ready
        response = client.post(f"/api/batches/{batch_id}/mark-ready",
            headers=auth_headers["provider"]
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["status"] == "ready"
        assert data["ready_at"] is not None
    
    def test_list_ready_batches(self, client, auth_headers):
        """Can list ready batches"""
        # Create and mark ready
        response = client.post("/api/batches/", 
            headers=auth_headers["provider"],
            json={
                "product_type": "meal",
                "quantity": 50,
                "description": "Ready meals"
            }
        )
        batch_id = response.json()["id"]
        
        client.post(f"/api/batches/{batch_id}/mark-ready",
            headers=auth_headers["provider"]
        )
        
        # List ready batches
        response = client.get("/api/batches/ready")
        assert response.status_code in [200, 201]
        data = response.json()
        assert len(data) > 0
        assert data[0]["status"] == "ready"


class TestDeliveries:
    """Test Delivery MVP features"""
    
    def test_create_delivery(self, client, auth_headers):
        """Volunteer can reserve a delivery"""
        # Setup: Create location directly in the same DB used by API
        db = TestingSessionLocal()
        try:
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
        finally:
            db.close()
        
        # Setup: Create and ready batch
        response = client.post("/api/batches/", 
            headers=auth_headers["provider"],
            json={
                "product_type": "meal",
                "quantity": 50,
                "description": "Test meals"
            }
        )
        batch_id = response.json()["id"]
        
        client.post(f"/api/batches/{batch_id}/mark-ready",
            headers=auth_headers["provider"]
        )
        
        # Create delivery
        response = client.post("/api/deliveries/",
            headers=auth_headers["volunteer"],
            json={
                "batch_id": batch_id,
                "location_id": location.id,
                "quantity": 20
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "reserved"
        assert data["pickup_code"] is not None
    
    def test_confirm_pickup(self, client, auth_headers):
        """Volunteer can confirm pickup"""
        # Setup: Create location, batch, delivery
        db = TestingSessionLocal()
        try:
            location = DeliveryLocation(name="Test", address="Test", city_id="test", active=True, approved=True)
            db.add(location)
            db.commit()
            db.refresh(location)
        finally:
            db.close()
        
        response = client.post("/api/batches/", 
            headers=auth_headers["provider"],
            json={"product_type": "meal", "quantity": 50}
        )
        batch_id = response.json()["id"]
        client.post(f"/api/batches/{batch_id}/mark-ready",
            headers=auth_headers["provider"]
        )
        
        response = client.post("/api/deliveries/",
            headers=auth_headers["volunteer"],
            json={"batch_id": batch_id, "location_id": location.id, "quantity": 20}
        )
        delivery_id = response.json()["id"]
        pickup_code = response.json()["pickup_code"]
        
        # Confirm pickup
        response = client.post(f"/api/deliveries/{delivery_id}/confirm-pickup",
            headers=auth_headers["volunteer"],
            json={"pickup_code": pickup_code}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["status"] == "picked_up"
        assert data["delivery_code"] is not None


class TestResources:
    """Test Resource Request MVP features"""
    
    def test_create_resource_request(self, client, auth_headers):
        """Provider can create resource request"""
        response = client.post("/api/resources/requests",
            headers=auth_headers["provider"],
            json={
                "quantity_meals": 100,
                "items": [
                    {"name": "Arroz", "quantity": 5, "unit": "kg"},
                    {"name": "Feijão", "quantity": 3, "unit": "kg"}
                ]
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["quantity_meals"] == 100
        assert data["status"] == "requesting"
        assert len(data["items"]) == 2


class TestLocations:
    """Test Location MVP features"""
    
    def test_create_location(self, client, auth_headers):
        """Admin can create location"""
        # Create admin user
        db = TestingSessionLocal()
        try:
            db.execute(text("""
                INSERT INTO users (email, hashed_password, name, roles, city_id, approved, active)
                VALUES ('adm@test.com', :pwd, 'Admin', 'admin', 'test', 1, 1)
            """), {"pwd": get_password_hash("123456")})
            db.commit()
        finally:
            db.close()
        
        # Login as admin
        response = client.post("/api/auth/login", data={
            "username": "adm@test.com",
            "password": "123456"
        })
        admin_token = response.json()["access_token"]
        
        # Create location
        response = client.post("/api/locations/",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "New Location",
                "address": "New Address",
                "city_id": "juiz-de-fora",
                "capacity": 100
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Location"


class TestValidators:
    """Test Validator MVP features"""
    
    def test_product_validators(self):
        """Product validators work correctly"""
        from app.shared.validators import ValidatorFactory, MealValidator, IngredientValidator
        
        meal_validator = ValidatorFactory.get_validator(ProductType.MEAL)
        assert isinstance(meal_validator, MealValidator)
        assert meal_validator.validate_quantity(50) == True
        assert meal_validator.validate_quantity(0) == False
        
        ingredient_validator = ValidatorFactory.get_validator(ProductType.INGREDIENT)
        assert isinstance(ingredient_validator, IngredientValidator)
    
    def test_confirmation_code_validator(self):
        """Confirmation code validator works"""
        from app.shared.validators import ConfirmationCodeValidator
        
        # Valid code
        assert ConfirmationCodeValidator.validate_code("123456") == True
        
        # Invalid codes
        assert ConfirmationCodeValidator.validate_code("12345") == False  # Too short
        assert ConfirmationCodeValidator.validate_code("1234567") == False  # Too long
        assert ConfirmationCodeValidator.validate_code("abcdef") == False  # Not digits
        assert ConfirmationCodeValidator.validate_code("") == False  # Empty
        
        # Generate code
        code = ConfirmationCodeValidator.generate_code()
        assert len(code) == 6
        assert code.isdigit()


class TestStatusTransitions:
    """Test Status Transition MVP features"""
    
    def test_delivery_status_transitions(self):
        """Delivery status transitions are validated"""
        from app.shared.validators import StatusTransitionValidator
        from app.shared.enums import DeliveryStatus
        
        # Valid transitions
        assert StatusTransitionValidator.can_transition(
            DeliveryStatus.AVAILABLE, DeliveryStatus.RESERVED, "delivery"
        ) == True
        
        assert StatusTransitionValidator.can_transition(
            DeliveryStatus.RESERVED, DeliveryStatus.PICKED_UP, "delivery"
        ) == True
        
        # Invalid transitions
        assert StatusTransitionValidator.can_transition(
            DeliveryStatus.AVAILABLE, DeliveryStatus.DELIVERED, "delivery"
        ) == False
        
        assert StatusTransitionValidator.can_transition(
            DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED, "delivery"
        ) == False  # Final state


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
