#!/usr/bin/env python3
"""
Create final production-ready database schema
Drops all tables and recreates with clean structure
"""
import os
from sqlalchemy import create_engine, text
from app.database import Base, DATABASE_URL
from app.models import *  # Import all models

def create_final_schema():
    """Drop all tables and recreate with final schema"""
    print("🗑️  Dropping all existing tables...")
    
    # Create engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    print("✅ All tables dropped")
    
    # Create all tables with final schema
    print("\n🏗️  Creating final schema...")
    Base.metadata.create_all(bind=engine)
    print("✅ Final schema created")
    
    # Verify tables
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"))
        tables = [row[0] for row in result]
        
        print(f"\n📋 Tables created ({len(tables)}):")
        for table in tables:
            print(f"   • {table}")
    
    print("\n✅ Database schema is ready for production!")
    print("📝 Next step: Run seed script to populate initial data")

if __name__ == "__main__":
    create_final_schema()
