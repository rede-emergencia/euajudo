#!/usr/bin/env python3
"""
Seed BETA - Usuários Simplificados para Testes
- Emails curtos e fáceis (f1@j.com, a1@j.com, v1@j.com, adm@j.com)
- Senha: 123 para todos
- Dados básicos para testes rápidos
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
    """Create users for BETA system"""
    password_hash = get_password_hash("123")
    
    users_data = [
        # FORNECEDOR
        {
            'email': 'f1@j.com',
            'name': 'F1 - Fornecedor',
            'phone': '32988887777',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua Halfeld, 123 - Centro, Juiz de Fora',
            'establishment_type': 'Restaurante',
            'production_capacity': 100,
            'latitude': -21.764200,
            'longitude': -43.350200,
            'approved': True,
            'active': True
        },
        # ABRIGO/RECEBEDOR
        {
            'email': 'a1@j.com',
            'name': 'A1 - Abrigo',
            'phone': '32977776666',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua São João, 456 - Zona Norte, Juiz de Fora',
            'establishment_type': 'Abrigo',
            'production_capacity': 0,
            'latitude': -21.754200,
            'longitude': -43.340200,
            'approved': True,
            'active': True
        },
        # VOLUNTÁRIO
        {
            'email': 'v1@j.com',
            'name': 'V1 - Voluntário',
            'phone': '32966665555',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Avenida Brasil, 789 - Centro, Juiz de Fora',
            'establishment_type': 'Voluntário',
            'production_capacity': 0,
            'latitude': -21.764200,
            'longitude': -43.350200,
            'approved': True,
            'active': True
        },
        # ADMIN
        {
            'email': 'adm@j.com',
            'name': 'ADM - Admin',
            'phone': '32999998888',
            'roles': 'admin',
            'hashed_password': password_hash,
            'address': 'Rua Presidente Pedreira, 101 - Centro, Juiz de Fora',
            'establishment_type': 'Administração',
            'production_capacity': 0,
            'latitude': -21.764200,
            'longitude': -43.350200,
            'approved': True,
            'active': True
        }
    ]
    
    print("👥 Criando usuários BETA...")
    for user_data in users_data:
        user = User(**user_data)
        db.add(user)
        print(f"  ✅ {user_data['email']} - {user_data['name']}")
    
    db.commit()
    print("")

def create_locations(db):
    """Create basic locations for testing"""
    locations_data = [
        {
            'name': 'Abrigo Central',
            'address': 'Rua São João, 456 - Zona Norte, Juiz de Fora',
            'latitude': -21.754200,
            'longitude': -43.340200,
            'phone': '32977776666',
            'contact_person': 'A1 - Abrigo',
            'active': True
        },
        {
            'name': 'Cozinha Central',
            'address': 'Rua Halfeld, 123 - Centro, Juiz de Fora',
            'latitude': -21.764200,
            'longitude': -43.350200,
            'phone': '32988887777',
            'contact_person': 'F1 - Fornecedor',
            'active': True
        }
    ]
    
    print("📍 Criando locais para testes...")
    for location_data in locations_data:
        location = DeliveryLocation(**location_data)
        db.add(location)
        print(f"  ✅ {location_data['name']}")
    
    db.commit()
    print("")

def create_sample_batches(db):
    """Create some sample batches for testing"""
    # Get users
    provider = db.query(User).filter(User.email == 'f1@j.com').first()
    
    if not provider:
        print("❌ Fornecedor f1@j.com não encontrado")
        return
    
    batches_data = [
        {
            'provider_id': provider.id,
            'product_type': ProductType.MEAL,
            'quantity': 20,
            'quantity_available': 20,
            'description': 'Marmitas prontas para entrega',
            'status': BatchStatus.READY,
            'ready_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(hours=6)
        },
        {
            'provider_id': provider.id,
            'product_type': ProductType.MEDICINE,
            'quantity': 10,
            'quantity_available': 10,
            'description': 'Medicamentos para doação',
            'status': BatchStatus.READY,
            'ready_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(days=30)
        }
    ]
    
    print("🍽️ Criando batches para testes...")
    for batch_data in batches_data:
        batch = ProductBatch(**batch_data)
        db.add(batch)
        print(f"  ✅ {batch_data['product_type'].value} - {batch_data['quantity_available']} unidades")
    
    db.commit()
    print("")

def create_sample_requests(db):
    """Create sample resource requests"""
    # Get users
    shelter = db.query(User).filter(User.email == 'a1@j.com').first()
    
    if not shelter:
        print("❌ Abrigo a1@j.com não encontrado")
        return
    
    requests_data = [
        {
            'location_id': 1,  # Abrigo Central
            'requester_id': shelter.id,
            'status': OrderStatus.REQUESTING,
            'priority': 1,
            'created_at': datetime.now()
        }
    ]
    
    print("📋 Criando solicitações para testes...")
    for request_data in requests_data:
        request = ResourceRequest(**request_data)
        db.add(request)
        db.flush()  # Get the ID
        
        # Add items to the request
        items_data = [
            {
                'request_id': request.id,
                'product_type': ProductType.MEAL,
                'quantity_requested': 10,
                'quantity_fulfilled': 0,
                'priority': 1
            },
            {
                'request_id': request.id,
                'product_type': ProductType.MEDICINE,
                'quantity_requested': 5,
                'quantity_fulfilled': 0,
                'priority': 2
            }
        ]
        
        for item_data in items_data:
            item = ResourceItem(**item_data)
            db.add(item)
        
        print(f"  ✅ Solicitação #{request.id} - {len(items_data)} itens")
    
    db.commit()
    print("")

def main():
    """Main seed function"""
    print("🚀 Iniciando seed BETA para EuAjudo\n")
    
    db = SessionLocal()
    try:
        clear_database()
        create_users(db)
        # Omitindo locations e batches para simplificar
        
        print("🎉 Seed BETA concluído com sucesso!")
        print("\n📱 Usuários disponíveis para login:")
        print("  🍽️  f1@j.com     - F1 - Fornecedor (senha: 123)")
        print("  🏠  a1@j.com     - A1 - Abrigo (senha: 123)")
        print("  🚚  v1@j.com     - V1 - Voluntário (senha: 123)")
        print("  ⚙️  adm@j.com    - ADM - Admin (senha: 123)")
        print("\n✨ A aplicação está pronta para testes em modo BETA!")
        
    except Exception as e:
        print(f"❌ Erro no seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
