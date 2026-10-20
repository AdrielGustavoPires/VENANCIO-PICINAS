import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  readServerDatabase,
  writeServerDatabase,
  mergeDatabaseSnapshots,
  deleteServerClient,
  clearServerDatabase,
  DatabaseSnapshot,
} from './src/server/databaseStore';
import { DEFAULT_SERVER_DB } from './src/server/defaultData';

dotenv.config();

// Ensure initial database exists on server boot
function initializeServerDb(): DatabaseSnapshot {
  let db = readServerDatabase();
  if (!db || !Array.isArray(db.clients)) {
    db = writeServerDatabase(DEFAULT_SERVER_DB as unknown as DatabaseSnapshot);
  }
  return db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB on start
  initializeServerDb();

  app.use(express.json({ limit: '10mb' }));

  // Safe lazy initializer for GoogleGenAI
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Chave de API Gemini (GEMINI_API_KEY) não encontrada nas configurações.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Cross-device Database Sync Endpoints
  app.get('/api/db', (req, res) => {
    try {
      const db = readServerDatabase() || initializeServerDb();
      res.json({ success: true, data: db });
    } catch (err: any) {
      console.error('Error fetching database:', err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/db/sync', (req, res) => {
    try {
      const incomingData = req.body || {};
      const currentDb = readServerDatabase() || initializeServerDb();
      const merged = mergeDatabaseSnapshots(currentDb, incomingData);
      res.json({ success: true, data: merged });
    } catch (err: any) {
      console.error('Error syncing database:', err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/db/reset', (req, res) => {
    try {
      const reset = clearServerDatabase(DEFAULT_SERVER_DB.services, DEFAULT_SERVER_DB.settings);
      res.json({ success: true, data: reset });
    } catch (err: any) {
      console.error('Error resetting database:', err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/db/clear-all', (req, res) => {
    try {
      const reset = clearServerDatabase(DEFAULT_SERVER_DB.services, DEFAULT_SERVER_DB.settings);
      res.json({ success: true, data: reset });
    } catch (err: any) {
      console.error('Error clearing all database data:', err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/db/clients/:id', (req, res) => {
    try {
      const clientId = req.params.id;
      const updated = deleteServerClient(clientId);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error deleting client on server:', err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Chat endpoint with resilient fallback and retry
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, model = 'gemini-flash-latest', systemInstruction } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'O histórico de mensagens é obrigatório.' });
      }

      const ai = getGenAI();

      const defaultSystemInstruction =
        `Você é o Assistente Virtual e Especialista Técnico da 'Venâncio Piscinas - Gestão e Manutenção'.
Sua função é auxiliar técnicos de piscina, piscineiros profissionais, administradores e clientes em:
1. Cálculos de dosagem química (Cloro granulado, Cloro líquido, Barrilha Leve, Sulfato de Alumínio, Elevador de Alcalinidade/Bicarbonato, Clarificante, Algicida de Choque e Manutenção, Redutor de pH/Ácido Muriático) de acordo com o volume em Litros da piscina e tipo (Fibra, Vinil, Alvenaria, Azulejo).
2. Diagnósticos de água de piscina: Água verde com algas, água turva/leitosa, cheiro forte de cloro (cloramina), manchas no fundo, decantação correta.
3. Boas práticas de filtração, aspiração (ao esgoto vs drenar vs filtrar), retrolavagem de areia do filtro, manutenção de bombas e casa de máquinas.
4. Elaboração de mensagens profissionais para clientes via WhatsApp (lembretes de manutenção, aviso de conclusão de serviço, cobranças cordiais de mensalidades, orientações pós-tratamento como tempo de espera para banho).
5. Dicas de gestão e operação para o negócio de piscinas.

Formate as respostas de forma clara, prática, organizada com tópicos e destaque parâmetros ideais:
- pH ideal: 7.2 a 7.6 (ótimo: 7.4)
- Cloro Livre ideal: 1.0 a 3.0 ppm (ou 2 a 4 ppm)
- Alcalinidade Total ideal: 80 a 120 ppm
- Dureza Cálcica ideal: 200 a 400 ppm
- Ácido Cianúrico (Estabilizador): até 50 ppm

Responda sempre em Português do Brasil com tom profissional, solícito e direto ao ponto. Use formatação markdown limpa (negrito, listas, tabelas quando útil).`;

      const contents = messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Candidate models cascade for maximum availability
      const modelsToTry = Array.from(
        new Set([
          model,
          'gemini-flash-latest',
          'gemini-3.1-flash-lite',
          'gemini-3.7-flash',
          'gemini-3.1-pro-preview',
        ])
      ).filter(Boolean);

      let lastError: any = null;
      let reply: string | null = null;
      let successfulModel = model;

      for (const currentModel of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents,
            config: {
              systemInstruction: systemInstruction || defaultSystemInstruction,
              temperature: 0.7,
            },
          });

          if (response && response.text) {
            reply = response.text;
            successfulModel = currentModel;
            break;
          }
        } catch (err: any) {
          lastError = err;
          // Silently proceed to next fallback model
          await new Promise(r => setTimeout(r, 200));
        }
      }

      if (!reply) {
        throw lastError || new Error('Não foi possível obter resposta no momento. Por favor, tente novamente em instantes.');
      }

      res.json({
        reply,
        model: successfulModel,
      });
    } catch (error: any) {
      console.error('Erro na API de Chat Gemini:', error?.message || error);
      res.status(500).json({
        error: error?.message || 'Erro ao comunicar com a inteligência artificial. Por favor, tente novamente em instantes.',
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Venâncio Piscinas Server rodando na porta ${PORT}`);
  });
}

startServer();
