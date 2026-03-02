"""
Database Migration Script for Inventory Management System
Creates all necessary tables for shelter inventory tracking
"""
from app.database import engine, Base
from app.inventory_models import (
    InventoryItem,
    InventoryTransaction,
    ShelterRequest,
    RequestAdjustment,
    ShelterRequestDelivery,
    DistributionRecord
)

def migrate():
    """Create inventory tables"""
    print("🔄 Creating inventory management tables...")
    
    try:
        # Import all models to ensure they're registered with Base
        from app import models
        from app import inventory_models
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Inventory tables created successfully!")
        print("\nCreated tables:")
        print("  - inventory_items")
        print("  - inventory_transactions")
        print("  - shelter_requests")
        print("  - request_adjustments")
        print("  - shelter_request_deliveries")
        print("  - distribution_records")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    migrate()
