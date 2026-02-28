#!/usr/bin/env python3
"""
Teste simples de cancelamento - verificando login básico
"""

import requests
import json

# Configuração
BASE_URL = "http://localhost:8000"

def login(email, password="123"):
    """Fazer login e retornar token"""
    form_data = {
        "username": email,
        "password": password
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", data=form_data)
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    else:
        print(f"❌ Erro no login {email}: {response.status_code} - {response.text}")
        return None

def main():
    print("🧪 Teste Simples de Login")
    print("=" * 30)
    
    # Testar login com usuários existentes
    users = [
        "joao.voluntario@euajudo.com",  # voluntário
        "restaurante.bom.sabor@euajudo.com",  # provider
        "admin@euajudo.com"  # admin
    ]
    
    for email in users:
        print(f"\n🔑 Testando login: {email}")
        headers = login(email)
        if headers:
            print(f"✅ Login bem-sucedido: {email}")
            
            # Testar获取用户信息
            response = requests.get(f"{BASE_URL}/api/users/me", headers=headers)
            if response.status_code == 200:
                user_info = response.json()
                print(f"   👤 Nome: {user_info.get('name', 'N/A')}")
                print(f"   📧 Email: {user_info.get('email', 'N/A')}")
                print(f"   🎭 Roles: {user_info.get('roles', 'N/A')}")
            else:
                print(f"❌ Erro ao obter info: {response.status_code}")
        else:
            print(f"❌ Falha no login: {email}")
    
    print("\n" + "=" * 30)
    print("🎯 Teste concluído!")

if __name__ == "__main__":
    main()
