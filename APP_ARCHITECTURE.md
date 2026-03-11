# AI Auto Pro - Complete App Architecture & Business Model

## 🎯 What This App Actually Does

**AI Auto Pro** is a platform for **independent vehicle inspectors** (mechanics, pre-purchase inspectors, fleet managers) to perform professional vehicle inspections using AI assistance.

### Target Users
- Independent vehicle inspectors
- Mobile mechanics
- Pre-purchase inspection services
- Fleet inspection contractors
- Auto dealership inspectors

## 💰 Business Model

### Revenue Streams
1. **Subscription Model**: $49.99/month "Pro" plan
   - Unlimited inspections
   - AI-powered report summaries
   - Vehicle history integration
   - Diagnostic code analysis
   - AI assistant chat

2. **Pay-Per-Report Model** (Alternative/Complement):
   - Standard Car/SUV: $19.99
   - Electric Vehicle: $24.99
   - Motorcycle: $14.99
   - Commercial Truck: $39.99
   - RV: $34.99
   - Classic/Collector: $29.99

## 🔄 Complete User Flow

### 1. Onboarding/Login
- Inspector creates account → Chooses subscription plan
- Logs in (JWT authentication)

### 2. Dashboard
- View all past inspection reports
- See recent inspections (date, vehicle, VIN, report ID)
- Start new inspection

### 3. New Inspection Workflow

#### Step 1: Vehicle Identification
- **VIN Scan/Entry** → Auto-fills vehicle info (NHTSA API)
  - Year, Make, Model populated automatically
- **Select Vehicle Type** → Loads appropriate checklist template
  - Standard, Electric, Motorcycle, Commercial Truck, RV, Classic

#### Step 2: Inspection Form
- Systematic checklist (varies by vehicle type)
- For each item:
  - ✅ Check if pass/fail
  - 📸 **Take photos** of issues (unlimited)
  - 🎤 **Record audio notes** for details
  - 📝 Write text notes
- Enter odometer reading
- Overall inspection notes

#### Step 3: Finalize
- Review all data collected
- **AI generates professional report summary** using:
  - Gemini API (primary) or DeepSeek (fallback)
  - Analyzes all notes, photos, audio
  - Creates comprehensive written report
  - Categorizes findings (immediate/recommended/future)

#### Step 4: Report Delivery
- View beautifully formatted PDF report
- Download/Email to client
- Save to inspector's dashboard
- **Photos permanently stored and accessible**

### 4. Additional Tools

#### Diagnostic Tool (DTC Analyzer)
- Enter OBD-II trouble codes (P0300, etc.)
- AI explains what each code means
- Provides repair recommendations
- Shows common causes and fixes

#### AI Assistant
- Chat interface
- Ask questions about repairs
- Get recommendations for parts/services
- Grounded in Google Search + Google Maps

## 🏗️ Technical Architecture

### Current State (What's Missing)

```
✅ Frontend (React/TypeScript)
   - All UI components work
   - Forms, checklists, photo/audio capture
   - PDF generation
   - VIN lookup integration

❌ Backend (Node.js/Express) - MISSING
   - No API endpoints implemented
   - No server running

❌ Database (PostgreSQL) - MISSING
   - No data persistence
   - Currently using localStorage (temporary)

❌ Photo Storage (Cloudinary/S3) - MISSING
   - Photos stored as base64 in browser (temporary)
   - Not uploaded to cloud
   - No permanent URLs

❌ Authentication - INCOMPLETE
   - Frontend has mock user
   - No real login/signup
   - No JWT tokens
   - No password hashing
```

### Required Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  - Vehicle Inspection Forms                              │
│  - Photo/Audio Capture                                   │
│  - Dashboard                                             │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS/REST API
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Node.js/Express)               │
│                                                          │
│  Routes:                                                 │
│   POST /api/auth/signup          (Create account)       │
│   POST /api/auth/login           (Login, return JWT)    │
│   GET  /api/inspections          (List user's reports)  │
│   POST /api/inspections          (Save new inspection)  │
│   GET  /api/inspections/:id      (Get specific report)  │
│   POST /api/photos/upload        (Upload photo)         │
│   POST /api/analyze-dtc          (AI DTC analysis)      │
│   POST /api/generate-report      (AI report generation) │
│   POST /api/detect-features      (AI image analysis)    │
│                                                          │
│  Middleware:                                             │
│   - JWT authentication                                   │
│   - Rate limiting                                        │
│   - File upload (Multer)                                │
│   - Error handling                                       │
└─────────┬─────────────┬──────────────┬─────────────────┘
          │             │              │
          ▼             ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌────────────────┐
    │PostgreSQL│  │Cloudinary│  │ AI APIs        │
    │ Database │  │  Photo   │  │ - Gemini       │
    │          │  │  Storage │  │ - DeepSeek     │
    └──────────┘  └──────────┘  │ - OpenAI       │
                                └────────────────┘
```

### Database Schema

**users**
- id (UUID, primary key)
- email (unique)
- password_hash
- plan ('pro' | 'basic')
- created_at
- subscription_expires_at

**inspections**
- id (UUID, primary key)
- user_id (foreign key → users)
- vehicle_vin
- vehicle_make
- vehicle_model
- vehicle_year
- vehicle_type
- odometer
- overall_notes
- checklist_data (JSONB - stores full checklist)
- ai_summary (TEXT - AI-generated report)
- created_at
- updated_at

**photos**
- id (UUID, primary key)
- inspection_id (foreign key → inspections)
- category (string - which checklist item)
- cloudinary_url (string - permanent photo URL)
- cloudinary_public_id (string - for deletion)
- notes (TEXT)
- created_at

**audio_notes**
- id (UUID, primary key)
- inspection_id (foreign key → inspections)
- category (string)
- cloudinary_url (string - audio file URL)
- transcription (TEXT - optional AI transcription)
- created_at

## 🔐 Security Requirements

1. **Authentication**
   - JWT tokens (7-day expiry)
   - Bcrypt password hashing
   - Secure HTTP-only cookies

2. **Data Isolation**
   - Users can only access their own inspections
   - Row-level security in queries
   - User ID validated in middleware

3. **API Keys**
   - All AI API keys on backend ONLY
   - Never exposed to frontend
   - Environment variables on Railway

4. **File Upload Security**
   - File type validation (images/audio only)
   - Size limits (10MB per photo)
   - Malware scanning (optional)

## 📊 Data Flow Examples

### Example 1: Creating an Inspection

```
1. User fills out form on frontend with 10 photos
2. Frontend uploads each photo:
   POST /api/photos/upload (multipart/form-data)
   → Backend uploads to Cloudinary
   → Returns: { url: "https://cloudinary.../photo1.jpg", id: "uuid" }
3. Frontend collects all photo URLs
4. User clicks "Finalize"
5. Frontend sends complete inspection data:
   POST /api/inspections
   {
     vehicle: {...},
     checklist: {...},
     photoIds: ["uuid1", "uuid2", ...],
     odometer: "45000"
   }
6. Backend:
   - Validates JWT (user authenticated)
   - Saves to PostgreSQL
   - Calls Gemini API for AI summary
   - Returns: { inspectionId, aiSummary }
7. Frontend displays report
```

### Example 2: Viewing Past Inspections

```
1. User goes to Dashboard
2. Frontend:
   GET /api/inspections (with JWT header)
3. Backend:
   - Validates JWT → gets user_id
   - Queries: SELECT * FROM inspections WHERE user_id = ?
   - Joins photos table
   - Returns: [{ inspection1 }, { inspection2 }, ...]
4. Frontend displays table of reports
```

## 🚀 Deployment Architecture

### Frontend
- **Host**: Vercel / Railway Static
- **URL**: https://auto-inspection.vercel.app
- **Build**: React + Vite
- **Environment**: VITE_BACKEND_URL

### Backend
- **Host**: Railway
- **URL**: https://auto-production-3041.up.railway.app
- **Runtime**: Node.js 18+
- **Environment Variables**:
  - DATABASE_URL (Railway PostgreSQL)
  - GEMINI_API_KEY
  - DEEPSEEK_API_KEY
  - CLOUDINARY_* (3 keys)
  - JWT_SECRET

### Database
- **Host**: Railway PostgreSQL addon
- **Automatic backups**: Yes
- **Connection**: Direct from backend

### Photo Storage
- **Host**: Cloudinary (Free tier: 25GB)
- **Alternative**: AWS S3
- **CDN**: Automatic via Cloudinary

## ✅ Success Criteria (How to Know It Works)

1. ✅ Inspector can sign up and log in
2. ✅ Inspector can create inspection and see it tomorrow
3. ✅ Photos persist permanently (not in browser)
4. ✅ Different inspectors see only their own data
5. ✅ AI report generation works (with fallback)
6. ✅ DTC analyzer works
7. ✅ Dashboard shows all past inspections
8. ✅ Reports can be downloaded as PDF
9. ✅ Works on mobile phone
10. ✅ Data never lost (even if browser cache cleared)

## 🎯 MVP vs Full Features

### MVP (Minimum Viable Product)
- [x] User signup/login
- [x] Create inspection with photos
- [x] AI report generation
- [x] View past inspections
- [x] Download PDF
- [ ] **Backend implementation** ← CURRENT BLOCKER
- [ ] **Database setup** ← CURRENT BLOCKER
- [ ] **Photo cloud storage** ← CURRENT BLOCKER

### Future Features (Post-MVP)
- [ ] Stripe payment integration
- [ ] Email reports to clients
- [ ] SMS notifications
- [ ] Team/company accounts
- [ ] Report templates customization
- [ ] Native mobile apps (iOS/Android)
- [ ] Offline mode with sync
- [ ] Vehicle history reports (Carfax integration)
- [ ] Multi-language support

## 🔧 Implementation Priority

**Phase 1: Core Backend (NOW)**
1. Express server setup
2. PostgreSQL database + migrations
3. User authentication (signup/login)
4. Cloudinary photo upload
5. Save/retrieve inspections

**Phase 2: AI Integration**
6. Gemini API integration (with DeepSeek fallback)
7. Report generation endpoint
8. DTC analyzer endpoint

**Phase 3: Polish**
9. Error handling
10. Rate limiting
11. Logging
12. Testing

**Phase 4: Deployment**
13. Deploy to Railway
14. Configure environment variables
15. Test end-to-end
16. Go live!
