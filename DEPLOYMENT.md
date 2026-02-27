# 🚀 Deployment Guide

Este documento explica como fazer deploy do EuAjudo em produção usando Render.com.

---

## 📋 Pré-requisitos

- Conta no [Render.com](https://render.com)
- Repositório no GitHub (já criado: `https://github.com/rede-emergencia/euajudo`)
- Acesso administrativo ao domínio (opcional)

---

## ⚡ Deploy Rápido (Render)

### 1. Backend API

1. **Conectar Repositório**
   - Vá para [Render Dashboard](https://dashboard.render.com)
   - Clique em "New +" → "Web Service"
   - Conecte o repositório `rede-emergencia/euajudo`
   - Configure:
     - **Name**: `euajudo-api`
     - **Environment**: `Python 3`
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - **Instance Type**: `Free`

2. **Configurar Database**
   - Clique em "New +" → "PostgreSQL"
   - **Name**: `euajudo-db`
   - **Database Name**: `euajudo`
   - **User/Password**: Auto-generated
   - **Instance Type**: `Free`

3. **Variáveis de Ambiente**
   - No serviço `euajudo-api`, vá para "Environment"
   - Adicione:
     ```
     DATABASE_URL = [copiar do database]
     SECRET_KEY = [gerar chave secreta]
     CORS_ORIGINS = https://euajudo-frontend.onrender.com
     ```

4. **Database Migration**
   - Depois do deploy, acesse o serviço
   - Execute: `https://euajudo-api.onrender.com/init-db`
   - Execute: `https://euajudo-api.onrender.com/seed`

### 2. Frontend

1. **Criar Serviço Frontend**
   - Clique em "New +" → "Static Site"
   - **Name**: `euajudo-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Instance Type**: `Free`

2. **Variáveis de Ambiente**
   - Adicione:
     ```
     VITE_API_URL = https://euajudo-api.onrender.com
     ```

---

## 🔧 Configuração Detalhada

### Backend Configuration

**render.yaml** (já configurado):
```yaml
services:
  - type: web
    name: euajudo-api
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: euajudo-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: CORS_ORIGINS
        value: https://euajudo-frontend.onrender.com
```

### Frontend Configuration

**render.yaml** (já configurado):
```yaml
services:
  - type: web
    name: euajudo-frontend
    env: static
    plan: free
    buildCommand: npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://euajudo-api.onrender.com
```

---

## 🌍 URLs Após Deploy

- **Backend API**: `https://euajudo-api.onrender.com`
- **API Documentation**: `https://euajudo-api.onrender.com/docs`
- **Frontend**: `https://euajudo-frontend.onrender.com`
- **Health Check**: `https://euajudo-api.onrender.com/health`

---

## 🔒 Configurações de Segurança

### Backend
- ✅ CORS configurado para frontend
- ✅ Variáveis de ambiente sensíveis
- ✅ Database com credenciais únicas
- ✅ Health check endpoint

### Frontend
- ✅ Sem credenciais expostos
- ✅ Build otimizado para produção
- ✅ SPA routing configurado

---

## 📊 Monitoramento

### Render Dashboard
- **Logs**: Acessíveis no dashboard
- **Metrics**: CPU, Memory, Requests
- **Deploy History**: Histórico de deploys
- **Health Checks**: Status dos serviços

### Logs Importantes
```bash
# Ver logs do backend
# No Render Dashboard → Services → euajudo-api → Logs

# Ver logs do frontend
# No Render Dashboard → Services → euajudo-frontend → Logs
```

---

## 🔄 CI/CD Automático

O Render já configura CI/CD automático:

- **Auto-deploy**: Push para `master` → Deploy automático
- **Build**: Automaticamente ao receber código
- **Health Check**: Verifica se serviço está funcionando
- **Rollback**: Possível voltar para versão anterior

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
```bash
# Verificar se CORS_ORIGINS está correto
# Deve ser: https://euajudo-frontend.onrender.com
```

**2. Database Connection**
```bash
# Verificar DATABASE_URL no backend
# Deve apontar para o database do Render
```

**3. Frontend Not Loading API**
```bash
# Verificar VITE_API_URL no frontend
# Deve ser: https://euajudo-api.onrender.com
```

**4. Build Failures**
```bash
# Verificar requirements.txt e package.json
# Todas as dependências devem estar corretas
```

### Debug Commands

```bash
# Testar API localmente
curl https://euajudo-api.onrender.com/health

# Verificar frontend
curl https://euajudo-frontend.onrender.com

# Verificar API docs
curl https://euajudo-api.onrender.com/docs
```

---

## 📱 Custom Domain (Opcional)

### 1. Backend API
```bash
# No Render Dashboard → Services → euajudo-api → Custom Domains
# Adicionar: api.euajudo.org
```

### 2. Frontend
```bash
# No Render Dashboard → Services → euajudo-frontend → Custom Domains
# Adicionar: euajudo.org
```

### 3. DNS Configuration
```bash
# A Records:
# api.euajudo.org → 216.24.57.25 (Render)
# euajudo.org → 216.24.57.25 (Render)
```

---

## 💰 Custos

### Plano Free (Atual)
- **Backend**: 750 horas/mês (suficiente)
- **Database**: 90 dias de backup
- **Frontend**: Ilimitado
- **Custom Domains**: Não incluído

### Upgrade Necessário Quando:
- > 750 horas de backend/mês
- Backup > 90 dias necessário
- Custom domains gratuitos
- Mais performance

---

## 🚀 Deploy Automático

Com os arquivos `render.yaml` configurados, o deploy é automático:

1. **Push para master** → Build automático
2. **Build sucesso** → Deploy automático
3. **Health check** → Verificação
4. **Deploy completo** → URLs disponíveis

---

## 📞 Suporte

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **GitHub Issues**: https://github.com/rede-emergencia/euajudo/issues

---

**Pronto para produção!** 🎉

Com esta configuração, o EuAjudo está pronto para receber usuários reais em um ambiente de produção escalável e seguro.
