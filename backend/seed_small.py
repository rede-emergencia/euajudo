#!/usr/bin/env python3
"""
Seed simplificado para cenário pós-catástrofe com categorias essenciais
"""

import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.database import get_db, engine
from app.models import (
    User, DeliveryLocation, ProductBatch, Delivery, 
    Category, CategoryAttribute, ResourceRequest, ResourceItem, ResourceReservation, ReservationItem, Order,
    ProductType, DeliveryStatus
)
from app.auth import get_password_hash
from app.enums import UserRole

def clear_database(db: Session):
    """Limpa todas as tabelas na ordem correta"""
    print("🧹 Limpando banco de dados...")
    
    # Ordem correta para evitar erros de chave estrangeira
    tables_to_clear = [
        Order,
        ReservationItem,
        ResourceReservation,
        ResourceItem,
        ResourceRequest,
        Delivery,
        ProductBatch,
        CategoryAttribute,
        Category,
        DeliveryLocation,
        User
    ]
    
    for table in tables_to_clear:
        db.query(table).delete()
    
    db.commit()
    print("✅ Banco limpo!")

def create_admin(db: Session):
    """Cria usuário admin principal"""
    print("\n👑 Criando admin...")
    
    admin = User(
        name="Admin Sistema",
        email="admin@vouajudar.org",
        hashed_password=get_password_hash("admin123"),
        roles="admin",
        phone="21999999999",
        active=True,
        approved=True
    )
    db.add(admin)
    db.commit()
    
    print(f"✅ Admin criado: {admin.email} / senha: admin123")
    return admin

def create_volunteers(db: Session, count: int = 2):
    """Cria voluntários essenciais"""
    print(f"\n🤝 Criando {count} voluntários...")
    
    volunteers_data = [
        {
            "name": "João Silva",
            "email": "joao@vouajudar.org",
            "password": "joao123",
            "phone": "21988887777",
            "vehicle": "Moto"
        },
        {
            "name": "Maria Santos",
            "email": "maria@vouajudar.org", 
            "password": "maria123",
            "phone": "21988886666",
            "vehicle": "Carro"
        }
    ]
    
    created_volunteers = []
    
    for vol_data in volunteers_data[:count]:
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
        db.commit()
        created_volunteers.append(volunteer)
        print(f"✅ Voluntário criado: {volunteer.email} / senha: {volunteer.email.split('@')[0]}123")
    
    return created_volunteers

def create_shelters(db: Session):
    """Cria 2 abrigos essenciais para cenário pós-catástrofe"""
    print("\n🏠 Criando abrigos...")
    
    shelters_data = [
        {
            "name": "Abrigo Centro de Operações",
            "email": "abrigo.centro@vouajudar.org",
            "password": "123456",
            "phone": "2133335555",
            "address": "Praça da República, 100 - Centro, Juiz de Fora - MG",
            "latitude": -21.7642,
            "longitude": -43.3505,
            "contact_person": "Carlos Mendes",
            "operating_hours": "24 horas",
            "capacity": 200,
            "daily_need": 150
        },
        {
            "name": "Abrigo São Sebastião",
            "email": "abrigo.saosebastiao@vouajudar.org",
            "password": "saosebastiao123",
            "phone": "2133336666",
            "address": "Rua São Sebastião, 200 - São Sebastião, Juiz de Fora - MG",
            "latitude": -21.7842,
            "longitude": -43.3705,
            "contact_person": "Ana Paula Costa",
            "operating_hours": "24 horas",
            "capacity": 150,
            "daily_need": 100
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
            operating_hours=shelter_data["operating_hours"],
            capacity=shelter_data["capacity"],
            daily_need=shelter_data["daily_need"],
            active=True,
            approved=True,
            user_id=shelter_user.id
        )
        db.add(location)
        
        created_shelters.append(shelter_user)
        created_locations.append(location)
    
    db.commit()
    
    for shelter, location in zip(created_shelters, created_locations):
        db.refresh(shelter)
        db.refresh(location)
        print(f"✅ Abrigo criado: {shelter.email} / senha: {shelter.email.split('@')[0]}123")
    
    return created_shelters, created_locations

def create_categories(db: Session):
    """Cria categorias essenciais para desastres com metadados simplificados"""
    print("\n📦 Criando categorias essenciais para desastres...")
    
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
            "description": "Alimentos básicos",
            "icon": "🥫",
            "color": "#FF9800",
            "sort_order": 2,
            "attributes": [
                {
                    "name": "tipo",
                    "display_name": "Tipo",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 1,
                    "options": [
                        {"value": "arroz", "label": "Arroz"},
                        {"value": "feijao", "label": "Feijão"},
                        {"value": "macarrao", "label": "Macarrão"},
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
                        {"value": "kg", "label": "Quilogramas"},
                        {"value": "unidades", "label": "Unidades"}
                    ]
                }
            ]
        },
        {
            "name": "higiene",
            "display_name": "Higiene",
            "description": "Itens de higiene",
            "icon": "🧼",
            "color": "#4CAF50",
            "sort_order": 3,
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
            "sort_order": 4,
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
            "sort_order": 5,
            "attributes": [
                {
                    "name": "tipo",
                    "display_name": "Tipo",
                    "attribute_type": "select",
                    "required": True,
                    "sort_order": 1,
                    "options": [
                        {"value": "analgesico", "label": "Analgésico"},
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
                        {"value": "unidades", "label": "Unidades"},
                        {"value": "ml", "label": "Mililitros"}
                    ]
                }
            ]
        },
        {
            "name": "refeicoes",
            "display_name": "Refeições",
            "description": "Refeições prontas",
            "icon": "🍱",
            "color": "#795548",
            "sort_order": 6,
            "attributes": []
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
        db.flush()
        
        # Criar atributos
        for attr_data in attributes:
            attribute = CategoryAttribute(
                category_id=category.id,
                **attr_data
            )
            db.add(attribute)
        
        categories.append(category)
        print(f"  ✅ Categoria criada: {category.display_name} {category.icon}")
        print(f"     - {len(attributes)} atributos configurados")
    
    return categories

def create_sample_deliveries(db: Session, shelters: list, locations: list, categories: list):
    """Cria deliveries de exemplo para os abrigos com quantidades realistas"""
    print("\n📋 Criando deliveries de exemplo com quantidades realistas...")
    
    deliveries = []
    
    # Para cada abrigo, criar alguns deliveries
    for shelter, location in zip(shelters, locations):
        # Água: 10 litros (galão)
        agua_delivery = Delivery(
            location_id=location.id,
            category_id=categories[0].id,  # água
            product_type=ProductType.MEAL,  # Para compatibilidade
            quantity=10,  # 10 litros
            metadata_cache={},
            status=DeliveryStatus.AVAILABLE
        )
        db.add(agua_delivery)
        deliveries.append(agua_delivery)
        
        # Alimentos: 10 quilos (arroz, feijão, etc.)
        alimentos_delivery = Delivery(
            location_id=location.id,
            category_id=categories[1].id,  # alimentos
            product_type=ProductType.MEAL,  # Para compatibilidade
            quantity=10,  # 10 quilos
            metadata_cache={"tipo": "arroz"},
            status=DeliveryStatus.AVAILABLE
        )
        db.add(alimentos_delivery)
        deliveries.append(alimentos_delivery)
        
        # Higiene: 10 unidades (sabonete, pasta, etc.)
        higiene_delivery = Delivery(
            location_id=location.id,
            category_id=categories[2].id,  # higiene
            product_type=ProductType.MEAL,  # Para compatibilidade
            quantity=10,  # 10 unidades
            metadata_cache={"tipo": "sabonete"},
            status=DeliveryStatus.AVAILABLE
        )
        db.add(higiene_delivery)
        deliveries.append(higiene_delivery)
        
        # Roupas: 10 peças (camisetas, calças, etc.)
        roupas_delivery = Delivery(
            location_id=location.id,
            category_id=categories[3].id,  # roupas
            product_type=ProductType.CLOTHING,  # Para compatibilidade
            quantity=10,  # 10 peças
            metadata_cache={"tipo": "camiseta", "tamanho": "M", "genero": "U"},
            status=DeliveryStatus.AVAILABLE
        )
        db.add(roupas_delivery)
        deliveries.append(roupas_delivery)
        
        # Medicamentos: 10 unidades (caixas, frascos, etc.)
        remedios_delivery = Delivery(
            location_id=location.id,
            category_id=categories[4].id,  # medicamentos
            product_type=ProductType.MEDICINE,  # Para compatibilidade
            quantity=10,  # 10 unidades
            metadata_cache={"tipo": "analgesico"},
            status=DeliveryStatus.AVAILABLE
        )
        db.add(remedios_delivery)
        deliveries.append(remedios_delivery)
        
        # Refeições: 10 porções (marmitas, pratos, etc.)
        refeicoes_delivery = Delivery(
            location_id=location.id,
            category_id=categories[5].id,  # refeições
            product_type=ProductType.MEAL,  # Para compatibilidade
            quantity=10,  # 10 porções
            metadata_cache={"tipo": "almoco"},
            status=DeliveryStatus.AVAILABLE
        )
        db.add(refeicoes_delivery)
        deliveries.append(refeicoes_delivery)
        
        print(f"  ✅ Criados 6 deliveries para {shelter.name} (quantidades realistas)")
    
    db.commit()
    return deliveries

def main():
    """Função principal do seed"""
    print("🌱 Iniciando seed simplificado para cenário pós-catástrofe...")
    print("=" * 60)
    
    db = next(get_db())
    
    try:
        # Limpar banco
        clear_database(db)
        
        # Criar dados base
        admin = create_admin(db)
        volunteers = create_volunteers(db, 2)
        shelters, locations = create_shelters(db)
        categories = create_categories(db)
        
        # Criar deliveries de exemplo
        deliveries = create_sample_deliveries(db, shelters, locations, categories)
        
        print("\n" + "=" * 60)
        print("✅ Seed simplificado concluído com sucesso!")
        print("\n📊 Resumo:")
        print(f"   👤 Usuários: {1 + len(volunteers) + len(shelters)} (1 admin, {len(volunteers)} voluntários, {len(shelters)} abrigos)")
        print(f"   🏠 Locais: {len(locations)} abrigos")
        print(f"   📦 Categorias: {len(categories)} essenciais")
        print(f"   📋 Deliveries: {len(deliveries)} de exemplo")
        
        print("\n🔐 Credenciais de acesso:")
        print("   Admin: admin@vouajudar.org / admin123")
        print("   Voluntários: joao@vouajudar.org / joao123")
        print("                maria@vouajudar.org / maria123")
        print("   Abrigos: abrigo.centro@vouajudar.org / centro123")
        print("            abrigo.saosebastiao@vouajudar.org / saosebastiao123")
        
        print("\n📋 Simplificação das categorias:")
        print("   💧 Água: apenas quantidade")
        print("   🥫 Alimentos: quantidade + tipo")
        print("   🧼 Higiene: quantidade + tipo")
        print("   👕 Roupas: quantidade + tipo + tamanho + gênero")
        print("   💊 Medicamentos: quantidade + tipo")
        print("   🍱 Refeições: quantidade + tipo")
        
    except Exception as e:
        print(f"❌ Erro durante o seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
