"""
Product Configuration Router
Admin management for product types and configurations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.product_config import ProductConfiguration
from app.auth import get_current_active_user, require_role
from pydantic import BaseModel

router = APIRouter(prefix="/api/product-config", tags=["product-config"])

# Pydantic schemas
class ProductConfigurationBase(BaseModel):
    product_type: str
    name: str
    description: str = None
    icon: str = None
    color: str = None
    enabled: bool = True
    unit_label: str = "unidades"
    requires_quantity: bool = True
    requires_time_window: bool = True
    requires_description: bool = False
    additional_fields: dict = {}
    order: int = 0

class ProductConfigurationCreate(ProductConfigurationBase):
    pass

class ProductConfigurationUpdate(BaseModel):
    name: str = None
    description: str = None
    icon: str = None
    color: str = None
    enabled: bool = None
    unit_label: str = None
    requires_quantity: bool = None
    requires_time_window: bool = None
    requires_description: bool = None
    additional_fields: dict = None
    order: int = None

class ProductConfigurationResponse(ProductConfigurationBase):
    id: int
    additional_fields: dict = {}
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductConfigurationResponse])
def list_product_configurations(
    enabled_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all product configurations (public endpoint for dropdown)"""
    query = db.query(ProductConfiguration)
    if enabled_only:
        query = query.filter(ProductConfiguration.enabled == True)
    return query.order_by(ProductConfiguration.order).all()

@router.post("/", response_model=ProductConfigurationResponse, status_code=201)
def create_product_configuration(
    config: ProductConfigurationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """Create new product configuration"""
    # Check if product_type already exists
    existing = db.query(ProductConfiguration).filter(
        ProductConfiguration.product_type == config.product_type
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product type already exists")
    
    db_config = ProductConfiguration(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@router.put("/{config_id}", response_model=ProductConfigurationResponse)
def update_product_configuration(
    config_id: int,
    config_update: ProductConfigurationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """Update product configuration"""
    db_config = db.query(ProductConfiguration).filter(ProductConfiguration.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Product configuration not found")
    
    update_data = config_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_config, field, value)
    
    db.commit()
    db.refresh(db_config)
    return db_config

@router.delete("/{config_id}")
def delete_product_configuration(
    config_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """Delete product configuration"""
    db_config = db.query(ProductConfiguration).filter(ProductConfiguration.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Product configuration not found")
    
    db.delete(db_config)
    db.commit()
    return {"message": "Product configuration deleted successfully"}
