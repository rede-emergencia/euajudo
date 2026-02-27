import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Test database
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

@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)

def test_register_user(client):
    """Test user registration"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "nome": "Test User",
            "telefone": "31999887766",
            "roles": "voluntario_comprador",
            "city_id": "belo-horizonte"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["nome"] == "Test User"
    assert "id" in data

def test_register_duplicate_email(client):
    """Test registration with duplicate email"""
    user_data = {
        "email": "duplicate@example.com",
        "password": "password123",
        "nome": "User One",
        "telefone": "31999887766",
        "roles": "voluntario_comprador"
    }
    
    # First registration
    client.post("/api/auth/register", json=user_data)
    
    # Second registration with same email
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400

def test_login_success(client):
    """Test successful login"""
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "password123",
            "nome": "Login User",
            "roles": "voluntario_comprador"
        }
    )
    
    # Login
    response = client.post(
        "/api/auth/login",
        data={
            "username": "login@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    """Test login with wrong password"""
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "email": "wrong@example.com",
            "password": "correct123",
            "nome": "Wrong User",
            "roles": "voluntario_comprador"
        }
    )
    
    # Login with wrong password
    response = client.post(
        "/api/auth/login",
        data={
            "username": "wrong@example.com",
            "password": "wrong123"
        }
    )
    assert response.status_code == 401

def test_get_profile(client):
    """Test getting user profile"""
    # Register and login
    client.post(
        "/api/auth/register",
        json={
            "email": "profile@example.com",
            "password": "password123",
            "nome": "Profile User",
            "roles": "produtor",
            "city_id": "belo-horizonte"
        }
    )
    
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "profile@example.com",
            "password": "password123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Get profile
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile@example.com"
    assert data["nome"] == "Profile User"
    assert data["city_id"] == "belo-horizonte"

def test_password_validation(client):
    """Test password length validation"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "short@example.com",
            "password": "12345",  # Too short
            "nome": "Short Password",
            "roles": "voluntario_comprador"
        }
    )
    assert response.status_code == 422
