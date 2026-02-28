# 🎨 VouAjudar Frontend - Interface Social Conectada

Interface web moderna, responsiva e acessível para gerenciamento de recursos, produtos e entregas em situações de emergência e necessidade social.

**Design System unificado** com experiência mobile-first.

## Tecnologias

- **React 18**: Biblioteca UI
- **Vite**: Build tool e dev server
- **React Router**: Navegação
- **Axios**: Cliente HTTP
- **TailwindCSS**: Estilização
- **Lucide React**: Ícones

## Instalação

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env se necessário
```

3. Executar em desenvolvimento:
```bash
npm run dev
```

O frontend estará disponível em: http://localhost:3000

## Build para Produção

```bash
npm run build
npm run preview  # Para testar o build
```

## Estrutura

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   ├── contexts/         # Contextos React (Auth)
│   ├── lib/              # Utilitários e API client
│   ├── pages/            # Páginas da aplicação
│   ├── App.jsx           # Componente principal
│   ├── main.jsx          # Entry point
│   └── index.css         # Estilos globais
├── index.html
├── package.json
└── vite.config.js
```

## Funcionalidades

### 🔐 Autenticação
- Login e registro de usuários
- Múltiplos perfis (fornecedor, voluntário, admin)
- Proteção de rotas por perfil
- Redirecionamento automático baseado no perfil

### 🏪 Fornecedor (Provider)
- Criar pedidos de recursos (ingredientes, materiais, etc.)
- Gerenciar lotes de produtos (refeições, roupas, etc.)
- Acompanhar status de pedidos e entregas
- Sistema de códigos de confirmação

### 🚚 Voluntário (Volunteer)
- Ver pedidos de recursos disponíveis
- Reservar recursos (total ou parcial)
- Ver produtos disponíveis para entrega
- Aceitar e realizar entregas
- Gerenciar reservas e entregas ativas
- Confirmar entregas com códigos

### 👨‍💼 Admin
- Gerenciar usuários
- Aprovar locais de entrega
- Visão geral do sistema

### 🗺️ Mapa Interativo
- Visualização geográfica de fornecedores, voluntários e locais
- Filtros por tipo de produto
- Marcadores coloridos por status
- Informações detalhadas em popups

## Design System

### Paleta de Cores por Perfil
- **Fornecedor**: Azul → Ciano (profissionalismo, produção)
- **Voluntário**: Verde → Esmeralda (ação, movimento)
- **Recebedor**: Vermelho → Rosa (cuidado, necessidade)

### Componentes
- Modal de boas-vindas personalizado por perfil
- Badges de status com cores semânticas
- Cards responsivos com gradientes
- Ícones Lucide React
- Design mobile-first

## Integração com Backend

O frontend se comunica com a API FastAPI através do Axios.
Configure a URL da API no arquivo `.env`:

```
VITE_API_URL=http://localhost:8000
```

## Mapa Interativo

### Funcionalidades
- **Visualização em tempo real** de fornecedores, voluntários e locais
- **Filtros por tipo de produto**: Refeições, Ingredientes, Roupas, Medicamentos
- **Marcadores coloridos** por status (disponível, ocupado, etc.)
- **Ícones específicos** por tipo de estabelecimento:
  - Cozinhas Comunitárias
  - Farmácias
  - ONGs
  - Bazares
- **Informações detalhadas** em popups
- **Design responsivo** para mobile

### Tipos de Estabelecimentos
O sistema suporta múltiplos tipos de estabelecimentos, cada um com seu ícone único:
- **Cozinha Comunitária**: Produz refeições
- **Farmácia**: Fornece medicamentos
- **ONG**: Distribui itens diversos
- **Bazar**: Doa roupas e itens

## Design System

### Cores por Perfil
- **Fornecedor**: Azul → Ciano (`from-blue-500 to-cyan-500`)
- **Voluntário**: Verde → Esmeralda (`from-green-500 to-emerald-500`)  
- **Recebedor**: Vermelho → Rosa (`from-red-500 to-pink-500`)

### Componentes Principais
- **Modal de Boas-Vindas**: Personalizado por perfil com gradientes
- **Badges de Status**: Cores semânticas para estados
- **Cards Responsivos**: Design mobile-first
- **Botões CTA**: Gradientes e ícones
- **Mapa Interativo**: Leaflet com marcadores customizados

## Testes

```bash
# Rodar testes
npm test

# Com cobertura
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Build e Deploy

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm run preview
```

### Deploy (Vercel/Netlify)
1. Build do projeto
2. Configure variáveis de ambiente
3. Deploy automático

## Componentes

### Estrutura
```
frontend/src/
├── components/       # Componentes reutilizáveis
│   ├── Layout.jsx
│   ├── Header.jsx
│   ├── GenericDashboard.jsx
│   └── ProtectedRoute.jsx
├── pages/           # Páginas principais
│   ├── MapView.jsx
│   ├── ProviderDashboard.jsx
│   ├── VolunteerDashboard.jsx
│   └── Admin.jsx
├── contexts/        # React contexts
│   └── AuthContext.jsx
└── lib/             # Utilitários e API client
```

## Desenvolvimento

### Adicionando Novo Tipo de Produto
1. Atualize filtros no `MapView.jsx`
2. Adicione ícone SVG correspondente
3. Atualize design system se necessário
4. Teste responsividade

### Padrões de Código
- **Componentes funcionais** com hooks
- **TailwindCSS** para estilos
- **Lucide React** para ícones
- **Axios** para chamadas API
- **React Router** para navegação

## Documentação

- **Design Guide**: [docs/UX_GUIDE.md](../docs/UX_GUIDE.md)
- **API Backend**: [backend/README.md](../backend/README.md)
- **Contribuição**: [CONTRIBUTING.md](../CONTRIBUTING.md)

## Fluxo de Usuário

1. **Login**: Autenticação JWT com redirecionamento por perfil
2. **Dashboard**: Interface personalizada por tipo de usuário
3. **Mapa**: Visualização geográfica e filtros
4. **Ações**: Reservar, entregar, gerenciar recursos
5. **Confirmação**: Códigos de segurança para entregas

## Mobile-First

Design otimizado para dispositivos móveis:
- Layout responsivo
- Touch-friendly
- Performance otimizada
- Acessibilidade WCAG
