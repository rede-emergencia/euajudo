# 🧪 Guia de Testes - VouAjudar

## 🎯 Cenários Configurados

### **📋 Dados de Login:**
- **Senha:** `123` para todos os usuários

---

## 🙋 **CENÁRIO 1: Voluntário Testando Permissões**

### **Login como Voluntário:**
```
📧 Email: joao.voluntario@jfood.com
🔑 Senha: 123
```

### **Teste 1.1: Buscar Marmitas de Fornecedor**
1. **Acessar o mapa**
2. **Encontrar:** "Cozinha Solidária Central" (marmitas prontas)
3. **Clicar no fornecedor**
4. **Verificar:** Botão "Reservar Lote" deve aparecer
5. **Resultado:** ✅ Voluntário pode reservar (permissão corrigida)

### **Teste 1.2: Entregar para Abrigo (Item Único)**
1. **Encontrar:** "Abrigo São Francisco" (só pede medicamentos)
2. **Clicar no abrigo**
3. **Verificar:** Pedido de 20 medicamentos
4. **Ação:** "Me Comprometer"
5. **Resultado:** ✅ Voluntário pode aceitar pedido único

### **Teste 1.3: Entregar para Abrigo (Múltiplos Itens)**
1. **Encontrar:** "Abrigo Nossa Senhora do Carmo"
2. **Verificar:** 15 medicamentos + 25 marmitas
3. **Ação:** "Me Comprometer" com quantidade parcial
4. **Exemplo:** Entregar só 10 marmitas
5. **Resultado:** ✅ Voluntário pode entregar parte

---

## 🏪 **CENÁRIO 2: Fornecedores em Diferentes Estados**

### **Login como Fornecedor:**
```
📧 Email: cozinha.solidaria@jfood.com
🔑 Senha: 123
```

### **Teste 2.1: Fornecedor com Marmitas Prontas**
1. **Status:** READY (verde no mapa)
2. **Quantidade:** 50 marmitas disponíveis
3. **Ação:** Voluntários podem reservar
4. **Resultado:** ✅ Disponível para retirada

### **Login como Fornecedor:**
```
📧 Email: restaurante.bom.sabor@jfood.com
🔑 Senha: 123
```

### **Teste 2.2: Fornecedor Produzindo**
1. **Status:** PRODUCING (amarelo no mapa)
2. **Quantidade:** 40 marmitas em preparo
3. **Ação:** Não disponível ainda
4. **Resultado:** ✅ Ainda não disponível

---

## 🔄 **CENÁRIO 3: Fluxo Completo Voluntário**

### **Passo a Passo:**
1. **Login:** `joao.voluntario@jfood.com`
2. **Mapa:** Ver fornecedores disponíveis (verdes)
3. **Seleção:** Cozinha Solidária (50 marmitas)
4. **Reserva:** Reservar 20 marmitas
5. **Compromisso:** "Me Comprometer"
6. **Código:** Receber código 123456
7. **Confirmação:** Confirmar retirada
8. **Resultado:** Header muda para amarelo 🟡

### **Verificação de Estados:**
- **Início:** Header verde 🟢 (disponível)
- **Comprometido:** Header continua verde 🟢 (pendente)
- **Confirmado:** Header muda para amarelo 🟡 (ativo)
- **Cancelado:** Header volta para verde 🟢 (rollback)

---

## 🎨 **CENÁRIO 4: Sincronização Visual**

### **Teste 4.1: Header + Laterais**
1. **Verificar:** Header verde quando disponível
2. **Verificar:** Laterais verdes quando disponível
3. **Ação:** Fazer comprometimento
4. **Verificar:** Header e laterais sincronizados
5. **Resultado:** ✅ Sempre mesma cor

### **Estados Visuais:**
| Estado | Header | Laterais | Significado |
|--------|--------|----------|-------------|
| **idle** | 🟢 Verde | 🟢 Verde | Disponível |
| **pending_confirmation** | 🟢 Verde | 🟢 Verde | Comprometido |
| **reserved** | 🟡 Amarelo | 🟡 Amarelo | Confirmado |
| **picked_up** | 🔵 Azul | 🔵 Azul | Retirado |

---

## 📊 **CENÁRIO 5: Pedidos Variados**

### **Abrigo 1: Item Único**
- **Local:** Abrigo São Francisco
- **Pedido:** 20 medicamentos
- **Teste:** Entregar quantidade exata

### **Abrigo 2: Múltiplos Itens**
- **Local:** Abrigo Carmo
- **Pedidos:** 15 medicamentos + 25 marmitas
- **Teste:** Entregar só parte (ex: 10 marmitas)

### **Abrigo 3: Item Único**
- **Local:** Abrigo Bom Pastor
- **Pedido:** 30 roupas
- **Teste:** Entregar quantidade exata

---

## 🚀 **CENÁRIO 6: Performance e UX**

### **Teste 6.1: Performance**
1. **Carregamento:** Mapa carrega rápido
2. **Filtros:** Funcionam corretamente
3. **Modais:** Abrrem sem delay
4. **Resultados:** ✅ Sistema responsivo

### **Teste 6.2: UX/Fluxo**
1. **Intuitivo:** Fácil de entender
2. **Feedback:** Mensagens claras
3. **Cores:** Estados visíveis
4. **Resultados:** ✅ UX amigável

---

## 🔧 **CENÁRIO 7: Validações**

### **Teste 7.1: Validações de Backend**
1. **Permissões:** Voluntários podem reservar
2. **Estados:** PENDING_CONFIRMATION funciona
3. **Cancelamento:** Rollback automático
4. **Resultados:** ✅ Validações OK

### **Teste 7.2: Validações de Frontend**
1. **Formulários:** Campos validados
2. **Erros:** Mensagens claras
3. **Sucesso:** Feedback positivo
4. **Resultados:** ✅ Frontend robusto

---

## 📝 **Checklist de Testes**

### **✅ Funcionalidades:**
- [ ] Login como voluntário funciona
- [ ] Voluntário pode reservar batches
- [ ] Voluntário pode se comprometer com entregas
- [ ] Estados sincronizados (header + laterais)
- [ ] Cores mudam corretamente
- [ ] Cancelamento faz rollback
- [ ] Entregas parciais funcionam

### **✅ Cenários:**
- [ ] Item único (medicamentos)
- [ ] Múltiplos itens (medicamentos + marmitas)
- [ ] Fornecedores READY
- [ ] Fornecedores PRODUCING
- [ ] Fluxo completo voluntário

### **✅ Performance:**
- [ ] Mapa carrega rápido
- [ ] Filtros funcionam
- [ ] Sem erros de console
- [ ] Responsivo em mobile

---

## 🎯 **Resultados Esperados**

### **✅ Sucesso:**
- Voluntários conseguem buscar marmitas
- Estados sincronizados visualmente
- Pedidos únicos e múltiplos funcionam
- Fornecedores em estados diferentes visíveis
- Permissões corrigidas

### **⚠️ Pontos de Atenção:**
- Verificar se header muda de cor ao confirmar
- Testar cancelamento antes de confirmar
- Validar entregas parciais em múltiplos itens
- Checar performance com muitos dados

---

## 🚀 **Próximos Passos**

1. **Executar todos os testes acima**
2. **Documentar qualquer anomalia**
3. **Ajustar conforme necessário**
4. **Preparar para produção**

**Sistema pronto para testes completos!** 🎯
