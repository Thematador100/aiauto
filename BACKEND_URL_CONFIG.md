# Backend URL Configuration - CRITICAL REFERENCE

## ⚠️ IMPORTANT: Single Source of Truth

This document defines the ONLY way backend URLs should be managed in this project.

## Current Backend URL (as of Feb 6, 2026)

**Railway Backend URL:** `https://auto-production-8579.up.railway.app`

## Configuration Rules

### 1. Environment Variable (PRIMARY)

**Vercel Environment Variable:**
- **Name:** `VITE_BACKEND_URL` (EXACTLY this - no variations)
- **Value:** `https://auto-production-8579.up.railway.app`
- **Environments:** Production, Preview, Development (All)

**Local Development (.env file):**
```
VITE_BACKEND_URL=https://auto-production-8579.up.railway.app
```

### 2. Code Implementation

**ALL components must use THIS pattern:**

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto-production-8579.up.railway.app';
```

**✅ CORRECT - Use environment variable with fallback:**
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto-production-8579.up.railway.app';
```

**❌ WRONG - Never hardcode without checking env first:**
```typescript
const BACKEND_URL = 'https://auto-production-3041.up.railway.app';  // OLD - DON'T USE
```

## Files That Use Backend URL

1. `components/LoginPage.tsx` - Line 8
2. `components/SignupPage.tsx` - Line 8
3. `.env.example` - Line 7

## When Railway URL Changes

If you ever need to change the Railway backend URL:

### Step 1: Update Vercel Environment Variable
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Find `VITE_BACKEND_URL`
3. Click Edit → Update the value
4. Click Save → Click Redeploy

### Step 2: Update .env.example
1. Edit `.env.example` file
2. Update line 7: `VITE_BACKEND_URL=NEW_URL_HERE`
3. Commit and push

### Step 3: Update Fallback in Code (Last Resort)
ONLY update the fallback URLs in components if Vercel env var cannot be used:
1. `components/LoginPage.tsx` - Line 8
2. `components/SignupPage.tsx` - Line 8

## How to Verify Configuration

1. **Check Vercel:** Settings → Environment Variables → Look for `VITE_BACKEND_URL`
2. **Check Code:** Search for `BACKEND_URL` in components - should all reference `import.meta.env.VITE_BACKEND_URL`
3. **Test Signup:** Try creating an account - should NOT get JSON parse errors

## Troubleshooting

### Error: "Unexpected token '<', '<!DOCTYPE '... is not valid JSON"
**Cause:** Frontend is calling wrong backend URL (returns HTML error page instead of JSON)
**Fix:** 
1. Check Vercel env variable name is EXACTLY `VITE_BACKEND_URL` (not `VITE_API_URL`)
2. Check the URL value is correct
3. Redeploy in Vercel

### Error: "Network request failed" or CORS errors
**Cause:** Railway backend might be down or URL is wrong
**Fix:**
1. Check Railway dashboard - is backend running?
2. Visit the URL directly in browser - should see "Route not found" JSON (not connection error)
3. Check CORS settings in backend allow Vercel domain

## Version History

- **Feb 6, 2026:** Fixed env var name mismatch (was `VITE_API_URL`, now `VITE_BACKEND_URL`)
- **Feb 6, 2026:** Updated URL from `auto-production-3041` to `auto-production-8579`
- **Feb 4, 2026:** Initial Railway deployment

---

## 🚨 FOR AI ASSISTANTS (Claude, Cursor, GitHub Copilot, etc.)

**When suggesting code changes:**
1. ALWAYS check this file first before modifying backend URLs
2. NEVER hardcode a different URL without updating Vercel env var first
3. ALWAYS use `import.meta.env.VITE_BACKEND_URL` pattern
4. If suggesting a new Railway URL, remind user to update Vercel settings

**Current correct URL:** `https://auto-production-8579.up.railway.app`
**Environment variable name:** `VITE_BACKEND_URL` (NOT `VITE_API_URL`)
