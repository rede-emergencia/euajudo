"""
Seed de categorias de serviços para voluntários
Prepara o sistema para aceitar diferentes tipos de serviços voluntários
"""
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import Category, CategoryAttribute
import json

def seed_service_categories():
    """Cria categorias de serviços com atributos configuráveis"""
    
    db = SessionLocal()
    
    try:
        print("🛠️ Criando categorias de serviços voluntários...")
        
        services = [
            {
                "name": "servico_limpeza",
                "display_name": "Serviço de Limpeza",
                "description": "Limpeza de ambientes, organização, desinfecção",
                "icon": "🧹",
                "color": "#3b82f6",
                "attributes": [
                    {
                        "name": "tipo_limpeza",
                        "display_name": "Tipo de Limpeza",
                        "attribute_type": "select",
                        "required": True,
                        "options": [
                            {"value": "geral", "label": "Limpeza Geral"},
                            {"value": "pesada", "label": "Limpeza Pesada"},
                            {"value": "organizacao", "label": "Organização"},
                            {"value": "desinfeccao", "label": "Desinfecção"}
                        ]
                    },
                    {
                        "name": "duracao_horas",
                        "display_name": "Duração Estimada (horas)",
                        "attribute_type": "number",
                        "required": True,
                        "min_value": 1,
                        "max_value": 12
                    },
                    {
                        "name": "pessoas_necessarias",
                        "display_name": "Número de Voluntários Necessários",
                        "attribute_type": "number",
                        "required": True,
                        "min_value": 1,
                        "max_value": 10
                    }
                ]
            },
            {
                "name": "servico_manutencao",
                "display_name": "Serviço de Manutenção",
                "description": "Reparos elétricos, hidráulicos, carpintaria",
                "icon": "🔧",
                "color": "#f59e0b",
                "attributes": [
                    {
                        "name": "tipo_manutencao",
                        "display_name": "Tipo de Manutenção",
                        "attribute_type": "select",
                        "required": True,
                        "options": [
                            {"value": "eletrica", "label": "Elétrica"},
                            {"value": "hidraulica", "label": "Hidráulica"},
                            {"value": "carpintaria", "label": "Carpintaria"},
                            {"value": "pintura", "label": "Pintura"},
                            {"value": "alvenaria", "label": "Alvenaria"}
                        ]
                    },
                    {
                        "name": "urgencia",
                        "display_name": "Nível de Urgência",
                        "attribute_type": "select",
                        "required": True,
                        "options": [
                            {"value": "baixa", "label": "Baixa - Pode aguardar"},
                            {"value": "media", "label": "Média - Próximos dias"},
                            {"value": "alta", "label": "Alta - Urgente"}
                        ]
                    },
                    {
                        "name": "requer_material",
                        "display_name": "Requer Material",
                        "attribute_type": "boolean",
                        "required": True
                    }
                ]
            },
            {
                "name": "servico_jardinagem",
                "display_name": "Serviço de Jardinagem",
                "description": "Poda de árvores, corte de grama, limpeza de terreno",
                "icon": "🌳",
                "color": "#10b981",
                "attributes": [
                    {
                        "name": "tipo_jardinagem",
                        "display_name": "Tipo de Serviço",
                        "attribute_type": "select",
                        "required": True,
                        "options": [
                            {"value": "poda", "label": "Poda de Árvores"},
                            {"value": "corte_grama", "label": "Corte de Grama"},
                            {"value": "limpeza_terreno", "label": "Limpeza de Terreno"},
                            {"value": "plantio", "label": "Plantio/Jardinagem"}
                        ]
                    },
                    {
                        "name": "area_m2",
                        "display_name": "Área Aproximada (m²)",
                        "attribute_type": "number",
                        "required": False,
                        "min_value": 1,
                        "max_value": 10000
                    }
                ]
            },
            {
                "name": "servico_ensino",
                "display_name": "Aulas e Capacitação",
                "description": "Aulas de reforço, cursos profissionalizantes, workshops",
                "icon": "📚",
                "color": "#8b5cf6",
                "attributes": [
                    {
                        "name": "tipo_ensino",
                        "display_name": "Tipo de Ensino",
                        "attribute_type": "select",
                        "required": True,
                        "options": [
                            {"value": "reforco_escolar", "label": "Reforço Escolar"},
                            {"value": "idiomas", "label": "Aulas de Idiomas"},
                            {"value": "informatica", "label": "Informática"},
                            {"value": "profissionalizante", "label": "Curso Profissionalizante"},
                            {"value": "artesanato", "label": "Artesanato"},
                            {"value": "musica", "label": "Música"}
                        ]
                    },
                    {
                        "name": "nivel",
                        "display_name": "Nível",
                        "attribute_type": "select",
                        "required": True,
                        "options": [
                            {"value": "basico", "label": "Básico"},
                            {"value": "intermediario", "label": "Intermediário"},
                            {"value": "avancado", "label": "Avançado"}
                        ]
                    },
                    {
                        "name": "num_alunos",
                        "display_name": "Número de Alunos",
                        "attribute_type": "number",
                        "required": True,
                        "min_value": 1,
                        "max_value": 50
                    }
                ]
            },
            {
                "name": "servico_saude",
                "display_name": "Serviços de Saúde",
                "description": "Atendimento médico, psicológico, odontológico",
                "icon": "⚕️",
                "color": "#ef4444",
                "attributes": [
                    {
                        "name": "tipo_atendimento",
                        "display_name": "Tipo de Atendimento",
                        "attribute_type": "select",
                        "required": True,
                        "options": [
                            {"value": "clinico_geral", "label": "Clínico Geral"},
                            {"value": "pediatria", "label": "Pediatria"},
                            {"value": "odontologia", "label": "Odontologia"},
                            {"value": "psicologia", "label": "Psicologia"},
                            {"value": "enfermagem", "label": "Enfermagem"},
                            {"value": "vacinacao", "label": "Vacinação"}
                        ]
                    },
                    {
                        "name": "num_atendimentos",
                        "display_name": "Número de Atendimentos",
                        "attribute_type": "number",
                        "required": True,
                        "min_value": 1,
                        "max_value": 100
                    }
                ]
            },
            {
                "name": "servico_transporte",
                "display_name": "Serviço de Transporte",
                "description": "Transporte de pessoas ou bens",
                "icon": "🚗",
                "color": "#06b6d4",
                "attributes": [
                    {
                        "name": "tipo_transporte",
                        "display_name": "Tipo de Transporte",
                        "attribute_type": "select",
                        "required": True,
                        "options": [
                            {"value": "pessoas", "label": "Transporte de Pessoas"},
                            {"value": "mudanca", "label": "Mudança/Transporte de Bens"},
                            {"value": "emergencia", "label": "Transporte de Emergência"}
                        ]
                    },
                    {
                        "name": "distancia_km",
                        "display_name": "Distância Aproximada (km)",
                        "attribute_type": "number",
                        "required": False,
                        "min_value": 1,
                        "max_value": 500
                    }
                ]
            }
        ]
        
        created_count = 0
        
        for service_data in services:
            # Verificar se categoria já existe
            existing = db.query(Category).filter(Category.name == service_data["name"]).first()
            if existing:
                print(f"  ⏭️  Categoria já existe: {service_data['display_name']}")
                continue
            
            # Criar categoria
            category = Category(
                name=service_data["name"],
                display_name=service_data["display_name"],
                description=service_data["description"],
                icon=service_data["icon"],
                color=service_data["color"],
                active=True
            )
            db.add(category)
            db.flush()  # Para obter o ID
            
            # Criar atributos
            for attr_data in service_data["attributes"]:
                attribute = CategoryAttribute(
                    category_id=category.id,
                    name=attr_data["name"],
                    display_name=attr_data["display_name"],
                    attribute_type=attr_data["attribute_type"],
                    required=attr_data.get("required", False),
                    options=json.dumps(attr_data.get("options")) if attr_data.get("options") else None,
                    min_value=attr_data.get("min_value"),
                    max_value=attr_data.get("max_value"),
                    active=True
                )
                db.add(attribute)
            
            created_count += 1
            print(f"  ✅ Categoria criada: {service_data['display_name']}")
            print(f"     - {len(service_data['attributes'])} atributos configurados")
        
        db.commit()
        
        print(f"\n✅ Seed de serviços concluído!")
        print(f"   {created_count} categorias de serviços criadas")
        
    except Exception as e:
        print(f"❌ Erro ao criar categorias de serviços: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🛠️ SEED DE CATEGORIAS DE SERVIÇOS VOLUNTÁRIOS")
    print("=" * 60)
    seed_service_categories()
