#!/bin/bash

# Script para executar testes com coverage
# Usage: ./run_tests.sh [test_file]

set -e

echo "🧪 Executando testes do Dashboard Modular..."
echo ""

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências de teste se necessário
pip install -q pytest pytest-cov pytest-asyncio

# Limpar databases de teste antigos
rm -f test_*.db

# Se um arquivo específico foi passado, testar apenas ele
if [ -n "$1" ]; then
    echo "📝 Testando arquivo específico: $1"
    pytest "$1" -v --cov=app --cov-report=term-missing
else
    # Executar todos os testes de dashboard
    echo "📊 Executando testes de configuração..."
    pytest tests/test_dashboard_config.py -v
    
    echo ""
    echo "🔌 Executando testes de endpoints..."
    pytest tests/test_dashboard_endpoints.py -v
    
    echo ""
    echo "👨‍🍳 Executando testes Happy Path - Provider..."
    pytest tests/test_happy_path_provider.py -v
    
    echo ""
    echo "🏠 Executando testes Happy Path - Shelter..."
    pytest tests/test_happy_path_shelter.py -v
    
    echo ""
    echo "🤝 Executando testes Happy Path - Volunteer..."
    pytest tests/test_happy_path_volunteer.py -v
    
    echo ""
    echo "📈 Gerando relatório de coverage completo..."
    pytest tests/test_dashboard*.py tests/test_happy_path*.py \
        --cov=app.dashboard_config \
        --cov=app.routers.dashboard \
        --cov-report=term-missing \
        --cov-report=html:htmlcov \
        -v
fi

echo ""
echo "✅ Testes concluídos!"
echo "📊 Relatório HTML disponível em: htmlcov/index.html"

# Limpar databases de teste
rm -f test_*.db
