#!/usr/bin/env python3
"""
Teste real de cancelamento - usando dados existentes
"""

import requests
import json

# Configuração
BASE_URL = "http://localhost:8000"

def login(email, password="123"):
    """Fazer login e retornar token"""
    form_data = {
        "username": email,
        "password": password
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", data=form_data)
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
    print("🧪 Teste Real de Cancelamento")
    print("=" * 40)
    
    # 1. Login como provider para ver batches
    print("\n1️⃣ Login como Provider...")
    provider_headers = login("restaurante.bom.sabor@euajudo.com")
    if not provider_headers:
        print("❌ Não foi possível fazer login como provider")
        return
    
    # 2. Verificar batches disponíveis
    print("\n2️⃣ Verificando batches...")
    batches = get_batches(provider_headers)
    if batches:
        print(f"📦 Encontrados {len(batches)} batches:")
        for batch in batches:
            print(f"   Batch #{batch['id']}: {batch['quantity_available']}/{batch['quantity']} {batch['product_type']}")
    else:
        print("❌ Nenhum batch encontrado")
        return
    
    # 3. Login como voluntário para ver deliveries
    print("\n3️⃣ Login como Voluntário...")
    volunteer_headers = login("joao.voluntario@euajudo.com")
    if not volunteer_headers:
        print("❌ Não foi possível fazer login como voluntário")
        return
    
    # 4. Verificar deliveries existentes
    print("\n4️⃣ Verificando deliveries existentes...")
    deliveries = get_deliveries(volunteer_headers)
    if deliveries:
        print(f"🚚 Encontrados {len(deliveries)} deliveries:")
        for delivery in deliveries:
            print(f"   Delivery #{delivery['id']}: {delivery['quantity']} {delivery['product_type']} - Status: {delivery['status']}")
        
        # Filtrar apenas deliveries que podem ser cancelados (status 'reserved' ou 'pending_confirmation')
        cancelable_deliveries = [d for d in deliveries if d['status'] in ['reserved', 'pending_confirmation']]
        if cancelable_deliveries:
            print(f"✅ Encontrados {len(cancelable_deliveries)} deliveries canceláveis")
        else:
            print("❌ Nenhum delivery cancelável encontrado (todos já estão em trânsito)")
            deliveries = []  # Limpar para criar um novo
    else:
        print("❌ Nenhum delivery encontrado")
    
    # Se não há deliveries canceláveis, criar um novo
    if not deliveries or not any(d['status'] in ['reserved', 'pending_confirmation'] for d in deliveries):
        print("💡 Criando um delivery de teste...")
        if batches:
            batch = batches[0]
            delivery_data = {
                "batch_id": batch['id'],
                "quantity": 5
            }
            response = requests.post(f"{BASE_URL}/api/deliveries/", 
                                   json=delivery_data,
                                   headers=volunteer_headers)
            if response.status_code == 200:
                delivery = response.json()
                print(f"✅ Delivery criado: #{delivery['id']} - Status: {delivery['status']}")
                deliveries = [delivery]
            else:
                print(f"❌ Erro ao criar delivery: {response.status_code} - {response.text}")
                return
    
    # 5. Escolher um delivery para cancelar (se houver)
    if deliveries:
        # Encontrar um delivery cancelável
        cancelable_delivery = next((d for d in deliveries if d['status'] in ['reserved', 'pending_confirmation']), None)
        
        if not cancelable_delivery:
            print("❌ Nenhum delivery cancelável disponível")
            return
            
        delivery_to_cancel = cancelable_delivery
        print(f"\n5️⃣ Testando cancelamento do Delivery #{delivery_to_cancel['id']} (Status: {delivery_to_cancel['status']})...")
        
        # Verificar quantidade do batch antes
        if delivery_to_cancel.get('batch_id'):
            batch_before = next((b for b in batches if b['id'] == delivery_to_cancel['batch_id']), None)
            if batch_before:
                print(f"📊 Batch #{batch_before['id']} antes: {batch_before['quantity_available']}/{batch_before['quantity']}")
        
        # Cancelar delivery
        cancel_result = cancel_delivery(delivery_to_cancel['id'], volunteer_headers)
        if cancel_result:
            print(f"✅ Cancelamento bem-sucedido: {cancel_result['message']}")
            print(f"📈 Quantidade retornada: {cancel_result['quantity_returned']}")
            
            # Verificar quantidade do batch depois
            if delivery_to_cancel.get('batch_id'):
                batches_after = get_batches(provider_headers)
                batch_after = next((b for b in batches_after if b['id'] == delivery_to_cancel['batch_id']), None)
                if batch_after and batch_before:
                    expected_quantity = batch_before['quantity_available'] + cancel_result['quantity_returned']
                    if batch_after['quantity_available'] == expected_quantity:
                        print(f"✅ SUCESSO! Batch atualizado: {batch_after['quantity_available']}/{batch_after['quantity']}")
                        print(f"   (Esperado: {expected_quantity})")
                    else:
                        print(f"❌ FALHA! Batch não atualizado corretamente:")
                        print(f"   Atual: {batch_after['quantity_available']}")
                        print(f"   Esperado: {expected_quantity}")
        else:
            print("❌ Falha ao cancelar delivery")
    else:
        print("❌ Nenhum delivery disponível para testar")
    
    print("\n" + "=" * 40)
    print("🎯 Teste concluído!")

if __name__ == "__main__":
    main()
