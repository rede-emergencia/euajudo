#!/usr/bin/env python3
"""
Script para verificar estado do banco DEPOIS do cancelamento
"""

from app.database import SessionLocal
from app.models import Delivery, DeliveryLocation

def main():
    db = SessionLocal()

    print('🔍 VERIFICANDO ESTADO DEPOIS DO CANCELAMENTO')
    print('=' * 50)

    # Verificar todos os locais e suas quantidades
    locations = db.query(DeliveryLocation).all()
    
    for loc in locations:
        print(f'\n📍 {loc.name}:')
        print(f'   Endereço: {loc.address}')
        
        # Verificar marmitas
        meal_deliveries = db.query(Delivery).filter(
            Delivery.location_id == loc.id, 
            Delivery.product_type == 'meal'
        ).all()
        
        # Verificar camisetas
        clothing_deliveries = db.query(Delivery).filter(
            Delivery.location_id == loc.id, 
            Delivery.product_type == 'clothing'
        ).all()
        
        # Calcular totais disponíveis
        available_meal = sum(d.quantity for d in meal_deliveries if d.status == 'available')
        reserved_meal = sum(d.quantity for d in meal_deliveries if d.status in ['reserved', 'pending_confirmation'])
        available_clothing = sum(d.quantity for d in clothing_deliveries if d.status == 'available')
        reserved_clothing = sum(d.quantity for d in clothing_deliveries if d.status in ['reserved', 'pending_confirmation'])
        
        print(f'   🍽️ Marmitas: {available_meal} disponíveis, {reserved_meal} reservadas')
        print(f'   👕 Camisetas: {available_clothing} disponíveis, {reserved_clothing} reservadas')
        
        # Detalhamento de cada delivery
        print(f'   📋 Detalhes das deliveries:')
        for d in meal_deliveries + clothing_deliveries:
            product_name = 'Marmitas' if d.product_type == 'meal' else 'Camisetas'
            status_icon = '✅' if d.status == 'available' else '🤝' if d.status in ['reserved', 'pending_confirmation'] else '❌'
            volunteer_info = f' (Voluntário: {d.volunteer_id})' if d.volunteer_id else ''
            print(f'      {status_icon} {product_name}: {d.quantity} ({d.status}){volunteer_info}')

    print('\n' + '=' * 50)
    print('📊 ANÁLISE DO CANCELAMENTO:')
    
    # Verificar se as marmitas foram restauradas
    centro_meal = db.query(Delivery).filter(
        Delivery.location_id == 1,  # Assuming Centro is ID 1
        Delivery.product_type == 'meal'
    ).all()
    
    total_meal_available = sum(d.quantity for d in centro_meal if d.status == 'available')
    total_meal_reserved = sum(d.quantity for d in centro_meal if d.status in ['reserved', 'pending_confirmation'])
    
    print(f'   🍽️ Marmitas no Centro:')
    print(f'      Disponíveis: {total_meal_available}')
    print(f'      Reservadas: {total_meal_reserved}')
    
    expected_total = 30
    actual_total = total_meal_available + total_meal_reserved
    
    if actual_total == expected_total:
        print(f'      ✅ Total correto: {actual_total}/{expected_total}')
        if total_meal_reserved == 0:
            print(f'      ✅ Cancelamento funcionou! Todas as {total_meal_available} marmitas estão disponíveis')
        else:
            print(f'      ⚠️  Ainda há {total_meal_reserved} marmitas reservadas')
    else:
        print(f'      ❌ Total incorreto: {actual_total}/{expected_total}')
        print(f'      ❌ Cancelamento não restaurou quantidades corretamente')

    print('\n🎯 VEREDITO FINAL:')
    if total_meal_available == 30 and total_meal_reserved == 0:
        print('   ✅ SUCESSO: Cancelamento restaurou quantidades corretamente!')
    else:
        print('   ❌ FALHA: Cancelamento não funcionou como esperado')

    db.close()

if __name__ == '__main__':
    main()
