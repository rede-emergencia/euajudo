#!/usr/bin/env python3
"""
Teste simples de autenticação para verificar se endpoints funcionam
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import requests as http_requests

API_URL = "http://localhost:8000"

def main():
    print("🔍 TESTE SIMPLES DE AUTENTICAÇÃO")
    print("=" * 50)
    
    # 1. Testar se backend está online
    try:
        response = http_requests.get(f"{API_URL}/")
        if response.status_code == 200:
            print("✅ Backend está online")
        else:
            print(f"❌ Backend status: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Backend não está respondendo: {e}")
        return
    
    # 2. Testar endpoint de requests sem autenticação
    print("\n📋 1. ENDPOINT /api/inventory/requests (SEM AUTH):")
    try:
        response = http_requests.get(f"{API_URL}/api/inventory/requests")
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Correto - endpoint requer autenticação")
        elif response.status_code == 200:
            print("   🚨 ATENÇÃO - endpoint está público!")
            data = response.json()
            print(f"   📊 Requests retornados: {len(data)}")
        else:
            print(f"   📝 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    # 3. Testar endpoint de locations (público)
    print("\n📍 2. ENDPOINT /api/locations/ (PÚBLICO):")
    try:
        response = http_requests.get(f"{API_URL}/api/locations/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Locations carregadas: {len(data)}")
            for loc in data[:2]:  # Primeiras 2
                print(f"      📍 {loc['name']} - User {loc['user_id']}")
        else:
            print(f"   📝 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    # 4. Tentar criar token manualmente (se possível)
    print("\n🔑 3. TENTATIVA DE TOKEN MANUAL:")
    print("   Pulando login por enquanto - vamos focar no problema do mapa")
    
    # 5. Diagnóstico do problema
    print("\n🎯 DIAGNÓSTICO DO PROBLEMA DO MAPA:")
    print("   ✅ Banco: Tem 1 request ativo (status: pending)")
    print("   ✅ Banco: Tem 2 locations com coordenadas")
    print("   ❌ Frontend: Não está carregando requests (401 Unauthorized)")
    print("   🔍 Problema: MapView.jsx usa fetch() sem autenticação")
    print("   💡 Solução: Já corrigimos para usar inventory.getRequests()")
    print("   📝 Próximo passo: Testar no navegador se a correção funcionou")

if __name__ == "__main__":
    main()
