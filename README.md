# UrbanEye — Real-Time Smart City Intelligence Platform

UrbanEye is a real-time geo-intelligent platform that visualizes events, pollution, and weather data on an interactive map. It enables users to register events, monitor environmental conditions, and query insights through an AI-powered chatbot.

---

## Project Overview

UrbanEye integrates real-time data streams with geospatial visualization to provide a unified smart city dashboard.

### Core Capabilities

* Event registration with automatic geocoding
* Interactive map visualization
* Real-time pollution monitoring
* Real-time weather updates
* AI chatbot for contextual queries
* Live updates using WebSockets

---

## Architecture

```
Frontend (React + Mapbox + Vercel)
        ↓
Socket.IO (real-time communication)
        ↓
Backend (Node.js + Express + Docker)
        ↓
MongoDB (GeoJSON storage)
        ↓
External APIs (Geocoding + Weather + Pollution)
        ↓
LLM (Chatbot for intelligent responses)
```

---

## Tech Stack

### Frontend

* React.js
* Mapbox GL JS
* Socket.IO Client
* Vercel (deployment)

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB + Mongoose
* Docker (containerization)

### APIs & Services

* Google Geocoding API
* OpenWeather API (weather + air pollution)
* LLM (Gemini/OpenAI) for chatbot

---

## Features

### Event Management

* Register events with location name
* Automatic geocoding to latitude/longitude
* GeoJSON-based storage
* Real-time broadcasting to all clients

### Map Visualization

* Interactive map powered by Mapbox
* Dynamic event markers with popups
* Handling overlapping markers using offset logic

### Pollution Monitoring

* Multi-point sampling across a defined radius
* AQI and pollutant components (PM2.5, PM10, CO, NO2, etc.)
* Optimized API usage (controlled number of points)

### Weather Monitoring

* Grid-based weather sampling
* Temperature, humidity, wind, cloud coverage
* Real-time updates via sockets

### Real-Time System

* Initial data load on connection
* Continuous updates using Socket.IO
* No page refresh required

### AI Chatbot

* Answers user queries about:

  * Current events
  * Weather conditions
  * Pollution levels
* Uses LLM integration with backend data
* Context-aware responses

---

## Database Design

### Event Model

* name
* description
* category
* organiser
* location_name
* location (GeoJSON: [lng, lat])
* start_at
* end_at
* status

### Indexes

* 2dsphere index for geospatial queries
* TTL index for automatic event expiry

---

## API Endpoints

```
POST /api/events/register
GET  /api/events
```

---

## Socket Events

| Event Name       | Description                |
| ---------------- | -------------------------- |
| event:all        | Load all events on connect |
| event:new        | New event created          |
| event:sync       | Periodic sync from DB      |
| pollution:update | Live AQI data              |
| weather:update   | Live weather data          |

---

## Docker Setup (Backend)

### Dockerfile

```
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "app.js"]
```

### Build & Run

```
docker build -t urbaneye-backend .
docker run -p 5000:5000 urbaneye-backend
```

---

## Deployment

### Backend (AWS EC2 + Docker)

* Application containerized using Docker
* Deployed on AWS EC2 instance
* Port exposed for API and socket communication
* Environment variables used for API keys and DB connection

### Frontend (Vercel)

* Deployed using Vercel
* Connected to backend via public IP / domain
* Environment-based configuration for API URLs

### CORS

* Enabled for cross-origin communication between frontend and backend

### Real-Time Communication

* Socket.IO configured with polling and WebSocket fallback
* Supports multiple clients concurrently

---

## Environment Variables

### Backend (.env)

```
MONGODB_URI=your_mongodb_uri
OPENWEATHER_API_KEY=your_key
GOOGLE_MAPS_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### Frontend (.env)

```
VITE_BACKEND_URL=http://your-backend-url
```

---

## Local Setup

### Backend

```
cd backend
npm install
npm start
```

### Frontend

```
cd frontend
npm install
npm run dev
```

---

## Future Enhancements

* HTTPS deployment with reverse proxy
* WebSocket optimization (single broadcaster model)
* Event clustering on map
* Heatmap visualization for pollution
* Predictive analytics using machine learning
* Mobile application

---

## Summary

UrbanEye demonstrates:

* Full-stack system design
* Real-time data processing
* Geospatial engineering
* API integration
* Scalable deployment using Docker and cloud infrastructure

It serves as a foundation for building intelligent, real-time smart city platforms.
