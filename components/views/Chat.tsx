'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../UI';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Hello! I am your UPSC Socratic Tutor. I can help you understand complex topics by asking guiding questions rather than just giving answers. What topic shall we explore today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      if (!process.env.API_KEY) {
         // Fallback simulation if no key
         setTimeout(() => {
             setMessages(prev => [...prev, { role: 'model', text: "It seems the API key is missing, so I'm running in demo mode. In a real scenario, I would analyze your query: \"" + userMessage + "\" and guide you Socratically!" }]);
             setLoading(false);
         }, 1000);
         return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = "You are an expert UPSC Tutor. You use the Socratic method. Do not give direct answers immediately. Ask probing questions to check the student's understanding first. Be concise, encouraging, and factual.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
            systemInstruction: systemInstruction,
        }
      });

      const text = response.text || "I apologize, I couldn't generate a response.";
      
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 mb-4">
         <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
         <div>
            <h2 className="text-2xl font-bold text-white">UPSC-GPT</h2>
            <p className="text-xs text-white/50 bg-primary/10 border border-primary/20 px-2 rounded inline-block">SOCRATIC MODE</p>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-primary/90 text-white rounded-tr-sm shadow-lg shadow-primary/10' 
                : 'bg-white/10 text-gray-100 rounded-tl-sm border border-white/5'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl rounded-tl-sm px-5 py-3.5 flex gap-1 items-center">
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4">
        <div className="relative">
            <textarea
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-white placeholder-white/30 focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                rows={1}
                placeholder="Ask a doubt..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />
            <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1.5 p-1.5 bg-primary rounded-xl text-white hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
                <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
        </div>
        <p className="text-center text-[10px] text-white/30 mt-2">AI can make mistakes. Verify important information.</p>
      </div>
    </div>
  );
};