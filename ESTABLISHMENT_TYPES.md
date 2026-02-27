# Tipos de Estabelecimentos JFood

## 📋 Lista Completa de Tipos Disponíveis

### 🍽️ **Cozinha Comunitária**
- **Ícone:** Garfo (🍽️)
- **Cor:** Verde (#10b981)
- **Produtos:** Marmitas/Refeições
- **Exemplo no sistema:** Cozinha Solidária Central

### ⚕️ **Farmácia**
- **Ícone:** Cruz de Saúde (⚕️)
- **Cor:** Verde (#10b981)
- **Produtos:** Medicamentos
- **Exemplo no sistema:** Farmácia Esperança

---

## 🎯 Como Adicionar Novos Tipos

Para adicionar um novo tipo de estabelecimento:

1. **No Backend (`seed.py`):**
   ```python
   {
       'email': 'novo@jfood.com',
       'name': 'Nome do Estabelecimento',
       'establishment_type': 'NOVO_TIPO',  # ← Adicionar aqui
       'production_capacity': 100,
       # ... outros campos
   }
   ```

2. **No Frontend (`MapView.jsx`):**
   - Adicionar SVG na seção de SVG paths
   - Adicionar case no `getIconForEstablishment()`
   - Adicionar entrada na legenda

3. **Exemplo para adicionar "Restaurante":**
   ```javascript
   // SVG
   const SVG_RESTAURANT = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z';
   
   // Função
   case 'restaurante':
       return makeIcon(SVG_RESTAURANT, color, size);
   
   // Legenda
   <div>
     <div>🍴 Restaurante</div>
     <div>Com refeições disponíveis</div>
   </div>
   ```

---

## 📍 Localizações Atuais (Espaçadas 100m+)

| Tipo | Nome | Endereço | Coordenadas |
|------|------|----------|-------------|
| 🍽️ Cozinha | Cozinha Solidária Central | Rua Halfeld, 123 - Centro | -21.764200, -43.350200 |
| ⚕️ Farmácia | Farmácia Esperança | Av. Rio Branco, 800 - Centro | -21.763100, -43.349100 |

**Todas as distâncias verificadas:**
- ✅ Distância: 166.9m (Cozinha ↔ Farmácia)
- ✅ Ambos espaçados adequadamente no Centro de Juiz de Fora

---

## 🎨 Cores dos Ícones

| Status | Cor | Hex |
|--------|-----|-----|
| Disponível (Ready) | Verde | #10b981 |
| Solicitando (Requesting) | Laranja | #f97316 |
| Ocioso (Idle) | Amarelo | #eab308 |

---

## 💡 Dicas de Uso

1. **No Mapa:** Cada tipo tem ícone visual distinto
2. **Na Legenda:** "Fornecedores por Tipo" mostra todos os tipos ativos
3. **No Popup:** Informações detalhadas do estabelecimento
4. **Para Desenvolvedores:** Use `getIconForEstablishment()` para obter ícone correto

---

*Última atualização: 27/02/2026*
