#!/usr/bin/env python3
"""
Script para criar DeliveryLocation para shelters existentes que não têm location
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models import User, DeliveryLocation

def create_missing_locations():
    """Cria DeliveryLocation para shelters que não têm"""
    db = next(get_db())
    
    try:
        # Encontrar shelters sem location
        shelters_without_location = []
        shelters = db.query(User).filter(
            User.roles.like('%shelter%'), 
            User.approved == False, 
            User.active == True
        ).all()

        for shelter in shelters:
            location = db.query(DeliveryLocation).filter(
                DeliveryLocation.user_id == shelter.id
            ).first()
            if not location:
                shelters_without_location.append(shelter)

        print(f'Encontrados {len(shelters_without_location)} shelters sem location:')
        
        for shelter in shelters_without_location:
            print(f'  - {shelter.name} ({shelter.email})')
            
            location = DeliveryLocation(
                name=shelter.name,
                address=shelter.address or f'Endereço de {shelter.name}',
                city_id='belo-horizonte',
                contact_person=shelter.name,
                phone=shelter.phone or '31999999999',
                user_id=shelter.id,
                approved=False,
                active=True,
                capacity=50,
                daily_need=30
            )
            db.add(location)
            print(f'    ✅ Location criada')

        db.commit()
        print(f'\n✅ Sucesso! {len(shelters_without_location)} locations criadas.')
        
        # Verificar resultado
        total_pending = db.query(DeliveryLocation).filter(
            DeliveryLocation.approved == False,
            DeliveryLocation.active == True
        ).count()
        print(f'Total de locations pendentes agora: {total_pending}')
        
    except Exception as e:
        print(f'❌ Erro: {e}')
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    print("🔧 Criando locations para shelters existentes...")
    print("=" * 50)
    
    success = create_missing_locations()
    
    if success:
        print("\n🎉 Script concluído com sucesso!")
        print("Agora todos os shelters devem aparecer na lista de pendentes.")
    else:
        print("\n❌ Ocorreu um erro durante a execução.")
        sys.exit(1)
