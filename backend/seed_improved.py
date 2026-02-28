#!/usr/bin/env python3
"""
Seed melhorado EUAJUDO - Juiz de Fora
Cenários completos para testes:
- Abrigos: um pedindo item único, outro pedindo múltiplos itens
- Fornecedores: em diferentes estados (procurando insumos, idle, com marmitas prontas)
- Voluntários: podem retirar marmitas de fornecedores e entregar em abrigos
- Login disponível para todos os usuários
"""

from app.database import SessionLocal, engine
from app import models
from app.models import User, DeliveryLocation, ProductBatch, Delivery, ResourceRequest, ResourceItem
from app.enums import ProductType, BatchStatus, DeliveryStatus, OrderStatus
from app.auth import get_password_hash
from datetime import datetime, timedelta
import random

def clear_database():
    """Clear and recreate all tables"""
    print("🗑️  Limpando banco de dados...")
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    print("✅ Banco recriado\n")

def create_users(db):
    """Create all users for the system"""
    password_hash = get_password_hash("123")
    
    users_data = [
        # FORNECEDORES (diferentes estados)
        {
            'email': 'cozinha.solidaria@euajudo.com',
            'name': 'Cozinha Solidária Central',
            'phone': '32988887777',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua Halfeld, 123 - Centro, Juiz de Fora',
            'establishment_type': 'Cozinha Comunitária',
            'production_capacity': 200,
            'latitude': -21.764200,
            'longitude': -43.350200,
            'approved': True,
            'active': True
        },
        {
            'email': 'farmacia.esperanca@euajudo.com',
            'name': 'Farmácia Esperança',
            'phone': '32955554444',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Av. Rio Branco, 800 - Centro, Juiz de Fora',
            'establishment_type': 'Farmácia',
            'production_capacity': 100,
            'latitude': -21.764200,
            'longitude': -43.350200,
            'approved': True,
            'active': True
        },
        {
            'email': 'restaurante.bom.sabor@euajudo.com',
            'name': 'Restaurante Bom Sabor',
            'phone': '32977776666',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua Santos Dumont, 455 - São Mateus, Juiz de Fora',
            'establishment_type': 'Restaurante',
            'production_capacity': 150,
            'latitude': -21.754200,
            'longitude': -43.360200,
            'approved': True,
            'active': True
        },
        {
            'email': 'doacao.roupas@euajudo.com',
            'name': 'Doação de Roupas Unidas',
            'phone': '32966665555',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua Batista de Oliveira, 200 - Grama, Juiz de Fora',
            'establishment_type': 'Centro de Doação',
            'production_capacity': 300,
            'latitude': -21.774200,
            'longitude': -43.340200,
            'approved': True,
            'active': True
        },
        
        # VOLUNTÁRIOS
        {
            'email': 'joao.voluntario@euajudo.com',
            'name': 'João Voluntário',
            'phone': '32999998888',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Rua Matias Barbosa, 100 - Centro, Juiz de Fora',
            'latitude': -21.7635,
            'longitude': -43.351,
            'approved': True,
            'active': True
        },
        {
            'email': 'maria.voluntaria@euajudo.com',
            'name': 'Maria Voluntária',
            'phone': '32988887776',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Avenida Rio Branco, 200 - Centro, Juiz de Fora',
            'latitude': -21.7645,
            'longitude': -43.3495,
            'approved': True,
            'active': True
        },
        {
            'email': 'pedro.entregador@euajudo.com',
            'name': 'Pedro Entregador',
            'phone': '32977776655',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Rua São Paulo, 150 - Centro, Juiz de Fora',
            'latitude': -21.7655,
            'longitude': -43.3505,
            'approved': True,
            'active': True
        },
        
        # ADMIN
        {
            'email': 'admin@euajudo.com',
            'name': 'Administrador Sistema',
            'phone': '32900000000',
            'roles': 'admin',
            'hashed_password': password_hash,
            'address': 'Rua da Administração, 1 - Centro, Juiz de Fora',
            'latitude': -21.7642,
            'longitude': -43.3502,
            'approved': True,
            'active': True
        },
        
        # ABRIGOS
        {
            'email': 'abrigo.sao.francisco@euajudo.com',
            'name': 'Abrigo São Francisco de Assis',
            'phone': '32933332222',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua Marechal Deodoro, 600 - Vitorino Braga, Juiz de Fora',
            'latitude': -21.752,
            'longitude': -43.33,
            'approved': True,
            'active': True
        },
        {
            'email': 'abrigo.carmo@euajudo.com',
            'name': 'Abrigo Nossa Senhora do Carmo',
            'phone': '32922221111',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua da Lapa, 300 - Lapa, Juiz de Fora',
            'latitude': -21.742,
            'longitude': -43.32,
            'approved': True,
            'active': True
        },
        {
            'email': 'abrigo.bom.pastor@euajudo.com',
            'name': 'Abrigo Bom Pastor',
            'phone': '32911110000',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua do Ouro, 250 - Centro, Juiz de Fora',
            'latitude': -21.772,
            'longitude': -43.342,
            'approved': True,
            'active': True
        }
    ]
    
    users = []
    for user_data in users_data:
        user = User(**user_data)
        db.add(user)
        users.append(user)
    
    db.commit()
    print(f"👥 {len(users)} usuários criados")
    return users

def create_shelters(db, users):
    """Create shelter locations"""
    shelters = []
    shelter_users = [u for u in users if 'shelter' in u.roles]
    
    shelter_data = [
        {
            'user': shelter_users[0],  # Abrigo São Francisco
            'name': 'Abrigo São Francisco de Assis',
            'address': 'Rua Marechal Deodoro, 600 - Vitorino Braga, Juiz de Fora',
            'city_id': 'belo-horizonte',
            'latitude': -21.752,
            'longitude': -43.33,
            'contact_person': 'Padre Francisco',
            'phone': '32933332222',
            'capacity': 70,
            'daily_need': 55,
            'operating_hours': '08:00 - 20:00'
        },
        {
            'user': shelter_users[1],  # Abrigo Carmo
            'name': 'Abrigo Nossa Senhora do Carmo',
            'address': 'Rua da Lapa, 300 - Lapa, Juiz de Fora',
            'city_id': 'belo-horizonte',
            'latitude': -21.742,
            'longitude': -43.32,
            'contact_person': 'Irmã Maria',
            'phone': '32922221111',
            'capacity': 50,
            'daily_need': 40,
            'operating_hours': '07:00 - 19:00'
        },
        {
            'user': shelter_users[2],  # Abrigo Bom Pastor
            'name': 'Abrigo Bom Pastor',
            'address': 'Rua do Ouro, 250 - Centro, Juiz de Fora',
            'city_id': 'belo-horizonte',
            'latitude': -21.772,
            'longitude': -43.342,
            'contact_person': 'Pastor José',
            'phone': '32911110000',
            'capacity': 60,
            'daily_need': 45,
            'operating_hours': '08:00 - 18:00'
        }
    ]
    
    for data in shelter_data:
        shelter = DeliveryLocation(
            name=data['name'],
            address=data['address'],
            city_id=data['city_id'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            contact_person=data['contact_person'],
            phone=data['phone'],
            capacity=data['capacity'],
            daily_need=data['daily_need'],
            operating_hours=data['operating_hours'],
            user_id=data['user'].id,
            approved=True,
            active=True
        )
        db.add(shelter)
        shelters.append(shelter)
    
    db.commit()
    print(f"🏠 {len(shelters)} abrigos criados")
    return shelters

def create_batches(db, users):
    """Create product batches in different states"""
    providers = [u for u in users if 'provider' in u.roles]
    
    # Batch 1: Cozinha com marmitas prontas (READY)
    batch1 = ProductBatch(
        provider_id=providers[0].id,  # Cozinha Solidária
        product_type=ProductType.MEAL,
        quantity=50,
        description='Marmitas vegetarianas com arroz, feijão e salada',
        donated_ingredients=True,
        status=BatchStatus.READY,
        created_at=datetime.utcnow() - timedelta(hours=2),
        expires_at=datetime.utcnow() + timedelta(hours=6),
        pickup_deadline=datetime.utcnow() + timedelta(hours=4),
        quantity_available=50
    )
    
    # Batch 2: Farmácia com medicamentos prontos (READY)
    batch2 = ProductBatch(
        provider_id=providers[1].id,  # Farmácia Esperança
        product_type=ProductType.MEDICINE,
        quantity=30,
        description='Kit de medicamentos básicos (analgésicos, antibióticos)',
        donated_ingredients=True,
        status=BatchStatus.READY,
        created_at=datetime.utcnow() - timedelta(hours=1),
        expires_at=datetime.utcnow() + timedelta(hours=8),
        pickup_deadline=datetime.utcnow() + timedelta(hours=6),
        quantity_available=30
    )
    
    # Batch 3: Restaurante produzindo (PRODUCING)
    batch3 = ProductBatch(
        provider_id=providers[2].id,  # Restaurante Bom Sabor
        product_type=ProductType.MEAL,
        quantity=40,
        description='Marmitas de frango com arroz e batata',
        donated_ingredients=False,
        status=BatchStatus.PRODUCING,
        created_at=datetime.utcnow() - timedelta(minutes=30),
        expires_at=datetime.utcnow() + timedelta(hours=5),
        pickup_deadline=datetime.utcnow() + timedelta(hours=3),
        quantity_available=0  # Ainda não disponível
    )
    
    # Batch 4: Doação de roupas prontas (READY)
    batch4 = ProductBatch(
        provider_id=providers[3].id,  # Doação de Roupas
        product_type=ProductType.CLOTHING,
        quantity=100,
        description='Roupas de inverno para adultos e crianças',
        donated_ingredients=True,
        status=BatchStatus.READY,
        created_at=datetime.utcnow() - timedelta(hours=3),
        expires_at=datetime.utcnow() + timedelta(hours=12),
        pickup_deadline=datetime.utcnow() + timedelta(hours=10),
        quantity_available=100
    )
    
    batches = [batch1, batch2, batch3, batch4]
    for batch in batches:
        db.add(batch)
    
    db.commit()
    print(f"📦 {len(batches)} lotes criados em diferentes estados")
    return batches

def create_shelter_requests(db, shelters):
    """Create delivery requests for shelters (using Delivery model)"""
    # Request 1: Abrigo pedindo APENAS medicamentos (item único)
    delivery1 = Delivery(
        batch_id=None,  # Direct commitment (no batch)
        location_id=shelters[0].id,  # Abrigo São Francisco
        product_type=ProductType.MEDICINE,
        quantity=20,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(hours=1),
        expires_at=datetime.utcnow() + timedelta(hours=12)
    )
    db.add(delivery1)
    
    # Request 2: Abrigo pedindo MÚLTIPLOS itens (medicamentos + marmitas)
    # Item 1: 15 medicamentos
    delivery2_1 = Delivery(
        batch_id=None,  # Direct commitment
        location_id=shelters[1].id,  # Abrigo Carmo
        product_type=ProductType.MEDICINE,
        quantity=15,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(minutes=30),
        expires_at=datetime.utcnow() + timedelta(hours=10)
    )
    db.add(delivery2_1)
    
    # Item 2: 25 marmitas
    delivery2_2 = Delivery(
        batch_id=None,  # Direct commitment
        location_id=shelters[1].id,  # Abrigo Carmo
        product_type=ProductType.MEAL,
        quantity=25,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(minutes=30),
        expires_at=datetime.utcnow() + timedelta(hours=10)
    )
    db.add(delivery2_2)
    
    # Request 3: Abrigo pedindo apenas roupas
    delivery3 = Delivery(
        batch_id=None,  # Direct commitment
        location_id=shelters[2].id,  # Abrigo Bom Pastor
        product_type=ProductType.CLOTHING,
        quantity=30,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(minutes=15),
        expires_at=datetime.utcnow() + timedelta(hours=8)
    )
    db.add(delivery3)
    
    db.commit()
    print(f"📋 {4} pedidos de abrigos criados (1 item único, 2 múltiplos itens, 1 roupas)")
    return [delivery1, delivery2_1, delivery2_2, delivery3]

def create_deliveries(db, batches, shelters):
    """Create direct delivery requests from batches to shelters"""
    deliveries = []
    
    # Delivery 1: Marmitas do batch 1 para abrigo 1
    delivery1 = Delivery(
        batch_id=batches[0].id,  # Marmitas prontas
        location_id=shelters[0].id,  # Abrigo São Francisco
        product_type=ProductType.MEAL,
        quantity=20,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(minutes=45),
        expires_at=datetime.utcnow() + timedelta(hours=4)
    )
    db.add(delivery1)
    
    # Delivery 2: Medicamentos do batch 2 para abrigo 2
    delivery2 = Delivery(
        batch_id=batches[1].id,  # Medicamentos prontos
        location_id=shelters[1].id,  # Abrigo Carmo
        product_type=ProductType.MEDICINE,
        quantity=15,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(minutes=30),
        expires_at=datetime.utcnow() + timedelta(hours=5)
    )
    db.add(delivery2)
    
    # Delivery 3: Roupas do batch 4 para abrigo 3
    delivery3 = Delivery(
        batch_id=batches[3].id,  # Roupas prontas
        location_id=shelters[2].id,  # Abrigo Bom Pastor
        product_type=ProductType.CLOTHING,
        quantity=25,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(minutes=15),
        expires_at=datetime.utcnow() + timedelta(hours=6)
    )
    db.add(delivery3)
    
    # Delivery 4: Marmitas restantes do batch 1 para abrigo 2 (múltiplos itens)
    delivery4 = Delivery(
        batch_id=batches[0].id,  # Marmitas prontas
        location_id=shelters[1].id,  # Abrigo Carmo
        product_type=ProductType.MEAL,
        quantity=25,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(minutes=10),
        expires_at=datetime.utcnow() + timedelta(hours=3)
    )
    db.add(delivery4)
    
    # Delivery 5: Medicamentos restantes do batch 2 para abrigo 1
    delivery5 = Delivery(
        batch_id=batches[1].id,  # Medicamentos prontos
        location_id=shelters[0].id,  # Abrigo São Francisco
        product_type=ProductType.MEDICINE,
        quantity=15,
        status=DeliveryStatus.AVAILABLE,
        created_at=datetime.utcnow() - timedelta(minutes=5),
        expires_at=datetime.utcnow() + timedelta(hours=4)
    )
    db.add(delivery5)
    
    db.commit()
    print(f"🚚 {len(deliveries)} entregas diretas criadas")
    return deliveries

def main():
    """Main seed function"""
    db = SessionLocal()
    
    try:
        clear_database()
        
        # Criar usuários
        users = create_users(db)
        
        # Criar abrigos
        shelters = create_shelters(db, users)
        
        # Criar lotes em diferentes estados
        batches = create_batches(db, users)
        
        # Criar pedidos de abrigos
        shelter_requests = create_shelter_requests(db, shelters)
        
        # Criar entregas diretas
        deliveries = create_deliveries(db, batches, shelters)
        
        print("\n" + "="*70)
        print("✅ BANCO DE DADOS MELHORADO COM SUCESSO!")
        print("="*70)
        
        print("\n📊 RESUMO DOS CENÁRIOS:")
        print(f"   👥 Usuários: {len(users)}")
        print(f"      • {len([u for u in users if 'provider' in u.roles])} fornecedores")
        print(f"      • {len([u for u in users if 'volunteer' in u.roles])} voluntários")
        print(f"      • {len([u for u in users if 'shelter' in u.roles])} abrigos")
        print(f"      • 1 administrador")
        
        print(f"\n🏠 Abrigos com pedidos:")
        print(f"   • Abrigo São Francisco: APENAS medicamentos (20 unidades)")
        print(f"   • Abrigo Carmo: MÚLTIPLOS itens (15 medicamentos + 25 marmitas)")
        print(f"   • Abrigo Bom Pastor: APENAS roupas (30 unidades)")
        
        print(f"\n📦 Fornecedores em diferentes estados:")
        print(f"   • Cozinha Solidária: MARMITAS PRONTAS (50 disponíveis)")
        print(f"   • Farmácia Esperança: MEDICAMENTOS PRONTOS (30 disponíveis)")
        print(f"   • Restaurante Bom Sabor: PRODUZINDO (40 marmitas em preparo)")
        print(f"   • Doação de Roupas: ROUPAS PRONTAS (100 disponíveis)")
        
        print(f"\n🚚 Entregas diretas disponíveis:")
        print(f"   • 20 marmitas → Abrigo São Francisco")
        print(f"   • 15 medicamentos → Abrigo Carmo")
        print(f"   • 25 roupas → Abrigo Bom Pastor")
        print(f"   • 25 marmitas → Abrigo Carmo (atende múltiplos itens)")
        print(f"   • 15 medicamentos → Abrigo São Francisco")
        
        print(f"\n🎯 CENÁRIOS DE TESTE:")
        print(f"   1. Voluntário pode retirar MARMITAS de fornecedores")
        print(f"   2. Voluntário pode entregar PARTE dos pedidos múltiplos")
        print(f"   3. Voluntário pode aceitar itens únicos ou múltiplos")
        print(f"   4. Fornecedores em estados diferentes (prontos, produzindo, idle)")
        
        print(f"\n🔑 LOGIN (senha: 123 para todos):")
        print(f"   🏪 Fornecedores:")
        print(f"      • cozinha.solidaria@euajudo.com (marmitas prontas)")
        print(f"      • farmacia.esperanca@euajudo.com (medicamentos prontos)")
        print(f"      • restaurante.bom.sabor@euajudo.com (produzindo)")
        print(f"      • doacao.roupas@euajudo.com (roupas prontas)")
        print(f"   🙋 Voluntários:")
        print(f"      • joao.voluntario@euajudo.com")
        print(f"      • maria.voluntaria@euajudo.com")
        print(f"      • pedro.entregador@euajudo.com")
        print(f"   🏠 Abrigos:")
        print(f"      • abrigo.sao.francisco@euajudo.com (só medicamentos)")
        print(f"      • abrigo.carmo@euajudo.com (múltiplos itens)")
        print(f"      • abrigo.bom.pastor@euajudo.com (só roupas)")
        print(f"   👤 Admin:")
        print(f"      • admin@euajudo.com")
        
        print("\n" + "="*70)
        
    except Exception as e:
        print(f"❌ Erro no seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
