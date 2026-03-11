# AI Auto Inspection Backend

Complete backend API for the AI Auto Pro vehicle inspection platform.

## 🏗️ Architecture

- **Framework**: Express.js (Node.js)
- **Database**: PostgreSQL (Railway)
- **File Storage**: Cloudinary
- **AI Providers**: Gemini (primary) → DeepSeek → OpenAI (automatic fallback)
- **Authentication**: JWT tokens with bcrypt password hashing

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Railway provides this)
- Cloudinary account (free tier available)
- At least one AI API key (Gemini recommended)

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server
PORT=3001
NODE_ENV=production

# Database (from Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# AI API Keys (at least one required)
GEMINI_API_KEY=AIzaSy...
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...

# Cloudinary (from cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_super_secret_random_string_change_this
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app
```

### 3. Run Database Migrations

```bash
npm run migrate
```

This creates all necessary tables:
- `users` - User accounts and authentication
- `inspections` - Vehicle inspection reports
- `photos` - Inspection photos (stored in Cloudinary)
- `audio_notes` - Audio recordings (stored in Cloudinary)

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3001`

### 5. Test the API

Health check:
```bash
curl http://localhost:3001/api/health
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

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user info

### Inspections
- `GET /api/inspections` - List user's inspections
- `GET /api/inspections/:id` - Get specific inspection
- `POST /api/inspections` - Create new inspection
- `PUT /api/inspections/:id` - Update inspection
- `DELETE /api/inspections/:id` - Delete inspection

### Photos
- `POST /api/photos/upload` - Upload photo to Cloudinary
- `POST /api/photos/upload-audio` - Upload audio note
- `GET /api/photos/inspection/:id` - Get inspection photos

### AI Services
- `POST /api/analyze-dtc` - Analyze diagnostic trouble codes
- `POST /api/generate-report` - Generate AI inspection report
- `POST /api/detect-features` - Detect vehicle features from image

See `BACKEND_API_SPEC.md` for detailed API documentation.

## 🚢 Deployment to Railway

### Option 1: Railway CLI (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link to your project:
```bash
railway link
```

4. Add PostgreSQL database (if not already added):
```bash
railway add postgresql
```

5. Set environment variables:
```bash
railway variables set GEMINI_API_KEY=your_key
railway variables set CLOUDINARY_CLOUD_NAME=your_name
# ... set all other variables from .env
```

6. Deploy:
```bash
railway up
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Go to Railway dashboard
3. Create new project → "Deploy from GitHub"
4. Select your repository
5. Railway will auto-detect Node.js and deploy
6. Add PostgreSQL from "New" → "Database" → "Add PostgreSQL"
7. Add environment variables in Settings → Variables
8. Run migration command in Settings → Deploy → "Custom Start Command":
   ```
   npm run migrate && npm start
   ```

### Post-Deployment

1. Get your Railway URL (e.g., `https://auto-production-3041.up.railway.app`)
2. Update frontend `.env`:
   ```
   VITE_BACKEND_URL=https://auto-production-3041.up.railway.app
   ```
3. Test health endpoint:
   ```bash
   curl https://auto-production-3041.up.railway.app/api/health
   ```

## 🔐 Security Features

- ✅ JWT authentication with 7-day expiry
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Row-level security (users only see their own data)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ API keys stored on backend only (never exposed to frontend)
- ✅ SQL injection prevention (parameterized queries)

## 🧪 Testing

Create a test user:
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","plan":"pro"}'
```

Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

Save the `token` from the response and use it for authenticated requests:
```bash
curl http://localhost:3001/api/inspections \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Database Schema

```sql
users
├── id (UUID, primary key)
├── email (unique)
├── password_hash
├── plan (basic/pro)
├── created_at
└── subscription_expires_at

inspections
├── id (UUID, primary key)
├── user_id (foreign key → users)
├── vehicle_vin
├── vehicle_make
├── vehicle_model
├── vehicle_year
├── vehicle_type
├── odometer
├── overall_notes
├── checklist_data (JSONB)
├── ai_summary (TEXT)
├── created_at
└── updated_at

photos
├── id (UUID, primary key)
├── inspection_id (foreign key → inspections)
├── category
├── cloudinary_url
├── cloudinary_public_id
├── notes
└── created_at

audio_notes
├── id (UUID, primary key)
├── inspection_id (foreign key → inspections)
├── category
├── cloudinary_url
├── cloudinary_public_id
├── transcription
└── created_at
```

## 🐛 Troubleshooting

**Database connection fails:**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check Railway database is provisioned

**AI requests fail:**
- Verify at least one API key is set correctly
- Check API key quotas/billing
- Review logs for specific error messages

**Photo upload fails:**
- Verify all 3 Cloudinary variables are set
- Check Cloudinary free tier limits (25GB/month)
- Ensure images are base64 encoded with proper data URI

**CORS errors:**
- Set `FRONTEND_URL` in environment variables
- Redeploy after changing CORS settings

## 📞 Support

For issues, refer to:
- `APP_ARCHITECTURE.md` - Complete system overview
- `BACKEND_API_SPEC.md` - API documentation
- Railway logs - For deployment errors
