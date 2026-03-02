#!/bin/bash

# Script de migrações do banco de dados
# Uso: ./migrate.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para mostrar ajuda
show_help() {
    echo -e "${BLUE}=== Sistema de Migrações do Banco de Dados ===${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  current     - Mostra a migração atual"
    echo "  upgrade     - Aplica todas as migrações pendentes"
    echo "  downgrade   - Reverte a última migração"
    echo "  history     - Mostra histórico de migrações"
    echo "  revision    - Cria nova migração (requer mensagem)"
    echo "  reset       - Reseta banco completamente (PERIGO!)"
    echo ""
    echo "Exemplos:"
    echo "  $0 current"
    echo "  $0 upgrade"
    echo "  $0 revision -m \"add_new_feature\""
    echo "  $0 reset"
    echo ""
}

# Verificar se estamos no diretório correto
if [ ! -f "alembic.ini" ]; then
    echo -e "${RED}Erro: Execute este script do diretório backend/${NC}"
    exit 1
fi

# Ativar ambiente virtual
if [ -d "venv" ]; then
    source venv/bin/activate
    echo -e "${GREEN}✅ Ambiente virtual ativado${NC}"
else
    echo -e "${YELLOW}⚠️  Ambiente virtual não encontrado${NC}"
fi

# Executar comando baseado no argumento
case "$1" in
    "current")
        echo -e "${BLUE}📍 Migração atual:${NC}"
        python -m alembic -c alembic.ini current
        ;;
    "upgrade")
        echo -e "${BLUE}⬆️  Aplicando migrações...${NC}"
        python -m alembic -c alembic.ini upgrade head
        echo -e "${GREEN}✅ Migrações aplicadas com sucesso!${NC}"
        ;;
    "downgrade")
        echo -e "${BLUE}⬇️  Revertendo última migração...${NC}"
        python -m alembic -c alembic.ini downgrade -1
        echo -e "${GREEN}✅ Migração revertida com sucesso!${NC}"
        ;;
    "history")
        echo -e "${BLUE}📜 Histórico de migrações:${NC}"
        python -m alembic -c alembic.ini history
        ;;
    "revision")
        shift
        echo -e "${BLUE}📝 Criando nova migração...${NC}"
        python -m alembic -c alembic.ini revision "$@"
        echo -e "${GREEN}✅ Nova migração criada!${NC}"
        ;;
    "reset")
        echo -e "${RED}⚠️  ATENÇÃO: Isso vai resetar completamente o banco!${NC}"
        read -p "Tem certeza? (s/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            echo -e "${BLUE}🗑️  Resetando banco...${NC}"
            rm -f euajudo.db
            python -m alembic -c alembic.ini upgrade head
            echo -e "${GREEN}✅ Banco resetado com sucesso!${NC}"
            echo -e "${YELLOW}💡 Execute 'python seed_small.py' para popular dados iniciais${NC}"
        else
            echo -e "${GREEN}✅ Operação cancelada${NC}"
        fi
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando desconhecido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
