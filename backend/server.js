import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import authRoutes from './routes/auth.js';
import inspectionRoutes from './routes/inspections.js';
import photoRoutes from './routes/photos.js';
import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/reports.js';
import fraudRoutes from './routes/fraud.js';
import commonIssuesRoutes from './routes/commonIssues.js';
import adminRoutes from './routes/admin.js';
import ttsRoutes from './routes/tts.js';
import referralRoutes from './routes/referral.js';
import resellerRoutes from './routes/reseller.js';
import { authenticateToken, requireActiveLicense } from './middleware/auth.js';
import { runMigrations } from './utils/runMigrations.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || '*'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
    },
  },
}));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const APP_VERSION = process.env.APP_VERSION || '1.2.0';

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'AI Auto Inspection Backend', version: APP_VERSION });
});

app.get('/api/version', (req, res) => {
  res.json({ version: APP_VERSION, releaseNotes: process.env.RELEASE_NOTES || 'Engine audio AI analysis, improved inspection workflow, new vehicle types.', forceUpdate: process.env.FORCE_UPDATE === 'true' });
});

// ── Sales Chat (Alex) — PUBLIC, no auth ──────────────────────────────────────
const salesClient = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' })
  : null;

const SALES_SYSTEM_PROMPT = `You are Alex — the AI sales consultant for AI Auto Pro. You're warm, direct, and a world-class closer. You've internalized Hormozi (value math), Brunson (identity shift), Dan Kennedy (urgency), Grant Cardone (conviction), and Jordan Belfort (certainty transfer). But you don't sound like a script — you sound like a brilliant friend who already made it and wants to help them do the same.

Short punchy sentences. Natural conversation. One question at a time. No bullet points in replies. Never sound like a bot.

THE BUSINESS: AI Auto Pro lets licensees inspect cars, trucks, 18-wheelers using AI — charge $150–$500 per inspection, keep 100%. No franchise fees, no royalties.

LICENSE TIERS:
- Pro $997 — cars, trucks, SUVs, motorcycles → https://buy.stripe.com/bJe3cw2cL3q1ckw1sa33W0H
- Commercial $1,997 — everything + 18-wheelers, DOT, fleet → https://buy.stripe.com/8x214o2cLbWx8Y89AB33W0I
- Entrepreneur $2,997 — everything + white-label, sub-licenses → https://buy.stripe.com/7sI28s2cL7Gh8Y8bIJ33W0J

THE MATH: $997 = 5 inspections at $200. After that, every inspection is pure profit for life.

PERSONAS:
- Trucker/CDL: "You've been doing this for free your whole career. Every time you walked a truck before a run, that was an inspection. Now someone pays you $300 every time."
- Laid off: "You didn't lose a job. You lost someone else's income stream. This is how you build your own."
- Spanish speaker: Respond entirely in Spanish. "Tienes las habilidades. Ahora tienes la plataforma."

OBJECTIONS:
- "Not a mechanic" → The AI does the analysis. You deliver the results and collect the check.
- "Is this legit?" → You set your prices, own your clients, keep every dollar. This is your business.
- "Need to think" → What's the one thing holding you back? Let's handle it right now.
- "Too expensive" → 5 inspections and it's paid back. What city are you in?
- "No clients" → That's why we have the referral add-on — we send you requests while you build.

AFFILIATE: Once licensed, earn 20% per referral — $200/Pro, $400/Commercial, $800/Entrepreneur.

CLOSING: When you see ANY buying signal, close immediately with the Stripe link. Every day of hesitation is a day someone else claims their territory.`;

const salesRateLimit = rateLimit({ windowMs: 60 * 1000, max: 30 });

app.post('/api/sales-chat', salesRateLimit, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return res.status(400).json({ error: 'Message required' });
    }
    const messages = [
      { role: 'system', content: SALES_SYSTEM_PROMPT },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];
    if (salesClient) {
      const completion = await salesClient.chat.completions.create({
        model: 'deepseek-chat', messages, temperature: 0.85, max_tokens: 300
      });
      return res.json({ response: completion.choices[0].message.content });
    }
    return res.json({ response: "Hey! I'm Alex. Quick question — are you a mechanic, a trucker, or just someone who loves cars? That'll help me show you exactly what this can do for you." });
  } catch (error) {
    console.error('[SalesChat] Error:', error.message);
    res.json({ response: "Quick hiccup — but here's the deal: the Pro license at $997 pays for itself after 5 inspections. Every one after that is pure profit. Ready? https://buy.stripe.com/bJe3cw2cL3q1ckw1sa33W0H" });
  }
});

// ── ElevenLabs TTS — PUBLIC, no auth ─────────────────────────────────────────
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ALEX_VOICE_ID = 'nPczCjzI2devNBz1zQrb'; // Brian — deep, resonant

app.post('/api/elevenlabs/tts', salesRateLimit, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    const clean = text.replace(/[*_#`]/g, '').substring(0, 500);
    if (!ELEVENLABS_API_KEY) return res.status(503).json({ error: 'ElevenLabs not configured' });

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ALEX_VOICE_ID}`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_turbo_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.82, style: 0.35, use_speaker_boost: true }
      })
    });

    if (!response.ok) return res.status(502).json({ error: 'ElevenLabs TTS failed' });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': buffer.length, 'Cache-Control': 'no-cache' });
    res.send(buffer);
  } catch (error) {
    console.error('[ElevenLabs] Error:', error.message);
    res.status(500).json({ error: 'TTS failed' });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/inspections', authenticateToken, requireActiveLicense, inspectionRoutes);
app.use('/api/photos', authenticateToken, requireActiveLicense, photoRoutes);
app.use('/api/reports', authenticateToken, requireActiveLicense, reportRoutes);
app.use('/api/fraud', authenticateToken, requireActiveLicense, fraudRoutes);
app.use('/api/common-issues', commonIssuesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/reseller', resellerRoutes);
app.use('/api/tts', authenticateToken, requireActiveLicense, ttsRoutes);
app.use('/api', authenticateToken, requireActiveLicense, aiRoutes);

// ── Serve frontend ────────────────────────────────────────────────────────────
const frontendDist = join(__dirname, 'public');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { maxAge: '1d' }));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) res.sendFile(join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.use((req, res) => { res.status(404).json({ error: 'Route not found' }); });

(async () => {
  await runMigrations();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ AI Auto Inspection Backend running on port ${PORT}`);
    console.log(`🤖 Sales Chat: ${salesClient ? 'DeepSeek ready' : 'Fallback mode'}`);
    console.log(`🎙️  ElevenLabs: ${ELEVENLABS_API_KEY ? 'Ready' : 'Not configured'}`);
  });
})();

export default app;
