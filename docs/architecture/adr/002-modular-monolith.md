# ADR-002: Monolito Modular vs Microserviços

**Status**: Aprovado  
**Data**: Fevereiro 2026  
**Decisores**: Tech Lead, CTO  

## Contexto

Sistema precisa escalar, mas time é pequeno (2-3 devs) e não tem experiência com microserviços distribuídos. Infraestrutura atual é simples (single server).

## Decisão

Começaremos com **Monolito Modular** e migraremos para microserviços apenas quando houver necessidade real e comprovada.

### Definição:

**Monolito Modular** = Aplicação única com módulos bem definidos e isolados

```
┌─────────────────────────────────┐
│     FastAPI Application         │
├─────────────────────────────────┤
│  Core  │ Plugins │ Infrastructure│
└─────────────────────────────────┘
         Single Deployment
```

## Razões

### ✅ Por que Monolito Modular?

1. **Simplicidade Operacional**
   - Um único deploy
   - Logs centralizados
   - Debugging mais fácil
   - Menos infraestrutura

2. **Performance**
   - Chamadas de função (não HTTP)
   - Sem latência de rede
   - Transações ACID nativas

3. **Produtividade do Time**
   - Time pequeno pode focar no negócio
   - Menos overhead de comunicação entre serviços
   - Desenvolvimento mais rápido

4. **Custo**
   - Um servidor vs múltiplos
   - Sem necessidade de service mesh, API gateway, etc.
   - ~$50/mês vs ~$500/mês

5. **Modularidade Mantida**
   - Plugins isolados
   - Bounded contexts respeitados
   - Preparado para microserviços no futuro

### ❌ Por que NÃO Microserviços Agora?

1. **Complexidade Prematura**
   - Time não tem experiência
   - Overhead de DevOps
   - Debugging distribuído difícil

2. **Custo Alto**
   - Infraestrutura
   - Tempo de desenvolvimento
   - Manutenção

3. **Não Há Necessidade**
   - Tráfego baixo (< 100 req/min)
   - Uma cidade
   - Time pequeno

## Gatilhos para Migração

Migrar para microserviços quando **2+ condições** forem verdadeiras:

### Técnicos
- ✅ Tráfego > 1000 req/min
- ✅ Partes do sistema precisam escalar independentemente
- ✅ Deploy de uma parte impacta o sistema todo
- ✅ Database se torna gargalo

### Organizacionais
- ✅ Time > 10 desenvolvedores
- ✅ Múltiplos times trabalhando no mesmo código
- ✅ Conflitos frequentes de merge
- ✅ Ciclos de release muito longos

## Estratégia de Migração Futura

### Passo 1: Extrair Serviço Menos Crítico
Exemplo: Notification Service

**Por quê?**
- Não é crítico (falha não para sistema)
- Alto volume (muitas notificações)
- Isolado (poucas dependências)

### Passo 2: Validar Infraestrutura
- Service discovery
- API Gateway
- Monitoring distribuído
- Tracing

### Passo 3: Extrair Serviços Críticos
- Event Service
- Assignment Service
- etc.

## Arquitetura Modular

```python
app/
├── core/              # Núcleo genérico
│   ├── domain/
│   ├── application/
│   └── interfaces/
│
├── plugins/           # Módulos por categoria
│   ├── food/
│   ├── clothing/
│   └── medicine/
│
└── infrastructure/    # Implementações
    ├── repositories/
    ├── database/
    └── events/
```

### Regras de Modularidade

1. **Plugins não se conhecem**
   ```python
   # ❌ ERRADO
   from app.plugins.food import FoodPlugin
   
   # ✅ CERTO
   plugin = plugin_registry.get("alimentos")
   ```

2. **Core não conhece plugins**
   ```python
   # ❌ ERRADO
   if event.category == "alimentos":
       # lógica específica
   
   # ✅ CERTO
   plugin = plugin_registry.get(event.category)
   plugin.enrich_event(event)
   ```

3. **Dependências claras**
   ```
   API → Application → Domain ← Infrastructure
                ↑
              Plugins
   ```

## Alternativas Consideradas

### 1. Microserviços Desde o Início
**Prós**: Escalável desde day 1  
**Contras**: Over-engineering, custo alto, time não pronto  
**Decisão**: ❌ Rejeitado

### 2. Monolito Tradicional (Não Modular)
**Prós**: Mais simples ainda  
**Contras**: Difícil migrar depois  
**Decisão**: ❌ Rejeitado

### 3. Serverless (Lambda)
**Prós**: Auto-scaling, sem gerenciar servers  
**Contras**: Latência cold start, vendor lock-in  
**Decisão**: ❌ Rejeitado - Não se encaixa

## Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Deploy time | < 5 min |
| Tempo para adicionar categoria | < 2 dias |
| Bug fix time | < 1 dia |
| Onboarding novo dev | < 1 semana |

## Revisão

Esta decisão será revisada quando:
- Tráfego atingir 1000 req/min
- Time crescer para 10+ pessoas
- Database se tornar gargalo
- Deploy causar problemas frequentes

**Próxima revisão**: Junho 2026 (4 meses)

## Referências

- [Monolith First - Martin Fowler](https://martinfowler.com/bliki/MonolithFirst.html)
- [Modular Monolith - Simon Brown](https://www.youtube.com/watch?v=5OjqD-ow8GE)
- [Don't Start With a Monolith](https://martinfowler.com/articles/dont-start-monolith.html)

---

**Aprovado por**: Tech Lead, CTO  
**Data de aprovação**: Fevereiro 2026
