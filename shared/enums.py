"""
Enums compartilhados entre frontend e backend
Arquivo central para evitar inconsistências de case sensitivity
"""

from enum import Enum

# ============================================================================
# ORDER STATUS ENUM
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

# ============================================================================
# BATCH STATUS ENUM  
# ============================================================================
class BatchStatus(str, Enum):
    """
    Status for product batches
    """
    PRODUCING = "producing"                   # Being prepared
    READY = "ready"                           # Available for pickup
    RESERVED = "reserved"                     # Reserved by someone
    PICKED_UP = "picked_up"                   # Picked up by volunteer
    DELIVERED = "delivered"                   # Delivered to destination
    CANCELLED = "cancelled"                   # Cancelled
    EXPIRED = "expired"                       # Expired (not picked up in time)

# ============================================================================
# PRODUCT TYPE ENUM
# ============================================================================
class ProductType(str, Enum):
    """
    Types of products that can be exchanged
    """
    MEAL = "meal"                             # Ready meals/marmitas
    INGREDIENT = "ingredient"                 # Raw ingredients
    CLOTHING = "clothing"                     # Clothes and accessories
    HYGIENE = "hygiene"                       # Personal hygiene items
    CLEANING = "cleaning"                     # Cleaning supplies
    SCHOOL_SUPPLIES = "school_supplies"       # School/education items
    BABY_ITEMS = "baby_items"                 # Baby supplies
    PET_SUPPLIES = "pet_supplies"             # Pet food and supplies

# ============================================================================
# USER ROLES ENUM
# ============================================================================
class UserRole(str, Enum):
    """
    User roles in the system
    """
    PROVIDER = "provider"                     # Food providers/restaurants
    VOLUNTEER = "volunteer"                   # Delivery volunteers
    SHELTER = "shelter"                       # Shelter organizations
    ADMIN = "admin"                           # System administrators

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def format_order_status(status: str) -> str:
    """Retorna o display format para um status de order"""
    status_map = {
        OrderStatus.IDLE: "Inativo",
        OrderStatus.REQUESTING: "Solicitando",
        OrderStatus.OFFERING: "Ofertando",
        OrderStatus.RESERVED: "Reservado",
        OrderStatus.IN_PROGRESS: "Em Andamento",
        OrderStatus.AWAITING_PICKUP: "Aguardando Retirada",
        OrderStatus.PICKED_UP: "Retirado",
        OrderStatus.IN_TRANSIT: "Em Trânsito",
        OrderStatus.PENDING_CONFIRMATION: "Pendente Confirmação",
        OrderStatus.COMPLETED: "Concluído",
        OrderStatus.CANCELLED: "Cancelado"
    }
    
    return status_map.get(status, status)

def format_batch_status(status: str) -> str:
    """Retorna o display format para um status de batch"""
    status_map = {
        BatchStatus.PRODUCING: "Produzindo",
        BatchStatus.READY: "Disponível",
        BatchStatus.RESERVED: "Reservado",
        BatchStatus.PICKED_UP: "Retirado",
        BatchStatus.DELIVERED: "Entregue",
        BatchStatus.CANCELLED: "Cancelado",
        BatchStatus.EXPIRED: "Expirado"
    }
    
    return status_map.get(status, status)

def format_product_type(product_type: str) -> str:
    """Retorna o display format para um tipo de produto"""
    type_map = {
        ProductType.MEAL: "Marmitas",
        ProductType.INGREDIENT: "Insumos",
        ProductType.CLOTHING: "Roupas",
        ProductType.HYGIENE: "Higiene",
        ProductType.CLEANING: "Limpeza",
        ProductType.SCHOOL_SUPPLIES: "Material Escolar",
        ProductType.BABY_ITEMS: "Itens de Bebê",
        ProductType.PET_SUPPLIES: "Itens para Pets"
    }
    
    return type_map.get(product_type, product_type)

def get_order_status_color(status: str) -> str:
    """Retorna a classe CSS para um status de order"""
    color_map = {
        OrderStatus.IDLE: "bg-gray-100 text-gray-800",
        OrderStatus.REQUESTING: "bg-blue-100 text-blue-800",
        OrderStatus.OFFERING: "bg-yellow-100 text-yellow-800",
        OrderStatus.RESERVED: "bg-purple-100 text-purple-800",
        OrderStatus.IN_PROGRESS: "bg-orange-100 text-orange-800",
        OrderStatus.AWAITING_PICKUP: "bg-indigo-100 text-indigo-800",
        OrderStatus.PICKED_UP: "bg-cyan-100 text-cyan-800",
        OrderStatus.IN_TRANSIT: "bg-teal-100 text-teal-800",
        OrderStatus.PENDING_CONFIRMATION: "bg-pink-100 text-pink-800",
        OrderStatus.COMPLETED: "bg-green-100 text-green-800",
        OrderStatus.CANCELLED: "bg-red-100 text-red-800"
    }
    
    return color_map.get(status, "bg-gray-100 text-gray-800")

def get_batch_status_color(status: str) -> str:
    """Retorna a classe CSS para um status de batch"""
    color_map = {
        BatchStatus.PRODUCING: "bg-yellow-100 text-yellow-800",
        BatchStatus.READY: "bg-green-100 text-green-800",
        BatchStatus.RESERVED: "bg-purple-100 text-purple-800",
        BatchStatus.PICKED_UP: "bg-blue-100 text-blue-800",
        BatchStatus.DELIVERED: "bg-gray-100 text-gray-800",
        BatchStatus.CANCELLED: "bg-red-100 text-red-800",
        BatchStatus.EXPIRED: "bg-orange-100 text-orange-800"
    }
    
    return color_map.get(status, "bg-gray-100 text-gray-800")
