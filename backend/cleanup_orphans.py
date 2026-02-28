"""
Script para limpar deliveries órfãos do banco de dados

Deliveries órfãos são aqueles que:
- Têm volunteer_id que não existe mais no banco
- Estão em status PENDING_CONFIRMATION ou RESERVED
- Foram criados em sessões anteriores
"""

from app.database import SessionLocal
from app.models import Delivery, User
from app.enums import DeliveryStatus

def cleanup_orphan_deliveries():
    """Remove deliveries órfãos do banco"""
    db = SessionLocal()
    try:
        # Buscar todos os deliveries com volunteer_id
        deliveries_with_volunteer = db.query(Delivery).filter(
            Delivery.volunteer_id.isnot(None)
        ).all()
        
        orphans_found = 0
        orphans_deleted = 0
        
        for delivery in deliveries_with_volunteer:
            # Verificar se o volunteer existe
            volunteer = db.query(User).filter(User.id == delivery.volunteer_id).first()
            
            if not volunteer:
                orphans_found += 1
                print(f"🗑️  Delivery órfão encontrado:")
                print(f"   ID: {delivery.id}")
                print(f"   volunteer_id: {delivery.volunteer_id} (não existe)")
                print(f"   status: {delivery.status}")
                print(f"   quantity: {delivery.quantity}")
                
                # Deletar delivery órfão
                db.delete(delivery)
                orphans_deleted += 1
        
        if orphans_deleted > 0:
            db.commit()
            print(f"\n✅ {orphans_deleted} deliveries órfãos deletados")
        else:
            print("✅ Nenhum delivery órfão encontrado")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao limpar deliveries órfãos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 Limpando deliveries órfãos...\n")
    cleanup_orphan_deliveries()
