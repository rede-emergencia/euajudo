#!/usr/bin/env python3
"""
Seed minimalista usando seed_data.py
Cria: 1 admin, 1 volunteer, 1 shelter + categorias básicas
"""

import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.database import get_db, engine, Base
from app.models import User, DeliveryLocation, Category, CategoryAttribute
from app.auth import get_password_hash
from app.shared.enums import UserRole
from seed_data import (
    ADMIN_CREDENTIALS, VOLUNTEERS, SHELTERS, CATEGORIES, print_credentials
)

def clear_database(db: Session):
    """Limpa todas as tabelas na ordem correta"""
    print("🧹 Limpando banco de dados...")
    
    # Ordem correta para evitar erros de chave estrangeira
    tables_to_clear = [
        CategoryAttribute,
        Category,
        DeliveryLocation,
        User
    ]
    
    for table in tables_to_clear:
        try:
            db.query(table).delete()
            print(f"  ✅ Limpo: {table.__name__}")
        except Exception as e:
            print(f"  ⚠️ Pulando {table.__name__}: {e}")
    
    db.commit()
    print("✅ Banco limpo!")

def create_admin(db: Session):
    """Cria usuário admin principal usando seed_data"""
    print("\n👑 Criando admin...")
    
    admin = User(
        name=ADMIN_CREDENTIALS["name"],
        email=ADMIN_CREDENTIALS["email"],
        hashed_password=get_password_hash(ADMIN_CREDENTIALS["password"]),
        roles=UserRole.ADMIN.value,
        phone=ADMIN_CREDENTIALS["phone"],
        active=True,
        approved=True
    )
    db.add(admin)
    db.commit()
    
    print(f"✅ Admin criado: {admin.email} / senha: {ADMIN_CREDENTIALS['password']}")
    return admin

def create_volunteer(db: Session):
    """Cria 1 voluntário usando seed_data"""
    print("\n🤝 Criando voluntário...")
    
    volunteer_data = VOLUNTEERS[0]  # Pega apenas o primeiro voluntário
    
    volunteer = User(
        name=volunteer_data["name"],
        email=volunteer_data["email"],
        hashed_password=get_password_hash(volunteer_data["password"]),
        roles=UserRole.VOLUNTEER.value,
        phone=volunteer_data["phone"],
        active=True,
        approved=True
    )
    db.add(volunteer)
    db.commit()
    
    print(f"✅ Voluntário criado: {volunteer.email} / senha: {volunteer_data['password']}")
    return volunteer

def create_shelter(db: Session):
    """Cria 1 abrigo usando seed_data"""
    print("\n🏠 Criando abrigo...")
    
    shelter_data = SHELTERS[0]  # Pega apenas o primeiro abrigo
    
    # Criar usuário shelter
    shelter_user = User(
        name=shelter_data["name"],
        email=shelter_data["email"],
        hashed_password=get_password_hash(shelter_data["password"]),
        roles=UserRole.SHELTER.value,
        phone=shelter_data["phone"],
        active=True,
        approved=True
    )
    db.add(shelter_user)
    db.flush()
    
    # Criar localização do abrigo
    location = DeliveryLocation(
        name=shelter_data["name"],
        address=shelter_data["address"],
        latitude=shelter_data["latitude"],
        longitude=shelter_data["longitude"],
        phone=shelter_data["phone"],
        contact_person=shelter_data["contact_person"],
        operating_hours="24 horas",
        capacity=200,
        daily_need=150,
        active=True,
        approved=True,
        user_id=shelter_user.id
    )
    db.add(location)
    db.commit()
    
    print(f"✅ Abrigo criado: {shelter_user.email} / senha: {shelter_data['password']}")
    return shelter_user, location

def create_categories(db: Session):
    """Cria categorias básicas usando seed_data"""
    print("\n📦 Criando categorias básicas...")
    
    categories = []
    
    for cat_data in CATEGORIES:
        attributes = cat_data.pop("attributes", [])
        
        category = Category(
            active=True,
            **cat_data
        )
        db.add(category)
        db.flush()
        
        # Criar atributos com todos os campos necessários
        for attr_data in attributes:
            # Mapear campos para o modelo correto
            attribute = CategoryAttribute(
                category_id=category.id,
                name=attr_data["name"],
                display_name=attr_data.get("display_name", attr_data["name"]),
                attribute_type=attr_data.get("type", "text"),
                required=attr_data.get("required", False),
                sort_order=attr_data.get("sort_order", 1),
                min_value=attr_data.get("min_value"),
                max_value=attr_data.get("max_value"),
                options=attr_data.get("options", [])
            )
            db.add(attribute)
        
        categories.append(category)
        print(f"  ✅ Categoria criada: {category.display_name} {category.icon}")
    
    db.commit()
    return categories

def main():
    """Função principal do seed"""
    print("🌱 Iniciando seed minimalista usando seed_data.py...")
    print("=" * 60)
    
    # Garantir que as tabelas existam
    print("🔨 Verificando/criando tabelas...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas verificadas!")
    
    db = next(get_db())
    
    try:
        # Limpar banco
        clear_database(db)
        
        # Criar dados base
        admin = create_admin(db)
        volunteer = create_volunteer(db)
        shelter, location = create_shelter(db)
        categories = create_categories(db)
        
        print("\n" + "=" * 60)
        print("✅ Seed minimalista concluído com sucesso!")
        print("\n📊 Resumo:")
        print(f"   👤 Usuários: 3 (1 admin, 1 volunteer, 1 shelter)")
        print(f"   🏠 Locais: 1 abrigo")
        print(f"   📦 Categorias: {len(categories)} essenciais")
        
        print("\n🔐 Credenciais de acesso:")
        print(f"   Admin: {ADMIN_CREDENTIALS['email']} / {ADMIN_CREDENTIALS['password']}")
        print(f"   Volunteer: {VOLUNTEERS[0]['email']} / {VOLUNTEERS[0]['password']}")
        print(f"   Shelter: {SHELTERS[0]['email']} / {SHELTERS[0]['password']}")
        
    except Exception as e:
        print(f"❌ Erro durante o seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
