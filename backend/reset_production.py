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
    
    # Configurar ambiente para produção
    production_url = "postgresql://euajudo_user:niHQGFxb2EClbnS6Rvq86GDFS6fuexNM@dpg-d6h6fj0gjchc73cidakg-a.oregon-postgres.render.com/euajudo"
    
    os.environ["DATABASE_URL"] = production_url
    os.environ["ENVIRONMENT"] = "production"
    
    # Verificar se estamos em produção
    env = os.getenv("ENVIRONMENT", "development")
    if env != "production":
        print(f"⚠️ Ambiente atual: {env}")
        response = input("🔒 Tem certeza que deseja continuar? (s/N): ")
        if response.lower() not in ['s', 'y']:
            print("❌ Operação cancelada")
            return False
    
    print(f"\n🔗 Conectando ao banco de produção...")
    print(f"   URL: {production_url[:50]}...")
    
    # Recriar engine com URL de produção
    from sqlalchemy import create_engine
    production_engine = create_engine(production_url)
    
    print("\n🗑️ Apagando todas as tabelas...")
    try:
        # Apagar todas as tabelas com CASCADE para lidar com dependências
        models.Base.metadata.drop_all(bind=production_engine, cascade=True)
        print("✅ Tabelas apagadas com sucesso")
    except Exception as e:
        print(f"❌ Erro ao apagar tabelas: {e}")
        # Tentar abordagem alternativa: drop manual em ordem
        try:
            print("🔄 Tentando abordagem alternativa...")
            from sqlalchemy import text
            
            # Drop manual das tabelas em ordem reversa de dependência
            tables_to_drop = [
                'inventory_movements',
                'reservations', 'reservations_items',
                'resource_items', 'resource_requests',
                'deliveries', 'product_batches',
                'category_attributes', 'categories',
                'delivery_locations', 'users'
            ]
            
            with production_engine.connect() as conn:
                for table in tables_to_drop:
                    try:
                        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
                        print(f"  ✅ Dropped: {table}")
                    except Exception as table_e:
                        print(f"  ⚠️ Skip: {table} ({table_e})")
                conn.commit()
            
            print("✅ Tabelas apagadas com sucesso (abordagem alternativa)")
        except Exception as e2:
            print(f"❌ Erro na abordagem alternativa: {e2}")
            return False
    
    print("\n🔨 Recriando tabelas...")
    try:
        # Recriar todas as tabelas
        models.Base.metadata.create_all(bind=production_engine)
        print("✅ Tabelas recriadas com sucesso")
    except Exception as e:
        print(f"❌ Erro ao recriar tabelas: {e}")
        return False
    
    print("\n🌱 Executando seed_small.py...")
    try:
        # Executar seed com engine de produção
        import seed_small
        
        # Importar e reconfigurar o seed para usar engine de produção
        from app.database import get_db
        from sqlalchemy.orm import sessionmaker
        
        # Substituir engine e get_db do seed
        seed_small.engine = production_engine
        
        # Criar get_db personalizado que usa engine de produção
        ProductionSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=production_engine)
        def production_get_db():
            db = ProductionSessionLocal()
            try:
                yield db
            finally:
                db.close()
        
        # Substituir get_db temporariamente
        original_get_db = seed_small.get_db
        seed_small.get_db = production_get_db
        
        # Executar seed
        seed_small.main()
        
        # Restaurar get_db original
        seed_small.get_db = original_get_db
        
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
        # Usar a mesma engine de produção que o seed usou
        from sqlalchemy.orm import sessionmaker
        ProductionSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=production_engine)
        db = ProductionSessionLocal()
        
        user_count = db.query(models.User).count()
        location_count = db.query(models.DeliveryLocation).count()
        category_count = db.query(models.Category).count()
        
        print(f"   👤 Usuários: {user_count}")
        print(f"   🏠 Locais: {location_count}")
        print(f"   📦 Categorias: {category_count}")
        
        # Mostrar detalhes dos usuários para debug
        if user_count > 0:
            users = db.query(models.User).all()
            print(f"   📋 Detalhes dos usuários:")
            for user in users:
                print(f"      • {user.email} (roles: {user.roles})")
        
        db.close()
    except Exception as e:
        print(f"⚠️ Erro ao verificar dados: {e}")
        import traceback
        traceback.print_exc()
    
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
