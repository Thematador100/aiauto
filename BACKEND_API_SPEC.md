# Backend API Specification

This document specifies the API endpoints that your Railway backend needs to implement.

## Base URL
Production: `https://auto-production-3041.up.railway.app`

## Authentication
- No authentication required for now (add JWT/API keys in future)

## Endpoints

### 1. Health Check
**GET** `/api/health`

Check if the backend is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1702345678000
}
```

---

### 2. Analyze DTC Codes
**POST** `/api/analyze-dtc`

Analyze diagnostic trouble codes using AI (Gemini/DeepSeek/OpenAI).

**Request Body:**
```json
{
  "codes": [
    { "code": "P0300", "description": "" },
    { "code": "P0171", "description": "" }
  ]
}
```

**Response:**
```json
{
  "analysis": "## P0300: Random/Multiple Cylinder Misfire Detected\n\n**Definition:** This code indicates..."
}
```

**Error Response:**
```json
{
  "error": "Failed to analyze DTC codes: API key not configured"
}
```

---

### 3. Generate Report Summary
**POST** `/api/generate-report`

Generate an inspection report summary using AI.

**Request Body:**
```json
{
  "inspectionState": {
    "vehicle": {
      "year": "2020",
      "make": "Toyota",
      "model": "Camry",
      "vin": "1HGCM82633A123456"
    },
    "odometer": 45000,
    "overallNotes": "Vehicle in good condition",
    "checklist": { /* ... */ }
  }
}
```

**Response:**
```json
{
  "summary": "## Vehicle Inspection Summary\n\n### 1. Overall Condition Assessment\n..."
}
```

---

### 4. Detect Vehicle Features
**POST** `/api/detect-features`

Detect vehicle features from an image using AI vision.

**Request Body:**
```json
{
  "image": "base64_encoded_image_data..."
}
```

**Response:**
```json
{
  "features": ["sunroof", "alloy wheels", "spoiler", "roof rack"]
}
```

---

### 5. Save Report
**POST** `/api/reports`

Save a completed inspection report.

**Request Body:**
```json
{
  "id": "report-123",
  "vehicle": { /* ... */ },
  "summary": "...",
  "timestamp": 1702345678000
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "report-123"
}
```

---

### 6. Get Reports
**GET** `/api/reports`

Get all saved reports.

**Response:**
```json
{
  "reports": [
    {
      "id": "report-123",
      "vehicle": { /* ... */ },
      "summary": "...",
      "timestamp": 1702345678000
    }
  ]
}
```

---

## Environment Variables (Backend)

Your Railway backend needs these environment variables:

```bash
# Primary AI Provider
GEMINI_API_KEY=AIzaSy...

# Backup AI Provider
DEEPSEEK_API_KEY=sk-...

# Optional Secondary Backup
OPENAI_API_KEY=sk-...

# Port
PORT=3001
```

## Implementation Notes

1. **AI Provider Fallback**: Implement automatic fallback (Gemini → DeepSeek → OpenAI)
2. **Error Handling**: Return proper error messages
3. **CORS**: Enable CORS for your frontend domain
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Logging**: Log all API requests for debugging

## Example Backend Structure (Node.js/Express)

```javascript
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For images

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Analyze DTC
app.post('/api/analyze-dtc', async (req, res) => {
  try {
    const { codes } = req.body;
    // Use Gemini/DeepSeek API to analyze codes
    const analysis = await analyzeDTCCodes(codes);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ... implement other endpoints

app.listen(process.env.PORT || 3001, () => {
  console.log('Backend running on port', process.env.PORT || 3001);
});
```

## Testing

Test each endpoint:
```bash
# Health check
curl https://auto-production-3041.up.railway.app/api/health

# Analyze DTC
curl -X POST https://auto-production-3041.up.railway.app/api/analyze-dtc \
  -H "Content-Type: application/json" \
  -d '{"codes":[{"code":"P0300","description":""}]}'
```
