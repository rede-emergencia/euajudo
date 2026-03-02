#!/usr/bin/env python3
"""
Teste simples do endpoint de categorias
"""

import requests
import json
from fastapi import FastAPI
from app.database import engine
from app.models import Category
from sqlalchemy.orm import Session
from sqlalchemy import text

def test_direct_query():
    """Testa query direta no banco"""
    print("🔍 Testando query direta no banco...")
    
    with engine.connect() as conn:
        result = conn.execute(text('''
            SELECT id, name, display_name, active, created_at 
            FROM categories 
            WHERE active = 1 
            ORDER BY sort_order, display_name
            LIMIT 5
        '''))
        
        categories = result.fetchall()
        print(f"✅ Query direta funcionou: {len(categories)} categorias")
        
        for cat in categories:
            print(f"   📦 {cat[0]}: {cat[2]} ({cat[1]})")
            
        return categories

def test_model_query():
    """Testa query usando modelo SQLAlchemy"""
    print("\n🔍 Testando query com modelo SQLAlchemy...")
    
    with Session(engine) as session:
        try:
            categories = session.query(Category).filter(Category.active == True).all()
            print(f"✅ Query com modelo funcionou: {len(categories)} categorias")
            
            for cat in categories[:5]:
                print(f"   📦 {cat.id}: {cat.display_name} ({cat.name})")
                
            return categories
        except Exception as e:
            print(f"❌ Erro na query com modelo: {e}")
            return []

def test_serialization():
    """Testa serialização manual"""
    print("\n🔍 Testando serialização manual...")
    
    with Session(engine) as session:
        try:
            categories = session.query(Category).filter(Category.active == True).all()
            
            serialized = []
            for cat in categories:
                cat_data = {
                    "id": cat.id,
                    "name": cat.name,
                    "display_name": cat.display_name,
                    "description": cat.description,
                    "icon": cat.icon,
                    "color": cat.color,
                    "active": cat.active,
                    "created_at": cat.created_at.isoformat() if cat.created_at else None
                }
                serialized.append(cat_data)
            
            print(f"✅ Serialização funcionou: {len(serialized)} categorias")
            for cat in serialized[:3]:
                print(f"   📦 {cat['id']}: {cat['display_name']}")
                
            return serialized
        except Exception as e:
            print(f"❌ Erro na serialização: {e}")
            import traceback
            traceback.print_exc()
            return []

def test_api_endpoint():
    """Testa endpoint da API"""
    print("\n🔍 Testando endpoint da API...")
    
    try:
        response = requests.get('http://localhost:8000/api/categories/')
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API funcionou: {len(data)} categorias")
            for cat in data[:3]:
                print(f"   📦 {cat.get('id')}: {cat.get('display_name')}")
        else:
            print(f"❌ Erro na API: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception na API: {e}")

def main():
    print("🧪 TESTE COMPLETO DAS CATEGORIAS")
    print("=" * 50)
    
    # Testes progressivos
    test_direct_query()
    test_model_query()
    test_serialization()
    test_api_endpoint()
    
    print("\n" + "=" * 50)
    print("🎯 CONCLUSÃO:")
    print("Se todos os testes acima funcionaram, o problema está no FastAPI/Pydantic")
    print("Se algum teste falhou, o problema está na query ou serialização")

if __name__ == "__main__":
    main()
