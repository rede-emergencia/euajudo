#!/usr/bin/env python3
"""
Inicializar banco de dados de produção no Render
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

print(f"🔗 Conectando ao banco: {DATABASE_URL[:50]}...")

try:
    from sqlalchemy import create_engine, text
    from app.database import Base
    
    # Conectar ao banco de produção
    engine = create_engine(DATABASE_URL)
    
    # Criar todas as tabelas
    print("📋 Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    
    # Verificar se tabelas foram criadas
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        """))
        tables = result.fetchall()
        
        print(f"✅ Tabelas criadas: {len(tables)}")
        for table in tables:
            print(f"   - {table[0]}")
    
    print("\n🎉 Banco de produção inicializado com sucesso!")
    
except Exception as e:
    print(f"❌ Erro ao inicializar banco: {str(e)}")
    sys.exit(1)
