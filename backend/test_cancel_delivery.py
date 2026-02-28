#!/usr/bin/env python3
"""
Teste do cancelamento de entrega - verificando se a quantidade volta para o batch
Cenário: 
- Batch tem 20 marmitas
- Volunteer compromete 10 marmitas (batch fica com 10)
- Volunteer cancela (batch volta para 20)
"""

import requests
import json
from datetime import datetime

# Configuração
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}

def login(email, password="123"):
    """Fazer login e retornar token"""
    # OAuth2PasswordRequestForm espera form data, não JSON
    form_data = {
        "username": email,
        "password": password
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", 
                           data=form_data)  # data= para form data
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    else:
        print(f"❌ Erro no login {email}: {response.status_code} - {response.text}")
        return None

def get_batches(headers):
    """Obter batches disponíveis"""
    response = requests.get(f"{BASE_URL}/api/batches/", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Erro ao obter batches: {response.status_code}")
        return []

def create_delivery(batch_id, headers):
    """Criar uma entrega (compromisso)"""
    delivery_data = {
        "batch_id": batch_id,
        "location_id": 1,  # Abrigo Central criado no seed
        "quantity": 10
    }
    response = requests.post(f"{BASE_URL}/api/deliveries/", 
                           json=delivery_data,
                           headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Erro ao criar delivery: {response.status_code} - {response.text}")
        return None

def get_deliveries(headers):
    """Obter deliveries do usuário"""
    response = requests.get(f"{BASE_URL}/api/deliveries/", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Erro ao obter deliveries: {response.status_code}")
        return []

def cancel_delivery(delivery_id, headers):
    """Cancelar uma entrega"""
    response = requests.delete(f"{BASE_URL}/api/deliveries/{delivery_id}", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Erro ao cancelar delivery: {response.status_code} - {response.text}")
        return None

def main():
    print("🧪 Teste de Cancelamento de Entrega")
    print("=" * 50)
    
    # 1. Login como fornecedor para verificar batch
    print("\n1️⃣ Login como Fornecedor...")
    provider_headers = login("f1@j.com")
    if not provider_headers:
        return
    
    # 2. Obter batch inicial
    print("\n2️⃣ Verificando batch inicial...")
    batches = get_batches(provider_headers)
    if not batches:
        print("❌ Nenhum batch encontrado")
        return
    
    batch = batches[0]  # Pegar primeiro batch
    if batch['product_type'] != 'meal':
        # Tentar encontrar um batch de marmitas
        meal_batch = next((b for b in batches if b['product_type'] == 'meal'), None)
        if meal_batch:
            batch = meal_batch
            print(f"📦 Usando batch de marmitas #{batch['id']}: {batch['quantity_available']}/{batch['quantity']} {batch['product_type']}")
        else:
            print(f"❌ Nenhum batch de marmitas encontrado, usando: {batch['product_type']}")
    else:
        print(f"📦 Batch #{batch['id']}: {batch['quantity_available']}/{batch['quantity']} {batch['product_type']}")
    
    initial_quantity = batch['quantity_available']
    print(f"✅ Quantidade inicial: {initial_quantity}")
    
    # 3. Login como voluntário
    print("\n3️⃣ Login como Voluntário...")
    volunteer_headers = login("v1@j.com")
    if not volunteer_headers:
        return
    
    # 4. Criar entrega (comprometer 10 marmitas)
    print("\n4️⃣ Criando entrega (comprometendo 10 marmitas)...")
    delivery = create_delivery(batch['id'], volunteer_headers)
    if not delivery:
        return
    
    print(f"🚚 Delivery #{delivery['id']} criado: {delivery['quantity']} {delivery['product_type']}")
    
    # 5. Verificar quantidade após compromisso
    print("\n5️⃣ Verificando quantidade após compromisso...")
    batches_after = get_batches(provider_headers)
    batch_after = next((b for b in batches_after if b['id'] == batch['id']), None)
    
    if batch_after:
        print(f"📦 Batch após compromisso: {batch_after['quantity_available']}/{batch_after['quantity']}")
        expected_after_commit = initial_quantity - delivery['quantity']
        if batch_after['quantity_available'] == expected_after_commit:
            print(f"✅ Quantidade correta: {batch_after['quantity_available']} (esperado: {expected_after_commit})")
        else:
            print(f"❌ Quantidade incorreta: {batch_after['quantity_available']} (esperado: {expected_after_commit})")
    else:
        print("❌ Batch não encontrado após compromisso")
        return
    
    # 6. Cancelar entrega
    print("\n6️⃣ Cancelando entrega...")
    cancel_result = cancel_delivery(delivery['id'], volunteer_headers)
    if not cancel_result:
        return
    
    print(f"🗑️ Cancelamento: {cancel_result['message']}")
    print(f"📈 Quantidade retornada: {cancel_result['quantity_returned']}")
    
    # 7. Verificar quantidade após cancelamento
    print("\n7️⃣ Verificando quantidade após cancelamento...")
    batches_final = get_batches(provider_headers)
    batch_final = next((b for b in batches_final if b['id'] == batch['id']), None)
    
    if batch_final:
        print(f"📦 Batch final: {batch_final['quantity_available']}/{batch_final['quantity']}")
        if batch_final['quantity_available'] == initial_quantity:
            print(f"✅ SUCESSO! Quantidade restaurada: {batch_final['quantity_available']} (original: {initial_quantity})")
        else:
            print(f"❌ FALHA! Quantidade não restaurada: {batch_final['quantity_available']} (original: {initial_quantity})")
    else:
        print("❌ Batch não encontrado após cancelamento")
    
    print("\n" + "=" * 50)
    print("🎯 Teste concluído!")

if __name__ == "__main__":
    main()
