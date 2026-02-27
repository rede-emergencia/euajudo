# 🎨 Diagrama de Modelo de Domínio

## Core Domain Entities

```mermaid
classDiagram
    class Event {
        +int id
        +EventType type
        +Category category
        +EventStatus status
        +int creator_id
        +string city_id
        +Location location
        +Timeframe timeframe
        +Metadata metadata
        +List~EventItem~ items
        +datetime created_at
        
        +publish()
        +cancel(reason)
        +complete()
        +add_item(item)
        +can_complete() bool
    }
    
    class EventItem {
        +int id
        +int event_id
        +string name
        +Quantity quantity
        +string unit
        +Quantity quantity_reserved
        +Quantity quantity_delivered
        +Metadata metadata
        
        +reserve(amount)
        +deliver(amount)
        +available() Quantity
    }
    
    class Assignment {
        +int id
        +int event_id
        +int volunteer_id
        +AssignmentStatus status
        +Location pickup_location
        +Location delivery_location
        +Timeframe estimated_time
        +List~AssignmentItem~ items
        
        +accept()
        +start()
        +complete(confirmation_code)
        +cancel(reason)
    }
    
    class Delivery {
        +int id
        +int assignment_id
        +DeliveryStatus status
        +Location origin
        +Location destination
        +Location current_location
        +Route route
        +datetime estimated_arrival
        +string confirmation_code
        
        +update_location(lat, lon)
        +deliver(code, photo)
        +track() List~Waypoint~
    }
    
    class User {
        +int id
        +string email
        +string nome
        +string city_id
        +List~Role~ roles
        +Location location
        +bool aprovado
        
        +has_role(role) bool
        +can_create_event() bool
        +can_volunteer() bool
    }
    
    class Location {
        +int id
        +string name
        +string type
        +string city_id
        +float latitude
        +float longitude
        +string address
        
        +distance_to(other) float
    }
    
    Event "1" --> "*" EventItem : contains
    Event --> "1" User : created by
    Event --> "0..1" Location : located at
    Assignment --> "1" Event : assigned to
    Assignment --> "1" User : volunteer
    Assignment "1" --> "1" Delivery : has
    Delivery --> "2" Location : origin/destination
```

## Value Objects

```mermaid
classDiagram
    class EventType {
        <<ValueObject>>
        +string value
        +NECESSIDADE
        +OFERTA
        +ENTREGA
    }
    
    class Category {
        <<ValueObject>>
        +string name
        +string subcategory
        +toString() string
    }
    
    class Quantity {
        <<ValueObject>>
        +float amount
        +string unit
        +add(other) Quantity
        +subtract(other) Quantity
        +compare(other) int
    }
    
    class Timeframe {
        <<ValueObject>>
        +datetime start
        +datetime end
        +contains(dt) bool
        +overlaps(other) bool
        +duration() timedelta
    }
    
    class Metadata {
        <<ValueObject>>
        +Dict data
        +get(key) Any
        +set(key, value)
        +to_dict() Dict
    }
    
    class EventStatus {
        <<ValueObject>>
        +DRAFT
        +ACTIVE
        +IN_PROGRESS
        +COMPLETED
        +CANCELLED
    }
```

## Aggregates e Bounded Contexts

```mermaid
graph TB
    subgraph Catalog Context
        E[Event Aggregate]
        EI[EventItem Entity]
        E --> EI
    end
    
    subgraph Assignment Context
        A[Assignment Aggregate]
        AI[AssignmentItem Entity]
        A --> AI
    end
    
    subgraph Delivery Context
        D[Delivery Aggregate]
        W[Waypoint Entity]
        D --> W
    end
    
    subgraph Identity Context
        U[User Aggregate]
        R[Role VO]
        U --> R
    end
    
    E -.references.-> U
    A -.references.-> E
    A -.references.-> U
    D -.references.-> A
```

## Domain Services

```mermaid
classDiagram
    class MatchingService {
        <<DomainService>>
        +find_matches(need, offers) List~Match~
        +calculate_match_score(need, offer) float
        -check_category_compatibility() bool
        -check_quantity_compatibility() bool
        -calculate_distance_score() float
        -calculate_time_score() float
    }
    
    class RouteOptimizationService {
        <<DomainService>>
        +optimize_route(origin, pickups, destinations) Route
        +calculate_distance(from, to) float
        +estimate_time(route) timedelta
        -nearest_neighbor_algorithm()
    }
    
    class ValidationService {
        <<DomainService>>
        +validate_event(event) ValidationResult
        +validate_metadata(category, metadata) bool
        +check_business_rules(entity) List~Violation~
    }
    
    MatchingService ..> Event : uses
    RouteOptimizationService ..> Location : uses
    ValidationService ..> Event : validates
```

## Plugin Architecture

```mermaid
classDiagram
    class CategoryPlugin {
        <<interface>>
        +string category
        +validate_metadata(metadata)*
        +enrich_event(event)* Event
        +calculate_match_score(need, offer, base)* float
        +get_display_fields(event)* Dict
        +on_event_created(event)*
    }
    
    class FoodPlugin {
        +category = "alimentos"
        +validate_metadata(metadata)
        +enrich_event(event) Event
        +calculate_match_score() float
    }
    
    class ClothingPlugin {
        +category = "roupas"
        +validate_metadata(metadata)
        +enrich_event(event) Event
        +calculate_match_score() float
    }
    
    class MedicinePlugin {
        +category = "medicamentos"
        +validate_metadata(metadata)
        +enrich_event(event) Event
        +calculate_match_score() float
    }
    
    class PluginRegistry {
        -Dict~string,Plugin~ plugins
        +register(plugin)
        +get(category) Plugin
        +list_categories() List
    }
    
    CategoryPlugin <|-- FoodPlugin
    CategoryPlugin <|-- ClothingPlugin
    CategoryPlugin <|-- MedicinePlugin
    PluginRegistry --> CategoryPlugin : manages
```

## Repository Pattern

```mermaid
classDiagram
    class Repository~T~ {
        <<interface>>
        +save(entity)* T
        +get_by_id(id)* T
        +delete(entity)*
        +list(filters)* List~T~
    }
    
    class EventRepository {
        <<interface>>
        +find_by_category(category) List~Event~
        +find_active_in_city(city_id) List~Event~
        +find_by_creator(user_id) List~Event~
    }
    
    class SQLAlchemyEventRepository {
        -Session session
        +save(event) Event
        +get_by_id(id) Event
        +find_by_category(category) List~Event~
        -to_entity(model) Event
        -to_model(entity) EventModel
    }
    
    Repository <|-- EventRepository
    EventRepository <|.. SQLAlchemyEventRepository
```

## Event Sourcing

```mermaid
classDiagram
    class DomainEvent {
        <<abstract>>
        +string event_id
        +string aggregate_id
        +int version
        +datetime timestamp
        +Dict metadata
    }
    
    class EventCreated {
        +int event_id
        +string type
        +string category
        +Dict data
    }
    
    class EventPublished {
        +int event_id
        +datetime published_at
    }
    
    class EventCompleted {
        +int event_id
        +datetime completed_at
    }
    
    class EventStore {
        +append(event) int
        +get_events(aggregate_id) List~Event~
        +get_events_by_type(type) List~Event~
    }
    
    class EventBus {
        +publish(event)
        +subscribe(event_type, handler)
        -Dict handlers
    }
    
    DomainEvent <|-- EventCreated
    DomainEvent <|-- EventPublished
    DomainEvent <|-- EventCompleted
    EventStore --> DomainEvent : stores
    EventBus --> DomainEvent : publishes
```

## Relacionamento entre Contextos

```
┌─────────────────────────────────────────────────────────────┐
│                     JFOOD PLATFORM                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Identity        │         │  Catalog         │
│  Context         │         │  Context         │
│                  │         │                  │
│  User ────────────────────>│  Event           │
│  Role            │  creates│  EventItem       │
└──────────────────┘         └────────┬─────────┘
                                      │ references
                             ┌────────▼─────────┐
                             │  Assignment      │
                             │  Context         │
                             │                  │
                             │  Assignment      │
                             │  AssignmentItem  │
                             └────────┬─────────┘
                                      │ creates
                             ┌────────▼─────────┐
                             │  Delivery        │
                             │  Context         │
                             │                  │
                             │  Delivery        │
                             │  Waypoint        │
                             └──────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              Shared Kernel (Compartilhado)                   │
│                                                              │
│  Location, Category, Quantity, Timeframe                    │
└──────────────────────────────────────────────────────────────┘
```

---

**Voltar**: [Índice](../00-INDEX.md)
