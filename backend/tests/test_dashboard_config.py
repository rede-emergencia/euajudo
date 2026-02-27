"""
Unit tests for dashboard configuration system
"""
import pytest
from app.dashboard_config import (
    WidgetType,
    WidgetDataSource,
    WidgetAction,
    WidgetConfig,
    DashboardLayout,
    get_dashboard_config,
    get_widget_config,
    PROVIDER_DASHBOARD,
    SHELTER_DASHBOARD,
    VOLUNTEER_DASHBOARD,
    DASHBOARD_REGISTRY,
)


class TestWidgetTypes:
    """Test widget type enums"""
    
    def test_widget_types_exist(self):
        """Test all widget types are defined"""
        assert WidgetType.STATS_CARD == "stats_card"
        assert WidgetType.LIST == "list"
        assert WidgetType.FORM == "form"
        assert WidgetType.TIMELINE == "timeline"
        assert WidgetType.MAP == "map"
        assert WidgetType.CHART == "chart"
        assert WidgetType.TABLE == "table"
        assert WidgetType.QUICK_ACTIONS == "quick_actions"


class TestWidgetDataSource:
    """Test widget data source enums"""
    
    def test_data_sources_exist(self):
        """Test all data sources are defined"""
        assert WidgetDataSource.BATCHES == "batches"
        assert WidgetDataSource.REQUESTS == "requests"
        assert WidgetDataSource.RESERVATIONS == "reservations"
        assert WidgetDataSource.DELIVERIES == "deliveries"
        assert WidgetDataSource.LOCATIONS == "locations"
        assert WidgetDataSource.STATS == "stats"


class TestWidgetAction:
    """Test widget action configuration"""
    
    def test_create_basic_action(self):
        """Test creating a basic action"""
        action = WidgetAction(
            id="test_action",
            label="Test Action",
            icon="check",
            endpoint="/api/test",
            method="POST"
        )
        
        assert action.id == "test_action"
        assert action.label == "Test Action"
        assert action.icon == "check"
        assert action.endpoint == "/api/test"
        assert action.method == "POST"
        assert action.style == "primary"
    
    def test_action_with_confirmation(self):
        """Test action with confirmation message"""
        action = WidgetAction(
            id="delete",
            label="Delete",
            icon="trash",
            endpoint="/api/delete",
            method="DELETE",
            confirmation_message="Are you sure?",
            style="danger"
        )
        
        assert action.confirmation_message == "Are you sure?"
        assert action.style == "danger"


class TestWidgetConfig:
    """Test widget configuration"""
    
    def test_create_basic_widget(self):
        """Test creating a basic widget configuration"""
        widget = WidgetConfig(
            id="test_widget",
            type=WidgetType.LIST,
            title="Test Widget",
            data_source=WidgetDataSource.BATCHES,
            icon="box"
        )
        
        assert widget.id == "test_widget"
        assert widget.type == WidgetType.LIST
        assert widget.title == "Test Widget"
        assert widget.data_source == WidgetDataSource.BATCHES
        assert widget.icon == "box"
        assert widget.size == "medium"
        assert widget.visible is True
    
    def test_widget_with_filters(self):
        """Test widget with filters"""
        widget = WidgetConfig(
            id="filtered_widget",
            type=WidgetType.LIST,
            title="Filtered",
            data_source=WidgetDataSource.BATCHES,
            icon="filter",
            filters={"my": True, "active": True}
        )
        
        assert widget.filters == {"my": True, "active": True}
    
    def test_widget_with_actions(self):
        """Test widget with actions"""
        primary_action = WidgetAction(
            id="create",
            label="Create",
            icon="plus",
            endpoint="/api/create",
            method="POST"
        )
        
        item_action = WidgetAction(
            id="delete",
            label="Delete",
            icon="trash",
            endpoint="/api/delete",
            method="DELETE"
        )
        
        widget = WidgetConfig(
            id="widget_with_actions",
            type=WidgetType.LIST,
            title="With Actions",
            data_source=WidgetDataSource.BATCHES,
            icon="box",
            primary_action=primary_action,
            item_actions=[item_action]
        )
        
        assert widget.primary_action == primary_action
        assert len(widget.item_actions) == 1
        assert widget.item_actions[0] == item_action


class TestDashboardLayout:
    """Test dashboard layout configuration"""
    
    def test_create_dashboard_layout(self):
        """Test creating a dashboard layout"""
        widget = WidgetConfig(
            id="test",
            type=WidgetType.LIST,
            title="Test",
            data_source=WidgetDataSource.BATCHES,
            icon="box"
        )
        
        layout = DashboardLayout(
            role="test_role",
            title="Test Dashboard",
            description="Test description",
            widgets=[widget]
        )
        
        assert layout.role == "test_role"
        assert layout.title == "Test Dashboard"
        assert layout.description == "Test description"
        assert len(layout.widgets) == 1
        assert layout.widgets[0] == widget


class TestProviderDashboard:
    """Test provider dashboard configuration"""
    
    def test_provider_dashboard_exists(self):
        """Test provider dashboard is configured"""
        assert PROVIDER_DASHBOARD is not None
        assert PROVIDER_DASHBOARD.role == "provider"
        assert PROVIDER_DASHBOARD.title == "Dashboard Fornecedor"
    
    def test_provider_has_batches_widget(self):
        """Test provider has batches widget"""
        batches_widget = next(
            (w for w in PROVIDER_DASHBOARD.widgets if w.id == "my_batches"),
            None
        )
        
        assert batches_widget is not None
        assert batches_widget.type == WidgetType.LIST
        assert batches_widget.data_source == WidgetDataSource.BATCHES
        assert batches_widget.filters.get("my") is True
    
    def test_provider_has_requests_widget(self):
        """Test provider has requests widget"""
        requests_widget = next(
            (w for w in PROVIDER_DASHBOARD.widgets if w.id == "my_requests"),
            None
        )
        
        assert requests_widget is not None
        assert requests_widget.type == WidgetType.LIST
        assert requests_widget.data_source == WidgetDataSource.REQUESTS
    
    def test_provider_has_pickups_widget(self):
        """Test provider has pickups widget"""
        pickups_widget = next(
            (w for w in PROVIDER_DASHBOARD.widgets if w.id == "my_pickups"),
            None
        )
        
        assert pickups_widget is not None
        assert pickups_widget.type == WidgetType.LIST
        assert pickups_widget.data_source == WidgetDataSource.DELIVERIES


class TestShelterDashboard:
    """Test shelter dashboard configuration"""
    
    def test_shelter_dashboard_exists(self):
        """Test shelter dashboard is configured"""
        assert SHELTER_DASHBOARD is not None
        assert SHELTER_DASHBOARD.role == "shelter"
        assert SHELTER_DASHBOARD.title == "Dashboard Abrigo"
    
    def test_shelter_has_requests_widget(self):
        """Test shelter has requests widget"""
        requests_widget = next(
            (w for w in SHELTER_DASHBOARD.widgets if w.id == "my_requests"),
            None
        )
        
        assert requests_widget is not None
        assert requests_widget.type == WidgetType.LIST
        assert requests_widget.data_source == WidgetDataSource.REQUESTS
    
    def test_shelter_has_deliveries_widget(self):
        """Test shelter has incoming deliveries widget"""
        deliveries_widget = next(
            (w for w in SHELTER_DASHBOARD.widgets if w.id == "incoming_deliveries"),
            None
        )
        
        assert deliveries_widget is not None
        assert deliveries_widget.type == WidgetType.LIST
        assert deliveries_widget.data_source == WidgetDataSource.DELIVERIES


class TestVolunteerDashboard:
    """Test volunteer dashboard configuration"""
    
    def test_volunteer_dashboard_exists(self):
        """Test volunteer dashboard is configured"""
        assert VOLUNTEER_DASHBOARD is not None
        assert VOLUNTEER_DASHBOARD.role == "volunteer"
        assert VOLUNTEER_DASHBOARD.title == "Dashboard Voluntário"
    
    def test_volunteer_has_donations_widget(self):
        """Test volunteer has donations widget"""
        donations_widget = next(
            (w for w in VOLUNTEER_DASHBOARD.widgets if w.id == "my_donations"),
            None
        )
        
        assert donations_widget is not None
        assert donations_widget.type == WidgetType.LIST
        assert donations_widget.data_source == WidgetDataSource.RESERVATIONS
    
    def test_volunteer_has_deliveries_widget(self):
        """Test volunteer has deliveries widget"""
        deliveries_widget = next(
            (w for w in VOLUNTEER_DASHBOARD.widgets if w.id == "my_deliveries"),
            None
        )
        
        assert deliveries_widget is not None
        assert deliveries_widget.type == WidgetType.LIST
        assert deliveries_widget.data_source == WidgetDataSource.DELIVERIES


class TestDashboardRegistry:
    """Test dashboard registry"""
    
    def test_registry_has_all_roles(self):
        """Test registry contains all role dashboards"""
        assert "provider" in DASHBOARD_REGISTRY
        assert "shelter" in DASHBOARD_REGISTRY
        assert "volunteer" in DASHBOARD_REGISTRY
    
    def test_get_dashboard_config_provider(self):
        """Test getting provider dashboard config"""
        config = get_dashboard_config("provider")
        assert config is not None
        assert config.role == "provider"
        assert config == PROVIDER_DASHBOARD
    
    def test_get_dashboard_config_shelter(self):
        """Test getting shelter dashboard config"""
        config = get_dashboard_config("shelter")
        assert config is not None
        assert config.role == "shelter"
        assert config == SHELTER_DASHBOARD
    
    def test_get_dashboard_config_volunteer(self):
        """Test getting volunteer dashboard config"""
        config = get_dashboard_config("volunteer")
        assert config is not None
        assert config.role == "volunteer"
        assert config == VOLUNTEER_DASHBOARD
    
    def test_get_dashboard_config_invalid_role(self):
        """Test getting config for invalid role returns None"""
        config = get_dashboard_config("invalid_role")
        assert config is None


class TestGetWidgetConfig:
    """Test get_widget_config function"""
    
    def test_get_widget_config_provider_batches(self):
        """Test getting provider batches widget"""
        widget = get_widget_config("provider", "my_batches")
        assert widget is not None
        assert widget.id == "my_batches"
    
    def test_get_widget_config_shelter_requests(self):
        """Test getting shelter requests widget"""
        widget = get_widget_config("shelter", "my_requests")
        assert widget is not None
        assert widget.id == "my_requests"
    
    def test_get_widget_config_volunteer_deliveries(self):
        """Test getting volunteer deliveries widget"""
        widget = get_widget_config("volunteer", "my_deliveries")
        assert widget is not None
        assert widget.id == "my_deliveries"
    
    def test_get_widget_config_invalid_role(self):
        """Test getting widget for invalid role returns None"""
        widget = get_widget_config("invalid_role", "my_batches")
        assert widget is None
    
    def test_get_widget_config_invalid_widget_id(self):
        """Test getting invalid widget returns None"""
        widget = get_widget_config("provider", "invalid_widget")
        assert widget is None


class TestWidgetOrdering:
    """Test widget ordering in dashboards"""
    
    def test_provider_widgets_ordered(self):
        """Test provider widgets are ordered correctly"""
        orders = [w.order for w in PROVIDER_DASHBOARD.widgets]
        assert orders == sorted(orders)
    
    def test_shelter_widgets_ordered(self):
        """Test shelter widgets are ordered correctly"""
        orders = [w.order for w in SHELTER_DASHBOARD.widgets]
        assert orders == sorted(orders)
    
    def test_volunteer_widgets_ordered(self):
        """Test volunteer widgets are ordered correctly"""
        orders = [w.order for w in VOLUNTEER_DASHBOARD.widgets]
        assert orders == sorted(orders)
