"""
Shelter Inventory Management Models
Tracks stock, entries, exits, and transactions for shelters
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from enum import Enum as PyEnum

class TransactionType(str, PyEnum):
    """Types of inventory transactions"""
    DONATION_RECEIVED = "donation_received"      # Received from volunteer/donor
    DONATION_GIVEN = "donation_given"            # Given to end person
    MANUAL_ADJUSTMENT = "manual_adjustment"      # Manual stock correction
    REQUEST_CREATED = "request_created"          # Request created (reserved)
    REQUEST_CANCELLED = "request_cancelled"      # Request cancelled (unreserved)
    REQUEST_ADJUSTED = "request_adjusted"        # Request quantity adjusted
    INITIAL_STOCK = "initial_stock"             # Initial inventory setup
    EXPIRED = "expired"                          # Items expired/discarded
    DAMAGED = "damaged"                          # Items damaged/lost

class InventoryItem(Base):
    """
    Current inventory stock for a shelter by category.
    One row per shelter + category combination.
    """
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    
    # Stock levels
    quantity_in_stock = Column(Integer, default=0, nullable=False)
    quantity_reserved = Column(Integer, default=0, nullable=False)  # Reserved for pending deliveries
    quantity_available = Column(Integer, default=0, nullable=False)  # in_stock - reserved
    
    # Metadata cache for quick filtering (e.g., {"tamanho": "M", "tipo": "camiseta"})
    metadata_cache = Column(JSON, nullable=True)  # {"tamanho": "M", "genero": "U"}
    
    # Thresholds for alerts
    min_threshold = Column(Integer, default=0)  # Alert when below this
    max_threshold = Column(Integer, nullable=True)  # Alert when above this
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_transaction_at = Column(DateTime)
    
    # Relationships
    shelter = relationship("User", foreign_keys=[shelter_id])
    category = relationship("Category")
    transactions = relationship("InventoryTransaction", back_populates="inventory_item", cascade="all, delete-orphan")

class InventoryTransaction(Base):
    """
    Historical record of all inventory movements.
    Immutable audit trail.
    """
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    
    # Transaction details
    transaction_type = Column(Enum(TransactionType), nullable=False, index=True)
    quantity_change = Column(Integer, nullable=False)  # Positive for additions, negative for removals
    
    # Balances after transaction
    balance_after = Column(Integer, nullable=False)
    reserved_after = Column(Integer, nullable=False)
    available_after = Column(Integer, nullable=False)
    
    # Reference to related entities
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who performed the action
    
    # Additional context
    notes = Column(Text, nullable=True)
    transaction_metadata = Column(JSON, nullable=True)  # Extra data (e.g., recipient info, reason)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="transactions")
    delivery = relationship("Delivery", foreign_keys=[delivery_id])
    user = relationship("User", foreign_keys=[user_id])

class ShelterRequest(Base):
    """
    Shelter donation requests with quantity tracking.
    Tracks original request, received amount, and adjustments.
    """
    __tablename__ = "shelter_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Quantities
    quantity_requested = Column(Integer, nullable=False)  # Original request
    quantity_received = Column(Integer, default=0)        # Actually received
    quantity_pending = Column(Integer, default=0)         # In transit
    quantity_cancelled = Column(Integer, default=0)       # Cancelled amount
    
    # Status
    status = Column(String, default="active", index=True)  # active, completed, cancelled, partially_completed
    
    # Metadata
    metadata_cache = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Relationships
    shelter = relationship("User", foreign_keys=[shelter_id])
    category = relationship("Category")
    deliveries = relationship("Delivery", secondary="shelter_request_deliveries", backref="shelter_requests")
    adjustments = relationship("RequestAdjustment", back_populates="request", cascade="all, delete-orphan")

class RequestAdjustment(Base):
    """
    History of request quantity adjustments.
    Tracks increases, decreases, and cancellations.
    """
    __tablename__ = "request_adjustments"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("shelter_requests.id"), nullable=False, index=True)
    
    # Adjustment details
    adjustment_type = Column(String, nullable=False)  # increase, decrease, cancel
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    quantity_change = Column(Integer, nullable=False)
    
    # Context
    reason = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Validation flags
    can_adjust = Column(Boolean, default=True)  # Whether adjustment was allowed
    warning_message = Column(Text, nullable=True)  # Warning if adjustment affects in-progress deliveries
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    request = relationship("ShelterRequest", back_populates="adjustments")
    user = relationship("User", foreign_keys=[user_id])

class ShelterRequestDelivery(Base):
    """
    Association table linking shelter requests to deliveries.
    Tracks which deliveries fulfill which requests.
    """
    __tablename__ = "shelter_request_deliveries"
    __mapper_args__ = {"confirm_deleted_rows": False}
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("shelter_requests.id"), nullable=False)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    quantity = Column(Integer, nullable=False)  # How much of this delivery goes to this request
    created_at = Column(DateTime, default=datetime.utcnow)

class DistributionRecord(Base):
    """
    Records of items distributed to end recipients (pessoas finais).
    Tracks who received what, when, and from which shelter.
    """
    __tablename__ = "distribution_records"
    
    id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Distribution details
    quantity = Column(Integer, nullable=False)
    recipient_name = Column(String, nullable=True)  # Optional recipient tracking
    recipient_document = Column(String, nullable=True)  # CPF or other ID
    
    # Context
    notes = Column(Text, nullable=True)
    distribution_metadata = Column(JSON, nullable=True)
    photo_proof = Column(String, nullable=True)  # Optional photo
    
    # Status
    status = Column(String, default="active", index=True)  # active, cancelled
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Timestamps
    distributed_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    shelter = relationship("User", foreign_keys=[shelter_id])
    category = relationship("Category")
