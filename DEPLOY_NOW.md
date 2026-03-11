# 🚀 One-Click Deploy to Vercel

Click the button below to deploy your AI Auto Pro platform to Vercel in 60 seconds:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Thematador100/auto&env=VITE_BACKEND_URL&envDescription=Backend%20API%20URL%20from%20Railway&envLink=https://railway.app&project-name=ai-auto-pro&repository-name=ai-auto-pro)

## What happens when you click:

1. Vercel will ask you to login (if not already)
2. It will clone your repository
3. It will ask for the environment variable:
   - `VITE_BACKEND_URL` = `https://auto-production-3041.up.railway.app`
4. It will automatically build and deploy
5. You'll get a live URL in ~2 minutes

## After deployment:

**Your live URL will be:** `https://ai-auto-pro-[random].vercel.app`

**Login with:**
- Email: `admin@test.com`
- Password: `admin123`

---

## Manual Deploy (Alternative)

If the button doesn't work, deploy manually:

1. Go to: https://vercel.com/new
2. Import from Git: `Thematador100/auto`
3. Add environment variable:
   ```
   VITE_BACKEND_URL = https://auto-production-3041.up.railway.app
   ```
4. Click "Deploy"

---

## Troubleshooting

**If you can't login:**
The Railway database might not have test users. Run this:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Create test users
railway run node backend/utils/create-test-users.js
```

Then refresh your Vercel site and login with `admin@test.com` / `admin123`

---

## Backend Status

✅ Backend is already deployed and running on Railway
✅ Database is configured
✅ API is responding at: https://auto-production-3041.up.railway.app

All you need is to deploy the frontend!
