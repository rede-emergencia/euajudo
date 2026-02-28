#!/usr/bin/env python3
"""
Script de inicialização para produção no Render
Executa o seed se o banco estiver vazio, depois inicia a API
"""

import os
import sys
from app.database import SessionLocal, engine
from app import models

def check_database_empty():
    """Verifica se o banco está vazio"""
    try:
        db = SessionLocal()
        user_count = db.query(models.User).count()
        db.close()
        return user_count == 0
    except:
        return True  # Se der erro, assume que está vazio

def run_seed_if_needed():
    """Roda o seed se o banco estiver vazio"""
    if check_database_empty():
        print("🌱 Banco vazio detectado. Rodando seed...")
        try:
            # Importar e executar o seed
            import seed_improved
            seed_improved.main()
            print("✅ Seed concluído com sucesso!")
        except Exception as e:
            print(f"❌ Erro no seed: {e}")
            # Não falha completamente se o seed der erro
            print("⚠️ Continuando sem seed...")
    else:
        print("📊 Banco já contém dados. Pulando seed.")

def start_server():
    """Inicia o servidor FastAPI"""
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Iniciando servidor na porta {port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)

if __name__ == "__main__":
    print("🔧 Configurando ambiente de produção...")
    
    # Criar tabelas
    print("📋 Criando tabelas...")
    models.Base.metadata.create_all(bind=engine)
    
    # Rodar seed se necessário
    run_seed_if_needed()
    
    # Iniciar servidor
    start_server()
