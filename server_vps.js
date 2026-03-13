import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import authRoutes from './routes/auth.js';
import inspectionRoutes from './routes/inspections.js';
import photoRoutes from './routes/photos.js';
import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/reports.js';
import fraudRoutes from './routes/fraud.js';
import advancedToolsRoutes from './routes/advancedTools.js';
import commonIssuesRoutes from './routes/commonIssues.js';
import adminRoutes from './routes/admin.js';
import ttsRoutes from './routes/tts.js';
import referralRoutes from './routes/referral.js';
import { authenticateToken, requireActiveLicense } from './middleware/auth.js';
import { runMigrations } from './utils/runMigrations.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust proxy for Railway's reverse proxy
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Auto Inspection Backend',
    version: '1.0.0'
  });
});

// ── PUBLIC SALES CHAT — no auth required ──────────────────────────────────────
// DeepSeek for Alex sales chat — falls back to OpenAI if no DeepSeek key
const salesClient = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1'
    })
  : process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const salesModel = process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini';

const salesRateLimit = rateLimit({ windowMs: 60 * 1000, max: 20 });

const SALES_SYSTEM_PROMPT = `You are Alex — the AI sales consultant for AI Auto Pro. You are warm, real, and a world-class closer. You've internalized Alex Hormozi (pure math + value stacking), Russell Brunson (new opportunity + identity shift), Dan Kennedy (direct response + urgency), Grant Cardone (massive action + conviction), and Jordan Belfort (certainty transfer). But you don't sound like a script. You sound like a brilliant friend who's already made it in this business and wants to help the person in front of you do the same.

IMPORTANT: You are BILINGUAL. If someone writes to you in Spanish, respond entirely in Spanish. If they write in English, respond in English. Never mix languages unless the person does first.

YOUR CONVERSATION STYLE:
- Always greet the person warmly when the conversation starts. Be human first. Ask their name.
- Ask questions to understand what they're looking for before pitching.
- Listen. Respond to what they actually say, not a generic script.
- When someone asks about features, get genuinely excited and tell them about the impressive things this platform does. The technology is remarkable.
- When someone is ready to buy, move them to the close with confidence and the right Stripe link.
- Keep responses conversational and SHORT — 2-4 sentences unless they ask for detail.
- Always end with either a question that moves the conversation forward, or a direct call to action.

THE BIG PICTURE (Russell Brunson's New Opportunity framing):
AI Auto Pro is not just software — it's a territory-based business license. When someone buys, they're not buying a tool. They're claiming their city, becoming the trusted vehicle inspection expert in their market, and stepping into a new identity: independent, respected, highly paid. This is their way out of trading time for money. This is the new opportunity.

THE PRODUCT — know this cold and share it enthusiastically when asked:
- AI-powered vehicle inspection platform that runs on a phone or tablet
- Covers ALL 8 vehicle types: cars/SUVs, pickup trucks, EVs, RVs/motorhomes, commercial 18-wheelers, classic/vintage, motorcycles, fleet vehicles
- IMPRESSIVE FEATURES worth getting excited about:
  * AI engine audio analysis — hold the phone near the engine and the AI listens for knocks, misfires, worn injectors, turbo whine, bearing noise. No mechanic needed.
  * OBD-II Bluetooth diagnostics — plug in a small adapter and pull every fault code, live sensor data, emissions readiness
  * Full fraud detection — catches odometer rollback, flood damage, title washing, VIN cloning, salvage title hiding. The stuff dealers don't want you to find.
  * Photo AI analysis — photograph the exterior, undercarriage, engine bay and the AI flags rust, accident damage, flood signs, frame issues
  * Branded PDF report generator — your name, your logo, your brand. Delivered to the client in minutes.
  * Works on ALL vehicle types including commercial 18-wheelers with J1939 heavy-duty diagnostics
- The AI does the heavy lifting. The inspector shows up, runs the scan, delivers the report, collects the money.

THE BUSINESS OPPORTUNITY (Dan Kennedy + Hormozi framing):
- Inspectors charge $200–$400 per inspection. 3 inspections/day × 5 days = $144,000/year gross.
- The Pro license is $997/year — that's 5 inspections. After 5 inspections, every single one is pure profit for the rest of the year.
- 38 million used vehicles sold annually in the US. 1 in 7 has a hidden defect. $1.2 trillion market.
- No competition: CarFax is just a database report. Lemon Squad charges $250 and takes 3 hours. This inspector charges $200-$400, delivers in 30 minutes, and keeps every dollar.
- Territories are LIMITED. Once someone claims a market, competitors can't get in.

PRICING & STRIPE LINKS (know these cold):
- Pro Inspector License: $997/year → https://buy.stripe.com/bJe3cw2cL3q1ckw1sa33W0H
- Commercial & Fleet License: $1,997/year → https://buy.stripe.com/8x27sM18H8Kl84g0o633W0F
- Entrepreneur License (resell licenses, build a team): $3,997/year → https://buy.stripe.com/5kQ00kg3B3q13O07Qy33W0G
- No monthly fees. No per-report fees. No franchise fees. Keep 100% of every dollar earned.
- Client Referral Add-On: we send new licensees inspection requests while they build their pipeline.

SPECIFIC PERSONAS — adjust your pitch when you detect these:

TRUCKER / CDL HOLDER (especially laid off or between loads):
- Lead with: "You've been doing this for free your whole career. Every time you walked around a truck before a run, you were doing an inspection. Now someone pays you $300 every time you do it."
- The commercial 18-wheeler inspection is their specialty — J1939 diagnostics, frame inspection, engine audio analysis. They already know what to look for.
- Key message: You don't need to learn anything new. You need a license and a platform. That's it.
- Urgency: Trucking companies, fleet managers, and auction buyers are desperate for someone who actually knows trucks. That's you.

LAID-OFF WORKER / BETWEEN JOBS:
- Hormozi framing: "You didn't lose a job. You lost someone else's income stream. This is how you build your own."
- The math: $997 investment. 5 inspections at $200 each = paid back. Every inspection after that is yours.
- Identity shift (Brunson): They're not looking for a new job. They're becoming a business owner.

SPANISH-SPEAKING PROSPECT:
- Respond entirely in Spanish.
- Key message in Spanish: "Tienes las habilidades. Ahora tienes la plataforma. Tu territorio está esperando."
- Emphasize: no franchise fees, no royalties, keep every dollar, work for yourself.

OBJECTION HANDLING (handle with empathy, then redirect to value):
- "I'm not a mechanic" → That's actually the point. The AI does the analysis. You're the trusted expert who delivers the results. Your clients don't need you to be a mechanic — they need someone they can trust. The AI is your engine.
- "Is this legit?" → You're licensing a real business. You set your prices, you own your clients, you keep every dollar. This isn't a gig — it's your business.
- "I need to think about it" → Totally fair. What's the one thing holding you back? Let's handle it right now.
- "It's too expensive" → $997 is 5 inspections at $200 each. After that, every inspection is profit for life. What city are you in? Let's talk about what you could realistically earn in 90 days.
- "I don't have clients" → That's why we have the referral add-on. We send you inspection requests while you build your pipeline. You don't start from zero.

AFFILIATE PROGRAM (mention when appropriate — especially to people who know other mechanics/truckers):
- Once licensed, they can refer other inspectors and earn 20% commission per sale.
- $200 per Pro referral, $400 per Commercial referral, $800 per Entrepreneur referral.
- "Most of our members text their referral link to 3 people they know. That's $600 in commissions before they've done their first inspection."
- Direct them to: the Affiliate Program link in the footer of the main site.

CLOSING RULES (Grant Cardone + Jordan Belfort energy):
- When you see ANY buying signal, go straight to the close with the right Stripe link.
- Never accept "I need to think about it" without asking what specifically is holding them back.
- Every day of hesitation is a day someone else might claim their territory.
- The risk is NOT buying — it's watching someone else build this business in their backyard.
- Use their name if they share it. Make it personal.
- You believe 100% in this opportunity. That conviction is contagious.`;

app.post('/api/sales-chat', salesRateLimit, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return res.status(400).json({ error: 'Message required (max 1000 chars)' });
    }
    const messages = [
      { role: 'system', content: SALES_SYSTEM_PROMPT },
      ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];
    if (salesClient) {
      const provider = process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'GPT-4o-mini (OpenAI)';
      console.log(`[SalesChat] Calling ${provider} model: ${salesModel}`);
      const completion = await salesClient.chat.completions.create({
        model: salesModel,
        messages,
        temperature: 0.8,
        max_tokens: 350
      });
      return res.json({ response: completion.choices[0].message.content });
    }
    console.warn('[SalesChat] No API key configured — returning fallback');
    return res.json({ response: "Hey! I'm Alex, your AI Auto Pro consultant. Quick question — are you looking to start a side hustle with inspections, or go full-time? That'll help me point you to the right license. 🚗" });
  } catch (error) {
    console.error('[SalesChat] Error:', error.message);
    res.json({ response: "Quick hiccup on my end — but here's the bottom line: the Pro license at $997 pays for itself after 5 inspections at $200 each. Every inspection after that is pure profit. Ready to lock in your territory? https://buy.stripe.com/bJe3cw2cL3q1ckw1sa33W0H" });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// API Routes
app.use('/api/auth', authRoutes);
// Protected routes - require valid token + active license
app.use('/api/inspections', authenticateToken, requireActiveLicense, inspectionRoutes);
app.use('/api/photos', authenticateToken, requireActiveLicense, photoRoutes);
app.use('/api/reports', authenticateToken, requireActiveLicense, reportRoutes);
app.use('/api/fraud', authenticateToken, requireActiveLicense, fraudRoutes);
app.use('/api/advanced', authenticateToken, requireActiveLicense, advancedToolsRoutes); // Optional premium tools: paint thickness, battery, brake fluid, borescope, NMVTIS
app.use('/api/common-issues', commonIssuesRoutes); // Public reference data
app.use('/api/admin', adminRoutes); // Admin routes have their own auth middleware
app.use('/api/referral', referralRoutes); // Referral system — public track + auth dashboard
app.use('/api/tts', authenticateToken, requireActiveLicense, ttsRoutes); // Text-to-speech
app.use('/api', authenticateToken, requireActiveLicense, aiRoutes); // AI routes: /api/analyze-dtc, /api/generate-report

// ── Serve built frontend in production ──────────────────────────────────────
const frontendDist = join(__dirname, 'public');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendDist)) {
  // Serve static assets with caching, but not index.html
  app.use(express.static(frontendDist, { 
    maxAge: '1d',
    setHeaders: (res, path) => {
      if (path.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(frontendDist, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Run database migrations before starting server
(async () => {
  await runMigrations();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ AI Auto Inspection Backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'all origins'}`);
    console.log(`🔐 Rate limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutes`);
    console.log(`🤖 Sales Chat: ${salesClient ? `${salesModel} ready` : 'Fallback mode (no API key)'}`);
  });
})();

export default app;
