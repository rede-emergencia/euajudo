# 🌐 API Design

## Princípios RESTful Genéricos

### 1. Resources (Substantivos)
```
✅ /events
✅ /assignments
✅ /deliveries
✅ /locations

❌ /createEvent
❌ /getAssignments
❌ /deliverPackage
```

### 2. HTTP Methods (Verbos)
```
GET    /events          - Listar eventos
GET    /events/{id}     - Obter evento
POST   /events          - Criar evento
PUT    /events/{id}     - Atualizar evento completo
PATCH  /events/{id}     - Atualizar parcialmente
DELETE /events/{id}     - Deletar evento
```

### 3. Status Codes Consistentes
```
200 OK                  - Sucesso geral
201 Created             - Recurso criado
204 No Content          - Sucesso sem corpo
400 Bad Request         - Dados inválidos
401 Unauthorized        - Não autenticado
403 Forbidden           - Sem permissão
404 Not Found           - Recurso não existe
409 Conflict            - Conflito (ex: duplicação)
422 Unprocessable       - Validação de negócio falhou
500 Internal Error      - Erro do servidor
```

## Estrutura de Endpoints

### Events API

```python
# app/api/v2/events.py
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from app.schemas.events import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse
)

router = APIRouter(prefix="/events", tags=["events"])

@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    data: EventCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Cria novo evento (necessidade, oferta ou entrega)
    
    - **type**: tipo do evento (necessidade, oferta, entrega)
    - **category**: categoria (alimentos, roupas, medicamentos, etc.)
    - **metadata**: campos específicos por categoria
    """
    # Validação pelo plugin
    plugin = plugin_registry.get(data.category)
    plugin.validate_metadata(data.metadata)
    
    # Criar evento
    event = Event(
        type=data.type,
        category=data.category,
        subcategory=data.subcategory,
        creator_id=current_user.id,
        city_id=data.city_id or current_user.city_id,
        status="draft",
        metadata=data.metadata
    )
    
    # Adicionar items
    for item_data in data.items:
        item = EventItem(**item_data.dict())
        event.items.append(item)
    
    # Enriquecer com plugin
    event = plugin.enrich_event(event)
    
    # Salvar
    db.add(event)
    await db.commit()
    
    # Publicar evento
    await event_bus.publish(EventCreated(event=event))
    
    return event

@router.get("", response_model=EventListResponse)
async def list_events(
    # Filtros
    type: Optional[str] = Query(None, description="Filtrar por tipo"),
    category: Optional[str] = Query(None, description="Filtrar por categoria"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    city_id: Optional[str] = Query(None, description="Filtrar por cidade"),
    creator_id: Optional[int] = Query(None, description="Filtrar por criador"),
    
    # Busca
    search: Optional[str] = Query(None, description="Busca textual"),
    tags: Optional[List[str]] = Query(None, description="Filtrar por tags"),
    
    # Geo
    latitude: Optional[float] = Query(None, description="Latitude para busca geo"),
    longitude: Optional[float] = Query(None, description="Longitude para busca geo"),
    radius_km: Optional[float] = Query(10, description="Raio em km"),
    
    # Paginação
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    
    # Ordenação
    sort: str = Query("created_at", description="Campo para ordenar"),
    order: str = Query("desc", description="Direção (asc/desc)"),
    
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Lista eventos com filtros e paginação
    """
    query = db.query(Event)
    
    # Aplicar filtros
    if type:
        query = query.filter(Event.type == type)
    if category:
        query = query.filter(Event.category == category)
    if status:
        query = query.filter(Event.status == status)
    if city_id:
        query = query.filter(Event.city_id == city_id)
    elif current_user:
        query = query.filter(Event.city_id == current_user.city_id)
    if creator_id:
        query = query.filter(Event.creator_id == creator_id)
    
    # Busca textual
    if search:
        query = query.filter(
            or_(
                Event.metadata.contains({"tags": [search]}),
                Event.metadata["nome"].astext.ilike(f"%{search}%")
            )
        )
    
    # Tags
    if tags:
        query = query.filter(
            Event.metadata["tags"].astext.in_(tags)
        )
    
    # Busca geográfica
    if latitude and longitude:
        query = query.join(Location).filter(
            func.earth_distance(
                func.ll_to_earth(Location.latitude, Location.longitude),
                func.ll_to_earth(latitude, longitude)
            ) <= radius_km * 1000
        )
    
    # Total (antes da paginação)
    total = query.count()
    
    # Ordenação
    order_col = getattr(Event, sort, Event.created_at)
    if order == "desc":
        query = query.order_by(order_col.desc())
    else:
        query = query.order_by(order_col.asc())
    
    # Paginação
    offset = (page - 1) * per_page
    events = query.offset(offset).limit(per_page).all()
    
    # Enriquecer com display fields
    results = []
    for event in events:
        plugin = plugin_registry.get(event.category)
        event_dict = event.dict()
        event_dict["display"] = plugin.get_display_fields(event)
        results.append(event_dict)
    
    return {
        "items": results,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Obtém evento por ID"""
    event = db.get(Event, event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Verificar permissão (opcional)
    # if not can_view_event(current_user, event):
    #     raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Enriquecer
    plugin = plugin_registry.get(event.category)
    event_dict = event.dict()
    event_dict["display"] = plugin.get_display_fields(event)
    
    return event_dict

@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    data: EventUpdate,
    current_user: User = Depends(get_current_user)
):
    """Atualiza evento parcialmente"""
    event = db.get(Event, event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Verificar permissão
    if event.creator_id != current_user.id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Não pode editar evento completado
    if event.status in ["completed", "cancelled"]:
        raise HTTPException(
            status_code=409,
            detail="Não pode editar evento finalizado"
        )
    
    # Atualizar campos
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    # Re-validar
    if "metadata" in update_data:
        plugin = plugin_registry.get(event.category)
        plugin.validate_metadata(event.metadata)
    
    event.updated_at = datetime.utcnow()
    await db.commit()
    
    # Publicar evento
    await event_bus.publish(EventUpdated(event=event))
    
    return event

@router.post("/{event_id}/publish", response_model=EventResponse)
async def publish_event(
    event_id: int,
    current_user: User = Depends(get_current_user)
):
    """Publica evento (torna visível)"""
    event = db.get(Event, event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    if event.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    if event.status != "draft":
        raise HTTPException(status_code=409, detail="Evento já publicado")
    
    # Validar antes de publicar
    plugin = plugin_registry.get(event.category)
    plugin.validate_metadata(event.metadata)
    
    # Publicar
    event.status = "active"
    event.published_at = datetime.utcnow()
    await db.commit()
    
    # Evento
    await event_bus.publish(EventPublished(event=event))
    
    return event

@router.post("/{event_id}/cancel", response_model=EventResponse)
async def cancel_event(
    event_id: int,
    reason: str,
    current_user: User = Depends(get_current_user)
):
    """Cancela evento"""
    event = db.get(Event, event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    if event.creator_id != current_user.id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    if event.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=409, detail="Evento já finalizado")
    
    event.status = "cancelled"
    event.cancelled_at = datetime.utcnow()
    event.metadata["cancellation_reason"] = reason
    await db.commit()
    
    await event_bus.publish(EventCancelled(event=event, reason=reason))
    
    return event
```

## Schemas (Pydantic)

```python
# app/schemas/events.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class EventItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=50)
    category: Optional[str] = None
    metadata: Dict[str, Any] = {}

class EventCreate(BaseModel):
    type: str = Field(..., regex="^(necessidade|oferta|entrega)$")
    category: str = Field(..., min_length=1, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    city_id: Optional[str] = None
    location_id: Optional[int] = None
    timeframe_start: Optional[datetime] = None
    timeframe_end: Optional[datetime] = None
    metadata: Dict[str, Any] = {}
    items: List[EventItemCreate] = []
    
    @validator('items')
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Evento deve ter pelo menos um item")
        return v
    
    @validator('timeframe_end')
    def end_after_start(cls, v, values):
        if v and 'timeframe_start' in values:
            if v <= values['timeframe_start']:
                raise ValueError("timeframe_end deve ser depois de timeframe_start")
        return v

class EventUpdate(BaseModel):
    subcategory: Optional[str] = None
    location_id: Optional[int] = None
    timeframe_start: Optional[datetime] = None
    timeframe_end: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class EventItemResponse(EventItemCreate):
    id: int
    event_id: int
    quantity_reserved: float
    quantity_delivered: float
    
    class Config:
        from_attributes = True

class EventResponse(BaseModel):
    id: int
    type: str
    category: str
    subcategory: Optional[str]
    status: str
    creator_id: int
    city_id: str
    location_id: Optional[int]
    timeframe_start: Optional[datetime]
    timeframe_end: Optional[datetime]
    metadata: Dict[str, Any]
    items: List[EventItemResponse]
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    
    # Campos enriquecidos (adicionados dinamicamente)
    display: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class EventListResponse(BaseModel):
    items: List[EventResponse]
    total: int
    page: int
    per_page: int
    pages: int
```

## Versionamento de API

### Estratégia: URL Path
```python
# app/api/v1/events.py
@router.get("/v1/events")  # Versão antiga

# app/api/v2/events.py
@router.get("/v2/events")  # Versão nova

# app/main.py
app.include_router(v1_router, prefix="/api/v1")
app.include_router(v2_router, prefix="/api/v2")
```

### Deprecation Headers
```python
from fastapi import Response

@router.get("/v1/events")
async def list_events_v1(response: Response):
    response.headers["X-API-Deprecated"] = "true"
    response.headers["X-API-Sunset"] = "2026-12-31"
    response.headers["X-API-Migration-Guide"] = "https://docs.jfood.com/migration/v1-to-v2"
    
    # ... lógica antiga
```

## Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.get("/events")
@limiter.limit("100/minute")
async def list_events(request: Request):
    # ...
    pass

@router.post("/events")
@limiter.limit("10/minute")
async def create_event(request: Request):
    # ...
    pass
```

## Documentação OpenAPI

```python
# app/main.py
app = FastAPI(
    title="JFood API",
    description="""
    API genérica para conexão entre necessidades e ofertas.
    
    ## Categorias Suportadas
    - 🍱 Alimentos (marmitas, cestas básicas)
    - 👕 Roupas (doações, roupas de inverno)
    - 💊 Medicamentos (remédios básicos)
    
    ## Autenticação
    Use JWT Bearer token no header Authorization
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "events",
            "description": "Operações com eventos (necessidades, ofertas)"
        },
        {
            "name": "assignments",
            "description": "Atribuições de voluntários"
        },
        {
            "name": "deliveries",
            "description": "Rastreamento de entregas"
        }
    ]
)
```

## HATEOAS (Hypermedia)

```python
class EventResponse(BaseModel):
    # ... campos normais
    
    _links: Dict[str, str] = {}
    
    @classmethod
    def from_orm_with_links(cls, event: Event, base_url: str):
        obj = cls.from_orm(event)
        
        # Links relacionados
        obj._links = {
            "self": f"{base_url}/events/{event.id}",
            "creator": f"{base_url}/users/{event.creator_id}",
            "items": f"{base_url}/events/{event.id}/items"
        }
        
        # Links de ações possíveis
        if event.status == "draft":
            obj._links["publish"] = f"{base_url}/events/{event.id}/publish"
            obj._links["delete"] = f"{base_url}/events/{event.id}"
        
        if event.status == "active":
            obj._links["cancel"] = f"{base_url}/events/{event.id}/cancel"
            obj._links["assignments"] = f"{base_url}/events/{event.id}/assignments"
        
        return obj
```

## Error Handling Consistente

```python
# app/exceptions.py
from fastapi import HTTPException
from typing import Any, Dict, Optional

class APIException(HTTPException):
    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        self.error_code = error_code
        self.details = details or {}
        
        super().__init__(
            status_code=status_code,
            detail={
                "error_code": error_code,
                "message": message,
                "details": details
            }
        )

class ValidationError(APIException):
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(
            status_code=422,
            error_code="VALIDATION_ERROR",
            message=message,
            details=details
        )

class NotFoundError(APIException):
    def __init__(self, resource: str, id: Any):
        super().__init__(
            status_code=404,
            error_code="NOT_FOUND",
            message=f"{resource} não encontrado",
            details={"resource": resource, "id": id}
        )

# Uso
raise NotFoundError("Event", event_id)
raise ValidationError("Metadata inválido", {"field": "quantidade"})
```

## Testes de API

```python
# tests/api/test_events.py
import pytest
from fastapi.testclient import TestClient

def test_create_event(client: TestClient, auth_headers):
    data = {
        "type": "necessidade",
        "category": "alimentos",
        "metadata": {"quantidade": 100},
        "items": [
            {
                "name": "Marmita",
                "quantity": 100,
                "unit": "unidades"
            }
        ]
    }
    
    response = client.post("/api/v2/events", json=data, headers=auth_headers)
    
    assert response.status_code == 201
    assert response.json()["type"] == "necessidade"
    assert response.json()["status"] == "draft"

def test_list_events_with_filters(client: TestClient):
    response = client.get(
        "/api/v2/events",
        params={
            "category": "alimentos",
            "city_id": "juiz-de-fora",
            "page": 1,
            "per_page": 20
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data

def test_publish_event(client: TestClient, auth_headers, draft_event):
    response = client.post(
        f"/api/v2/events/{draft_event.id}/publish",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "active"
    assert response.json()["published_at"] is not None
```

---

**Próximo**: [Padrões de Código](./09-CODE-PATTERNS.md)
