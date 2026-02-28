#!/usr/bin/env python3
"""
Script para verificar estado do banco ANTES da reserva
"""

from app.database import SessionLocal
from app.models import Delivery, DeliveryLocation

def main():
    db = SessionLocal()

    print('🔍 VERIFICANDO ESTADO ANTES DA RESERVA')
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
        available_clothing = sum(d.quantity for d in clothing_deliveries if d.status == 'available')
        
        print(f'   🍽️ Marmitas disponíveis: {available_meal}')
        print(f'   👕 Camisetas disponíveis: {available_clothing}')
        
        # Detalhamento de cada delivery
        print(f'   📋 Detalhes das deliveries:')
        for d in meal_deliveries + clothing_deliveries:
            product_name = 'Marmitas' if d.product_type == 'meal' else 'Camisetas'
            status_icon = '✅' if d.status == 'available' else '🤝'
            print(f'      {status_icon} {product_name}: {d.quantity} ({d.status})')

    print('\n' + '=' * 50)
    print('📊 RESUMO ANTES DA RESERVA:')
    print('   Faça sua reserva de 10 marmitas agora')
    print('   Depois execute: python check_after_reservation.py')

    db.close()

if __name__ == '__main__':
    main()
