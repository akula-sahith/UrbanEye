// GEMINI_AI_SETUP.md
# UrbanEye Gemini AI Integration

This guide explains how to set up and use the Gemini AI integration for answering questions about weather, pollution, and events in your city.

## 📋 Prerequisites

1. **Gemini API Key**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **@google/generative-ai**: Already installed in package.json
3. **MongoDB**: For storing and querying events

## 🔧 Setup

### 1. Add Environment Variable

Add your Gemini API key to your `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
OPENWEATHER_API_KEY=your_openweather_key
MONGODB_URI=your_mongodb_connection_string
```

### 2. Register Routes (in server.js)

```javascript
const geminiRoutes = require('./routes/geminiRoutes');

// Add to your Express app
app.use('/api/gemini', geminiRoutes);
```

### 3. Complete server.js Integration Example

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const geminiRoutes = require('./routes/geminiRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Routes
app.use('/api/gemini', geminiRoutes);
app.use('/api/events', eventRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));
```

## 🚀 API Endpoints

### 1. Query Gemini AI about City

**POST** `/api/gemini/query`

**Request:**
```json
{
  "question": "What events are happening and how's the weather?",
  "lat": 16.5062,
  "lon": 80.6480
}
```

**Response:**
```json
{
  "success": true,
  "question": "What events are happening and how's the weather?",
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
      "pressure": "1013",
      "windSpeed": "3.5",
      "conditions": ["Partly Cloudy"],
      "description": "partly cloudy"
    },
    "pollution": {
      "avgAQI": "85",
      "maxAQI": 180,
      "minAQI": 25,
      "avgComponents": {
        "pm2_5": "45.67",
        "pm10": "120.34",
        "no2": "65.23",
        "o3": "75.12",
        "co": "250.45",
        "so2": "35.67"
      }
    },
    "events": [
      {
        "name": "Tech Conference 2024",
        "description": "Annual tech conference",
        "category": "Conference",
        "organiser": "Tech Society",
        "location": "Convention Center",
        "startDate": "2024-04-20T09:00:00.000Z",
        "endDate": "2024-04-20T17:00:00.000Z",
        "coordinates": [80.6480, 16.5062]
      }
    ],
    "eventCount": 1
  },
  "aiResponse": "Based on the current urban data for your location, here's what's happening... [AI generated response]",
  "metadata": {
    "weatherStations": 7,
    "pollutionPoints": 11,
    "eventCount": 1,
    "dataAggregationTime": "2024-04-19T10:30:00.000Z"
  }
}
```

### 2. Get Urban Data Only

**GET** `/api/gemini/urban-data?lat=16.5062&lon=80.6480`

Returns the aggregated urban data without AI processing (faster response).

**Response:**
```json
{
  "success": true,
  "location": {
    "latitude": 16.5062,
    "longitude": 80.6480
  },
  "timestamp": "2024-04-19T10:30:00.000Z",
  "data": {
    "weather": { ... },
    "pollution": { ... },
    "events": [ ... ],
    "eventCount": 1
  }
}
```

## 💡 Example Questions

The AI can answer various types of questions:

### Weather Questions
- "What's the current weather like?"
- "Is it going to rain?"
- "What should I wear today?"

### Air Quality Questions
- "How's the air quality?"
- "Is it safe to go jogging?"
- "What's the pollution level?"

### Events Questions
- "What events are happening nearby?"
- "Are there any conferences today?"
- "What events should I attend?"

### Combined Questions
- "What were the events going on and how's the weather?"
- "Should I go to the park given the weather and air quality?"
- "Are there outdoor events happening and will the weather be good?"
- "What's happening in the city today?"

## 📊 Data Integration

The Gemini service automatically collects:

### Weather Data
- Temperature (actual, feels-like, min, max)
- Humidity
- Pressure
- Wind speed
- Weather conditions
- Data from 7 grid points around the location

### Pollution Data
- Air Quality Index (AQI)
- PM2.5 and PM10 levels
- NO2, O3, CO, SO2 concentrations
- Data from 11 grid points around the location

### Events Data
- Event name, description, category
- Organiser information
- Location and coordinates
- Start and end times
- Approved events only
- Filtered by proximity (default 15 km radius)

## 🔌 Using in Frontend

### cURL Example
```bash
curl -X POST http://localhost:3000/api/gemini/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What events are happening and how is the weather?",
    "lat": 16.5062,
    "lon": 80.6480
  }'
```

### JavaScript Fetch
```javascript
async function askAboutCity() {
  const response = await fetch('/api/gemini/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: "What events are happening and how is the weather?",
      lat: 16.5062,
      lon: 80.6480
    })
  });
  const data = await response.json();
  console.log(data.aiResponse);
}
```

### React Example
```jsx
import { useState } from 'react';

function CityInsights() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    const res = await fetch('/api/gemini/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    setResponse(data.aiResponse);
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
      {response && <p>{response}</p>}
    </div>
  );
}
```

## 📁 File Structure

```
backend/
├── utils/
│   ├── geminiService.js       # Main Gemini AI integration
│   ├── weather.js              # Weather data fetching
│   ├── pollution.js            # Pollution data fetching
│   ├── geocode.js
│   └── moderate.js
├── controllers/
│   ├── geminiController.js    # API controllers
│   └── eventController.js
├── routes/
│   ├── geminiRoutes.js        # API routes
│   └── eventRoutes.js
├── models/
│   └── Event.js
├── server.js
├── package.json
└── GEMINI_AI_SETUP.md         # This file
```

## 🔐 Error Handling

The service handles various error scenarios:

```javascript
{
  "success": false,
  "error": "Error message describing what went wrong",
  "question": "The user's question"
}
```

## 🧠 How It Works

1. **Data Aggregation**: Fetches weather, pollution, and events data for the specified location
2. **Context Building**: Creates a detailed context prompt with all urban data
3. **AI Query**: Sends the question + context to Gemini AI
4. **Response**: Returns the AI's analysis and insights

## 🎯 Best Practices

1. **Rate Limiting**: Implement rate limiting to avoid exceeding Gemini API quota
2. **Caching**: Cache urban data for 5-10 minutes to reduce API calls
3. **Location Specificity**: Ensure latitude/longitude are correct for accurate data
4. **Error Handling**: Always handle errors in frontend when calling the API

## 📝 Environment Setup Checklist

- [ ] Add `GEMINI_API_KEY` to `.env`
- [ ] Ensure `OPENWEATHER_API_KEY` is configured
- [ ] Ensure MongoDB is running and connected
- [ ] Register Gemini routes in `server.js`
- [ ] Test the endpoints with cURL or Postman

## 🐛 Troubleshooting

### "GEMINI_API_KEY not found"
- Check `.env` file has `GEMINI_API_KEY=your_key`
- Restart the server after adding the key

### "MongoDB connection error"
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

### "No events found"
- Check if events exist in database with status "approved"
- Verify events are within the 15 km radius

### "API rate limit exceeded"
- Implement caching
- Add delays between requests
- Consider upgrading Gemini API plan

## 📚 Additional Resources

- [Google Generative AI Docs](https://ai.google.dev/)
- [OpenWeather API](https://openweathermap.org/api)
- [MongoDB Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)
