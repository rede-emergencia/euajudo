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
        "description": "Água potável",
        "icon": "💧",
        "color": "#3b82f6",
        "attributes": [
            {
                "name": "tipo",
                "display_name": "Tipo",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "potavel", "label": "Água Potável"},
                    {"value": "mineral", "label": "Água Mineral"},
                    {"value": "filtrada", "label": "Água Filtrada"}
                ]
            },
            {
                "name": "unidade",
                "display_name": "Unidade",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "litros", "label": "Litros"}
                ]
            },
            {
                "name": "quantidade",
                "display_name": "Quantidade",
                "type": "number",
                "required": True,
                "min_value": 1
            }
        ]
    },
    {
        "name": "alimentos",
        "display_name": "Alimentos",
        "description": "Alimentos não perecíveis",
        "icon": "🥫",
        "color": "#f59e0b",
        "attributes": [
            {
                "name": "tipo",
                "display_name": "Tipo",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "arroz", "label": "Arroz"},
                    {"value": "feijao", "label": "Feijão"},
                    {"value": "macarrao", "label": "Macarrão"},
                    {"value": "oleo", "label": "Óleo"},
                    {"value": "acucar", "label": "Açúcar"},
                    {"value": "sal", "label": "Sal"},
                    {"value": "cafe", "label": "Café"},
                    {"value": "leite_po", "label": "Leite em Pó"},
                    {"value": "enlatados", "label": "Enlatados"},
                    {"value": "biscoitos", "label": "Biscoitos"}
                ]
            },
            {
                "name": "unidade",
                "display_name": "Unidade",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "kg", "label": "Kg"},
                    {"value": "pacote", "label": "Pacote"},
                    {"value": "lata", "label": "Lata"},
                    {"value": "unidade", "label": "Unidade"}
                ]
            },
            {
                "name": "quantidade",
                "display_name": "Quantidade",
                "type": "number",
                "required": True,
                "min_value": 1
            }
        ]
    },
    {
        "name": "refeicoes",
        "display_name": "Refeições Prontas",
        "description": "Marmitas e refeições prontas",
        "icon": "🍱",
        "color": "#10b981",
        "attributes": [
            {
                "name": "tipo",
                "display_name": "Tipo",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "marmita", "label": "Marmita"},
                    {"value": "lanche", "label": "Lanche"},
                    {"value": "sopa", "label": "Sopa"}
                ]
            },
            {
                "name": "unidade",
                "display_name": "Unidade",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "unidade", "label": "Unidade"}
                ]
            },
            {
                "name": "quantidade",
                "display_name": "Quantidade",
                "type": "number",
                "required": True,
                "min_value": 1
            }
        ]
    },
    {
        "name": "higiene",
        "display_name": "Higiene",
        "description": "Produtos de higiene pessoal",
        "icon": "🧼",
        "color": "#8b5cf6",
        "attributes": [
            {
                "name": "tipo",
                "display_name": "Tipo",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "sabonete", "label": "Sabonete"},
                    {"value": "shampoo", "label": "Shampoo"},
                    {"value": "pasta_dente", "label": "Pasta de Dente"},
                    {"value": "papel_higienico", "label": "Papel Higiênico"},
                    {"value": "absorvente", "label": "Absorvente"},
                    {"value": "fralda_adulto", "label": "Fralda Adulto"},
                    {"value": "fralda_bebe", "label": "Fralda Bebê"},
                    {"value": "kit_higiene", "label": "Kit Higiene"}
                ]
            },
            {
                "name": "unidade",
                "display_name": "Unidade",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "unidade", "label": "Unidade"},
                    {"value": "kit", "label": "Kit"}
                ]
            },
            {
                "name": "quantidade",
                "display_name": "Quantidade",
                "type": "number",
                "required": True,
                "min_value": 1
            }
        ]
    },
    {
        "name": "roupas",
        "display_name": "Roupas",
        "description": "Roupas e calçados",
        "icon": "👕",
        "color": "#ec4899",
        "attributes": [
            {
                "name": "tipo",
                "display_name": "Tipo",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "camiseta", "label": "Camiseta"},
                    {"value": "calca", "label": "Calça"},
                    {"value": "blusa", "label": "Blusa"},
                    {"value": "jaqueta", "label": "Jaqueta"},
                    {"value": "sapato", "label": "Sapato"},
                    {"value": "chinelo", "label": "Chinelo"},
                    {"value": "meia", "label": "Meia"},
                    {"value": "cobertor", "label": "Cobertor"},
                    {"value": "toalha", "label": "Toalha"}
                ]
            },
            {
                "name": "unidade",
                "display_name": "Unidade",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "unidade", "label": "Unidade"}
                ]
            },
            {
                "name": "tamanho",
                "display_name": "Tamanho",
                "type": "select",
                "required": False,
                "options": [
                    {"value": "pp", "label": "PP"},
                    {"value": "p", "label": "P"},
                    {"value": "m", "label": "M"},
                    {"value": "g", "label": "G"},
                    {"value": "gg", "label": "GG"},
                    {"value": "unico", "label": "Único"}
                ]
            },
            {
                "name": "quantidade",
                "display_name": "Quantidade",
                "type": "number",
                "required": True,
                "min_value": 1
            }
        ]
    },
    {
        "name": "medicamentos",
        "display_name": "Medicamentos",
        "description": "Medicamentos e primeiros socorros",
        "icon": "💊",
        "color": "#ef4444",
        "attributes": [
            {
                "name": "tipo",
                "display_name": "Tipo",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "analgesico", "label": "Analgésico"},
                    {"value": "antitermico", "label": "Antitérmico"},
                    {"value": "antibiotico", "label": "Antibiótico"},
                    {"value": "curativo", "label": "Material de Curativo"},
                    {"value": "kit_primeiros_socorros", "label": "Kit Primeiros Socorros"}
                ]
            },
            {
                "name": "unidade",
                "display_name": "Unidade",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "caixa", "label": "Caixa"},
                    {"value": "kit", "label": "Kit"},
                    {"value": "frasco", "label": "Frasco"}
                ]
            },
            {
                "name": "quantidade",
                "display_name": "Quantidade",
                "type": "number",
                "required": True,
                "min_value": 1
            }
        ]
    },
    {
        "name": "epi",
        "display_name": "EPI - Equipamento de Proteção",
        "description": "Equipamentos de Proteção Individual",
        "icon": "⛑️",
        "color": "#f97316",
        "attributes": [
            {
                "name": "tipo",
                "display_name": "Tipo de EPI",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "luvas", "label": "Luvas"},
                    {"value": "mascara", "label": "Máscara"},
                    {"value": "oculos", "label": "Óculos de Proteção"},
                    {"value": "capacete", "label": "Capacete"},
                    {"value": "bota", "label": "Bota de Segurança"},
                    {"value": "avental", "label": "Avental"},
                    {"value": "touca", "label": "Touca"},
                    {"value": "protetor_auricular", "label": "Protetor Auricular"}
                ]
            },
            {
                "name": "unidade",
                "display_name": "Unidade",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "unidade", "label": "Unidade"}
                ]
            },
            {
                "name": "quantidade",
                "display_name": "Quantidade",
                "type": "number",
                "required": True,
                "min_value": 1
            }
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
