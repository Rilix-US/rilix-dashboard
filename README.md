# Rilix Dashboard — Deploy no Vercel

Dashboard de gestão de clientes rodando na nuvem, independente do Claude.ai.

## Estrutura
```
index.html        ← Dashboard (abre no browser / TV)
api/
  data.js         ← Serverless function que lê o Notion
```

## Passo a passo (15 minutos, gratuito)

### 1. Criar Integração no Notion
1. Acesse https://www.notion.so/my-integrations
2. Clique em **"New integration"**
3. Nome: `Rilix Dashboard`
4. Copie o **Internal Integration Token** (começa com `ntn_` ou `secret_`)

### 2. Conectar bancos de dados ao integration
No Notion, abra cada banco de dados abaixo e conecte a integração:
- **🚀 Projetos** → clique em `...` → `Add connections` → selecione "Rilix Dashboard"
- **👥 Clientes** → mesmo processo

### 3. Deploy no Vercel
1. Crie conta grátis em https://vercel.com
2. Crie um repositório no GitHub e faça upload desta pasta
3. No Vercel: **Add New Project** → importe o repositório
4. Em **Environment Variables**, adicione:
   - Nome: `NOTION_TOKEN`
   - Valor: o token copiado no passo 1
5. Clique em **Deploy**

Pronto! Você terá uma URL como `rilix-dashboard.vercel.app` 🎉

### 4. Colocar na TV
- Abra a URL no navegador da TV
- Pressione **F11** para tela cheia
- O dashboard atualiza automaticamente a cada **5 minutos**

## Atualizar dados
O dashboard busca os dados do Notion automaticamente. Qualquer mudança feita no Notion aparece em até 5 minutos.

## IDs dos bancos de dados (já configurados no código)
- Projetos: `9188454a7bdf4ed2a8c1bef36c83fe2a`
- Clientes: `38d3cc48a33a4c52825ccc3c2ec1154c`
