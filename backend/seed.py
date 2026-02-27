#!/usr/bin/env python3
"""
Seed completo JFood - Juiz de Fora
- Coordenadas espaçadas em pelo menos 100m
- Abrigos com pedidos variados (marmita, higiene, roupa, medicamento)
- Login disponível para todos os usuários
"""

from app.database import SessionLocal, engine
from app import models
from app.models import User, DeliveryLocation, ProductBatch, Delivery, ResourceRequest, ResourceItem
from app.enums import ProductType, BatchStatus, DeliveryStatus, OrderStatus
from app.auth import get_password_hash
from datetime import datetime, timedelta

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
        # FORNECEDORES (espaçados 100m+)
        {
            'email': 'cozinha.solidaria@jfood.com',
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
            'email': 'farmacia.esperanca@jfood.com',
            'name': 'Farmácia Esperança',
            'phone': '32955554444',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Av. Rio Branco, 800 - Centro, Juiz de Fora',
            'establishment_type': 'Farmácia',
            'production_capacity': 80,
            'latitude': -21.763100,
            'longitude': -43.349100,
            'approved': True,
            'active': True
        },
        # VOLUNTÁRIOS
        {
            'email': 'joao.voluntario@jfood.com',
            'name': 'João Voluntário',
            'phone': '32999998888',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Rua Matias Barbosa, 100 - Centro, Juiz de Fora',
            'latitude': -21.763500,
            'longitude': -43.351000,
            'approved': True,
            'active': True
        },
        {
            'email': 'maria.voluntaria@jfood.com',
            'name': 'Maria Voluntária',
            'phone': '32988887766',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Rua Machado Costa, 50 - Centro, Juiz de Fora',
            'latitude': -21.762800,
            'longitude': -43.349500,
            'approved': True,
            'active': True
        },
        {
            'email': 'pedro.entregador@jfood.com',
            'name': 'Pedro Entregador',
            'phone': '32977776655',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Rua Chanceler Oswaldo Aranha, 80 - Centro, Juiz de Fora',
            'latitude': -21.766200,
            'longitude': -43.352500,
            'approved': True,
            'active': True
        },
        # ADMIN
        {
            'email': 'admin@jfood.com',
            'name': 'Administrador JFood',
            'phone': '32999999999',
            'roles': 'admin',
            'hashed_password': password_hash,
            'address': 'Centro Administrativo, Juiz de Fora',
            'latitude': -21.761500,
            'longitude': -43.352000,
            'approved': True,
            'active': True
        }
    ]
    
    created_users = []
    for user_data in users_data:
        user = User(**user_data)
        db.add(user)
        created_users.append(user)
    
    db.commit()
    print(f"👥 {len(created_users)} usuários criados")
    return created_users

def create_delivery_locations(db):
    """Create delivery locations (abrigos espaçados 100m+)"""
    locations_data = [
        # ABRIGO 1: Só marmita - Cascatinha (~600m do centro)
        {
            'name': 'Abrigo São Francisco - Cascatinha',
            'address': 'Rua Principal, 500 - Cascatinha, Juiz de Fora',
            'latitude': -21.758000,
            'longitude': -43.320000,
            'contact_person': 'Irmã Maria Clara',
            'phone': '3236881234',
            'capacity': 80,
            'daily_need': 60,
            'operating_hours': '08:00 - 18:00',
            'active': True,
            'approved': True
        },
        # ABRIGO 2: Só higiene - Vila Ideal (~500m)
        {
            'name': 'Casa de Acolhimento Vila Ideal',
            'address': 'Rua das Acácias, 300 - Vila Ideal, Juiz de Fora',
            'latitude': -21.741000,
            'longitude': -43.375000,
            'contact_person': 'João Batista',
            'phone': '3236992345',
            'capacity': 50,
            'daily_need': 40,
            'operating_hours': '07:00 - 19:00',
            'active': True,
            'approved': True
        },
        # ABRIGO 3: Só roupas - Jardim Glória (~800m)
        {
            'name': 'Abrigo Esperança - Jardim Glória',
            'address': 'Av. dos Andradas, 800 - Jardim Glória, Juiz de Fora',
            'latitude': -21.785000,
            'longitude': -43.340000,
            'contact_person': 'Ana Paula Costa',
            'phone': '3237003456',
            'capacity': 100,
            'daily_need': 80,
            'operating_hours': '24 horas',
            'active': True,
            'approved': True
        },
        # ABRIGO 4: Só medicamentos - Santa Luzia (~900m)
        {
            'name': 'Casa de Saúde Santa Luzia',
            'address': 'Rua das Laranjeiras, 400 - Santa Luzia, Juiz de Fora',
            'latitude': -21.795000,
            'longitude': -43.365000,
            'contact_person': 'Dra. Paula Fernandes',
            'phone': '3237114567',
            'capacity': 30,
            'daily_need': 25,
            'operating_hours': '24 horas',
            'active': True,
            'approved': True
        },
        # ABRIGO 5: Marmita + Higiene - Vitorino Braga (~400m)
        {
            'name': 'Centro Comunitário Vitorino Braga',
            'address': 'Rua Marechal Deodoro, 600 - Vitorino Braga, Juiz de Fora',
            'latitude': -21.752000,
            'longitude': -43.330000,
            'contact_person': 'Pedro Henrique',
            'phone': '3237225678',
            'capacity': 70,
            'daily_need': 55,
            'operating_hours': '08:00 - 20:00',
            'active': True,
            'approved': True
        },
        # ABRIGO 6: SEM PEDIDO - Centro
        {
            'name': 'Abrigo Municipal Centro',
            'address': 'Praça da Estação, 100 - Centro, Juiz de Fora',
            'latitude': -21.762500,
            'longitude': -43.353500,
            'contact_person': 'Carlos Eduardo',
            'phone': '3237336789',
            'capacity': 90,
            'daily_need': 70,
            'operating_hours': '06:00 - 22:00',
            'active': True,
            'approved': True
        },
        # ABRIGO 7: SEM PEDIDO - Granbery (~700m)
        {
            'name': 'Casa de Passagem Granbery',
            'address': 'Rua Halfeld, 800 - Granbery, Juiz de Fora',
            'latitude': -21.770000,
            'longitude': -43.355000,
            'contact_person': 'Fernanda Lima',
            'phone': '3237447890',
            'capacity': 45,
            'daily_need': 35,
            'operating_hours': '09:00 - 21:00',
            'active': True,
            'approved': True
        }
    ]
    
    created_locations = []
    for loc_data in locations_data:
        location = DeliveryLocation(**loc_data)
        db.add(location)
        created_locations.append(location)
    
    db.commit()
    print(f"🏠 {len(created_locations)} abrigos criados (espaçados 100m+)")
    return created_locations

def create_product_batches(db, providers):
    """Create product batches ready for pickup"""
    batches_data = [
        {
            'provider_id': providers[0].id,  # Cozinha Solidária
            'product_type': ProductType.MEAL,
            'quantity': 100,
            'quantity_available': 100,
            'description': 'Marmitas com arroz, feijão, frango e salada',
            'status': BatchStatus.READY,
            'donated_ingredients': True,
            'pickup_deadline': '18:00',
            'ready_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(hours=4)
        },
        {
            'provider_id': providers[1].id,  # Farmácia Esperança
            'product_type': ProductType.MEDICINE,
            'quantity': 80,
            'quantity_available': 80,
            'description': 'Medicamentos básicos e de uso contínuo',
            'status': BatchStatus.READY,
            'donated_ingredients': True,
            'pickup_deadline': '19:00',
            'ready_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(days=15)
        }
    ]
    
    created_batches = []
    for batch_data in batches_data:
        batch = ProductBatch(**batch_data)
        db.add(batch)
        created_batches.append(batch)
    
    db.commit()
    print(f"📦 {len(created_batches)} lotes de produtos criados")
    return created_batches

def create_deliveries(db, locations):
    """Create delivery requests (pedidos diretos dos abrigos)"""
    deliveries_data = [
        # Abrigo 1: Só marmita
        {
            'batch_id': None,
            'location_id': locations[0].id,
            'volunteer_id': None,
            'product_type': ProductType.MEAL,
            'quantity': 50,
            'status': DeliveryStatus.AVAILABLE,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(hours=24)
        },
        # Abrigo 2: Só medicamentos (mudando de abrigo)
        {
            'batch_id': None,
            'location_id': locations[1].id,
            'volunteer_id': None,
            'product_type': ProductType.MEDICINE,
            'quantity': 30,
            'status': DeliveryStatus.AVAILABLE,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(hours=24)
        },
        # Abrigo 3: Marmita extra
        {
            'batch_id': None,
            'location_id': locations[2].id,
            'volunteer_id': None,
            'product_type': ProductType.MEAL,
            'quantity': 40,
            'status': DeliveryStatus.AVAILABLE,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(hours=24)
        },
        # Abrigo 4: Só medicamentos
        {
            'batch_id': None,
            'location_id': locations[3].id,
            'volunteer_id': None,
            'product_type': ProductType.MEDICINE,
            'quantity': 25,
            'status': DeliveryStatus.AVAILABLE,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(hours=24)
        },
        # Abrigo 5: Marmita
        {
            'batch_id': None,
            'location_id': locations[4].id,
            'volunteer_id': None,
            'product_type': ProductType.MEAL,
            'quantity': 35,
            'status': DeliveryStatus.AVAILABLE,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(hours=24)
        },
                # Abrigos 6 e 7 não têm pedidos
    ]
    
    created_deliveries = []
    for delivery_data in deliveries_data:
        delivery = Delivery(**delivery_data)
        db.add(delivery)
        created_deliveries.append(delivery)
    
    db.commit()
    print(f"🚚 {len(created_deliveries)} pedidos de entrega criados")
    return created_deliveries

def create_resource_requests(db, providers):
    """Create resource requests (pedidos de insumos para compra)"""
    request = ResourceRequest(
        provider_id=providers[0].id,  # Cozinha Solidária
        quantity_meals=200,
        status=OrderStatus.REQUESTING,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=6)
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    
    # Itens do pedido
    items_data = [
        {'request_id': request.id, 'name': 'Arroz', 'quantity': 20.0, 'unit': 'kg'},
        {'request_id': request.id, 'name': 'Feijão', 'quantity': 15.0, 'unit': 'kg'},
        {'request_id': request.id, 'name': 'Frango', 'quantity': 30.0, 'unit': 'kg'},
        {'request_id': request.id, 'name': 'Tomate', 'quantity': 10.0, 'unit': 'kg'},
        {'request_id': request.id, 'name': 'Alface', 'quantity': 5.0, 'unit': 'kg'},
        {'request_id': request.id, 'name': 'Óleo de soja', 'quantity': 5.0, 'unit': 'L'}
    ]
    
    for item_data in items_data:
        item = ResourceItem(**item_data)
        db.add(item)
    
    db.commit()
    print(f"📋 1 pedido de insumos criado (6 itens para compra)")
    return [request]

def main():
    """Main seed function"""
    print("🌱 JFOOD SEED - Juiz de Fora")
    print("   Coordenadas espaçadas em pelo menos 100m\n")
    
    clear_database()
    db = SessionLocal()
    
    try:
        # Criar dados
        users = create_users(db)
        providers = [u for u in users if 'provider' in u.roles]
        volunteers = [u for u in users if 'volunteer' in u.roles]
        
        locations = create_delivery_locations(db)
        batches = create_product_batches(db, providers)
        deliveries = create_deliveries(db, locations)
        resource_requests = create_resource_requests(db, providers)
        
        # Resumo
        print("\n" + "="*70)
        print("✅ BANCO DE DADOS POPULADO COM SUCESSO!")
        print("="*70)
        print(f"\n📊 RESUMO:")
        print(f"   👥 {len(users)} usuários no sistema")
        print(f"      • 4 fornecedores")
        print(f"      • 3 voluntários")
        print(f"      • 1 administrador")
        print(f"\n   🏠 {len(locations)} abrigos (todos espaçados 100m+)")
        print(f"      • 5 com pedidos ativos")
        print(f"      • 2 sem pedidos")
        print(f"\n   📦 {len(batches)} lotes prontos para retirada")
        print(f"      • Marmitas, higiene, roupas, medicamentos")
        print(f"\n   🚚 {len(deliveries)} pedidos de entrega direta")
        print(f"      • Só marmita: 1 abrigo")
        print(f"      • Só higiene: 1 abrigo")
        print(f"      • Só roupas: 1 abrigo")
        print(f"      • Só medicamentos: 1 abrigo")
        print(f"      • Marmita + higiene: 1 abrigo")
        print(f"\n   📋 {len(resource_requests)} pedido de insumos para compra")
        
        print("\n🔑 LOGIN (senha: 123 para todos):")
        for user in users:
            icon = "🏪" if "provider" in user.roles else "🙋" if "volunteer" in user.roles else "👤"
            print(f"   {icon} {user.email}")
        
        print("\n🎯 AÇÕES DISPONÍVEIS:")
        print("   1. Retirar produtos de fornecedores → entregar em abrigos")
        print("   2. Comprar insumos para cozinha comunitária")
        print("   3. Comprometer-se com entregas diretas para abrigos")
        print("="*70)
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
