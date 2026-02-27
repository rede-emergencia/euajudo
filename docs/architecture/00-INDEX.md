# 📚 Índice de Documentação Arquitetural

> **Objetivo**: Evoluir de um MVP específico (marmitas) para uma plataforma genérica e escalável de conexão entre necessidades e ofertas.

## 📖 Documentos Principais

### Fase 1: Fundamentos
1. **[Visão Geral](./01-VISION.md)**
   - Conceito do sistema genérico
   - Evolução MVP → Plataforma escalável
   - Objetivos de longo prazo

2. **[Event-Driven Design](./02-EVENT-DRIVEN-DESIGN.md)**
   - Arquitetura orientada a eventos
   - Padrões de comunicação assíncrona
   - Event sourcing e CQRS

3. **[Domain Model](./03-DOMAIN-MODEL.md)**
   - Domain-Driven Design (DDD)
   - Bounded contexts
   - Agregados e entidades

### Fase 2: Implementação
4. **[Estratégia de Migração](./04-MIGRATION-STRATEGY.md)**
   - Migração incremental MVP → Genérico
   - Strangler Fig Pattern
   - Plano de ação semana a semana

5. **[Arquitetura Modular](./05-MODULAR-ARCHITECTURE.md)**
   - Sistema de plugins
   - Módulos por categoria
   - Extensibilidade

6. **[Microserviços](./06-MICROSERVICES.md)**
   - Quando e como migrar
   - Service boundaries
   - Comunicação entre serviços

### Fase 3: Detalhamento Técnico
7. **[Modelo de Dados](./07-DATA-MODEL.md)**
   - Schema genérico
   - Uso de JSONB para flexibilidade
   - Migrations strategy

8. **[Design de APIs](./08-API-DESIGN.md)**
   - RESTful design genérico
   - Versionamento
   - Contratos de API

9. **[Padrões de Código](./09-CODE-PATTERNS.md)**
   - Repository pattern
   - Service layer
   - Dependency injection

### Fase 4: Operações e Escala
10. **[Observabilidade](./10-OBSERVABILITY.md)**
    - Logging estruturado
    - Métricas e dashboards
    - Tracing distribuído

11. **[Deploy e CI/CD](./11-DEPLOYMENT.md)**
    - Estratégias de deploy
    - Blue-green deployment
    - Feature flags

## 🎨 Diagramas

- [Fluxo de Eventos](./diagrams/event-flow.md)
- [Modelo de Domínio](./diagrams/domain-model.md)
- [Camadas da Arquitetura](./diagrams/architecture-layers.md)
- [Microserviços Futuros](./diagrams/microservices.md)

## 🚀 Guias Práticos

- [Quick Start: Adicionar Nova Categoria](./guides/add-category.md)
- [Como Implementar um Plugin](./guides/plugin-development.md)
- [Migração de Código Legacy](./guides/legacy-migration.md)

## 📋 Decisões Arquiteturais (ADRs)

- [ADR-001: Event-Driven vs CRUD](./adr/001-event-driven.md)
- [ADR-002: Monolito Modular vs Microserviços](./adr/002-modular-monolith.md)
- [ADR-003: PostgreSQL JSONB vs NoSQL](./adr/003-jsonb-choice.md)
- [ADR-004: Naming Convention (PT-BR vs EN)](./adr/004-naming.md)

## 🎯 Próximos Passos

1. ✅ Ler [Visão Geral](./01-VISION.md) para entender o conceito
2. ✅ Estudar [Event-Driven Design](./02-EVENT-DRIVEN-DESIGN.md) 
3. ✅ Revisar [Estratégia de Migração](./04-MIGRATION-STRATEGY.md)
4. ✅ Implementar primeiro módulo genérico
5. ✅ Testar com categoria "marmitas"
6. ✅ Adicionar segunda categoria (roupas ou medicamentos)

---

**Última atualização**: Fevereiro 2026  
**Versão**: 1.0  
**Status**: Em desenvolvimento
