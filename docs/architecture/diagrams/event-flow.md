# 🔄 Diagramas de Fluxo de Eventos

## Fluxo Completo: Necessidade → Oferta → Entrega

```mermaid
sequenceDiagram
    participant Abrigo
    participant Sistema
    participant EventBus
    participant Fornecedor
    participant Voluntario
    participant Notif

    Note over Abrigo,Notif: 1. CRIAR NECESSIDADE
    
    Abrigo->>Sistema: POST /events (necessidade)
    Sistema->>Sistema: Validar metadata
    Sistema->>Sistema: Criar Event
    Sistema-->>Abrigo: 201 Created
    Sistema->>EventBus: NecessidadeCriada
    EventBus->>Notif: Enviar notificações
    Notif->>Fornecedor: Email: "Nova necessidade na sua região"
    
    Note over Abrigo,Notif: 2. PUBLICAR OFERTA
    
    Fornecedor->>Sistema: GET /events?type=necessidade
    Sistema-->>Fornecedor: Lista necessidades
    Fornecedor->>Sistema: POST /events (oferta)
    Sistema->>Sistema: Criar Event (oferta)
    Sistema->>Sistema: Match com necessidades
    Sistema-->>Fornecedor: 201 Created
    Sistema->>EventBus: OfertaPublicada
    EventBus->>Notif: Notificar voluntários
    Notif->>Voluntario: Push: "Nova oferta disponível"
    
    Note over Abrigo,Notif: 3. VOLUNTÁRIO ACEITA
    
    Voluntario->>Sistema: GET /events?type=oferta
    Sistema-->>Voluntario: Lista ofertas
    Voluntario->>Sistema: POST /assignments
    Sistema->>Sistema: Criar Assignment
    Sistema->>Sistema: Reservar items da oferta
    Sistema-->>Voluntario: 201 Created
    Sistema->>EventBus: AssignmentCriado
    EventBus->>Notif: Notificar fornecedor
    Notif->>Fornecedor: SMS: "Voluntário vai retirar às 14h"
    
    Note over Abrigo,Notif: 4. ENTREGA
    
    Voluntario->>Sistema: POST /assignments/{id}/start
    Sistema->>Sistema: Iniciar assignment
    Sistema->>Sistema: Criar Delivery
    Sistema-->>Voluntario: 200 OK
    Sistema->>EventBus: DeliveryIniciada
    
    loop Tracking
        Voluntario->>Sistema: POST /deliveries/{id}/location
        Sistema->>EventBus: LocationUpdated
        EventBus->>Abrigo: WebSocket: Atualizar mapa
    end
    
    Voluntario->>Sistema: POST /deliveries/{id}/complete
    Sistema->>Sistema: Marcar como entregue
    Sistema->>Sistema: Completar assignment
    Sistema->>Sistema: Completar evento
    Sistema-->>Voluntario: 200 OK
    Sistema->>EventBus: DeliveryCompletada
    EventBus->>Notif: Notificar todos
    Notif->>Abrigo: Push: "Entrega confirmada"
    Notif->>Fornecedor: Email: "Entrega concluída"
```

## Fluxo Simplificado: Marmitas

```mermaid
graph TD
    A[Abrigo cria necessidade] --> B[Sistema publica evento]
    B --> C{Há ofertas<br/>disponíveis?}
    
    C -->|Não| D[Fornecedor vê necessidade]
    D --> E[Fornecedor cria oferta]
    E --> F[Sistema faz matching]
    
    C -->|Sim| F
    
    F --> G[Voluntário vê matches]
    G --> H[Voluntário aceita]
    H --> I[Sistema cria assignment]
    I --> J[Voluntário retira marmitas]
    J --> K[Voluntário entrega]
    K --> L[Abrigo confirma]
    L --> M[Sistema completa evento]
    
    style A fill:#e1f5ff
    style E fill:#ffe1e1
    style H fill:#e1ffe1
    style M fill:#f0f0f0
```

## Ciclo de Vida do Event

```mermaid
stateDiagram-v2
    [*] --> draft: create()
    
    draft --> active: publish()
    draft --> cancelled: cancel()
    draft --> [*]: delete()
    
    active --> in_progress: assignment criado
    active --> cancelled: cancel()
    
    in_progress --> completed: todas entregas OK
    in_progress --> cancelled: cancel()
    
    completed --> [*]
    cancelled --> [*]
    
    note right of draft
        Evento criado mas não visível
        Pode editar livremente
    end note
    
    note right of active
        Visível no mapa
        Voluntários podem aceitar
    end note
    
    note right of in_progress
        Assignments ativos
        Entregas em andamento
    end note
    
    note right of completed
        Todas entregas confirmadas
        Evento arquivado
    end note
```

## Event Sourcing Flow

```mermaid
sequenceDiagram
    participant API
    participant CommandHandler
    participant Aggregate
    participant EventStore
    participant EventBus
    participant Projection

    API->>CommandHandler: CriarEvento command
    CommandHandler->>Aggregate: Event.create(data)
    
    Aggregate->>Aggregate: validate()
    Aggregate->>Aggregate: apply(EventoCriado)
    Aggregate-->>CommandHandler: Event + uncommitted events
    
    CommandHandler->>EventStore: append(EventoCriado)
    EventStore-->>CommandHandler: version: 1
    
    CommandHandler->>EventBus: publish(EventoCriado)
    
    par Async Processing
        EventBus->>Projection: update read model
        EventBus->>Projection: send notifications
        EventBus->>Projection: update analytics
    end
    
    CommandHandler-->>API: Success
```

## CQRS Pattern

```mermaid
graph LR
    subgraph Write Side
        A[Command] --> B[Command Handler]
        B --> C[Aggregate]
        C --> D[Event Store]
        D --> E[Event Bus]
    end
    
    subgraph Read Side
        E --> F[Projection Handler]
        F --> G[Read Model DB]
        H[Query] --> G
        G --> I[Query Result]
    end
    
    style A fill:#ffe1e1
    style H fill:#e1ffe1
    style D fill:#f0f0f0
    style G fill:#f0f0f0
```

## Saga Orquestração

```mermaid
sequenceDiagram
    participant Saga
    participant EventService
    participant AssignmentService
    participant DeliveryService
    participant NotificationService

    Note over Saga: Criar Entrega Completa
    
    Saga->>EventService: Reservar oferta
    EventService-->>Saga: Oferta reservada
    
    Saga->>AssignmentService: Criar assignment
    AssignmentService-->>Saga: Assignment criado
    
    Saga->>DeliveryService: Criar delivery
    DeliveryService-->>Saga: Delivery criado
    
    Saga->>NotificationService: Notificar voluntário
    NotificationService-->>Saga: Notificação enviada
    
    Note over Saga: Sucesso!
    
    alt Falha em algum passo
        Saga->>DeliveryService: Cancelar delivery
        Saga->>AssignmentService: Cancelar assignment
        Saga->>EventService: Liberar reserva
        Note over Saga: Compensação completa
    end
```

## Plugin System Flow

```mermaid
graph TD
    A[Request: Criar Event] --> B{Qual categoria?}
    
    B -->|alimentos| C[FoodPlugin]
    B -->|roupas| D[ClothingPlugin]
    B -->|medicamentos| E[MedicinePlugin]
    
    C --> F[validate_metadata]
    D --> F
    E --> F
    
    F --> G{Válido?}
    
    G -->|Não| H[422 Validation Error]
    G -->|Sim| I[enrich_event]
    
    I --> J[Core: Salvar Event]
    J --> K[on_event_created hook]
    
    C -.-> K
    D -.-> K
    E -.-> K
    
    K --> L[Response]
    
    style C fill:#ffe1e1
    style D fill:#e1ffe1
    style E fill:#e1f5ff
```

## Matching Algorithm

```mermaid
graph TD
    A[Nova Necessidade] --> B[Buscar Ofertas<br/>mesma categoria]
    
    B --> C{Tem ofertas?}
    C -->|Não| D[Aguardar ofertas]
    C -->|Sim| E[Para cada oferta]
    
    E --> F[Base Score = 0]
    
    F --> G[+40: Categoria match]
    G --> H[+30: Quantidade OK]
    H --> I[+20: Distância < 10km]
    I --> J[+10: Tempo compatível]
    
    J --> K[Plugin ajusta score]
    
    K --> L{Score > 50?}
    L -->|Não| M[Descarta match]
    L -->|Sim| N[Adiciona à lista]
    
    N --> O[Ordena por score]
    O --> P[Retorna top 10 matches]
    
    style G fill:#90EE90
    style H fill:#90EE90
    style I fill:#90EE90
    style J fill:#90EE90
    style M fill:#FFB6C1
```

## Multi-Cidade Routing

```mermaid
graph LR
    A[Request] --> B{X-City-ID<br/>header?}
    
    B -->|Sim| C[Use header value]
    B -->|Não| D{User<br/>autenticado?}
    
    D -->|Sim| E[Use user.city_id]
    D -->|Não| F[Use default:<br/>'belo-horizonte']
    
    C --> G[Middleware injeta<br/>request.state.city_id]
    E --> G
    F --> G
    
    G --> H[Query filtra por city_id]
    H --> I[Response]
```

---

**Próximo**: [Domain Model Diagram](./domain-model.md)
