"""
Generic validators for products and orders
Provides interfaces for validating different product types
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.enums import ProductType, OrderStatus, DeliveryStatus, BatchStatus

# ============================================================================
# PRODUCT VALIDATOR INTERFACE
# ============================================================================

class ProductValidator(ABC):
    """Abstract base class for product validators"""
    
    @abstractmethod
    def validate_quantity(self, quantity: int) -> bool:
        """Validate if quantity is acceptable"""
        pass
    
    @abstractmethod
    def validate_description(self, description: str) -> bool:
        """Validate product description"""
        pass
    
    @abstractmethod
    def get_default_expiry_hours(self) -> int:
        """Get default expiry time in hours"""
        pass

class MealValidator(ProductValidator):
    """Validator for meal products"""
    
    def validate_quantity(self, quantity: int) -> bool:
        return 1 <= quantity <= 1000
    
    def validate_description(self, description: str) -> bool:
        if not description:
            return True  # Optional
        return len(description) <= 500
    
    def get_default_expiry_hours(self) -> int:
        return 4  # Meals expire in 4 hours

class IngredientValidator(ProductValidator):
    """Validator for ingredient products"""
    
    def validate_quantity(self, quantity: int) -> bool:
        return quantity > 0
    
    def validate_description(self, description: str) -> bool:
        return True  # Any description is valid
    
    def get_default_expiry_hours(self) -> int:
        return 48  # Ingredients expire in 48 hours

class GenericValidator(ProductValidator):
    """Validator for generic products"""
    
    def validate_quantity(self, quantity: int) -> bool:
        return quantity > 0
    
    def validate_description(self, description: str) -> bool:
        return True
    
    def get_default_expiry_hours(self) -> int:
        return 72  # Generic products expire in 72 hours

# ============================================================================
# VALIDATOR FACTORY
# ============================================================================

class ValidatorFactory:
    """Factory to get appropriate validator for product type"""
    
    _validators: Dict[ProductType, ProductValidator] = {
        ProductType.MEAL: MealValidator(),
        ProductType.INGREDIENT: IngredientValidator(),
        ProductType.GENERIC: GenericValidator(),
    }
    
    @classmethod
    def get_validator(cls, product_type: ProductType) -> ProductValidator:
        """Get validator for specific product type"""
        return cls._validators.get(product_type, GenericValidator())

# ============================================================================
# STATUS TRANSITION VALIDATOR
# ============================================================================

class StatusTransitionValidator:
    """Validates if status transitions are allowed"""
    
    # Valid transitions for DeliveryStatus
    DELIVERY_TRANSITIONS = {
        DeliveryStatus.AVAILABLE: [DeliveryStatus.RESERVED, DeliveryStatus.CANCELLED],
        DeliveryStatus.RESERVED: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED, DeliveryStatus.EXPIRED],
        DeliveryStatus.PICKED_UP: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED],
        DeliveryStatus.IN_TRANSIT: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED],
        DeliveryStatus.DELIVERED: [],  # Final state
        DeliveryStatus.CANCELLED: [],  # Final state
        DeliveryStatus.EXPIRED: [],    # Final state
    }
    
    # Valid transitions for BatchStatus
    BATCH_TRANSITIONS = {
        BatchStatus.PRODUCING: [BatchStatus.READY, BatchStatus.CANCELLED],
        BatchStatus.READY: [BatchStatus.IN_DELIVERY, BatchStatus.CANCELLED, BatchStatus.EXPIRED],
        BatchStatus.IN_DELIVERY: [BatchStatus.COMPLETED, BatchStatus.CANCELLED],
        BatchStatus.COMPLETED: [],  # Final state
        BatchStatus.CANCELLED: [],  # Final state
        BatchStatus.EXPIRED: [],    # Final state
    }
    
    # Valid transitions for OrderStatus
    ORDER_TRANSITIONS = {
        OrderStatus.IDLE: [OrderStatus.REQUESTING, OrderStatus.OFFERING],
        OrderStatus.REQUESTING: [OrderStatus.RESERVED, OrderStatus.CANCELLED, OrderStatus.EXPIRED],
        OrderStatus.OFFERING: [OrderStatus.RESERVED, OrderStatus.CANCELLED, OrderStatus.EXPIRED],
        OrderStatus.RESERVED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED, OrderStatus.EXPIRED],
        OrderStatus.IN_PROGRESS: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        OrderStatus.AWAITING_PICKUP: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
        OrderStatus.PICKED_UP: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
        OrderStatus.IN_TRANSIT: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        OrderStatus.PENDING_CONFIRMATION: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        OrderStatus.COMPLETED: [],  # Final state
        OrderStatus.CANCELLED: [],  # Final state
        OrderStatus.EXPIRED: [],    # Final state
    }
    
    @classmethod
    def can_transition(cls, current_status, new_status, status_type: str = "delivery") -> bool:
        """
        Check if transition from current_status to new_status is valid
        
        Args:
            current_status: Current status
            new_status: Desired new status
            status_type: Type of status ("delivery", "batch", "order")
        """
        transitions = {
            "delivery": cls.DELIVERY_TRANSITIONS,
            "batch": cls.BATCH_TRANSITIONS,
            "order": cls.ORDER_TRANSITIONS,
        }.get(status_type, {})
        
        allowed = transitions.get(current_status, [])
        return new_status in allowed
    
    @classmethod
    def get_allowed_transitions(cls, current_status, status_type: str = "delivery") -> list:
        """Get list of allowed transitions from current status"""
        transitions = {
            "delivery": cls.DELIVERY_TRANSITIONS,
            "batch": cls.BATCH_TRANSITIONS,
            "order": cls.ORDER_TRANSITIONS,
        }.get(status_type, {})
        
        return transitions.get(current_status, [])

# ============================================================================
# CONFIRMATION CODE VALIDATOR
# ============================================================================

class ConfirmationCodeValidator:
    """Validates confirmation codes"""
    
    @staticmethod
    def validate_code(code: str) -> bool:
        """Validate confirmation code format (6 digits)"""
        if not code:
            return False
        return len(code) == 6 and code.isdigit()
    
    @staticmethod
    def generate_code() -> str:
        """Generate a random 6-digit confirmation code"""
        import random
        return ''.join(random.choices('0123456789', k=6))
