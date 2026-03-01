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
os.environ["ENVIRONMENT"] = "production"

sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.database import Base
from app.models import (
    User, DeliveryLocation, ProductBatch, Delivery, 
    Category, CategoryAttribute, ResourceRequest, ResourceItem, 
    ResourceReservation, ReservationItem, Order, ProductType, DeliveryStatus
)
from app.auth import get_password_hash
from app.enums import UserRole

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

def create_admin_user(db: Session):
    """Cria usuário admin"""
    print("👑 Criando admin...")
    admin = User(
        email="admin@vouajudar.org",
        hashed_password=get_password_hash("admin123"),
        name="Administrador",
        phone="11999999999",
        roles=[UserRole.ADMIN.value],
        city_id=1,
        address="Endereço Admin",
        approved=True
    )
    db.add(admin)
    db.commit()
    print("✅ Admin criado: admin@vouajudar.org / senha: admin123")

def create_volunteers(db: Session):
    """Cria voluntários"""
    print("🤝 Criando 2 voluntários...")
    
    volunteers = [
        {
            "email": "joao@vouajudar.org",
            "password": "joao123",
            "name": "João Voluntário",
            "phone": "11888888888"
        },
        {
            "email": "maria@vouajudar.org", 
            "password": "maria123",
            "name": "Maria Voluntária",
            "phone": "11777777777"
        }
    ]
    
    for vol in volunteers:
        user = User(
            email=vol["email"],
            hashed_password=get_password_hash(vol["password"]),
            name=vol["name"],
            phone=vol["phone"],
            roles=[UserRole.VOLUNTEER.value],
            city_id=1,
            address="Endereço Voluntário",
            approved=True
        )
        db.add(user)
        print(f"✅ Voluntário criado: {vol['email']} / senha: {vol['password']}")
    
    db.commit()

def create_shelters(db: Session):
    """Cria abrigos"""
    print("🏠 Criando abrigos...")
    
    shelters = [
        {
            "email": "abrigo.centro@vouajudar.org",
            "password": "123",
            "name": "Abrigo Centro de Operações",
            "phone": "11666666666",
            "address": "Praça Central, 100 - Centro"
        },
        {
            "email": "abrigo.saosebastiao@vouajudar.org",
            "password": "123", 
            "name": "Abrigo São Sebastião",
            "phone": "11555555555",
            "address": "Rua São Sebastião, 200"
        }
    ]
    
    for shelter in shelters:
        # Criar usuário
        user = User(
            email=shelter["email"],
            hashed_password=get_password_hash(shelter["password"]),
            name=shelter["name"],
            phone=shelter["phone"],
            roles=[UserRole.SHELTER.value],
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
            latitude=-23.5505,
            longitude=-46.6333,
            phone=shelter["phone"],
            user_id=user.id,
            active=True
        )
        db.add(location)
        
        print(f"✅ Abrigo criado: {shelter['email']} / senha: {shelter['password']}")
    
    db.commit()

def create_categories(db: Session):
    """Cria categorias essenciais"""
    print("📦 Criando categorias essenciais para desastres...")
    
    categories_data = [
        {
            "name": "agua",
            "display_name": "Água",
            "description": "Água para consumo",
            "icon": "💧",
            "color": "#2196F3",
            "sort_order": 1,
            "attributes": [
                {
                    "name": "measurement_unit",
                    "display_name": "Unidade",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 1,
                    "options": [
                        {"value": "litros", "label": "Litros"},
                        {"value": "ml", "label": "Mililitros"}
                    ]
                }
            ]
        },
        {
            "name": "alimentos",
            "display_name": "Alimentos",
            "description": "Ingredientes básicos para preparo",
            "icon": "🥫",
            "color": "#FF9800",
            "sort_order": 2,
            "attributes": [
                {
                    "name": "tipo_alimento",
                    "display_name": "Tipo de Alimento *",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 1,
                    "options": [
                        {"value": "arroz", "label": "Arroz"},
                        {"value": "feijao", "label": "Feijão"},
                        {"value": "macarrao", "label": "Macarrão/Massa"},
                        {"value": "oleo", "label": "Óleo/Azeite"},
                        {"value": "sal", "label": "Sal/Açúcar"},
                        {"value": "farinha", "label": "Farinha"},
                        {"value": "conservas", "label": "Conservas/Enlatados"},
                        {"value": "graos", "label": "Grãos/Cereais"},
                        {"value": "outro", "label": "Outro"}
                    ]
                },
                {
                    "name": "descricao",
                    "display_name": "Descrição (opcional)",
                    "attribute_type": "text",
                    "required": False,
                    "sort_order": 2
                },
                {
                    "name": "measurement_unit",
                    "display_name": "Unidade *",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 3,
                    "options": [
                        {"value": "kg", "label": "Quilogramas"},
                        {"value": "unidades", "label": "Unidades"},
                        {"value": "litros", "label": "Litros"},
                        {"value": "pacotes", "label": "Pacotes"},
                        {"value": "sacos", "label": "Sacos"}
                    ]
                }
            ]
        },
        {
            "name": "refeicoes_prontas",
            "display_name": "Refeições Prontas",
            "description": "Marmitas e refeições prontas para consumo",
            "icon": "🍱",
            "color": "#795548",
            "sort_order": 3,
            "attributes": [
                {
                    "name": "tipo_refeicao",
                    "display_name": "Tipo de Refeição *",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 1,
                    "options": [
                        {"value": "marmita", "label": "Marmita"},
                        {"value": "sopa", "label": "Sopa"},
                        {"value": "prato_feito", "label": "Prato Feito"},
                        {"value": "vegano", "label": "Opção Vegana"},
                        {"value": "outro", "label": "Outro"}
                    ]
                },
                {
                    "name": "descricao",
                    "display_name": "Descrição/Composição *",
                    "attribute_type": "text",
                    "required": True,
                    "sort_order": 2
                }
            ]
        },
        {
            "name": "higiene",
            "display_name": "Higiene",
            "description": "Itens de higiene",
            "icon": "🧼",
            "color": "#4CAF50",
            "sort_order": 4,
            "attributes": [
                {
                    "name": "tipo",
                    "display_name": "Tipo",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 1,
                    "options": [
                        {"value": "sabonete", "label": "Sabonete"},
                        {"value": "papel", "label": "Papel Higiênico"},
                        {"value": "outro", "label": "Outro"}
                    ]
                },
                {
                    "name": "measurement_unit",
                    "display_name": "Unidade",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 2,
                    "options": [
                        {"value": "unidades", "label": "Unidades"}
                    ]
                }
            ]
        },
        {
            "name": "roupas",
            "display_name": "Roupas",
            "description": "Roupas para doação",
            "icon": "👕",
            "color": "#9C27B0",
            "sort_order": 5,
            "attributes": [
                {
                    "name": "tipo",
                    "display_name": "Tipo",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 1,
                    "options": [
                        {"value": "camiseta", "label": "Camiseta"},
                        {"value": "calca", "label": "Calça"},
                        {"value": "outro", "label": "Outro"}
                    ]
                },
                {
                    "name": "tamanho",
                    "display_name": "Tamanho",
                    "attribute_type": "select",
                    "required": False,
                    "sort_order": 2,
                    "options": [
                        {"value": "P", "label": "P"},
                        {"value": "M", "label": "M"},
                        {"value": "G", "label": "G"}
                    ]
                }
            ]
        },
        {
            "name": "medicamentos",
            "display_name": "Medicamentos",
            "description": "Medicamentos essenciais",
            "icon": "💊",
            "color": "#F44336",
            "sort_order": 6,
            "attributes": [
                {
                    "name": "tipo_medicamento",
                    "display_name": "Tipo de Medicamento",
                    "attribute_type": "select",
                    "required": False,
                    "sort_order": 1,
                    "options": [
                        {"value": "analgesico", "label": "Analgésico"},
                        {"value": "antibiotico", "label": "Antibiótico"},
                        {"value": "antiinflamatorio", "label": "Anti-inflamatório"},
                        {"value": "antifebril", "label": "Antitérmico"},
                        {"value": "vitamina", "label": "Vitamina/Suplemento"},
                        {"value": "curativo", "label": "Curativo/Material"},
                        {"value": "outro", "label": "Outro"}
                    ]
                },
                {
                    "name": "nome_medicamento",
                    "display_name": "Nome do Medicamento *",
                    "attribute_type": "text",
                    "required": True,
                    "sort_order": 2
                },
                {
                    "name": "measurement_unit",
                    "display_name": "Unidade",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 3,
                    "options": [
                        {"value": "comprimidos", "label": "Comprimidos"},
                        {"value": "capsulas", "label": "Cápsulas"},
                        {"value": "ml", "label": "Mililitros (líquido)"},
                        {"value": "unidades", "label": "Unidades"},
                        {"value": "caixas", "label": "Caixas"},
                        {"value": "frascos", "label": "Frascos"}
                    ]
                }
            ]
        }
    ]
    
    categories = []
    
    for cat_data in categories_data:
        attributes = cat_data.pop("attributes", [])
        
        category = Category(
            active=True,
            **cat_data
        )
        db.add(category)
        db.flush()  # Para pegar o ID
        
        # Adicionar atributos
        for attr_data in attributes:
            attribute = CategoryAttribute(
                active=True,
                **attr_data
            )
            attribute.category_id = category.id
            db.add(attribute)
        
        categories.append(category)
        print(f"  ✅ Categoria criada: {category.display_name} {category.icon}")
        print(f"     - {len(attributes)} atributos configurados")
    
    # Commit para garantir que as categorias sejam salvas
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
            create_admin_user(db)
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
