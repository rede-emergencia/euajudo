#!/usr/bin/env python3
"""
Teste completo do fluxo de commitment/cancelamento
"""

from app.database import SessionLocal
from app.models import Delivery, User
from app.enums import DeliveryStatus
import requests
import json

BASE_URL = "http://localhost:8000"

def get_token(email, password):
    """Login e obter token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": email, "password": password}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ Erro no login: {response.status_code} - {response.text}")
        return None

def check_active_deliveries(token):
    """Verificar deliveries ativas do usuário"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/deliveries/", headers=headers)
    
    if response.status_code == 200:
        deliveries = response.json()
        active = [d for d in deliveries if d.get('volunteer_id') == 3 and d['status'] in ['pending_confirmation', 'reserved', 'picked_up', 'in_transit']]
        return active
    return []

def commit_to_delivery(token, delivery_id, quantity=None):
    """Comprometer-se com uma delivery"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    body = {"quantity": quantity} if quantity else {}
    
    response = requests.post(
        f"{BASE_URL}/api/deliveries/{delivery_id}/commit",
        headers=headers,
        json=body
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Erro ao comprometer: {response.status_code} - {response.text}")
        return None

def cancel_delivery(token, delivery_id):
    """Cancelar uma delivery"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/api/cancel/delivery/{delivery_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Erro ao cancelar: {response.status_code} - {response.text}")
        return None

def check_db_state():
    """Verificar estado do banco diretamente"""
    db = SessionLocal()
    try:
        deliveries = db.query(Delivery).all()
        print("\n📊 ESTADO DO BANCO:")
        for d in deliveries:
            volunteer = db.query(User).filter(User.id == d.volunteer_id).first() if d.volunteer_id else None
            print(f"  ID={d.id}, volunteer_id={d.volunteer_id}, status={d.status}, quantity={d.quantity}, volunteer={volunteer.email if volunteer else 'None'}")
    finally:
        db.close()

def main():
    print("=" * 70)
    print("🧪 TESTE COMPLETO DO FLUXO DE COMMITMENT/CANCELAMENTO")
    print("=" * 70)
    
    # 1. Login
    print("\n1️⃣ FAZENDO LOGIN...")
    token = get_token("joao.voluntario@jfood.com", "123")
    if not token:
        print("❌ Falha no login!")
        return
    print("✅ Login bem-sucedido!")
    
    # 2. Verificar estado inicial
    print("\n2️⃣ VERIFICANDO ESTADO INICIAL...")
    check_db_state()
    active = check_active_deliveries(token)
    print(f"\n📋 Deliveries ativas do João: {len(active)}")
    for d in active:
        print(f"  - ID={d['id']}, status={d['status']}, quantity={d['quantity']}")
    
    # 3. Se tem delivery ativa, cancelar
    if active:
        print("\n3️⃣ CANCELANDO DELIVERY ATIVA...")
        for d in active:
            result = cancel_delivery(token, d['id'])
            if result:
                print(f"✅ Delivery {d['id']} cancelada: {result.get('message')}")
            check_db_state()
    else:
        print("\n3️⃣ ✅ Nenhuma delivery ativa para cancelar")
    
    # 4. Verificar estado após cancelamento
    print("\n4️⃣ VERIFICANDO ESTADO APÓS CANCELAMENTO...")
    check_db_state()
    active = check_active_deliveries(token)
    print(f"\n📋 Deliveries ativas do João: {len(active)}")
    
    # 5. Comprometer com delivery (partial - 5 unidades)
    print("\n5️⃣ COMPROMETENDO COM DELIVERY (5 unidades)...")
    # Pegar primeira delivery disponível
    response = requests.get(f"{BASE_URL}/api/deliveries/")
    if response.status_code == 200:
        available = [d for d in response.json() if d['status'] == 'available' and d['volunteer_id'] is None]
        if available:
            delivery_to_commit = available[0]
            print(f"📦 Delivery selecionada: ID={delivery_to_commit['id']}, quantity={delivery_to_commit['quantity']}")
            
            committed = commit_to_delivery(token, delivery_to_commit['id'], quantity=5)
            if committed:
                print(f"✅ Compromisso criado: ID={committed['id']}, quantity={committed['quantity']}, status={committed['status']}")
                check_db_state()
            else:
                print("❌ Falha ao comprometer!")
                return
        else:
            print("❌ Nenhuma delivery disponível!")
            return
    
    # 6. Verificar estado após commitment
    print("\n6️⃣ VERIFICANDO ESTADO APÓS COMMITMENT...")
    check_db_state()
    active = check_active_deliveries(token)
    print(f"\n📋 Deliveries ativas do João: {len(active)}")
    for d in active:
        print(f"  - ID={d['id']}, status={d['status']}, quantity={d['quantity']}")
    
    # 7. Cancelar a nova delivery
    print("\n7️⃣ CANCELANDO A NOVA DELIVERY...")
    if active:
        for d in active:
            result = cancel_delivery(token, d['id'])
            if result:
                print(f"✅ Delivery {d['id']} cancelada: {result.get('message')}")
            check_db_state()
    
    # 8. Verificar estado final
    print("\n8️⃣ VERIFICANDO ESTADO FINAL...")
    check_db_state()
    active = check_active_deliveries(token)
    print(f"\n📋 Deliveries ativas do João: {len(active)}")
    
    # 9. Resumo
    print("\n" + "=" * 70)
    print("📊 RESUMO DO TESTE:")
    print("=" * 70)
    if len(active) == 0:
        print("✅ SUCESSO! Nenhuma delivery órfã encontrada")
        print("✅ Fluxo de commitment/cancelamento funcionando corretamente")
    else:
        print("❌ FALHA! Ainda existem deliveries ativas:")
        for d in active:
            print(f"  - ID={d['id']}, status={d['status']}, quantity={d['quantity']}")
    print("=" * 70)

if __name__ == "__main__":
    main()
