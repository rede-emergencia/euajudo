#!/usr/bin/env python3
"""
Teste simples de registro para debug
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

print(f"🔗 Testando registro simples: {DATABASE_URL[:50]}...")

try:
    from sqlalchemy import create_engine, text
    from app.auth import get_password_hash
    
    # Conectar ao banco de produção
    engine = create_engine(DATABASE_URL)
    
    # Testar inserção direta
    with engine.connect() as conn:
        # Verificar se usuário já existe
        result = conn.execute(text("SELECT id FROM users WHERE email = 'test_simple@test.com'"))
        if result.fetchone():
            print("❌ Usuário já existe")
        else:
            # Inserir usuário diretamente
            hashed = get_password_hash("123456")
            conn.execute(text("""
                INSERT INTO users (email, hashed_password, name, phone, roles, approved, active, created_at)
                VALUES ('test_simple@test.com', :password, 'Test Simple', '32999999999', 'volunteer', true, true, NOW())
            """), {"password": hashed})
            conn.commit()
            print("✅ Usuário inserido com sucesso!")
        
        # Verificar usuário
        result = conn.execute(text("SELECT email, name, roles FROM users WHERE email = 'test_simple@test.com'"))
        user = result.fetchone()
        if user:
            print(f"✅ Usuário encontrado: {user[0]} - {user[1]} ({user[2]})")
        else:
            print("❌ Usuário não encontrado")
    
    print("\n🎉 Teste concluído!")
    
except Exception as e:
    print(f"❌ Erro: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
