#!/usr/bin/env python3
"""
Testar conexão com banco de produção
"""
import os
import sys
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

DATABASE_URL = os.getenv('PRODUCTION_DATABASE_URL')
if not DATABASE_URL:
    print("❌ PRODUCTION_DATABASE_URL não encontrada no .env")
    sys.exit(1)

print(f"🔗 Testando conexão: {DATABASE_URL[:50]}...")

try:
    from sqlalchemy import create_engine, text
    from app.models import User
    
    # Conectar ao banco de produção
    engine = create_engine(DATABASE_URL)
    
    # Testar conexão simples
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ Conexão básica funcionando")
        
        # Testar se tabela users existe
        try:
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            count = result.fetchone()[0]
            print(f"✅ Tabela users existe: {count} registros")
        except Exception as e:
            print(f"❌ Erro tabela users: {str(e)}")
        
        # Testar criar usuário
        try:
            from app.auth import get_password_hash
            hashed = get_password_hash("test123")
            print(f"✅ Hash de senha funcionando: {hashed[:20]}...")
        except Exception as e:
            print(f"❌ Erro hash senha: {str(e)}")
        
        # Testar modelo User
        try:
            user = User(
                email="test@test.com",
                hashed_password=get_password_hash("test123"),
                name="Test User",
                phone="32999999999",
                roles="volunteer"
            )
            print(f"✅ Modelo User criado: {user.email}")
        except Exception as e:
            print(f"❌ Erro modelo User: {str(e)}")
    
    print("\n🎉 Testes concluídos!")
    
except Exception as e:
    print(f"❌ Erro geral: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
