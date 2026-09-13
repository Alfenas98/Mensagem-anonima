require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'troque-esta-senha';
const SESSION_SECRET = process.env.SESSION_SECRET || 'troque-este-segredo';

// Conexao com o Postgres do Railway (usa DATABASE_URL automaticamente)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 dias
  })
);

// --- Rotas publicas ---

// Recebe uma mensagem anonima
app.post('/api/messages', async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Mensagem vazia' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Mensagem muito longa (max 2000 caracteres)' });
  }
  try {
    await pool.query('INSERT INTO messages (content) VALUES ($1)', [content.trim()]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao salvar mensagem:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// --- Autenticacao do admin ---

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.status(401).json({ error: 'Nao autenticado' });
}

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Senha incorreta' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/session', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// --- Rotas protegidas do painel ---

app.get('/api/messages', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, content, created_at, read FROM messages ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/messages/:id/read', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE messages SET read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.delete('/api/messages/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Paginas
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('Erro ao iniciar banco de dados:', err);
    process.exit(1);
  });
