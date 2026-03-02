#!/usr/bin/env python3
"""
Teste para verificar se frontend está carregando requests corretamente
"""

import requests as http_requests
import json

API_URL = "http://localhost:8000"

def main():
    print("🔍 TESTANDO CARREGAMENTO DE REQUESTS NO FRONTEND")
    print("=" * 60)
    
    # 1. Login como abrigo
    print("\n🔑 1. LOGIN COMO ABRIGO:")
    login_response = http_requests.post(f"{API_URL}/api/auth/login", data={
        'username': 'abrigo.centro@vouajudar.org',
        'password': 'centro123'
    })
    
    if login_response.status_code == 200:
        token = login_response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        user = login_response.json()
        print(f"   ✅ Login OK - User ID: {user['id']}")
        print(f"   📧 Email: {user['email']}")
        print(f"   🏢 Roles: {user['roles']}")
    else:
        print(f"   ❌ Login falhou: {login_response.text}")
        return
    
    # 2. Testar endpoint de requests (com autenticação)
    print("\n📋 2. ENDPOINT /api/inventory/requests (COM AUTENTICAÇÃO):")
    requests_response = http_requests.get(f"{API_URL}/api/inventory/requests", headers=headers)
    
    if requests_response.status_code == 200:
        requests_data = requests_response.json()
        print(f"   ✅ Status: {requests_response.status_code}")
        print(f"   📊 Total requests: {len(requests_data)}")
        
        for req in requests_data:
            print(f"   📋 Request {req['id']}:")
            print(f"      Shelter: {req['shelter_id']}")
            print(f"      Status: {req['status']}")
            print(f"      Categoria: {req['category_id']}")
            print(f"      Quantidade: {req['quantity_requested']}")
            
            # Verificar se é do usuário logado
            if req['shelter_id'] == user['id']:
                print(f"      ✅ É do usuário logado!")
            else:
                print(f"      ⚠️ Não é do usuário logado")
                
    else:
        print(f"   ❌ Erro: {requests_response.status_code}")
        print(f"   📝 Response: {requests_response.text}")
    
    # 3. Testar endpoint sem autenticação (como o frontend estava fazendo)
    print("\n📋 3. ENDPOINT /api/inventory/requests (SEM AUTENTICAÇÃO):")
    requests_response_no_auth = http_requests.get(f"{API_URL}/api/inventory/requests")
    
    if requests_response_no_auth.status_code == 200:
        print(f"   ✅ Status: {requests_response_no_auth.status_code}")
        print("   🚨 ATENÇÃO: Endpoint está público!")
    else:
        print(f"   ❌ Erro esperado: {requests_response_no_auth.status_code}")
        print("   ✅ Isso é correto - endpoint requer autenticação")
    
    # 4. Testar endpoint de locations (para mapa)
    print("\n📍 4. ENDPOINT /api/locations/ (PARA MAPA):")
    locations_response = http_requests.get(f"{API_URL}/api/locations/")
    
    if locations_response.status_code == 200:
        locations_data = locations_response.json()
        print(f"   ✅ Status: {locations_response.status_code}")
        print(f"   📍 Total locations: {len(locations_data)}")
        
        for loc in locations_data:
            print(f"   📍 Location {loc['id']}:")
            print(f"      User: {loc['user_id']}")
            print(f"      Nome: {loc['name']}")
            print(f"      Coords: ({loc['latitude']}, {loc['longitude']})")
            
            # Verificar se é do usuário logado
            if loc['user_id'] == user['id']:
                print(f"      ✅ É do usuário logado!")
                
    else:
        print(f"   ❌ Erro: {locations_response.status_code}")
        print(f"   📝 Response: {locations_response.text}")
    
    # 5. Simular o que o frontend faz
    print("\n🎭 5. SIMULAÇÃO DO FRONTEND:")
    print("   a) Carregar locations (público)")
    locations_resp = http_requests.get(f"{API_URL}/api/locations/")
    
    print("   b) Carregar requests (com autenticação)")
    requests_resp = http_requests.get(f"{API_URL}/api/inventory/requests", headers=headers)
    
    if locations_resp.status_code == 200 and requests_resp.status_code == 200:
        locations = locations_resp.json()
        requests = requests_resp.json()
        
        print(f"   📊 Dados carregados: {len(locations)} locations, {len(requests)} requests")
        
        # Verificar se há requests ativos para as locations
        active_statuses = ['pending', 'partial', 'active']
        active_requests = [req for req in requests if req['status'] in active_statuses]
        
        print(f"   🎯 Requests ativos: {len(active_requests)}")
        
        for req in active_requests:
            matching_location = next((loc for loc in locations if loc['user_id'] == req['shelter_id']), None)
            if matching_location:
                print(f"      ✅ Request {req['id']} → Location {matching_location['name']}")
                print(f"         📍 Deveria aparecer em ({matching_location['latitude']}, {matching_location['longitude']})")
                print(f"         🔴 Status: {req['status']} (ícone vermelho)")
            else:
                print(f"      ❌ Request {req['id']} → Sem location")
        
        if not active_requests:
            print("   ❌ Nenhum request ativo encontrado - por isso ícone fica verde")
        else:
            print("   ✅ Requests ativos encontrados - deveriam aparecer como vermelho")
    
    # 6. Diagnóstico final
    print("\n🎯 DIAGNÓSTICO FINAL:")
    print("   Se os dados acima estiverem OK:")
    print("   ✅ Banco: Tem request ativo")
    print("   ✅ API: Endpoints funcionando")
    print("   ❌ Frontend: Provavelmente não está carregando requests corretamente")
    print("   🔍 Verificar MapView.jsx - seção de carregamento de shelter requests")

if __name__ == "__main__":
    main()
