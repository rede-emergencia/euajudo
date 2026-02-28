#!/usr/bin/env python3
"""
Script para verificar estado atual das deliveries no banco
"""

from app.database import SessionLocal
from app.models import Delivery, DeliveryLocation, ProductBatch

def main():
    db = SessionLocal()

    print('🔍 VERIFICANDO ESTADO ATUAL DO BANCO DE DADOS')
    print('=' * 60)

    # 1. Verificar todos os deliveries
    print('\n📦 TODAS AS DELIVERIES:')
    deliveries = db.query(Delivery).all()
    for d in deliveries:
        location = db.query(DeliveryLocation).filter(DeliveryLocation.id == d.location_id).first()
        print(f'  ID: {d.id} | Produto: {d.product_type} | Qtd: {d.quantity} | Status: {d.status} | Voluntário: {d.volunteer_id} | Local: {location.name if location else "N/A"}')

    print(f'\n📊 Total de deliveries: {len(deliveries)}')

    # 2. Verificar locations e quantidades por produto
    print('\n📍 LOCATIONS E QUANTIDADES:')
    locations = db.query(DeliveryLocation).all()
    
    for loc in locations:
        print(f'\n  📍 {loc.name}:')
        print(f'     Endereço: {loc.address}')
        
        # Verificar camisetas
        clothing_deliveries = db.query(Delivery).filter(
            Delivery.location_id == loc.id, 
            Delivery.product_type == 'clothing'
        ).all()
        
        # Verificar marmitas
        meal_deliveries = db.query(Delivery).filter(
            Delivery.location_id == loc.id, 
            Delivery.product_type == 'meal'
        ).all()
        
        # Calcular totais disponíveis
        available_clothing = sum(d.quantity for d in clothing_deliveries if d.status == 'available')
        available_meal = sum(d.quantity for d in meal_deliveries if d.status == 'available')
        
        reserved_clothing = sum(d.quantity for d in clothing_deliveries if d.status == 'reserved')
        reserved_meal = sum(d.quantity for d in meal_deliveries if d.status == 'reserved')
        
        print(f'     👕 Camisetas: {available_clothing} disponíveis, {reserved_clothing} reservadas')
        print(f'     🍽️ Marmitas: {available_meal} disponíveis, {reserved_meal} reservadas')
        
        # Detalhamento de cada delivery
        print(f'     📋 Detalhes:')
        for d in clothing_deliveries + meal_deliveries:
            product_name = 'Camisetas' if d.product_type == 'clothing' else 'Marmitas'
            print(f'        - {product_name}: {d.quantity} ({d.status})')

    # 3. Verificar batches (se houver)
    print('\n🏪 BATCHES:')
    batches = db.query(ProductBatch).all()
    if batches:
        for b in batches:
            print(f'  ID: {b.id} | Produto: {b.product_type} | Disponível: {b.quantity_available}/{b.quantity} | Status: {b.status}')
    else:
        print('  ❌ Nenhum batch encontrado (fluxo direto)')

    print('\n' + '=' * 60)
    print('🔍 ANÁLISE FINAL:')
    
    # Verificar se há problema com quantidades
    for loc in locations:
        clothing_deliveries = db.query(Delivery).filter(
            Delivery.location_id == loc.id, 
            Delivery.product_type == 'clothing'
        ).all()
        
        total_clothing = sum(d.quantity for d in clothing_deliveries if d.status == 'available')
        expected_clothing = 20  # Valor esperado do seed
        
        if total_clothing < expected_clothing:
            print(f'  ⚠️  {loc.name}: Camisetas disponíveis ({total_clothing}) < esperado ({expected_clothing})')
            print(f'      Possível problema: cancelamento não restaurou quantidade')
        else:
            print(f'  ✅ {loc.name}: Camisetas disponíveis ({total_clothing}) = esperado ({expected_clothing})')

    db.close()

if __name__ == '__main__':
    main()
