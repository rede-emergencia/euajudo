#!/usr/bin/env python3
"""
Script para resetar banco de dados em produção (Render)
CUIDADO: Este script irá APAGAR TODOS os dados do banco de produção!
"""

import os
import sys
import traceback
from app.database import SessionLocal, engine
from app import models

def reset_production_database():
    """Reseta completamente o banco de dados em produção"""
    print("="*70)
    print("🚨 ATENÇÃO: RESETANDO BANCO DE DADOS DE PRODUÇÃO")
    print("="*70)
    
    # Verificar se estamos em produção
    env = os.getenv("ENVIRONMENT", "development")
    if env != "production":
        print(f"⚠️ Ambiente atual: {env}")
        response = input("🔒 Tem certeza que deseja continuar? (s/N): ")
        if response.lower() not in ['s', 'y']:
            print("❌ Operação cancelada")
            return False
    
    print("\n🗑️ Apagando todas as tabelas...")
    try:
        # Apagar todas as tabelas
        models.Base.metadata.drop_all(bind=engine)
        print("✅ Tabelas apagadas com sucesso")
    except Exception as e:
        print(f"❌ Erro ao apagar tabelas: {e}")
        return False
    
    print("\n🔨 Recriando tabelas...")
    try:
        # Recriar todas as tabelas
        models.Base.metadata.create_all(bind=engine)
        print("✅ Tabelas recriadas com sucesso")
    except Exception as e:
        print(f"❌ Erro ao recriar tabelas: {e}")
        return False
    
    print("\n🌱 Executando seed_small.py...")
    try:
        # Executar seed
        import seed_small
        seed_small.main()
        print("✅ Seed executado com sucesso")
    except Exception as e:
        print(f"❌ Erro no seed: {e}")
        traceback.print_exc()
        return False
    
    print("\n" + "="*70)
    print("✅ Banco de produção resetado com sucesso!")
    print("="*70)
    
    # Verificar dados
    print("\n📊 Verificando dados criados:")
    try:
        db = SessionLocal()
        user_count = db.query(models.User).count()
        location_count = db.query(models.DeliveryLocation).count()
        category_count = db.query(models.Category).count()
        db.close()
        
        print(f"   👤 Usuários: {user_count}")
        print(f"   🏠 Locais: {location_count}")
        print(f"   📦 Categorias: {category_count}")
    except Exception as e:
        print(f"⚠️ Erro ao verificar dados: {e}")
    
    return True

if __name__ == "__main__":
    try:
        success = reset_production_database()
        if success:
            print("\n🎉 Operação concluída com sucesso!")
            sys.exit(0)
        else:
            print("\n❌ Falha na operação")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Operação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Erro inesperado: {e}")
        traceback.print_exc()
        sys.exit(1)
