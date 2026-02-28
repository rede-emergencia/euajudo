#!/usr/bin/env python3
"""
Script para gerenciar banco de dados do Render em produção
"""
import os
import requests
import sqlite3
import sys
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

# Configuração
RENDER_API_TOKEN = os.getenv('RENDER_API_TOKEN')
if not RENDER_API_TOKEN:
    print("❌ RENDER_API_TOKEN não encontrado no .env")
    sys.exit(1)

def get_render_database_info():
    """Obter informações do banco de dados do Render"""
    print("🔍 Usando PRODUCTION_DATABASE_URL do .env...")
    
    # Usar a URL direta do .env
    connection_url = os.getenv('PRODUCTION_DATABASE_URL')
    
    if not connection_url:
        print("❌ PRODUCTION_DATABASE_URL não encontrada no .env")
        return None
    
    print(f"✅ Connection URL obtida: {connection_url[:50]}...")
    return connection_url

def clear_production_db(connection_url):
    """Limpar banco de dados em produção"""
    print("🗑️ Limpando banco de dados em produção...")
    
    try:
        import psycopg2
        from psycopg2 import sql
        
        # Conectar ao banco PostgreSQL
        conn = psycopg2.connect(connection_url)
        cursor = conn.cursor()
        
        # Listar todas as tabelas
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        """)
        tables = cursor.fetchall()
        
        print(f"📋 Encontradas {len(tables)} tabelas")
        
        # Deletar todas as tabelas (CASCADE lida com dependências)
        for table in tables:
            table_name = table[0]
            cursor.execute(sql.SQL("DROP TABLE IF EXISTS {} CASCADE").format(
                sql.Identifier(table_name)
            ))
            print(f"  🗑️ Tabela {table_name} deletada")
        
        conn.commit()
        conn.close()
        
        print("✅ Banco de dados limpo com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao limpar banco: {str(e)}")
        return False

def seed_production_db(connection_url):
    """Popular banco de dados em produção com seed small"""
    print("🌱 Populando banco de dados em produção...")
    
    try:
        # Executar script de seed para produção
        import subprocess
        result = subprocess.run([
            'python3', 'seed_production.py'
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            print("✅ Seed executado com sucesso!")
            print(result.stdout)
            return True
        else:
            print(f"❌ Erro no seed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao executar seed: {str(e)}")
        return False

def main():
    """Função principal"""
    print("=" * 60)
    print("🚀 GERENCIADOR DE BANCO DE DADOS - PRODUÇÃO RENDER")
    print("=" * 60)
    
    # Obter informações do banco
    connection_url = get_render_database_info()
    if not connection_url:
        print("❌ Não foi possível obter informações do banco")
        return
    
    print(f"\n📍 Banco: {connection_url[:50]}...")
    
    # Confirmar operação
    response = input("\n⚠️  ATENÇÃO: Isso vai limpar TODOS os dados de produção! Continuar? (s/N): ")
    if response.lower() != 's':
        print("❌ Operação cancelada")
        return
    
    # Limpar banco
    if not clear_production_db(connection_url):
        print("❌ Falha ao limpar banco")
        return
    
    # Popular banco
    if not seed_production_db(connection_url):
        print("❌ Falha ao popular banco")
        return
    
    print("\n" + "=" * 60)
    print("✅ OPERAÇÃO CONCLUÍDA COM SUCESSO!")
    print("📊 Banco de produção limpo e populado")
    print("=" * 60)

if __name__ == "__main__":
    main()
