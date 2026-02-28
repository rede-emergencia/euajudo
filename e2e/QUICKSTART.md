# ⚡ Quick Start - Testes E2E

Guia rápido para executar os testes em **menos de 5 minutos**.

## 🚀 Setup Rápido

### 1. Instalar dependências e browsers

```bash
cd e2e
./setup.sh
```

**Ou manualmente:**

```bash
cd e2e
npm install
npx playwright install chromium
```

### 2. Iniciar backend e frontend

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Executar testes

**Modo UI (Recomendado para primeira vez):**
```bash
cd e2e
npm run test:ui
```

**Modo headless (CI/CD):**
```bash
cd e2e
npm test
```

## 📊 Ver Resultados

```bash
cd e2e
npm run report
```

Abre relatório HTML com:
- ✅ Testes que passaram
- ❌ Testes que falharam
- 📸 Screenshots de falhas
- 🎥 Vídeos de falhas
- 📝 Traces para debug

## 🎯 Comandos Úteis

```bash
# Todos os testes
npm test

# Interface visual
npm run test:ui

# Modo debug
npm run test:debug

# Apenas login
npm run test:auth

# Apenas provider
npm run test:provider

# Apenas volunteer
npm run test:volunteer

# Apenas shelter
npm run test:shelter

# Ver relatório
npm run report
```

## ✅ Checklist Pré-Teste

- [ ] Backend rodando em `http://localhost:8000`
- [ ] Frontend rodando em `http://localhost:3000`
- [ ] Banco de dados populado (`cd backend && python init_db.py`)
- [ ] Dependências instaladas (`cd e2e && npm install`)
- [ ] Browsers instalados (`cd e2e && npm run install:browsers`)

## 🐛 Problemas?

Veja `TROUBLESHOOTING.md` ou execute:

```bash
# Verificar saúde do backend
curl http://localhost:8000/health

# Verificar frontend
curl http://localhost:3000
```

## 📚 Próximos Passos

1. Leia `README.md` para detalhes completos
2. Veja `ARCHITECTURE.md` para entender o design
3. Explore testes em `tests/` para exemplos
4. Adicione seus próprios testes!

---

**Tempo estimado de setup:** 5 minutos  
**Tempo de execução dos testes:** 2-3 minutos
