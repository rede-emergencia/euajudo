# Padrão de Modais Reutilizáveis

## 📋 Visão Geral

Sistema de modais reutilizáveis para substituir `alert()` e `confirm()` nativos do navegador, proporcionando uma experiência de usuário consistente e profissional.

## 🎯 Componentes

### 1. **Modal Component** (`/src/components/Modal.jsx`)
Componente base para renderizar modais com diferentes variantes visuais.

### 2. **useModal Hook** (`/src/hooks/useModal.js`)
Hook customizado que simplifica o gerenciamento de estado e exibição de modais.

## 🚀 Como Usar

### Setup Básico

```jsx
import useModal from '../hooks/useModal';

function MeuComponente() {
  const { showSuccess, showError, showWarning, showInfo, showConfirm, ModalComponent } = useModal();
  
  return (
    <div>
      {/* Seu conteúdo aqui */}
      
      {/* IMPORTANTE: Adicionar no final do return */}
      {ModalComponent}
    </div>
  );
}
```

## 📚 Variantes Disponíveis

### 1. **Success (Sucesso)**
```jsx
showSuccess('Título', 'Mensagem de sucesso');
```
- **Cor:** Verde
- **Uso:** Confirmações de operações bem-sucedidas
- **Exemplo:** "Usuário criado com sucesso!"

### 2. **Error (Erro)**
```jsx
showError('Título', 'Mensagem de erro');
```
- **Cor:** Vermelho
- **Uso:** Erros e falhas de operação
- **Exemplo:** "Erro ao salvar os dados"

### 3. **Warning (Aviso)**
```jsx
showWarning('Título', 'Mensagem de aviso');
```
- **Cor:** Amarelo
- **Uso:** Validações e avisos ao usuário
- **Exemplo:** "Preencha todos os campos obrigatórios"

### 4. **Info (Informação)**
```jsx
showInfo('Título', 'Mensagem informativa');
```
- **Cor:** Azul
- **Uso:** Informações gerais
- **Exemplo:** "Esta operação pode demorar alguns minutos"

### 5. **Confirm (Confirmação)**
```jsx
showConfirm(
  'Título',
  'Mensagem de confirmação',
  () => handleAction(), // Callback executado ao confirmar
  'Texto do Botão Confirmar', // Opcional
  'Texto do Botão Cancelar'   // Opcional
);
```
- **Cor:** Azul
- **Uso:** Confirmações de ações destrutivas ou importantes
- **Exemplo:** "Tem certeza que deseja excluir este item?"

## 💡 Exemplos Práticos

### Exemplo 1: Validação de Formulário
```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!form.name || !form.email) {
    showWarning('Campos Obrigatórios', 'Preencha todos os campos obrigatórios');
    return;
  }
  
  // Continuar com o submit...
};
```

### Exemplo 2: Operação com Sucesso
```jsx
const handleSave = async () => {
  try {
    await api.save(data);
    showSuccess('Sucesso!', 'Dados salvos com sucesso!');
  } catch (error) {
    showError('Erro ao Salvar', error.message);
  }
};
```

### Exemplo 3: Confirmação de Exclusão
```jsx
const handleDelete = (id) => {
  showConfirm(
    'Confirmar Exclusão',
    'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
    async () => {
      try {
        await api.delete(id);
        showSuccess('Excluído!', 'Item excluído com sucesso');
        reloadData();
      } catch (error) {
        showError('Erro', 'Não foi possível excluir o item');
      }
    },
    'Sim, excluir',
    'Cancelar'
  );
};
```

### Exemplo 4: Operação Assíncrona
```jsx
const handleApprove = async (userId) => {
  try {
    await api.approve(userId);
    showSuccess('Aprovado!', 'Usuário aprovado com sucesso!');
    updateList();
  } catch (error) {
    showError('Erro ao Aprovar', error.response?.data?.detail || 'Erro desconhecido');
  }
};
```

## 🎨 Customização

### Tamanhos Disponíveis
```jsx
openModal({
  variant: 'info',
  title: 'Título',
  message: 'Mensagem',
  size: 'sm' // 'sm', 'md', 'lg'
});
```

### Modal Customizado
```jsx
const { openModal, closeModal, ModalComponent } = useModal();

openModal({
  variant: 'confirm',
  title: 'Título Customizado',
  message: 'Mensagem customizada',
  confirmText: 'Texto do Botão',
  cancelText: 'Cancelar',
  onConfirm: () => handleCustomAction(),
  showCancel: true,
  size: 'lg'
});
```

## ✅ Boas Práticas

### 1. **Sempre adicione o ModalComponent**
```jsx
return (
  <div>
    {/* Conteúdo */}
    {ModalComponent} {/* ✅ SEMPRE no final */}
  </div>
);
```

### 2. **Mensagens claras e concisas**
```jsx
// ❌ Ruim
showError('Erro', 'Erro');

// ✅ Bom
showError('Erro ao Salvar', 'Não foi possível salvar os dados. Tente novamente.');
```

### 3. **Use a variante correta**
```jsx
// ❌ Ruim - usando error para validação
showError('Erro', 'Preencha o campo nome');

// ✅ Bom - usando warning para validação
showWarning('Campo Obrigatório', 'Preencha o campo nome');
```

### 4. **Callbacks assíncronos em confirm**
```jsx
// ✅ Bom - trata erros dentro do callback
showConfirm(
  'Confirmar',
  'Deseja continuar?',
  async () => {
    try {
      await api.action();
      showSuccess('Sucesso!', 'Operação concluída');
    } catch (error) {
      showError('Erro', error.message);
    }
  }
);
```

## 🔄 Migração de alert() para Modal

### Antes (alert nativo)
```jsx
// ❌ Antigo
if (!form.name) {
  alert('Preencha o nome');
  return;
}

try {
  await api.save();
  alert('Salvo com sucesso!');
} catch (error) {
  alert('Erro ao salvar');
}

if (window.confirm('Deseja excluir?')) {
  await api.delete(id);
}
```

### Depois (Modal reutilizável)
```jsx
// ✅ Novo
if (!form.name) {
  showWarning('Campo Obrigatório', 'Preencha o nome');
  return;
}

try {
  await api.save();
  showSuccess('Sucesso!', 'Salvo com sucesso!');
} catch (error) {
  showError('Erro ao Salvar', 'Não foi possível salvar os dados');
}

showConfirm(
  'Confirmar Exclusão',
  'Deseja excluir este item?',
  async () => await api.delete(id)
);
```

## 📦 Estrutura de Arquivos

```
frontend/
├── src/
│   ├── components/
│   │   └── Modal.jsx           # Componente base
│   ├── hooks/
│   │   └── useModal.js         # Hook customizado
│   └── pages/
│       └── Admin.jsx           # Exemplo de uso
```

## 🎯 Benefícios

1. **Consistência:** Todos os modais seguem o mesmo padrão visual
2. **Manutenibilidade:** Fácil de atualizar o design em um único lugar
3. **Acessibilidade:** Melhor suporte a teclado e leitores de tela
4. **UX:** Experiência mais profissional que alerts nativos
5. **Flexibilidade:** Fácil de customizar e estender
6. **Type Safety:** Variantes bem definidas evitam erros

## 🚫 O Que Evitar

1. **Não use alert() ou confirm() nativos**
2. **Não crie modais customizados sem necessidade**
3. **Não esqueça de adicionar {ModalComponent} no return**
4. **Não use modais para tudo** - considere tooltips ou toasts para feedback rápido

## 📝 Checklist de Implementação

- [ ] Importar `useModal` no componente
- [ ] Desestruturar as funções necessárias
- [ ] Adicionar `{ModalComponent}` no return
- [ ] Substituir todos os `alert()` por `showError/showWarning`
- [ ] Substituir todos os `confirm()` por `showConfirm`
- [ ] Testar todos os fluxos de modal
- [ ] Verificar mensagens de erro e sucesso

---

**Última atualização:** Março 2026  
**Mantido por:** Equipe Eu Ajudo
