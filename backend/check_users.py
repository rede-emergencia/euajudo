#!/usr/bin/env python3
"""
Verificar usuários no banco para encontrar credenciais corretas
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database import engine
from sqlalchemy import text

def main():
    print("🔍 VERIFICANDO USUÁRIOS NO BANCO")
    print("=" * 50)
    
    with engine.connect() as conn:
        # Primeiro verificar schema da tabela
        result = conn.execute(text('PRAGMA table_info(users)'))
        columns = result.fetchall()
        print(f"📋 Colunas da tabela users: {[col[1] for col in columns]}")
        
        # Agora fazer a query correta
        result = conn.execute(text('''
            SELECT id, email, name, roles 
            FROM users 
            ORDER BY id
        '''))
        users = result.fetchall()
        
        print(f"📊 Total de usuários: {len(users)}")
        
        for user in users:
            print(f"\n👤 ID {user[0]}:")
            print(f"   📧 Email: {user[1]}")
            print(f"   📝 Nome: {user[2]}")
            print(f"   🏢 Roles: {user[3]}")
            
            # Mostrar sugestão de senha
            if 'abrigo' in user[1].lower():
                print(f"   🔑 Senha provável: centro123")
            elif 'admin' in user[1].lower():
                print(f"   🔑 Senha provável: admin123")
            elif 'joao' in user[1].lower() or 'voluntario' in user[1].lower():
                print(f"   🔑 Senha provável: joao123")

if __name__ == "__main__":
    main()
