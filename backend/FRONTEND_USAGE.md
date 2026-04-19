// FRONTEND_USAGE.md
# Frontend Usage Guide - Gemini AI Routes

## 📋 API Endpoints

Your backend now has these endpoints ready to call from the frontend:

### 1. **Ask Gemini AI a Question**

**POST** `/api/gemini/ask`

**cURL:**
```bash
curl -X POST http://localhost:5000/api/gemini/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What events are happening and how is the weather?"}'
```

**JavaScript Fetch:**
```javascript
async function askAboutCity() {
  const response = await fetch('/api/gemini/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: 'What events are happening and how is the weather?',
      // Optional: provide custom coordinates
      // lat: 17.3850,
      // lon: 78.4867
    })
  });
  
  const data = await response.json();
  console.log('AI Response:', data.aiResponse);
  console.log('Urban Data:', data.urbanData);
}
```

**Response:**
```json
{
  "success": true,
  "question": "What events are happening and how is the weather?",
  "location": {
    "latitude": 16.5062,
    "longitude": 80.6480
  },
  "timestamp": "2024-04-19T10:30:00.000Z",
  "urbanData": {
    "weather": {
      "temperature": "28.5",
      "feels_like": "32.1",
      "humidity": "65",
      "windSpeed": "3.5",
      "conditions": ["Partly Cloudy"]
    },
    "pollution": {
      "avgAQI": "85",
      "avgComponents": {...}
    },
    "events": [
      {
        "name": "Tech Conference",
        "description": "Annual tech conference",
        "location": "Convention Center",
        "startDate": "2024-04-20T09:00:00.000Z"
      }
    ],
    "eventCount": 1
  },
  "aiResponse": "Based on the current conditions...",
  "metadata": {...}
}
```

---

### 2. **Get Urban Data Only** (No AI Processing)

**GET** `/api/gemini/data`

Faster response - just returns aggregated data without AI processing.

**JavaScript Fetch:**
```javascript
async function getUrbanData() {
  const response = await fetch('/api/gemini/data?lat=16.5062&lon=80.6480');
  const data = await response.json();
  
  console.log('Weather:', data.data.weather);
  console.log('Pollution:', data.data.pollution);
  console.log('Events:', data.data.events);
}
```

**Query Parameters (Optional):**
- `lat`: latitude (default: 16.5062)
- `lon`: longitude (default: 80.6480)

---

## 🎯 Frontend Implementation Examples

### Vue.js Component
```vue
<template>
  <div class="gemini-chat">
    <input 
      v-model="question" 
      placeholder="Ask about weather, events, or pollution..."
      @keyup.enter="askQuestion"
    />
    <button @click="askQuestion" :disabled="loading">
      {{ loading ? 'Thinking...' : 'Ask' }}
    </button>
    
    <div v-if="response" class="response">
      <p>{{ response }}</p>
      <p v-if="urbanData">
        🌡️ {{ urbanData.weather.temperature }}°C | 
        💨 AQI: {{ urbanData.pollution.avgAQI }} | 
        🎉 Events: {{ urbanData.eventCount }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      question: '',
      response: '',
      urbanData: null,
      loading: false
    };
  },
  methods: {
    async askQuestion() {
      if (!this.question.trim()) return;
      
      this.loading = true;
      try {
        const res = await fetch('/api/gemini/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: this.question })
        });
        
        const data = await res.json();
        if (data.success) {
          this.response = data.aiResponse;
          this.urbanData = data.urbanData;
        }
      } catch (err) {
        this.response = 'Error: ' + err.message;
      }
      this.loading = false;
    }
  }
};
</script>
```

### React Hook
```jsx
import { useState } from 'react';

function GeminiChat() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [urbanData, setUrbanData] = useState(null);

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/ask', {
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
        onKeyUp={(e) => e.key === 'Enter' && askQuestion()}
        placeholder="Ask about weather, events, or pollution..."
      />
      <button onClick={askQuestion} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      
      {response && (
        <div>
          <p>{response}</p>
          {urbanData && (
            <p>
              🌡️ {urbanData.weather.temperature}°C | 
              💨 AQI: {urbanData.pollution.avgAQI} | 
              🎉 Events: {urbanData.eventCount}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default GeminiChat;
```

### Plain JavaScript
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; max-width: 600px; margin: 50px auto; }
    input { width: 100%; padding: 10px; font-size: 16px; }
    button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
    .response { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>🤖 UrbanEye AI Chat</h1>
  
  <input id="question" placeholder="Ask about weather, events, or pollution..." />
  <button onclick="askQuestion()">Ask</button>
  
  <div id="response" class="response" style="display: none;"></div>
  <div id="stats" style="margin-top: 10px;"></div>

  <script>
    async function askQuestion() {
      const question = document.getElementById('question').value;
      if (!question.trim()) return;
      
      document.getElementById('response').textContent = 'Thinking...';
      document.getElementById('response').style.display = 'block';
      
      try {
        const res = await fetch('/api/gemini/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });
        
        const data = await res.json();
        if (data.success) {
          document.getElementById('response').textContent = data.aiResponse;
          
          const { weather, pollution, eventCount } = data.urbanData;
          document.getElementById('stats').innerHTML = `
            <p>
              🌡️ ${weather.temperature}°C | 
              💨 AQI: ${pollution.avgAQI} | 
              🎉 Events: ${eventCount}
            </p>
          `;
        } else {
          document.getElementById('response').textContent = 'Error: ' + data.error;
        }
      } catch (err) {
        document.getElementById('response').textContent = 'Error: ' + err.message;
      }
    }
  </script>
</body>
</html>
```

---

## 💡 Example Questions

- "What events are happening today?"
- "How's the weather and air quality?"
- "Should I go jogging outside right now?"
- "What's happening in the city?"
- "Are there any outdoor events I can attend?"
- "Tell me about the pollution levels"
- "What's the temperature and humidity?"

---

## 🔧 Custom Location

Pass custom coordinates to query a different location:

```javascript
const response = await fetch('/api/gemini/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'What events are happening?',
    lat: 17.3850,    // Hyderabad
    lon: 78.4867
  })
});
```

---

## 📊 Default Location

If you don't provide `lat` and `lon`, it defaults to **Vijayawada**:
- Latitude: **16.5062**
- Longitude: **80.6480**

To change defaults, edit `controllers/geminiController.js`:
```javascript
const DEFAULT_LAT = 16.5062;
const DEFAULT_LON = 80.6480;
```

---

## ⚡ Performance Tips

1. **Cache responses** - Don't call the same question multiple times
2. **Use `/data` endpoint** for just raw data (faster)
3. **Use `/ask` endpoint** for AI insights
4. **Batch queries** when possible

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| `GEMINI_API_KEY not found` | Add to `.env` and restart server |
| `Cannot POST /api/gemini/ask` | Make sure `server.js` imports geminiRoutes |
| `No events found` | Events must exist in DB with status "approved" |
| `AI response is empty` | Check Gemini API key validity |

---

**Ready to use!** Start calling these endpoints from your frontend. 🚀
