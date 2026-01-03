'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createChatSession, addChatMessage, getChatSessions } from '@/lib/db';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

const SUBJECTS = [
  { id: 'polity', name: 'Polity', icon: 'account_balance' },
  { id: 'geography', name: 'Geography', icon: 'public' },
  { id: 'economics', name: 'Economics', icon: 'payments' },
  { id: 'science', name: 'Science & Tech', icon: 'biotech' },
  { id: 'history', name: 'History', icon: 'history_edu' },
  { id: 'environment', name: 'Environment', icon: 'eco' },
];

const SUGGESTIONS = [
  'Explain Article 21',
  'Monetary Policy Committee',
  'Green Revolution impact',
  'Judicial Review',
];

export const Chat: React.FC = () => {
  const { userProfile, deductTokens } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState('polity');
  const [showSidebar, setShowSidebar] = useState(true);
  const [chatMode, setChatMode] = useState<'socratic' | 'direct'>('socratic');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session
  useEffect(() => {
    const initSession = async () => {
      if (userProfile?.uid && !sessionId) {
        const subject = SUBJECTS.find(s => s.id === activeSubject)?.name || 'General';
        const newSessionId = await createChatSession(userProfile.uid, subject, chatMode);
        setSessionId(newSessionId);
      }
    };
    initSession();
  }, [userProfile?.uid, activeSubject]);

  const handleSend = async () => {
    if (!input.trim() || !userProfile) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to UI
    const newUserMessage: Message = { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Check if user has enough tokens
      const tokenCost = chatMode === 'socratic' ? 5 : 3;
      const hasTokens = await deductTokens(tokenCost);
      
      if (!hasTokens) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, you don't have enough tokens for this request. Please upgrade your plan or wait for token refresh.",
          timestamp: new Date()
        }]);
        setLoading(false);
        return;
      }

      // Call AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          subject: SUBJECTS.find(s => s.id === activeSubject)?.name,
          mode: chatMode,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save messages to database
        if (sessionId) {
          await addChatMessage(sessionId, { role: 'user', content: userMessage }, userProfile.uid);
          await addChatMessage(sessionId, { 
            role: 'assistant', 
            content: data.response, 
            tokensUsed: data.tokensUsed 
          }, userProfile.uid);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.message || "I apologize, but I encountered an error. Please try again.";
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const startNewChat = async () => {
    if (!userProfile) return;
    
    setMessages([]);
    const subject = SUBJECTS.find(s => s.id === activeSubject)?.name || 'General';
    const newSessionId = await createChatSession(userProfile.uid, subject, chatMode);
    setSessionId(newSessionId);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6 lg:-m-8">
      {/* Subjects Sidebar */}
      <aside className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-white/5 glass-sidebar flex flex-col`}>
        <div className="p-4 flex flex-col gap-4 h-full">
          {/* Branding */}
          <div className="flex items-center gap-3 px-2">
            <div className="size-10 rounded-full bg-gradient-to-br from-primary to-[#8a4a0b] flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-lg font-bold tracking-tight">UPSC-GPT</h1>
              <p className="text-white/40 text-xs font-medium">
                {chatMode === 'socratic' ? 'Socratic Tutor' : 'Direct Mode'}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-[#2c2219] rounded-lg p-1 border border-[#483623]">
            <button 
              onClick={() => setChatMode('socratic')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                chatMode === 'socratic' ? 'bg-primary text-white' : 'text-[#c9ad92] hover:text-white'
              }`}
            >
              Socratic
            </button>
            <button 
              onClick={() => setChatMode('direct')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                chatMode === 'direct' ? 'bg-primary text-white' : 'text-[#c9ad92] hover:text-white'
              }`}
            >
              Direct
            </button>
          </div>

          {/* New Chat Button */}
          <button 
            onClick={startNewChat}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 group"
          >
            <span className="material-symbols-outlined text-white">add</span>
            <span className="text-white text-sm font-semibold">New Chat</span>
          </button>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
            <div className="text-xs font-bold text-white/30 uppercase tracking-wider px-3 mb-2 mt-2">Subjects</div>
            {SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setActiveSubject(subject.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSubject === subject.id
                    ? 'bg-white/5 text-white border border-white/5'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${activeSubject === subject.id ? 'text-primary' : ''}`}>{subject.icon}</span>
                <span className="text-sm font-medium">{subject.name}</span>
              </button>
            ))}
          </nav>

          {/* Token Info */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
              <span className="text-xs text-[#c9ad92]">Tokens</span>
              <span className="text-sm font-bold text-primary">{userProfile?.tokens || 0}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 glass-panel shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-white/70 hover:text-white p-1"
            >
              <span className="material-symbols-outlined">{showSidebar ? 'menu_open' : 'menu'}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                {SUBJECTS.find(s => s.id === activeSubject)?.icon || 'school'}
              </span>
              <h2 className="text-white font-semibold tracking-tight">
                {SUBJECTS.find(s => s.id === activeSubject)?.name || 'General'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 ml-2">
                {chatMode === 'socratic' ? 'SOCRATIC MODE' : 'DIRECT MODE'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="size-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-16 lg:px-32 xl:px-48 flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">psychology</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Start a conversation</h3>
              <p className="text-[#c9ad92] text-sm max-w-md mb-6">
                {chatMode === 'socratic' 
                  ? "I'll guide you through topics with probing questions to help you think critically."
                  : "Ask me anything about UPSC and I'll give you direct answers."}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((suggestion) => (
                  <button 
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 text-sm text-[#c9ad92] hover:text-white transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
              {msg.role === 'assistant' && (
                <div className="size-9 rounded-full bg-gradient-to-br from-primary to-[#8a4a0b] flex items-center justify-center text-white shadow-lg shrink-0 border border-white/10">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
              )}
              
              <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className="text-xs font-medium text-white/40 mx-1 mb-1">{msg.role === 'user' ? 'You' : 'UPSC-GPT'}</div>
                <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-sm shadow-lg shadow-primary/10' 
                    : 'message-bubble-ai text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              </div>
              
              {msg.role === 'user' && (
                <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 border border-white/10">
                  {userProfile?.displayName?.slice(0, 2).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-3 justify-start">
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-[#8a4a0b] flex items-center justify-center text-white shadow-lg shrink-0 border border-white/10">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              <div className="message-bubble-ai rounded-2xl rounded-tl-sm px-5 py-3.5 flex gap-1 items-center">
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-32" />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:px-16 lg:px-32 xl:px-48 pb-6 bg-gradient-to-t from-[#221910] via-[#221910] to-transparent z-20">
          {/* Input Bar */}
          <div className="glass-input rounded-2xl p-2 flex items-end gap-2 relative transition-all focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50">
            <textarea
              className="w-full bg-transparent border-none text-white placeholder-white/30 focus:ring-0 resize-none py-3 px-3 max-h-32 text-[15px] outline-none"
              placeholder="Ask a doubt or start a conversation..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ minHeight: '48px' }}
              disabled={loading}
            />
            <div className="flex items-center gap-1 pb-1">
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-[10px] text-white/20">UPSC-GPT can make mistakes. Verify important information.</p>
          </div>
        </div>
      </main>
    </div>
  );
};
