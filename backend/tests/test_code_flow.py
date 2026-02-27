"""
Focused Integration Test - Code Flow Verification
Tests the exact flow: pickup code → delivery code
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import User

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_codes.db"
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


def test_code_flow():
    """
    Test complete code flow:
    1. Provider creates batch
    2. Volunteer creates delivery → gets pickup_code
    3. Volunteer confirms pickup → gets delivery_code  
    4. Volunteer confirms delivery with delivery_code
    """
    print("\n" + "="*70)
    print("🧪 TESTING CODE FLOW: Pickup Code → Delivery Code")
    print("="*70)
    
    # Setup database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    try:
        # 1. Create users
        print("\n📍 Step 1: Creating users...")
        
        # Provider
        r = client.post("/api/auth/register", json={
            "email": "provider@test.com",
            "password": "123456",
            "name": "Fornecedor",
            "roles": "provider",
            "city_id": "test"
        })
        assert r.status_code == 201, f"Provider reg failed: {r.text}"
        
        r = client.post("/api/auth/login", data={
            "username": "provider@test.com",
            "password": "123456"
        })
        provider_token = r.json()["access_token"]
        
        # Volunteer
        r = client.post("/api/auth/register", json={
            "email": "volunteer@test.com",
            "password": "123456",
            "name": "Voluntario",
            "roles": "volunteer",
            "city_id": "test"
        })
        assert r.status_code == 201
        
        r = client.post("/api/auth/login", data={
            "username": "volunteer@test.com",
            "password": "123456"
        })
        volunteer_token = r.json()["access_token"]
        print("   ✅ Volunteer created")
        
        # Create admin to approve users
        print("   ⏳ Creating admin to approve users...")
        r = client.post("/api/auth/register", json={
            "email": "admin@test.com",
            "password": "123456",
            "name": "Admin",
            "roles": "admin",
            "city_id": "test"
        })
        
        r = client.post("/api/auth/login", data={
            "username": "admin@test.com",
            "password": "123456"
        })
        admin_token = r.json()["access_token"]
        
        # Approve users via database
        print("   ⏳ Approving users in database...")
        db = TestingSessionLocal()
        provider = db.query(User).filter(User.email == "provider@test.com").first()
        if provider:
            provider.approved = True
            print(f"      - Provider approved: {provider.email}")
        volunteer = db.query(User).filter(User.email == "volunteer@test.com").first()
        if volunteer:
            volunteer.approved = True
            print(f"      - Volunteer approved: {volunteer.email}")
        db.commit()
        db.close()
        print("   ✅ Users approved")
        
        # Re-login to get fresh tokens (approval status is in token)
        print("   ⏳ Re-logging in users...")
        r = client.post("/api/auth/login", data={
            "username": "provider@test.com",
            "password": "123456"
        })
        provider_token = r.json()["access_token"]
        
        r = client.post("/api/auth/login", data={
            "username": "volunteer@test.com",
            "password": "123456"
        })
        volunteer_token = r.json()["access_token"]
        print("   ✅ Fresh tokens obtained")
        
        # Create location
        print("   ⏳ Creating location...")
        r = client.post("/api/locations/",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Abrigo Test",
                "address": "Rua Test, 123",
                "city_id": "test",
                "capacity": 100
            }
        )
        assert r.status_code == 201, f"Location creation failed: {r.text}"
        location_id = r.json()["id"]
        print(f"   ✅ Location created: {location_id}")
        
        # 2. Provider creates batch
        print("\n📍 Step 2: Provider creating batch...")
        r = client.post("/api/batches/",
            headers={"Authorization": f"Bearer {provider_token}"},
            json={
                "product_type": "meal",
                "quantity": 30,
                "description": "Refeicoes para doacao"
            }
        )
        assert r.status_code == 201, f"Batch creation failed: {r.text}"
        batch_id = r.json()["id"]
        print(f"   ✅ Batch created: {batch_id}")
        
        # 3. Provider marks batch ready
        print("\n📍 Step 3: Marking batch ready...")
        r = client.post(f"/api/batches/{batch_id}/mark-ready",
            headers={"Authorization": f"Bearer {provider_token}"}
        )
        assert r.status_code == 200
        print("   ✅ Batch ready")
        
        # 4. Volunteer creates delivery - GETS PICKUP CODE
        print("\n📍 Step 4: Volunteer creating delivery (gets PICKUP CODE)...")
        r = client.post("/api/deliveries/",
            headers={"Authorization": f"Bearer {volunteer_token}"},
            json={
                "batch_id": batch_id,
                "location_id": location_id,
                "quantity": 20
            }
        )
        assert r.status_code == 201, f"Delivery creation failed: {r.text}"
        data = r.json()
        delivery_id = data["id"]
        pickup_code = data["pickup_code"]
        
        assert pickup_code is not None, "Pickup code not generated!"
        assert len(pickup_code) == 6, f"Pickup code wrong length: {pickup_code}"
        print(f"   ✅ Delivery created: {delivery_id}")
        print(f"   🔑 PICKUP CODE: {pickup_code}")
        print(f"   📋 Status: {data['status']}")
        
        # 5. Volunteer confirms pickup with code - GETS DELIVERY CODE
        print("\n📍 Step 5: Volunteer confirming pickup (gets DELIVERY CODE)...")
        r = client.post(f"/api/deliveries/{delivery_id}/confirm-pickup",
            headers={"Authorization": f"Bearer {volunteer_token}"},
            json={"pickup_code": pickup_code}
        )
        assert r.status_code == 200, f"Pickup confirmation failed: {r.text}"
        data = r.json()
        delivery_code = data["delivery_code"]
        
        assert delivery_code is not None, "Delivery code not generated!"
        assert len(delivery_code) == 6, f"Delivery code wrong length: {delivery_code}"
        assert delivery_code != pickup_code, "Codes should be different!"
        assert data["status"] == "picked_up"
        print(f"   ✅ Pickup confirmed")
        print(f"   🔑 DELIVERY CODE: {delivery_code}")
        print(f"   📋 Status: {data['status']}")
        
        # 6. Volunteer confirms delivery with delivery code
        print("\n📍 Step 6: Volunteer confirming delivery (with DELIVERY CODE)...")
        r = client.post(f"/api/deliveries/{delivery_id}/confirm-delivery",
            headers={"Authorization": f"Bearer {volunteer_token}"},
            json={"delivery_code": delivery_code}
        )
        assert r.status_code == 200, f"Delivery confirmation failed: {r.text}"
        data = r.json()
        
        assert data["status"] == "delivered"
        assert data["delivered_at"] is not None
        print(f"   ✅ Delivery confirmed")
        print(f"   📋 Status: {data['status']}")
        print(f"   📅 Delivered at: {data['delivered_at']}")
        
        # 7. Test invalid codes
        print("\n📍 Step 7: Testing invalid code rejection...")
        
        # Create NEW batch for invalid code test (original batch exhausted)
        print("   ⏳ Creating new batch for invalid code test...")
        r = client.post("/api/batches/",
            headers={"Authorization": f"Bearer {provider_token}"},
            json={
                "product_type": "meal",
                "quantity": 10,
                "description": "Batch for code validation test"
            }
        )
        assert r.status_code == 201
        test_batch_id = r.json()["id"]
        
        # Mark ready
        r = client.post(f"/api/batches/{test_batch_id}/mark-ready",
            headers={"Authorization": f"Bearer {provider_token}"}
        )
        assert r.status_code == 200
        
        # Create delivery for invalid code test
        r = client.post("/api/deliveries/",
            headers={"Authorization": f"Bearer {volunteer_token}"},
            json={
                "batch_id": test_batch_id,
                "location_id": location_id,
                "quantity": 5
            }
        )
        assert r.status_code == 201, f"Failed to create test delivery: {r.text}"
        new_delivery_id = r.json()["id"]
        new_pickup_code = r.json()["pickup_code"]
        
        # Try wrong pickup code
        r = client.post(f"/api/deliveries/{new_delivery_id}/confirm-pickup",
            headers={"Authorization": f"Bearer {volunteer_token}"},
            json={"pickup_code": "000000"}  # Wrong
        )
        assert r.status_code == 422, "Should reject invalid pickup code"
        print("   ✅ Invalid pickup code rejected (422)")
        
        # Correct pickup
        r = client.post(f"/api/deliveries/{new_delivery_id}/confirm-pickup",
            headers={"Authorization": f"Bearer {volunteer_token}"},
            json={"pickup_code": new_pickup_code}
        )
        new_delivery_code = r.json()["delivery_code"]
        
        # Try wrong delivery code
        r = client.post(f"/api/deliveries/{new_delivery_id}/confirm-delivery",
            headers={"Authorization": f"Bearer {volunteer_token}"},
            json={"delivery_code": "000000"}  # Wrong
        )
        assert r.status_code == 422, "Should reject invalid delivery code"
        print("   ✅ Invalid delivery code rejected (422)")
        
        # Correct delivery
        r = client.post(f"/api/deliveries/{new_delivery_id}/confirm-delivery",
            headers={"Authorization": f"Bearer {volunteer_token}"},
            json={"delivery_code": new_delivery_code}
        )
        assert r.status_code == 200
        print("   ✅ Valid delivery code accepted")
        
        print("\n" + "="*70)
        print("🎉 ALL CODE FLOW TESTS PASSED!")
        print("="*70)
        print("\n📋 Verified flows:")
        print("   ✅ Provider creates batch")
        print("   ✅ Volunteer reserves delivery")
        print("   ✅ System generates PICKUP CODE (6 digits)")
        print("   ✅ Volunteer uses pickup code at kitchen")
        print("   ✅ System generates DELIVERY CODE (6 digits)")
        print("   ✅ Volunteer uses delivery code at shelter")
        print("   ✅ Invalid codes are rejected (422)")
        print("   ✅ Codes are different (pickup ≠ delivery)")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        Base.metadata.drop_all(bind=engine)


if __name__ == "__main__":
    success = test_code_flow()
    sys.exit(0 if success else 1)
