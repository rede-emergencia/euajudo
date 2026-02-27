"""
Generic Pydantic schemas for API validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional
from datetime import datetime
from app.enums import (
    ProductType,
    OrderType,
    OrderStatus,
    BatchStatus,
    DeliveryStatus,
    UserRole
)

# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    email: EmailStr = Field(
        ...,
        description="User email address (must be unique)",
        example="provider@example.com"
    )
    name: str = Field(
        ...,
        description="Full name or business name",
        example="Restaurante Bom Sabor",
        min_length=2,
        max_length=200
    )
    phone: Optional[str] = Field(
        None,
        description="Phone number with area code",
        example="32988881234"
    )
    roles: str = Field(
        ...,
        description="User roles (comma-separated): provider, volunteer, shelter, admin",
        example="provider"
    )
    city_id: Optional[str] = Field(
        'belo-horizonte',
        description="City identifier",
        example="juiz-de-fora"
    )
    address: Optional[str] = Field(
        None,
        description="Full address for providers and shelters",
        example="Av Rio Branco, 100 - Centro, Juiz de Fora"
    )
    establishment_type: Optional[str] = Field(
        None,
        description="Type of establishment (for providers)",
        example="Restaurant"
    )
    production_capacity: Optional[int] = Field(
        None,
        description="Daily production capacity (for providers)",
        example=100,
        ge=1
    )
    delivery_capacity: Optional[int] = Field(
        None,
        description="Daily delivery capacity (for volunteers)",
        example=50,
        ge=1
    )
    operating_hours: Optional[str] = Field(
        None,
        description="Operating / available hours",
        example="08:00-18:00"
    )

class UserCreate(UserBase):
    # Shelter-specific fields (creates DeliveryLocation automatically)
    location_name: Optional[str] = None
    location_address: Optional[str] = None
    contact_person: Optional[str] = None
    location_phone: Optional[str] = None
    daily_need: Optional[int] = None
    needed_product_types: Optional[str] = None  # comma-separated, e.g. "meal,hygiene"
    location_operating_hours: Optional[str] = None
    password: str = Field(
        ...,
        description="User password (6-72 characters)",
        example="mypassword123",
        min_length=6,
        max_length=72
    )
    
    @validator('password')
    def validate_password(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password too long. Max 72 characters.')
        if len(v) < 6:
            raise ValueError('Password too short. Min 6 characters.')
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    production_capacity: Optional[int] = None
    delivery_capacity: Optional[int] = None
    operating_hours: Optional[str] = None

class UserResponse(UserBase):
    id: int
    approved: bool
    active: bool
    created_at: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# DELIVERY LOCATION SCHEMAS
# ============================================================================

class DeliveryLocationBase(BaseModel):
    name: str
    address: str
    city_id: str = 'belo-horizonte'
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    capacity: Optional[int] = None
    daily_need: Optional[int] = None
    operating_hours: Optional[str] = None

class DeliveryLocationCreate(DeliveryLocationBase):
    user_id: Optional[int] = None

class DeliveryLocationResponse(DeliveryLocationBase):
    id: int
    active: bool
    approved: bool
    created_at: datetime
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

# ============================================================================
# PRODUCT BATCH SCHEMAS
# ============================================================================

class ProductBatchCreate(BaseModel):
    product_type: ProductType = Field(
        ..., 
        description="Type of product in the batch",
        example="meal"
    )
    quantity: int = Field(
        ..., 
        description="Total quantity of items in the batch",
        example=50,
        gt=0
    )
    description: Optional[str] = Field(
        None,
        description="Optional description of the batch (e.g., 'Vegetarian pasta with tomato sauce')",
        example="Vegetarian pasta with tomato sauce",
        max_length=500
    )
    donated_ingredients: bool = Field(
        True,
        description="Whether ingredients were donated (affects pricing/tracking)"
    )
    pickup_deadline: Optional[str] = Field(
        None,
        description="Optional deadline for pickup (ISO format or relative time)",
        example="2024-12-31T18:00:00"
    )

class ProductBatchResponse(BaseModel):
    id: int
    provider_id: int
    product_type: ProductType
    quantity: int
    quantity_available: int
    description: Optional[str]
    status: BatchStatus
    donated_ingredients: bool
    pickup_deadline: Optional[str]
    created_at: datetime
    ready_at: Optional[datetime]
    expires_at: Optional[datetime]
    provider: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# DELIVERY SCHEMAS
# ============================================================================

class DeliveryCreate(BaseModel):
    batch_id: int
    location_id: int
    quantity: int

class DeliveryResponse(BaseModel):
    id: int
    batch_id: Optional[int] = None
    location_id: int
    volunteer_id: Optional[int] = None
    product_type: ProductType
    quantity: int
    status: DeliveryStatus
    pickup_code: Optional[str] = None
    delivery_code: Optional[str] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    estimated_time: Optional[datetime] = None
    photo_proof: Optional[str] = None
    batch: Optional[ProductBatchResponse] = None
    location: Optional[DeliveryLocationResponse] = None
    volunteer: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# RESOURCE REQUEST SCHEMAS (Generic - ingredients, materials, supplies)
# ============================================================================

class ResourceItemBase(BaseModel):
    name: str
    quantity: float
    unit: str

class ResourceItemCreate(ResourceItemBase):
    pass

class ResourceItemResponse(ResourceItemBase):
    id: int
    request_id: int
    quantity_reserved: float
    quantity_delivered: float
    
    class Config:
        from_attributes = True

class ResourceRequestCreate(BaseModel):
    quantity_meals: int
    items: List[ResourceItemCreate]
    receiving_time: Optional[datetime] = None

class ResourceRequestResponse(BaseModel):
    id: int
    provider_id: int
    quantity_meals: int
    status: OrderStatus
    receiving_time: Optional[datetime]
    confirmation_code: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    provider: Optional[UserResponse] = None
    items: List[ResourceItemResponse] = []
    
    class Config:
        from_attributes = True

# ============================================================================
# RESOURCE RESERVATION SCHEMAS
# ============================================================================

class ReservationItemCreate(BaseModel):
    resource_item_id: int
    quantity: float

class ResourceReservationCreate(BaseModel):
    request_id: int
    items: List[ReservationItemCreate]
    estimated_delivery: Optional[datetime] = None

class ReservationItemResponse(BaseModel):
    id: int
    reservation_id: int
    resource_item_id: int
    quantity: float
    
    class Config:
        from_attributes = True

class ResourceReservationResponse(BaseModel):
    id: int
    request_id: int
    volunteer_id: int
    status: OrderStatus
    estimated_delivery: Optional[datetime]
    receipt_photo: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    delivered_at: Optional[datetime]
    volunteer: Optional[UserResponse] = None
    request: Optional[ResourceRequestResponse] = None
    items: List[ReservationItemResponse] = []
    
    class Config:
        from_attributes = True

# ============================================================================
# DASHBOARD SCHEMAS
# ============================================================================

class DashboardStats(BaseModel):
    total_ingredient_requests: int
    total_reservations: int
    total_batches: int
    total_deliveries: int
    requests_available: int
    reservations_active: int
    batches_ready: int
    deliveries_pending: int

# ============================================================================
# GENERIC ORDER SCHEMAS (Future)
# ============================================================================

class OrderCreate(BaseModel):
    order_type: OrderType
    product_type: ProductType
    quantity: int
    description: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    order_type: OrderType
    product_type: ProductType
    status: OrderStatus
    quantity: int
    description: Optional[str]
    created_at: datetime
    reserved_at: Optional[datetime]
    in_progress_at: Optional[datetime]
    completed_at: Optional[datetime]
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True
