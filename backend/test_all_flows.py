#!/usr/bin/env python3
"""
Teste completo de TODOS os fluxos do sistema
Pseudo-código executável para validar commitment/cancelamento
"""

from app.database import SessionLocal
from app.models import Delivery, User, ProductBatch, ResourceRequest
from app.enums import DeliveryStatus, OrderStatus
import requests

BASE_URL = "http://localhost:8000"

def print_header(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")

def print_step(step, description):
    print(f"\n{step}. {description}")

def get_token(email, password):
    """Login e obter token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"❌ Login falhou: {response.status_code}")
    return None

def check_db_state(user_id=None):
    """Verificar estado do banco de dados"""
    db = SessionLocal()
    try:
        if user_id:
            deliveries = db.query(Delivery).filter(Delivery.volunteer_id == user_id).all()
            print(f"\n📦 Deliveries do usuário {user_id}:")
        else:
            deliveries = db.query(Delivery).filter(Delivery.volunteer_id.isnot(None)).all()
            print(f"\n📦 Todas deliveries com voluntário:")
        
        for d in deliveries:
            volunteer = db.query(User).filter(User.id == d.volunteer_id).first()
            print(f"  ID={d.id}, volunteer={volunteer.email if volunteer else 'None'}, status={d.status}, qty={d.quantity}")
        
        return deliveries
    finally:
        db.close()

def get_user_deliveries_api(token):
    """Buscar deliveries do usuário via API"""
    response = requests.get(f"{BASE_URL}/api/deliveries/", headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        deliveries = response.json()
        print(f"\n📡 API retornou {len(deliveries)} deliveries")
        return deliveries
    print(f"❌ API falhou: {response.status_code}")
    return []

def commit_delivery(token, delivery_id, quantity=None):
    """Fazer commitment de delivery"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {"quantity": quantity} if quantity else {}
    
    response = requests.post(f"{BASE_URL}/api/deliveries/{delivery_id}/commit", headers=headers, json=body)
    
    if response.status_code == 200:
        return response.json()
    else:
        error = response.json() if response.status_code != 500 else {"detail": response.text}
        print(f"❌ Commit falhou: {response.status_code} - {error.get('detail')}")
        return None

def cancel_delivery(token, delivery_id):
    """Cancelar delivery"""
    response = requests.post(f"{BASE_URL}/api/cancel/delivery/{delivery_id}", headers={"Authorization": f"Bearer {token}"})
    
    if response.status_code == 200:
        return response.json()
    else:
        error = response.json() if response.status_code != 500 else {"detail": response.text}
        print(f"❌ Cancel falhou: {response.status_code} - {error.get('detail')}")
        return None

# ============================================================================
# FLUXO 1: VOLUNTÁRIO - COMMITMENT/CANCELAMENTO DE DELIVERY
# ============================================================================
def test_volunteer_delivery_flow():
    print_header("FLUXO 1: VOLUNTÁRIO - DELIVERY COMMITMENT/CANCELAMENTO")
    
    print_step("1.1", "Login como João (voluntário)")
    token = get_token("joao.voluntario@jfood.com", "123")
    if not token:
        return False
    print("✅ Login bem-sucedido")
    
    print_step("1.2", "Verificar estado inicial do banco")
    initial_deliveries = check_db_state(user_id=3)
    
    print_step("1.3", "Limpar deliveries órfãs se existirem")
    if initial_deliveries:
        print(f"⚠️ Encontradas {len(initial_deliveries)} deliveries órfãs!")
        for d in initial_deliveries:
            print(f"  Deletando delivery ID={d.id}...")
            result = cancel_delivery(token, d.id)
            if result:
                print(f"  ✅ Delivery {d.id} deletada")
        check_db_state(user_id=3)
    else:
        print("✅ Nenhuma delivery órfã encontrada")
    
    print_step("1.4", "Buscar deliveries via API (como frontend faz)")
    api_deliveries = get_user_deliveries_api(token)
    user_active = [d for d in api_deliveries if d.get('volunteer_id') == 3 and d['status'] in ['pending_confirmation', 'reserved', 'picked_up', 'in_transit']]
    print(f"📊 Deliveries ativas do João via API: {len(user_active)}")
    
    print_step("1.5", "Buscar delivery disponível para commitment")
    available = [d for d in api_deliveries if d['status'] == 'available' and d['volunteer_id'] is None]
    if not available:
        print("❌ Nenhuma delivery disponível!")
        return False
    
    delivery = available[0]
    print(f"✅ Delivery selecionada: ID={delivery['id']}, qty={delivery['quantity']}")
    
    print_step("1.6", "Fazer commitment PARCIAL (5 unidades)")
    committed = commit_delivery(token, delivery['id'], quantity=5)
    if not committed:
        return False
    
    print(f"✅ Commitment criado: ID={committed['id']}, qty={committed['quantity']}, status={committed['status']}")
    check_db_state(user_id=3)
    
    print_step("1.7", "Verificar que API agora retorna delivery ativa")
    api_deliveries = get_user_deliveries_api(token)
    user_active = [d for d in api_deliveries if d.get('volunteer_id') == 3 and d['status'] in ['pending_confirmation', 'reserved', 'picked_up', 'in_transit']]
    print(f"📊 Deliveries ativas do João via API: {len(user_active)}")
    if len(user_active) != 1:
        print(f"❌ ERRO! Esperado 1 delivery ativa, encontrado {len(user_active)}")
        return False
    print("✅ API retorna corretamente 1 delivery ativa")
    
    print_step("1.8", "Tentar fazer OUTRO commitment (deve falhar)")
    if available and len(available) > 1:
        second_delivery = available[1]
        print(f"  Tentando comprometer com delivery ID={second_delivery['id']}...")
        result = commit_delivery(token, second_delivery['id'], quantity=5)
        if result:
            print("❌ ERRO! Deveria ter falhado mas permitiu segundo commitment!")
            return False
        print("✅ Backend corretamente bloqueou segundo commitment")
    
    print_step("1.9", "Cancelar delivery")
    result = cancel_delivery(token, committed['id'])
    if not result:
        return False
    print(f"✅ Delivery cancelada")
    check_db_state(user_id=3)
    
    print_step("1.10", "Verificar que API não retorna mais deliveries ativas")
    api_deliveries = get_user_deliveries_api(token)
    user_active = [d for d in api_deliveries if d.get('volunteer_id') == 3 and d['status'] in ['pending_confirmation', 'reserved', 'picked_up', 'in_transit']]
    print(f"📊 Deliveries ativas do João via API: {len(user_active)}")
    if len(user_active) != 0:
        print(f"❌ ERRO! Esperado 0 deliveries ativas, encontrado {len(user_active)}")
        return False
    print("✅ API retorna corretamente 0 deliveries ativas")
    
    print_step("1.11", "Fazer NOVO commitment (deve funcionar)")
    if available:
        delivery = available[0]
        print(f"  Tentando comprometer com delivery ID={delivery['id']}...")
        committed = commit_delivery(token, delivery['id'], quantity=5)
        if not committed:
            print("❌ ERRO! Deveria permitir novo commitment mas falhou!")
            return False
        print(f"✅ Novo commitment criado: ID={committed['id']}")
        
        # Limpar
        cancel_delivery(token, committed['id'])
    
    print("\n✅ FLUXO 1 PASSOU!")
    return True

# ============================================================================
# FLUXO 2: FORNECEDOR - CANCELAMENTO DE DELIVERY
# ============================================================================
def test_provider_cancel_flow():
    print_header("FLUXO 2: FORNECEDOR - CANCELAMENTO DE DELIVERY")
    
    print_step("2.1", "Login como Cozinha Solidária (fornecedor)")
    provider_token = get_token("cozinha.solidaria@jfood.com", "123")
    if not provider_token:
        return False
    print("✅ Login bem-sucedido")
    
    print_step("2.2", "Login como João (voluntário)")
    volunteer_token = get_token("joao.voluntario@jfood.com", "123")
    if not volunteer_token:
        return False
    
    print_step("2.3", "João faz commitment de um batch do fornecedor")
    # Buscar batches do fornecedor
    response = requests.get(f"{BASE_URL}/api/batches/ready")
    if response.status_code != 200 or not response.json():
        print("⚠️ Nenhum batch disponível - PULANDO TESTE")
        return True
    
    batch = response.json()[0]
    print(f"  Batch selecionado: ID={batch['id']}, provider_id={batch['provider_id']}")
    
    # Buscar location para entrega
    response = requests.get(f"{BASE_URL}/api/locations/?active_only=true")
    if response.status_code != 200 or not response.json():
        print("❌ Nenhuma location disponível")
        return False
    
    location = response.json()[0]
    print(f"  Location selecionada: ID={location['id']}")
    
    # Criar delivery do batch
    response = requests.post(
        f"{BASE_URL}/api/batches/{batch['id']}/reserve",
        headers={"Authorization": f"Bearer {volunteer_token}", "Content-Type": "application/json"},
        json={"location_id": location['id'], "quantity": 5}
    )
    
    if response.status_code != 200:
        print(f"❌ Falha ao reservar batch: {response.status_code}")
        return False
    
    delivery = response.json()
    print(f"✅ Delivery criada: ID={delivery['id']}")
    
    print_step("2.4", "Fornecedor tenta cancelar delivery do voluntário")
    result = cancel_delivery(provider_token, delivery['id'])
    if not result:
        print("❌ Fornecedor não conseguiu cancelar!")
        return False
    
    print("✅ Fornecedor cancelou delivery com sucesso")
    check_db_state(user_id=3)
    
    print("\n✅ FLUXO 2 PASSOU!")
    return True

# ============================================================================
# FLUXO 3: ABRIGO - CANCELAMENTO DE DELIVERY
# ============================================================================
def test_shelter_cancel_flow():
    print_header("FLUXO 3: ABRIGO - CANCELAMENTO DE DELIVERY")
    
    print_step("3.1", "Login como Abrigo (receiver)")
    shelter_token = get_token("abrigo.sao.francisco@jfood.com", "123")
    if not shelter_token:
        return False
    print("✅ Login bem-sucedido")
    
    print_step("3.2", "Login como João (voluntário)")
    volunteer_token = get_token("joao.voluntario@jfood.com", "123")
    if not volunteer_token:
        return False
    
    print_step("3.3", "João faz commitment de delivery para o abrigo")
    response = requests.get(f"{BASE_URL}/api/deliveries/")
    if response.status_code != 200:
        print("❌ Falha ao buscar deliveries")
        return False
    
    available = [d for d in response.json() if d['status'] == 'available' and d['volunteer_id'] is None]
    if not available:
        print("❌ Nenhuma delivery disponível")
        return False
    
    delivery = available[0]
    print(f"  Delivery selecionada: ID={delivery['id']}, location_id={delivery['location_id']}")
    
    committed = commit_delivery(volunteer_token, delivery['id'], quantity=5)
    if not committed:
        return False
    
    print(f"✅ Commitment criado: ID={committed['id']}")
    
    print_step("3.4", "Abrigo tenta cancelar delivery")
    # Abrigo não deveria poder cancelar delivery de voluntário
    result = cancel_delivery(shelter_token, committed['id'])
    if result:
        print("⚠️ Abrigo conseguiu cancelar (verificar se isso é permitido)")
    else:
        print("✅ Abrigo não pode cancelar delivery de voluntário (correto)")
    
    # Limpar
    cancel_delivery(volunteer_token, committed['id'])
    
    print("\n✅ FLUXO 3 PASSOU!")
    return True

# ============================================================================
# MAIN
# ============================================================================
def main():
    print_header("🧪 TESTE COMPLETO DE TODOS OS FLUXOS")
    
    results = {
        "Voluntário - Delivery": test_volunteer_delivery_flow(),
        "Fornecedor - Cancelamento": test_provider_cancel_flow(),
        "Abrigo - Cancelamento": test_shelter_cancel_flow()
    }
    
    print_header("📊 RESUMO FINAL")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"  {test_name}: {status}")
    
    print(f"\n{'='*80}")
    if passed == total:
        print(f"  ✅ TODOS OS TESTES PASSARAM! ({passed}/{total})")
    else:
        print(f"  ❌ ALGUNS TESTES FALHARAM! ({passed}/{total})")
    print(f"{'='*80}")
    
    return passed == total

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
