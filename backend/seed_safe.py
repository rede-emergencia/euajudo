#!/usr/bin/env python3
"""
Seed seguro - cria dados de teste sem duplicar usuários existentes
Verifica se cada usuário já existe antes de criar
"""

from app.database import SessionLocal, engine
from app.models import User, DeliveryLocation, ProductBatch, Delivery, ResourceRequest, ResourceItem
from app.enums import ProductType, BatchStatus, DeliveryStatus, OrderStatus
from app.auth import get_password_hash
from datetime import datetime, timedelta

def create_user_if_not_exists(db, user_data):
    """Cria usuário apenas se não existir"""
    existing_user = db.query(User).filter(User.email == user_data['email']).first()
    
    if existing_user:
        print(f"   • {user_data['email']} - já existe (ID: {existing_user.id})")
        return existing_user
    
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"   • {user_data['email']} - criado (ID: {user.id})")
    return user

def create_location_if_not_exists(db, location_data):
    """Cria location apenas se não existir"""
    existing_location = db.query(DeliveryLocation).filter(
        DeliveryLocation.name == location_data['name']
    ).first()
    
    if existing_location:
        print(f"   • {location_data['name']} - já existe (ID: {existing_location.id})")
        return existing_location
    
    location = DeliveryLocation(**location_data)
    db.add(location)
    db.commit()
    db.refresh(location)
    print(f"   • {location_data['name']} - criado (ID: {location.id})")
    return location

def seed_safe():
    """Seed seguro que não duplica dados"""
    db = SessionLocal()
    
    try:
        print("🌱 Seed Seguro VouAjudar - Verificando e criando dados...")
        
        # Senha padrão para todos
        password_hash = get_password_hash("123")
        
        # 1. RESTAURANTES
        print("\n🍽️ Criando restaurantes...")
        restaurants_data = [
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
            {
                'email': 'restaurante.sabores.casa@euajudo.com',
                'name': 'Sabores da Casa',
                'phone': '32977776666',
                'roles': 'provider',
                'hashed_password': password_hash,
                'address': 'Avenida Rio Branco, 456 - Centro, Juiz de Fora',
                'establishment_type': 'Restaurante',
                'production_capacity': 120,
                'latitude': -21.762000,
                'longitude': -43.348000,
                'approved': True,
                'active': True
            },
            {
                'email': 'restaurante.maria.sopa@euajudo.com',
                'name': 'Restaurante Maria Sopa',
                'phone': '32966665555',
                'roles': 'provider',
                'hashed_password': password_hash,
                'address': 'Rua São Mateus, 789 - São Mateus, Juiz de Fora',
                'establishment_type': 'Restaurante',
                'production_capacity': 80,
                'latitude': -21.760000,
                'longitude': -43.346000,
                'approved': True,
                'active': True
            },
            {
                'email': 'restaurante.prato.feito@euajudo.com',
                'name': 'Restaurante Prato Feito',
                'phone': '32955554444',
                'roles': 'provider',
                'hashed_password': password_hash,
                'address': 'Rua Espírito Santo, 321 - Centro, Juiz de Fora',
                'establishment_type': 'Restaurante',
                'production_capacity': 100,
                'latitude': -21.758000,
                'longitude': -43.344000,
                'approved': True,
                'active': True
            },
            {
                'email': 'restaurante.porta.fechada@euajudo.com',
                'name': 'Restaurante Porta Fechada',
                'phone': '32944453333',
                'roles': 'provider',
                'hashed_password': password_hash,
                'address': 'Rua Marechal Deodoro, 654 - Centro, Juiz de Fora',
                'establishment_type': 'Restaurante',
                'production_capacity': 90,
                'latitude': -21.756000,
                'longitude': -43.342000,
                'approved': True,
                'active': False
            }
        ]
        
        created_restaurants = []
        for restaurant_data in restaurants_data:
            restaurant = create_user_if_not_exists(db, restaurant_data)
            created_restaurants.append(restaurant)
        
        # 2. ABRIGOS
        print("\n🏠 Criando abrigos...")
        shelters_data = [
            {
                'email': 'abrigo.sao.francisco@euajudo.com',
                'name': 'Abrigo São Francisco de Assis',
                'phone': '3236881234',
                'roles': 'shelter',
                'hashed_password': password_hash,
                'address': 'Rua Principal, 500 - Cascatinha, Juiz de Fora',
                'latitude': -21.754000,
                'longitude': -43.340000,
                'approved': True,
                'active': True
            },
            {
                'email': 'abrigo.carmo@euajudo.com',
                'name': 'Abrigo Nossa Senhora do Carmo',
                'phone': '3236885678',
                'roles': 'shelter',
                'hashed_password': password_hash,
                'address': 'Rua das Flores, 200 - Granbery, Juiz de Fora',
                'latitude': -21.752000,
                'longitude': -43.338000,
                'approved': True,
                'active': True
            },
            {
                'email': 'abrigo.bom.pastor@euajudo.com',
                'name': 'Abrigo Bom Pastor',
                'phone': '3236889012',
                'roles': 'shelter',
                'hashed_password': password_hash,
                'address': 'Avenida Brasil, 800 - São Pedro, Juiz de Fora',
                'latitude': -21.750000,
                'longitude': -43.336000,
                'approved': True,
                'active': True
            },
            {
                'email': 'abrigo.esperanca@euajudo.com',
                'name': 'Casa da Esperança',
                'phone': '3236883456',
                'roles': 'shelter',
                'hashed_password': password_hash,
                'address': 'Rua da Bahia, 150 - Centro, Juiz de Fora',
                'latitude': -21.748000,
                'longitude': -43.334000,
                'approved': True,
                'active': True
            },
            {
                'email': 'abrigo.caridade@euajudo.com',
                'name': 'Centro de Caridade Irmã Clara',
                'phone': '3236887890',
                'roles': 'shelter',
                'hashed_password': password_hash,
                'address': 'Rua Professor Dantas, 300 - Lourdes, Juiz de Fora',
                'latitude': -21.746000,
                'longitude': -43.332000,
                'approved': True,
                'active': True
            },
            {
                'email': 'abrigo.luz@euajudo.com',
                'name': 'Casa da Luz',
                'phone': '3236882345',
                'roles': 'shelter',
                'hashed_password': password_hash,
                'address': 'Rua Dom Silvério, 450 - Borba Gato, Juiz de Fora',
                'latitude': -21.744000,
                'longitude': -43.330000,
                'approved': True,
                'active': True
            }
        ]
        
        created_shelters = []
        for shelter_data in shelters_data:
            shelter = create_user_if_not_exists(db, shelter_data)
            created_shelters.append(shelter)
        
        # 3. VOLUNTÁRIOS
        print("\n🙋 Criando voluntários...")
        volunteers_data = [
            {
                'email': 'joao.voluntario@euajudo.com',
                'name': 'João Voluntário',
                'phone': '32999998888',
                'roles': 'volunteer',
                'hashed_password': password_hash,
                'address': 'Rua Matias Barbosa, 100 - Centro, Juiz de Fora',
                'latitude': -21.742000,
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
                'latitude': -21.740000,
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
                'latitude': -21.738000,
                'longitude': -43.324000,
                'approved': True,
                'active': True
            }
        ]
        
        created_volunteers = []
        for volunteer_data in volunteers_data:
            volunteer = create_user_if_not_exists(db, volunteer_data)
            created_volunteers.append(volunteer)
        
        # 4. DELIVERY LOCATIONS (vinculados aos abrigos)
        print("\n📍 Criando locais de entrega...")
        locations_data = [
            {
                'name': 'Abrigo São Francisco de Assis',
                'address': 'Rua Principal, 500 - Cascatinha, Juiz de Fora',
                'city_id': 'belo-horizonte',
                'latitude': -21.754000,
                'longitude': -43.340000,
                'contact_person': 'Abrigo São Francisco de Assis',
                'phone': '3236881234',
                'capacity': None,
                'daily_need': None,
                'operating_hours': None,
                'active': True,
                'approved': True,
                'user_id': created_shelters[0].id if created_shelters else None
            },
            {
                'name': 'Abrigo Nossa Senhora do Carmo',
                'address': 'Rua das Flores, 200 - Granbery, Juiz de Fora',
                'city_id': 'belo-horizonte',
                'latitude': -21.752000,
                'longitude': -43.338000,
                'contact_person': 'Abrigo Nossa Senhora do Carmo',
                'phone': '3236885678',
                'capacity': None,
                'daily_need': None,
                'operating_hours': None,
                'active': True,
                'approved': True,
                'user_id': created_shelters[1].id if len(created_shelters) > 1 else None
            },
            {
                'name': 'Abrigo Bom Pastor',
                'address': 'Avenida Brasil, 800 - São Pedro, Juiz de Fora',
                'city_id': 'belo-horizonte',
                'latitude': -21.750000,
                'longitude': -43.336000,
                'contact_person': 'Abrigo Bom Pastor',
                'phone': '3236889012',
                'capacity': None,
                'daily_need': None,
                'operating_hours': None,
                'active': True,
                'approved': True,
                'user_id': created_shelters[2].id if len(created_shelters) > 2 else None
            },
            {
                'name': 'Casa da Esperança',
                'address': 'Rua da Bahia, 150 - Centro, Juiz de Fora',
                'city_id': 'belo-horizonte',
                'latitude': -21.748000,
                'longitude': -43.334000,
                'contact_person': 'Casa da Esperança',
                'phone': '3236883456',
                'capacity': None,
                'daily_need': None,
                'operating_hours': None,
                'active': True,
                'approved': True,
                'user_id': created_shelters[3].id if len(created_shelters) > 3 else None
            },
            {
                'name': 'Centro de Caridade Irmã Clara',
                'address': 'Rua Professor Dantas, 300 - Lourdes, Juiz de Fora',
                'city_id': 'belo-horizonte',
                'latitude': -21.746000,
                'longitude': -43.332000,
                'contact_person': 'Centro de Caridade Irmã Clara',
                'phone': '3236887890',
                'capacity': None,
                'daily_need': None,
                'operating_hours': None,
                'active': True,
                'approved': True,
                'user_id': created_shelters[4].id if len(created_shelters) > 4 else None
            },
            {
                'name': 'Casa da Luz',
                'address': 'Rua Dom Silvério, 450 - Borba Gato, Juiz de Fora',
                'city_id': 'belo-horizonte',
                'latitude': -21.744000,
                'longitude': -43.330000,
                'contact_person': 'Casa da Luz',
                'phone': '3236882345',
                'capacity': None,
                'daily_need': None,
                'operating_hours': None,
                'active': True,
                'approved': True,
                'user_id': created_shelters[5].id if len(created_shelters) > 5 else None
            }
        ]
        
        created_locations = []
        for location_data in locations_data:
            location = create_location_if_not_exists(db, location_data)
            created_locations.append(location)
        
        # 5. RESOURCE REQUESTS (Pedidos de recursos dos abrigos)
        print("\n📦 Criando pedidos de recursos para abrigos...")
        created_requests = []
        
        if len(created_shelters) >= 6:
            # Abrigo 1 - São Francisco: 50 marmitas + medicamentos urgentes
            request1 = ResourceRequest(
                provider_id=created_shelters[0].id,
                quantity_meals=50,
                status=OrderStatus.REQUESTING,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=2)
            )
            db.add(request1)
            db.flush()
            
            db.add(ResourceItem(request_id=request1.id, name='Marmitas', quantity=50, unit='unidades'))
            db.add(ResourceItem(request_id=request1.id, name='Paracetamol', quantity=100, unit='comprimidos'))
            db.add(ResourceItem(request_id=request1.id, name='Dipirona', quantity=50, unit='comprimidos'))
            created_requests.append(request1)
            print(f"   • {created_shelters[0].name}: 50 marmitas + medicamentos")
            
            # Abrigo 2 - Carmo: 30 marmitas + roupas + higiene
            request2 = ResourceRequest(
                provider_id=created_shelters[1].id,
                quantity_meals=30,
                status=OrderStatus.REQUESTING,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=3)
            )
            db.add(request2)
            db.flush()
            
            db.add(ResourceItem(request_id=request2.id, name='Marmitas', quantity=30, unit='unidades'))
            db.add(ResourceItem(request_id=request2.id, name='Camisetas', quantity=20, unit='peças'))
            db.add(ResourceItem(request_id=request2.id, name='Calças', quantity=15, unit='peças'))
            db.add(ResourceItem(request_id=request2.id, name='Sabonete', quantity=40, unit='unidades'))
            db.add(ResourceItem(request_id=request2.id, name='Shampoo', quantity=20, unit='frascos'))
            created_requests.append(request2)
            print(f"   • {created_shelters[1].name}: 30 marmitas + roupas + higiene")
            
            # Abrigo 3 - Bom Pastor: 80 marmitas (URGENTE - muitas pessoas)
            request3 = ResourceRequest(
                provider_id=created_shelters[2].id,
                quantity_meals=80,
                status=OrderStatus.REQUESTING,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=1)
            )
            db.add(request3)
            db.flush()
            
            db.add(ResourceItem(request_id=request3.id, name='Marmitas', quantity=80, unit='unidades'))
            db.add(ResourceItem(request_id=request3.id, name='Água mineral', quantity=100, unit='litros'))
            created_requests.append(request3)
            print(f"   • {created_shelters[2].name}: 80 marmitas + água (URGENTE)")
            
            # Abrigo 4 - Casa da Esperança: 20 marmitas + material de limpeza
            request4 = ResourceRequest(
                provider_id=created_shelters[3].id,
                quantity_meals=20,
                status=OrderStatus.REQUESTING,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=2)
            )
            db.add(request4)
            db.flush()
            
            db.add(ResourceItem(request_id=request4.id, name='Marmitas', quantity=20, unit='unidades'))
            db.add(ResourceItem(request_id=request4.id, name='Desinfetante', quantity=10, unit='litros'))
            db.add(ResourceItem(request_id=request4.id, name='Detergente', quantity=15, unit='frascos'))
            db.add(ResourceItem(request_id=request4.id, name='Água sanitária', quantity=8, unit='litros'))
            created_requests.append(request4)
            print(f"   • {created_shelters[3].name}: 20 marmitas + limpeza")
            
            # Abrigo 5 - Centro Caridade: 60 marmitas + medicamentos + roupas
            request5 = ResourceRequest(
                provider_id=created_shelters[4].id,
                quantity_meals=60,
                status=OrderStatus.REQUESTING,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=3)
            )
            db.add(request5)
            db.flush()
            
            db.add(ResourceItem(request_id=request5.id, name='Marmitas', quantity=60, unit='unidades'))
            db.add(ResourceItem(request_id=request5.id, name='Antibióticos', quantity=30, unit='comprimidos'))
            db.add(ResourceItem(request_id=request5.id, name='Antitérmicos', quantity=50, unit='comprimidos'))
            db.add(ResourceItem(request_id=request5.id, name='Cobertores', quantity=25, unit='unidades'))
            db.add(ResourceItem(request_id=request5.id, name='Agasalhos', quantity=30, unit='peças'))
            created_requests.append(request5)
            print(f"   • {created_shelters[4].name}: 60 marmitas + medicamentos + cobertores")
            
            # Abrigo 6 - Casa da Luz: 40 marmitas + higiene completa
            request6 = ResourceRequest(
                provider_id=created_shelters[5].id,
                quantity_meals=40,
                status=OrderStatus.REQUESTING,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=2)
            )
            db.add(request6)
            db.flush()
            
            db.add(ResourceItem(request_id=request6.id, name='Marmitas', quantity=40, unit='unidades'))
            db.add(ResourceItem(request_id=request6.id, name='Pasta de dente', quantity=30, unit='tubos'))
            db.add(ResourceItem(request_id=request6.id, name='Escova de dente', quantity=30, unit='unidades'))
            db.add(ResourceItem(request_id=request6.id, name='Papel higiênico', quantity=50, unit='rolos'))
            db.add(ResourceItem(request_id=request6.id, name='Absorvente', quantity=40, unit='pacotes'))
            created_requests.append(request6)
            print(f"   • {created_shelters[5].name}: 40 marmitas + kit higiene")
        
        db.commit()
        
        # Resumo
        print("\n📊 RESUMO DO SEED SEGURO:")
        print(f"   👥 Usuários criados/verificados: {len(created_restaurants) + len(created_shelters) + len(created_volunteers)}")
        print(f"      • Restaurantes: {len(created_restaurants)}")
        print(f"      • Abrigos: {len(created_shelters)}")
        print(f"      • Voluntários: {len(created_volunteers)}")
        print(f"   📍 Locais criados/verificados: {len(created_locations)}")
        print(f"   📦 Pedidos de recursos criados: {len(created_requests)}")
        
        print("\n🔑 CREDENCIAIS (senha: 123 para todos):")
        print("   🍽️ RESTAURANTES:")
        for restaurant in created_restaurants:
            print(f"      • {restaurant.email}")
        print("   🏠 ABRIGOS:")
        for shelter in created_shelters:
            print(f"      • {shelter.email}")
        print("   🙋 VOLUNTÁRIOS:")
        for volunteer in created_volunteers:
            print(f"      • {volunteer.email}")
        
        print("\n✅ Seed seguro concluído!")
        
    except Exception as e:
        print(f"❌ Erro no seed seguro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_safe()
