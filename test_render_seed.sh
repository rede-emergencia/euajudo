#!/bin/bash

# Script para testar e popular o banco no Render
# Execute este script após o deploy estar completo

API_URL="https://euajudo-api.onrender.com"

echo "🔧 EUAJUDO - Script de Teste e Seed do Banco"
echo "=========================================="
echo ""

# 1. Verificar se API está online
echo "1️⃣ Verificando se API está online..."
response=$(curl -s -w "%{http_code}" "$API_URL/health")
http_code="${response: -3}"
body="${response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ API está online: $body"
else
    echo "❌ API não está respondendo (HTTP $http_code)"
    exit 1
fi

echo ""

# 2. Verificar status do banco
echo "2️⃣ Verificando status do banco..."
db_status=$(curl -s "$API_URL/api/db/status")
echo "📊 Status do banco:"
echo "$db_status" | jq '.'

# Extrair contagens
users=$(echo "$db_status" | jq -r '.counts.users // 0')
locations=$(echo "$db_status" | jq -r '.counts.locations // 0')
batches=$(echo "$db_status" | jq -r '.counts.batches // 0')
is_empty=$(echo "$db_status" | jq -r '.is_empty // true')

echo ""
echo "📈 Resumo:"
echo "   • Usuários: $users"
echo "   • Locais: $locations" 
echo "   • Batches: $batches"
echo "   • Banco vazio: $is_empty"

echo ""

# 3. Rodar seed se banco estiver vazio
if [ "$is_empty" = "true" ]; then
    echo "3️⃣ Banco está vazio. Rodando seed manualmente..."
    
    seed_response=$(curl -s -X POST "$API_URL/api/admin/seed")
    echo "🌱 Resposta do seed:"
    echo "$seed_response" | jq '.'
    
    seed_status=$(echo "$seed_response" | jq -r '.status // error')
    
    if [ "$seed_status" = "success" ]; then
        echo "✅ Seed executado com sucesso!"
        
        # Verificar novamente o status
        echo ""
        echo "4️⃣ Verificando status após seed..."
        new_status=$(curl -s "$API_URL/api/db/status")
        echo "📊 Novo status:"
        echo "$new_status" | jq '.counts'
        
        new_users=$(echo "$new_status" | jq -r '.counts.users // 0')
        new_locations=$(echo "$new_status" | jq -r '.counts.locations // 0')
        new_batches=$(echo "$new_status" | jq -r '.counts.batches // 0')
        
        echo ""
        echo "🎉 Resultado final:"
        echo "   • Usuários: $new_users"
        echo "   • Locais: $new_locations"
        echo "   • Batches: $new_batches"
        
        if [ "$new_users" -gt 0 ] && [ "$new_locations" -gt 0 ]; then
            echo "✅ Banco populado com sucesso! Acesse:"
            echo "   🌐 Frontend: https://euajudo-frontend.onrender.com"
            echo "   🔑 Login: joao.voluntario@euajudo.com (senha: 123)"
        else
            echo "❌ Seed não populou dados corretamente"
        fi
    else
        echo "❌ Erro ao executar seed"
        echo "$seed_response"
    fi
else
    echo "3️⃣ Banco já contém dados. Pulando seed."
    echo "✅ Acesse o frontend:"
    echo "   🌐 Frontend: https://euajudo-frontend.onrender.com"
fi

echo ""
echo "=========================================="
echo "🏁 Script concluído!"
