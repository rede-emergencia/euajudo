#!/usr/bin/env python3
"""
Script para verificar estado do banco DEPOIS da reserva
"""

from app.database import SessionLocal
from app.models import Delivery, DeliveryLocation

def main():
    db = SessionLocal()

    print('🔍 VERIFICANDO ESTADO DEPOIS DA RESERVA')
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
    print('📊 ANÁLISE DA RESERVA:')
    
    # Verificar se houve mudança nas marmitas
    centro_meal = db.query(Delivery).filter(
        Delivery.location_id == 1,  # Assuming Centro is ID 1
        Delivery.product_type == 'meal'
    ).all()
    
    total_meal_before = 30
    total_meal_after = sum(d.quantity for d in centro_meal if d.status == 'available')
    reserved_meal = sum(d.quantity for d in centro_meal if d.status in ['reserved', 'pending_confirmation'])
    
    print(f'   🍽️ Marmitas no Centro:')
    print(f'      Antes: {total_meal_before} disponíveis')
    print(f'      Depois: {total_meal_after} disponíveis + {reserved_meal} reservadas')
    
    if reserved_meal > 0:
        print(f'      ✅ Reserva de {reserved_meal} marmitas detectada!')
    else:
        print(f'      ⚠️  Nenhuma reserva detectada')

    print('\n💡 Próximo passo:')
    print('   Agora cancele a reserva para testar a restauração')
    print('   Depois execute: python check_after_cancellation.py')

    db.close()

if __name__ == '__main__':
    main()
