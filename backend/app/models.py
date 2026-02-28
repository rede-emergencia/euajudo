"""
Generic Models for Event-Driven Order System
Supports any type of product and transaction
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.enums import (
    ProductType,
    OrderType,
    OrderStatus,
    BatchStatus,
    DeliveryStatus,
    UserRole,
    OrderEvent
)

# ============================================================================
# USER & LOCATION MODELS
# ============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)  # Corrigido: hashed_password -> password_hash
    full_name = Column(String, nullable=False)  # Corrigido: name -> full_name
    phone = Column(String)
    roles = Column(String, nullable=False)  # Comma-separated roles
    city_id = Column(String, index=True, default='belo-horizonte')
    approved = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)  # Corrigido: active -> is_active
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Location & capacity
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    establishment_type = Column(String)
    production_capacity = Column(Integer)
    delivery_capacity = Column(Integer)
    operating_hours = Column(String)  # e.g. "08:00-18:00"
    
    # Product types offered (JSON array) - nullable para compatibilidade
    tipos_produtos = Column(JSON, nullable=True)
    
    # Relationships
    batches = relationship("ProductBatch", back_populates="provider", foreign_keys="ProductBatch.provider_id")
    deliveries = relationship("Delivery", back_populates="volunteer", foreign_keys="Delivery.volunteer_id")
    resource_requests = relationship("ResourceRequest", back_populates="provider")
    resource_reservations = relationship("ResourceReservation", back_populates="volunteer")

class DeliveryLocation(Base):
    __tablename__ = "delivery_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city_id = Column(String, index=True, default='belo-horizonte')
    latitude = Column(Float)
    longitude = Column(Float)
    contact_person = Column(String)
    phone = Column(String)
    capacity = Column(Integer)
    daily_need = Column(Integer)
    operating_hours = Column(String)
    active = Column(Boolean, default=True)
    approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    deliveries = relationship("Delivery", back_populates="location")
    owner = relationship("User", foreign_keys=[user_id])

# ============================================================================
# PRODUCT BATCH MODEL (Generic for any product type)
# ============================================================================

class ProductBatch(Base):
    """
    Generic batch of products (meals, ingredients, clothing, etc.)
    """
    __tablename__ = "product_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Product info
    product_type = Column(Enum(ProductType), nullable=False)
    quantity = Column(Integer, nullable=False)
    quantity_available = Column(Integer, nullable=False)
    description = Column(Text)
    
    # Status & metadata
    status = Column(Enum(BatchStatus), default=BatchStatus.PRODUCING)
    donated_ingredients = Column(Boolean, default=True)
    pickup_deadline = Column(String)  # Format: "18:00"
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    ready_at = Column(DateTime)
    expires_at = Column(DateTime)
    
    # Relationships
    provider = relationship("User", back_populates="batches", foreign_keys=[provider_id])
    deliveries = relationship("Delivery", back_populates="batch")

# ============================================================================
# DELIVERY MODEL (Generic for any product)
# ============================================================================

class Delivery(Base):
    """
    Generic delivery of products from provider to location
    Can be linked to a batch (traditional flow) or direct commitment (batch_id=None)
    """
    __tablename__ = "deliveries"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("product_batches.id"), nullable=True)  # Optional - None for direct commitments
    location_id = Column(Integer, ForeignKey("delivery_locations.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("users.id"))
    parent_delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)  # Reference to original delivery if this was split
    
    # Delivery info
    product_type = Column(Enum(ProductType), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.AVAILABLE)
    
    # Confirmation codes
    pickup_code = Column(String)      # Provider generates, volunteer confirms pickup
    delivery_code = Column(String)    # Generated after pickup, receiver confirms delivery
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime)
    picked_up_at = Column(DateTime)
    delivered_at = Column(DateTime)
    expires_at = Column(DateTime)
    
    # Optional metadata
    estimated_time = Column(DateTime)
    photo_proof = Column(String)
    
    # Relationships
    batch = relationship("ProductBatch", back_populates="deliveries")
    location = relationship("DeliveryLocation", back_populates="deliveries")
    volunteer = relationship("User", back_populates="deliveries", foreign_keys=[volunteer_id])

# ============================================================================
# INGREDIENT REQUEST & RESERVATION (Specific to ingredient donations)
# ============================================================================

class ResourceRequest(Base):
    """
    Request for resources/materials by a provider (ingredients, materials, supplies, etc.)
    Generic model - works for any type of donation request
    """
    __tablename__ = "resource_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity_meals = Column(Integer, nullable=False)  # How many meals this will produce
    status = Column(Enum(OrderStatus), default=OrderStatus.REQUESTING)
    receiving_time = Column(DateTime)
    confirmation_code = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Relationships
    provider = relationship("User", back_populates="resource_requests")
    items = relationship("ResourceItem", back_populates="request", cascade="all, delete-orphan")
    reservations = relationship("ResourceReservation", back_populates="request")

class ResourceItem(Base):
    """
    Individual resource/item in a request (ingredient, material, supply, etc.)
    """
    __tablename__ = "resource_items"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("resource_requests.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    quantity_reserved = Column(Float, default=0)
    quantity_delivered = Column(Float, default=0)
    
    # Relationships
    request = relationship("ResourceRequest", back_populates="items")
    reservation_items = relationship("ReservationItem", back_populates="resource_item")

class ResourceReservation(Base):
    """
    Volunteer reservation to buy and deliver resources (ingredients, materials, etc.)
    """
    __tablename__ = "resource_reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("resource_requests.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.RESERVED)
    estimated_delivery = Column(DateTime)
    receipt_photo = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    delivered_at = Column(DateTime)
    
    # Relationships
    request = relationship("ResourceRequest", back_populates="reservations")
    volunteer = relationship("User", back_populates="resource_reservations")
    items = relationship("ReservationItem", back_populates="reservation", cascade="all, delete-orphan")

class ReservationItem(Base):
    """
    Individual item in a reservation
    """
    __tablename__ = "reservation_items"
    
    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("resource_reservations.id"), nullable=False)
    resource_item_id = Column(Integer, ForeignKey("resource_items.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    
    # Relationships
    reservation = relationship("ResourceReservation", back_populates="items")
    resource_item = relationship("ResourceItem", back_populates="reservation_items")

# ============================================================================
# GENERIC ORDER MODEL (Future: unified order system)
# ============================================================================

class Order(Base):
    """
    Generic order/transaction model for future expansion
    Can represent any type of transaction (donation, request, purchase, loan)
    """
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_type = Column(Enum(OrderType), nullable=False)
    product_type = Column(Enum(ProductType), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.IDLE)
    
    # Participants
    requester_id = Column(Integer, ForeignKey("users.id"))
    provider_id = Column(Integer, ForeignKey("users.id"))
    beneficiary_id = Column(Integer, ForeignKey("users.id"))
    
    # Quantity & metadata
    quantity = Column(Integer, nullable=False)
    description = Column(Text)
    extra_data = Column(JSON)  # Flexible metadata storage
    
    # Confirmation codes
    confirmation_codes = Column(JSON)  # {"pickup": "123456", "delivery": "654321"}
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    reserved_at = Column(DateTime)
    in_progress_at = Column(DateTime)
    completed_at = Column(DateTime)
    expires_at = Column(DateTime)
