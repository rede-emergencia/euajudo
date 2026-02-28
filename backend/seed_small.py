#!/usr/bin/env python3
"""
Seed minimalista para desenvolvimento
Cria apenas:
- 1 admin
- 2 pontos de coleta (abrigos) com pedidos de marmitas e camisetas
- 2 voluntários
"""

import sys
import os
from datetime import datetime, timedelta

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, DeliveryLocation, Delivery
from app.auth import get_password_hash

def clear_database(db: Session):
    """Limpa todas as tabelas"""
    print("🧹 Limpando banco de dados...")
    
    # Ordem importa por causa das foreign keys
    db.query(Delivery).delete()
    db.query(DeliveryLocation).delete()
    db.query(User).delete()
    
    db.commit()
    print("✅ Banco limpo!")

def create_admin(db: Session):
    """Cria usuário admin"""
    print("\n👤 Criando admin...")
    
    admin = User(
        name="Admin Sistema",
        email="admin@vouajudar.org",
        hashed_password=get_password_hash("admin123"),
        roles="admin",
        phone="2133334444",
        active=True,
        approved=True
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    print(f"✅ Admin criado: {admin.email} / admin123")
    return admin

def create_volunteers(db: Session):
    """Cria 2 voluntários"""
    print("\n🤝 Criando voluntários...")
    
    volunteers = [
        {
            "name": "João Silva",
            "email": "joao@vouajudar.org",
            "password": "joao123",
            "phone": "21987654321"
        },
        {
            "name": "Maria Santos",
            "email": "maria@vouajudar.org",
            "password": "maria123",
            "phone": "21987654322"
        }
    ]
    
    created_volunteers = []
    for vol_data in volunteers:
        volunteer = User(
            name=vol_data["name"],
            email=vol_data["email"],
            hashed_password=get_password_hash(vol_data["password"]),
            roles="volunteer",
            phone=vol_data["phone"],
            active=True,
            approved=True
        )
        db.add(volunteer)
        created_volunteers.append(volunteer)
    
    db.commit()
    
    for vol in created_volunteers:
        db.refresh(vol)
        print(f"✅ Voluntário criado: {vol.email} / senha: {vol.email.split('@')[0]}123")
    
    return created_volunteers

def create_collection_points(db: Session):
    """Cria 2 pontos de coleta (abrigos) com localizações"""
    print("\n📍 Criando pontos de coleta...")
    
    # Criar usuários shelter primeiro
    shelters_data = [
        {
            "name": "Ponto de Coleta Centro",
            "email": "centro@vouajudar.org",
            "password": "centro123",
            "phone": "2133335555",
            "address": "Praça da República, 100 - Centro, Juiz de Fora - MG",
            "latitude": -21.7642,
            "longitude": -43.3505,
            "contact_person": "Carlos Mendes",
            "operating_hours": "08:00 - 18:00"
        },
        {
            "name": "Ponto de Coleta São Sebastião",
            "email": "saosebastiao@vouajudar.org",
            "password": "saosebastiao123",
            "phone": "2133336666",
            "address": "Rua São Sebastião, 200 - São Sebastião, Juiz de Fora - MG",
            "latitude": -21.7842,
            "longitude": -43.3705,
            "contact_person": "Ana Paula Costa",
            "operating_hours": "07:00 - 19:00"
        }
    ]
    
    created_shelters = []
    created_locations = []
    
    for shelter_data in shelters_data:
        # Criar usuário shelter
        shelter_user = User(
            name=shelter_data["name"],
            email=shelter_data["email"],
            hashed_password=get_password_hash(shelter_data["password"]),
            roles="shelter",
            phone=shelter_data["phone"],
            active=True
        )
        db.add(shelter_user)
        db.flush()  # Para obter o ID
        
        # Criar location associada
        location = DeliveryLocation(
            user_id=shelter_user.id,
            name=shelter_data["name"],
            address=shelter_data["address"],
            latitude=shelter_data["latitude"],
            longitude=shelter_data["longitude"],
            contact_person=shelter_data["contact_person"],
            phone=shelter_data["phone"],
            operating_hours=shelter_data["operating_hours"],
            active=True
        )
        db.add(location)
        
        created_shelters.append(shelter_user)
        created_locations.append(location)
    
    db.commit()
    
    for shelter, location in zip(created_shelters, created_locations):
        db.refresh(shelter)
        db.refresh(location)
        print(f"✅ Ponto de coleta criado: {shelter.email} / senha: {shelter.email.split('@')[0]}123")
    
    return created_shelters, created_locations

def create_delivery_requests(db: Session, locations: list):
    """Cria pedidos de marmitas e camisetas para cada ponto de coleta"""
    print("\n📦 Criando pedidos de doações...")
    
    deliveries = []
    
    for location in locations:
        # Pedido de marmitas
        delivery_meal = Delivery(
            location_id=location.id,
            product_type="meal",
            quantity=30,
            status="available",
            created_at=datetime.utcnow()
        )
        db.add(delivery_meal)
        deliveries.append(delivery_meal)
        
        # Pedido de camisetas
        delivery_clothing = Delivery(
            location_id=location.id,
            product_type="clothing",
            quantity=20,
            status="available",
            created_at=datetime.utcnow()
        )
        db.add(delivery_clothing)
        deliveries.append(delivery_clothing)
    
    db.commit()
    
    for delivery in deliveries:
        db.refresh(delivery)
        location = db.query(DeliveryLocation).filter(DeliveryLocation.id == delivery.location_id).first()
        product_names = {
            "meal": "🍽️ Marmitas",
            "clothing": "👕 Camisetas"
        }
        print(f"✅ Pedido criado: {location.name} precisa de {delivery.quantity} {product_names[delivery.product_type]}")
    
    return deliveries

def main():
    """Função principal"""
    print("=" * 60)
    print("🌱 SEED MINIMALISTA - VOU AJUDAR")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # 1. Limpar banco
        clear_database(db)
        
        # 2. Criar admin
        admin = create_admin(db)
        
        # 3. Criar voluntários
        volunteers = create_volunteers(db)
        
        # 4. Criar pontos de coleta (shelters + locations)
        shelters, locations = create_collection_points(db)
        
        # 5. Criar pedidos de doações
        deliveries = create_delivery_requests(db, locations)
        
        print("\n" + "=" * 60)
        print("✅ SEED CONCLUÍDO COM SUCESSO!")
        print("=" * 60)
        print("\n📋 RESUMO:")
        print(f"  • 1 Admin")
        print(f"  • 2 Voluntários")
        print(f"  • 2 Pontos de Coleta")
        print(f"  • 4 Pedidos de Doações (2 marmitas + 2 camisetas)")
        
        print("\n🔑 CREDENCIAIS:")
        print("  Admin:")
        print("    • Email: admin@vouajudar.org")
        print("    • Senha: admin123")
        print("\n  Voluntários:")
        print("    • Email: joao@vouajudar.org / Senha: joao123")
        print("    • Email: maria@vouajudar.org / Senha: maria123")
        print("\n  Pontos de Coleta:")
        print("    • Email: centro@vouajudar.org / Senha: centro123")
        print("    • Email: saosebastiao@vouajudar.org / Senha: saosebastiao123")
        
        print("\n🗺️  MAPA:")
        print("  • Ponto de Coleta Centro: Praça da República, 100 - Centro")
        print("    - Precisa: 30 Marmitas + 20 Camisetas")
        print("  • Ponto de Coleta São Sebastião: Rua São Sebastião, 200")
        print("    - Precisa: 30 Marmitas + 20 Camisetas")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ Erro durante seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
