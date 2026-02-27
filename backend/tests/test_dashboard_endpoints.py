"""
Integration tests for dashboard endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.database import Base, get_db
from app.models import User, ProductBatch, Delivery, ResourceRequest, ResourceItem, ResourceReservation
from app.enums import BatchStatus, DeliveryStatus, OrderStatus, ProductType
from app.auth import get_password_hash, create_access_token

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dashboard.db"
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
def provider_user(setup_database):
    """Create a provider user"""
    db = TestingSessionLocal()
    user = User(
        email="provider@test.com",
        name="Test Provider",
        phone="11999999999",
        roles="provider",
        hashed_password=get_password_hash("testpass"),
        address="Test Address",
        approved=True
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


def get_auth_header(user):
    """Get authorization header for user"""
    token = create_access_token(data={"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


class TestDashboardConfigEndpoint:
    """Test /api/dashboard/config endpoint"""
    
    def test_get_config_provider(self, provider_user):
        """Test getting dashboard config for provider"""
        response = client.get(
            "/api/dashboard/config",
            headers=get_auth_header(provider_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["role"] == "provider"
        assert data["title"] == "Dashboard Fornecedor"
        assert "widgets" in data
        assert len(data["widgets"]) > 0
        
        # Check widgets are ordered
        widget_ids = [w["id"] for w in data["widgets"]]
        assert "my_batches" in widget_ids
        assert "my_requests" in widget_ids
        assert "my_pickups" in widget_ids
    
    def test_get_config_shelter(self, shelter_user):
        """Test getting dashboard config for shelter"""
        response = client.get(
            "/api/dashboard/config",
            headers=get_auth_header(shelter_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["role"] == "shelter"
        assert data["title"] == "Dashboard Abrigo"
        assert "widgets" in data
        
        widget_ids = [w["id"] for w in data["widgets"]]
        assert "my_requests" in widget_ids
        assert "incoming_deliveries" in widget_ids
    
    def test_get_config_volunteer(self, volunteer_user):
        """Test getting dashboard config for volunteer"""
        response = client.get(
            "/api/dashboard/config",
            headers=get_auth_header(volunteer_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["role"] == "volunteer"
        assert data["title"] == "Dashboard Voluntário"
        assert "widgets" in data
        
        widget_ids = [w["id"] for w in data["widgets"]]
        assert "my_donations" in widget_ids
        assert "my_deliveries" in widget_ids
    
    def test_get_config_unauthorized(self):
        """Test getting config without authentication"""
        response = client.get("/api/dashboard/config")
        assert response.status_code == 401
    
    def test_widget_structure(self, provider_user):
        """Test widget structure in config response"""
        response = client.get(
            "/api/dashboard/config",
            headers=get_auth_header(provider_user)
        )
        
        data = response.json()
        widget = data["widgets"][0]
        
        # Check required fields
        assert "id" in widget
        assert "type" in widget
        assert "title" in widget
        assert "data_source" in widget
        assert "icon" in widget
        assert "size" in widget
        assert "order" in widget
        assert "visible" in widget
        assert "display_mode" in widget
        assert "max_items" in widget
        assert "columns" in widget
        
        # Check actions
        if widget.get("primary_action"):
            action = widget["primary_action"]
            assert "id" in action
            assert "label" in action
            assert "icon" in action
            assert "endpoint" in action
            assert "method" in action


class TestWidgetDataEndpoint:
    """Test /api/dashboard/widgets/{widget_id}/data endpoint"""
    
    def test_get_batches_data_empty(self, provider_user):
        """Test getting batches data when empty"""
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["widget_id"] == "my_batches"
        assert data["data"] == []
        assert data["total"] == 0
        assert data["has_more"] is False
    
    def test_get_batches_data_with_items(self, provider_user):
        """Test getting batches data with items"""
        # Create test batches
        db = TestingSessionLocal()
        batch1 = ProductBatch(
            provider_id=provider_user.id,
            product_type=ProductType.MEAL,
            quantity=50,
            quantity_available=50,
            description="Test batch 1",
            status=BatchStatus.READY,
            donated_ingredients=True
        )
        batch2 = ProductBatch(
            provider_id=provider_user.id,
            product_type=ProductType.MEAL,
            quantity=30,
            quantity_available=30,
            description="Test batch 2",
            status=BatchStatus.PRODUCING,
            donated_ingredients=False
        )
        db.add(batch1)
        db.add(batch2)
        db.commit()
        db.close()
        
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["widget_id"] == "my_batches"
        assert len(data["data"]) == 2
        assert data["total"] == 2
        
        # Check batch structure
        batch = data["data"][0]
        assert "id" in batch
        assert "product_type" in batch
        assert "quantity" in batch
        assert "status" in batch
        assert "provider" in batch
    
    def test_get_requests_data(self, provider_user):
        """Test getting requests data"""
        # Create test request
        db = TestingSessionLocal()
        request = ResourceRequest(
            provider_id=provider_user.id,
            quantity_meals=100,
            status=OrderStatus.PENDING,
            confirmation_code="TEST123"
        )
        db.add(request)
        db.commit()
        
        # Add items
        item = ResourceItem(
            request_id=request.id,
            name="Rice",
            quantity=10,
            unit="kg"
        )
        db.add(item)
        db.commit()
        db.close()
        
        response = client.get(
            "/api/dashboard/widgets/my_requests/data",
            headers=get_auth_header(provider_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["data"]) == 1
        request_data = data["data"][0]
        assert request_data["quantity_meals"] == 100
        assert request_data["status"] == OrderStatus.PENDING
        assert len(request_data["items"]) == 1
        assert request_data["items"][0]["name"] == "Rice"
    
    def test_get_deliveries_data(self, volunteer_user, provider_user):
        """Test getting deliveries data for volunteer"""
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
            product_type=ProductType.MEAL,
            quantity=25,
            status=DeliveryStatus.PENDING,
            pickup_code="PICK123",
            delivery_code="DELV456"
        )
        db.add(delivery)
        db.commit()
        db.close()
        
        response = client.get(
            "/api/dashboard/widgets/my_deliveries/data",
            headers=get_auth_header(volunteer_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["data"]) == 1
        delivery_data = data["data"][0]
        assert delivery_data["quantity"] == 25
        assert delivery_data["status"] == DeliveryStatus.PENDING
        assert delivery_data["pickup_code"] == "PICK123"
        assert delivery_data["delivery_code"] == "DELV456"
    
    def test_get_widget_data_pagination(self, provider_user):
        """Test widget data pagination"""
        # Create multiple batches
        db = TestingSessionLocal()
        for i in range(15):
            batch = ProductBatch(
                provider_id=provider_user.id,
                product_type=ProductType.MEAL,
                quantity=10,
                quantity_available=10,
                description=f"Batch {i}",
                status=BatchStatus.READY,
                donated_ingredients=True
            )
            db.add(batch)
        db.commit()
        db.close()
        
        # Get first page
        response = client.get(
            "/api/dashboard/widgets/my_batches/data?limit=10&offset=0",
            headers=get_auth_header(provider_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 10
        assert data["has_more"] is True
        
        # Get second page
        response = client.get(
            "/api/dashboard/widgets/my_batches/data?limit=10&offset=10",
            headers=get_auth_header(provider_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 5
        assert data["has_more"] is False
    
    def test_get_widget_data_invalid_widget(self, provider_user):
        """Test getting data for invalid widget"""
        response = client.get(
            "/api/dashboard/widgets/invalid_widget/data",
            headers=get_auth_header(provider_user)
        )
        
        assert response.status_code == 404
    
    def test_get_widget_data_unauthorized(self):
        """Test getting widget data without authentication"""
        response = client.get("/api/dashboard/widgets/my_batches/data")
        assert response.status_code == 401
    
    def test_widget_data_filters_my_items(self, provider_user):
        """Test that 'my' filter only returns user's items"""
        # Create another user and their batch
        db = TestingSessionLocal()
        other_user = User(
            email="other@test.com",
            name="Other Provider",
            phone="11966666666",
            roles="provider",
            hashed_password=get_password_hash("testpass"),
            approved=True
        )
        db.add(other_user)
        db.commit()
        
        # Create batches for both users
        my_batch = ProductBatch(
            provider_id=provider_user.id,
            product_type=ProductType.MEAL,
            quantity=50,
            quantity_available=50,
            status=BatchStatus.READY,
            donated_ingredients=True
        )
        other_batch = ProductBatch(
            provider_id=other_user.id,
            product_type=ProductType.MEAL,
            quantity=30,
            quantity_available=30,
            status=BatchStatus.READY,
            donated_ingredients=True
        )
        db.add(my_batch)
        db.add(other_batch)
        db.commit()
        db.close()
        
        # Get my batches
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(provider_user)
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only see my batch
        assert len(data["data"]) == 1
        assert data["data"][0]["provider"]["id"] == provider_user.id


class TestDashboardPermissions:
    """Test dashboard permissions and role-based access"""
    
    def test_provider_cannot_access_shelter_widget(self, provider_user):
        """Test provider cannot access shelter-specific widget"""
        response = client.get(
            "/api/dashboard/widgets/incoming_deliveries/data",
            headers=get_auth_header(provider_user)
        )
        
        # Widget doesn't exist for provider role
        assert response.status_code == 404
    
    def test_shelter_cannot_access_provider_widget(self, shelter_user):
        """Test shelter cannot access provider-specific widget"""
        response = client.get(
            "/api/dashboard/widgets/my_pickups/data",
            headers=get_auth_header(shelter_user)
        )
        
        # Widget doesn't exist for shelter role
        assert response.status_code == 404
    
    def test_volunteer_cannot_access_provider_widget(self, volunteer_user):
        """Test volunteer cannot access provider-specific widget"""
        response = client.get(
            "/api/dashboard/widgets/my_batches/data",
            headers=get_auth_header(volunteer_user)
        )
        
        # Widget doesn't exist for volunteer role
        assert response.status_code == 404
