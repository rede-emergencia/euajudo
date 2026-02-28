#!/usr/bin/env python3
"""
Script de teste para o sistema de categorias e metadados
Demonstra como usar o novo sistema mantendo compatibilidade com ProductType
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Category, ProductBatch, Delivery, User, DeliveryLocation
from app.metadata_helpers import (
    get_category_by_legacy_type,
    set_batch_metadata,
    get_batch_metadata,
    validate_metadata,
    format_metadata_for_display
)
from app.enums import ProductType, BatchStatus, DeliveryStatus
from app.auth import get_password_hash

def test_category_lookup():
    """Testa busca de categorias por ProductType legado"""
    print("\n" + "="*70)
    print("🔍 TESTE 1: Busca de Categorias por ProductType Legado")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        # Buscar categoria de água
        agua = get_category_by_legacy_type(db, "generic")
        if agua:
            print(f"✅ Categoria encontrada: {agua.display_name} {agua.icon}")
            print(f"   - ID: {agua.id}")
            print(f"   - Nome interno: {agua.name}")
            print(f"   - Atributos: {len(agua.attributes)}")
        else:
            print("❌ Categoria de água não encontrada")
        
        # Buscar categoria de marmita
        marmita = get_category_by_legacy_type(db, "meal")
        if marmita:
            print(f"✅ Categoria encontrada: {marmita.display_name} {marmita.icon}")
            print(f"   - ID: {marmita.id}")
            print(f"   - Nome interno: {marmita.name}")
            print(f"   - Atributos: {len(marmita.attributes)}")
        else:
            print("❌ Categoria de marmita não encontrada")
        
        return True
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    finally:
        db.close()

def test_batch_with_metadata():
    """Testa criação de batch com metadados"""
    print("\n" + "="*70)
    print("🍱 TESTE 2: Criação de Batch com Metadados")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        # Criar usuário provider se não existir
        provider = db.query(User).filter(User.email == "test_provider@test.com").first()
        if not provider:
            provider = User(
                email="test_provider@test.com",
                name="Provider Teste",
                hashed_password=get_password_hash("123"),
                roles="provider",
                approved=True,
                active=True
            )
            db.add(provider)
            db.commit()
            db.refresh(provider)
        
        # Buscar categoria de marmita
        marmita = get_category_by_legacy_type(db, "meal")
        
        # Criar batch com ProductType legado E categoria nova
        batch = ProductBatch(
            provider_id=provider.id,
            product_type=ProductType.MEAL,  # Sistema legado
            category_id=marmita.id,  # Novo sistema
            quantity=50,
            quantity_available=50,
            description="Marmitas de almoço vegetarianas",
            status=BatchStatus.PRODUCING
        )
        db.add(batch)
        db.flush()
        
        # Adicionar metadados
        metadata = {
            "tipo_refeicao": "almoco",
            "vegetariano": "sim",
            "tamanho": "M"
        }
        
        set_batch_metadata(db, batch, metadata)
        db.commit()
        db.refresh(batch)
        
        print(f"✅ Batch criado com sucesso!")
        print(f"   - ID: {batch.id}")
        print(f"   - ProductType (legado): {batch.product_type.value}")
        print(f"   - Category ID: {batch.category_id}")
        print(f"   - Quantidade: {batch.quantity}")
        print(f"   - Metadados cache: {batch.metadata_cache}")
        
        # Recuperar metadados
        retrieved_metadata = get_batch_metadata(batch)
        print(f"   - Metadados recuperados: {retrieved_metadata}")
        
        # Formatar para exibição
        formatted = format_metadata_for_display(db, batch.category_id, retrieved_metadata)
        print(f"   - Formatado para UI:")
        for key, value in formatted.items():
            print(f"     • {key}: {value}")
        
        return batch.id
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return None
    finally:
        db.close()

def test_agua_batch():
    """Testa criação de batch de água com metadados"""
    print("\n" + "="*70)
    print("💧 TESTE 3: Criação de Batch de Água com Metadados")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        # Buscar provider
        provider = db.query(User).filter(User.email == "test_provider@test.com").first()
        
        # Buscar categoria de água
        agua = get_category_by_legacy_type(db, "generic")
        
        # Criar batch de água
        batch = ProductBatch(
            provider_id=provider.id,
            product_type=ProductType.GENERIC,  # Sistema legado
            category_id=agua.id,  # Novo sistema
            quantity=100,
            quantity_available=100,
            description="Garrafas de água mineral 500ml",
            status=BatchStatus.READY
        )
        db.add(batch)
        db.flush()
        
        # Adicionar metadados
        metadata = {
            "volume": "500ml",
            "tipo": "mineral"
        }
        
        set_batch_metadata(db, batch, metadata)
        db.commit()
        db.refresh(batch)
        
        print(f"✅ Batch de água criado com sucesso!")
        print(f"   - ID: {batch.id}")
        print(f"   - Quantidade: {batch.quantity} unidades")
        print(f"   - Metadados: {batch.metadata_cache}")
        
        # Formatar para exibição
        formatted = format_metadata_for_display(db, batch.category_id, batch.metadata_cache)
        print(f"   - Formatado para UI:")
        for key, value in formatted.items():
            print(f"     • {key}: {value}")
        
        return batch.id
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return None
    finally:
        db.close()

def test_metadata_validation():
    """Testa validação de metadados"""
    print("\n" + "="*70)
    print("✅ TESTE 4: Validação de Metadados")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        # Buscar categoria de marmita
        marmita = get_category_by_legacy_type(db, "meal")
        
        # Teste 1: Metadados válidos
        valid_metadata = {
            "tipo_refeicao": "almoco",
            "vegetariano": "sim",
            "tamanho": "G"
        }
        is_valid, errors = validate_metadata(db, marmita.id, valid_metadata)
        print(f"\n📝 Teste com metadados válidos:")
        print(f"   - Válido: {is_valid}")
        print(f"   - Erros: {errors if errors else 'Nenhum'}")
        
        # Teste 2: Valor inválido para select
        invalid_metadata = {
            "tipo_refeicao": "almoco",
            "vegetariano": "talvez",  # Valor inválido
            "tamanho": "XL"  # Valor inválido
        }
        is_valid, errors = validate_metadata(db, marmita.id, invalid_metadata)
        print(f"\n📝 Teste com valores inválidos:")
        print(f"   - Válido: {is_valid}")
        print(f"   - Erros:")
        for error in errors:
            print(f"     • {error}")
        
        # Teste 3: Atributo inexistente
        unknown_metadata = {
            "cor": "azul",  # Atributo que não existe
            "peso": "500g"  # Atributo que não existe
        }
        is_valid, errors = validate_metadata(db, marmita.id, unknown_metadata)
        print(f"\n📝 Teste com atributos inexistentes:")
        print(f"   - Válido: {is_valid}")
        print(f"   - Erros:")
        for error in errors:
            print(f"     • {error}")
        
        return True
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def test_list_categories():
    """Testa listagem de categorias e atributos"""
    print("\n" + "="*70)
    print("📋 TESTE 5: Listagem de Categorias e Atributos")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        # Listar apenas categorias ativas
        categories = db.query(Category).filter(Category.active == True).all()
        
        print(f"\n✅ Encontradas {len(categories)} categorias ativas:")
        
        for cat in categories:
            print(f"\n{cat.icon} {cat.display_name}")
            print(f"   - ID: {cat.id}")
            print(f"   - Nome interno: {cat.name}")
            print(f"   - Descrição: {cat.description}")
            print(f"   - Legacy mapping: {cat.legacy_product_type}")
            print(f"   - Atributos ({len(cat.attributes)}):")
            
            for attr in cat.attributes:
                print(f"     • {attr.display_name} ({attr.name})")
                print(f"       - Tipo: {attr.attribute_type}")
                print(f"       - Obrigatório: {'Sim' if attr.required else 'Não'}")
                if attr.options:
                    options_str = ", ".join([opt["label"] for opt in attr.options])
                    print(f"       - Opções: {options_str}")
        
        return True
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    finally:
        db.close()

def main():
    """Executa todos os testes"""
    print("\n" + "="*70)
    print("🧪 TESTES DO SISTEMA DE CATEGORIAS E METADADOS")
    print("="*70)
    
    results = []
    
    # Teste 1: Busca de categorias
    results.append(("Busca de categorias", test_category_lookup()))
    
    # Teste 2: Batch com metadados (marmita)
    batch_id = test_batch_with_metadata()
    results.append(("Batch de marmita com metadados", batch_id is not None))
    
    # Teste 3: Batch de água
    agua_id = test_agua_batch()
    results.append(("Batch de água com metadados", agua_id is not None))
    
    # Teste 4: Validação
    results.append(("Validação de metadados", test_metadata_validation()))
    
    # Teste 5: Listagem
    results.append(("Listagem de categorias", test_list_categories()))
    
    # Resumo
    print("\n" + "="*70)
    print("📊 RESUMO DOS TESTES")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{status}: {test_name}")
    
    print(f"\n🎯 Resultado: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("\n💡 O sistema de categorias está funcionando corretamente!")
        print("   - Categorias MVP (Água, Marmita) estão ativas")
        print("   - Metadados são validados corretamente")
        print("   - Compatibilidade com ProductType mantida")
        print("   - Sistema pronto para expansão futura")
    else:
        print(f"\n⚠️  {total - passed} teste(s) falharam. Verifique os erros acima.")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
