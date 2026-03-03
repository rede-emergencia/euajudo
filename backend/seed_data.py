"""
Dados compartilhados para seeds
Centraliza todas as credenciais e informações para manter consistência
"""

# Credenciais universais (mesmas para todos os seeds)
ADMIN_CREDENTIALS = {
    "email": "admin@vouajudar.org",
    "password": "123",
    "name": "Administrador Eu Ajudo",
    "phone": "32999999999"
}

VOLUNTEERS = [
    {
        "email": "v1@vouajudar.org",
        "password": "123",
        "name": "João Voluntário",
        "phone": "32988887777"
    },
    {
        "email": "v2@vouajudar.org", 
        "password": "123",
        "name": "Maria Voluntária",
        "phone": "32977776666"
    }
]

SHELTERS = [
    {
        "email": "a1@vouajudar.org",
        "password": "123",
        "name": "Abrigo Centro de Operações",
        "phone": "32955554444",
        "address": "Praça da República, 100 - Centro, Juiz de Fora - MG",
        "latitude": -21.7642,
        "longitude": -43.3505,
        "contact_person": "Coordenador do Abrigo Centro"
    },
    {
        "email": "a2@vouajudar.org",
        "password": "123",
        "name": "Abrigo São Sebastião", 
        "phone": "32966665555",
        "address": "Rua São Sebastião, 200 - São Sebastião, Juiz de Fora - MG",
        "latitude": -21.7842,
        "longitude": -43.3705,
        "contact_person": "Responsável pelo Abrigo São Sebastião"
    }
]

PROVIDERS = [
    {
        "email": "c1@vouajudar.org",
        "password": "123",
        "name": "Cozinha Solidária",
        "phone": "32944443333",
        "address": "Avenida Brasil, 500 - Centro, Juiz de Fora - MG",
        "establishment_type": "restaurant",
        "production_capacity": 200,
        "delivery_capacity": 50,
        "operating_hours": "08:00-18:00"
    },
    {
        "email": "c2@vouajudar.org",
        "password": "123",
        "name": "Restaurante Comunitário",
        "phone": "32933332222", 
        "address": "Rua Rio de Janeiro, 300 - Floresta, Juiz de Fora - MG",
        "establishment_type": "restaurant",
        "production_capacity": 150,
        "delivery_capacity": 30,
        "operating_hours": "10:00-20:00"
    }
]

# Categorias essenciais para desastres
CATEGORIES = [
    {
        "name": "agua",
        "display_name": "Água",
        "description": "Água mineral",
        "icon": "💧",
        "color": "#3b82f6",
        "attributes": [
            {"name": "unidade", "display_name": "Unidade", "type": "select", "required": True, "options": [
                {"value": "litros", "label": "Litros"},
                {"value": "ml", "label": "Mililitros (ML)"}
            ]},
            {"name": "quantidade", "display_name": "Quantidade", "type": "number", "required": True, "min_value": 1}
        ]
    },
    {
        "name": "alimentos",
        "display_name": "Alimentos",
        "description": "Alimentos não perecíveis",
        "icon": "🥫",
        "color": "#f59e0b", 
        "attributes": [
            {"name": "quantidade_kg", "display_name": "Quantidade (kg)", "type": "number", "required": True, "min_value": 1},
            {"name": "tipo_alimento", "display_name": "Tipo de Alimento", "type": "text", "required": True}
        ]
    },
    {
        "name": "refeicoes_prontas",
        "display_name": "Refeições Prontas",
        "description": "Marmitas e refeições preparadas",
        "icon": "🍱",
        "color": "#10b981",
        "attributes": [
            {"name": "quantidade", "display_name": "Quantidade", "type": "number", "required": True, "min_value": 1},
            {"name": "tipo_refeicao", "display_name": "Tipo de Refeição", "type": "text", "required": True}
        ]
    },
    {
        "name": "higiene",
        "display_name": "Higiene",
        "description": "Itens de higiene pessoal",
        "icon": "🧼",
        "color": "#8b5cf6",
        "attributes": [
            {"name": "quantidade", "display_name": "Quantidade", "type": "number", "required": True, "min_value": 1},
            {"name": "tipo_item", "display_name": "Tipo de Item", "type": "text", "required": True}
        ]
    },
    {
        "name": "roupas",
        "display_name": "Roupas",
        "description": "Roupas e vestuário",
        "icon": "👕",
        "color": "#ef4444",
        "attributes": [
            {"name": "quantidade", "display_name": "Quantidade", "type": "number", "required": True, "min_value": 1},
            {"name": "tamanho", "display_name": "Tamanho", "type": "text", "required": True},
            {"name": "genero", "display_name": "Gênero", "type": "text", "required": True}
        ]
    },
    {
        "name": "medicamentos",
        "display_name": "Medicamentos",
        "description": "Medicamentos e itens de saúde",
        "icon": "💊",
        "color": "#06b6d4",
        "attributes": [
            {"name": "quantidade", "display_name": "Quantidade", "type": "number", "required": True, "min_value": 1},
            {"name": "tipo_medicamento", "display_name": "Tipo de Medicamento", "type": "text", "required": True}
        ]
    }
]

# Função para exibir credenciais de forma organizada
def print_credentials():
    """Exibe todas as credenciais de forma organizada"""
    print("\n" + "="*60)
    print("🔐 CREDENCIAIS DE ACESSO")
    print("="*60)
    
    print(f"\n👑 ADMINISTRADOR:")
    print(f"   Email: {ADMIN_CREDENTIALS['email']}")
    print(f"   Senha: {ADMIN_CREDENTIALS['password']}")
    
    print(f"\n🤝 VOLUNTÁRIOS:")
    for vol in VOLUNTEERS:
        print(f"   Email: {vol['email']} / Senha: {vol['password']}")
    
    print(f"\n🏠 ABRIGOS:")
    for shelter in SHELTERS:
        print(f"   Email: {shelter['email']} / Senha: {shelter['password']}")
    
    print(f"\n🍽️ FORNECEDORES:")
    for provider in PROVIDERS:
        print(f"   Email: {provider['email']} / Senha: {provider['password']}")
    
    print("\n" + "="*60)
