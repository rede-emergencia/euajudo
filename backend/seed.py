#!/usr/bin/env python3
"""
Seed melhorado EuAjudo - Juiz de Fora
- 5+ abrigos espalhados pela cidade
- 3+ abrigos pedindo múltiplos tipos de itens
- 5 restaurantes espalhados pela cidade
  - 2 pedindo insumos
  - 2 oferecendo marmitas
  - 1 desligado
- Coordenadas espaçadas em pelo menos 200m
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
    
    # RESTAURANTES (5 restaurantes espalhados)
    restaurants_data = [
        # 1. Restaurante oferecendo marmitas
        {
            'email': 'restaurante.bom.sabor@euajudo.com',
            'name': 'Restaurante Bom Sabor',
            'phone': '32988887777',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua Halfeld, 123 - Centro, Juiz de Fora',
            'establishment_type': 'Restaurante',
            'production_capacity': 150,
            'latitude': -21.764200,
            'longitude': -43.350200,
            'approved': True,
            'active': True
        },
        # 2. Restaurante oferecendo marmitas
        {
            'email': 'restaurante.sabores.casa@euajudo.com',
            'name': 'Sabores da Casa',
            'phone': '32977776666',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Avenida Rio Branco, 456 - Centro, Juiz de Fora',
            'establishment_type': 'Restaurante',
            'production_capacity': 120,
            'latitude': -21.762000,  # 200m distante
            'longitude': -43.348000,
            'approved': True,
            'active': True
        },
        # 3. Restaurante pedindo insumos
        {
            'email': 'restaurante.maria.sopa@euajudo.com',
            'name': 'Restaurante Maria Sopa',
            'phone': '32966665555',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua São Mateus, 789 - São Mateus, Juiz de Fora',
            'establishment_type': 'Restaurante',
            'production_capacity': 80,
            'latitude': -21.760000,  # 200m distante
            'longitude': -43.346000,
            'approved': True,
            'active': True
        },
        # 4. Restaurante pedindo insumos
        {
            'email': 'restaurante.prato.feito@euajudo.com',
            'name': 'Restaurante Prato Feito',
            'phone': '32955554444',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua Espírito Santo, 321 - Centro, Juiz de Fora',
            'establishment_type': 'Restaurante',
            'production_capacity': 100,
            'latitude': -21.758000,  # 200m distante
            'longitude': -43.344000,
            'approved': True,
            'active': True
        },
        # 5. Restaurante desligado
        {
            'email': 'restaurante.porta.fechada@euajudo.com',
            'name': 'Restaurante Porta Fechada',
            'phone': '32944453333',
            'roles': 'provider',
            'hashed_password': password_hash,
            'address': 'Rua Marechal Deodoro, 654 - Centro, Juiz de Fora',
            'establishment_type': 'Restaurante',
            'production_capacity': 90,
            'latitude': -21.756000,  # 200m distante
            'longitude': -43.342000,
            'approved': True,
            'active': False  # Desligado
        }
    ]
    
    # ABRIGOS (5+ abrigos espalhados)
    shelters_data = [
        # 1. Abrigo pedindo múltiplos itens (medicamentos + roupas)
        {
            'email': 'abrigo.sao.francisco@euajudo.com',
            'name': 'Abrigo São Francisco de Assis',
            'phone': '3236881234',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua Principal, 500 - Cascatinha, Juiz de Fora',
            'latitude': -21.754000,  # 200m distante
            'longitude': -43.340000,
            'approved': True,
            'active': True
        },
        # 2. Abrigo pedindo múltiplos itens (comidas + higiene)
        {
            'email': 'abrigo.carmo@euajudo.com',
            'name': 'Abrigo Nossa Senhora do Carmo',
            'phone': '3236885678',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua das Flores, 200 - Granbery, Juiz de Fora',
            'latitude': -21.752000,  # 200m distante
            'longitude': -43.338000,
            'approved': True,
            'active': True
        },
        # 3. Abrigo pedindo múltiplos itens (comidas + medicamentos + roupas)
        {
            'email': 'abrigo.bom.pastor@euajudo.com',
            'name': 'Abrigo Bom Pastor',
            'phone': '3236889012',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Avenida Brasil, 800 - São Pedro, Juiz de Fora',
            'latitude': -21.750000,  # 200m distante
            'longitude': -43.336000,
            'approved': True,
            'active': True
        },
        # 4. Abrigo pedindo item único (medicamentos)
        {
            'email': 'abrigo.esperanca@euajudo.com',
            'name': 'Casa da Esperança',
            'phone': '3236883456',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua da Bahia, 150 - Centro, Juiz de Fora',
            'latitude': -21.748000,  # 200m distante
            'longitude': -43.334000,
            'approved': True,
            'active': True
        },
        # 5. Abrigo pedindo item único (roupas)
        {
            'email': 'abrigo.caridade@euajudo.com',
            'name': 'Centro de Caridade Irmã Clara',
            'phone': '3236887890',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua Professor Dantas, 300 - Lourdes, Juiz de Fora',
            'latitude': -21.746000,  # 200m distante
            'longitude': -43.332000,
            'approved': True,
            'active': True
        },
        # 6. Abrigo extra (pedindo múltiplos itens)
        {
            'email': 'abrigo.luz@euajudo.com',
            'name': 'Casa da Luz',
            'phone': '3236882345',
            'roles': 'shelter',
            'hashed_password': password_hash,
            'address': 'Rua Dom Silvério, 450 - Borba Gato, Juiz de Fora',
            'latitude': -21.744000,  # 200m distante
            'longitude': -43.330000,
            'approved': True,
            'active': True
        }
    ]
    
    # VOLUNTÁRIOS
    volunteers_data = [
        {
            'email': 'joao.voluntario@euajudo.com',
            'name': 'João Voluntário',
            'phone': '32999998888',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Rua Matias Barbosa, 100 - Centro, Juiz de Fora',
            'latitude': -21.742000,  # 200m distante
            'longitude': -43.328000,
            'approved': True,
            'active': True
        },
        {
            'email': 'maria.voluntaria@euajudo.com',
            'name': 'Maria Voluntária',
            'phone': '32988887766',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Rua Machado Costa, 50 - Centro, Juiz de Fora',
            'latitude': -21.740000,  # 200m distante
            'longitude': -43.326000,
            'approved': True,
            'active': True
        },
        {
            'email': 'pedro.entregador@euajudo.com',
            'name': 'Pedro Entregador',
            'phone': '32977776655',
            'roles': 'volunteer',
            'hashed_password': password_hash,
            'address': 'Rua Santos Dumont, 200 - Centro, Juiz de Fora',
            'latitude': -21.738000,  # 200m distante
            'longitude': -43.324000,
            'approved': True,
            'active': True
        }
    ]
    
    # ADMIN
    admin_data = {
        'email': 'admin@euajudo.com',
        'name': 'Administrador EuAjudo',
        'phone': '32999999999',
        'roles': 'admin',
        'hashed_password': password_hash,
        'address': 'Rua da União, 100 - Centro, Juiz de Fora',
        'latitude': -21.736000,  # 200m distante
        'longitude': -43.322000,
        'approved': True,
        'active': True
    }
    
    # Combinar todos os usuários
    all_users_data = restaurants_data + shelters_data + volunteers_data + [admin_data]
    
    created_users = []
    for user_data in all_users_data:
        user = User(**user_data)
        db.add(user)
        created_users.append(user)
    
    db.commit()
    print(f"👥 {len(created_users)} usuários criados:")
    print(f"   • {len(restaurants_data)} restaurantes")
    print(f"   • {len(shelters_data)} abrigos")
    print(f"   • {len(volunteers_data)} voluntários")
    print(f"   • 1 administrador")
    
    return created_users

def create_locations(db, users):
    """Create delivery locations for shelters"""
    locations = []
    shelters = [u for u in users if u.roles == 'shelter']
    
    for shelter in shelters:
        location = DeliveryLocation(
            user_id=shelter.id,
            name=shelter.name,
            address=shelter.address,
            latitude=shelter.latitude,
            longitude=shelter.longitude,
            phone=shelter.phone,
            contact_person=shelter.name,
            active=True,
            approved=True
        )
        db.add(location)
        locations.append(location)
    
    db.commit()
    print(f"🏠 {len(locations)} abrigos criados (espaçados 200m+)")
    return locations

def create_product_batches(db, users):
    """Create product batches for restaurants offering meals"""
    restaurants = [u for u in users if u.roles == 'provider' and u.active and u.establishment_type == 'Restaurante']
    
    # Apenas restaurantes ativos que oferecem marmitas
    offering_restaurants = [r for r in restaurants if r.email in ['restaurante.bom.sabor@euajudo.com', 'restaurante.sabores.casa@euajudo.com']]
    
    batches = []
    for restaurant in offering_restaurants:
        # Criar lote de marmitas
        batch = ProductBatch(
            provider_id=restaurant.id,
            product_type=ProductType.MEAL,
            quantity=50,
            quantity_available=50,
            status=BatchStatus.READY,
            description=f'Marmitas frescas do {restaurant.name}',
            ready_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=2)
        )
        db.add(batch)
        batches.append(batch)
        
        # Criar lote de higiene
        batch_hygiene = ProductBatch(
            provider_id=restaurant.id,
            product_type=ProductType.HYGIENE,
            quantity=30,
            quantity_available=30,
            status=BatchStatus.READY,
            description=f'Kits de higiene do {restaurant.name}',
            ready_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=30)
        )
        db.add(batch_hygiene)
        batches.append(batch_hygiene)
    
    db.commit()
    print(f"📦 {len(batches)} lotes criados:")
    print(f"   • Marmitas prontas para retirada")
    print(f"   • Kits de higiene disponíveis")
    return batches

def create_resource_requests(db, users):
    """Create resource requests for restaurants needing inputs and shelters"""
    requests = []
    
    # Restaurantes pedindo insumos
    requesting_restaurants = [u for u in users if u.roles == 'provider' and u.active and 
                             u.email in ['restaurante.maria.sopa@euajudo.com', 'restaurante.prato.feito@euajudo.com']]
    
    for restaurant in requesting_restaurants:
        # Pedido de insumos para Maria Sopa
        if restaurant.email == 'restaurante.maria.sopa@euajudo.com':
            request = ResourceRequest(
                provider_id=restaurant.id,
                quantity_meals=100,
                status=OrderStatus.REQUESTING,
                expires_at=datetime.now() + timedelta(days=3)
            )
            db.add(request)
            db.flush()  # Flush para obter o ID sem finalizar transação
            requests.append(request)
            
            # Itens específicos
            items = [
                ResourceItem(request_id=request.id, name='arroz', quantity=50, unit='kg'),
                ResourceItem(request_id=request.id, name='feijão', quantity=30, unit='kg'),
                ResourceItem(request_id=request.id, name='óleo', quantity=20, unit='l'),
                ResourceItem(request_id=request.id, name='sal', quantity=10, unit='kg')
            ]
            for item in items:
                db.add(item)
        
        # Pedido de insumos para Prato Feito
        elif restaurant.email == 'restaurante.prato.feito@euajudo.com':
            request = ResourceRequest(
                provider_id=restaurant.id,
                quantity_meals=80,
                status=OrderStatus.REQUESTING,
                expires_at=datetime.now() + timedelta(days=2)
            )
            db.add(request)
            db.flush()  # Flush para obter o ID sem finalizar transação
            requests.append(request)
            
            # Itens específicos
            items = [
                ResourceItem(request_id=request.id, name='farinha', quantity=40, unit='kg'),
                ResourceItem(request_id=request.id, name='açúcar', quantity=25, unit='kg'),
                ResourceItem(request_id=request.id, name='café', quantity=15, unit='kg'),
                ResourceItem(request_id=request.id, name='manteiga', quantity=10, unit='kg')
            ]
            for item in items:
                db.add(item)
    
    # Abrigos pedindo múltiplos itens
    shelters = [u for u in users if u.roles == 'shelter']
    
    # 3+ abrigos pedindo múltiplos itens
    multi_item_shelters = [
        'abrigo.sao.francisco@euajudo.com',  # medicamentos + roupas
        'abrigo.carmo@euajudo.com',          # comidas + higiene
        'abrigo.bom.pastor@euajudo.com',     # comidas + medicamentos + roupas
        'abrigo.luz@euajudo.com'             # múltiplos itens
    ]
    
    for shelter in shelters:
        if shelter.email in multi_item_shelters:
            if shelter.email == 'abrigo.sao.francisco@euajudo.com':
                # Medicamentos + Roupas
                request = ResourceRequest(
                    provider_id=shelter.id,
                    quantity_meals=50,
                    status=OrderStatus.REQUESTING,
                    expires_at=datetime.now() + timedelta(days=1)
                )
                db.add(request)
                db.flush()  # Flush para obter o ID sem finalizar transação
                requests.append(request)
                
                items = [
                    ResourceItem(request_id=request.id, name='medicamentos', quantity=100, unit='unidades'),
                    ResourceItem(request_id=request.id, name='roupas', quantity=200, unit='peças')
                ]
                for item in items:
                    db.add(item)
            
            elif shelter.email == 'abrigo.carmo@euajudo.com':
                # Comidas + Higiene
                request = ResourceRequest(
                    provider_id=shelter.id,
                    quantity_meals=60,
                    status=OrderStatus.REQUESTING,
                    expires_at=datetime.now() + timedelta(days=2)
                )
                db.add(request)
                db.flush()  # Flush para obter o ID sem finalizar transação
                requests.append(request)
                
                items = [
                    ResourceItem(request_id=request.id, name='marmitas', quantity=60, unit='unidades'),
                    ResourceItem(request_id=request.id, name='higiene', quantity=40, unit='kits')
                ]
                for item in items:
                    db.add(item)
            
            elif shelter.email == 'abrigo.bom.pastor@euajudo.com':
                # Comidas + Medicamentos + Roupas
                request = ResourceRequest(
                    provider_id=shelter.id,
                    quantity_meals=80,
                    status=OrderStatus.REQUESTING,
                    expires_at=datetime.now() + timedelta(days=1)
                )
                db.add(request)
                db.flush()  # Flush para obter o ID sem finalizar transação
                requests.append(request)
                
                items = [
                    ResourceItem(request_id=request.id, name='marmitas', quantity=80, unit='unidades'),
                    ResourceItem(request_id=request.id, name='medicamentos', quantity=150, unit='unidades'),
                    ResourceItem(request_id=request.id, name='roupas', quantity=300, unit='peças')
                ]
                for item in items:
                    db.add(item)
            
            elif shelter.email == 'abrigo.luz@euajudo.com':
                # Múltiplos itens variados
                request = ResourceRequest(
                    provider_id=shelter.id,
                    quantity_meals=40,
                    status=OrderStatus.REQUESTING,
                    expires_at=datetime.now() + timedelta(days=3)
                )
                db.add(request)
                db.flush()  # Flush para obter o ID sem finalizar transação
                requests.append(request)
                
                items = [
                    ResourceItem(request_id=request.id, name='fraldas', quantity=100, unit='unidades'),
                    ResourceItem(request_id=request.id, name='leite', quantity=50, unit='litros'),
                    ResourceItem(request_id=request.id, name='higiene', quantity=30, unit='kits')
                ]
                for item in items:
                    db.add(item)
        
        else:
            # Abrigos com item único
            if shelter.email == 'abrigo.esperanca@euajudo.com':
                # Apenas medicamentos
                request = ResourceRequest(
                    provider_id=shelter.id,
                    quantity_meals=30,
                    status=OrderStatus.REQUESTING,
                    expires_at=datetime.now() + timedelta(days=1)
                )
                db.add(request)
                db.flush()  # Flush para obter o ID sem finalizar transação
                requests.append(request)
                
                items = [
                    ResourceItem(request_id=request.id, name='medicamentos', quantity=80, unit='unidades')
                ]
                for item in items:
                    db.add(item)
            
            elif shelter.email == 'abrigo.caridade@euajudo.com':
                # Apenas roupas
                request = ResourceRequest(
                    provider_id=shelter.id,
                    quantity_meals=25,
                    status=OrderStatus.REQUESTING,
                    expires_at=datetime.now() + timedelta(days=2)
                )
                db.add(request)
                db.flush()  # Flush para obter o ID sem finalizar transação
                requests.append(request)
                
                items = [
                    ResourceItem(request_id=request.id, name='roupas', quantity=150, unit='peças')
                ]
                for item in items:
                    db.add(item)
    
    db.commit()
    print(f"📋 {len(requests)} pedidos criados:")
    print(f"   • {len([r for r in requests if r.provider.email in ['restaurante.maria.sopa@euajudo.com', 'restaurante.prato.feito@euajudo.com']])} pedidos de insumos")
    print(f"   • {len([r for r in requests if r.provider.roles == 'shelter'])} pedidos de abrigos")
    print(f"   • {len([r for r in requests if len(r.items) > 1])} abrigos pedindo múltiplos itens")
    
    return requests

def create_deliveries(db, users, batches, requests):
    """Create some sample deliveries"""
    deliveries = []
    volunteers = [u for u in users if u.roles == 'volunteer']
    
    # Criar algumas entregas simuladas
    if volunteers and batches and requests:
        volunteer = volunteers[0]
        
        # Entregar marmitas para um abrigo qualquer
        meal_batch = [b for b in batches if b.product_type == ProductType.MEAL][0]
        shelter_request = [r for r in requests if r.provider.roles == 'shelter'][0]  # Primeiro abrigo
        
        # Obter location_id do abrigo
        locations = db.query(DeliveryLocation).filter(DeliveryLocation.user_id == shelter_request.provider.id).all()
        if locations:
            location = locations[0]
            
            delivery = Delivery(
                volunteer_id=volunteer.id,
                batch_id=meal_batch.id,
                location_id=location.id,
                product_type=ProductType.MEAL,
                quantity=10,
                status=DeliveryStatus.IN_TRANSIT,
                estimated_time=datetime.now() + timedelta(hours=2)
            )
            db.add(delivery)
            deliveries.append(delivery)
    
    db.commit()
    if deliveries:
        print(f"🚚 {len(deliveries)} entregas criadas")
    
    return deliveries

def main():
    """Main seed function"""
    print("🌱 EUAJUDO SEED - Juiz de Fora")
    print("   Cenário completo com restaurantes e abrigos\n")
    
    # Clear database
    clear_database()
    
    # Create data
    db = SessionLocal()
    try:
        users = create_users(db)
        locations = create_locations(db, users)
        batches = create_product_batches(db, users)
        requests = create_resource_requests(db, users)
        deliveries = create_deliveries(db, users, batches, requests)
        
        print("\n" + "="*70)
        print("✅ BANCO DE DADOS POPULADO COM SUCESSO!")
        print("="*70)
        
        print("\n📊 RESUMO DO CENÁRIO:")
        print(f"   👥 Usuários: {len(users)}")
        print(f"      • {len([u for u in users if u.roles == 'provider'])} restaurantes")
        print(f"         - {len([u for u in users if u.roles == 'provider' and u.active])} ativos")
        print(f"         - {len([u for u in users if u.roles == 'provider' and not u.active])} desligados")
        print(f"         - {len([u for u in users if u.roles == 'provider' and 'marmitas' in str(u.email)])} oferecendo marmitas")
        print(f"         - {len([u for u in users if u.roles == 'provider' and 'insumos' in str(u.email)])} pedindo insumos")
        print(f"      • {len([u for u in users if u.roles == 'shelter'])} abrigos")
        print(f"         - {len([r for r in requests if r.provider.roles == 'shelter' and len(r.items) > 1])} pedindo múltiplos itens")
        print(f"      • {len([u for u in users if u.roles == 'volunteer'])} voluntários")
        print(f"      • {len([u for u in users if u.roles == 'admin'])} administrador")
        
        print(f"\n   📦 Recursos:")
        print(f"      • {len(batches)} lotes disponíveis")
        print(f"      • {len(requests)} pedidos ativos")
        print(f"      • {len(deliveries)} entregas em andamento")
        
        print("\n🔑 LOGIN (senha: 123 para todos):")
        restaurants = [u for u in users if u.roles == 'provider']
        shelters = [u for u in users if u.roles == 'shelter']
        volunteers = [u for u in users if u.roles == 'volunteer']
        admins = [u for u in users if u.roles == 'admin']
        
        print("\n   🍽️ RESTAURANTES:")
        for r in restaurants:
            status = "🟢 ATIVO" if r.active else "🔴 DESLIGADO"
            if r.email in ['restaurante.bom.sabor@euajudo.com', 'restaurante.sabores.casa@euajudo.com']:
                status += " (oferecendo marmitas)"
            elif r.email in ['restaurante.maria.sopa@euajudo.com', 'restaurante.prato.feito@euajudo.com']:
                status += " (pedindo insumos)"
            print(f"      • {r.email} - {status}")
        
        print("\n   🏠 ABRIGOS:")
        for s in shelters:
            multi_item = len([r for r in requests if r.provider_id == s.id and len(r.items) > 1]) > 0
            status = " (múltiplos itens)" if multi_item else " (item único)"
            print(f"      • {s.email}{status}")
        
        print("\n   🙋 VOLUNTÁRIOS:")
        for v in volunteers:
            print(f"      • {v.email}")
        
        print(f"\n   👤 ADMIN:")
        for a in admins:
            print(f"      • {a.email}")
        
        print("\n🎯 CENÁRIO MONTADO:")
        print("   1. Voluntários podem retirar marmitas dos restaurantes ativos")
        print("   2. Entregar marmitas nos abrigos que pedem alimentos")
        print("   3. Restaurantes pedindo insumos precisam de doações")
        print("   4. Abrigos com múltiplos itens precisam de entregas variadas")
        print("   5. Restaurante desligado não aparece no mapa")
        print("="*70)
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
