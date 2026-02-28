# Deploy em Produção - Reset de Banco e Seed

## 🚨 ATENÇÃO - OPERAÇÃO DESTRUTIVA

Este procedimento irá **APAGAR TODOS OS DADOS** do banco de produção!

## 📋 Pré-requisitos

- Acesso ao repositório no GitHub
- Permissões de deploy no Render
- Backup dos dados atuais (se necessário)

## 🔧 Procedimento

### 1. Reset Local (Teste)
```bash
# Resetar banco local e testar seed
make reset-db
make seed-small
```

### 2. Deploy para Produção

#### Opção A: Via Render Dashboard
1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Vá para o serviço `euajudo-api`
3. Clique em "Manual Deploy"
4. Selecione "Build & Deploy"
5. O script `start_with_seed.py` irá:
   - Criar/verificar tabelas
   - Detectar banco vazio
   - Executar `seed_small.py` automaticamente

#### Opção B: Reset Manual (CUIDADO!)
Se precisar resetar o banco de produção manualmente:

1. **SSH no servidor Render:**
```bash
# Acessar o serviço via SSH
ssh service_id@host.render.com
```

2. **Executar script de reset:**
```bash
cd /opt/render/project/src
python reset_production.py
```

### 3. Verificação

Após o deploy, verifique se os dados foram criados:

```bash
# Testar API
curl https://api.vouajudar.org/categories/?active_only=true

# Deve retornar 6 categorias:
# - Água 💧
# - Alimentos 🥫  
# - Refeições Prontas 🍱
# - Higiene 🧼
# - Roupas 👕
# - Medicamentos 💊
```

## 📊 Dados Criados pelo Seed

### Usuários
- **Admin**: admin@vouajudar.org / admin123
- **Voluntários**: joao@vouajudar.org / joao123
- **Abrigos**: abrigo.centro@vouajudar.org / centro123

### Categorias (6 essenciais)
1. **Água** 💧 - Litros/ml
2. **Alimentos** 🥫 - Ingredientes básicos
3. **Refeições Prontas** 🍱 - Marmitas/sopas
4. **Higiene** 🧼 - Itens de higiene
5. **Roupas** 👕 - Tipo + tamanho
6. **Medicamentos** 💊 - Nome específico

### Locais
- **Abrigo Centro de Operações**
- **Abrigo São Sebastião**

## 🔍 Troubleshooting

### Seed não executou
Verifique os logs do serviço no Render Dashboard:
```bash
# Logs devem mostrar:
# 🌱 Banco vazio detectado. Rodando seed...
# 📦 Módulo seed_small importado com sucesso
# ✅ Seed concluído com sucesso!
```

### Erro de banco
Verifique variáveis de ambiente no Render:
- `DATABASE_URL` deve apontar para PostgreSQL
- `ENVIRONMENT` deve ser `production`

### Categorias não aparecem
Teste endpoint diretamente:
```bash
curl -H "Authorization: Bearer TOKEN" https://api.vouajudar.org/categories/
```

## 🚀 Pós-Deploy

1. **Testar frontend**: https://vouajudar.org
2. **Login como abrigo**: abrigo.centro@vouajudar.org / centro123
3. **Criar solicitação** para testar categorias
4. **Verificar mapa** para abrigos

## 📞 Suporte

Em caso de problemas:
1. Verificar logs no Render Dashboard
2. Testar endpoints individualmente
3. Conferir variáveis de ambiente
4. Validar estrutura do banco
