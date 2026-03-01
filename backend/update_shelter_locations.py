#!/usr/bin/env python3
"""
Script para atualizar localizações dos abrigos em produção para Juiz de Fora
"""

import os
import sys

# Configurar ambiente para produção
os.environ["DATABASE_URL"] = "postgresql://euajudo_user:niHQGFxb2EClbnS6Rvq86GDFS6fuexNM@dpg-d6h6fj0gjchc73cidakg-a.oregon-postgres.render.com/euajudo"
os.environ["ENVIRONMENT"] = "production"

sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import DeliveryLocation, User
from sqlalchemy.orm import joinedload

def update_shelter_locations():
    """Atualiza localizações dos abrigos para Juiz de Fora"""
    print("🗺️ Atualizando localizações dos abrigos para Juiz de Fora...")
    
    db = SessionLocal()
    try:
        # Buscar todas as localizações com seus usuários
        locations = db.query(DeliveryLocation).options(joinedload(DeliveryLocation.owner)).all()
        
        for location in locations:
            if "centro" in location.name.lower() or (location.owner and "centro" in location.owner.email.lower()):
                # Abrigo Centro de Operações
                location.latitude = -21.7642
                location.longitude = -43.3505
                location.address = "Praça da República, 100 - Centro, Juiz de Fora - MG"
                print(f"✅ Atualizado: {location.name} -> Centro de Juiz de Fora")
                
            elif "são sebastião" in location.name.lower() or (location.owner and "saosebastiao" in location.owner.email.lower()):
                # Abrigo São Sebastião
                location.latitude = -21.7842
                location.longitude = -43.3705
                location.address = "Rua São Sebastião, 200 - São Sebastião, Juiz de Fora - MG"
                print(f"✅ Atualizado: {location.name} -> São Sebastião em Juiz de Fora")
        
        db.commit()
        
        print(f"\n📊 Resumo:")
        print(f"   🏠 Localizações atualizadas: {len(locations)}")
        
        # Verificar atualizações
        for location in locations:
            print(f"   📍 {location.name}: ({location.latitude}, {location.longitude})")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = update_shelter_locations()
    if success:
        print("\n✅ Localizações atualizadas com sucesso!")
    else:
        print("\n❌ Falha na atualização")
        sys.exit(1)
