"""
Router para Sistema de Inventário de Abrigos
Endpoints para controle completo de estoque
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import ShelterInventoryItem, InventoryMovement, User, Category, Delivery
from app.schemas_inventory import (
    ShelterInventoryItemCreate,
    ShelterInventoryItemUpdate,
    ShelterInventoryItemResponse,
    InventoryMovementCreate,
    InventoryMovementResponse,
    InventoryDashboard,
    InventoryMetrics,
    CategorySummary,
    AdjustQuantityRequest,
    InventoryHistoryFilter,
    InventoryItemFilter
)
from app.auth import get_current_user, require_role
from app.enums import UserRole

router = APIRouter(prefix="/api/shelter/inventory", tags=["Shelter Inventory"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_item_metrics(item: ShelterInventoryItem) -> dict:
    """Calcula métricas de um item de inventário"""
    available_stock = item.current_stock - item.reserved_quantity
    deficit = max(0, item.needed_quantity - item.current_stock - item.reserved_quantity)
    total_coverage = item.current_stock + item.reserved_quantity
    fulfillment_rate = min(100, (total_coverage / item.needed_quantity * 100) if item.needed_quantity > 0 else 100)
    is_critical = fulfillment_rate < 20 if item.needed_quantity > 0 else False
    
    return {
        "available_stock": available_stock,
        "deficit": deficit,
        "fulfillment_rate": round(fulfillment_rate, 2),
        "is_critical": is_critical
    }


def enrich_item_response(item: ShelterInventoryItem, db: Session) -> dict:
    """Enriquece resposta do item com dados relacionados"""
    item_dict = {
        "id": item.id,
        "shelter_id": item.shelter_id,
        "category_id": item.category_id,
        "needed_quantity": item.needed_quantity,
        "current_stock": item.current_stock,
        "reserved_quantity": item.reserved_quantity,
        "metadata_cache": item.metadata_cache,
        "priority": item.priority,
        "min_stock_alert": item.min_stock_alert,
        "active": item.active,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }
    
    # Adicionar métricas calculadas
    metrics = calculate_item_metrics(item)
    item_dict.update(metrics)
    
    # Adicionar dados da categoria
    if item.category:
        item_dict["category_name"] = item.category.display_name or item.category.name
        item_dict["category_icon"] = item.category.icon
        item_dict["category_color"] = item.category.color
    
    return item_dict


# ============================================================================
# INVENTORY ITEMS ENDPOINTS
# ============================================================================

@router.get("/items", response_model=List[ShelterInventoryItemResponse])
def list_inventory_items(
    category_id: Optional[int] = None,
    priority: Optional[str] = None,
    is_critical: Optional[bool] = None,
    active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os itens do inventário do abrigo"""
    
    # Verificar se é abrigo
    if UserRole.SHELTER.value not in current_user.roles.split(','):
        raise HTTPException(status_code=403, detail="Apenas abrigos podem acessar inventário")
    
    query = db.query(ShelterInventoryItem).filter(
        ShelterInventoryItem.shelter_id == current_user.id
    )
    
    # Aplicar filtros
    if active is not None:
        query = query.filter(ShelterInventoryItem.active == active)
    if category_id:
        query = query.filter(ShelterInventoryItem.category_id == category_id)
    if priority:
        query = query.filter(ShelterInventoryItem.priority == priority)
    
    items = query.all()
    
    # Enriquecer respostas
    enriched_items = [enrich_item_response(item, db) for item in items]
    
    # Filtrar por is_critical se necessário
    if is_critical is not None:
        enriched_items = [item for item in enriched_items if item["is_critical"] == is_critical]
    
    return enriched_items


@router.post("/items", response_model=ShelterInventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_data: ShelterInventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria novo item no inventário"""
    
    # Verificar se é abrigo
    if UserRole.SHELTER.value not in current_user.roles.split(','):
        raise HTTPException(status_code=403, detail="Apenas abrigos podem criar itens de inventário")
    
    # Verificar se categoria existe
    category = db.query(Category).filter(Category.id == item_data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    # Verificar se já existe item para esta categoria
    existing = db.query(ShelterInventoryItem).filter(
        and_(
            ShelterInventoryItem.shelter_id == current_user.id,
            ShelterInventoryItem.category_id == item_data.category_id,
            ShelterInventoryItem.active == True
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Já existe um item ativo para a categoria {category.display_name}"
        )
    
    # Criar item
    new_item = ShelterInventoryItem(
        shelter_id=current_user.id,
        **item_data.model_dump()
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return enrich_item_response(new_item, db)


@router.get("/items/{item_id}", response_model=ShelterInventoryItemResponse)
def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtém detalhes de um item específico"""
    
    item = db.query(ShelterInventoryItem).filter(
        and_(
            ShelterInventoryItem.id == item_id,
            ShelterInventoryItem.shelter_id == current_user.id
        )
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    return enrich_item_response(item, db)


@router.put("/items/{item_id}", response_model=ShelterInventoryItemResponse)
def update_inventory_item(
    item_id: int,
    item_data: ShelterInventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza item do inventário"""
    
    item = db.query(ShelterInventoryItem).filter(
        and_(
            ShelterInventoryItem.id == item_id,
            ShelterInventoryItem.shelter_id == current_user.id
        )
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    # Atualizar campos fornecidos
    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    item.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(item)
    
    return enrich_item_response(item, db)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: int,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove item do inventário (com validações)"""
    
    item = db.query(ShelterInventoryItem).filter(
        and_(
            ShelterInventoryItem.id == item_id,
            ShelterInventoryItem.shelter_id == current_user.id
        )
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    # Validações
    if item.reserved_quantity > 0 and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Há {item.reserved_quantity} unidades em trânsito. Não é possível remover."
        )
    
    if item.current_stock > 0 and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Há {item.current_stock} unidades em estoque. Não é possível remover."
        )
    
    # Soft delete
    item.active = False
    item.updated_at = datetime.utcnow()
    
    db.commit()
    
    return None


# ============================================================================
# QUANTITY ADJUSTMENT
# ============================================================================

@router.post("/items/{item_id}/adjust", response_model=ShelterInventoryItemResponse)
def adjust_needed_quantity(
    item_id: int,
    adjustment: AdjustQuantityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajusta quantidade necessária de um item"""
    
    item = db.query(ShelterInventoryItem).filter(
        and_(
            ShelterInventoryItem.id == item_id,
            ShelterInventoryItem.shelter_id == current_user.id
        )
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    old_quantity = item.needed_quantity
    item.needed_quantity = adjustment.new_quantity
    item.updated_at = datetime.utcnow()
    
    # Registrar ajuste como movimentação (para histórico)
    if adjustment.notes:
        movement = InventoryMovement(
            inventory_item_id=item.id,
            movement_type='adjustment',
            quantity=abs(adjustment.new_quantity - old_quantity),
            source_type='adjustment',
            notes=f"Ajuste de necessidade: {old_quantity} → {adjustment.new_quantity}. {adjustment.notes}",
            created_by=current_user.id
        )
        db.add(movement)
    
    db.commit()
    db.refresh(item)
    
    return enrich_item_response(item, db)


# ============================================================================
# INVENTORY MOVEMENTS
# ============================================================================

@router.post("/movements", response_model=InventoryMovementResponse, status_code=status.HTTP_201_CREATED)
def create_movement(
    movement_data: InventoryMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registra movimentação de estoque (entrada/saída)"""
    
    # Verificar se item existe e pertence ao abrigo
    item = db.query(ShelterInventoryItem).filter(
        and_(
            ShelterInventoryItem.id == movement_data.inventory_item_id,
            ShelterInventoryItem.shelter_id == current_user.id
        )
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item de inventário não encontrado")
    
    # Validar tipo de movimentação
    if movement_data.movement_type not in ['in', 'out']:
        raise HTTPException(status_code=400, detail="Tipo de movimentação inválido. Use 'in' ou 'out'")
    
    # Validar estoque para saída
    if movement_data.movement_type == 'out':
        if item.current_stock < movement_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente. Disponível: {item.current_stock}"
            )
    
    # Criar movimentação
    movement = InventoryMovement(
        created_by=current_user.id,
        **movement_data.model_dump()
    )
    
    db.add(movement)
    
    # Atualizar estoque
    if movement_data.movement_type == 'in':
        item.current_stock += movement_data.quantity
    else:  # 'out'
        item.current_stock -= movement_data.quantity
    
    item.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(movement)
    
    # Enriquecer resposta
    response = {
        "id": movement.id,
        "inventory_item_id": movement.inventory_item_id,
        "movement_type": movement.movement_type,
        "quantity": movement.quantity,
        "source_type": movement.source_type,
        "notes": movement.notes,
        "extra_data": movement.extra_data,
        "delivery_id": movement.delivery_id,
        "created_by": movement.created_by,
        "created_at": movement.created_at,
        "created_by_name": current_user.name
    }
    
    return response


@router.get("/items/{item_id}/movements", response_model=List[InventoryMovementResponse])
def get_item_movements(
    item_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista movimentações de um item específico"""
    
    # Verificar se item pertence ao abrigo
    item = db.query(ShelterInventoryItem).filter(
        and_(
            ShelterInventoryItem.id == item_id,
            ShelterInventoryItem.shelter_id == current_user.id
        )
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    movements = db.query(InventoryMovement).filter(
        InventoryMovement.inventory_item_id == item_id
    ).order_by(InventoryMovement.created_at.desc()).limit(limit).offset(offset).all()
    
    # Enriquecer respostas
    enriched = []
    for mov in movements:
        user = db.query(User).filter(User.id == mov.created_by).first()
        enriched.append({
            "id": mov.id,
            "inventory_item_id": mov.inventory_item_id,
            "movement_type": mov.movement_type,
            "quantity": mov.quantity,
            "source_type": mov.source_type,
            "notes": mov.notes,
            "metadata": mov.metadata,
            "delivery_id": mov.delivery_id,
            "created_by": mov.created_by,
            "created_at": mov.created_at,
            "created_by_name": user.name if user else "Desconhecido"
        })
    
    return enriched


# ============================================================================
# DASHBOARD & METRICS
# ============================================================================

@router.get("/dashboard", response_model=InventoryDashboard)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna dashboard completo com métricas e dados"""
    
    # Verificar se é abrigo
    if UserRole.SHELTER.value not in current_user.roles.split(','):
        raise HTTPException(status_code=403, detail="Apenas abrigos podem acessar dashboard")
    
    # Buscar todos os itens ativos
    items = db.query(ShelterInventoryItem).filter(
        and_(
            ShelterInventoryItem.shelter_id == current_user.id,
            ShelterInventoryItem.active == True
        )
    ).all()
    
    # Calcular métricas
    total_items = len(items)
    critical_items = 0
    items_in_transit = 0
    
    enriched_items = []
    for item in items:
        enriched = enrich_item_response(item, db)
        enriched_items.append(enriched)
        
        if enriched["is_critical"]:
            critical_items += 1
        if item.reserved_quantity > 0:
            items_in_transit += 1
    
    # Movimentações de hoje
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    received_today = db.query(func.sum(InventoryMovement.quantity)).filter(
        and_(
            InventoryMovement.inventory_item_id.in_([item.id for item in items]),
            InventoryMovement.movement_type == 'in',
            InventoryMovement.created_at >= today_start
        )
    ).scalar() or 0
    
    distributed_today = db.query(func.sum(InventoryMovement.quantity)).filter(
        and_(
            InventoryMovement.inventory_item_id.in_([item.id for item in items]),
            InventoryMovement.movement_type == 'out',
            InventoryMovement.created_at >= today_start
        )
    ).scalar() or 0
    
    # Taxa média de atendimento
    avg_fulfillment = sum(item["fulfillment_rate"] for item in enriched_items) / total_items if total_items > 0 else 0
    
    metrics = {
        "total_items": total_items,
        "critical_items": critical_items,
        "items_in_transit": items_in_transit,
        "received_today": int(received_today),
        "distributed_today": int(distributed_today),
        "total_stock_value": sum(item.current_stock for item in items),
        "avg_fulfillment_rate": round(avg_fulfillment, 2)
    }
    
    # Resumo por categoria
    category_summary = []
    categories = db.query(Category).all()
    
    for cat in categories:
        cat_items = [item for item in enriched_items if item["category_id"] == cat.id]
        if cat_items:
            category_summary.append({
                "category_id": cat.id,
                "category_name": cat.display_name or cat.name,
                "category_icon": cat.icon,
                "category_color": cat.color,
                "total_needed": sum(item["needed_quantity"] for item in cat_items),
                "total_stock": sum(item["current_stock"] for item in cat_items),
                "total_reserved": sum(item["reserved_quantity"] for item in cat_items),
                "total_deficit": sum(item["deficit"] for item in cat_items),
                "item_count": len(cat_items),
                "fulfillment_rate": sum(item["fulfillment_rate"] for item in cat_items) / len(cat_items)
            })
    
    # Movimentações recentes
    recent_movements = db.query(InventoryMovement).filter(
        InventoryMovement.inventory_item_id.in_([item.id for item in items])
    ).order_by(InventoryMovement.created_at.desc()).limit(10).all()
    
    enriched_movements = []
    for mov in recent_movements:
        user = db.query(User).filter(User.id == mov.created_by).first()
        enriched_movements.append({
            "id": mov.id,
            "inventory_item_id": mov.inventory_item_id,
            "movement_type": mov.movement_type,
            "quantity": mov.quantity,
            "source_type": mov.source_type,
            "notes": mov.notes,
            "metadata": mov.metadata,
            "delivery_id": mov.delivery_id,
            "created_by": mov.created_by,
            "created_at": mov.created_at,
            "created_by_name": user.name if user else "Desconhecido"
        })
    
    return {
        "metrics": metrics,
        "items": enriched_items,
        "category_summary": category_summary,
        "recent_movements": enriched_movements
    }
