# API Setup and Troubleshooting Guide

## Quick Start

Your app now supports **multiple AI providers with automatic fallback** for maximum reliability!

**Fallback Order:** Gemini → DeepSeek → OpenAI

### 1. Set Up Your API Keys

You only need **ONE** API key to get started, but having multiple providers ensures the app keeps working even if one fails.

#### Option A: Gemini Only (Recommended for beginners)

1. **Get your API key**:
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Configure the app**:
   ```bash
   # Open .env.local file
   nano .env.local

   # Add your Gemini API key
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Backup your keys** (IMPORTANT!):
   ```bash
   npm run backup-keys
   ```

4. **Restart the dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Start it again
   npm run dev
   ```

#### Option B: Multiple Providers (Maximum Reliability) ⭐ RECOMMENDED

Set up multiple AI providers for automatic fallback:

1. **Gemini (Primary)**:
   - Get key: https://aistudio.google.com/app/apikey
   - Free tier: 15 req/min, 1M req/day
   - Best for: All features

2. **DeepSeek (Backup)**:
   - Get key: https://platform.deepseek.com/api_keys
   - Very cost-effective
   - Fallback for: DTC analysis, report generation

3. **OpenAI (Optional)**:
   - Get key: https://platform.openai.com/api-keys
   - Widely available
   - Secondary fallback

Add all keys to `.env.local`:
```bash
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
DEEPSEEK_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Backup your keys:**
```bash
npm run backup-keys
```

### 2. Verify Setup

Once configured, test these features:

- ✅ **VIN Lookup**: Works without any API key (uses free NHTSA API)
- ✅ **DTC Analysis**: Requires at least one AI provider (Gemini/DeepSeek/OpenAI)
- ✅ **Report Generation**: Requires at least one AI provider
- ✅ **AI Chatbot**: Requires Gemini API (uses grounding features)
- ✅ **Feature Detection**: Requires Gemini API (uses vision features)

## API Key Backup System

**Problem:** The `.env.local` file is not tracked by git (for security), so it can be accidentally lost.

**Solution:** Built-in backup/restore system!

### Backup Your Keys
```bash
npm run backup-keys
```

- Saves to: `~/.auto-inspection-backups/`
- Keeps last 10 backups
- Run this whenever you add/update API keys

### Restore Your Keys
```bash
npm run restore-keys
```

- Restores most recent backup
- Backs up current `.env.local` before restoring
- Shows preview before confirming

## Troubleshooting

### Problem: "All AI providers failed"

**Cause**: None of your configured AI providers are working.

**Solution**:
1. Check if `.env.local` exists:
   ```bash
   ls -la .env.local
   ```
2. If missing, restore from backup:
   ```bash
   npm run restore-keys
   ```
3. Verify at least one API key is set correctly
4. Restart the dev server

### Problem: "Failed to analyze DTC codes"

**Cause**: The primary provider (Gemini) failed, and no backup providers are configured.

**Solution**:
1. Add a DeepSeek API key as backup:
   ```bash
   # Edit .env.local
   DEEPSEEK_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
2. Backup your keys:
   ```bash
   npm run backup-keys
   ```
3. Restart the server

### Problem: VIN lookup works but DTC analysis doesn't

**Cause**: VIN lookup uses the free NHTSA API (no key needed), but DTC analysis requires an AI provider.

**Solution**: Follow the API setup steps above to add at least one AI provider key.

### Problem: Lost my .env.local file

**Cause**: File was deleted or overwritten.

**Solution**:
1. Restore from backup:
   ```bash
   npm run restore-keys
   ```
2. If no backup exists, recreate it:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API keys
   ```
3. **Always backup after adding keys:**
   ```bash
   npm run backup-keys
   ```

### Problem: API was working before but now it's not

**Possible causes:**
1. `.env.local` was deleted/overwritten → Run `npm run restore-keys`
2. API key expired or quota exceeded → Check your API dashboard
3. Network issues → Check internet connection

**Solution**: Restore backup and verify keys are still valid.

## API Cost and Limits

### Google Gemini API
- **Free Tier**: 15 requests per minute, 1 million requests per day
- **Cost**: Free tier is very generous for development
- **Models Used**:
  - `gemini-2.5-flash`: Fast, good for DTC analysis and chatbot
  - `gemini-2.5-pro`: Higher quality for report generation

### DeepSeek API
- **Free Tier**: Check their website for current limits
- **Cost**: Very cost-effective compared to other providers
- **Model Used**: `deepseek-chat`

### OpenAI API
- **Free Tier**: Limited (usually requires payment)
- **Cost**: Pay-per-use pricing
- **Model Used**: `gpt-4o-mini` (most cost-effective)

### NHTSA vPIC API
- **Cost**: Completely free
- **Limits**: None specified
- **Used For**: VIN decoding only

## How the Fallback System Works

When you request an AI feature (DTC analysis, report generation):

1. **Try Gemini** (if configured)
   - If successful ✅ → Return result
   - If fails ❌ → Try next provider

2. **Try DeepSeek** (if configured)
   - If successful ✅ → Return result
   - If fails ❌ → Try next provider

3. **Try OpenAI** (if configured)
   - If successful ✅ → Return result
   - If fails ❌ → Show error

4. **All failed** → Show detailed error message

**Benefits:**
- ✅ Maximum uptime and reliability
- ✅ Cost optimization (use cheaper providers as backup)
- ✅ Avoid vendor lock-in
- ✅ Automatic failover

## Security Best Practices

1. **Never commit `.env.local`** to git (already in `.gitignore`)
2. **Never share your API keys** publicly
3. **Rotate your keys** if you suspect they've been compromised
4. **Use separate keys** for development and production
5. **Backup your keys** regularly with `npm run backup-keys`
6. **Backup location** (`~/.auto-inspection-backups/`) is outside the project directory for safety

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Recommended | None | Google Gemini API key (primary provider) |
| `DEEPSEEK_API_KEY` | Recommended | None | DeepSeek API key (backup provider) |
| `OPENAI_API_KEY` | Optional | None | OpenAI API key (secondary backup) |

**Note:** You only need ONE of the above keys, but having multiple ensures reliability.

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your API keys are valid at their respective dashboards
3. Make sure you restarted the dev server after changing `.env.local`
4. Check that `.env.local` is in the project root directory (same level as `package.json`)
5. Try restoring from backup: `npm run restore-keys`
6. Check if you have internet connectivity

## Advanced: Manual Backup/Restore

If the npm scripts don't work, you can manually backup/restore:

### Manual Backup
```bash
mkdir -p ~/.auto-inspection-backups
cp .env.local ~/.auto-inspection-backups/env.local.backup_$(date +%Y%m%d_%H%M%S)
```

### Manual Restore
```bash
# Find latest backup
ls -t ~/.auto-inspection-backups/env.local.backup_* | head -1

# Restore it (replace XXXXXX with actual backup filename)
cp ~/.auto-inspection-backups/env.local.backup_XXXXXX .env.local
```
