# 🤝 EuAjudo - Plataforma de Conexão entre Necessidades e Ofertas

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%F0%9F%91%8D-green.svg)](https://opensource.org/)

## 📝 Sobre o Projeto

**EuAjudo** é uma plataforma open-source escalável que conecta pessoas que precisam de recursos com aquelas que podem ajudar. Inspirada no conceito **eupreciso.org**, a plataforma facilita a coordenação de doações, entregas e distribuição de recursos em situações de emergência ou necessidade social.

### 🎯 Visão

Criar um sistema **genérico e extensível** que suporte qualquer tipo de recurso (alimentos, roupas, medicamentos, materiais) através de uma arquitetura **event-driven** preparada para escalar em **microserviços** conforme a demanda cresce.

### ✨ Diferenciais

- **🔄 Genérico por Design**: Não limitado a um tipo específico de recurso
- **⚡ Event-Driven Architecture**: Preparado para escala e processamento assíncrono
- **🧩 Modular**: Fácil adicionar novos tipos de recursos e funcionalidades
- **🌍 Open Source**: Código aberto para comunidade contribuir e adaptar
- **📱 Mobile-First**: Interface responsiva e acessível
- **🗺️ Mapa Interativo**: Visualização geográfica em tempo real
- **🔐 Seguro**: Autenticação JWT e códigos de confirmação

## 🚀 Tecnologias

### Backend
- **FastAPI**: Framework web moderno e rápido
- **SQLAlchemy**: ORM para banco de dados
- **SQLite**: Banco de dados (fácil migração para PostgreSQL)
- **JWT**: Autenticação via tokens
- **Python 3.8+**

### Frontend
- **React 18**: Biblioteca UI
- **Vite**: Build tool
- **TailwindCSS**: Framework CSS
- **React Router**: Navegação
- **Axios**: Cliente HTTP

## 📋 Funcionalidades Principais

### 🔄 Fluxo de Recursos (Genérico)
1. **Fornecedor** cria pedido de recursos necessários (ingredientes, materiais, etc.)
2. **Voluntário** reserva e adquire os recursos
3. **Voluntário** entrega os recursos ao fornecedor
4. **Fornecedor** confirma o recebimento

### 📦 Fluxo de Produtos (Genérico)
1. **Fornecedor** cria lote de produtos (refeições, roupas, etc.)
2. **Fornecedor** marca como pronto quando finalizar
3. **Fornecedor** disponibiliza para entrega em locais específicos
4. **Voluntário** aceita a entrega
5. **Voluntário** confirma a entrega no local de destino

### 👥 Perfis de Usuário
- **Fornecedor (Provider)**: Solicita recursos e produz/oferece produtos
- **Voluntário (Volunteer)**: Adquire recursos e realiza entregas
- **Recebedor (Receiver)**: Locais que recebem produtos (abrigos, centros de distribuição)
- **Admin**: Gerencia usuários, locais e aprovações

## 🛠️ Instalação Rápida com Makefile

### Pré-requisitos
- Python 3.8+
- Node.js 16+
- make (disponível em Linux/macOS, Windows via WSL/Chocolatey)

### Setup Automático (Recomendado)
```bash
# Clonar repositório
git clone https://github.com/rede-emergencia/euajudo.git
cd euajudo

# Configurar tudo (Python + Node + dependências)
make setup

# Popular banco de dados com dados de teste
make seed

# Iniciar frontend e backend em background
make dev

# Parar todos os serviços
make kill
```

### Setup Manual

Se preferir setup manual, veja abaixo:

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env e altere o SECRET_KEY

# Executar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend estará em: http://localhost:8000
Documentação da API: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar em desenvolvimento
npm run dev
```

Frontend estará em: http://localhost:3000

## 📖 Uso

### Credenciais de Teste

O banco de dados vem pré-populado com usuários de teste:

**Fornecedor:**
- Email: `p1@j.com` ou `p2@j.com`
- Senha: `123`
- Acessa: Dashboard Fornecedor (criar pedidos de recursos e ofertar produtos)

**Voluntário:**
- Email: `v1@j.com` ou `v2@j.com`
- Senha: `123`
- Acessa: Dashboard Voluntário (reservar recursos e fazer entregas)

**Admin:**
- Email: `adm@j.com`
- Senha: `123`
- Acessa: Dashboard Admin (gerenciar usuários e locais)

### Popular Banco de Dados

Se precisar repopular o banco:

```bash
cd backend
python init_db.py
```

### Fluxo Completo (Exemplo)

#### 1. FORNECEDOR: Solicitar Recursos
- Login como fornecedor
- Dashboard → "Pedidos de Recursos"
- Criar novo pedido especificando itens necessários

#### 2. VOLUNTÁRIO: Reservar e Entregar Recursos
- Login como voluntário
- Ver pedidos disponíveis no mapa ou dashboard
- Reservar pedido e adquirir recursos
- Entregar ao fornecedor com código de confirmação

#### 3. FORNECEDOR: Criar Lote de Produtos
- Dashboard → "Meus Produtos"
- Criar novo lote (quantidade, tipo, descrição)
- Marcar como pronto quando finalizar

#### 4. VOLUNTÁRIO: Aceitar e Realizar Entrega
- Ver produtos disponíveis no mapa
- Aceitar entrega
- Confirmar retirada com código do fornecedor
- Confirmar entrega no local de destino

**Sistema Completo!** 🎉

## 🔒 Segurança

- Autenticação via JWT
- Senhas hasheadas com bcrypt
- Proteção de rotas por perfil
- Validação de dados com Pydantic
- CORS configurado

## 📝 Regras de Negócio

- Voluntário unificado (adquire recursos e realiza entregas)
- Fornecedor pode criar múltiplos pedidos de recursos
- Voluntário pode ter até 2 reservas ativas simultaneamente
- Pedidos de recursos expiram em 2 dias (configurável por tipo)
- Lotes de produtos expiram em 6 horas (configurável por tipo)
- Fornecedores e voluntários são aprovados automaticamente
- Admin aprova locais de entrega (recebedores)
- Sistema de códigos de confirmação para segurança nas entregas

## 🏗️ Arquitetura

### Arquitetura Event-Driven

O sistema utiliza uma arquitetura orientada a eventos que permite:
- **Desacoplamento**: Componentes independentes que se comunicam via eventos
- **Escalabilidade**: Fácil adicionar novos tipos de recursos e funcionalidades
- **Extensibilidade**: Sistema de plugins para novos módulos
- **Preparação para Microserviços**: Estrutura modular pronta para separação

### Modelo de Dados Genérico

```python
# Tipos de produtos suportados
ProductType: MEAL, INGREDIENT, CLOTHING, MEDICINE, GENERIC

# Status baseados em eventos
OrderStatus: IDLE, REQUESTING, OFFERING, RESERVED, IN_PROGRESS, 
             PENDING_CONFIRMATION, COMPLETED, CANCELLED, EXPIRED

DeliveryStatus: AVAILABLE, RESERVED, PICKED_UP, IN_TRANSIT, 
                DELIVERED, CANCELLED, EXPIRED

BatchStatus: PRODUCING, READY, IN_DELIVERY, COMPLETED, 
             CANCELLED, EXPIRED
```

### Roadmap de Evolução

- ✅ **Fase 1**: MVP com produtos genéricos (atual)
- 🔜 **Fase 2**: Sistema de plugins por categoria
- 🔜 **Fase 3**: API pública para integração externa
- 🔜 **Fase 4**: Event sourcing completo
- 🔜 **Fase 5**: Microserviços quando necessário

**Documentação Técnica:**
- 📖 [Arquitetura Detalhada](docs/architecture/)
- 📖 [Guia de UX](docs/UX_GUIDE.md)
- 📖 [Histórico de Implementação](docs/history/)

## 🗂️ Estrutura do Projeto

```
jfood/
├── backend/
│   ├── app/
│   │   ├── routers/      # Endpoints da API
│   │   ├── models.py     # Modelos do banco
│   │   ├── schemas.py    # Schemas Pydantic
│   │   ├── database.py   # Configuração DB
│   │   ├── auth.py       # Autenticação
│   │   └── main.py       # App principal
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes
│   │   ├── contexts/     # Contextos
│   │   ├── lib/          # Utilitários
│   │   ├── pages/        # Páginas
│   │   └── App.jsx
│   ├── package.json
│   └── README.md
└── README.md
```

## 🚀 Deploy

### 🟢 Render.com (Recomendado)

Deploy automático e gratuito com CI/CD:

1. **Backend API**: `https://euajudo-api.onrender.com`
2. **Frontend**: `https://euajudo-frontend.onrender.com`
3. **Database**: PostgreSQL gratuito

**Setup Automático**:
```bash
# 1. Conectar repositório no Render
# 2. Usar render.yaml já configurado
# 3. Deploy automático no push para master
```

📖 **Veja [DEPLOYMENT.md](DEPLOYMENT.md)** para instruções detalhadas.

---

### 📋 Outras Opções

**Backend**:
- Heroku
- Railway
- DigitalOcean
- AWS ECS

**Frontend**:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Database**:
- PostgreSQL (produção)
- MySQL
- MongoDB
- AWS RDS

### Banco de Dados em Produção
Para produção, migre de SQLite para PostgreSQL:
1. Instale `psycopg2`
2. Altere `DATABASE_URL` no `.env`
3. O SQLAlchemy cuidará do resto

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

**Código aberto para ajudar em situações de emergência** ❤️

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! Este é um projeto open-source e queremos facilitar para você contribuir.

### Primeiros Passos

1. Leia o [Guia de Contribuição](CONTRIBUTING.md)
2. Explore a [documentação técnica](docs/architecture/)
3. Veja as [issues abertas](../../issues)
4. Entre em contato se tiver dúvidas

### Processo de Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Áreas para Contribuir

- 🐛 Correção de bugs
- ✨ Novas funcionalidades
- 📝 Documentação
- 🎨 Melhorias de UI/UX
- 🧪 Testes
- 🌍 Internacionalização
- ♿ Acessibilidade

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.

---

## � Comandos Úteis do Makefile

```bash
# Ajuda com todos os comandos
make help

# Ambiente
make setup          # Configura ambiente completo
make seed           # Popula banco de dados
make clean          # Limpa arquivos temporários

# Desenvolvimento
make dev            # Inicia frontend + backend em background
make backend        # Inicia apenas backend
make frontend       # Inicia apenas frontend
make kill           # Para todos os serviços

# Qualidade de código
make test           # Roda testes
make lint           # Verifica código
make format         # Formata código
make logs           # Exibe logs em tempo real
make status         # Verifica status dos serviços

# Banco de dados
make db-reset       # Reset completo do banco
make db-backup      # Backup do banco SQLite
```

## �🌟 Comece Agora

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/SEU_USERNAME/euajudo.git
   cd euajudo
   ```

2. **Setup automático**:
   ```bash
   make setup && make seed && make dev
   ```

3. **Contribua**: Veja [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📚 Documentação Adicional

- **[BUGS.md](BUGS.md)** - Lista de bugs conhecidos e problemas em aberto
- **[ROADMAP.md](ROADMAP.md)** - Plano de migração para Event-Driven Microservices
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Tarefas prioritárias para contribuidores
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guia completo de deployment em produção
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guia completo de contribuição
- **[docs/architecture/](docs/architecture/)** - Documentação técnica detalhada

---

**🚀 Juntos podemos fazer a diferença!**  
**Desenvolvido com ❤️ para conectar quem ajuda com quem precisa**
