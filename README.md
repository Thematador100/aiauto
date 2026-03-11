<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Sbnc1iHk6C-AHfLWRW4ers0aV7TRKwac

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API Keys:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Get your API keys:
     - **Gemini** (Primary): https://aistudio.google.com/app/apikey
     - **DeepSeek** (Backup): https://platform.deepseek.com/api_keys
   - Edit `.env.local` and add your API keys
   - **Backup your keys** (recommended):
     ```bash
     npm run backup-keys
     ```

3. Run the app:
   ```bash
   npm run dev
   ```

## API Configuration

### Multi-Provider AI System with Automatic Fallback

This app now supports **multiple AI providers** with automatic fallback for maximum reliability:

**Fallback Order:** Gemini → DeepSeek → OpenAI

If Gemini fails, the app automatically tries DeepSeek, then OpenAI. This ensures your app keeps working even if one provider has issues.

### Required APIs

1. **Google Gemini API** (Primary AI Provider)
   - **Used for**: DTC code analysis, report generation, chatbot, feature detection
   - **Get API key**: https://aistudio.google.com/app/apikey
   - **Cost**: Free tier with generous limits (15 req/min, 1M req/day)
   - **Configuration**: Set `GEMINI_API_KEY` in `.env.local`

2. **DeepSeek API** (Backup AI Provider) ⭐ NEW
   - **Used for**: Automatic fallback for DTC analysis, report generation
   - **Get API key**: https://platform.deepseek.com/api_keys
   - **Cost**: Very cost-effective (see pricing on their site)
   - **Configuration**: Set `DEEPSEEK_API_KEY` in `.env.local`

3. **OpenAI API** (Optional Secondary Backup)
   - **Used for**: Additional fallback option
   - **Get API key**: https://platform.openai.com/api-keys
   - **Configuration**: Set `OPENAI_API_KEY` in `.env.local` (optional)

4. **NHTSA vPIC API** (No API key required)
   - **Used for**: VIN decoding and vehicle data lookup
   - **Cost**: Free public API
   - **Configuration**: No configuration needed

### Features by API

| Feature | NHTSA API | Gemini API | DeepSeek API | OpenAI API |
|---------|-----------|------------|--------------|------------|
| VIN Lookup | ✅ | ❌ | ❌ | ❌ |
| Vehicle Data | ✅ | ❌ | ❌ | ❌ |
| DTC Analysis | ❌ | ✅ Primary | ✅ Fallback | ✅ Fallback |
| Report Generation | ❌ | ✅ Primary | ✅ Fallback | ✅ Fallback |
| AI Chatbot | ❌ | ✅ Only* | ❌ | ❌ |
| Feature Detection | ❌ | ✅ Only* | ❌ | ❌ |

\* Features marked "Only" require Gemini-specific capabilities (grounding, vision)

## API Key Backup & Restore

**Important:** The `.env.local` file is not tracked by git (for security). To avoid losing your API keys:

### Backup your API keys
```bash
npm run backup-keys
```

This saves your keys to `~/.auto-inspection-backups/` (keeps last 10 backups)

### Restore your API keys
```bash
npm run restore-keys
```

This restores your most recent backup.

## Troubleshooting

If you're experiencing API issues (especially with DTC analysis or other AI features not working), see the **[API Setup and Troubleshooting Guide](API_SETUP.md)** for detailed instructions.

**Common issues:**
- ❌ DTC analysis not working → Set `GEMINI_API_KEY` or `DEEPSEEK_API_KEY` in `.env.local`
- ✅ VIN lookup working → Uses free NHTSA API (no key required)
- ❌ "All AI providers failed" error → Check your API keys in `.env.local`
- ⚠️ Lost your `.env.local` file? → Run `npm run restore-keys`
# Trigger rebuild with environment variables
# Redeploy with environment variables configured
