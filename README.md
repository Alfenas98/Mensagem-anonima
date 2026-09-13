# Caixa de Mensagens Anônimas

App simples para receber mensagens anônimas por um link público, com painel
protegido por senha para ler as mensagens.

## Estrutura
- `server.js` — backend Express (rotas públicas + painel admin)
- `public/index.html` — página pública onde as pessoas mandam mensagens
- `public/admin.html` — painel de login + leitura das mensagens (`/admin`)
- Banco: PostgreSQL

## Deploy no Railway

1. Crie um novo projeto no Railway e conecte este repositório (ou faça upload
   direto da pasta).
2. No mesmo projeto, clique em **New** → **Database** → **Add PostgreSQL**.
   O Railway cria a variável `DATABASE_URL` automaticamente e a injeta no seu
   serviço se estiverem no mesmo projeto.
3. No serviço do app, vá em **Variables** e adicione:
   - `ADMIN_PASSWORD` — a senha que você vai usar para entrar em `/admin`
   - `SESSION_SECRET` — qualquer string longa e aleatória
   (não precisa adicionar `DATABASE_URL` manualmente, o Railway já injeta)
4. O Railway detecta o `package.json` e roda `npm install` + `npm start`
   automaticamente.
5. Depois do deploy, você terá uma URL tipo `https://seuapp.up.railway.app`.
   - Link público para receber mensagens: `https://seuapp.up.railway.app/`
   - Painel para ler as mensagens: `https://seuapp.up.railway.app/admin`

## Rodando localmente (opcional, para testar antes)

```bash
npm install
cp .env.example .env
# edite o .env com uma DATABASE_URL de um Postgres local ou de teste
npm start
```

## Observações
- Não tenho como confirmar os preços atuais do addon de Postgres do Railway —
  vale checar o dashboard deles antes de confirmar custo, já que planos e
  cobrança podem ter mudado.
- O painel usa sessão via cookie (7 dias). Se quiser expirar mais rápido ou
  adicionar autenticação mais forte (2FA, usuário+senha em vez de só senha),
  dá pra evoluir depois.
