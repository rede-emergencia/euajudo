# EuAjudo Makefile
# Facilita setup, desenvolvimento e deploy do projeto

.PHONY: help setup seed backend frontend dev kill clean test lint format

# Cores para output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
NC := \033[0m # No Color

# Variáveis
BACKEND_DIR := backend
FRONTEND_DIR := frontend
PYTHON := python3
PIP := pip3
NODE := node
NPM := npm

# Portas
BACKEND_PORT := 8000
FRONTEND_PORT := 3000

help: ## Exibe ajuda com todos os comandos disponíveis
	@echo "$(CYAN)EuAjudo - Plataforma de Conexão Social$(NC)"
	@echo ""
	@echo "$(YELLOW)Comandos disponíveis:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BLUE)Exemplos de uso:$(NC)"
	@echo "  make setup          # Configura ambiente completo"
	@echo "  make dev            # Inicia frontend e backend em background"
	@echo "  make kill           # Para todos os serviços"
	@echo "  make seed           # Popula banco de dados"

setup: ## Configura ambiente completo (Python + Node + dependências)
	@echo "$(YELLOW)🔧 Configurando ambiente EuAjudo...$(NC)"
	
	# Verificar Python
	@if ! command -v $(PYTHON) >/dev/null 2>&1; then \
		echo "$(RED)❌ Python 3 não encontrado. Instale Python 3.8+$(NC)"; \
		exit 1; \
	fi
	
	# Verificar Node
	@if ! command -v $(NODE) >/dev/null 2>&1; then \
		echo "$(RED)❌ Node.js não encontrado. Instale Node.js 16+$(NC)"; \
		exit 1; \
	fi
	
	@echo "$(GREEN)✅ Python e Node.js encontrados$(NC)"
	
	# Setup Backend
	@echo "$(YELLOW)📦 Configurando backend...$(NC)"
	cd $(BACKEND_DIR) && \
	if [ ! -d "venv" ]; then \
		$(PYTHON) -m venv venv && \
		echo "$(GREEN)✅ Ambiente virtual criado$(NC)"; \
	fi && \
	source venv/bin/activate && \
	pip install --upgrade pip && \
	pip install -r requirements.txt && \
	echo "$(GREEN)✅ Dependências Python instaladas$(NC)"
	
	# Setup Frontend  
	@echo "$(YELLOW)📦 Configurando frontend...$(NC)"
	cd $(FRONTEND_DIR) && \
	npm install && \
	echo "$(GREEN)✅ Dependências Node instaladas$(NC)"
	
	# Configurar arquivos .env se não existirem
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env && \
		echo "$(YELLOW)⚠️  Edite $(BACKEND_DIR)/.env com suas configurações$(NC)"; \
	fi
	
	@if [ ! -f $(FRONTEND_DIR)/.env ]; then \
		cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env && \
		echo "$(YELLOW)⚠️  Edite $(FRONTEND_DIR)/.env com suas configurações$(NC)"; \
	fi
	
	@echo "$(GREEN)🎉 Ambiente configurado com sucesso!$(NC)"
	@echo "$(CYAN)Próximos passos:$(NC)"
	@echo "  make seed    # Para popular banco de dados"
	@echo "  make dev     # Para iniciar desenvolvimento"

seed: ## Popula banco de dados com dados de teste
	@echo "$(YELLOW)🌱 Populando banco de dados...$(NC)"
	cd $(BACKEND_DIR) && \
	source venv/bin/activate && \
	$(PYTHON) init_db.py && \
	echo "$(GREEN)✅ Banco de dados inicializado$(NC)" && \
	$(PYTHON) seed.py && \
	echo "$(GREEN)✅ Dados de teste inseridos$(NC)"
	@echo ""
	@echo "$(CYAN)Credenciais de teste:$(NC)"
	@echo "  Fornecedor: p1@j.com / 123"
	@echo "  Voluntário: v1@j.com / 123"  
	@echo "  Admin: adm@j.com / 123"

backend: ## Inicia apenas o backend FastAPI
	@echo "$(YELLOW)🚀 Iniciando backend FastAPI...$(NC)"
	cd $(BACKEND_DIR) && \
	source venv/bin/activate && \
	uvicorn app.main:app --reload --host 0.0.0.0 --port $(BACKEND_PORT)

frontend: ## Inicia apenas o frontend React
	@echo "$(YELLOW)🎨 Iniciando frontend React...$(NC)"
	cd $(FRONTEND_DIR) && \
	npm run dev

dev: ## Inicia backend e frontend em background (modo desenvolvimento)
	@echo "$(YELLOW)🚀 Iniciando ambiente de desenvolvimento...$(NC)"
	
	# Verificar se ambiente está configurado
	@if [ ! -d $(BACKEND_DIR)/venv ]; then \
		echo "$(RED)❌ Ambiente não configurado. Execute 'make setup' primeiro$(NC)"; \
		exit 1; \
	fi
	
	# Iniciar backend em background
	@echo "$(BLUE)📡 Iniciando backend em background (porta $(BACKEND_PORT))...$(NC)"
	cd $(BACKEND_DIR) && \
	source venv/bin/activate && \
	nohup uvicorn app.main:app --reload --host 0.0.0.0 --port $(BACKEND_PORT) > ../backend.log 2>&1 & \
	echo $$! > ../backend.pid
	
	# Iniciar frontend em background  
	@echo "$(BLUE)🎨 Iniciando frontend em background (porta $(FRONTEND_PORT))...$(NC)"
	cd $(FRONTEND_DIR) && \
	nohup npm run dev > ../frontend.log 2>&1 & \
	echo $$! > ../frontend.pid
	
	# Aguardar serviços iniciarem
	@sleep 3
	
	# Verificar se serviços estão rodando
	@if pgrep -f "uvicorn app.main:app" > /dev/null; then \
		echo "$(GREEN)✅ Backend rodando em http://localhost:$(BACKEND_PORT)$(NC)"; \
	else \
		echo "$(RED)❌ Backend não iniciou. Verifique backend.log$(NC)"; \
	fi
	
	@if pgrep -f "npm run dev" > /dev/null; then \
		echo "$(GREEN)✅ Frontend rodando em http://localhost:$(FRONTEND_PORT)$(NC)"; \
	else \
		echo "$(RED)❌ Frontend não iniciou. Verifique frontend.log$(NC)"; \
	fi
	
	@echo ""
	@echo "$(CYAN)Serviços iniciados!$(NC)"
	@echo "  Backend: http://localhost:$(BACKEND_PORT)/docs"
	@echo "  Frontend: http://localhost:$(FRONTEND_PORT)"
	@echo "  Logs: tail -f backend.log frontend.log"
	@echo "  Parar: make kill"

kill: ## Para todos os serviços (backend e frontend)
	@echo "$(YELLOW)🛑 Parando serviços...$(NC)"
	
	# Matar backend
	@if [ -f backend.pid ]; then \
		kill `cat backend.pid` 2>/dev/null || true; \
		rm backend.pid; \
		echo "$(GREEN)✅ Backend parado$(NC)"; \
	else \
		pkill -f "uvicorn app.main:app" 2>/dev/null || true; \
		echo "$(GREEN)✅ Backend parado$(NC)"; \
	fi
	
	# Matar frontend
	@if [ -f frontend.pid ]; then \
		kill `cat frontend.pid` 2>/dev/null || true; \
		rm frontend.pid; \
		echo "$(GREEN)✅ Frontend parado$(NC)"; \
	else \
		pkill -f "npm run dev" 2>/dev/null || true; \
		echo "$(GREEN)✅ Frontend parado$(NC)"; \
	fi
	
	@echo "$(GREEN)🎉 Todos os serviços parados!$(NC)"

clean: ## Limpa arquivos temporários e logs
	@echo "$(YELLOW)🧹 Limpando arquivos temporários...$(NC)"
	
	# Remover logs
	@rm -f backend.log frontend.log
	
	# Remover PID files
	@rm -f backend.pid frontend.pid
	
	# Limpar frontend
	cd $(FRONTEND_DIR) && \
	rm -rf node_modules/.cache dist build
	
	# Limpar Python cache
	cd $(BACKEND_DIR) && \
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	
	@echo "$(GREEN)✅ Limpeza concluída$(NC)"

test: ## Roda testes do backend e frontend
	@echo "$(YELLOW)🧪 Rodando testes...$(NC)"
	
	# Testes backend
	@echo "$(BLUE)📡 Testando backend...$(NC)"
	cd $(BACKEND_DIR) && \
	source venv/bin/activate && \
	python -m pytest tests/ -v --cov=app --cov-report=term-missing || \
	echo "$(YELLOW)⚠️  Alguns testes do backend falharam$(NC)"
	
	# Testes frontend
	@echo "$(BLUE)🎨 Testando frontend...$(NC)"
	cd $(FRONTEND_DIR) && \
	npm test -- --coverage --watchAll=false || \
	echo "$(YELLOW)⚠️  Alguns testes do frontend falharam$(NC)"
	
	@echo "$(GREEN)✅ Testes concluídos$(NC)"

lint: ## Verifica código com linters
	@echo "$(YELLOW)🔍 Verificando código com linters...$(NC)"
	
	# Lint backend
	@echo "$(BLUE)📡 Linting backend...$(NC)"
	cd $(BACKEND_DIR) && \
	source venv/bin/activate && \
	flake8 app/ --max-line-length=100 --ignore=E203,W503 || \
	echo "$(YELLOW)⚠️  Issues de linting no backend$(NC)"
	
	# Lint frontend
	@echo "$(BLUE)🎨 Linting frontend...$(NC)"
	cd $(FRONTEND_DIR) && \
	npm run lint || \
	echo "$(YELLOW)⚠️  Issues de linting no frontend$(NC)"
	
	@echo "$(GREEN)✅ Linting concluído$(NC)"

format: ## Formata código automaticamente
	@echo "$(YELLOW)✨ Formatando código...$(NC)"
	
	# Format backend
	@echo "$(BLUE)📡 Formatando backend...$(NC)"
	cd $(BACKEND_DIR) && \
	source venv/bin/activate && \
	black app/ --line-length=100 && \
	echo "$(GREEN)✅ Backend formatado$(NC)"
	
	# Format frontend
	@echo "$(BLUE)🎨 Formatando frontend...$(NC)"
	cd $(FRONTEND_DIR) && \
	npm run format && \
	echo "$(GREEN)✅ Frontend formatado$(NC)"
	
	@echo "$(GREEN)✅ Código formatado$(NC)"

logs: ## Exibe logs dos serviços em tempo real
	@echo "$(YELLOW)📋 Exibindo logs...$(NC)"
	@if [ -f backend.log ] || [ -f frontend.log ]; then \
		tail -f backend.log frontend.log; \
	else \
		echo "$(RED)❌ Nenhum arquivo de log encontrado$(NC)"; \
	fi

status: ## Verifica status dos serviços
	@echo "$(CYAN)📊 Status dos Serviços EuAjudo$(NC)"
	@echo ""
	
	# Verificar backend
	@if pgrep -f "uvicorn app.main:app" > /dev/null; then \
		echo "$(GREEN)✅ Backend: Rodando$(NC)"; \
		echo "   URL: http://localhost:$(BACKEND_PORT)"; \
		echo "   Docs: http://localhost:$(BACKEND_PORT)/docs"; \
	else \
		echo "$(RED)❌ Backend: Parado$(NC)"; \
	fi
	
	@echo ""
	
	# Verificar frontend
	@if pgrep -f "npm run dev" > /dev/null; then \
		echo "$(GREEN)✅ Frontend: Rodando$(NC)"; \
		echo "   URL: http://localhost:$(FRONTEND_PORT)"; \
	else \
		echo "$(RED)❌ Frontend: Parado$(NC)"; \
	fi
	
	@echo ""
	
	# Verificar ambiente
	@if [ -d $(BACKEND_DIR)/venv ]; then \
		echo "$(GREEN)✅ Ambiente Python: Configurado$(NC)"; \
	else \
		echo "$(RED)❌ Ambiente Python: Não configurado$(NC)"; \
	fi
	
	@if [ -d $(FRONTEND_DIR)/node_modules ]; then \
		echo "$(GREEN)✅ Ambiente Node: Configurado$(NC)"; \
	else \
		echo "$(RED)❌ Ambiente Node: Não configurado$(NC)"; \
	fi

install: ## Instala dependências globais
	@echo "$(YELLOW)📦 Instalando dependências globais...$(NC)"
	@echo "$(BLUE)Python packages:$(NC)"
	pip install --upgrade pip black flake8 pytest pytest-cov
	@echo "$(BLUE)Node packages:$(NC)"
	npm install -g eslint prettier
	@echo "$(GREEN)✅ Dependências globais instaladas$(NC)"

# Comandos de deploy
deploy-build: ## Build para produção
	@echo "$(YELLOW)🏗️ Build para produção...$(NC)"
	
	# Build frontend
	cd $(FRONTEND_DIR) && \
	npm run build && \
	echo "$(GREEN)✅ Frontend build concluído$(NC)"

# Comandos de banco de dados
db-reset: ## Reset completo do banco de dados
	@echo "$(YELLOW)🗑️ Resetando banco de dados...$(NC)"
	cd $(BACKEND_DIR) && \
	source venv/bin/activate && \
	$(PYTHON) init_db.py && \
	echo "$(GREEN)✅ Banco resetado$(NC)"

db-backup: ## Backup do banco de dados SQLite
	@echo "$(YELLOW)💾 Fazendo backup do banco...$(NC)"
	cd $(BACKEND_DIR) && \
	if [ -f "euajudo.db" ]; then \
		cp euajudo.db euajudo_backup_$$(date +%Y%m%d_%H%M%S).db && \
		echo "$(GREEN)✅ Backup criado$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  Nenhum banco de dados encontrado$(NC)"; \
	fi
