#!/usr/bin/env python3
"""
Script para iniciar o sistema em modo BETA
- Limpa o banco
- Roda o seed_beta.py
- Inicia o servidor backend
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}")
    print(f"💻 Comando: {cmd}")
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} concluído com sucesso!")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao {description.lower()}")
        print(f"Exit code: {e.returncode}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return False

def main():
    """Main function to setup BETA environment"""
    print("🚀 Configurando VouAjudar em modo BETA")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Step 1: Run seed beta
    if not run_command("python seed_beta.py", "Executando seed BETA"):
        print("❌ Falha ao executar seed BETA")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 Sistema BETA configurado com sucesso!")
    print("\n📱 Usuários disponíveis:")
    print("  🍽️  f1@j.com     - F1 - Fornecedor (senha: 123)")
    print("  🏠  a1@j.com     - A1 - Abrigo (senha: 123)")
    print("  🚚  v1@j.com     - V1 - Voluntário (senha: 123)")
    print("  ⚙️  adm@j.com    - ADM - Admin (senha: 123)")
    print("\n🔥 Para iniciar o backend:")
    print("   cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("\n🔥 Para iniciar o frontend:")
    print("   cd frontend && npm run dev")
    print("\n✨ Acesse: http://localhost:5173")

if __name__ == "__main__":
    main()
