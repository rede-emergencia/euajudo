#!/usr/bin/env python3
"""
Script para verificar status do banco de dados
"""

import sys
import os

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Mudar para o diretório backend para garantir que use o .env correto
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.database import SessionLocal, engine
    from app import models
    
    # Criar tabelas se não existirem
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    users = db.query(models.User).count()
    locations = db.query(models.DeliveryLocation).count()
    batches = db.query(models.ProductBatch).count()
    deliveries = db.query(models.Delivery).count()
    requests = db.query(models.ResourceRequest).count()
    db.close()
    
    print('\033[0;32m✅ Status do Banco:\033[0m')
    print(f'   👥 Usuários: {users}')
    print(f'   🏠 Locais: {locations}')
    print(f'   📦 Batches: {batches}')
    print(f'   🚚 Deliveries: {deliveries}')
    print(f'   📋 Requests: {requests}')
    
    if users == 0 and locations == 0:
        print('\033[0;33m⚠️  Banco vazio - execute "make seed" para popular\033[0m')
    else:
        print('\033[0;32m✅ Banco contém dados\033[0m')
        
except Exception as e:
    print(f'\033[0;31m❌ Erro ao verificar banco: {e}\033[0m')
    sys.exit(1)
