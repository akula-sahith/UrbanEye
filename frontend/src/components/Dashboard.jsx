import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

const MOCK_WEATHER_DATA = [
  { time: '10:00', temp: 32, humidity: 45 },
  { time: '11:00', temp: 34, humidity: 42 },
  { time: '12:00', temp: 36, humidity: 38 },
  { time: '13:00', temp: 37, humidity: 35 },
  { time: '14:00', temp: 38, humidity: 32 },
  { time: '15:00', temp: 37, humidity: 34 },
  { time: '16:00', temp: 36, humidity: 36 },
];

const MOCK_POLLUTION_DATA = [
  { day: 'Mon', pm25: 45, aqi: 60 },
  { day: 'Tue', pm25: 55, aqi: 82 },
  { day: 'Wed', pm25: 65, aqi: 110 },
  { day: 'Thu', pm25: 50, aqi: 75 },
  { day: 'Fri', pm25: 70, aqi: 120 },
  { day: 'Sat', pm25: 40, aqi: 50 },
  { day: 'Sun', pm25: 35, aqi: 45 },
];

export default function Dashboard() {
  return (
    <div className="dash-container">
      {/* ── Top Navbar ───────────────────────────────────── */}
      <nav className="mv-navbar">
        <div className="mv-nav-brand">
          <span className="mv-brand-text">UrbanEye</span>
        </div>
        <div className="mv-nav-links">
          <a href="/dashboard" className="mv-nav-link mv-nav-active">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/></svg>
            Dashboard
          </a>
          <a href="/map" className="mv-nav-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3l5-2v12l-5 2V3zm6-2l4 2v12l-4-2V1zm5 2l4-2v12l-4 2V3z"/></svg>
            Map
          </a>
          <a href="/assistant" className="mv-nav-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 14V6l3-4h6l3 4v8H2zm2-1h8V7L9.5 3.5h-3L4 7v6z"/></svg>
            Talk to Assistant
          </a>
        </div>
        <div className="mv-nav-right">
          <span className="mv-status-chip mv-online">
            <span className="mv-status-dot mv-dot-on" />
            LIVE
          </span>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="dash-body">
        <header className="dash-header">
          <h1 className="dash-title">City Analytics Overview</h1>
          <p className="dash-subtitle">Vijayawada, AP · Real-time data aggregation</p>
        </header>

        <div className="dash-grid">
          {/* Top KPI Cards */}
          <div className="dash-card kpi-card">
            <h3>Average AQI</h3>
            <div className="kpi-value">78 <span>Moderate</span></div>
          </div>
          <div className="dash-card kpi-card">
            <h3>Active Events</h3>
            <div className="kpi-value">12 <span>Tracked</span></div>
          </div>
          <div className="dash-card kpi-card">
            <h3>Avg Temperature</h3>
            <div className="kpi-value">35.4°C <span>Today</span></div>
          </div>

          {/* Charts */}
          <div className="dash-card chart-card">
            <h3>Temperature & Humidity Trend (Today)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_WEATHER_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                  <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} dot={{r: 4, fill: '#f97316'}} name="Temp (°C)" />
                  <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} name="Humidity (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dash-card chart-card">
            <h3>Weekly Pollution & AQI Levels</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_POLLUTION_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                  <Bar dataKey="aqi" fill="#10b981" radius={[4, 4, 0, 0]} name="AQI" />
                  <Bar dataKey="pm25" fill="#ef4444" radius={[4, 4, 0, 0]} name="PM2.5 (µg/m³)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
