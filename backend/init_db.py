"""
Initialize database with generic models
Creates all tables from scratch
"""
from app.database import engine, Base
from app.models import (
    User,
    DeliveryLocation,
    ProductBatch,
    Delivery,
    ResourceRequest,
    ResourceItem,
    ResourceReservation,
    ReservationItem,
    Order
)

def init_database():
    """Create all tables"""
    print("🗄️  Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully!")
    
    # Print created tables
    print("\n📋 Created tables:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")

if __name__ == "__main__":
    init_database()
