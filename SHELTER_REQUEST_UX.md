# Redesign UX - Sistema de Solicitações do Abrigo

## Problemas Identificados

### 1. Redundância de Categorias
- ❌ Usuário clica em "Roupas" mas depois precisa selecionar categoria novamente em dropdown
- ❌ Dropdown mostra todas as categorias novamente (água, alimentos, etc)
- ❌ Ícone não muda quando troca categoria no dropdown

### 2. Fluxo Confuso
- ❌ Não fica claro como adicionar múltiplos itens
- ❌ Botão "Adicionar produto" escondido em accordion
- ❌ Difícil visualizar todos os itens adicionados

### 3. Ações Pouco Intuitivas
- ❌ Botões de expandir/colapsar sem propósito claro
- ❌ Exclusão de item não tem confirmação visual
- ❌ Não há feedback de quantos itens foram adicionados

---

## Novo Design Proposto

### Fluxo Simplificado

```
1. Clica "Nova Solicitação"
   ↓
2. Vê grid de categorias com ícones grandes
   ↓
3. Clica na categoria desejada (ex: Roupas)
   ↓
4. Preenche quantidade + atributos específicos
   ↓
5. Clica "Adicionar" → Item aparece na lista
   ↓
6. Pode adicionar mais itens ou finalizar
```

### Componentes Redesenhados

#### 1. Seleção de Categoria (Grid Visual)
```
┌─────────────────────────────────────────┐
│  Escolha o que você precisa             │
├─────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │ 👕  │  │ 💊  │  │ 🍽️  │             │
│  │Roupa│  │ Med │  │Alim │             │
│  └─────┘  └─────┘  └─────┘             │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │ 💧  │  │ 🧼  │  │ 🍱  │             │
│  │Água │  │Higi │  │Refeição│          │
│  └─────┘  └─────┘  └─────┘             │
└─────────────────────────────────────────┘
```

#### 2. Formulário de Item (Inline, Sem Collapse)
```
┌─────────────────────────────────────────┐
│  👕 Roupas                        [X]   │
├─────────────────────────────────────────┤
│  Quantidade: [____] peças               │
│  Tipo: [Camisetas ▼]                    │
│  Tamanho: [M ▼]                         │
│                                         │
│  [Cancelar] [✓ Adicionar à Lista]      │
└─────────────────────────────────────────┘
```

#### 3. Lista de Itens Adicionados
```
┌─────────────────────────────────────────┐
│  Itens da Solicitação (3)               │
├─────────────────────────────────────────┤
│  ✓ 10 Roupas - Camisetas M      [Editar│
│  ✓ 5 Medicamentos - Analgésico  [Editar│
│  ✓ 20 Água - Potável            [Editar│
└─────────────────────────────────────────┘
```

---

## Regras de UX

### Categorias
1. **Uma categoria = Um tipo de item**
   - Sem dropdowns redundantes
   - Categoria escolhida = ícone fixo

2. **Atributos específicos por categoria**
   - Roupas: tipo + tamanho
   - Medicamentos: nome + tipo
   - Alimentos: tipo
   - Água: tipo
   - Higiene: tipo
   - Refeições: tipo + descrição

### Estados Visuais
1. **Categoria selecionada**: Card destacado com borda colorida
2. **Item adicionado**: Aparece na lista com ícone de check
3. **Categoria já usada**: Pode adicionar novamente (múltiplas quantidades)

### Ações Claras
1. **Adicionar**: Botão verde com ícone ✓
2. **Cancelar**: Volta para seleção de categoria
3. **Editar**: Permite modificar item já adicionado
4. **Remover**: Ícone de lixeira com confirmação
5. **Finalizar**: Botão destacado quando há pelo menos 1 item

---

## Implementação

### Estrutura de Estados
```javascript
const [step, setStep] = useState('select'); // 'select' | 'form' | 'review'
const [selectedCategory, setSelectedCategory] = useState(null);
const [items, setItems] = useState([]);
const [editingItem, setEditingItem] = useState(null);
```

### Fluxo de Estados
```
select → form → (adiciona item) → select
         ↑                           ↓
         └────── (editar) ──────────┘
```

---

## Melhorias de Acessibilidade

1. **Feedback visual claro**: Cores, ícones, animações sutis
2. **Mensagens de erro**: Inline, próximo ao campo
3. **Confirmações**: Para ações destrutivas (remover item)
4. **Loading states**: Ao salvar solicitação
5. **Validação em tempo real**: Campos obrigatórios destacados

---

## Próximos Passos

1. ✅ Remover dropdown de categorias redundante
2. ⏳ Criar grid visual de categorias
3. ⏳ Simplificar formulário inline
4. ⏳ Implementar lista de itens com edição
5. ⏳ Adicionar validações e feedback
6. ⏳ Testar fluxo completo
