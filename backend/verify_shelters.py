#!/usr/bin/env python3
"""
Script para verificar se todos os shelters têm locations correspondentes
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models import User, DeliveryLocation

def verify_shelters_locations():
    """Verifica consistência entre shelters e locations"""
    db = next(get_db())
    
    try:
        print("🔍 Verificando consistência de shelters e locations...")
        print("=" * 60)
        
        # 1. Total de shelters
        total_shelters = db.query(User).filter(
            User.roles.like('%shelter%')
        ).count()
        
        # 2. Total de shelters pendentes
        pending_shelters = db.query(User).filter(
            User.roles.like('%shelter%'),
            User.approved == False,
            User.active == True
        ).count()
        
        # 3. Total de locations
        total_locations = db.query(DeliveryLocation).count()
        
        # 4. Total de locations pendentes
        pending_locations = db.query(DeliveryLocation).filter(
            DeliveryLocation.approved == False,
            DeliveryLocation.active == True
        ).count()
        
        print(f"📊 Estatísticas:")
        print(f"  - Total shelters: {total_shelters}")
        print(f"  - Shelters pendentes: {pending_shelters}")
        print(f"  - Total locations: {total_locations}")
        print(f"  - Locations pendentes: {pending_locations}")
        
        # 5. Shelters sem location
        shelters_without_location = []
        shelters = db.query(User).filter(User.roles.like('%shelter%')).all()
        
        for shelter in shelters:
            location = db.query(DeliveryLocation).filter(
                DeliveryLocation.user_id == shelter.id
            ).first()
            if not location:
                shelters_without_location.append(shelter)
        
        if shelters_without_location:
            print(f"\n❌ Shelters SEM location ({len(shelters_without_location)}):")
            for shelter in shelters_without_location:
                print(f"  - {shelter.name} ({shelter.email})")
        else:
            print(f"\n✅ Todos os shelters têm location!")
        
        # 6. Locations sem user (órfãs)
        orphan_locations = []
        locations = db.query(DeliveryLocation).all()
        
        for location in locations:
            user = db.query(User).filter(User.id == location.user_id).first()
            if not user:
                orphan_locations.append(location)
        
        if orphan_locations:
            print(f"\n⚠️  Locations órfãs ({len(orphan_locations)}):")
            for location in orphan_locations:
                print(f"  - {location.name} (user_id: {location.user_id})")
        else:
            print(f"✅ Todas as locations têm user correspondente!")
        
        # 7. Resumo
        print(f"\n📋 Resumo:")
        if len(shelters_without_location) == 0:
            print("✅ Sistema consistente - todos os shelters devem aparecer na lista")
            return True
        else:
            print("❌ Sistema inconsistente - execute create_missing_locations.py")
            return False
            
    except Exception as e:
        print(f'❌ Erro: {e}')
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = verify_shelters_locations()
    sys.exit(0 if success else 1)
