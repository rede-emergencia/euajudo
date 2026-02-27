"""
Generic Enums for Event-Driven Order System
Supports any type of product (meals, ingredients, clothing, etc.)
"""
from enum import Enum

# ============================================================================
# PRODUCT & ORDER TYPES
# ============================================================================

class ProductType(str, Enum):
    """Types of products in the system"""
    MEAL = "meal"
    INGREDIENT = "ingredient"
    CLOTHING = "clothing"
    MEDICINE = "medicine"
    HYGIENE = "hygiene"
    CLEANING = "cleaning"
    SCHOOL_SUPPLIES = "school_supplies"
    BABY_ITEMS = "baby_items"
    PET_SUPPLIES = "pet_supplies"
    GENERIC = "generic"

class OrderType(str, Enum):
    """Types of orders/transactions"""
    DONATION = "donation"          # Someone donates something
    REQUEST = "request"            # Someone requests something
    PURCHASE = "purchase"          # Someone buys something
    LOAN = "loan"                  # Temporary transfer

# ============================================================================
# EVENT-DRIVEN STATUS (Generic for all flows)
# ============================================================================

class OrderStatus(str, Enum):
    """
    Generic status for any order/transaction flow
    Based on Intent → Commitment → Fulfillment pattern
    """
    # Initial states
    IDLE = "idle"                              # No active transaction
    REQUESTING = "requesting"                  # Someone is requesting/offering
    OFFERING = "offering"                      # Item available for pickup
    
    # Commitment states
    RESERVED = "reserved"                      # Someone committed to fulfill
    
    # Execution states
    IN_PROGRESS = "in_progress"               # Being executed
    AWAITING_PICKUP = "awaiting_pickup"       # Ready for pickup
    PICKED_UP = "picked_up"                   # Picked up, in transit
    IN_TRANSIT = "in_transit"                 # On the way to destination
    
    # Confirmation states
    PENDING_CONFIRMATION = "pending_confirmation"  # Awaiting code/confirmation
    
    # Final states
    COMPLETED = "completed"                    # Successfully completed
    CANCELLED = "cancelled"                    # Cancelled
    EXPIRED = "expired"                        # Expired without completion

class BatchStatus(str, Enum):
    """
    Status for production/offering batches.
    PRODUCING → READY → IN_DELIVERY → COMPLETED
    """
    PRODUCING = "producing"        # Being produced / being prepared
    READY = "ready"               # Ready for pickup / available for volunteers
    IN_DELIVERY = "in_delivery"   # At least one delivery in progress
    COMPLETED = "completed"       # All units delivered
    CANCELLED = "cancelled"       # Cancelled by provider
    EXPIRED = "expired"           # Expired without completion

class DeliveryStatus(str, Enum):
    """Status for deliveries (volunteer-driven)"""
    AVAILABLE = "available"        # Available for volunteer to accept
    RESERVED = "reserved"          # Volunteer accepted
    PICKED_UP = "picked_up"       # Volunteer picked up items
    IN_TRANSIT = "in_transit"     # On the way to destination
    DELIVERED = "delivered"       # Successfully delivered
    CANCELLED = "cancelled"
    EXPIRED = "expired"

# ============================================================================
# USER ROLES
# ============================================================================

class UserRole(str, Enum):
    """User roles in the system"""
    PROVIDER = "provider"          # Provides products (restaurant, donor)
    RECEIVER = "receiver"          # Receives products (shelter, beneficiary)
    VOLUNTEER = "volunteer"        # Facilitates transactions
    ADMIN = "admin"               # System administrator

# ============================================================================
# EVENTS (State transitions)
# ============================================================================

class OrderEvent(str, Enum):
    """Events that trigger state transitions"""
    # Creation events
    CREATE = "create"
    OFFER = "offer"
    REQUEST = "request"
    
    # Commitment events
    ACCEPT = "accept"
    RESERVE = "reserve"
    
    # Execution events
    START = "start"
    PICKUP = "pickup"
    DEPART = "depart"
    
    # Confirmation events
    CONFIRM_PICKUP = "confirm_pickup"
    CONFIRM_DELIVERY = "confirm_delivery"
    
    # Completion events
    COMPLETE = "complete"
    CANCEL = "cancel"
    EXPIRE = "expire"
