#!/usr/bin/env python3
"""
Script para verificar por que deliveries não aparecem como ícone vermelho no mapa
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database import engine
from sqlalchemy import text
import json

def main():
    print("🔍 VERIFICANDO DELIVERIES E MAPA")
    print("=" * 60)
    
    with engine.connect() as conn:
        # 1. Verificar shelter requests
        print("\n📋 SHELTER REQUESTS:")
        result = conn.execute(text('''
            SELECT id, shelter_id, category_id, quantity_requested, status, created_at
            FROM shelter_requests 
            ORDER BY created_at DESC
        '''))
        requests = result.fetchall()
        
        if requests:
            print(f"   Total: {len(requests)} requests")
            for req in requests:
                print(f"   📋 ID {req[0]}: Shelter {req[1]} - Status {req[4]}")
                print(f"      Categoria: {req[2]}, Quantidade: {req[3]}")
                print(f"      Criado em: {req[5]}")
        else:
            print("   ❌ Nenhum shelter request encontrado")
        
        # 2. Verificar deliveries
        print("\n🚚 DELIVERIES:")
        result = conn.execute(text('''
            SELECT id, category_id, quantity, status, volunteer_id, 
                   delivery_location_id, metadata_cache, created_at
            FROM deliveries 
            ORDER BY created_at DESC
            LIMIT 10
        '''))
        deliveries = result.fetchall()
        
        if deliveries:
            print(f"   Total: {len(deliveries)} deliveries (mostrando últimos 10)")
            for deliv in deliveries:
                print(f"   🚚 ID {deliv[0]}: Status {deliv[3]}")
                print(f"      Categoria: {deliv[1]}, Quantidade: {deliv[2]}")
                print(f"      Volunteer: {deliv[4]}, Location: {deliv[5]}")
                if deliv[6]:
                    metadata = json.loads(deliv[6]) if isinstance(deliv[6], str) else deliv[6]
                    print(f"      Metadata: {metadata}")
                print(f"      Criado em: {deliv[7]}")
        else:
            print("   ❌ Nenhum delivery encontrado")
        
        # 3. Verificar delivery locations
        print("\n📍 DELIVERY LOCATIONS:")
        # Primeiro verificar schema da tabela
        result = conn.execute(text('PRAGMA table_info(delivery_locations)'))
        columns = result.fetchall()
        print(f"   Colunas da tabela: {[col[1] for col in columns]}")
        
        # Agora fazer a query correta
        result = conn.execute(text('''
            SELECT id, user_id, name, latitude, longitude
            FROM delivery_locations
        '''))
        locations = result.fetchall()
        
        if locations:
            print(f"   Total: {len(locations)} locations")
            for loc in locations:
                print(f"   📍 ID {loc[0]}: User {loc[1]} - {loc[2]}")
                print(f"      🌍 Coordenadas: ({loc[3]}, {loc[4]})")
        else:
            print("   ❌ Nenhuma delivery location encontrada")
        
        # 4. Verificar relação entre requests e locations
        print("\n🔗 RELAÇÃO REQUESTS x LOCATIONS:")
        if requests and locations:
            for req in requests:
                shelter_id = req[1]
                matching_location = next((loc for loc in locations if loc[1] == shelter_id), None)
                if matching_location:
                    print(f"   ✅ Request {req[0]} → Location {matching_location[0]} ({matching_location[2]})")
                    print(f"      Status: {req[4]} - Lat: {matching_location[3]}, Lng: {matching_location[4]}")
                else:
                    print(f"   ❌ Request {req[0]} → Nenhuma location para shelter {shelter_id}")
        
        # 5. Verificar se há requests ativos que deveriam aparecer no mapa
        print("\n🎯 REQUESTS ATIVOS (deveriam aparecer no mapa):")
        active_statuses = ['pending', 'partial', 'active']
        active_requests = [req for req in requests if req[4] in active_statuses]
        
        if active_requests:
            print(f"   ✅ {len(active_requests)} requests ativos encontrados:")
            for req in active_requests:
                print(f"   📋 Request {req[0]}: Status {req[4]} (deveria ser 🔴)")
                shelter_id = req[1]
                matching_location = next((loc for loc in locations if loc[1] == shelter_id), None)
                if matching_location:
                    print(f"      📍 Location: {matching_location[2]} ({matching_location[3]}, {matching_location[4]})")
                else:
                    print(f"      ❌ Sem location para shelter {shelter_id}")
        else:
            print("   ❌ Nenhum request ativo encontrado")
            print("      📝 Status ativos esperados: pending, partial, active")
            print(f"      📝 Status encontrados: {[req[4] for req in requests]}")
        
        # 6. Diagnóstico final
        print("\n🎯 DIAGNÓSTICO FINAL:")
        if not requests:
            print("   ❌ PROBLEMA: Não há shelter requests no banco")
            print("   💡 SOLUÇÃO: Criar requests via dashboard do abrigo")
        elif not active_requests:
            print("   ❌ PROBLEMA: Há requests mas nenhum está ativo")
            print("   💡 SOLUÇÃO: Verificar status dos requests (deveriam ser pending/active)")
        elif not locations:
            print("   ❌ PROBLEMA: Não há delivery locations")
            print("   💡 SOLUÇÃO: Criar locations para os shelters")
        else:
            print("   ✅ Dados OK no banco")
            print("   💡 PROBLEMA: Provavelmente no frontend (MapView.jsx)")
            print("      🔍 Verificar se frontend está carregando requests corretamente")
            print("      🔍 Verificar se lógica de cor do ícone está funcionando")

if __name__ == "__main__":
    main()
