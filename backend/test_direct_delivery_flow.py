#!/usr/bin/env python3
"""
Test script for direct delivery flow (without batch)
Tests the complete flow: create → commit → cancel → verify quantity restoration
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Test users (from init_db.py)
SHELTER_USER = {
    "email": "abrigo1@example.com",
    "password": "senha123"
}

VOLUNTEER_USER = {
    "email": "joao@example.com", 
    "password": "senha123"
}

def login(email: str, password: str) -> str:
    """Login and return access token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": email, "password": password}
    )
    response.raise_for_status()
    return response.json()["access_token"]

def create_direct_delivery(token: str, location_id: int, product_type: str, quantity: int) -> dict:
    """Create a direct delivery (no batch)"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create delivery as AVAILABLE (shelter creates need)
    payload = {
        "location_id": location_id,
        "product_type": product_type,
        "quantity": quantity,
        "status": "available"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/deliveries/direct",
        json=payload,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def commit_to_delivery(token: str, delivery_id: int, quantity: int) -> dict:
    """Volunteer commits to delivery"""
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {"quantity": quantity}
    
    response = requests.post(
        f"{BASE_URL}/api/deliveries/{delivery_id}/commit",
        json=payload,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def cancel_delivery(token: str, delivery_id: int) -> dict:
    """Cancel a delivery"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.delete(
        f"{BASE_URL}/api/deliveries/{delivery_id}",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def get_delivery(delivery_id: int) -> dict:
    """Get delivery details"""
    response = requests.get(f"{BASE_URL}/api/deliveries/{delivery_id}")
    response.raise_for_status()
    return response.json()

def list_deliveries() -> list:
    """List all deliveries"""
    response = requests.get(f"{BASE_URL}/api/deliveries/")
    response.raise_for_status()
    return response.json()

def print_section(title: str):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def main():
    print_section("🧪 TESTE: Fluxo de Entrega Direta (Sem Batch)")
    
    try:
        # Step 1: Login
        print_section("1️⃣ Login dos Usuários")
        shelter_token = login(SHELTER_USER["email"], SHELTER_USER["password"])
        print(f"✅ Shelter logged in")
        
        volunteer_token = login(VOLUNTEER_USER["email"], VOLUNTEER_USER["password"])
        print(f"✅ Volunteer logged in")
        
        # Step 2: Create direct delivery (30 roupas)
        print_section("2️⃣ Criar Entrega Direta (30 roupas)")
        
        # First, let's check if there's already a delivery
        all_deliveries = list_deliveries()
        print(f"📋 Total deliveries no sistema: {len(all_deliveries)}")
        
        # Find or create a direct delivery for clothing
        clothing_delivery = None
        for d in all_deliveries:
            if (d.get("product_type") == "clothing" and 
                d.get("status") == "available" and 
                d.get("batch_id") is None):
                clothing_delivery = d
                break
        
        if not clothing_delivery:
            print("⚠️  Nenhuma delivery de roupas disponível encontrada")
            print("💡 Você precisa criar uma delivery manualmente via dashboard do abrigo")
            print("   ou ajustar o script para usar o endpoint correto")
            return
        
        delivery_id = clothing_delivery["id"]
        initial_quantity = clothing_delivery["quantity"]
        
        print(f"✅ Usando delivery existente:")
        print(f"   ID: {delivery_id}")
        print(f"   Quantidade inicial: {initial_quantity}")
        print(f"   Tipo: {clothing_delivery['product_type']}")
        print(f"   Status: {clothing_delivery['status']}")
        
        # Step 3: Volunteer commits partially (10 roupas)
        print_section("3️⃣ Voluntário Comita Parcialmente (10 roupas)")
        
        commit_quantity = 10
        committed_delivery = commit_to_delivery(volunteer_token, delivery_id, commit_quantity)
        
        print(f"✅ Commitment criado:")
        print(f"   ID da nova delivery: {committed_delivery['id']}")
        print(f"   Quantidade comprometida: {committed_delivery['quantity']}")
        print(f"   Status: {committed_delivery['status']}")
        
        # Step 4: Check original delivery quantity
        print_section("4️⃣ Verificar Quantidade da Delivery Original")
        
        original_delivery = get_delivery(delivery_id)
        print(f"📊 Delivery original após commit:")
        print(f"   Quantidade: {original_delivery['quantity']} (era {initial_quantity})")
        print(f"   Esperado: {initial_quantity - commit_quantity}")
        
        if original_delivery['quantity'] == initial_quantity - commit_quantity:
            print(f"✅ Quantidade reduzida corretamente!")
        else:
            print(f"❌ ERRO: Quantidade incorreta!")
        
        # Step 5: Cancel the committed delivery
        print_section("5️⃣ Cancelar Commitment")
        
        cancel_result = cancel_delivery(volunteer_token, committed_delivery['id'])
        print(f"✅ Delivery cancelada:")
        print(f"   Mensagem: {cancel_result['message']}")
        print(f"   Quantidade devolvida: {cancel_result['quantity_returned']}")
        
        # Step 6: Verify quantity restoration
        print_section("6️⃣ Verificar Restauração de Quantidade")
        
        restored_delivery = get_delivery(delivery_id)
        print(f"📊 Delivery original após cancelamento:")
        print(f"   Quantidade: {restored_delivery['quantity']}")
        print(f"   Esperado: {initial_quantity}")
        
        if restored_delivery['quantity'] == initial_quantity:
            print(f"✅ SUCESSO! Quantidade restaurada corretamente!")
            print(f"   {initial_quantity - commit_quantity} + {commit_quantity} = {restored_delivery['quantity']}")
        else:
            print(f"❌ FALHA! Quantidade não foi restaurada!")
            print(f"   Esperado: {initial_quantity}")
            print(f"   Atual: {restored_delivery['quantity']}")
            print(f"   Diferença: {initial_quantity - restored_delivery['quantity']}")
        
        # Summary
        print_section("📊 RESUMO DO TESTE")
        print(f"Quantidade inicial: {initial_quantity}")
        print(f"Quantidade comprometida: {commit_quantity}")
        print(f"Quantidade após commit: {original_delivery['quantity']}")
        print(f"Quantidade após cancelamento: {restored_delivery['quantity']}")
        print(f"\n{'✅ TESTE PASSOU' if restored_delivery['quantity'] == initial_quantity else '❌ TESTE FALHOU'}")
        
    except requests.exceptions.HTTPError as e:
        print(f"\n❌ Erro HTTP: {e}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
