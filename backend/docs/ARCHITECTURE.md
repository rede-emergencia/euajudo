# Backend Architecture

## Domain Model

```
Shelter (Actor who needs help)
  └── NeedRequest (ShelterRequest) — "Preciso de X unidades de Água"
        │
        ├── DonationCommitment (MVP)
        │   Voluntário traz itens direto ao abrigo
        │   Delivery { batch_id=NULL, pickup_location_id=NULL }
        │   Pickup code → shelter confirma recebimento
        │
        ├── LogisticsTask (Fase 2)
        │   Alguém tem items em A, voluntário busca e leva a B
        │   Delivery { pickup_location_id=A, delivery_location_id=B }
        │   pickup_code (origem) + delivery_code (destino)
        │
        └── ServiceSignup (Fase 3) ← novo model necessário
            Abrigo pede serviço (limpeza, médico, eletricista)
            ServiceRequest { slots=10, scheduled_at=... }
            Voluntário se inscreve → ServiceSignup
```

## Camadas

```
routers/          HTTP boundary: auth, input validation, HTTP errors
services/         Business logic: ACID, events, domain rules
inventory_models/ Domain models: ShelterRequest, InventoryItem, etc.
models.py         Infrastructure models: User, Delivery, Location, Category
core/events.py    Event bus (sync agora, Kafka-ready)
repositories.py   BaseRepository: CRUD genérico (a usar nos services)
```

## Fluxo de Doação (MVP)

```
Volunteer                 Backend                    Shelter
   │                         │                          │
   ├─ POST /donations/commit ──►                         │
   │   { shelter_id, items }  │                         │
   │                    DonationService                  │
   │                    ├─ lock ShelterRequest           │
   │                    ├─ create Delivery               │
   │                    ├─ create ShelterRequestDelivery │
   │                    ├─ emit DonationCommitted        │
   │                    └─ return { code, delivery_ids } │
   │◄── { code: "847291" } ──┤                          │
   │                         │                          │
   │  [vai até o abrigo]      │                         │
   │                         │◄── POST /confirm { code }─┤
   │                    DonationService                  │
   │                    ├─ validate pickup_code          │
   │                    ├─ status → DELIVERED            │
   │                    ├─ inventory_service.on_delivered│
   │                    │   ├─ InventoryItem += qty      │
   │                    │   └─ ShelterRequest.received++ │
   │                    └─ emit DonationDelivered        │
   │                         │──► { status: delivered } ─►
```

## Cancelamento

```
Volunteer cancela antes de entregar:
  DELETE /donations/commitments/{id}
    → on_delivery_cancelled()
      ├─ remove ShelterRequestDelivery link
      └─ revert ShelterRequest.status → "pending" (se era único link)
    → delete Delivery
    → emit DonationCancelled
```

## Event Bus

Todos os eventos passam por `core/events.py`:

```python
# Emitir
bus.emit(DonationCommitted(delivery_ids=[1,2], shelter_id=5, ...))

# Subscribir
bus.subscribe("donation.*", my_handler)
bus.subscribe("*", audit_logger)
```

**Para migrar para Kafka**: troca `SyncEventBus` por `KafkaEventBus`.
Os eventos já são dicts serializáveis. Nenhuma mudança nos domínios.

## Invariantes Críticos

| Invariante | Onde é garantida |
|---|---|
| Voluntário não pode sobre-comprometer quantidade | `DonationService._lock_and_validate_request()` com `with_for_update()` |
| Cancelamento restaura estado do pedido | `on_delivery_cancelled()` em `inventory_service.py` |
| Código de confirmação é único e criptográfico | `ConfirmationCodeValidator.generate_code()` usa `secrets` |
| Entrega não pode ser cancelada após DELIVERED | `DonationService._guard_cancellable()` |

## O que ainda falta

### Fase 2 — LogisticsTask
- Novo endpoint: `POST /api/logistics/tasks`
- Usa `Delivery` model já existente com `pickup_location_id != NULL`
- `LogisticsService` similar ao `DonationService`
- Dois códigos: pickup_code (origem) e delivery_code (destino)

### Fase 3 — ServiceRequest
Modelo novo necessário:
```python
class ServiceRequest(Base):
    __tablename__ = "service_requests"
    shelter_id    # quem pediu
    category_id   # tipo de serviço (limpeza, médico, eletricista)
    slots         # quantas pessoas precisam
    slots_filled  # quantas confirmaram
    scheduled_at  # quando
    description   # detalhes do serviço
    status        # pending, active, completed, cancelled

class ServiceSignup(Base):
    __tablename__ = "service_signups"
    service_request_id
    volunteer_id
    status          # signed_up, confirmed, cancelled, no_show
    confirmation_code
    signed_up_at
    cancelled_at
```

### Kafka (quando escalar)

```python
# Troca de uma linha em main.py:
bus = KafkaEventBus(broker="kafka:9092", topic_prefix="euajudo")

# Eventos viram mensagens em tópicos:
# euajudo.donation.committed
# euajudo.donation.cancelled
# euajudo.donation.delivered
# euajudo.need_request.created
```

## Problemas Conhecidos / Tech Debt

1. `ResourceRequest/ResourceReservation` — sistema legado paralelo ao `ShelterRequest/Delivery`. A unificar.
2. `Order` model em `models.py` — dead code, a remover.
3. `ProductType` enum em `Delivery.product_type` — legacy, a migrar para `category_id` obrigatório.
4. `User` model tem campos de shelter, volunteer e provider misturados — a separar em profiles.
5. Routers com lógica de negócio (`deliveries.py` 27KB) — migrar para services progressivamente.
6. `BaseRepository` existe mas não é usado — adotar nos novos services.
