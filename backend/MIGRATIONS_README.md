# 🗄️ Sistema de Migrações do Banco de Dados

Este projeto usa **Alembic** para gerenciar migrações do banco de dados SQLite, garantindo versionamento e controle sobre mudanças no schema.

---

## 🚀 Setup Inicial

O sistema já está configurado com:
- ✅ `alembic.ini` - Configuração do Alembic
- ✅ `alembic/env.py` - Ambiente de migrações
- ✅ `alembic/script.py.mako` - Template para migrações
- ✅ `migrate.sh` - Script facilitador

---

## 📋 Migrações Atuais

### **5044685dba9b** - `initial_schema_with_logistics_and_services`
- ✅ Schema completo do sistema
- ✅ Suporte a logística (pickup + delivery locations)
- ✅ Suporte a serviços voluntários
- ✅ Sistema de inventário completo
- ✅ Todas as tabelas e relacionamentos

---

## 🛠️ Como Usar

### **Script Facilitador (Recomendado)**

```bash
# Verificar migração atual
./migrate.sh current

# Aplicar migrações pendentes
./migrate.sh upgrade

# Criar nova migração
./migrate.sh revision -m "nome_da_mudanca"

# Ver histórico completo
./migrate.sh history

# Reverter última migração
./migrate.sh downgrade

# Reset completo do banco (PERIGO!)
./migrate.sh reset
```

### **Comandos Diretos do Alembic**

```bash
# Ativar ambiente virtual primeiro
source venv/bin/activate

# Verificar status atual
python -m alembic -c alembic.ini current

# Aplicar migrações
python -m alembic -c alembic.ini upgrade head

# Criar nova migração
python -m alembic -c alembic.ini revision -m "descricao"

# Histórico
python -m alembic -c alembic.ini history
```

---

## 🏗️ Fluxo de Trabalho

### **1. Mudar Modelos**
```python
# Em app/models.py ou app/inventory_models.py
class NovoModelo(Base):
    __tablename__ = "novo_modelo"
    id = Column(Integer, primary_key=True)
    novo_campo = Column(String, nullable=True)
```

### **2. Gerar Migração**
```bash
./migrate.sh revision -m "add_novo_modelo"
```

### **3. Revisar Migração**
O Alembic gera automaticamente as mudanças detectadas. Revise o arquivo gerado em `alembic/versions/`.

### **4. Aplicar Migração**
```bash
./migrate.sh upgrade
```

---

## 📊 Estrutura do Banco

### **Tabelas Principais**
- `users` - Usuários e papéis
- `categories` - Sistema de categorias genérico
- `delivery_locations` - Locais de entrega/retirada
- `deliveries` - Entregas com suporte a logística e serviços
- `product_batches` - Lotes de produtos
- `inventory_items` - Estoque de abrigos
- `shelter_requests` - Pedidos de doação
- `distribution_records` - Distribuição para beneficiários

### **Sistema de Categorias**
- **Produtos**: Água, Alimentos, Roupas, Medicamentos, etc.
- **Serviços**: Limpeza, Manutenção, Jardinagem, Aulas, Saúde, Transporte

### **Logística Completa**
- `pickup_location_id` - Onde retirar (nullable)
- `delivery_location_id` - Onde entregar (obrigatório)
- Suporta: Doação direta, Logística A→B, Serviços

---

## 🔄 Reset e Seed

### **Reset Completo**
```bash
# Reset banco + aplicar schema
./migrate.sh reset

# Popular dados iniciais
python seed_small.py

# Adicionar categorias de serviços
python seed_services.py
```

### **Apenas Reset Dados**
```bash
# Limpa dados mas mantém schema
python reset_db.py

# Repopular
python seed_small.py
```

---

## 🚨 Boas Práticas

### **1. Sempre Teste em Desenvolvimento**
- Use banco de testes: `test_*.db`
- Verifique rollback: `./migrate.sh downgrade`

### **2. Nomes Descritivos**
```bash
# ✅ Bom
./migrate.sh revision -m "add_user_profile_fields"

# ❌ Ruim
./migrate.sh revision -m "fix_stuff"
```

### **3. Revisar Migrações Geradas**
- Verifique se todas as mudanças foram detectadas
- Adicione índices se necessário
- Verifique constraints e defaults

### **4. Backup Antes de Mudanças**
```bash
# Backup do banco atual
cp euajudo.db euajudo.db.backup
```

---

## 🔍 Debug e Troubleshooting

### **Verificar Schema Atual**
```bash
sqlite3 euajudo.db ".schema"
```

### **Verificar Tabelas**
```bash
sqlite3 euajudo.db ".tables"
```

### **Verificar Migrações Aplicadas**
```bash
sqlite3 euajudo.db "SELECT * FROM alembic_version;"
```

### **Problemas Comuns**

1. **"No such table"**
   - Execute `./migrate.sh upgrade`

2. **"Foreign key constraint failed"**
   - Verifique ordem das operações na migração
   - Use `op.execute("PRAGMA foreign_keys=OFF")` se necessário

3. **Migration não detecta mudanças**
   - Importe todos os modelos em `alembic/env.py`
   - Verifique se `target_metadata = Base.metadata`

---

## 📋 Checklist de Deploy

### **Antes de Deploy:**
- [ ] Backup do banco atual
- [ ] Testar migrações em ambiente de staging
- [ ] Verificar rollback funciona
- [ ] Documentar mudanças

### **Durante Deploy:**
- [ ] Aplicar migrações: `./migrate.sh upgrade`
- [ ] Verificar se aplicou: `./migrate.sh current`
- [ ] Testar funcionalidades críticas

### **Pós-Deploy:**
- [ ] Monitorar logs de erro
- [ ] Verificar performance
- [ ] Documentar no changelog

---

## 🎯 Futuro do Sistema

### **Próximas Migrações Planejadas:**
- Sistema de ratings/reviews
- Notificações push
- Chat entre usuários
- Sistema de pontos/recompensas

### **Melhorias no Processo:**
- Migrações automáticas no CI/CD
- Validação automática de schema
- Backup automático antes de migrações

---

## 📞 Ajuda

Se tiver problemas com migrações:
1. Verifique este README
2. Use `./migrate.sh help`
3. Consulte logs do Alembic
4. Backup do banco e reset se necessário

**Lembre-se:** Como ainda estamos em desenvolvimento, é seguro resetar o banco quando necessário! 🚀
