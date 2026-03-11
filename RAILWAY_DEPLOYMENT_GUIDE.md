# Railway Deployment Guide - AI Auto Pro

Complete step-by-step guide to deploy the backend to Railway.

## 🚀 Quick Start

Your Railway backend URL: **https://auto-production-3041.up.railway.app**

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ Railway account created
- ✅ Railway CLI installed: `npm install -g @railway/cli`
- ✅ PostgreSQL database provisioned in Railway
- ✅ Cloudinary account (free tier)
- ✅ At least one AI API key (Gemini, DeepSeek, or OpenAI)
- ✅ All environment variables ready

## 🔧 Step 1: Prepare Environment Variables

You'll need these variables. Gather them before starting:

### Database (from Railway PostgreSQL)
```
DATABASE_URL=postgresql://postgres:password@host.railway.app:port/railway
```
**Where to find**: Railway Dashboard → PostgreSQL service → Variables → DATABASE_URL

### Cloudinary (from cloudinary.com/console)
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```
**Where to find**: Cloudinary Dashboard → Settings → Account

### AI API Keys

**Gemini** (Recommended - Free tier available):
```
GEMINI_API_KEY=AIzaSyA...
```
**Where to get**: https://makersuite.google.com/app/apikey

**DeepSeek** (Cost-effective backup):
```
DEEPSEEK_API_KEY=sk-...
```
**Where to get**: https://platform.deepseek.com/api_keys

**OpenAI** (Optional fallback):
```
OPENAI_API_KEY=sk-...
```
**Where to get**: https://platform.openai.com/api-keys

### Other Variables
```
JWT_SECRET=generate_a_random_string_here_at_least_32_characters_long
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
PORT=3001
NODE_ENV=production
```

## 🚂 Step 2: Deploy to Railway

### Option A: Using Railway CLI (Recommended)

1. **Login to Railway:**
   ```bash
   railway login
   ```

2. **Navigate to backend directory:**
   ```bash
   cd /home/user/auto/backend
   ```

3. **Link to your Railway project:**
   ```bash
   railway link
   ```
   Select your existing project: `auto-production-3041`

4. **Add PostgreSQL (if not already added):**
   ```bash
   railway add postgresql
   ```
   Railway will automatically set `DATABASE_URL`

5. **Set all environment variables:**
   ```bash
   # AI Keys
   railway variables set GEMINI_API_KEY="AIzaSy..."
   railway variables set DEEPSEEK_API_KEY="sk-..."
   railway variables set OPENAI_API_KEY="sk-..."

   # Cloudinary
   railway variables set CLOUDINARY_CLOUD_NAME="your_cloud_name"
   railway variables set CLOUDINARY_API_KEY="123456789"
   railway variables set CLOUDINARY_API_SECRET="abc123..."

   # JWT
   railway variables set JWT_SECRET="your_random_32_char_secret"
   railway variables set JWT_EXPIRES_IN="7d"

   # Server
   railway variables set NODE_ENV="production"
   railway variables set PORT="3001"
   railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
   ```

6. **Deploy the backend:**
   ```bash
   railway up
   ```

7. **Run database migrations:**
   ```bash
   railway run npm run migrate
   ```

### Option B: Using GitHub Integration

1. **Push backend to GitHub:**
   ```bash
   cd /home/user/auto
   git add backend/
   git commit -m "Add complete backend implementation"
   git push origin claude/fix-api-issues-01SNuZBwsLomQtnY35N7NTfm
   ```

2. **Configure Railway:**
   - Go to Railway dashboard
   - Select your project
   - Go to Settings → Deploy
   - Change **Root Directory** to `backend`
   - Save changes

3. **Add environment variables in Railway UI:**
   - Go to Variables tab
   - Click "New Variable"
   - Add all variables from Step 1

4. **Add PostgreSQL:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway auto-configures `DATABASE_URL`

5. **Deploy:**
   - Go to Deployments tab
   - Click "Deploy"
   - Wait for build to complete

6. **Run migrations:**
   - Go to Settings → Deploy
   - Under "Custom Start Command", temporarily set:
     ```
     npm run migrate && npm start
     ```
   - Click "Redeploy"
   - After migration completes, change back to:
     ```
     npm start
     ```

## ✅ Step 3: Verify Deployment

1. **Check deployment logs:**
   ```bash
   railway logs
   ```

   Look for:
   ```
   ✅ AI Auto Inspection Backend running on port 3001
   ✅ Database connected successfully
   ✅ Gemini API initialized
   ✅ Cloudinary configured successfully
   ```

2. **Test health endpoint:**
   ```bash
   curl https://auto-production-3041.up.railway.app/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-12-11T...",
     "service": "AI Auto Inspection Backend",
     "version": "1.0.0"
   }
   ```

3. **Test signup:**
   ```bash
   curl -X POST https://auto-production-3041.up.railway.app/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123","plan":"pro"}'
   ```

4. **Test login:**
   ```bash
   curl -X POST https://auto-production-3041.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

## 🔗 Step 4: Connect Frontend to Backend

1. **Update frontend `.env.local`:**
   ```bash
   cd /home/user/auto
   ```

   Edit `.env.local`:
   ```env
   VITE_BACKEND_URL=https://auto-production-3041.up.railway.app
   ```

2. **Rebuild frontend:**
   ```bash
   npm run build
   ```

3. **Test the connection:**
   - Open your frontend in browser
   - Try signing up/logging in
   - Create a test inspection
   - Verify data persists after page reload

## 🐛 Troubleshooting

### Issue: "Database connection failed"

**Solution:**
```bash
# Check DATABASE_URL is set
railway variables | grep DATABASE_URL

# Verify PostgreSQL is running
railway status

# Check logs for errors
railway logs --filter postgres
```

### Issue: "AI API calls failing"

**Solution:**
```bash
# Verify API keys are set
railway variables | grep API_KEY

# Check which provider is failing in logs
railway logs | grep "\[AI\]"

# Test individual providers:
# - Gemini: Check quota at https://makersuite.google.com
# - DeepSeek: Check balance at https://platform.deepseek.com
# - OpenAI: Check usage at https://platform.openai.com
```

### Issue: "Photo upload fails"

**Solution:**
```bash
# Verify Cloudinary variables
railway variables | grep CLOUDINARY

# Check Cloudinary free tier limits (25GB/month)
# Visit: https://cloudinary.com/console

# Test Cloudinary connection:
railway run node -e "import('./config/cloudinary.js').then(c => console.log(c.isConfigured()))"
```

### Issue: "CORS errors from frontend"

**Solution:**
```bash
# Update FRONTEND_URL variable
railway variables set FRONTEND_URL="https://your-actual-frontend-url.vercel.app"

# Redeploy
railway up
```

### Issue: "Migrations didn't run"

**Solution:**
```bash
# Run migrations manually
railway run npm run migrate

# Or connect to database directly
railway psql

# Then check tables exist:
\dt
# Should show: users, inspections, photos, audio_notes
```

## 📊 Post-Deployment Monitoring

### Check Railway Dashboard

1. **Metrics tab:**
   - Monitor CPU/memory usage
   - Track request counts
   - Check error rates

2. **Logs tab:**
   - Filter by error level
   - Search for specific routes
   - Monitor AI provider fallbacks

3. **Variables tab:**
   - Verify all secrets are set
   - Update keys if needed

### Set Up Alerts (Optional)

```bash
# Get notified of deployment failures
railway notifications enable

# Monitor database size
# Railway free tier: 512MB PostgreSQL
# Check usage in PostgreSQL service dashboard
```

## 💰 Cost Estimate

**Railway:**
- Hobby Plan: $5/month (500 hours execution)
- Pro Plan: $20/month (unlimited)

**Cloudinary:**
- Free tier: 25GB storage, 25GB bandwidth/month
- Usually sufficient for MVP

**AI APIs:**
- Gemini: Free tier (60 requests/minute)
- DeepSeek: ~$0.14 per 1M tokens (very affordable)
- OpenAI: ~$0.15 per 1M tokens (GPT-4o-mini)

**Estimated total for MVP: $5-10/month**

## 🎉 Success!

If all tests pass, your backend is live and ready for production use!

Next steps:
1. Deploy frontend to Vercel
2. Test complete user flow (signup → inspection → report)
3. Monitor logs for first few days
4. Set up automatic backups (Railway Pro feature)

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Gemini API Docs](https://ai.google.dev/docs)
