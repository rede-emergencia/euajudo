#!/bin/bash

# Script de setup para testes E2E
# Execute este script antes de rodar os testes pela primeira vez

set -e

echo "🚀 Setup do Framework de Testes E2E - VouAjudar"
echo "=============================================="
echo ""

# 1. Verificar Node.js instalado
echo "1️⃣ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 16+ primeiro."
    exit 1
fi
echo "✅ Node.js $(node --version) encontrado"
echo ""

# 2. Instalar dependências npm
echo "2️⃣ Instalando dependências npm..."
npm install
echo "✅ Dependências instaladas"
echo ""

# 3. Instalar browsers do Playwright
echo "3️⃣ Instalando browsers do Playwright..."
npx playwright install chromium
echo "✅ Browsers instalados"
echo ""

# 4. Verificar backend
echo "4️⃣ Verificando backend..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend rodando em http://localhost:8000"
else
    echo "⚠️  Backend não está rodando"
    echo "   Execute em outro terminal: cd ../backend && uvicorn app.main:app --reload"
fi
echo ""

# 5. Verificar frontend
echo "5️⃣ Verificando frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend rodando em http://localhost:3000"
else
    echo "⚠️  Frontend não está rodando"
    echo "   Execute em outro terminal: cd ../frontend && npm run dev"
fi
echo ""

# 6. Criar diretório de resultados
echo "6️⃣ Criando diretório de resultados..."
mkdir -p test-results
echo "✅ Diretório criado"
echo ""

echo "🎉 Setup completo!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Certifique-se que backend está rodando (http://localhost:8000)"
echo "   2. Certifique-se que frontend está rodando (http://localhost:3000)"
echo "   3. Execute: npm test"
echo ""
echo "💡 Dicas:"
echo "   - npm run test:ui    → Interface visual (recomendado)"
echo "   - npm run test:auth  → Apenas testes de autenticação"
echo "   - npm run test:debug → Debug mode"
echo ""
