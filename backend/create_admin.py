#!/usr/bin/env python3
"""
Cria apenas o usuário administrador
Verifica se já existe antes de criar
"""

from app.database import SessionLocal, engine
from app.models import User
from app.auth import get_password_hash
from datetime import datetime

def create_admin():
    """Cria usuário admin se não existir"""
    db = SessionLocal()
    
    try:
        # Verificar se admin já existe
        existing_admin = db.query(User).filter(User.email == "admin@vouajudar.org").first()
        
        if existing_admin:
            print("👤 Admin já existe:")
            print(f"   • Email: {existing_admin.email}")
            print(f"   • Nome: {existing_admin.name}")
            print(f"   • ID: {existing_admin.id}")
            print(f"   • Criado em: {existing_admin.created_at}")
            return existing_admin
        
        # Criar admin
        admin_data = {
            'email': 'admin@vouajudar.org',
            'name': 'Administrador Vou Ajudar',
            'phone': '32999999999',
            'roles': 'admin',
            'hashed_password': get_password_hash("123"),
            'address': 'Rua da União, 100 - Centro, Juiz de Fora',
            'latitude': -21.736000,
            'longitude': -43.322000,
            'city_id': 'belo-horizonte',
            'approved': True,
            'active': True
        }
        
        admin = User(**admin_data)
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin criado com sucesso!")
        print(f"   • Email: {admin.email}")
        print(f"   • Senha: 123")
        print(f"   • ID: {admin.id}")
        
        return admin
        
    except Exception as e:
        print(f"❌ Erro ao criar admin: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("👤 Criando usuário administrador...")
    create_admin()
