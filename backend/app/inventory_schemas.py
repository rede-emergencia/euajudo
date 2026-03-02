"""
Pydantic schemas for inventory management
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.inventory_models import TransactionType

# ============================================================================
# INVENTORY ITEM SCHEMAS
# ============================================================================

class InventoryItemBase(BaseModel):
    category_id: int
    quantity_in_stock: int = 0
    quantity_reserved: int = 0
    min_threshold: int = 0
    max_threshold: Optional[int] = None
    metadata_cache: Optional[Dict[str, Any]] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    quantity_in_stock: Optional[int] = None
    min_threshold: Optional[int] = None
    max_threshold: Optional[int] = None
    metadata_cache: Optional[Dict[str, Any]] = None

class InventoryItemResponse(InventoryItemBase):
    id: int
    shelter_id: int
    quantity_available: int
    created_at: datetime
    updated_at: datetime
    last_transaction_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# INVENTORY TRANSACTION SCHEMAS
# ============================================================================

class InventoryTransactionCreate(BaseModel):
    inventory_item_id: int
    transaction_type: TransactionType
    quantity_change: int
    delivery_id: Optional[int] = None
    notes: Optional[str] = None
    transaction_metadata: Optional[Dict[str, Any]] = None

class InventoryTransactionResponse(BaseModel):
    id: int
    inventory_item_id: int
    transaction_type: TransactionType
    quantity_change: int
    balance_after: int
    reserved_after: int
    available_after: int
    delivery_id: Optional[int] = None
    user_id: Optional[int] = None
    notes: Optional[str] = None
    transaction_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# SHELTER REQUEST SCHEMAS
# ============================================================================

class ShelterRequestCreate(BaseModel):
    category_id: int
    quantity_requested: int = Field(..., gt=0)
    metadata_cache: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ShelterRequestUpdate(BaseModel):
    quantity_requested: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = None

class ShelterRequestResponse(BaseModel):
    id: int
    shelter_id: int
    category_id: int
    quantity_requested: int
    quantity_received: int
    quantity_pending: int
    quantity_cancelled: int
    status: str
    metadata_cache: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# REQUEST ADJUSTMENT SCHEMAS
# ============================================================================

class RequestAdjustmentCreate(BaseModel):
    adjustment_type: str = Field(..., pattern="^(increase|decrease|cancel)$")
    quantity_change: int
    reason: Optional[str] = None

class RequestAdjustmentResponse(BaseModel):
    id: int
    request_id: int
    adjustment_type: str
    quantity_before: int
    quantity_after: int
    quantity_change: int
    reason: Optional[str] = None
    can_adjust: bool
    warning_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# DISTRIBUTION RECORD SCHEMAS
# ============================================================================

class DistributionRecordCreate(BaseModel):
    category_id: int
    quantity: int = Field(..., gt=0)
    recipient_name: Optional[str] = None
    recipient_document: Optional[str] = None
    notes: Optional[str] = None
    distribution_metadata: Optional[Dict[str, Any]] = None

class DistributionRecordResponse(BaseModel):
    id: int
    shelter_id: int
    category_id: int
    quantity: int
    recipient_name: Optional[str] = None
    recipient_document: Optional[str] = None
    notes: Optional[str] = None
    distribution_metadata: Optional[Dict[str, Any]] = None
    status: str = "active"
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    distributed_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class DistributionRecordUpdate(BaseModel):
    quantity: Optional[int] = Field(None, gt=0)
    recipient_name: Optional[str] = None
    recipient_document: Optional[str] = None
    notes: Optional[str] = None

class DistributionRecordCancel(BaseModel):
    reason: Optional[str] = None

# ============================================================================
# DASHBOARD ANALYTICS SCHEMAS
# ============================================================================

class InventoryStats(BaseModel):
    total_items_in_stock: int
    total_categories: int
    low_stock_items: int
    total_received_this_month: int
    total_distributed_this_month: int
    pending_requests: int
    active_requests: int

class CategoryStock(BaseModel):
    id: int  # InventoryItem ID - needed for updates
    category_id: int
    category_name: str
    quantity_in_stock: int
    quantity_reserved: int
    quantity_available: int
    min_threshold: int
    is_low_stock: bool

class RecentActivity(BaseModel):
    transaction_type: str
    category_name: str
    quantity: int
    created_at: datetime
    notes: Optional[str] = None

class ShelterDashboardData(BaseModel):
    stats: InventoryStats
    inventory_by_category: List[CategoryStock]
    recent_transactions: List[RecentActivity]
    active_requests: List[ShelterRequestResponse]
    low_stock_alerts: List[CategoryStock]
