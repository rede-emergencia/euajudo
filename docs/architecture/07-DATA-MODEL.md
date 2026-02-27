# 🗄️ Data Model - Esquema Genérico

## Princípios do Design

1. **Genericidade**: Models servem para qualquer categoria
2. **Flexibilidade**: JSONB para campos específicos
3. **Performance**: Índices em campos críticos
4. **Auditoria**: Campos de tracking em tudo
5. **Multi-tenancy**: `city_id` em todas as tabelas

## Schema Principal

### Core Tables

```sql
-- Users (Identity Context)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    
    -- Multi-cidade
    city_id VARCHAR(50) NOT NULL DEFAULT 'belo-horizonte',
    
    -- Localização
    latitude FLOAT,
    longitude FLOAT,
    endereco TEXT,
    
    -- Roles (JSON array)
    roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Status
    aprovado BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_city ON users(city_id);
CREATE INDEX idx_users_aprovado ON users(aprovado) WHERE aprovado = TRUE;
CREATE INDEX idx_users_roles ON users USING GIN(roles);

-- Events (Catalog Context)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    
    -- Tipo e categoria
    type VARCHAR(50) NOT NULL, -- 'necessidade', 'oferta', 'entrega'
    category VARCHAR(100) NOT NULL, -- 'alimentos', 'roupas', 'medicamentos'
    subcategory VARCHAR(100),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    
    -- Relacionamentos
    creator_id INTEGER NOT NULL REFERENCES users(id),
    city_id VARCHAR(50) NOT NULL,
    parent_event_id INTEGER REFERENCES events(id), -- Para ofertas linkadas
    
    -- Localização
    location_id INTEGER REFERENCES locations(id),
    
    -- Tempo
    timeframe_start TIMESTAMP,
    timeframe_end TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Metadata flexível (JSONB)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Índices críticos
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_city_status ON events(city_id, status);
CREATE INDEX idx_events_creator ON events(creator_id);
CREATE INDEX idx_events_metadata ON events USING GIN(metadata);
CREATE INDEX idx_events_expires ON events(expires_at) WHERE expires_at IS NOT NULL;

-- Items de eventos
CREATE TABLE event_items (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Descrição
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Quantidade
    quantity FLOAT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    
    -- Tracking
    quantity_reserved FLOAT DEFAULT 0,
    quantity_delivered FLOAT DEFAULT 0,
    
    -- Categoria específica
    category VARCHAR(100),
    
    -- Metadata flexível
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Ordem
    position INTEGER DEFAULT 0,
    
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_event_items_event ON event_items(event_id);
CREATE INDEX idx_event_items_category ON event_items(category);

-- Locations (Shared)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'provider', 'receiver', 'pickup_point'
    
    -- Localização
    city_id VARCHAR(50) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    address TEXT NOT NULL,
    
    -- Contato
    responsavel VARCHAR(255),
    telefone VARCHAR(50),
    email VARCHAR(255),
    
    -- Capacidade
    capacity INTEGER,
    daily_need INTEGER,
    
    -- Horário
    operating_hours JSONB, -- {"seg": "08:00-18:00", ...}
    
    -- Status
    aprovado BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_city ON locations(city_id);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_geo ON locations(latitude, longitude);
CREATE INDEX idx_locations_aprovado ON locations(aprovado) WHERE aprovado = TRUE;

-- Assignments (Assignment Context)
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    
    -- Relacionamentos
    event_id INTEGER NOT NULL REFERENCES events(id),
    volunteer_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Localizações
    pickup_location_id INTEGER REFERENCES locations(id),
    delivery_location_id INTEGER REFERENCES locations(id),
    
    -- Tempo estimado
    estimated_start TIMESTAMP,
    estimated_end TIMESTAMP,
    
    -- Tracking
    accepted_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assignments_event ON assignments(event_id);
CREATE INDEX idx_assignments_volunteer ON assignments(volunteer_id);
CREATE INDEX idx_assignments_status ON assignments(status);

-- Assignment Items
CREATE TABLE assignment_items (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    event_item_id INTEGER NOT NULL REFERENCES event_items(id),
    
    quantity FLOAT NOT NULL,
    
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Deliveries (Delivery Context)
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Rota
    origin_location_id INTEGER REFERENCES locations(id),
    destination_location_id INTEGER REFERENCES locations(id),
    
    -- Tracking
    current_latitude FLOAT,
    current_longitude FLOAT,
    
    -- Tempo
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    
    -- Confirmação
    confirmation_code VARCHAR(6),
    photo_proof TEXT, -- URL ou base64
    signature TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deliveries_assignment ON deliveries(assignment_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- Waypoints (rota detalhada)
CREATE TABLE delivery_waypoints (
    id SERIAL PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Ordem
    position INTEGER NOT NULL
);

CREATE INDEX idx_waypoints_delivery ON delivery_waypoints(delivery_id);

-- Event Store (Event Sourcing)
CREATE TABLE event_store (
    id SERIAL PRIMARY KEY,
    
    -- Event
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL UNIQUE,
    
    -- Aggregate
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL,
    
    -- Data
    event_data JSONB NOT NULL,
    metadata JSONB,
    
    -- Context
    user_id INTEGER REFERENCES users(id),
    correlation_id VARCHAR(100),
    causation_id VARCHAR(100),
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: versão única por agregado
    CONSTRAINT unique_aggregate_version UNIQUE (aggregate_id, version)
);

CREATE INDEX idx_event_store_aggregate ON event_store(aggregate_type, aggregate_id);
CREATE INDEX idx_event_store_type ON event_store(event_type);
CREATE INDEX idx_event_store_timestamp ON event_store(timestamp);
CREATE INDEX idx_event_store_correlation ON event_store(correlation_id);
```

## Exemplos de Metadata

### Event - Alimentos
```json
{
  "quantidade": 100,
  "tipo_refeicao": "almoco",
  "horario_entrega": "12:00-14:00",
  "vegetariana": true,
  "sem_gluten": false,
  "observacoes": "Preferência por arroz integral",
  "tags": ["vegetariana", "almoco", "urgente"]
}
```

### Event - Roupas
```json
{
  "tamanhos": {
    "P": 10,
    "M": 20,
    "G": 15
  },
  "genero": "unissex",
  "estacao": "inverno",
  "tipos": ["casaco", "calca"],
  "estado": "novo",
  "tags": ["inverno", "agasalhos"]
}
```

### Event - Medicamentos
```json
{
  "receita_necessaria": false,
  "urgencia": "alta",
  "itens": [
    {
      "nome": "Dipirona",
      "quantidade": 100,
      "unidade": "comprimidos",
      "dosagem": "500mg"
    }
  ],
  "tags": ["medicamentos_basicos", "urgente"]
}
```

## Queries Comuns

### Buscar eventos ativos por categoria e cidade
```sql
SELECT e.*, 
       json_build_object(
           'name', u.nome,
           'phone', u.telefone
       ) as creator,
       json_build_object(
           'name', l.name,
           'address', l.address,
           'latitude', l.latitude,
           'longitude', l.longitude
       ) as location
FROM events e
JOIN users u ON e.creator_id = u.id
LEFT JOIN locations l ON e.location_id = l.id
WHERE e.city_id = 'juiz-de-fora'
  AND e.category = 'alimentos'
  AND e.status = 'active'
  AND e.expires_at > NOW()
ORDER BY e.created_at DESC;
```

### Buscar por metadata (JSONB)
```sql
-- Buscar eventos vegetarianos
SELECT * FROM events
WHERE category = 'alimentos'
  AND metadata->>'vegetariana' = 'true';

-- Buscar por tamanho de roupa
SELECT * FROM events
WHERE category = 'roupas'
  AND metadata->'tamanhos' ? 'M'; -- Tem tamanho M

-- Buscar medicamentos urgentes
SELECT * FROM events
WHERE category = 'medicamentos'
  AND metadata->>'urgencia' = 'alta';
```

### Estatísticas por categoria
```sql
SELECT 
    category,
    COUNT(*) as total_eventos,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as ativos,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completos
FROM events
WHERE city_id = 'juiz-de-fora'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY category;
```

## Migrations

### Criar migration
```python
# migrations/versions/001_create_core_schema.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

def upgrade():
    # Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('nome', sa.String(255), nullable=False),
        sa.Column('city_id', sa.String(50), nullable=False),
        sa.Column('roles', JSONB, nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    
    op.create_index('idx_users_city', 'users', ['city_id'])
    op.create_index('idx_users_roles', 'users', ['roles'], postgresql_using='gin')
    
    # Events
    op.create_table(
        'events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('city_id', sa.String(50), nullable=False),
        sa.Column('metadata', JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_events_city_status', 'events', ['city_id', 'status'])
    op.create_index('idx_events_metadata', 'events', ['metadata'], postgresql_using='gin')

def downgrade():
    op.drop_table('events')
    op.drop_table('users')
```

## Performance Optimization

### Índices GIN para JSONB
```sql
-- Índice para queries em metadata
CREATE INDEX idx_events_metadata_gin ON events USING GIN(metadata);

-- Índice parcial para campos específicos
CREATE INDEX idx_events_vegetarian ON events((metadata->>'vegetariana'))
WHERE category = 'alimentos';

-- Índice para arrays em JSONB
CREATE INDEX idx_events_tags ON events USING GIN((metadata->'tags'));
```

### Particionamento por cidade
```sql
-- Particionar tabela events por city_id
CREATE TABLE events_partitioned (
    LIKE events INCLUDING ALL
) PARTITION BY LIST (city_id);

-- Criar partições
CREATE TABLE events_jf PARTITION OF events_partitioned
    FOR VALUES IN ('juiz-de-fora');

CREATE TABLE events_bh PARTITION OF events_partitioned
    FOR VALUES IN ('belo-horizonte');
```

### Materialized Views
```sql
-- View materializada para dashboard
CREATE MATERIALIZED VIEW events_summary AS
SELECT 
    city_id,
    category,
    status,
    DATE(created_at) as date,
    COUNT(*) as count,
    SUM((metadata->>'quantidade')::int) as total_quantity
FROM events
GROUP BY city_id, category, status, DATE(created_at);

-- Índices na view
CREATE INDEX idx_events_summary_city ON events_summary(city_id);

-- Refresh periódico
REFRESH MATERIALIZED VIEW CONCURRENTLY events_summary;
```

## Backup & Recovery

```bash
# Backup completo
pg_dump -Fc jfood_prod > backup_$(date +%Y%m%d).dump

# Backup apenas schema
pg_dump -Fc --schema-only jfood_prod > schema.dump

# Backup apenas dados
pg_dump -Fc --data-only jfood_prod > data.dump

# Restore
pg_restore -d jfood_prod backup.dump

# Backup contínuo (WAL archiving)
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

---

**Próximo**: [API Design](./08-API-DESIGN.md)
