import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * POST /api/tts
 * Convert text to speech using OpenAI TTS API
 * Returns audio/mpeg binary stream
 */
router.post('/', async (req, res) => {
  try {
    const { text, voice = 'echo', speed = 1.0, model = 'tts-1' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 4096) {
      return res.status(400).json({ error: 'Text too long (max 4096 characters)' });
    }

    if (!openaiClient) {
      return res.status(503).json({ error: 'TTS service not configured (OPENAI_API_KEY missing)' });
    }

    console.log(`[TTS] Generating speech: ${text.substring(0, 50)}... (voice: ${voice})`);

    const mp3 = await openaiClient.audio.speech.create({
      model,
      voice,
      input: text,
      speed: Math.max(0.25, Math.min(4.0, speed)),
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=86400',
    });

    res.send(buffer);
  } catch (error) {
    console.error('[TTS] Error:', error);
    res.status(500).json({ error: 'Text-to-speech failed', details: error.message });
  }
});

/**
 * GET /api/tts/check
 * Check if TTS service is available
 */
router.get('/check', (req, res) => {
  res.json({
    available: !!openaiClient,
    provider: openaiClient ? 'OpenAI' : 'none',
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  });
});

export default router;
