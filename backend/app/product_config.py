"""
Product Configuration Model
For admin to manage available product types and their settings
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, JSON
from app.database import Base

class ProductConfiguration(Base):
    __tablename__ = "product_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    product_type = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)  # Display name in Portuguese
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # Icon name (Lucide, etc.)
    color = Column(String(20), nullable=True)  # CSS color for UI
    enabled = Column(Boolean, default=True)
    unit_label = Column(String(20), nullable=True)  # "marmitas", "unidades", "itens", etc.
    requires_quantity = Column(Boolean, default=True)
    requires_time_window = Column(Boolean, default=True)
    requires_description = Column(Boolean, default=False)
    additional_fields = Column(JSON, nullable=True, default={})  # For future custom fields
    order = Column(Integer, default=0)  # Display order in dropdowns
