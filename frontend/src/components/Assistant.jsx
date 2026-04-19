import React, { useState, useRef, useEffect } from 'react';
import './Assistant.css';

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am your UrbanEye Assistant. How can I help you with city data today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://urbaneye-jepe.onrender.com/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          lat: 16.5062,
          lon: 80.6480
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.aiResponse || "Sorry, I couldn't process that response."
      }]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "Sorry, there was an error connecting to the server. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ast-container">
      {/* ── Top Navbar ───────────────────────────────────── */}
      <nav className="mv-navbar">
        <div className="mv-nav-brand">
          <span className="mv-brand-text">UrbanEye</span>
        </div>
        <div className="mv-nav-links">
          <a href="/dashboard" className="mv-nav-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/></svg>
            Dashboard
          </a>
          <a href="/map" className="mv-nav-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3l5-2v12l-5 2V3zm6-2l4 2v12l-4-2V1zm5 2l4-2v12l-4 2V3z"/></svg>
            Map
          </a>
          <a href="/assistant" className="mv-nav-link mv-nav-active">
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

      {/* ── Chat Interface ───────────────────────────────── */}
      <div className="ast-body">
        <div className="ast-chat-wrapper">
          <div className="ast-chat-header">
            <h2>UrbanEye Intelligence</h2>
            <p>Ask about weather, traffic, and city events.</p>
          </div>

          <div className="ast-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ast-msg-row ${msg.role}`}>
                <div className="ast-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ast-msg-row ai">
                <div className="ast-bubble ast-loading">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="ast-input-area" onSubmit={handleSubmit}>
            <input 
              type="text" 
              className="ast-input"
              placeholder="Ask about the city..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="ast-send-btn" disabled={isLoading || !input.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
