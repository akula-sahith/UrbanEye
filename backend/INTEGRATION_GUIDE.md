// INTEGRATION_GUIDE.md
# Gemini AI Integration Guide

Quick steps to integrate the Gemini Service into your UrbanEye backend.

## 📋 Step-by-Step Integration

### Step 1: Update Your .env File

```env
# Existing variables
OPENWEATHER_API_KEY=your_openweather_key
MONGODB_URI=your_mongodb_uri

# Add this NEW variable
GEMINI_API_KEY=your_gemini_api_key
```

**How to get `GEMINI_API_KEY`:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key
4. Copy and paste it into your `.env` file

### Step 2: Update server.js

Add the Gemini routes to your main server file:

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ========================================
// EXISTING ROUTES
// ========================================

const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);

// ========================================
// NEW: GEMINI ROUTES (Add these lines)
// ========================================

const geminiRoutes = require('./routes/geminiRoutes');
app.use('/api/gemini', geminiRoutes);

// ========================================

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### Step 3: Verify Files Are Created

Check that these files exist in your backend:

```
✅ utils/geminiService.js        - Main Gemini integration
✅ controllers/geminiController.js - API controllers
✅ routes/geminiRoutes.js        - API endpoints
✅ examples/geminiUsageExample.js - Usage examples
✅ GEMINI_AI_SETUP.md            - Full documentation
✅ INTEGRATION_GUIDE.md          - This file
```

### Step 4: Test the Integration

#### Test with cURL:

```bash
# Test 1: Query Gemini AI
curl -X POST http://localhost:3000/api/gemini/query \
  -H "Content-Type: application/json" \
  -d '{"question":"What events are happening today?"}'

# Test 2: Get Urban Data
curl http://localhost:3000/api/gemini/urban-data
```

#### Test with JavaScript (in browser console or Node.js):

```javascript
// Query the API
fetch('/api/gemini/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'What is the current weather and air quality?'
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data.aiResponse))
.catch(err => console.error('Error:', err));
```

## 🎯 Available Endpoints

### 1. **POST** `/api/gemini/query`

Ask Gemini AI a question about weather, pollution, and events.

**Request:**
```json
{
  "question": "What events are happening and how is the weather?",
  "lat": 16.5062,
  "lon": 80.6480
}
```

**Response:**
```json
{
  "success": true,
  "question": "...",
  "aiResponse": "AI generated answer...",
  "urbanData": { "weather": {...}, "pollution": {...}, "events": [...] },
  "metadata": {...}
}
```

### 2. **GET** `/api/gemini/urban-data`

Get raw urban data without AI processing (faster).

**Query Parameters:**
- `lat` (optional): latitude, default 16.5062
- `lon` (optional): longitude, default 80.6480

**Response:**
```json
{
  "success": true,
  "data": {
    "weather": { ... },
    "pollution": { ... },
    "events": [ ... ]
  }
}
```

## 💻 Quick Integration Examples

### Express.js Frontend Handler

```javascript
// Handle form submission
document.getElementById('askBtn').addEventListener('click', async () => {
  const question = document.getElementById('question').value;
  
  try {
    const response = await fetch('/api/gemini/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('answer').textContent = data.aiResponse;
      
      // Display urban data stats
      console.log('Weather:', data.urbanData.weather);
      console.log('Pollution:', data.urbanData.pollution);
      console.log('Events:', data.urbanData.events);
    } else {
      document.getElementById('answer').textContent = 'Error: ' + data.error;
    }
  } catch (err) {
    console.error('Error:', err);
  }
});
```

### React Component Example

```jsx
import { useState } from 'react';

function CityInsights() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [urbanData, setUrbanData] = useState(null);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      
      if (data.success) {
        setResponse(data.aiResponse);
        setUrbanData(data.urbanData);
      }
    } catch (err) {
      setResponse('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask about weather, events, or air quality..."
      />
      <button onClick={handleQuery} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      
      {response && (
        <div>
          <h3>AI Response:</h3>
          <p>{response}</p>
          
          {urbanData && (
            <div>
              <h3>Urban Data:</h3>
              <p>🌡️ Temperature: {urbanData.weather.temperature}°C</p>
              <p>💨 Air Quality: {urbanData.pollution.avgAQI}</p>
              <p>🎉 Events: {urbanData.eventCount}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CityInsights;
```

### Socket.io Real-time Example

```javascript
// server.js or socket.js
const io = require('socket.io')(server);
const { askAboutCity } = require('./utils/geminiService');

io.on('connection', (socket) => {
  socket.on('city-question', async (question) => {
    const result = await askAboutCity(question);
    socket.emit('city-answer', result);
  });
});
```

```javascript
// Client-side
const socket = io();

socket.emit('city-question', 'What events are happening?');
socket.on('city-answer', (result) => {
  console.log('AI Response:', result.aiResponse);
});
```

## 🔍 Example Questions You Can Ask

### Weather-Related
- "What's the weather like right now?"
- "Will it rain today?"
- "What should I wear?"
- "Is it too hot to go outside?"

### Air Quality-Related
- "How's the air quality?"
- "Is it safe to go jogging?"
- "What's the pollution level?"
- "Should I wear a mask?"

### Events-Related
- "What events are happening near me?"
- "Are there any conferences today?"
- "What's on this weekend?"

### Combined Questions
- "What events are happening and how's the weather?"
- "Should I go outside considering weather and pollution?"
- "Are there outdoor events I can attend given the conditions?"

## ⚙️ Configuration

### Change Default Location

Edit [utils/geminiService.js](utils/geminiService.js):

```javascript
async function askAboutCity(question, lat = 16.5062, lon = 80.6480) {
  // Change these default values to your city
}
```

### Change Event Search Radius

Edit [utils/geminiService.js](utils/geminiService.js):

```javascript
async function fetchNearbyEvents(lat, lon, radiusKm = 10) {
  // Change radiusKm default value (currently 10 km)
}
```

### Change AI Model

Edit [utils/geminiService.js](utils/geminiService.js):

```javascript
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Change to: "gemini-pro", "gemini-1.5-pro", etc.
```

## 🚀 Deployment Checklist

- [ ] Add `GEMINI_API_KEY` to `.env` in production
- [ ] Update `server.js` with gemini routes
- [ ] Test endpoints with cURL or Postman
- [ ] Verify MongoDB connection works
- [ ] Check OpenWeather API key is valid
- [ ] Test all example questions
- [ ] Set up error monitoring/logging
- [ ] Implement rate limiting if needed

## ❌ Troubleshooting

### "GEMINI_API_KEY is not defined"
```
✅ Solution: Add GEMINI_API_KEY to .env and restart server
```

### "Cannot find module '@google/generative-ai'"
```
✅ Solution: Run `npm install @google/generative-ai`
```

### "MongoDB connection error"
```
✅ Solution: 
- Ensure MongoDB is running
- Check MONGODB_URI in .env
```

### "No events found"
```
✅ Solution:
- Check if events exist with status "approved"
- Verify coordinates are within search radius
```

### "API rate limit exceeded"
```
✅ Solution:
- Implement response caching (5-10 min)
- Add request throttling
- Consider upgrading API plan
```

## 📊 Performance Tips

1. **Cache responses**: Cache urban data for 5-10 minutes
2. **Async operations**: Use Promise.all() for parallel API calls
3. **Error handling**: Always handle network failures gracefully
4. **Rate limiting**: Implement rate limiting on endpoints
5. **Batch queries**: Group multiple questions when possible

## 📚 Additional Resources

- [Google Generative AI Documentation](https://ai.google.dev/)
- [Gemini Models API](https://ai.google.dev/models/gemini)
- [OpenWeather API](https://openweathermap.org/api)
- [MongoDB Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)

## 🆘 Need Help?

1. Check [GEMINI_AI_SETUP.md](GEMINI_AI_SETUP.md) for detailed documentation
2. Review [examples/geminiUsageExample.js](examples/geminiUsageExample.js) for code examples
3. Check console logs for error messages
4. Verify all environment variables are set correctly

---

**🎉 You're all set!** Your UrbanEye backend now has AI-powered urban insights powered by Gemini.
