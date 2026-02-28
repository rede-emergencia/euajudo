#!/usr/bin/env python3
"""
Script para simplificar as categorias e metadados do sistema
Removendo campos complexos e mantendo apenas o essencial
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.models import Category, CategoryAttribute, Base
from app.category_schemas import CategoryCreate

def simplify_categories():
    """Simplifica as categorias com metadados reduzidos"""
    
    # Limpar categorias e atributos existentes
    Base.metadata.drop_all(bind=engine, tables=[CategoryAttribute.__table__, Category.__table__])
    Base.metadata.create_all(bind=engine, tables=[Category.__table__, CategoryAttribute.__table__])
    
    db = next(get_db())
    
    try:
        # Categorias simplificadas
        categories_data = [
            {
                "name": "agua",
                "display_name": "Água Potável",
                "description": "Água para consumo humano",
                "icon": "💧",
                "color": "#2196F3",
                "sort_order": 1,
                "attributes": []
                # Água: apenas quantidade (sem metadados)
            },
            {
                "name": "alimentos",
                "display_name": "Alimentos Não Perecíveis",
                "description": "Alimentos básicos e não perecíveis",
                "icon": "🥫",
                "color": "#FF9800",
                "sort_order": 2,
                "attributes": [
                    {
                        "name": "tipo",
                        "display_name": "Tipo",
                        "attribute_type": "select",
                        "required": True,
                        "sort_order": 1,
                        "options": [
                            {"value": "arroz", "label": "Arroz"},
                            {"value": "feijao", "label": "Feijão"},
                            {"value": "macarrao", "label": "Macarrão"},
                            {"value": "farinha", "label": "Farinha"},
                            {"value": "oleo", "label": "Óleo"},
                            {"value": "acucar", "label": "Açúcar"},
                            {"value": "sal", "label": "Sal"},
                            {"value": "conservas", "label": "Conservas"},
                            {"value": "outro", "label": "Outro"}
                        ]
                    }
                ]
            },
            {
                "name": "mantimentos",
                "display_name": "Mantimentos de Higiene",
                "description": "Itens essenciais de higiene pessoal",
                "icon": "🧼",
                "color": "#4CAF50",
                "sort_order": 3,
                "attributes": [
                    {
                        "name": "tipo",
                        "display_name": "Tipo",
                        "attribute_type": "select",
                        "required": True,
                        "sort_order": 1,
                        "options": [
                            {"value": "sabonete", "label": "Sabonete"},
                            {"value": "papel_higienico", "label": "Papel Higiênico"},
                            {"value": "pasta_dente", "label": "Pasta de Dente"},
                            {"value": "escova_dente", "label": "Escova de Dente"},
                            {"value": "fralda", "label": "Fraldas"},
                            {"value": "absorvente", "label": "Absorventes"},
                            {"value": "shampoo", "label": "Shampoo"},
                            {"value": "sabao_em_po", "label": "Sabão em Pó"},
                            {"value": "detergente", "label": "Detergente"},
                            {"value": "outro", "label": "Outro"}
                        ]
                    }
                ]
            },
            {
                "name": "roupas",
                "display_name": "Roupas e Vestuário",
                "description": "Roupas para diferentes idades e climas",
                "icon": "👕",
                "color": "#9C27B0",
                "sort_order": 4,
                "attributes": [
                    {
                        "name": "tipo",
                        "display_name": "Tipo",
                        "attribute_type": "select",
                        "required": True,
                        "sort_order": 1,
                        "options": [
                            {"value": "camiseta", "label": "Camiseta"},
                            {"value": "calca", "label": "Calça"},
                            {"value": "bermuda", "label": "Bermuda/Shorts"},
                            {"value": "blusa", "label": "Blusa/Moletom"},
                            {"value": "jaqueta", "label": "Jaqueta/Casaco"},
                            {"value": "meia", "label": "Meias"},
                            {"value": "calcado", "label": "Calçados"},
                            {"value": "cobertor", "label": "Cobertor/Lençol"},
                            {"value": "outro", "label": "Outro"}
                        ]
                    },
                    {
                        "name": "tamanho",
                        "display_name": "Tamanho",
                        "attribute_type": "select",
                        "required": False,
                        "sort_order": 2,
                        "options": [
                            {"value": "bebe", "label": "Bebê (0-2 anos)"},
                            {"value": "crianca", "label": "Criança (2-12 anos)"},
                            {"value": "adolescente", "label": "Adolescente (12-16 anos)"},
                            {"value": "PP", "label": "PP Adulto"},
                            {"value": "P", "label": "P Adulto"},
                            {"value": "M", "label": "M Adulto"},
                            {"value": "G", "label": "G Adulto"},
                            {"value": "GG", "label": "GG Adulto"}
                        ]
                    },
                    {
                        "name": "genero",
                        "display_name": "Gênero",
                        "attribute_type": "select",
                        "required": False,
                        "sort_order": 3,
                        "options": [
                            {"value": "M", "label": "Masculino"},
                            {"value": "F", "label": "Feminino"},
                            {"value": "U", "label": "Unissex"}
                        ]
                    }
                ]
            },
            {
                "name": "medicamentos",
                "display_name": "Medicamentos e Primeiros Socorros",
                "description": "Medicamentos essenciais e itens de primeiros socorros",
                "icon": "💊",
                "color": "#F44336",
                "sort_order": 5,
                "attributes": [
                    {
                        "name": "tipo",
                        "display_name": "Tipo",
                        "attribute_type": "select",
                        "required": True,
                        "sort_order": 1,
                        "options": [
                            {"value": "analgesico", "label": "Analgésico/Dor"},
                            {"value": "antitermico", "label": "Antitérmico/Febre"},
                            {"value": "anti_inflamatorio", "label": "Anti-inflamatório"},
                            {"value": "antibiotico", "label": "Antibiótico"},
                            {"value": "anti_alergico", "label": "Antialérgico"},
                            {"value": "curativo", "label": "Curativos/Gazes"},
                            {"value": "antisseptico", "label": "Antisséptico"},
                            {"value": "vitamina", "label": "Vitaminas"},
                            {"value": "soro", "label": "Soro/Hidratação"},
                            {"value": "outro", "label": "Outro"}
                        ]
                    }
                ]
            },
            {
                "name": "refeicoes",
                "display_name": "Refeições Prontas",
                "description": "Refeições preparadas para distribuição imediata",
                "icon": "🍱",
                "color": "#795548",
                "sort_order": 6,
                "attributes": [
                    {
                        "name": "tipo",
                        "display_name": "Tipo",
                        "attribute_type": "select",
                        "required": True,
                        "sort_order": 1,
                        "options": [
                            {"value": "cafe_manha", "label": "Café da Manhã"},
                            {"value": "almoco", "label": "Almoço"},
                            {"value": "jantar", "label": "Jantar"},
                            {"value": "lanche", "label": "Lanche/Lanche Rápido"}
                        ]
                    }
                ]
            }
        ]
        
        # Criar categorias
        for cat_data in categories_data:
            attributes = cat_data.pop("attributes", [])
            
            category = Category(
                active=True,
                **cat_data
            )
            db.add(category)
            db.flush()
            
            # Criar atributos
            for attr_data in attributes:
                attribute = CategoryAttribute(
                    category_id=category.id,
                    **attr_data
                )
                db.add(attribute)
        
        db.commit()
        
        print("✅ Categorias simplificadas criadas com sucesso!")
        print("\n📋 Resumo das simplificações:")
        print("   💧 Água: apenas quantidade")
        print("   🥫 Alimentos: quantidade + tipo")
        print("   🧼 Higiene: quantidade + tipo")
        print("   👕 Roupas: quantidade + tipo + tamanho + gênero")
        print("   💊 Medicamentos: quantidade + tipo")
        print("   🍱 Refeições: quantidade + tipo")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Simplificando categorias e metadados...")
    simplify_categories()
    print("\n✅ Processo concluído!")
