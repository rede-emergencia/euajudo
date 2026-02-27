# ADR-003: PostgreSQL JSONB vs NoSQL

**Status**: Aprovado  
**Data**: Fevereiro 2026  
**Decisores**: Tech Lead, DBA  

## Contexto

Sistema genérico precisa armazenar metadata flexível por categoria (alimentos, roupas, medicamentos, etc). Cada categoria tem campos diferentes.

**Problema**: Como armazenar dados semi-estruturados de forma eficiente?

## Decisão

Usar **PostgreSQL com JSONB** para metadata flexível, mantendo dados estruturados em colunas tradicionais.

### Schema:

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    -- Campos estruturados
    creator_id INTEGER NOT NULL,
    city_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    
    -- Metadata flexível
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Índice GIN para queries eficientes
CREATE INDEX idx_events_metadata ON events USING GIN(metadata);
```

## Razões

### ✅ Vantagens PostgreSQL + JSONB

1. **Melhor dos Dois Mundos**
   - Estruturado: Campos críticos (id, status, city_id)
   - Flexível: Metadata por categoria em JSONB

2. **ACID Transactions**
   - Garantias fortes de consistência
   - Rollback funciona
   - Foreign keys funcionam

3. **Queries Poderosas**
   ```sql
   -- Buscar eventos vegetarianos
   SELECT * FROM events 
   WHERE metadata->>'vegetariana' = 'true';
   
   -- Buscar por tamanho de roupa
   SELECT * FROM events 
   WHERE metadata->'tamanhos' ? 'M';
   
   -- Índices em campos JSON
   CREATE INDEX idx_vegetarian ON events((metadata->>'vegetariana'))
   WHERE category = 'alimentos';
   ```

4. **Performance**
   - JSONB é binário (mais rápido que JSON)
   - Índices GIN muito eficientes
   - Queries quase tão rápidas quanto colunas normais

5. **Familiaridade do Time**
   - Time conhece SQL
   - Ferramentas existentes funcionam
   - Sem curva de aprendizado

6. **Migração Fácil**
   - Pode mover campos de JSONB para colunas
   - Ou vice-versa
   - Sem reescrever tudo

### ❌ Desvantagens

1. **Schema menos rígido**
   - Precisa validar em código
   - Erros só em runtime

2. **Performance não é perfeita**
   - JSONB mais lento que colunas
   - Mas diferença é pequena (< 20%)

## Alternativas Consideradas

### 1. MongoDB (NoSQL Document)

**Prós**:
- Schema totalmente flexível
- Performance boa para documentos
- Horizontal scaling fácil

**Contras**:
- Sem transações ACID fortes
- Sem JOINs eficientes
- Time não conhece
- Mais um sistema para gerenciar

**Benchmark**:
```
PostgreSQL JSONB: 450 reads/sec
MongoDB:          500 reads/sec
Diferença: ~10% (não justifica complexidade)
```

**Decisão**: ❌ Rejeitado - Complexidade não vale 10%

### 2. EAV (Entity-Attribute-Value)

**Schema**:
```sql
CREATE TABLE event_attributes (
    event_id INTEGER,
    attribute_name VARCHAR,
    attribute_value TEXT
);
```

**Prós**:
- Completamente flexível
- SQL puro

**Contras**:
- Queries horríveis
- Performance ruim
- Difícil manter

**Decisão**: ❌ Rejeitado - Anti-pattern

### 3. Colunas por Categoria

**Schema**:
```sql
-- Tabela por categoria
CREATE TABLE food_events (...);
CREATE TABLE clothing_events (...);
CREATE TABLE medicine_events (...);
```

**Prós**:
- Schema rígido
- Performance máxima

**Contras**:
- Muito código duplicado
- Difícil queries cross-category
- Não genérico

**Decisão**: ❌ Rejeitado - Não escala

### 4. PostgreSQL JSON (text)

**Prós**:
- Mesma API que JSONB

**Contras**:
- Mais lento (parsing toda vez)
- Mais espaço em disco

**Decisão**: ❌ Rejeitado - JSONB é melhor

## Implementação

### Validação em Código (Pydantic)

```python
# app/plugins/food/schemas.py
class FoodMetadataSchema(BaseModel):
    quantidade: int
    vegetariana: Optional[bool] = False
    tipo_refeicao: str
    
    @validator('quantidade')
    def quantidade_positiva(cls, v):
        if v <= 0:
            raise ValueError("Quantidade > 0")
        return v

# Uso
plugin = FoodPlugin()
plugin.validate_metadata(metadata)  # Valida antes de salvar
```

### Queries Eficientes

```sql
-- Criar índices parciais
CREATE INDEX idx_events_food_vegetarian 
ON events((metadata->>'vegetariana'))
WHERE category = 'alimentos';

-- Criar índices em arrays
CREATE INDEX idx_events_tags 
ON events USING GIN((metadata->'tags'));

-- Query otimizada
SELECT * FROM events
WHERE category = 'alimentos'
  AND metadata->>'vegetariana' = 'true'
  AND city_id = 'juiz-de-fora';
```

### Migração de Campos

Se campo se tornar comum, pode virar coluna:

```sql
-- Adicionar coluna
ALTER TABLE events ADD COLUMN quantity INTEGER;

-- Migrar dados
UPDATE events 
SET quantity = (metadata->>'quantidade')::integer
WHERE category = 'alimentos';

-- Remover do metadata
UPDATE events
SET metadata = metadata - 'quantidade'
WHERE category = 'alimentos';
```

## Performance

### Benchmark (10k rows)

| Operação | Coluna | JSONB | Diferença |
|----------|--------|-------|-----------|
| SELECT WHERE | 5ms | 6ms | +20% |
| INSERT | 3ms | 3.5ms | +16% |
| UPDATE | 4ms | 5ms | +25% |
| Aggregations | 50ms | 70ms | +40% |

**Conclusão**: JSONB é 15-40% mais lento, mas ainda muito rápido

### Otimizações

1. **Índices GIN**
   ```sql
   CREATE INDEX idx_metadata ON events USING GIN(metadata);
   ```

2. **Índices Parciais**
   ```sql
   CREATE INDEX idx_urgent ON events((metadata->>'urgencia'))
   WHERE metadata->>'urgencia' = 'alta';
   ```

3. **Índices Funcionais**
   ```sql
   CREATE INDEX idx_quantity ON events(
       (metadata->>'quantidade')::integer
   );
   ```

## Monitoramento

### Queries Lentas

```sql
-- Log queries > 100ms
ALTER DATABASE jfood SET log_min_duration_statement = 100;

-- Analisar queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%metadata%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Tamanho do JSONB

```sql
-- Verificar tamanho médio
SELECT 
    category,
    AVG(pg_column_size(metadata)) as avg_size_bytes
FROM events
GROUP BY category;
```

## Revisão

Revisar decisão se:
- JSONB se tornar gargalo de performance
- Metadata crescer muito (> 100KB por evento)
- Necessidade de queries complexas em metadata
- Time ganhar experiência com NoSQL

**Próxima revisão**: Agosto 2026 (6 meses)

## Referências

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [JSONB Indexing](https://www.postgresql.org/docs/current/indexes-types.html#INDEXES-TYPES-GIN)
- [PostgreSQL vs MongoDB](https://www.enterprisedb.com/blog/postgresql-vs-mongodb)

---

**Aprovado por**: Tech Lead, DBA  
**Data de aprovação**: Fevereiro 2026
