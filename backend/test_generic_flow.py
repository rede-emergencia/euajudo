#!/usr/bin/env python3
"""
Testes genéricos para todos os fluxos de commitment/cancelamento
Testa: deliveries, batches, resource requests
"""

from app.database import SessionLocal
from app.models import Delivery, User, ProductBatch, ResourceRequest, ResourceReservation
from app.enums import DeliveryStatus, BatchStatus, OrderStatus, ProductType
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
    return None

def print_section(title):
    """Print section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")

def check_db_deliveries():
    """Verificar deliveries no banco"""
    db = SessionLocal()
    try:
        deliveries = db.query(Delivery).filter(Delivery.volunteer_id.isnot(None)).all()
        print(f"\n📦 Deliveries com voluntário: {len(deliveries)}")
        for d in deliveries:
            volunteer = db.query(User).filter(User.id == d.volunteer_id).first()
            print(f"  ID={d.id}, volunteer={volunteer.email if volunteer else 'None'}, status={d.status}, qty={d.quantity}")
        return deliveries
    finally:
        db.close()

def check_db_batches():
    """Verificar batches no banco"""
    db = SessionLocal()
    try:
        batches = db.query(ProductBatch).filter(ProductBatch.status == BatchStatus.IN_DELIVERY).all()
        print(f"\n📦 Batches em delivery: {len(batches)}")
        for b in batches:
            print(f"  ID={b.id}, provider_id={b.provider_id}, status={b.status}, qty_available={b.quantity_available}")
        return batches
    finally:
        db.close()

def check_db_reservations():
    """Verificar reservations no banco"""
    db = SessionLocal()
    try:
        reservations = db.query(ResourceReservation).filter(
            ResourceReservation.status == OrderStatus.RESERVED
        ).all()
        print(f"\n📋 Resource Reservations ativas: {len(reservations)}")
        for r in reservations:
            volunteer = db.query(User).filter(User.id == r.user_id).first()
            print(f"  ID={r.id}, volunteer={volunteer.email if volunteer else 'None'}, status={r.status}")
        return reservations
    finally:
        db.close()

# ============================================================================
# TESTE 1: DELIVERY COMMITMENT/CANCELAMENTO
# ============================================================================
def test_delivery_flow():
    print_section("TESTE 1: DELIVERY COMMITMENT/CANCELAMENTO")
    
    token = get_token("joao.voluntario@jfood.com", "123")
    if not token:
        print("❌ Falha no login!")
        return False
    
    # 1. Verificar estado inicial
    print("\n1️⃣ Estado inicial:")
    initial_deliveries = check_db_deliveries()
    
    # 2. Limpar deliveries órfãs se existirem
    if initial_deliveries:
        print("\n2️⃣ Limpando deliveries órfãs...")
        for d in initial_deliveries:
            response = requests.post(
                f"{BASE_URL}/api/cancel/delivery/{d.id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                print(f"  ✅ Delivery {d.id} cancelada")
        check_db_deliveries()
    
    # 3. Pegar delivery disponível
    print("\n3️⃣ Buscando delivery disponível...")
    response = requests.get(f"{BASE_URL}/api/deliveries/")
    if response.status_code != 200:
        print("❌ Erro ao buscar deliveries")
        return False
    
    available = [d for d in response.json() if d['status'] == 'available' and d['volunteer_id'] is None]
    if not available:
        print("❌ Nenhuma delivery disponível")
        return False
    
    delivery = available[0]
    print(f"  📦 Delivery selecionada: ID={delivery['id']}, qty={delivery['quantity']}")
    
    # 4. Fazer commitment parcial
    print("\n4️⃣ Fazendo commitment parcial (5 unidades)...")
    response = requests.post(
        f"{BASE_URL}/api/deliveries/{delivery['id']}/commit",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"quantity": 5}
    )
    
    if response.status_code != 200:
        print(f"❌ Erro ao comprometer: {response.status_code} - {response.text}")
        return False
    
    committed = response.json()
    print(f"  ✅ Commitment criado: ID={committed['id']}, qty={committed['quantity']}")
    check_db_deliveries()
    
    # 5. Cancelar commitment
    print("\n5️⃣ Cancelando commitment...")
    response = requests.post(
        f"{BASE_URL}/api/cancel/delivery/{committed['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print(f"❌ Erro ao cancelar: {response.status_code} - {response.text}")
        return False
    
    print(f"  ✅ Delivery cancelada")
    final_deliveries = check_db_deliveries()
    
    # 6. Validar resultado
    if len(final_deliveries) == 0:
        print("\n✅ TESTE DELIVERY: PASSOU!")
        return True
    else:
        print(f"\n❌ TESTE DELIVERY: FALHOU! {len(final_deliveries)} deliveries órfãs")
        return False

# ============================================================================
# TESTE 2: BATCH RESERVATION/CANCELAMENTO
# ============================================================================
def test_batch_flow():
    print_section("TESTE 2: BATCH RESERVATION/CANCELAMENTO")
    
    token = get_token("joao.voluntario@jfood.com", "123")
    if not token:
        print("❌ Falha no login!")
        return False
    
    # 1. Verificar estado inicial
    print("\n1️⃣ Estado inicial:")
    initial_batches = check_db_batches()
    
    # 2. Pegar batch disponível
    print("\n2️⃣ Buscando batch disponível...")
    response = requests.get(f"{BASE_URL}/api/batches/ready")
    if response.status_code != 200:
        print("❌ Erro ao buscar batches")
        return False
    
    batches = response.json()
    if not batches:
        print("⚠️ Nenhum batch disponível - PULANDO TESTE")
        return True
    
    batch = batches[0]
    print(f"  📦 Batch selecionado: ID={batch['id']}, qty_available={batch['quantity_available']}")
    
    # 3. Reservar batch (precisa escolher location)
    print("\n3️⃣ Buscando location para entrega...")
    response = requests.get(f"{BASE_URL}/api/locations/?active_only=true")
    if response.status_code != 200 or not response.json():
        print("❌ Erro ao buscar locations")
        return False
    
    location = response.json()[0]
    print(f"  🏠 Location selecionada: ID={location['id']}, name={location['name']}")
    
    # 4. Criar delivery do batch
    print("\n4️⃣ Criando delivery do batch...")
    response = requests.post(
        f"{BASE_URL}/api/batches/{batch['id']}/reserve",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"location_id": location['id'], "quantity": 5}
    )
    
    if response.status_code != 200:
        print(f"❌ Erro ao reservar batch: {response.status_code} - {response.text}")
        return False
    
    delivery = response.json()
    print(f"  ✅ Delivery criada: ID={delivery['id']}, qty={delivery['quantity']}")
    check_db_deliveries()
    
    # 5. Cancelar delivery
    print("\n5️⃣ Cancelando delivery do batch...")
    response = requests.post(
        f"{BASE_URL}/api/cancel/delivery/{delivery['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print(f"❌ Erro ao cancelar: {response.status_code} - {response.text}")
        return False
    
    print(f"  ✅ Delivery cancelada")
    final_deliveries = check_db_deliveries()
    
    # 6. Validar resultado
    if len(final_deliveries) == 0:
        print("\n✅ TESTE BATCH: PASSOU!")
        return True
    else:
        print(f"\n❌ TESTE BATCH: FALHOU! {len(final_deliveries)} deliveries órfãs")
        return False

# ============================================================================
# TESTE 3: RESOURCE REQUEST RESERVATION/CANCELAMENTO
# ============================================================================
def test_resource_flow():
    print_section("TESTE 3: RESOURCE REQUEST RESERVATION/CANCELAMENTO")
    
    token = get_token("joao.voluntario@jfood.com", "123")
    if not token:
        print("❌ Falha no login!")
        return False
    
    # 1. Verificar estado inicial
    print("\n1️⃣ Estado inicial:")
    initial_reservations = check_db_reservations()
    
    # 2. Limpar reservations órfãs se existirem
    if initial_reservations:
        print("\n2️⃣ Limpando reservations órfãs...")
        for r in initial_reservations:
            response = requests.post(
                f"{BASE_URL}/api/cancel/resource_reservation/{r.id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                print(f"  ✅ Reservation {r.id} cancelada")
        check_db_reservations()
    
    # 3. Pegar resource request disponível
    print("\n3️⃣ Buscando resource request disponível...")
    response = requests.get(f"{BASE_URL}/api/resources/requests?status=requesting")
    if response.status_code != 200:
        print("❌ Erro ao buscar resource requests")
        return False
    
    requests_list = response.json()
    if not requests_list:
        print("⚠️ Nenhum resource request disponível - PULANDO TESTE")
        return True
    
    resource_request = requests_list[0]
    print(f"  📋 Request selecionado: ID={resource_request['id']}")
    
    # 4. Aceitar pedido (criar reservation)
    print("\n4️⃣ Aceitando pedido de insumos...")
    # Pegar primeiro item do request
    if not resource_request.get('items'):
        print("❌ Request sem items")
        return False
    
    item = resource_request['items'][0]
    
    response = requests.post(
        f"{BASE_URL}/api/resources/requests/{resource_request['id']}/accept",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"items": [{"item_id": item['id'], "quantity": 1.0}]}
    )
    
    if response.status_code != 200:
        print(f"❌ Erro ao aceitar: {response.status_code} - {response.text}")
        return False
    
    reservation = response.json()
    print(f"  ✅ Reservation criada: ID={reservation['id']}")
    check_db_reservations()
    
    # 5. Cancelar reservation
    print("\n5️⃣ Cancelando reservation...")
    response = requests.post(
        f"{BASE_URL}/api/cancel/resource_reservation/{reservation['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print(f"❌ Erro ao cancelar: {response.status_code} - {response.text}")
        return False
    
    print(f"  ✅ Reservation cancelada")
    final_reservations = check_db_reservations()
    
    # 6. Validar resultado
    if len(final_reservations) == 0:
        print("\n✅ TESTE RESOURCE: PASSOU!")
        return True
    else:
        print(f"\n❌ TESTE RESOURCE: FALHOU! {len(final_reservations)} reservations órfãs")
        return False

# ============================================================================
# MAIN
# ============================================================================
def main():
    print_section("🧪 TESTE DE DELIVERY COMMITMENT/CANCELAMENTO")
    
    # Focar apenas em delivery que é o principal problema
    result = test_delivery_flow()
    
    print_section("📊 RESUMO FINAL")
    
    if result:
        print(f"  ✅ TESTE PASSOU!")
        print(f"\n  Backend está funcionando corretamente:")
        print(f"  - Commitment parcial cria nova delivery")
        print(f"  - Cancelamento deleta delivery corretamente")
        print(f"  - Nenhuma delivery órfã fica no banco")
    else:
        print(f"  ❌ TESTE FALHOU!")
        print(f"\n  Problemas encontrados no backend")
    
    print(f"{'='*70}")

if __name__ == "__main__":
    main()
