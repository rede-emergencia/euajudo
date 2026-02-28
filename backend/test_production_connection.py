#!/usr/bin/env python3
"""
Testar conexão com banco de produção
"""
import os
import sys
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

PRODUCTION_DATABASE_URL = os.getenv('PRODUCTION_DATABASE_URL')

print("🔍 Testando conexão com banco de produção...")
print(f"URL: {PRODUCTION_DATABASE_URL}")

# Verificar se a URL está completa
if not PRODUCTION_DATABASE_URL:
    print("❌ PRODUCTION_DATABASE_URL não encontrada")
    sys.exit(1)

# Parse da URL para verificar componentes
try:
    from urllib.parse import urlparse
    parsed = urlparse(PRODUCTION_DATABASE_URL)
    
    print(f"📋 Componentes da URL:")
    print(f"  Scheme: {parsed.scheme}")
    print(f"  Username: {parsed.username}")
    print(f"  Hostname: {parsed.hostname}")
    print(f"  Port: {parsed.port}")
    print(f"  Database: {parsed.path[1:]}")  # Remove o /
    
    if not parsed.hostname:
        print("❌ Hostname não encontrado na URL")
        sys.exit(1)
    
    # Tentar resolver o hostname
    import socket
    try:
        ip = socket.gethostbyname(parsed.hostname)
        print(f"✅ Hostname resolvido: {parsed.hostname} -> {ip}")
    except socket.gaierror as e:
        print(f"❌ Erro ao resolver hostname: {e}")
        print("🔍 Verifique se o hostname está correto")
        sys.exit(1)
    
    # Tentar conectar ao banco
    import psycopg2
    try:
        conn = psycopg2.connect(PRODUCTION_DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Conexão bem-sucedida!")
        print(f"📊 PostgreSQL: {version[0]}")
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro na conexão PostgreSQL: {e}")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Erro geral: {e}")
    sys.exit(1)

print("\n✅ Teste concluído com sucesso!")
