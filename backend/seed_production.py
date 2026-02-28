#!/usr/bin/env python3
"""
Script para popular banco de dados de produção (PostgreSQL)
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql
from datetime import datetime
import hashlib

# Carregar variáveis do .env
load_dotenv()

# Configuração
PRODUCTION_DATABASE_URL = os.getenv('PRODUCTION_DATABASE_URL')
if not PRODUCTION_DATABASE_URL:
    print("❌ PRODUCTION_DATABASE_URL não encontrada no .env")
    sys.exit(1)

def hash_password(password):
    """Hash de senha simples"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_tables(cursor):
    """Criar tabelas do banco"""
    print("📋 Criando tabelas...")
    
    # Tabela users
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            roles TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Tabela delivery_locations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS delivery_locations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            phone VARCHAR(50),
            email VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Tabela deliveries
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS deliveries (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER,
            location_id INTEGER REFERENCES delivery_locations(id),
            volunteer_id INTEGER REFERENCES users(id),
            parent_delivery_id INTEGER REFERENCES deliveries(id),
            product_type VARCHAR(50) NOT NULL,
            quantity INTEGER NOT NULL,
            status VARCHAR(50) DEFAULT 'available',
            pickup_code VARCHAR(50),
            delivery_code VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            accepted_at TIMESTAMP,
            picked_up_at TIMESTAMP,
            delivered_at TIMESTAMP,
            expires_at TIMESTAMP,
            estimated_time TIMESTAMP,
            photo_proof TEXT
        )
    """)
    
    print("✅ Tabelas criadas!")

def seed_data(cursor):
    """Popular dados iniciais"""
    print("🌱 Populando dados iniciais...")
    
    # Admin
    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, roles, is_active)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
    """, (
        'admin@vouajudar.org',
        hash_password('admin123'),
        'Administrador',
        '["admin"]',
        True
    ))
    
    # Voluntários
    volunteers = [
        ('joao@vouajudar.org', 'joao123', 'João Silva', '["volunteer"]'),
        ('maria@vouajudar.org', 'maria123', 'Maria Santos', '["volunteer"]')
    ]
    
    for email, password, name, roles in volunteers:
        cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, roles, is_active)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
        """, (email, hash_password(password), name, roles, True))
    
    # Pontos de coleta
    locations = [
        ('Ponto de Coleta Centro', 'Praça da República, 100 - Centro', -21.7642, -43.3505, 'centro@vouajudar.org', 'centro123'),
        ('Ponto de Coleta São Sebastião', 'Rua São Sebastião, 200', -21.7842, -43.3705, 'saosebastiao@vouajudar.org', 'saosebastiao123')
    ]
    
    for name, address, lat, lng, email, password in locations:
        cursor.execute("""
            INSERT INTO delivery_locations (name, address, latitude, longitude, email, is_active)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (name, address, lat, lng, email, True))
    
    # Pedidos de doações (deliveries)
    cursor.execute("SELECT id FROM delivery_locations WHERE name LIKE '%Centro%'")
    centro_result = cursor.fetchone()
    centro_id = centro_result[0] if centro_result else 1
    
    cursor.execute("SELECT id FROM delivery_locations WHERE name LIKE '%São Sebastião%'")
    sebastiao_result = cursor.fetchone()
    sebastiao_id = sebastiao_result[0] if sebastiao_result else 2
    
    # Criar pedidos para cada local
    orders = [
        (centro_id, 'clothing', 30),
        (centro_id, 'meal', 20),
        (sebastiao_id, 'clothing', 30),
        (sebastiao_id, 'meal', 20)
    ]
    
    for location_id, product_type, quantity in orders:
        cursor.execute("""
            INSERT INTO deliveries (location_id, product_type, quantity, status)
            VALUES (%s, %s, %s, %s)
        """, (location_id, product_type, quantity, 'available'))
    
    print("✅ Dados populados!")

def main():
    """Função principal"""
    print("=" * 60)
    print("🌱 SEED - BANCO DE DADOS DE PRODUÇÃO")
    print("=" * 60)
    
    try:
        # Conectar ao banco
        conn = psycopg2.connect(PRODUCTION_DATABASE_URL)
        cursor = conn.cursor()
        
        print(f"✅ Conectado ao banco de produção")
        
        # Criar tabelas
        create_tables(cursor)
        
        # Popular dados
        seed_data(cursor)
        
        # Commit
        conn.commit()
        conn.close()
        
        print("\n" + "=" * 60)
        print("✅ SEED CONCLUÍDO COM SUCESSO!")
        print("📊 Banco de produção populado")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
