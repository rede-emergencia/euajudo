"""
Dashboard Configuration System
Defines widget types and dashboard layouts for different user roles
"""
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass, field

class WidgetType(str, Enum):
    """Types of dashboard widgets"""
    STATS_CARD = "stats_card"           # Simple stat display
    LIST = "list"                       # List of items with actions
    FORM = "form"                       # Creation/edit form
    TIMELINE = "timeline"               # Activity timeline
    MAP = "map"                         # Geographic map
    CHART = "chart"                     # Chart/graph
    TABLE = "table"                     # Data table
    QUICK_ACTIONS = "quick_actions"     # Action buttons

class WidgetDataSource(str, Enum):
    """Data sources for widgets"""
    BATCHES = "batches"
    REQUESTS = "requests"
    RESERVATIONS = "reservations"
    DELIVERIES = "deliveries"
    LOCATIONS = "locations"
    STATS = "stats"

@dataclass
class WidgetAction:
    """Action available in a widget"""
    id: str
    label: str
    icon: str
    endpoint: str
    method: str = "GET"
    requires_permission: Optional[str] = None
    confirmation_message: Optional[str] = None
    style: str = "primary"  # primary, secondary, danger, success

@dataclass
class WidgetConfig:
    """Configuration for a dashboard widget"""
    id: str
    type: WidgetType
    title: str
    data_source: WidgetDataSource
    icon: str
    size: str = "medium"  # small, medium, large, full
    order: int = 0
    visible: bool = True
    
    # Data filtering
    filters: Dict[str, Any] = field(default_factory=dict)
    
    # Display options
    columns: List[str] = field(default_factory=list)
    display_mode: str = "cards"  # cards, list, table, compact
    max_items: int = 10
    show_empty_state: bool = True
    
    # Actions
    primary_action: Optional[WidgetAction] = None
    item_actions: List[WidgetAction] = field(default_factory=list)
    
    # Permissions
    required_permission: Optional[str] = None

@dataclass
class DashboardLayout:
    """Dashboard layout configuration"""
    role: str
    title: str
    description: str
    widgets: List[WidgetConfig]
    quick_actions: List[WidgetAction] = field(default_factory=list)

# ============================================================================
# WIDGET CONFIGURATIONS
# ============================================================================

# Common actions
CREATE_BATCH_ACTION = WidgetAction(
    id="create_batch",
    label="Nova Oferta",
    icon="plus",
    endpoint="/api/batches",
    method="POST",
    style="success"
)

CREATE_REQUEST_ACTION = WidgetAction(
    id="create_request",
    label="Novo Pedido",
    icon="plus",
    endpoint="/api/resources/requests",
    method="POST",
    style="primary"
)

CANCEL_ACTION = WidgetAction(
    id="cancel",
    label="Cancelar",
    icon="x",
    endpoint="{item_endpoint}/cancel",
    method="POST",
    confirmation_message="Tem certeza que deseja cancelar?",
    style="danger"
)

CONFIRM_PICKUP_ACTION = WidgetAction(
    id="confirm_pickup",
    label="Confirmar Retirada",
    icon="check",
    endpoint="/api/deliveries/{id}/confirm-pickup",
    method="POST",
    style="success"
)

CONFIRM_DELIVERY_ACTION = WidgetAction(
    id="confirm_delivery",
    label="Confirmar Entrega",
    icon="check",
    endpoint="/api/deliveries/{id}/confirm-delivery",
    method="POST",
    style="success"
)

# ============================================================================
# ROLE-SPECIFIC DASHBOARD CONFIGURATIONS
# ============================================================================

PROVIDER_DASHBOARD = DashboardLayout(
    role="provider",
    title="Dashboard Fornecedor",
    description="Gerencie suas ofertas, pedidos e retiradas",
    widgets=[
        WidgetConfig(
            id="my_batches",
            type=WidgetType.LIST,
            title="Minhas Ofertas",
            data_source=WidgetDataSource.BATCHES,
            icon="box",
            size="full",
            order=1,
            filters={"my": True, "active": True},
            display_mode="cards",
            primary_action=CREATE_BATCH_ACTION,
            item_actions=[CANCEL_ACTION],
            columns=["quantity", "product_type", "status", "created_at", "expires_at"]
        ),
        WidgetConfig(
            id="my_requests",
            type=WidgetType.LIST,
            title="Meus Pedidos de Insumos",
            data_source=WidgetDataSource.REQUESTS,
            icon="shopping-cart",
            size="full",
            order=2,
            filters={"my": True},
            display_mode="cards",
            primary_action=CREATE_REQUEST_ACTION,
            item_actions=[CANCEL_ACTION],
            columns=["quantity_meals", "status", "items", "created_at"]
        ),
        WidgetConfig(
            id="my_pickups",
            type=WidgetType.LIST,
            title="Retiradas Agendadas",
            data_source=WidgetDataSource.DELIVERIES,
            icon="truck",
            size="full",
            order=3,
            filters={"my_batches": True},
            display_mode="cards",
            item_actions=[CONFIRM_PICKUP_ACTION, CANCEL_ACTION],
            columns=["quantity", "volunteer", "location", "status", "pickup_code"]
        ),
    ]
)

SHELTER_DASHBOARD = DashboardLayout(
    role="shelter",
    title="Dashboard Abrigo",
    description="Acompanhe seus pedidos e entregas",
    widgets=[
        WidgetConfig(
            id="my_requests",
            type=WidgetType.LIST,
            title="Meus Pedidos",
            data_source=WidgetDataSource.REQUESTS,
            icon="clipboard",
            size="full",
            order=1,
            filters={"my": True},
            display_mode="cards",
            primary_action=CREATE_REQUEST_ACTION,
            item_actions=[CANCEL_ACTION],
            columns=["quantity_meals", "product_type", "status", "items", "created_at"]
        ),
        WidgetConfig(
            id="incoming_deliveries",
            type=WidgetType.LIST,
            title="Entregas em Andamento",
            data_source=WidgetDataSource.DELIVERIES,
            icon="truck",
            size="full",
            order=2,
            filters={"to_my_location": True, "status": "in_transit"},
            display_mode="cards",
            item_actions=[CONFIRM_DELIVERY_ACTION],
            columns=["quantity", "product_type", "volunteer", "status", "delivery_code"]
        ),
    ]
)

VOLUNTEER_DASHBOARD = DashboardLayout(
    role="volunteer",
    title="Dashboard Voluntário",
    description="Gerencie suas doações e entregas",
    widgets=[
        WidgetConfig(
            id="my_donations",
            type=WidgetType.LIST,
            title="Minhas Doações de Insumos",
            data_source=WidgetDataSource.RESERVATIONS,
            icon="heart",
            size="full",
            order=1,
            filters={"my": True},
            display_mode="cards",
            item_actions=[CANCEL_ACTION],
            columns=["request", "items", "status", "created_at"]
        ),
        WidgetConfig(
            id="my_deliveries",
            type=WidgetType.LIST,
            title="Minhas Entregas",
            data_source=WidgetDataSource.DELIVERIES,
            icon="truck",
            size="full",
            order=2,
            filters={"my": True},
            display_mode="cards",
            item_actions=[CONFIRM_PICKUP_ACTION, CONFIRM_DELIVERY_ACTION, CANCEL_ACTION],
            columns=["quantity", "product_type", "batch", "location", "status", "pickup_code", "delivery_code"]
        ),
    ]
)

# Registry of all dashboards
DASHBOARD_REGISTRY: Dict[str, DashboardLayout] = {
    "provider": PROVIDER_DASHBOARD,
    "shelter": SHELTER_DASHBOARD,
    "volunteer": VOLUNTEER_DASHBOARD,
}

def get_dashboard_config(role: str) -> Optional[DashboardLayout]:
    """Get dashboard configuration for a specific role"""
    return DASHBOARD_REGISTRY.get(role)

def get_widget_config(role: str, widget_id: str) -> Optional[WidgetConfig]:
    """Get specific widget configuration"""
    dashboard = get_dashboard_config(role)
    if not dashboard:
        return None
    
    for widget in dashboard.widgets:
        if widget.id == widget_id:
            return widget
    
    return None
