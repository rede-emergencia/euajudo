#!/usr/bin/env python3
"""
Script de inicialização para produção no Render
Executa o seed se o banco estiver vazio, depois inicia a API
"""

import os
import sys
import traceback
from app.database import SessionLocal, engine
from app import models

def check_database_empty():
    """Verifica se o banco está vazio"""
    try:
        db = SessionLocal()
        user_count = db.query(models.User).count()
        location_count = db.query(models.DeliveryLocation).count()
        batch_count = db.query(models.ProductBatch).count()
        db.close()
        
        print(f"📊 Status do banco:")
        print(f"   • Usuários: {user_count}")
        print(f"   • Locais: {location_count}")
        print(f"   • Batches: {batch_count}")
        
        is_empty = user_count == 0 and location_count == 0 and batch_count == 0
        return is_empty
    except Exception as e:
        print(f"⚠️ Erro ao verificar banco: {e}")
        traceback.print_exc()
        return True  # Se der erro, assume que está vazio

def run_seed_if_needed():
    """Roda o seed se o banco estiver vazio"""
    try:
        if check_database_empty():
            print("\n🌱 Banco vazio detectado. Rodando seed...")
            try:
                # Importar e executar o seed
                import seed_improved
                print("📦 Módulo seed_improved importado com sucesso")
                seed_improved.main()
                print("✅ Seed concluído com sucesso!")
                return True
            except Exception as e:
                print(f"❌ Erro no seed: {e}")
                traceback.print_exc()
                # Tentar seed alternativo
                print("\n🔄 Tentando seed alternativo (seed.py)...")
                try:
                    import seed
                    seed.main()
                    print("✅ Seed alternativo concluído!")
                    return True
                except Exception as e2:
                    print(f"❌ Erro no seed alternativo: {e2}")
                    traceback.print_exc()
                    print("⚠️ Continuando sem seed...")
                    return False
        else:
            print("📊 Banco já contém dados. Pulando seed.")
            return True
    except Exception as e:
        print(f"❌ Erro crítico no processo de seed: {e}")
        traceback.print_exc()
        return False

def start_server():
    """Inicia o servidor FastAPI"""
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Iniciando servidor na porta {port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)

if __name__ == "__main__":
    print("="*70)
    print("🔧 EUAJUDO - Configurando ambiente de produção")
    print("="*70)
    
    # Criar tabelas
    print("\n📋 Criando/verificando tabelas do banco...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas/verificadas com sucesso")
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        traceback.print_exc()
        sys.exit(1)
    
    # Rodar seed se necessário
    print("\n" + "="*70)
    seed_success = run_seed_if_needed()
    print("="*70)
    
    if not seed_success:
        print("\n⚠️ ATENÇÃO: Seed não foi executado com sucesso!")
        print("   O sistema iniciará, mas pode não ter dados de teste.")
    
    # Iniciar servidor
    start_server()
