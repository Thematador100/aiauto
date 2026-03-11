# System Health Checklist

**USE THIS CHECKLIST EVERY TIME someone asks "does it work" or "make sure it works"**

## ✅ Complete System Verification Checklist

### 1. Frontend Check
- [ ] All pages render without errors
- [ ] Forms accept and validate input
- [ ] UI components work (buttons, inputs, etc.)
- [ ] Mobile responsive
- [ ] PWA features working (if applicable)

### 2. Backend Check
- [ ] **Backend server exists and is deployed**
- [ ] All API endpoints are implemented
- [ ] Test each endpoint with curl/Postman
- [ ] Health check endpoint responds
- [ ] Error handling works

### 3. Database Check
- [ ] Database exists and is configured
- [ ] All tables/collections created
- [ ] Can read data
- [ ] Can write data
- [ ] Data persists after restart
- [ ] Migrations run successfully

### 4. Authentication Check
- [ ] Users can sign up
- [ ] Users can log in
- [ ] JWT/session tokens work
- [ ] Protected routes actually protected
- [ ] Logout works

### 5. Data Flow Check (End-to-End)
- [ ] User creates data → Saves to database → Can retrieve it
- [ ] Data persists across browser refreshes
- [ ] Data accessible from different devices
- [ ] Multi-user scenarios work (data isolation)

### 6. File Storage Check
- [ ] Photos/files can be uploaded
- [ ] Files saved to cloud storage (S3, Cloudinary, etc.)
- [ ] Files can be retrieved via URL
- [ ] Files persist permanently
- [ ] Storage limits configured

### 7. External APIs Check
- [ ] All API keys configured (backend only!)
- [ ] API calls succeed
- [ ] Fallback mechanisms work
- [ ] Rate limits respected
- [ ] Error handling for API failures

### 8. Security Check
- [ ] No API keys in frontend code
- [ ] No sensitive data in localStorage
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Input validation on backend
- [ ] SQL injection prevention
- [ ] XSS prevention

### 9. Performance Check
- [ ] Page load times acceptable
- [ ] Large images optimized
- [ ] Database queries optimized
- [ ] Caching implemented where needed

### 10. Deployment Check
- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] Database accessible from backend
- [ ] Environment variables set correctly
- [ ] Domain/URL configured
- [ ] SSL certificates valid

## Red Flags to Look For

❌ **"Mock" in any service file** → Not implemented yet
❌ **localStorage for user data** → No real persistence
❌ **base64 images in state** → No cloud storage
❌ **No database imports** → No database
❌ **API keys in frontend** → Security issue
❌ **404 on backend endpoints** → Backend not implemented
❌ **Placeholder comments** → Feature not done

## Full Stack Test Script

Run this to verify everything:

```bash
# 1. Test Frontend
curl http://localhost:3000
# Should return HTML

# 2. Test Backend Health
curl https://auto-production-3041.up.railway.app/api/health
# Should return {"status":"ok"}

# 3. Test Backend API - Create Report
curl -X POST https://auto-production-3041.up.railway.app/api/reports \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
# Should save to database

# 4. Test Backend API - Get Reports
curl https://auto-production-3041.up.railway.app/api/reports
# Should return saved reports from database

# 5. Test Photo Upload
curl -X POST https://auto-production-3041.up.railway.app/api/upload \
  -F "photo=@test-image.jpg"
# Should upload to S3/Cloudinary and return URL
```

## Questions to Ask Before Saying "It Works"

1. **Can a user create an inspection and find it tomorrow?** (Persistence)
2. **Can two different users each see only their own data?** (Multi-tenancy)
3. **If I clear my browser cache, is my data still there?** (Real storage)
4. **Can I take a photo and see it 3 months later?** (Photo storage)
5. **Does it work on a different computer/phone?** (Backend dependency)
6. **What happens if the API is down?** (Error handling)
7. **Can I deploy this to production right now?** (Production ready)

## Architecture Verification

```
User Input → Frontend → Backend API → Database
                             ↓
                       Cloud Storage (photos)
                             ↓
                       External APIs (AI)
```

**Every arrow must work for the system to work!**
