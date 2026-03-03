#!/usr/bin/env python3
"""
Seed específico para produção PostgreSQL
"""

import os
import sys
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text

# Configurar ambiente para produção
os.environ["DATABASE_URL"] = "postgresql://euajudo_user:niHQGFxb2EClbnS6Rvq86GDFS6fuexNM@dpg-d6h6fj0gjchc73cidakg-a.oregon-postgres.render.com/euajudo"
from app.database import Base
from app.models import User, DeliveryLocation, Category, CategoryAttribute
from app.auth import get_password_hash
from app.shared.enums import UserRole
from sqlalchemy.orm import Session
import random
from seed_data import (
    ADMIN_CREDENTIALS, VOLUNTEERS, SHELTERS, PROVIDERS, 
    CATEGORIES, print_credentials
)

def clear_database(engine):
    """Limpa todas as tabelas na ordem correta"""
    print("🧹 Limpando banco de dados...")
    
    tables_to_drop = [
        'order_events', 'orders',
        'reservation_items', 'resource_reservations', 
        'resource_items', 'resource_requests',
        'deliveries', 'product_batches',
        'category_attributes', 'categories',
        'delivery_locations', 'users'
    ]
    
    with engine.connect() as conn:
        for table in tables_to_drop:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                print(f"  ✅ Limpo: {table}")
            except Exception as e:
                print(f"  ⚠️ Pulando {table}: {e}")
        conn.commit()

def create_admin(db: Session):
    """Cria admin"""
    print("👑 Criando admin...")
    
    admin = User(
        email=ADMIN_CREDENTIALS["email"],
        hashed_password=get_password_hash(ADMIN_CREDENTIALS["password"]),
        name=ADMIN_CREDENTIALS["name"],
        phone=ADMIN_CREDENTIALS["phone"],
        roles=UserRole.ADMIN.value,
        city_id=1,
        address="Endereço Admin",
        approved=True
    )
    db.add(admin)
    db.commit()
    print(f"✅ Admin criado: {ADMIN_CREDENTIALS['email']} / senha: {ADMIN_CREDENTIALS['password']}")

def create_volunteers(db: Session):
    """Cria voluntários"""
    print(f"🤝 Criando {len(VOLUNTEERS)} voluntários...")
    
    for vol in VOLUNTEERS:
        user = User(
            email=vol["email"],
            hashed_password=get_password_hash(vol["password"]),
            name=vol["name"],
            phone=vol["phone"],
            roles=UserRole.VOLUNTEER.value,
            city_id=1,
            address="Endereço Voluntário",
            approved=True
        )
        db.add(user)
        print(f"✅ Voluntário criado: {vol['email']} / senha: {vol['password']}")
    
    db.commit()

def create_shelters(db: Session):
    """Cria abrigos"""
    print(f"🏠 Criando {len(SHELTERS)} abrigos...")
    
    for shelter in SHELTERS:
        # Criar usuário
        user = User(
            email=shelter["email"],
            hashed_password=get_password_hash(shelter["password"]),
            name=shelter["name"],
            phone=shelter["phone"],
            roles=UserRole.SHELTER.value,
            city_id=1,
            address=shelter["address"],
            approved=True
        )
        db.add(user)
        db.flush()  # Para pegar o ID
        
        # Criar local associado
        location = DeliveryLocation(
            name=shelter["name"],
            address=shelter["address"],
            latitude=shelter["latitude"],
            longitude=shelter["longitude"],
            phone=shelter["phone"],
            contact_person=shelter["contact_person"],
            user_id=user.id,
            active=True,
            approved=True
        )
        db.add(location)
        
        print(f"✅ Abrigo criado: {shelter['email']} / senha: {shelter['password']}")
    
    db.commit()

def create_categories(db: Session):
    """Cria categorias essenciais"""
    print(f"📦 Criando {len(CATEGORIES)} categorias essenciais para desastres...")
    
    categories_data = CATEGORIES
    
    categories = []
    for cat_data in categories_data:
        # Criar categoria
        category = Category(
            name=cat_data["name"],
            display_name=cat_data["name"],  # Usar name como display_name
            description=cat_data["description"],
            icon=cat_data["icon"],
            color=cat_data["color"],
            sort_order=len(categories) + 1,
            active=True
        )
        db.add(category)
        db.flush()  # Para pegar o ID
        
        # Criar atributos
        for i, attr_data in enumerate(cat_data["attributes"]):
            attribute = CategoryAttribute(
                category_id=category.id,
                name=attr_data["name"],
                display_name=attr_data["name"],
                attribute_type=attr_data["type"],
                required=attr_data["required"],
                sort_order=i + 1,
                min_value=attr_data.get("min_value"),
                max_value=attr_data.get("max_value"),
                max_length=attr_data.get("max_length"),
                options=attr_data.get("options", [])
            )
            db.add(attribute)
        
        categories.append(category)
        print(f"  ✅ Categoria criada: {cat_data['name']} {cat_data['icon']}")
        print(f"     - {len(cat_data['attributes'])} atributos configurados")
    
    db.commit()
    return categories

def main():
    """Função principal do seed"""
    print("🌱 Iniciando seed para produção PostgreSQL...")
    print("="*70)
    
    try:
        # Criar engine com PostgreSQL
        engine = create_engine(
            "postgresql://euajudo_user:niHQGFxb2EClbnS6Rvq86GDFS6fuexNM@dpg-d6h6fj0gjchc73cidakg-a.oregon-postgres.render.com/euajudo"
        )
        
        # Criar tabelas
        print("🔨 Verificando/criando tabelas...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas verificadas!")
        
        # Criar sessão
        db = Session(bind=engine)
        
        try:
            # Criar dados
            create_admin(db)
            create_volunteers(db)
            create_shelters(db)
            categories = create_categories(db)
            
            print("\n" + "="*70)
            print("✅ Seed de produção concluído com sucesso!")
            print("="*70)
            
            print("\n📊 Resumo:")
            print(f"   👤 Usuários: {db.query(User).count()}")
            print(f"   🏠 Locais: {db.query(DeliveryLocation).count()}")
            print(f"   📦 Categorias: {db.query(Category).count()}")
            
            print("\n🔐 Credenciais de acesso:")
            print("   Admin: admin@vouajudar.org / admin123")
            print("   Voluntários: joao@vouajudar.org / joao123")
            print("                maria@vouajudar.org / maria123")
            print("   Abrigos: abrigo.centro@vouajudar.org / centro123")
            print("            abrigo.saosebastiao@vouajudar.org / saosebastiao123")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Erro durante o seed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    main()
