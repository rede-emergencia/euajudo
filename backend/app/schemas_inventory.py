"""
Schemas Pydantic para o Sistema de Inventário de Abrigos
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============================================================================
# SHELTER INVENTORY ITEM SCHEMAS
# ============================================================================

class ShelterInventoryItemBase(BaseModel):
    """Base schema para item de inventário"""
    category_id: int = Field(..., description="ID da categoria do item")
    needed_quantity: float = Field(..., gt=0, description="Quantidade necessária")
    metadata_cache: Optional[dict] = Field(default={}, description="Metadados específicos do item")
    priority: Optional[str] = Field(default="medium", description="Prioridade: urgent, high, medium, low")
    min_stock_alert: Optional[float] = Field(None, description="Alerta de estoque mínimo")


class ShelterInventoryItemCreate(ShelterInventoryItemBase):
    """Schema para criar item de inventário"""
    pass


class ShelterInventoryItemUpdate(BaseModel):
    """Schema para atualizar item de inventário"""
    needed_quantity: Optional[float] = Field(None, gt=0)
    metadata_cache: Optional[dict] = None
    priority: Optional[str] = None
    min_stock_alert: Optional[float] = None
    active: Optional[bool] = None


class ShelterInventoryItemResponse(ShelterInventoryItemBase):
    """Schema de resposta para item de inventário"""
    id: int
    shelter_id: int
    current_stock: float
    reserved_quantity: float
    active: bool
    created_at: datetime
    updated_at: datetime
    
    # Campos calculados
    available_stock: Optional[float] = Field(None, description="Estoque disponível (current - reserved)")
    deficit: Optional[float] = Field(None, description="Déficit (needed - current - reserved)")
    fulfillment_rate: Optional[float] = Field(None, description="Taxa de atendimento em %")
    is_critical: Optional[bool] = Field(None, description="Se está em nível crítico")
    
    # Relacionamentos expandidos
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============================================================================
# INVENTORY MOVEMENT SCHEMAS
# ============================================================================

class InventoryMovementBase(BaseModel):
    """Base schema para movimentação de estoque"""
    movement_type: str = Field(..., description="Tipo: 'in' ou 'out'")
    quantity: float = Field(..., gt=0, description="Quantidade movimentada")
    source_type: str = Field(..., description="Origem: donation, purchase, distribution, loss, adjustment")
    notes: Optional[str] = Field(None, description="Observações")
    extra_data: Optional[dict] = Field(default={})


class InventoryMovementCreate(InventoryMovementBase):
    """Schema para criar movimentação"""
    inventory_item_id: int = Field(..., description="ID do item de inventário")
    delivery_id: Optional[int] = Field(None, description="ID da entrega (se aplicável)")


class InventoryMovementResponse(InventoryMovementBase):
    """Schema de resposta para movimentação"""
    id: int
    inventory_item_id: int
    delivery_id: Optional[int]
    created_by: int
    created_at: datetime
    
    # Relacionamentos expandidos
    created_by_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============================================================================
# DASHBOARD & METRICS SCHEMAS
# ============================================================================

class InventoryMetrics(BaseModel):
    """Métricas do dashboard de inventário"""
    total_items: int = Field(..., description="Total de itens ativos")
    critical_items: int = Field(..., description="Itens em nível crítico")
    items_in_transit: int = Field(..., description="Itens com entregas em trânsito")
    received_today: int = Field(..., description="Itens recebidos hoje")
    distributed_today: int = Field(..., description="Itens distribuídos hoje")
    total_stock_value: float = Field(..., description="Valor total do estoque")
    avg_fulfillment_rate: float = Field(..., description="Taxa média de atendimento")


class CategorySummary(BaseModel):
    """Resumo por categoria"""
    category_id: int
    category_name: str
    category_icon: Optional[str]
    category_color: Optional[str]
    total_needed: float
    total_stock: float
    total_reserved: float
    total_deficit: float
    item_count: int
    fulfillment_rate: float


class InventoryDashboard(BaseModel):
    """Dashboard completo de inventário"""
    metrics: InventoryMetrics
    items: List[ShelterInventoryItemResponse]
    category_summary: List[CategorySummary]
    recent_movements: List[InventoryMovementResponse]


# ============================================================================
# ADJUSTMENT SCHEMAS
# ============================================================================

class AdjustQuantityRequest(BaseModel):
    """Request para ajustar quantidade necessária"""
    new_quantity: float = Field(..., gt=0, description="Nova quantidade necessária")
    notes: Optional[str] = Field(None, description="Motivo do ajuste")


class BulkMovementRequest(BaseModel):
    """Request para movimentação em lote"""
    movements: List[InventoryMovementCreate] = Field(..., description="Lista de movimentações")


# ============================================================================
# HISTORY & FILTERS
# ============================================================================

class InventoryHistoryFilter(BaseModel):
    """Filtros para histórico de movimentações"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    movement_type: Optional[str] = None  # 'in' ou 'out'
    source_type: Optional[str] = None
    limit: Optional[int] = Field(50, le=200)
    offset: Optional[int] = 0


class InventoryItemFilter(BaseModel):
    """Filtros para itens de inventário"""
    category_id: Optional[int] = None
    priority: Optional[str] = None
    is_critical: Optional[bool] = None
    active: Optional[bool] = True
    search: Optional[str] = None
