"""
Basic Unit Tests for MVP - Simplified version without pytest-asyncio issues
"""
import sys
import os
import time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup test database
from app.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

def setup_module():
    """Setup before all tests"""
    Base.metadata.create_all(bind=engine)
    print("\n✅ Test database created")

def teardown_module():
    """Cleanup after all tests"""
    Base.metadata.drop_all(bind=engine)
    print("\n✅ Test database cleaned")


class TestBasic:
    """Basic functionality tests"""
    
    def test_health_check(self):
        """API health check works"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health check passed")
    
    def test_root_endpoint(self):
        """Root endpoint returns API info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert data["version"] == "2.0.0"
        print("✅ Root endpoint passed")


class TestAuth:
    """Authentication tests"""
    
    def test_register_provider(self):
        """Can register a provider"""
        email = f"p{time.time()}@test.com"
        response = client.post("/api/auth/register", json={
            "email": email,
            "password": "123456",
            "name": "Provider Test",
            "roles": "provider",
            "city_id": "juiz-de-fora"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == email
        assert "id" in data
        print("✅ Provider registration passed")
    
    def test_register_volunteer(self):
        """Can register a volunteer"""
        email = f"v{time.time()}@test.com"
        response = client.post("/api/auth/register", json={
            "email": email,
            "password": "123456",
            "name": "Volunteer Test",
            "roles": "volunteer",
            "city_id": "juiz-de-fora"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == email
        print("✅ Volunteer registration passed")
    
    def test_login(self):
        """Can login with registered user"""
        # First register
        email = f"login{time.time()}@test.com"
        client.post("/api/auth/register", json={
            "email": email,
            "password": "123456",
            "name": "Login Test",
            "roles": "provider"
        })
        
        # Then login
        response = client.post("/api/auth/login", data={
            "username": email,
            "password": "123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print("✅ Login passed")
    
    def test_wrong_password(self):
        """Wrong password returns 401"""
        # Register
        client.post("/api/auth/register", json={
            "email": "wrong@test.com",
            "password": "123456",
            "name": "Wrong Test",
            "roles": "provider"
        })
        
        # Try wrong password
        response = client.post("/api/auth/login", data={
            "username": "wrong@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✅ Wrong password test passed")


class TestProductTypes:
    """Product type endpoint tests"""
    
    def test_list_product_types(self):
        """Can list product types"""
        response = client.get("/api/product-types")
        assert response.status_code == 200
        data = response.json()
        assert "product_types" in data
        assert "meal" in data["product_types"]
        assert "ingredient" in data["product_types"]
        print("✅ Product types endpoint passed")
    
    def test_list_status_types(self):
        """Can list status types"""
        response = client.get("/api/status-types")
        assert response.status_code == 200
        data = response.json()
        assert "order_status" in data
        assert "delivery_status" in data
        assert "batch_status" in data
        print("✅ Status types endpoint passed")


class TestValidators:
    """Validator tests - no API needed"""
    
    def test_meal_validator(self):
        """Meal validator works"""
        from app.validators import ValidatorFactory
        from app.enums import ProductType
        
        validator = ValidatorFactory.get_validator(ProductType.MEAL)
        assert validator.validate_quantity(50) == True
        assert validator.validate_quantity(0) == False
        assert validator.validate_quantity(-1) == False
        print("✅ Meal validator passed")
    
    def test_confirmation_code(self):
        """Confirmation code validator works"""
        from app.validators import ConfirmationCodeValidator
        
        # Valid code
        assert ConfirmationCodeValidator.validate_code("123456") == True
        
        # Invalid codes
        assert ConfirmationCodeValidator.validate_code("12345") == False   # Too short
        assert ConfirmationCodeValidator.validate_code("1234567") == False # Too long
        assert ConfirmationCodeValidator.validate_code("abcdef") == False # Not digits
        
        # Generate code
        code = ConfirmationCodeValidator.generate_code()
        assert len(code) == 6
        assert code.isdigit()
        print("✅ Confirmation code validator passed")


class TestStatusTransitions:
    """Status transition tests"""
    
    def test_delivery_transitions(self):
        """Delivery status transitions validated"""
        from app.validators import StatusTransitionValidator
        from app.enums import DeliveryStatus
        
        # Valid: AVAILABLE -> RESERVED
        assert StatusTransitionValidator.can_transition(
            DeliveryStatus.AVAILABLE, DeliveryStatus.RESERVED, "delivery"
        ) == True
        
        # Valid: RESERVED -> PICKED_UP
        assert StatusTransitionValidator.can_transition(
            DeliveryStatus.RESERVED, DeliveryStatus.PICKED_UP, "delivery"
        ) == True
        
        # Invalid: AVAILABLE -> DELIVERED (must go through steps)
        assert StatusTransitionValidator.can_transition(
            DeliveryStatus.AVAILABLE, DeliveryStatus.DELIVERED, "delivery"
        ) == False
        
        # Invalid: DELIVERED -> anything (final state)
        assert StatusTransitionValidator.can_transition(
            DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED, "delivery"
        ) == False
        
        print("✅ Status transitions passed")


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 RUNNING BASIC UNIT TESTS")
    print("="*60)
    
    setup_module()
    
    tests = [
        TestBasic(),
        TestAuth(),
        TestProductTypes(),
        TestValidators(),
        TestStatusTransitions()
    ]
    
    passed = 0
    failed = 0
    
    for test_class in tests:
        class_name = test_class.__class__.__name__
        print(f"\n📦 {class_name}")
        print("-" * 40)
        
        for method_name in dir(test_class):
            if method_name.startswith("test_"):
                try:
                    method = getattr(test_class, method_name)
                    method()
                    passed += 1
                except Exception as e:
                    print(f"❌ {method_name}: {e}")
                    failed += 1
    
    teardown_module()
    
    print("\n" + "="*60)
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print("="*60)
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
