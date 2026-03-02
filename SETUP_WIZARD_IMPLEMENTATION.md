# 🎯 Setup Wizard - Fluxo Intuitivo para Abrigos

## 🎉 Objetivo
Criar um fluxo amigável onde o abrigo possa:
1. **Começar cadastrando estoque inicial** (roupas, alimentos, etc.)
2. **A partir do estoque, pedir doações** quando estiver baixo
3. **Entregar doações** quando tiver disponível

## 📋 Fluxo Ideal

### **Tela de Boas-vindas (Primeiro Acesso)**
```
🏠 Bem-vindo ao seu Sistema de Estoque!

Vamos começar cadastrando os itens que você já tem:

[Começar Setup] [Pular para Dashboard]
```

### **Setup Wizard (Passo a Passo)**

#### **Passo 1: Categorias Disponíveis**
```
📦 Quais categorias você tem no seu abrigo?

☑️ Alimentos
☑️ Roupas  
☑️ Medicamentos
☐ Produtos de Higiene
☐ Materiais de Limpeza
☐ Cobertores
☐ Brinquedos
☐ Material Escolar

[Próximo] [Voltar]
```

#### **Passo 2: Quantidades Iniciais**
```
📊 Quantidade inicial de cada item:

🍎 Alimentos: [50] unidades
👕 Roupas: [100] peças
💊 Medicamentos: [20] caixas

[Adicionar Mais Categorias] [Finalizar Setup]
```

#### **Passo 3: Limites de Alerta**
```
⚠️ Quando queremos ser alertados?

🍎 Alimentos: Mínimo [10] | Máximo [200]
👕 Roupas: Mínimo [20] | Máximo [500]
💊 Medicamentos: Mínimo [5] | Máximo [50]

[Finalizar Setup] [Voltar]
```

### **Dashboard Pós-Setup**
```
🎉 Setup concluído! Seu estoque está pronto.

📊 Visão Geral:
- Total em estoque: 170 itens
- 3 categorias cadastradas
- Tudo OK! ✅

🔄 Próximos passos:
1. Adicione mais itens quando receber doações
2. Peça doações quando o estoque estiver baixo
3. Distribua itens para beneficiários
```

## 🔧 Implementação

### **1. Estado de Setup**
```javascript
const [isFirstTime, setIsFirstTime] = useState(true);
const [setupStep, setSetupStep] = useState(0);
const [selectedCategories, setSelectedCategories] = useState([]);
const [initialStock, setInitialStock] = useState({});
const [thresholds, setThresholds] = useState({});
```

### **2. Componente SetupWizard**
```javascript
function SetupWizard({ onComplete }) {
  // 3 passos: categorias → quantidades → limites
  // Salva tudo no final
}
```

### **3. Lógica de Primeiro Acesso**
```javascript
useEffect(() => {
  // Verificar se abrigo já tem itens no estoque
  const hasInventory = dashboardData?.inventory_by_category?.length > 0;
  setIsFirstTime(!hasInventory);
}, [dashboardData]);
```

## 📱 Mockups

### **Tela de Boas-vindas**
```
┌─────────────────────────────────────┐
│  🏠 Bem-vindo ao Sistema de Estoque! │
│                                     │
│  Vamos organizar seu abrigo passo a   │
│  passo. Comece cadastrando o que     │
│  você já tem disponível.             │
│                                     │
│  ⏱️ Leva apenas 2 minutos            │
│                                     │
│  [🚀 Começar Agora]  [↩️ Pular]      │
└─────────────────────────────────────┘
```

### **Seleção de Categorias**
```
┌─────────────────────────────────────┐
│  📦 Quais itens você tem no abrigo?   │
│                                     │
│  ☑️ 🍎 Alimentos                    │
│  ☑️ 👕 Roupas                       │
│  ☑️ 💊 Medicamentos                 │
│  ☐ 🧼 Produtos de Higiene           │
│  ☐ 🧹 Materiais de Limpeza          │
│  ☐ 🛏️ Cobertores                   │
│  ☐ 🧸 Brinquedos                   │
│  ☐ 📚 Material Escolar             │
│                                     │
│  [↩️ Voltar]  [➡️ Próximo]           │
└─────────────────────────────────────┘
```

### **Quantidades Iniciais**
```
┌─────────────────────────────────────┐
│  📊 Quantidade inicial de cada item   │
│                                     │
│  🍎 Alimentos        [50] unidades   │
│  👕 Roupas          [100] peças     │
│  💊 Medicamentos     [20] caixas    │
│                                     │
│  💡 Dica: Se não tiver, deixe 0     │
│                                     │
│  [➕ Add Categoria]  [✅ Finalizar]   │
└─────────────────────────────────────┘
```

## 🎯 Benefícios

### **✅ Para o Abrigo**
- **Intuitivo:** Passo a passo guiado
- **Rápido:** 2-3 minutos para setup completo
- **Flexível:** Pula se já tiver estoque
- **Educativo:** Ensina o fluxo natural

### **✅ Para o Sistema**
- **Dados completos:** Estoque inicial registrado
- **Limites configurados:** Alertas funcionam desde início
- **Adoção facilitada:** Menos barreiras para começar

### **✅ Experiência do Usuário**
- **Claro:** Objetivo bem definido
- **Progressivo:** Um conceito de cada vez
- **Recompensante:** Dashboard funcional após setup

## 🚀 Como Implementar

### **Fase 1: Tela de Boas-vindas**
1. Detectar primeiro acesso (sem itens no estoque)
2. Mostrar tela convidativa com opção de pular
3. Design simples e amigável

### **Fase 2: Setup Wizard**
1. Passo 1: Seleção de categorias (checkboxes)
2. Passo 2: Quantidades iniciais (inputs numéricos)
3. Passo 3: Limites de alerta (min/max)

### **Fase 3: Integração**
1. Salvar tudo via API calls
2. Redirecionar para dashboard
3. Mostrar mensagem de sucesso

---

**Status:** 📋 **Planejado** - Pronto para implementação
