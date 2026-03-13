import express from 'express';
import OpenAI from 'openai';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

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

/**
 * POST /api/tts/transcribe
 * Transcribe audio file using OpenAI Whisper
 * Accepts multipart/form-data with 'audio' field
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(503).json({ error: 'Transcription service not available (OPENAI_API_KEY missing)' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`[Whisper] Transcribing audio: ${req.file.size} bytes, type: ${req.file.mimetype}`);

    // Create a File-like object from the buffer
    const { Readable } = await import('stream');
    const stream = Readable.from(req.file.buffer);
    stream.path = req.file.originalname || 'recording.webm';

    const transcription = await openaiClient.audio.transcriptions.create({
      file: stream,
      model: 'whisper-1',
      language: 'en',
    });

    console.log(`[Whisper] Transcription complete: "${transcription.text.substring(0, 80)}..."`);
    res.json({ transcript: transcription.text });
  } catch (error) {
    console.error('[Whisper] Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

export default router;
