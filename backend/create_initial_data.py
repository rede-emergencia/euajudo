#!/usr/bin/env python3
"""
Script para criar dados iniciais de estoque para o abrigo
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine, Base
from app.models import User, Category, DeliveryLocation, ShelterInventoryItem

def create_initial_data():
    """Criar dados iniciais de estoque para o abrigo"""
    
    # Criar sessão
    db = Session(engine)
    
    try:
        # Buscar usuário abrigo
        shelter_user = db.query(User).filter(User.email == 'abrigo.centro@vouajudar.org').first()
        if not shelter_user:
            print("❌ Usuário abrigo não encontrado!")
            return
        
        print(f"✅ Usuário abrigo encontrado: {shelter_user.name}")
        
        # Buscar location do abrigo
        shelter_location = db.query(DeliveryLocation).filter(DeliveryLocation.user_id == shelter_user.id).first()
        if not shelter_location:
            print("❌ Location do abrigo não encontrado!")
            return
        
        print(f"✅ Location do abrigo encontrado: {shelter_location.name}")
        
        # Buscar categorias
        categories = db.query(Category).all()
        if not categories:
            print("❌ Nenhuma categoria encontrada!")
            return
        
        print(f"✅ {len(categories)} categorias encontradas")
        
        # Criar itens iniciais de estoque
        initial_items = [
            {
                'category_name': 'Água',
                'needed_quantity': 100.0,
                'current_stock': 30.0,
                'priority': 'high',
                'min_stock_alert': 20.0
            },
            {
                'category_name': 'Alimentos',
                'needed_quantity': 50.0,
                'current_stock': 25.0,
                'priority': 'high',
                'min_stock_alert': 10.0
            },
            {
                'category_name': 'Roupas',
                'needed_quantity': 200.0,
                'current_stock': 50.0,
                'priority': 'medium',
                'min_stock_alert': 30.0
            },
            {
                'category_name': 'Medicamentos',
                'needed_quantity': 100.0,
                'current_stock': 80.0,
                'priority': 'urgent',
                'min_stock_alert': 20.0
            },
            {
                'category_name': 'Produtos de Higiene',
                'needed_quantity': 150.0,
                'current_stock': 40.0,
                'priority': 'medium',
                'min_stock_alert': 25.0
            }
        ]
        
        created_items = []
        
        for item_data in initial_items:
            # Encontrar categoria
            category = db.query(Category).filter(
                Category.display_name == item_data['category_name']
            ).first()
            
            if not category:
                print(f"⚠️ Categoria '{item_data['category_name']}' não encontrada")
                continue
            
            # Verificar se item já existe
            existing_item = db.query(ShelterInventoryItem).filter(
                ShelterInventoryItem.shelter_id == shelter_user.id,
                ShelterInventoryItem.category_id == category.id
            ).first()
            
            if existing_item:
                print(f"⚠️ Item '{category.display_name}' já existe, atualizando...")
                existing_item.needed_quantity = item_data['needed_quantity']
                existing_item.current_stock = item_data['current_stock']
                existing_item.priority = item_data['priority']
                existing_item.min_stock_alert = item_data['min_stock_alert']
                existing_item.active = True
            else:
                # Criar novo item
                new_item = ShelterInventoryItem(
                    shelter_id=shelter_user.id,
                    category_id=category.id,
                    needed_quantity=item_data['needed_quantity'],
                    current_stock=item_data['current_stock'],
                    priority=item_data['priority'],
                    min_stock_alert=item_data['min_stock_alert'],
                    active=True
                )
                
                db.add(new_item)
                created_items.append(new_item)
                print(f"✅ Item '{category.display_name}' criado")
        
        # Commit das alterações
        db.commit()
        
        print(f"\n🎉 Dados iniciais criados com sucesso!")
        print(f"📊 Total de itens de estoque: {len(created_items) + len([i for i in initial_items if 'já existe' in str(i)])}")
        
        # Listar itens criados
        print("\n📋 Itens de Estoque:")
        for item_data in initial_items:
            category = db.query(Category).filter(
                Category.display_name == item_data['category_name']
            ).first()
            if category:
                item = db.query(ShelterInventoryItem).filter(
                    ShelterInventoryItem.shelter_id == shelter_user.id,
                    ShelterInventoryItem.category_id == category.id
                ).first()
                if item:
                    fulfillment = (item.current_stock / item.needed_quantity * 100) if item.needed_quantity > 0 else 0
                    status = "🟢" if fulfillment >= 80 else "🟡" if fulfillment >= 40 else "🔴"
                    print(f"   {status} {category.display_name}: {item.current_stock}/{item.needed_quantity} ({fulfillment:.1f}%)")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados iniciais: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Criando dados iniciais de estoque para o abrigo...")
    create_initial_data()
    print("\n✅ Script concluído!")
