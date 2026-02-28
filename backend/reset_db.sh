#!/bin/bash
# Script para reset completo do banco de dados

echo "🗑️  Deletando banco de dados..."
rm -f jfood.db app/jfood.db

echo "🗄️  Recriando tabelas..."
python3 init_db.py

echo "🌱 Populando dados..."
python3 seed.py

echo ""
echo "✅ Banco de dados resetado com sucesso!"
echo ""
echo "🧪 Executar testes? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "🧪 Executando testes..."
    python3 test_all_flows.py
fi
