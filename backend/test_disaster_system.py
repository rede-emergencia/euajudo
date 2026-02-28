#!/usr/bin/env python3
"""
Teste do sistema pós-catástrofe
Valida categorias essenciais e funcionalidades
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Category, Delivery, User, DeliveryLocation
from app.metadata_helpers import get_category_by_legacy_type, validate_metadata, format_metadata_for_display

def test_categories_setup():
    """Testa se categorias essenciais foram criadas"""
    print("\n" + "="*70)
    print("📦 TESTE 1: Categorias Essenciais para Desastres")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        categories = db.query(Category).filter(Category.active == True).all()
        
        expected_categories = [
            ("agua", "Água Potável", "💧"),
            ("alimentos", "Alimentos Não Perecíveis", "🥫"),
            ("mantimentos", "Mantimentos de Higiene", "🧼"),
            ("roupas", "Roupas e Vestuário", "👕"),
            ("medicamentos", "Medicamentos e Primeiros Socorros", "💊"),
            ("refeicoes", "Refeições Prontas", "🍱")
        ]
        
        print(f"\n✅ Encontradas {len(categories)} categorias ativas:")
        
        for name, display_name, icon in expected_categories:
            found = next((cat for cat in categories if cat.name == name), None)
            if found:
                print(f"  ✅ {found.display_name} {found.icon}")
                print(f"     - {len(found.attributes)} atributos")
                print(f"     - Legacy mapping: {found.legacy_product_type}")
                
                # Validar atributos essenciais
                if name == "agua":
                    required_attrs = ["volume", "tipo", "destino"]
                    attrs = [attr.name for attr in found.attributes]
                    missing = [req for req in required_attrs if req not in attrs]
                    if missing:
                        print(f"     ❌ Atributos faltando: {missing}")
                    else:
                        print(f"     ✅ Todos os atributos essenciais presentes")
                        
                elif name == "roupas":
                    required_attrs = ["tipo_roupa", "tamanho", "genero", "estado", "clima"]
                    attrs = [attr.name for attr in found.attributes]
                    missing = [req for req in required_attrs if req not in attrs]
                    if missing:
                        print(f"     ❌ Atributos faltando: {missing}")
                    else:
                        print(f"     ✅ Todos os atributos essenciais presentes")
            else:
                print(f"  ❌ {display_name} {icon} - NÃO ENCONTRADA")
        
        return len(categories) == len(expected_categories)
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    finally:
        db.close()

def test_deliveries_setup():
    """Testa se pedidos essenciais foram criados"""
    print("\n" + "="*70)
    print("📦 TESTE 2: Pedidos Essenciais nos Abrigos")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        deliveries = db.query(Delivery).all()
        locations = db.query(DeliveryLocation).all()
        
        print(f"\n✅ Encontrados {len(deliveries)} pedidos em {len(locations)} abrigos:")
        
        for location in locations:
            location_deliveries = [d for d in deliveries if d.location_id == location.id]
            print(f"\n🏠 {location.name}:")
            print(f"   - Capacidade: {location.capacity} pessoas")
            print(f"   - Necessidades diárias: {location.daily_need}")
            print(f"   - Pedidos: {len(location_deliveries)}")
            
            # Agrupar por categoria
            by_category = {}
            for delivery in location_deliveries:
                if delivery.category_id:
                    category = db.query(Category).filter(Category.id == delivery.category_id).first()
                    if category:
                        cat_name = category.display_name
                        if cat_name not in by_category:
                            by_category[cat_name] = []
                        by_category[cat_name].append(delivery)
            
            for cat_name, cat_deliveries in by_category.items():
                total_qty = sum(d.quantity for d in cat_deliveries)
                print(f"     • {cat_name}: {total_qty} unidades")
                
                # Mostrar metadados do primeiro pedido como exemplo
                if cat_deliveries and cat_deliveries[0].metadata_cache:
                    details = []
                    for key, value in cat_deliveries[0].metadata_cache.items():
                        details.append(f"{key}: {value}")
                    print(f"       Detalhes: {', '.join(details)}")
        
        return len(deliveries) >= 12  # Esperado: 6 categorias x 2 abrigos
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    finally:
        db.close()

def test_metadata_validation():
    """Testa validação de metadados para categorias essenciais"""
    print("\n" + "="*70)
    print("✅ TESTE 3: Validação de Metadados Essenciais")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        # Buscar categorias
        agua = db.query(Category).filter(Category.name == "agua").first()
        roupas = db.query(Category).filter(Category.name == "roupas").first()
        medicamentos = db.query(Category).filter(Category.name == "medicamentos").first()
        
        test_cases = [
            ("Água - Válido", agua.id, {
                "volume": "1L",
                "tipo": "potavel",
                "destino": "bebida"
            }),
            ("Água - Volume inválido", agua.id, {
                "volume": "2L",  # Não existe nas opções
                "tipo": "potavel",
                "destino": "bebida"
            }),
            ("Roupas - Válido", roupas.id, {
                "tipo_roupa": "camiseta",
                "tamanho": "M",
                "genero": "U",
                "estado": "usado_bom",
                "clima": "temperado"
            }),
            ("Roupas - Tamanho inválido", roupas.id, {
                "tipo_roupa": "camiseta",
                "tamanho": "XXXL",  # Não existe
                "genero": "U"
            }),
            ("Medicamentos - Válido", medicamentos.id, {
                "tipo_medicamento": "analgesico",
                "quantidade": "20 comprimidos",
                "validade": "longo",
                "uso": "adulto"
            }),
            ("Medicamentos - Atributo inexistente", medicamentos.id, {
                "tipo_medicamento": "analgesico",
                "cor": "vermelho",  # Atributo não existe
                "validade": "longo"
            })
        ]
        
        passed = 0
        total = len(test_cases)
        
        for test_name, category_id, metadata in test_cases:
            is_valid, errors = validate_metadata(db, category_id, metadata)
            
            if "Válido" in test_name:
                if is_valid:
                    print(f"  ✅ {test_name}: PASSOU")
                    passed += 1
                else:
                    print(f"  ❌ {test_name}: FALHOU - {errors}")
            else:
                if not is_valid:
                    print(f"  ✅ {test_name}: DETECTOU ERRO CORRETAMENTE")
                    passed += 1
                else:
                    print(f"  ❌ {test_name}: NÃO DETECTOU ERRO")
        
        print(f"\n📊 Validação: {passed}/{total} testes passaram")
        return passed == total
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    finally:
        db.close()

def test_admin_permissions():
    """Testa se admin tem permissões para gerenciar categorias"""
    print("\n" + "="*70)
    print("👤 TESTE 4: Permissões do Admin")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        admin = db.query(User).filter(User.email == "admin@vouajudar.org").first()
        
        if not admin:
            print("❌ Admin não encontrado")
            return False
        
        print(f"✅ Admin encontrado: {admin.name}")
        print(f"   • Email: {admin.email}")
        print(f"   • Roles: {admin.roles}")
        print(f"   • Ativo: {admin.active}")
        print(f"   • Aprovado: {admin.approved}")
        
        # Verificar se tem role admin
        has_admin_role = "admin" in admin.roles.lower()
        
        if has_admin_role:
            print("✅ Admin tem permissões de administrador")
            print("   • Pode gerenciar categorias via API: /categories/")
            print("   • Pode criar/atributos categorias: POST /categories/{id}/attributes")
            print("   • Pode ativar/desativar categorias: PATCH /categories/{id}")
        else:
            print("❌ Admin não tem role 'admin'")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    finally:
        db.close()

def test_disaster_readiness():
    """Testa se sistema está pronto para cenário pós-catástrofe"""
    print("\n" + "="*70)
    print("🚨 TESTE 5: Prontidão para Desastres")
    print("="*70)
    
    db = SessionLocal()
    
    try:
        # Verificar componentes essenciais
        users = db.query(User).all()
        locations = db.query(DeliveryLocation).all()
        categories = db.query(Category).filter(Category.active == True).all()
        deliveries = db.query(Delivery).all()
        
        print(f"\n📊 Status do Sistema:")
        print(f"  • Usuários: {len(users)}")
        print(f"  • Abrigos: {len(locations)}")
        print(f"  • Categorias ativas: {len(categories)}")
        print(f"  • Pedidos ativos: {len(deliveries)}")
        
        # Verificar capacidade total
        total_capacity = sum(loc.capacity or 0 for loc in locations)
        total_daily_need = sum(loc.daily_need or 0 for loc in locations)
        
        print(f"\n🏠 Capacidade dos Abrigos:")
        print(f"  • Capacidade total: {total_capacity} pessoas")
        print(f"  • Necessidades diárias: {total_daily_need} pessoas")
        
        # Verificar recursos por categoria
        resources_by_category = {}
        for delivery in deliveries:
            if delivery.category_id:
                category = db.query(Category).filter(Category.id == delivery.category_id).first()
                if category:
                    cat_name = category.display_name
                    if cat_name not in resources_by_category:
                        resources_by_category[cat_name] = 0
                    resources_by_category[cat_name] += delivery.quantity
        
        print(f"\n📦 Recursos Disponíveis:")
        for cat_name, total_qty in resources_by_category.items():
            per_person = total_qty / total_daily_need if total_daily_need > 0 else 0
            print(f"  • {cat_name}: {total_qty} unidades ({per_person:.1f} por pessoa)")
        
        # Verificar se atende requisitos mínimos
        requirements_met = True
        
        # Água: mínimo 1L por pessoa por dia
        agua_qty = resources_by_category.get("Água Potável", 0)
        if agua_qty < total_daily_need:
            print(f"  ❌ Água insuficiente: {agua_qty}L < {total_daily_need}L necessários")
            requirements_met = False
        else:
            print(f"  ✅ Água suficiente: {agua_qty}L >= {total_daily_need}L necessários")
        
        # Alimentos: mínimo 1 kit por pessoa
        alimentos_qty = resources_by_category.get("Alimentos Não Perecíveis", 0)
        if alimentos_qty < total_daily_need:
            print(f"  ❌ Alimentos insuficientes: {alimentos_qty} < {total_daily_need} necessários")
            requirements_met = False
        else:
            print(f"  ✅ Alimentos suficientes: {alimentos_qty} >= {total_daily_need} necessários")
        
        # Roupas: mínimo 1 peça por pessoa
        roupas_qty = resources_by_category.get("Roupas e Vestuário", 0)
        if roupas_qty < total_daily_need:
            print(f"  ❌ Roupas insuficientes: {roupas_qty} < {total_daily_need} necessárias")
            requirements_met = False
        else:
            print(f"  ✅ Roupas suficientes: {roupas_qty} >= {total_daily_need} necessárias")
        
        if requirements_met:
            print(f"\n🎉 SISTEMA PRONTO PARA CENÁRIO PÓS-CATÁSTROFE!")
            print(f"   • Todos os requisitos mínimos atendidos")
            print(f"   • {total_capacity} pessoas podem ser atendidas")
            print(f"   • Recursos essenciais disponíveis")
        else:
            print(f"\n⚠️  SISTEMA PRECISA DE AJUSTES")
            print(f"   • Alguns requisitos mínimos não atendidos")
            print(f"   • Considere adicionar mais recursos")
        
        return requirements_met
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    finally:
        db.close()

def main():
    """Executa todos os testes do sistema pós-catástrofe"""
    print("\n" + "="*70)
    print("🧪 TESTES DO SISTEMA PÓS-CATÁSTROFE")
    print("="*70)
    
    results = []
    
    # Teste 1: Categorias essenciais
    results.append(("Categorias essenciais", test_categories_setup()))
    
    # Teste 2: Pedidos essenciais
    results.append(("Pedidos essenciais", test_deliveries_setup()))
    
    # Teste 3: Validação de metadados
    results.append(("Validação de metadados", test_metadata_validation()))
    
    # Teste 4: Permissões do admin
    results.append(("Permissões do admin", test_admin_permissions()))
    
    # Teste 5: Prontidão para desastres
    results.append(("Prontidão para desastres", test_disaster_readiness()))
    
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
        print("\n💡 Sistema pós-catástrofe está pronto para produção!")
        print("   • 6 categorias essenciais configuradas")
        print("   • 2 abrigos operacionais")
        print("   • Pedidos essenciais criados")
        print("   • Admin com permissões de categorias")
        print("   • Validação de metadados funcionando")
        print("   • Sistema pronto para cenário real")
    else:
        print(f"\n⚠️  {total - passed} teste(s) falharam. Verifique os erros acima.")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
