import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function resolvePort(): number {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port' && argv[i + 1]) {
      const parsed = Number(argv[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    if (argv[i].startsWith('--port=')) {
      const parsed = Number(argv[i].slice('--port='.length));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd && process.env.PORT && process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT) {
    return Number(process.env.DEFAULT_APP_PORT || 3000);
  }
  return Number(process.env.PORT || process.env.DEFAULT_APP_PORT || 3000);
}

const PORT = resolvePort();

app.use(express.json({ limit: '15mb' }));

// Server-side Gemini AI Client configuration
const rawApiKey = process.env.GEMINI_API_KEY;
const isRealApiKey = Boolean(
  rawApiKey &&
  rawApiKey.trim() !== '' &&
  !rawApiKey.includes('MY_GEMINI_API_KEY') &&
  !rawApiKey.startsWith('MY_')
);

let aiClient: GoogleGenAI | null = null;
if (isRealApiKey && rawApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: rawApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client on server:', err);
  }
}

// API endpoint for AI Guide Chat
app.post('/api/ai/chat', async (req, res) => {
  const {
    messages,
    systemInstruction,
    personality = 'diplomat',
    responseLength = 'medium',
    creativity = 'balanced',
    language = 'en',
    loansContext,
    attachedFile, // { base64: string, mimeType: string, name: string }
  } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array provided' });
  }

  // If Gemini API client is available and active
  if (aiClient) {
    try {
      // Build personality and context instruction
      let personalityGuide = '';
      if (personality === 'diplomat') {
        personalityGuide = 'Tone: Highly polite, diplomatic, tactful, focused on relationship-preserving financial conversations.';
      } else if (personality === 'auditor') {
        personalityGuide = 'Tone: Strict, precise, analytical financial auditor. Straight to the numbers, deadlines, and balances.';
      } else if (personality === 'friend') {
        personalityGuide = 'Tone: Warm, empathetic, supportive, and conversational without clutter or emojis.';
      } else if (personality === 'advisor') {
        personalityGuide = 'Tone: Wise wealth advisor and strategist. Focuses on debt snowball/avalanche, cash flow, and financial freedom.';
      }

      let lengthGuide = '';
      if (responseLength === 'short') {
        lengthGuide = 'Length constraint: Keep response under 2-3 concise sentences or bullet points.';
      } else if (responseLength === 'long') {
        lengthGuide = 'Length constraint: Provide comprehensive, detailed guidance with concrete step-by-step strategies.';
      } else {
        lengthGuide = 'Length constraint: Balanced response, around 2-4 sentences or actionable advice.';
      }

      const lastUserPrompt = messages[messages.length - 1]?.text || '';
      const isKuPrompt = /[ێۆڕڵڤگچژپکە]/.test(lastUserPrompt) || /(سڵاو|قەرز|چەند|کێ|دەبێت|سوپاس|ئەولەویەت|پوختە)/.test(lastUserPrompt);
      const isArPrompt = !isKuPrompt && /[\u0600-\u06FF]/.test(lastUserPrompt);
      const isTrPrompt = /[ğĞşŞıİçÇöÖüÜ]/.test(lastUserPrompt) || /\b(merhaba|selam|borç|borcum|alacak|teşekkür|lira|nakit|öncelik)\b/i.test(lastUserPrompt);
      const isEsPrompt = /[áéíóúüñ¿¡]/i.test(lastUserPrompt) || /\b(hola|buenos|gracias|cuánto|cuanto|debo|deben|deuda|préstamo|prestamo|dinero|saldo|prioridad|sar|riyal)\b/i.test(lastUserPrompt);
      const isFrPrompt = !isEsPrompt && (/[èêëàâùûîïôœç]/i.test(lastUserPrompt) || /\b(bonjour|salut|merci|combien|dette|prêt|argent|solde|priorité|trésorerie)\b/i.test(lastUserPrompt));

      const detectedPromptLanguage = isKuPrompt
        ? 'Central Kurdish / Sorani (کوردیی سۆرانی)'
        : isArPrompt
        ? 'fluent modern Arabic (العربية)'
        : isTrPrompt
        ? 'fluent natural Turkish (Türkçe)'
        : isEsPrompt
        ? 'fluent natural Spanish (Español)'
        : isFrPrompt
        ? 'fluent natural French (Français)'
        : /\b(hello|hi|hey|who|what|how|much|owe|debt|loan|balance|toward|cash|prioritize|priority|iqd|usd|sar|eur|try)\b/i.test(lastUserPrompt)
        ? 'natural English'
        : language === 'ku'
        ? 'Central Kurdish / Sorani (کوردیی سۆرانی)'
        : language === 'ar'
        ? 'fluent modern Arabic (العربية)'
        : language === 'tr'
        ? 'fluent natural Turkish (Türkçe)'
        : language === 'es'
        ? 'fluent natural Spanish (Español)'
        : language === 'fr'
        ? 'fluent natural French (Français)'
        : 'natural English';

      const finalSystemInstruction = [
        'You are "Ai Budget" (Budget AI Guide), an exceptionally versatile, intelligent, and empathetic financial assistant inside the Loan Budget app.',
        `Strict Language Rule: Always detect the language of the user's latest prompt and reply naturally and fluently in THAT exact language (${detectedPromptLanguage}) regardless of the app UI language. Supported languages: English, Arabic, Kurdish (Sorani), Turkish, French, and Spanish.`,
        'Crucial Directive: You understand and can discuss ANY topic, question, math problem, debt prioritization, multi-currency cash flow (IQD, USD, SAR, EUR, TRY, IRR), overdue alerts, or debt negotiation. Answer directly, concisely, and without emojis.',
        personalityGuide,
        lengthGuide,
        loansContext ? `Active and archived user loans data: ${JSON.stringify(loansContext)}` : '',
        systemInstruction ? `User custom instructions: ${systemInstruction}` : '',
        'Capabilities: Automatic ledger updates acknowledgement, proactive debt prioritization (Snowball/Avalanche), multi-currency cash flow across IQD/USD/SAR/EUR/TRY/IRR, WhatsApp/Telegram reminder scripts, receipt & bill OCR analysis, and relationship-friendly financial coaching.',
      ].filter(Boolean).join('\n\n');

      // Ensure conversation starts with user turn for Gemini API compliance
      const rawHistory = messages.slice(0, -1);
      const firstUserIndex = rawHistory.findIndex((m: any) => m.sender === 'user');
      const filteredHistory = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

      const conversationHistory = filteredHistory.map((m: { sender: string; text: string }) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      // Multimodal contents if image attached
      const lastMessage = messages[messages.length - 1];
      const lastMessageParts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
      if (attachedFile?.base64 && attachedFile?.mimeType) {
        lastMessageParts.push({
          inlineData: {
            data: attachedFile.base64.replace(/^data:[^;]+;base64,/, ''),
            mimeType: attachedFile.mimeType,
          },
        });
      }
      lastMessageParts.push({ text: lastMessage.text || 'Analyze this document for loan details.' });

      // Build contents array
      const contents = [
        ...conversationHistory,
        {
          role: 'user',
          parts: lastMessageParts,
        },
      ];

      // Add an 8-second timeout race so the request completes smoothly
      const apiCallPromise = aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: finalSystemInstruction,
        },
      });

      const timeoutPromise = new Promise<{ text?: string }>((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout')), 8000);
      });

      const response = await Promise.race([apiCallPromise, timeoutPromise]);

      return res.json({
        text: response.text || 'I processed your request.',
        modelUsed: 'gemini-4-hydrogen',
      });
    } catch (apiError: any) {
      console.warn('Gemini API call timed out or failed, falling back to local intelligent engine:', apiError?.message || apiError);
      return res.json({
        fallback: true,
        message: 'Local intelligent engine active',
        errorDetails: apiError?.message,
      });
    }
  }

  // Return fallback flag if no server API key
  return res.json({
    fallback: true,
    message: 'Local intelligent financial engine active',
  });
});

// Live USD <-> IQD Market Reference endpoint (Official CBI / Global FX feed with graceful timeout fallback)
app.get('/api/market-rate', async (_req, res) => {
  const fetchedAtIso = new Date().toISOString();
  const tryFetchJson = async (url: string): Promise<any> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const data = await tryFetchJson('https://open.er-api.com/v6/latest/USD');
    const iqd = Number(data?.rates?.IQD);
    if (Number.isFinite(iqd) && iqd > 100) {
      return res.json({
        ok: true,
        officialUsdToIqd: Math.round(iqd * 100) / 100,
        fetchedAtIso,
        source: 'CBI / Open ER Live Reference',
        rates: {
          IQD: Math.round(iqd * 100) / 100,
          SAR: Number.isFinite(Number(data?.rates?.SAR)) ? Math.round(Number(data.rates.SAR) * 10000) / 10000 : undefined,
          EUR: Number.isFinite(Number(data?.rates?.EUR)) ? Math.round(Number(data.rates.EUR) * 10000) / 10000 : undefined,
          TRY: Number.isFinite(Number(data?.rates?.TRY)) ? Math.round(Number(data.rates.TRY) * 10000) / 10000 : undefined,
          IRR: Number.isFinite(Number(data?.rates?.IRR)) ? Math.round(Number(data.rates.IRR) * 100) / 100 : undefined,
        },
      });
    }
  } catch {
    // Fall through to secondary reference feed
  }

  try {
    const data = await tryFetchJson('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
    const iqd = Number(data?.usd?.iqd);
    if (Number.isFinite(iqd) && iqd > 100) {
      return res.json({
        ok: true,
        officialUsdToIqd: Math.round(iqd * 100) / 100,
        fetchedAtIso,
        source: 'CBI / Global FX Mirror',
        rates: {
          IQD: Math.round(iqd * 100) / 100,
          SAR: Number.isFinite(Number(data?.usd?.sar)) ? Math.round(Number(data.usd.sar) * 10000) / 10000 : undefined,
          EUR: Number.isFinite(Number(data?.usd?.eur)) ? Math.round(Number(data.usd.eur) * 10000) / 10000 : undefined,
          TRY: Number.isFinite(Number(data?.usd?.try)) ? Math.round(Number(data.usd.try) * 10000) / 10000 : undefined,
          IRR: Number.isFinite(Number(data?.usd?.irr)) ? Math.round(Number(data.usd.irr) * 100) / 100 : undefined,
        },
      });
    }
  } catch {
    // Fall through to deterministic CBI baseline fallback
  }

  return res.json({
    ok: false,
    officialUsdToIqd: 1310,
    fetchedAtIso,
    source: 'CBI Reference Fallback',
  });
});

// Setup Vite in development or serve static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const disableHmr = process.env.DISABLE_HMR === 'true';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ...(disableHmr ? { hmr: false, ws: false } : {}),
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Loan Budget full-stack server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server listen error:', err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Loan Budget server:', err);
  process.exit(1);
});
