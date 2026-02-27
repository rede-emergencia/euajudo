# 📖 Guia do Makefile - EuAjudo

Este documento explica em detalhes como usar o Makefile para facilitar o desenvolvimento do projeto EuAjudo.

## 🚀 Começando Rápido

### Setup Completo em 3 Comandos
```bash
make setup    # Configura ambiente (Python + Node + deps)
make seed     # Popula banco com dados de teste  
make dev      # Inicia frontend + backend em background
```

### Parar Serviços
```bash
make kill      # Para todos os serviços
```

## 📋 Comandos Detalhados

### 🔧 Ambiente
- **`make setup`**: Configura ambiente completo
  - Verifica Python 3.8+ e Node.js 16+
  - Cria ambiente virtual Python
  - Instala dependências do backend
  - Instala dependências do frontend
  - Copia arquivos .env.example para .env

- **`make seed`**: Popula banco de dados
  - Cria tabelas do banco
  - Insere dados de teste
  - Exibe credenciais de teste

- **`make clean`**: Limpa arquivos temporários
  - Remove logs e arquivos PID
  - Limpa cache do frontend
  - Remove __pycache__ do backend

### 🚀 Desenvolvimento
- **`make dev`**: Inicia ambos serviços em background
  - Backend: http://localhost:8000
  - Frontend: http://localhost:3000
  - Logs salvos em backend.log e frontend.log
  - PIDs salvos em backend.pid e frontend.pid

- **`make backend`**: Inicia apenas o backend
  - Roda na porta 8000
  - Com auto-reload
  - Logs no terminal

- **`make frontend`**: Inicia apenas o frontend
  - Roda na porta 3000
  - Com hot-reload
  - Logs no terminal

- **`make kill`**: Para todos os serviços
  - Mata processos backend e frontend
  - Remove arquivos PID
  - Limpa logs

### 🧊 Banco de Dados
- **`make db-reset`**: Reset completo do banco
  - Apaga e recria tabelas
  - Perde todos os dados

- **`make db-backup`**: Backup do SQLite
  - Cria cópia com timestamp
  - Salva como euajudo_backup_YYYYMMDD_HHMMSS.db

### 🔍 Qualidade de Código
- **`make test`**: Roda todos os testes
  - Backend: pytest com coverage
  - Frontend: npm test com coverage

- **`make lint`**: Verifica código
  - Backend: flake8
  - Frontend: eslint

- **`make format`**: Formata código
  - Backend: black
  - Frontend: prettier

### 📊 Monitoramento
- **`make status`**: Verifica status dos serviços
  - Mostra se backend/frontend estão rodando
  - Exibe URLs e portas
  - Verifica ambiente configurado

- **`make logs`**: Exibe logs em tempo real
  - Tail de backend.log e frontend.log
  - Ctrl+C para sair

## 🎯 Fluxo de Trabalho Típico

### Primeiro Setup
```bash
git clone https://github.com/SEU_USERNAME/euajudo.git
cd euajudo
make setup
make seed
make dev
```

### Desenvolvimento Diário
```bash
# Verificar status
make status

# Ver logs
make logs

# Rodar testes
make test

# Formatar código antes de commit
make format
make lint
```

### Para Contribuir
```bash
# Criar branch
git checkout -b feature/minha-feature

# Desenvolver...
make dev  # para testar

# Testar e formatar
make test
make format
make lint

# Commit
git add .
git commit -m "feat: adiciona minha funcionalidade"

# Push e PR
git push origin feature/minha-feature
```

## 🔧 Troubleshooting

### Backend não inicia
```bash
# Verificar ambiente Python
cd backend
source venv/bin/activate
python --version

# Verificar dependências
pip list

# Verificar logs
tail -f backend.log
```

### Frontend não inicia
```bash
# Verificar Node.js
node --version
npm --version

# Verificar dependências
cd frontend
npm list

# Verificar logs
tail -f frontend.log
```

### Serviços não param com make kill
```bash
# Forçar parada
pkill -f uvicorn
pkill -f "npm run dev"

# Remover PIDs manualmente
rm backend.pid frontend.pid
```

### Erro de permissão
```bash
# Linux/macOS
chmod +x Makefile

# Se necessário
sudo chown $USER:$USER backend/frontend
```

## 🎨 Customização

### Mudar Portas
Edite as variáveis no topo do Makefile:
```makefile
BACKEND_PORT := 8000
FRONTEND_PORT := 3000
```

### Adicionar Novos Comandos
```makefile
meu-comando: ## Descrição do meu comando
	@echo "Fazendo algo..."
	# seus comandos aqui
```

## 📚 Referência Rápida

| Comando | Descrição |
|---------|-----------|
| `make help` | Lista todos os comandos |
| `make setup` | Configura ambiente |
| `make dev` | Inicia serviços em BG |
| `make kill` | Para todos os serviços |
| `make test` | Roda testes |
| `make logs` | Ver logs em tempo real |
| `make status` | Status dos serviços |

---

**💡 Dica**: Use `make help` para ver todos os comandos disponíveis a qualquer momento!
