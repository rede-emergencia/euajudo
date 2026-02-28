# Deploy no Render - Guia Completo

## 🚀 Arquitetura do Deploy

Vamos configurar 3 serviços no Render:
1. **PostgreSQL Database** - Banco de dados gerenciado
2. **Backend API** - FastAPI com Python
3. **Frontend** - React/Vite com Nginx

## 📋 Pré-requisitos

1. **Conta no Render**: Crie em [render.com](https://render.com)
2. **GitHub**: Repositório já deve estar no GitHub
3. **Chave SSH**: Configure sua chave SSH no GitHub

## 🔧 Configuração dos Arquivos

### 1. Arquivo `render.yaml`

Já criado na raiz do projeto. Configure:

```yaml
services:
  # PostgreSQL Database
  - type: postgres
    name: euajudo-db
    databaseName: euajudo
    user: euajudo_user
    
  # Backend API
  - type: web
    name: euajudo-api
    runtime: python
    plan: free
    repo: https://github.com/SEU_USERNAME/euajudo.git  # ⚠️ ATUALIZE ESTE URL
    rootDir: backend
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: euajudo-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: ALGORITHM
        value: HS256
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: "10080"
      - key: ENVIRONMENT
        value: production
      - key: DEBUG
        value: false
      - key: CORS_ORIGINS
        value: https://SEU_DOMINIO.onrender.com,https://SEU_DOMINIO-api.onrender.com  # ⚠️ ATUALIZE
    domains:
      - SEU_DOMINIO-api.onrender.com  # ⚠️ ATUALIZE

  # Frontend
  - type: web
    name: euajudo-frontend
    runtime: static
    repo: https://github.com/SEU_USERNAME/euajudo.git  # ⚠️ ATUALIZE ESTE URL
    rootDir: frontend
    buildCommand: "npm install && npm run build"
    publishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://SEU_DOMINIO-api.onrender.com  # ⚠️ ATUALIZE
    domains:
      - SEU_DOMINIO.onrender.com  # ⚠️ ATUALIZE
```

### 2. Variáveis de Ambiente Necessárias

#### Backend (Render vai configurar automaticamente):
- `DATABASE_URL`: Conexão com PostgreSQL do Render
- `SECRET_KEY`: Chave JWT (gerada automaticamente)
- `ALGORITHM`: HS256
- `ACCESS_TOKEN_EXPIRE_MINUTES`: 10080
- `ENVIRONMENT`: production
- `DEBUG`: false
- `CORS_ORIGINS`: Seus domínios Render
- `PORT`: Variável do Render (automática)

#### Frontend:
- `VITE_API_URL`: URL do seu backend no Render

## 🛠️ Passos para o Deploy

### Passo 1: Preparar o Repositório

```bash
# Adicionar arquivos de deploy
git add render.yaml frontend/Dockerfile.render frontend/nginx.conf backend/Dockerfile.render DEPLOY_RENDER.md

# Commit
git commit -m "Add Render deployment configuration"

# Push
git push origin main
```

### Passo 2: Configurar no Render

1. **Acesse** [render.com](https://render.com)
2. **Login** com sua conta GitHub
3. **New +** → **Blueprint**
4. **Connect Repository**: Seu repositório `euajudo`
5. **Name**: `euajudo-deploy`
6. **Root Directory**: `/` (raiz)
7. **Create Blueprint**

O Render vai ler o `render.yaml` e criar os 3 serviços automaticamente.

### Passo 3: Configurar Domínios Personalizados (Opcional)

Se você tem um domínio próprio:

1. **No painel do Render** → Service → Domains
2. **Add Custom Domain**
3. **Configure DNS** conforme instruções do Render

Exemplo:
- Frontend: `app.seudominio.com`
- API: `api.seudominio.com`

## 🔐 Variáveis de Ambiente Adicionais

Se precisar de configurações extras:

### Backend (no painel do Render):
```bash
# AWS (se usar S3)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1

# Email (se usar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha

# Redis (se precisar)
REDIS_URL=redis://host:port
```

### Frontend (no painel do Render):
```bash
# Google Maps (se usar)
VITE_GOOGLE_MAPS_API_KEY=sua_chave

# Outras configurações
VITE_APP_NAME=VouAjudar
VITE_APP_VERSION=2.0.0
```

## 🚀 URLs Finais

Após o deploy, suas URLs serão:

- **Frontend**: `https://euajudo-frontend.onrender.com`
- **API**: `https://euajudo-api.onrender.com`
- **Database**: Acessível apenas pelo backend

## 📊 Monitoramento

1. **Logs**: No painel do Render → Service → Logs
2. **Metrics**: Service → Metrics
3. **Health Checks**: Configurados automaticamente

## 🔧 Troubleshooting

### Backend não inicia:
- Verifique logs no Render
- Confira variáveis de ambiente
- Teste health check: `https://sua-api.onrender.com/health`

### Frontend não carrega:
- Verifique build no console
- Confira URL da API
- Teste CORS

### Database connection:
- Verifique se DATABASE_URL está correta
- Confira se database está online
- Teste conexão manualmente

## 🎉 Pós-Deploy

1. **Teste API**: `https://sua-api.onrender.com/docs`
2. **Teste Frontend**: `https://sua-app.onrender.com`
3. **Crie usuário admin** via API
4. **Configure backup** do database (plano pago)

## 💡 Dicas Importantes

- **Plano Free**: Limitado a 750h/mês
- **Cold Starts**: Serviços podem demorar para iniciar
- **Database**: Free plan tem limitações
- **Domínios**: Custom domains requerem plano pago

## 🔄 Deploy Automático

A cada push no `main`, o Render vai:
1. Rodar build commands
2. Atualizar serviços
3. Manter database intacto

---

**Pronto!** Siga estes passos e sua aplicação estará no ar. 🚀
