# 🚀 Guia Rápido - VouAjudar

## 📋 Fluxo de Desenvolvimento Recomendado

### 1. Setup Inicial
```bash
make setup
```

### 2. Gerenciamento do Banco de Dados

#### 🗑️ Limpar Banco Completo
```bash
make reset-db
```

#### 👤 Criar Apenas Admin
```bash
make create-admin
```
- **Email:** `admin@euajudo.com`
- **Senha:** `123`

#### 🌱 Popular com Dados de Teste (Seguro)
```bash
make seed-safe
```
- ✅ Não duplica usuários existentes
- ✅ Pode ser rodado várias vezes
- ✅ Cria: 5 restaurantes, 6 abrigos, 3 voluntários, 6 locais

#### 🔄 Fluxo Completo do Zero
```bash
make reset-db && make create-admin && make seed-safe
```

### 3. Iniciar Serviços
```bash
make dev
```

### 4. Parar Serviços
```bash
make kill
```

## 🔑 Credenciais de Teste

**Senha para todos:** `123`

### 👤 Administrador
- **Email:** `admin@euajudo.com`
- **Acesso:** `http://localhost:3000/dashboard/admin`

### 🍽️ Restaurantes
- `restaurante.bom.sabor@euajudo.com`
- `restaurante.sabores.casa@euajudo.com`
- `restaurante.maria.sopa@euajudo.com`
- `restaurante.prato.feito@euajudo.com`
- `restaurante.porta.fechada.com` (desativado)

### 🏠 Abrigos
- `abrigo.sao.francisco@euajudo.com`
- `abrigo.carmo@euajudo.com`
- `abrigo.bom.pastor@euajudo.com`
- `abrigo.esperanca@euajudo.com`
- `abrigo.caridade@euajudo.com`
- `abrigo.luz@euajudo.com`

### 🙋 Voluntários
- `joao.voluntario@euajudo.com`
- `maria.voluntaria@euajudo.com`
- `pedro.entregador@euajudo.com`

## 🎯 Casos de Uso

### Teste 1: Apenas Admin
```bash
make reset-db && make create-admin && make dev
```
- Banco limpo com apenas admin
- Ideal para testar criação de usuários

### Teste 2: Dados Completos
```bash
make reset-db && make create-admin && make seed-safe && make dev
```
- Todos os dados de teste
- Ideal para testar funcionalidades completas

### Teste 3: Adicionar Mais Dados
```bash
make seed-safe
```
- Adiciona dados sem duplicar existentes
- Pode ser rodado múltiplas vezes

## 🔧 Comandos Úteis

### Verificar Status
```bash
make status          # Status dos serviços
make seed-status     # Status do banco
```

### Logs
```bash
make logs            # Ver logs em tempo real
tail -f backend.log  # Apenas backend
tail -f frontend.log # Apenas frontend
```

### Limpeza
```bash
make clean           # Limpa arquivos temporários
make db-backup       # Backup do banco
```

## 🌐 URLs de Acesso

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/docs`
- **Painel Admin:** `http://localhost:3000/dashboard/admin`

## ⚠️ Importante

- **Sempre use `seed-safe`** em vez do `seed` antigo
- **`reset-db` limpa TUDO** - use com cuidado
- **`create-admin` é idempotente** - pode ser rodado várias vezes
- **`seed-safe` é idempotente** - pode ser rodado várias vezes
