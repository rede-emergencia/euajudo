#!/usr/bin/env python3
"""
Script para testar conexão com banco de produção PostgreSQL
"""

import os
import sys
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

def test_production_connection():
    """Testa conexão com o banco de produção"""
    print("="*70)
    print("🔧 TESTANDO CONEXÃO COM BANCO DE PRODUÇÃO")
    print("="*70)
    
    # Usar URL de produção
    production_url = "postgresql://euajudo_user:niHQGFxb2EClbnS6Rvq86GDFS6fuexNM@dpg-d6h6fj0gjchc73cidakg-a.oregon-postgres.render.com/euajudo"
    
    print(f"🔗 URL: {production_url[:50]}...")
    
    try:
        # Criar engine
        engine = create_engine(production_url)
        
        # Testar conexão
        with engine.connect() as connection:
            print("✅ Conexão estabelecida com sucesso!")
            
            # Verificar se o banco existe
            result = connection.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            print(f"📊 Banco de dados: {db_name}")
            
            # Contar tabelas
            result = connection.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            table_count = result.scalar()
            print(f"📋 Tabelas encontradas: {table_count}")
            
            # Listar tabelas
            result = connection.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            print(f"📋 Tabelas: {', '.join(tables)}")
            
            # Verificar se há usuários
            try:
                result = connection.execute(text("SELECT COUNT(*) FROM users"))
                user_count = result.scalar()
                print(f"👤 Usuários no banco: {user_count}")
            except:
                print("⚠️ Tabela 'users' não encontrada")
            
            return True
            
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False

def reset_production_database():
    """Reseta o banco de produção completamente"""
    print("\n" + "="*70)
    print("🚨 RESETANDO BANCO DE PRODUÇÃO")
    print("="*70)
    
    production_url = "postgresql://euajudo_user:niHQGFxb2EClbnS6Rvq86GDFS6fuexNM@dpg-d6h6fj0gjchc73cidakg-a.oregon-postgres.render.com/euajudo"
    
    try:
        engine = create_engine(production_url)
        
        with engine.connect() as connection:
            print("🗑️ Apagando todas as tabelas...")
            
            # Apagar tabelas em ordem correta
            tables_to_drop = [
                'order_events', 'orders',
                'reservation_items', 'resource_reservations', 
                'resource_items', 'resource_requests',
                'deliveries', 'product_batches',
                'category_attributes', 'categories',
                'delivery_locations', 'users'
            ]
            
            for table in tables_to_drop:
                try:
                    connection.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                    print(f"  ✅ Tabela {table} apagada")
                except Exception as e:
                    print(f"  ⚠️ Erro ao apagar {table}: {e}")
            
            connection.commit()
            print("✅ Tabelas apagadas com sucesso!")
            
        return True
        
    except Exception as e:
        print(f"❌ Erro ao resetar banco: {e}")
        return False

def run_migrations_and_seed():
    """Roda migrações e seed no banco de produção"""
    print("\n" + "="*70)
    print("🔧 RODANDO MIGRAÇÕES E SEED")
    print("="*70)
    
    # Configurar environment para produção
    os.environ["DATABASE_URL"] = "postgresql://euajudo_user:niHQGFxb2EClbnS6Rvq86GDFS6fuexNM@dpg-d6h6fj0gjchc73cidakg-a.oregon-postgres.render.com/euajudo"
    os.environ["ENVIRONMENT"] = "production"
    
    try:
        # Importar após configurar environment
        from app.database import engine, Base
        # Importar modelos para garantir que todos sejam registrados
        from app.models import (
            User, DeliveryLocation, ProductBatch, Delivery,
            Category, CategoryAttribute, ResourceRequest,
            ResourceItem, ResourceReservation, ReservationItem,
            Order, OrderEvent
        )
        
        print("🔨 Criando tabelas...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas com sucesso!")
        
        # Rodar seed
        print("\n🌱 Executando seed...")
        print(f"🔗 DATABASE_URL atual: {os.environ.get('DATABASE_URL', 'NÃO DEFINIDO')}")
        
        # Importar seed e configurar para usar nossa engine
        import seed_small
        # Sobrescrever a engine do seed com a nossa
        seed_small.engine = engine
        
        seed_small.main()
        print("✅ Seed executado com sucesso!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro nas migrações/seed: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_production_data():
    """Verifica os dados criados em produção"""
    print("\n" + "="*70)
    print("🔍 VERIFICANDO DADOS DE PRODUÇÃO")
    print("="*70)
    
    production_url = "postgresql://euajudo_user:niHQGFxb2EClbnS6Rvq86GDFS6fuexNM@dpg-d6h6fj0gjchc73cidakg-a.oregon-postgres.render.com/euajudo"
    
    try:
        engine = create_engine(production_url)
        
        with engine.connect() as connection:
            # Contar usuários
            result = connection.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            print(f"👤 Usuários: {user_count}")
            
            # Contar locais
            result = connection.execute(text("SELECT COUNT(*) FROM delivery_locations"))
            location_count = result.scalar()
            print(f"🏠 Locais: {location_count}")
            
            # Contar categorias
            result = connection.execute(text("SELECT COUNT(*) FROM categories"))
            category_count = result.scalar()
            print(f"📦 Categorias: {category_count}")
            
            # Listar categorias
            result = connection.execute(text("SELECT name, display_name FROM categories ORDER BY sort_order"))
            categories = result.fetchall()
            print(f"\n📋 Categorias criadas:")
            for cat in categories:
                print(f"  • {cat[1]} ({cat[0]})")
            
            # Verificar admin
            result = connection.execute(text("SELECT email, roles FROM users WHERE roles LIKE '%admin%'"))
            admin = result.fetchone()
            if admin:
                print(f"\n👑 Admin: {admin[0]} ({admin[1]})")
            
            return True
            
    except Exception as e:
        print(f"❌ Erro ao verificar dados: {e}")
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO CONFIGURAÇÃO DE PRODUÇÃO")
    
    # 1. Testar conexão
    if not test_production_connection():
        print("❌ Falha na conexão com banco de produção")
        sys.exit(1)
    
    # 2. Resetar banco
    print("\n🔄 Deseja resetar o banco de produção? (s/N)")
    response = input().strip().lower()
    if response == 's':
        if not reset_production_database():
            print("❌ Falha ao resetar banco")
            sys.exit(1)
    
    # 3. Rodar migrações e seed
    if not run_migrations_and_seed():
        print("❌ Falha nas migrações/seed")
        sys.exit(1)
    
    # 4. Verificar dados
    if not verify_production_data():
        print("❌ Falha na verificação de dados")
        sys.exit(1)
    
    print("\n" + "="*70)
    print("🎉 CONFIGURAÇÃO DE PRODUÇÃO CONCLUÍDA COM SUCESSO!")
    print("="*70)
    print("\n📋 Resumo:")
    print("  ✅ Conexão com PostgreSQL estabelecida")
    print("  ✅ Tabelas criadas")
    print("  ✅ Seed executado")
    print("  ✅ Dados verificados")
    print("\n🚀 Pronto para deploy no Render!")
