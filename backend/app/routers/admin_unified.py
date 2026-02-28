"""
Admin Unified Router - Painel Administrativo Profissional
Estrutura organizada e intuitiva para gestão do sistema
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import require_admin
from app.models import (
    User, DeliveryLocation, Category, CategoryAttribute,
    Delivery, ProductBatch
)
from app.schemas import UserResponse, DeliveryLocationResponse
from app.category_schemas import CategoryResponse, CategoryAttributeResponse
from app.enums import UserRole

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ============================================================================
# DASHBOARD & OVERVIEW
# ============================================================================

@router.get("/dashboard", response_model=Dict[str, Any])
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Overview completo do sistema para o dashboard admin.
    Retorna métricas principais e itens pendentes.
    """
    # Métricas de usuários
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.active == True).count()
    pending_users = db.query(User).filter(
        User.approved == False,
        User.active == True
    ).count()
    
    volunteers_total = db.query(User).filter(User.roles.like("%volunteer%")).count()
    volunteers_active = db.query(User).filter(
        User.roles.like("%volunteer%"),
        User.approved == True,
        User.active == True
    ).count()
    
    shelters_total = db.query(User).filter(User.roles.like(f"%{UserRole.SHELTER.value}%")).count()
    shelters_active = db.query(User).filter(
        User.roles.like(f"%{UserRole.SHELTER.value}%"),
        User.approved == True,
        User.active == True
    ).count()
    
    # Métricas de abrigos (locations)
    total_locations = db.query(DeliveryLocation).count()
    active_locations = db.query(DeliveryLocation).filter(
        DeliveryLocation.active == True,
        DeliveryLocation.approved == True
    ).count()
    pending_locations = db.query(DeliveryLocation).filter(
        DeliveryLocation.approved == False,
        DeliveryLocation.active == True
    ).count()
    
    total_capacity = db.query(func.sum(DeliveryLocation.capacity)).scalar() or 0
    total_daily_need = db.query(func.sum(DeliveryLocation.daily_need)).scalar() or 0
    
    # Métricas de categorias
    total_categories = db.query(Category).count()
    active_categories = db.query(Category).filter(Category.active == True).count()
    
    # Métricas de pedidos
    total_deliveries = db.query(Delivery).count()
    pending_deliveries = db.query(Delivery).filter(
        Delivery.status == "available"
    ).count()
    in_progress_deliveries = db.query(Delivery).filter(
        Delivery.status.in_(["reserved", "picked_up", "in_transit"])
    ).count()
    
    # Itens pendentes (resumo)
    pending_items = {
        "users_pending_approval": pending_users,
        "locations_pending_approval": pending_locations,
        "deliveries_pending_acceptance": pending_deliveries
    }
    
    return {
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "pending_approvals": pending_users + pending_locations,
            "total_capacity": int(total_capacity),
            "total_daily_need": int(total_daily_need),
            "active_categories": active_categories
        },
        "users": {
            "total": total_users,
            "active": active_users,
            "pending": pending_users,
            "volunteers": {
                "total": volunteers_total,
                "active": volunteers_active
            },
            "shelters": {
                "total": shelters_total,
                "active": shelters_active
            }
        },
        "locations": {
            "total": total_locations,
            "active": active_locations,
            "pending": pending_locations,
            "total_capacity": int(total_capacity),
            "total_daily_need": int(total_daily_need)
        },
        "deliveries": {
            "total": total_deliveries,
            "pending": pending_deliveries,
            "in_progress": in_progress_deliveries
        },
        "categories": {
            "total": total_categories,
            "active": active_categories
        },
        "pending_items": pending_items,
        "last_updated": datetime.utcnow().isoformat()
    }

# ============================================================================
# USER MANAGEMENT - GESTÃO UNIFICADA DE USUÁRIOS
# ============================================================================

@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = Query(None, description="Filtrar por role: admin, volunteer, shelter, provider"),
    status: Optional[str] = Query(None, description="Filtrar por status: active, inactive, pending"),
    search: Optional[str] = Query(None, description="Buscar por nome ou email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Lista todos os usuários com filtros opcionais.
    Endpoint unificado para ver todos os tipos de usuários.
    """
    query = db.query(User)
    
    # Filtro por role
    if role:
        query = query.filter(User.roles.like(f"%{role}%"))
    
    # Filtro por status
    if status == "active":
        query = query.filter(User.active == True, User.approved == True)
    elif status == "inactive":
        query = query.filter(User.active == False)
    elif status == "pending":
        query = query.filter(User.approved == False, User.active == True)
    
    # Busca por nome ou email
    if search:
        search_filter = or_(
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    users = query.order_by(User.created_at.desc()).all()
    return users

@router.get("/users/pending", response_model=List[UserResponse])
def list_pending_users(
    role: Optional[str] = Query(None, description="Filtrar por role específico"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Lista usuários pendentes de aprovação.
    Pode filtrar por role específico.
    """
    query = db.query(User).filter(
        User.approved == False,
        User.active == True
    )
    
    if role:
        query = query.filter(User.roles.like(f"%{role}%"))
    
    return query.order_by(User.created_at.desc()).all()

@router.post("/users/{user_id}/approve")
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Aprova um usuário pendente"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user.approved = True
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Usuário {user.name} aprovado com sucesso",
        "user": user
    }

@router.post("/users/{user_id}/reject")
def reject_user(
    user_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Rejeita um usuário (desativa sem aprovar)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Não pode rejeitar a si mesmo")
    
    user.active = False
    user.approved = False
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Usuário {user.name} rejeitado",
        "reason": reason,
        "user": user
    }

@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Ativa ou desativa um usuário"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Não pode alterar seu próprio status")
    
    user.active = not user.active
    db.commit()
    db.refresh(user)
    
    status_text = "ativado" if user.active else "desativado"
    return {
        "message": f"Usuário {user.name} {status_text}",
        "active": user.active,
        "user": user
    }

@router.get("/users/{user_id}/details", response_model=Dict[str, Any])
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Retorna detalhes completos de um usuário incluindo:
    - Informações básicas
    - Deliveries associadas (se for voluntário)
    - Location associado (se for abrigo)
    - Batches criados (se for provider)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    result = {
        "user": user,
        "roles": user.roles.split(","),
        "stats": {}
    }
    
    # Se for voluntário, buscar deliveries
    if "volunteer" in user.roles:
        deliveries = db.query(Delivery).filter(Delivery.volunteer_id == user_id).all()
        result["stats"]["total_deliveries"] = len(deliveries)
        result["stats"]["completed_deliveries"] = len([d for d in deliveries if d.status == "delivered"])
    
    # Se for abrigo, buscar location
    if UserRole.SHELTER.value in user.roles:
        location = db.query(DeliveryLocation).filter(DeliveryLocation.user_id == user_id).first()
        result["location"] = location
        if location:
            location_deliveries = db.query(Delivery).filter(Delivery.location_id == location.id).all()
            result["stats"]["total_requests"] = len(location_deliveries)
            result["stats"]["pending_requests"] = len([d for d in location_deliveries if d.status == "available"])
    
    # Se for provider, buscar batches
    if "provider" in user.roles:
        batches = db.query(ProductBatch).filter(ProductBatch.provider_id == user_id).all()
        result["stats"]["total_batches"] = len(batches)
        result["stats"]["active_batches"] = len([b for b in batches if b.status == "producing"])
    
    return result

# ============================================================================
# SHELTER/LOCATION MANAGEMENT - GESTÃO DE ABRIGOS
# ============================================================================

@router.get("/shelters", response_model=List[Dict[str, Any]])
def list_shelters(
    status: Optional[str] = Query(None, description="Filtrar por status: active, inactive, pending"),
    city: Optional[str] = Query(None, description="Filtrar por cidade"),
    search: Optional[str] = Query(None, description="Buscar por nome ou endereço"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Lista todos os abrigos (DeliveryLocations) com filtros.
    Inclui informações do usuário dono se existir.
    """
    query = db.query(DeliveryLocation)
    
    # Filtro por status
    if status == "active":
        query = query.filter(DeliveryLocation.active == True, DeliveryLocation.approved == True)
    elif status == "inactive":
        query = query.filter(DeliveryLocation.active == False)
    elif status == "pending":
        query = query.filter(DeliveryLocation.approved == False, DeliveryLocation.active == True)
    
    # Filtro por cidade
    if city:
        query = query.filter(DeliveryLocation.city_id == city)
    
    # Busca
    if search:
        search_filter = or_(
            DeliveryLocation.name.ilike(f"%{search}%"),
            DeliveryLocation.address.ilike(f"%{search}%"),
            DeliveryLocation.contact_person.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    locations = query.order_by(DeliveryLocation.created_at.desc()).all()
    
    # Enriquecer com dados do usuário
    enriched_locations = []
    for loc in locations:
        loc_data = {
            "id": loc.id,
            "name": loc.name,
            "address": loc.address,
            "city_id": loc.city_id,
            "phone": loc.phone,
            "contact_person": loc.contact_person,
            "capacity": loc.capacity,
            "daily_need": loc.daily_need,
            "active": loc.active,
            "approved": loc.approved,
            "created_at": loc.created_at,
            "user_id": loc.user_id
        }
        
        if loc.user_id:
            user = db.query(User).filter(User.id == loc.user_id).first()
            if user:
                loc_data["user"] = {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "active": user.active,
                    "approved": user.approved
                }
        
        enriched_locations.append(loc_data)
    
    return enriched_locations

@router.get("/shelters/pending", response_model=List[Dict[str, Any]])
def list_pending_shelters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Lista abrigos pendentes de aprovação.
    Mostra abrigos que precisam ser aprovados pelo admin.
    """
    locations = db.query(DeliveryLocation).filter(
        DeliveryLocation.approved == False,
        DeliveryLocation.active == True
    ).order_by(DeliveryLocation.created_at.desc()).all()
    
    result = []
    for loc in locations:
        loc_data = {
            "id": loc.id,
            "name": loc.name,
            "address": loc.address,
            "capacity": loc.capacity,
            "daily_need": loc.daily_need,
            "contact_person": loc.contact_person,
            "phone": loc.phone,
            "created_at": loc.created_at,
            "user_id": loc.user_id
        }
        
        # Buscar usuário associado
        if loc.user_id:
            user = db.query(User).filter(User.id == loc.user_id).first()
            if user:
                loc_data["requested_by"] = {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "created_at": user.created_at
                }
        
        result.append(loc_data)
    
    return result

@router.get("/shelters/{shelter_id}/details", response_model=Dict[str, Any])
def get_shelter_details(
    shelter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Retorna detalhes completos de um abrigo incluindo:
    - Informações do location
    - Usuário associado
    - Deliveries/pedidos ativos
    - Histórico de entregas
    """
    location = db.query(DeliveryLocation).filter(DeliveryLocation.id == shelter_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Abrigo não encontrado")
    
    result = {
        "location": location,
        "stats": {}
    }
    
    # Usuário associado
    if location.user_id:
        user = db.query(User).filter(User.id == location.user_id).first()
        result["user"] = user
    
    # Deliveries do abrigo
    deliveries = db.query(Delivery).filter(Delivery.location_id == shelter_id).all()
    
    result["stats"]["total_deliveries"] = len(deliveries)
    result["stats"]["pending_deliveries"] = len([d for d in deliveries if d.status == "available"])
    result["stats"]["in_progress_deliveries"] = len([d for d in deliveries if d.status in ["reserved", "picked_up"]])
    result["stats"]["completed_deliveries"] = len([d for d in deliveries if d.status == "delivered"])
    
    # Deliveries recentes
    recent_deliveries = db.query(Delivery).filter(
        Delivery.location_id == shelter_id
    ).order_by(Delivery.created_at.desc()).limit(10).all()
    
    result["recent_deliveries"] = recent_deliveries
    
    return result

@router.post("/shelters/{shelter_id}/approve")
def approve_shelter(
    shelter_id: int,
    approve_user_too: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Aprova um abrigo e opcionalmente o usuário associado.
    """
    location = db.query(DeliveryLocation).filter(DeliveryLocation.id == shelter_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Abrigo não encontrado")
    
    location.approved = True
    
    # Aprovar usuário associado também se solicitado
    if approve_user_too and location.user_id:
        user = db.query(User).filter(User.id == location.user_id).first()
        if user:
            user.approved = True
    
    db.commit()
    db.refresh(location)
    
    return {
        "message": f"Abrigo '{location.name}' aprovado com sucesso",
        "location": location,
        "user_approved": approve_user_too and location.user_id is not None
    }

@router.post("/shelters/{shelter_id}/reject")
def reject_shelter(
    shelter_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Rejeita um abrigo (desativa sem aprovar)"""
    location = db.query(DeliveryLocation).filter(DeliveryLocation.id == shelter_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Abrigo não encontrado")
    
    location.active = False
    location.approved = False
    
    db.commit()
    db.refresh(location)
    
    return {
        "message": f"Abrigo '{location.name}' rejeitado",
        "reason": reason,
        "location": location
    }

@router.patch("/shelters/{shelter_id}")
def update_shelter(
    shelter_id: int,
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Atualiza informações de um abrigo"""
    location = db.query(DeliveryLocation).filter(DeliveryLocation.id == shelter_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Abrigo não encontrado")
    
    # Campos permitidos para atualização
    allowed_fields = ["name", "address", "phone", "contact_person", 
                      "capacity", "daily_need", "operating_hours", "active"]
    
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(location, field, value)
    
    db.commit()
    db.refresh(location)
    
    return {
        "message": "Abrigo atualizado com sucesso",
        "location": location
    }

# ============================================================================
# CATEGORY/ITEM MANAGEMENT - GESTÃO DE CATEGORIAS E ITENS
# ============================================================================

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories_admin(
    status: Optional[str] = Query(None, description="Filtrar por status: active, inactive, all"),
    search: Optional[str] = Query(None, description="Buscar por nome"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Lista todas as categorias/itens disponíveis no sistema.
    Admin pode gerenciar quais itens estão disponíveis para doação.
    """
    query = db.query(Category)
    
    if status == "active":
        query = query.filter(Category.active == True)
    elif status == "inactive":
        query = query.filter(Category.active == False)
    # status=all ou None = todas
    
    if search:
        query = query.filter(Category.display_name.ilike(f"%{search}%"))
    
    categories = query.order_by(Category.sort_order, Category.display_name).all()
    return categories

@router.get("/categories/{category_id}/details", response_model=Dict[str, Any])
def get_category_details(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Retorna detalhes completos de uma categoria incluindo:
    - Informações da categoria
    - Atributos configurados
    - Estatísticas de uso
    - Deliveries associadas
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    # Contar deliveries usando esta categoria
    deliveries_count = db.query(Delivery).filter(Delivery.category_id == category_id).count()
    batches_count = db.query(ProductBatch).filter(ProductBatch.category_id == category_id).count()
    
    return {
        "category": category,
        "attributes": category.attributes,
        "stats": {
            "total_deliveries": deliveries_count,
            "total_batches": batches_count,
            "attributes_count": len(category.attributes)
        }
    }

@router.post("/categories")
def create_category(
    category_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Cria uma nova categoria/item disponível para doação.
    """
    # Verificar se nome já existe
    existing = db.query(Category).filter(Category.name == category_data.get("name")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Categoria com este nome já existe")
    
    category = Category(
        name=category_data["name"],
        display_name=category_data["display_name"],
        description=category_data.get("description"),
        icon=category_data.get("icon"),
        color=category_data.get("color"),
        parent_id=category_data.get("parent_id"),
        sort_order=category_data.get("sort_order", 0),
        legacy_product_type=category_data.get("legacy_product_type", "generic"),
        active=category_data.get("active", True)
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return {
        "message": f"Categoria '{category.display_name}' criada com sucesso",
        "category": category
    }

@router.patch("/categories/{category_id}")
def update_category(
    category_id: int,
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Atualiza uma categoria existente"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    allowed_fields = ["display_name", "description", "icon", "color", 
                      "sort_order", "active", "legacy_product_type"]
    
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return {
        "message": "Categoria atualizada com sucesso",
        "category": category
    }

@router.post("/categories/{category_id}/toggle")
def toggle_category_status(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Ativa ou desativa uma categoria"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    category.active = not category.active
    db.commit()
    db.refresh(category)
    
    status_text = "ativada" if category.active else "desativada"
    
    return {
        "message": f"Categoria '{category.display_name}' {status_text}",
        "active": category.active,
        "category": category
    }

@router.post("/categories/{category_id}/attributes")
def add_category_attribute(
    category_id: int,
    attribute_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Adiciona um atributo a uma categoria"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    # Verificar se atributo já existe
    existing = db.query(CategoryAttribute).filter(
        CategoryAttribute.category_id == category_id,
        CategoryAttribute.name == attribute_data.get("name")
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Atributo com este nome já existe na categoria")
    
    attribute = CategoryAttribute(
        category_id=category_id,
        name=attribute_data["name"],
        display_name=attribute_data["display_name"],
        attribute_type=attribute_data.get("attribute_type", "select"),
        required=attribute_data.get("required", False),
        sort_order=attribute_data.get("sort_order", 0),
        options=attribute_data.get("options"),
        min_value=attribute_data.get("min_value"),
        max_value=attribute_data.get("max_value"),
        max_length=attribute_data.get("max_length"),
        active=True
    )
    
    db.add(attribute)
    db.commit()
    db.refresh(attribute)
    
    return {
        "message": f"Atributo '{attribute.display_name}' adicionado à categoria",
        "attribute": attribute
    }

# ============================================================================
# DELIVERY/PEDIDOS MANAGEMENT - GESTÃO DE PEDIDOS
# ============================================================================

@router.get("/deliveries", response_model=List[Dict[str, Any]])
def list_deliveries(
    status: Optional[str] = Query(None, description="Filtrar por status"),
    location_id: Optional[int] = Query(None, description="Filtrar por abrigo"),
    category_id: Optional[int] = Query(None, description="Filtrar por categoria"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Lista todos os pedidos/deliveries com filtros"""
    query = db.query(Delivery)
    
    if status:
        query = query.filter(Delivery.status == status)
    
    if location_id:
        query = query.filter(Delivery.location_id == location_id)
    
    if category_id:
        query = query.filter(Delivery.category_id == category_id)
    
    deliveries = query.order_by(Delivery.created_at.desc()).all()
    
    # Enriquecer com dados relacionados
    enriched = []
    for delivery in deliveries:
        d_data = {
            "id": delivery.id,
            "status": delivery.status,
            "quantity": delivery.quantity,
            "metadata_cache": delivery.metadata_cache,
            "created_at": delivery.created_at,
            "location_id": delivery.location_id,
            "volunteer_id": delivery.volunteer_id,
            "category_id": delivery.category_id
        }
        
        # Buscar location
        if delivery.location_id:
            loc = db.query(DeliveryLocation).filter(DeliveryLocation.id == delivery.location_id).first()
            if loc:
                d_data["location"] = {"id": loc.id, "name": loc.name}
        
        # Buscar voluntário
        if delivery.volunteer_id:
            vol = db.query(User).filter(User.id == delivery.volunteer_id).first()
            if vol:
                d_data["volunteer"] = {"id": vol.id, "name": vol.name}
        
        # Buscar categoria
        if delivery.category_id:
            cat = db.query(Category).filter(Category.id == delivery.category_id).first()
            if cat:
                d_data["category"] = {"id": cat.id, "display_name": cat.display_name, "icon": cat.icon}
        
        enriched.append(d_data)
    
    return enriched

# ============================================================================
# REPORTS & ANALYTICS - RELATÓRIOS
# ============================================================================

@router.get("/reports/overview")
def get_system_report(
    days: int = Query(30, ge=1, le=365, description="Dias para análise"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Relatório geral do sistema com métricas dos últimos N dias.
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    # Novos usuários no período
    new_users = db.query(User).filter(User.created_at >= since).count()
    new_volunteers = db.query(User).filter(
        User.created_at >= since,
        User.roles.like("%volunteer%")
    ).count()
    new_shelters = db.query(User).filter(
        User.created_at >= since,
        User.roles.like("%shelter%")
    ).count()
    
    # Novos pedidos no período
    new_deliveries = db.query(Delivery).filter(Delivery.created_at >= since).count()
    completed_deliveries = db.query(Delivery).filter(
        Delivery.created_at >= since,
        Delivery.status == "delivered"
    ).count()
    
    # Taxa de sucesso
    success_rate = (completed_deliveries / new_deliveries * 100) if new_deliveries > 0 else 0
    
    return {
        "period_days": days,
        "since": since.isoformat(),
        "users": {
            "new_total": new_users,
            "new_volunteers": new_volunteers,
            "new_shelters": new_shelters
        },
        "deliveries": {
            "new_total": new_deliveries,
            "completed": completed_deliveries,
            "success_rate_percent": round(success_rate, 2)
        },
        "generated_at": datetime.utcnow().isoformat()
    }

# ============================================================================
# LOCATION ACTIVATION/DEACTIVATION - ATIVAÇÃO/DESATIVAÇÃO DE ABRIGOS
# ============================================================================

@router.post("/locations/{location_id}/activate", response_model=DeliveryLocationResponse)
def activate_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Ativa um local de entrega (abrigo)"""
    location = db.query(DeliveryLocation).filter(DeliveryLocation.id == location_id).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Local não encontrado")
    
    location.active = True
    db.commit()
    db.refresh(location)
    
    return location

@router.post("/locations/{location_id}/deactivate", response_model=DeliveryLocationResponse)
def deactivate_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Desativa um local de entrega (abrigo)"""
    location = db.query(DeliveryLocation).filter(DeliveryLocation.id == location_id).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Local não encontrado")
    
    location.active = False
    db.commit()
    db.refresh(location)
    
    return location
