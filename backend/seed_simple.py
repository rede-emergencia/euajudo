#!/usr/bin/env python3
"""
Seed Simplificado - Apenas Medicamentos e Marmitas
- Apenas locais pedindo medicamentos e marmitas
- Interface simplificada com um botão de comprometer
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
    """Create users for simplified system"""
    password_hash = get_password_hash("123")
    
    # FORNECEDORES
    users_data = [
        {
            'email': 'cozinha.solidaria@jfood.com',
            'name': 'Cozinha Solidária Central',
            'phone': '32988887777',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua Halfeld, 123 - Centro, Juiz de Fora',
            'establishment_type': 'Cozinha Comunitária',
            'production_capacity': 100,
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
            'production_capacity': 50,
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
        # ADMIN
        {
            'email': 'admin@jfood.com',
            'name': 'Administrador Sistema',
            'phone': '32999999999',
            'roles': 'admin',
            'hashed_password': password_hash,
            'address': 'Rua da Bahia, 100 - Centro, Juiz de Fora',
            'latitude': -21.765000,
            'longitude': -43.351500,
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

def create_locations(db):
    """Create delivery locations asking for meals and medicines"""
    locations_data = [
        {
            'name': 'Abrigo São Francisco - Cascatinha',
            'address': 'Rua Principal, 500 - Cascatinha, Juiz de Fora',
            'city_id': 'belo-horizonte',
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
        {
            'name': 'Casa de Saúde Santa Luzia',
            'address': 'Rua das Laranjeiras, 400 - Santa Luzia, Juiz de Fora',
            'city_id': 'belo-horizonte',
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
        {
            'name': 'Centro Comunitário Vitorino Braga',
            'address': 'Rua Marechal Deodoro, 600 - Vitorino Braga, Juiz de Fora',
            'city_id': 'belo-horizonte',
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
        {
            'name': 'Abrigo Esperança - Jardim Glória',
            'address': 'Av. dos Andradas, 800 - Jardim Glória, Juiz de Fora',
            'city_id': 'belo-horizonte',
            'latitude': -21.785000,
            'longitude': -43.340000,
            'contact_person': 'Ana Paula Costa',
            'phone': '3237003456',
            'capacity': 100,
            'daily_need': 80,
            'operating_hours': '24 horas',
            'active': True,
            'approved': True
        }
    ]
    
    locations = []
    for location_data in locations_data:
        location = DeliveryLocation(**location_data)
        db.add(location)
        locations.append(location)
    
    db.commit()
    print(f"🏠 {len(locations)} abrigos criados")
    return locations

def create_deliveries(db, locations):
    """Create delivery requests for meals and medicines"""
    deliveries_data = [
        # Marmitas
        {
            'location_id': locations[0].id,  # Abrigo São Francisco
            'product_type': ProductType.MEAL,
            'quantity': 50,
            'status': DeliveryStatus.AVAILABLE,
            'expires_at': datetime.utcnow() + timedelta(days=2)
        },
        {
            'location_id': locations[2].id,  # Centro Comunitário
            'product_type': ProductType.MEAL,
            'quantity': 40,
            'status': DeliveryStatus.AVAILABLE,
            'expires_at': datetime.utcnow() + timedelta(days=2)
        },
        {
            'location_id': locations[3].id,  # Abrigo Esperança
            'product_type': ProductType.MEAL,
            'quantity': 60,
            'status': DeliveryStatus.AVAILABLE,
            'expires_at': datetime.utcnow() + timedelta(days=2)
        },
        # Medicamentos
        {
            'location_id': locations[1].id,  # Casa de Saúde
            'product_type': ProductType.MEDICINE,
            'quantity': 30,
            'status': DeliveryStatus.AVAILABLE,
            'expires_at': datetime.utcnow() + timedelta(days=2)
        },
        {
            'location_id': locations[3].id,  # Abrigo Esperança (também pede medicamentos)
            'product_type': ProductType.MEDICINE,
            'quantity': 25,
            'status': DeliveryStatus.AVAILABLE,
            'expires_at': datetime.utcnow() + timedelta(days=2)
        }
    ]
    
    deliveries = []
    for delivery_data in deliveries_data:
        delivery = Delivery(**delivery_data)
        db.add(delivery)
        deliveries.append(delivery)
    
    db.commit()
    print(f"🚚 {len(deliveries)} pedidos de entrega criados")
    return deliveries

def create_batches(db, users):
    """Create product batches"""
    providers = [u for u in users if 'provider' in u.roles]
    
    batches_data = [
        # Marmitas da Cozinha
        {
            'provider_id': providers[0].id,  # Cozinha Solidária
            'product_type': ProductType.MEAL,
            'quantity': 100,
            'quantity_available': 100,
            'status': BatchStatus.READY,
            'description': 'Marmitas prontas para entrega',
            'expires_at': datetime.utcnow() + timedelta(hours=6)
        },
        # Medicamentos da Farmácia
        {
            'provider_id': providers[1].id,  # Farmácia Esperança
            'product_type': ProductType.MEDICINE,
            'quantity': 50,
            'quantity_available': 50,
            'status': BatchStatus.READY,
            'description': 'Medicamentos básicos para doação',
            'expires_at': datetime.utcnow() + timedelta(days=7)
        }
    ]
    
    batches = []
    for batch_data in batches_data:
        batch = ProductBatch(**batch_data)
        db.add(batch)
        batches.append(batch)
    
    db.commit()
    print(f"📦 {len(batches)} lotes criados")
    return batches

def main():
    """Main seed function"""
    print("🌱 JFOOD SEED - Versão Simplificada")
    print("   Apenas Medicamentos e Marmitas\n")
    
    # Clear database
    clear_database()
    
    # Create data
    db = SessionLocal()
    try:
        users = create_users(db)
        locations = create_locations(db)
        deliveries = create_deliveries(db, locations)
        batches = create_batches(db, users)
        
        print("\n" + "="*70)
        print("✅ BANCO DE DADOS POPULADO COM SUCESSO!")
        print("="*70)
        
        print("\n📊 RESUMO:")
        print(f"   👥 {len(users)} usuários no sistema")
        print(f"      • {len([u for u in users if 'provider' in u.roles])} fornecedores")
        print(f"      • {len([u for u in users if 'volunteer' in u.roles])} voluntários")
        print(f"      • 1 administrador")
        
        print(f"\n   🏠 {len(locations)} abrigos pedindo:")
        print(f"      • {len([d for d in deliveries if d.product_type == 'meal'])} pedidos de marmitas")
        print(f"      • {len([d for d in deliveries if d.product_type == 'medicine'])} pedidos de medicamentos")
        
        print(f"\n   📦 {len(batches)} lotes disponíveis:")
        print(f"      • 1 lote de marmitas (100 unidades)")
        print(f"      • 1 lote de medicamentos (50 unidades)")
        
        print("\n🔑 LOGIN (senha: 123 para todos):")
        for user in users:
            role_icon = "🏪" if "provider" in user.roles else "🙋" if "volunteer" in user.roles else "👤"
            print(f"   {role_icon} {user.email}")
        
        print("\n🎯 AÇÕES DISPONÍVEIS:")
        print("   1. Comprometer-se com entregas de marmitas para abrigos")
        print("   2. Comprometer-se com entregas de medicamentos para abrigos")
        print("   3. Interface simplificada com um botão de comprometer")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
