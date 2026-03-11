# Updated Pricing Strategy & System Architecture

## 💰 Revised Pricing: Quality-Based, Not Cheapest

### **Professional Inspectors (B2B)**

**Individual Pro Plan**: $99/month
- Unlimited inspections
- AI-powered fraud detection
- Known issues database
- PDF reports & email
- Cloud photo storage
- All advanced features

**Team Plan**: $299/month (up to 5 inspectors)
- Everything in Pro
- Team management dashboard
- Assign inspections to team members
- Shared company branding
- Centralized billing

**Enterprise**: Custom pricing
- Unlimited team members
- White-labeling
- Custom integrations
- Dedicated support
- API access

---

### **Individual Car Buyers (B2C)**

**5-Pack Inspections**: $199.99 (≈ $40 per inspection)
- 5 complete inspections (no expiration)
- AI-powered fraud detection
- Known issues alerts for make/model
- Recall checker
- Guided DIY inspection mode
- PDF reports
- "Should I Buy?" recommendation

**Single Inspection**: $49.99
- One complete inspection
- All features from 5-pack
- Perfect for one-time buyers

**Premium Single Inspection**: $149.99
- Everything in Single +
- Full VIN history report (Carfax/AutoCheck)
- Professional inspector consultation (30 min phone call)
- Paint thickness readings interpretation
- Negotiation tips based on findings

---

## 🏗️ Multi-Tier User Architecture

### User Types & Data Isolation

```
┌─────────────────────────────────────────────────────────┐
│                     PLATFORM ADMIN                       │
│  - Can see all users (B2B and B2C)                      │
│  - Manage subscriptions                                  │
│  - View platform analytics                               │
│  - Support ticket management                             │
│  - Cannot see individual inspection details              │
│    (privacy protection)                                  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│   B2B PROFESSIONAL   │              │   B2C INDIVIDUAL     │
│     INSPECTORS       │              │     CAR BUYERS       │
├──────────────────────┤              ├──────────────────────┤
│ Account Type: "pro"  │              │ Account Type: "diy"  │
│                      │              │                      │
│ Can Create:          │              │ Can Create:          │
│ - Companies          │              │ - Personal insp.     │
│ - Team members       │              │ - Only their own     │
│ - Client inspections │              │                      │
│                      │              │ Cannot Access:       │
│ Cannot Access:       │              │ - Pro features       │
│ - DIY user data      │              │ - Team management    │
│ - Other companies    │              │ - Other users        │
└──────────────────────┘              └──────────────────────┘
```

### Database Schema Updates

```sql
-- Updated users table
ALTER TABLE users ADD COLUMN user_type VARCHAR(50); -- 'admin', 'pro', 'diy'
ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE users ADD COLUMN inspection_credits INTEGER; -- For B2C 5-packs
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50); -- 'active', 'cancelled', 'expired'

-- New companies table (for B2B teams)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  business_email VARCHAR(255),
  business_phone VARCHAR(50),
  subscription_tier VARCHAR(50), -- 'individual', 'team', 'enterprise'
  max_team_members INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team members (for B2B)
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'owner', 'admin', 'inspector'
  can_manage_team BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Update inspections table
ALTER TABLE inspections ADD COLUMN user_type VARCHAR(50); -- 'pro' or 'diy'
ALTER TABLE inspections ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE inspections ADD COLUMN assigned_to_user_id UUID REFERENCES users(id);

-- Fraud detection indicators (new tables for Phase 2A)
CREATE TABLE odometer_fraud_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  claimed_mileage INTEGER,
  pedal_wear_severity VARCHAR(50), -- 'light', 'moderate', 'severe'
  steering_wear_severity VARCHAR(50),
  seat_wear_severity VARCHAR(50),
  pedal_photo_url TEXT,
  steering_photo_url TEXT,
  seat_photo_url TEXT,
  carfax_last_mileage INTEGER,
  carfax_last_date DATE,
  mileage_discrepancy INTEGER, -- Difference between claimed and estimated
  fraud_probability DECIMAL(3,2), -- 0.00 to 1.00
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE flood_damage_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  musty_smell_detected BOOLEAN DEFAULT false,
  water_stains_found BOOLEAN DEFAULT false,
  water_stain_locations TEXT[],
  rust_in_unusual_places BOOLEAN DEFAULT false,
  foggy_lights BOOLEAN DEFAULT false,
  carpet_replaced BOOLEAN DEFAULT false,
  electrical_corrosion BOOLEAN DEFAULT false,
  nicb_flood_record BOOLEAN DEFAULT false,
  vin_title_state_changes INTEGER,
  flood_probability DECIMAL(3,2),
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE accident_concealment_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  paint_thickness_readings JSONB, -- {"hood": 150, "door": 200, ...}
  panel_gaps_uneven BOOLEAN DEFAULT false,
  overspray_detected BOOLEAN DEFAULT false,
  overspray_locations TEXT[],
  paint_mismatch BOOLEAN DEFAULT false,
  frame_welding_visible BOOLEAN DEFAULT false,
  bolt_replacement_detected BOOLEAN DEFAULT false,
  replaced_parts TEXT[],
  carfax_accident_reported BOOLEAN,
  carfax_structural_damage BOOLEAN,
  concealment_probability DECIMAL(3,2),
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Security & Data Isolation Rules

### API Middleware Rules

```javascript
// Authentication middleware checks:
1. Is user authenticated? (JWT valid)
2. What is user_type? ('admin', 'pro', 'diy')
3. If accessing inspection:
   - PRO users: Can only access inspections where user_id = their ID OR company_id = their company
   - DIY users: Can only access inspections where user_id = their ID
   - ADMIN users: Can access all, but only for support/analytics

4. If accessing company:
   - Only company owner or members can access
   - DIY users get 403 Forbidden

5. If accessing team members:
   - Only company owner/admin can manage
   - DIY users get 403 Forbidden
```

### Row-Level Security Examples

```sql
-- PRO user getting inspections
SELECT * FROM inspections
WHERE (user_id = $1 OR company_id = (SELECT company_id FROM users WHERE id = $1))
AND user_type = 'pro';

-- DIY user getting inspections
SELECT * FROM inspections
WHERE user_id = $1
AND user_type = 'diy';

-- ADMIN getting all inspections (for analytics only, privacy-protected)
SELECT
  id,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  created_at,
  user_type,
  -- DO NOT SELECT: user_id, vin, customer details
FROM inspections;
```

---

## 🖥️ Enterprise Admin Panel Features

### Dashboard
- **Platform Overview**:
  - Total users (B2B vs B2C breakdown)
  - Active subscriptions
  - Total inspections this month
  - Revenue (MRR, ARR)
  - Churn rate

- **Real-time Metrics**:
  - Inspections per day (chart)
  - New signups per day
  - Most popular vehicle makes/models
  - Average inspection score (1-10)

### User Management
- **View All Users**:
  - Filter by type (Pro, DIY, Admin)
  - Search by email/name
  - View subscription status
  - See inspection count

- **User Actions**:
  - Reset password
  - Extend subscription
  - Add inspection credits (DIY users)
  - Ban/suspend account
  - View audit log

### Support
- **Ticket System**:
  - Users can submit support tickets
  - Admin can respond
  - Ticket status tracking
  - Priority levels

- **Activity Log**:
  - Recent logins
  - Failed login attempts
  - Inspection creation events
  - Subscription changes

### Revenue Management
- **Subscriptions**:
  - View all active subscriptions
  - Upcoming renewals
  - Failed payments
  - Manual subscription adjustments

- **Reports**:
  - Revenue by plan type
  - Lifetime value (LTV)
  - Customer acquisition cost (CAC)
  - Export to CSV

### Content Management
- **Common Issues Database**:
  - Add/edit known vehicle issues
  - Bulk import from CSV
  - View most-flagged issues
  - Update repair cost estimates

- **Fraud Detection Tuning**:
  - View fraud detection accuracy
  - Adjust AI thresholds
  - Review false positives

---

## 🚪 Login & Authentication System

### Login Page (Unified)
```
┌─────────────────────────────────────┐
│        AI AUTO PRO                  │
│   Professional Vehicle Inspections  │
├─────────────────────────────────────┤
│                                     │
│   Email:    [________________]      │
│   Password: [________________]      │
│                                     │
│   [ ] Remember me                   │
│                                     │
│   [    Log In    ]                  │
│                                     │
│   Forgot password? | Sign up        │
│                                     │
└─────────────────────────────────────┘
```

**After Login**: Route based on `user_type`:
- `admin` → Enterprise Admin Dashboard
- `pro` → Professional Inspector Dashboard (existing)
- `diy` → DIY Inspector Dashboard (simplified UI)

### Sign Up Flow

**Step 1: Choose Account Type**
```
Are you a:
○ Professional Inspector ($99/month)
  - Unlimited inspections
  - Team management
  - Client reports

○ Individual Car Buyer (5 for $199.99)
  - DIY inspections
  - Fraud detection
  - "Should I buy?" reports

[Continue]
```

**Step 2: Account Details**
- Email
- Password
- Name/Company name (if pro)

**Step 3: Payment**
- Stripe Checkout
- Plan selection confirmation

**Step 4: Onboarding**
- PRO: Welcome tour, "Create your first inspection"
- DIY: Tutorial video, "Start your first inspection"

---

## 📱 UI Differences: PRO vs DIY

### PRO Dashboard
```
┌─────────────────────────────────────────┐
│ [Logo] AI Auto Pro  |  Dashboard  Tools │
├─────────────────────────────────────────┤
│                                         │
│  Welcome back, Mike's Auto Inspection   │
│  Pro Plan ($99/month) | Team: 3 members │
│                                         │
│  [+ New Inspection]  [Invite Inspector] │
│                                         │
│  Recent Inspections (Full Table)        │
│  - Date | Vehicle | VIN | Assigned To   │
│  - 12/11 | 2018 Civic | 1HGBH... | Mike│
│  - 12/10 | 2020 F-150 | 1FTEW... | John│
│                                         │
│  Team Members: [Manage]                 │
│  Company Settings: [Edit Branding]      │
│                                         │
└─────────────────────────────────────────┘
```

### DIY Dashboard
```
┌─────────────────────────────────────────┐
│ [Logo] AI Auto Pro  |  My Inspections   │
├─────────────────────────────────────────┤
│                                         │
│  Welcome back, Sarah!                   │
│  Credits remaining: 3 of 5              │
│                                         │
│  [+ Start New Inspection]               │
│  [Buy More Credits]                     │
│                                         │
│  My Inspections (Simplified)            │
│  ┌───────────────────────────────┐      │
│  │ 2017 Honda Accord             │      │
│  │ Score: 7/10                   │      │
│  │ Recommendation: Good buy with │      │
│  │ minor repairs needed          │      │
│  │ [View Report]                 │      │
│  └───────────────────────────────┘      │
│                                         │
│  ┌───────────────────────────────┐      │
│  │ 2019 Toyota Camry             │      │
│  │ Score: 4/10                   │      │
│  │ ⚠️ Do NOT buy - flood damage  │      │
│  │ [View Report]                 │      │
│  └───────────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Updated User Flow

### Professional Inspector (PRO)
1. Sign up → Choose "Professional Inspector"
2. Pay $99/month (Stripe)
3. Land on Pro Dashboard
4. Can create company (optional)
5. Can invite team members
6. Create inspections for clients
7. Email reports to clients
8. View all company inspections

### Individual Car Buyer (DIY)
1. Sign up → Choose "Individual Car Buyer"
2. Buy 5-pack ($199.99) or single ($49.99)
3. Land on DIY Dashboard
4. Click "Start New Inspection"
5. Guided inspection mode:
   - "Take photo of pedals"
   - "Check for musty smell"
   - "Upload engine bay photo"
6. AI analyzes all photos
7. Get "Should I Buy?" report:
   - Overall score (1-10)
   - Top 3 concerns
   - Estimated repair costs
   - Fair price range
8. Download PDF or email to themselves

### Platform Admin (ADMIN)
1. Admin accounts created manually (no signup)
2. Land on Enterprise Admin Panel
3. View platform metrics
4. Manage users
5. Handle support tickets
6. Tune fraud detection
7. Update common issues database

---

## 🚀 Implementation Order

### Phase 2A.1: User Architecture & Login (10-12 hours)
1. Update database schema (user_type, companies, etc.)
2. Create proper login page (replace mock auth)
3. Create signup page with account type selection
4. Route users to correct dashboard based on type
5. Implement row-level security in all API endpoints
6. Create DIY dashboard (simplified UI)

### Phase 2A.2: Fraud Detection - Odometer (8-10 hours)
7. Add fraud indicator tables to database
8. Create "Fraud Detection" section in inspection form
9. Upload pedal/steering/seat wear photos
10. Backend: AI analysis endpoint for wear patterns
11. Calculate fraud probability
12. Display in report with red flags

### Phase 2A.3: Fraud Detection - Flood (6-8 hours)
13. Add flood damage checklist items
14. NICB API integration
15. AI photo analysis for water stains/rust
16. Calculate flood probability
17. Display warnings in report

### Phase 2B: Common Issues Database (12-15 hours)
18. Scrape NHTSA TSB/complaints data
19. Manual entry for top 50 models
20. Real-time alerts when VIN entered
21. Include in PDF reports

### Phase 2C: Admin Panel (15-20 hours)
22. Create admin dashboard UI
23. User management interface
24. Platform analytics
25. Support ticket system
26. Revenue reporting

---

## 💡 Next Immediate Steps

1. ✅ Update pricing documentation (done)
2. Start Phase 2A.1: Build user architecture
   - Update database migration
   - Build login page
   - Implement user type routing
3. Then Phase 2A.2: Odometer fraud detection
4. Then Phase 2A.3: Flood damage detection

**Ready to start building?** I'll begin with Phase 2A.1: User Architecture & Login system.
