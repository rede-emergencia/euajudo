#!/usr/bin/env python3
"""
Script para corrigir quantidades das deliveries após cancelamento
"""

from app.database import SessionLocal
from app.models import Delivery, DeliveryLocation

def main():
    db = SessionLocal()

    print('🔧 CORRIGINDO QUANTIDADES DAS DELIVERIES')
    print('=' * 50)

    # Encontrar o Ponto de Coleta Centro
    centro = db.query(DeliveryLocation).filter(
        DeliveryLocation.name.like('%Centro%')
    ).first()

    if not centro:
        print('❌ Ponto de Coleta Centro não encontrado')
        db.close()
        return

    print(f'📍 Local encontrado: {centro.name}')

    # Encontrar a delivery de camisetas do Centro
    clothing_delivery = db.query(Delivery).filter(
        Delivery.location_id == centro.id,
        Delivery.product_type == 'clothing'
    ).first()

    if not clothing_delivery:
        print('❌ Delivery de camisetas não encontrada')
        db.close()
        return

    print(f'📦 Delivery encontrada: ID={clothing_delivery.id}')
    print(f'   Quantidade atual: {clothing_delivery.quantity}')
    print(f'   Status: {clothing_delivery.status}')

    # Corrigir quantidade para 20 (valor original do seed)
    if clothing_delivery.quantity < 20:
        old_quantity = clothing_delivery.quantity
        clothing_delivery.quantity = 20
        db.commit()
        
        print(f'✅ QUANTIDADE CORRIGIDA:')
        print(f'   Antes: {old_quantity}')
        print(f'   Depois: {clothing_delivery.quantity}')
        print(f'   Diferença: +{20 - old_quantity}')
    else:
        print('✅ Quantidade já está correta')

    # Verificar estado final
    print('\n🔍 ESTADO FINAL:')
    deliveries = db.query(Delivery).filter(
        Delivery.location_id == centro.id
    ).all()

    for d in deliveries:
        product_name = 'Camisetas' if d.product_type == 'clothing' else 'Marmitas'
        print(f'   {product_name}: {d.quantity} ({d.status})')

    print('\n✅ Correção concluída com sucesso!')

    db.close()

if __name__ == '__main__':
    main()
