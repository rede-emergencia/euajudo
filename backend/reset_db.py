#!/usr/bin/env python3
"""
Reset completo do banco de dados
Limpa todas as tabelas e recria estrutura vazia
"""

from app.database import engine
from app import models

def reset_database():
    """Limpa e recria todas as tabelas do banco"""
    print("🗑️ Resetando banco de dados...")
    
    try:
        # Drop all tables
        models.Base.metadata.drop_all(bind=engine)
        print("   • Tabelas removidas")
        
        # Create all tables
        models.Base.metadata.create_all(bind=engine)
        print("   • Tabelas recriadas")
        
        print("✅ Banco resetado com sucesso!")
        print("📋 Banco está vazio e pronto para novos dados")
        
    except Exception as e:
        print(f"❌ Erro ao resetar banco: {e}")
        return False
    
    return True

if __name__ == "__main__":
    reset_database()
