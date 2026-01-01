'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, Button, Badge, LoadingSpinner, Toast } from '../UI';

interface Flashcard {
  front: string;
  back: string;
  topic: string;
}

export const ToolsView: React.FC = () => {
  const { userProfile, deductTokens } = useAuth();
  const [activeTab, setActiveTab] = useState<'flashcards' | 'ocr' | 'summarizer'>('flashcards');
  const [sourceText, setSourceText] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // OCR state
  const [ocrText, setOcrText] = useState('');
  const [ocrProcessing, setOcrProcessing] = useState(false);
  
  // Summarizer state
  const [summaryText, setSummaryText] = useState('');
  const [summarizedContent, setSummarizedContent] = useState('');

  const handleGenerateFlashcards = async () => {
    if (!sourceText.trim()) {
      setToast({ message: 'Please enter some text to generate flashcards', type: 'error' });
      return;
    }

    if ((userProfile?.tokens || 0) < 10) {
      setToast({ message: 'Insufficient tokens. You need at least 10 tokens.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setFlashcards(data.flashcards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      
      // Deduct tokens
      await deductTokens(data.tokensUsed || 10, 'flashcard_generation');
      
      setToast({ message: `Generated ${data.flashcards.length} flashcards!`, type: 'success' });
    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      setToast({ message: error.message || 'Failed to generate flashcards', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleSummarize = async () => {
    if (!summaryText.trim()) {
      setToast({ message: 'Please enter text to summarize', type: 'error' });
      return;
    }

    if ((userProfile?.tokens || 0) < 5) {
      setToast({ message: 'Insufficient tokens. You need at least 5 tokens.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summaryText })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSummarizedContent(data.summary);
      await deductTokens(data.tokensUsed || 5, 'summarization');
      
      setToast({ message: 'Text summarized successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error summarizing:', error);
      setToast({ message: error.message || 'Failed to summarize text', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    { id: 'flashcards', title: 'Flashcard Generator', icon: 'style', desc: 'Create quick revision cards from notes instantly.', active: true },
    { id: 'ocr', title: 'OCR Pipeline', icon: 'document_scanner', desc: 'Digitize handwritten answer sheets.', active: true },
    { id: 'summarizer', title: 'AI Summarizer', icon: 'summarize', desc: 'Get UPSC-focused summaries of long texts.', active: true },
    { id: 'coming', title: 'More Coming', icon: 'add_circle', desc: 'PYQ analyzer, mind maps & more.', active: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Study Tools</h1>
          <p className="text-[#c9ad92]">AI-powered tools to supercharge your preparation.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-medium text-green-400">AI Engine: Ready</span>
        </div>
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <GlassCard 
            key={tool.id} 
            onClick={() => tool.active && setActiveTab(tool.id as any)}
            hoverEffect={tool.active}
            className={`cursor-pointer group ${activeTab === tool.id ? 'border-l-4 border-l-primary' : ''} ${!tool.active ? 'opacity-50' : ''}`}
          >
            <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-white">{tool.icon}</span>
            </div>
            <div className={`size-10 rounded-lg bg-white/5 flex items-center justify-center text-[#c9ad92] mb-4 group-hover:text-primary group-hover:bg-primary/20 transition-colors ${activeTab === tool.id ? 'text-primary bg-primary/20' : ''}`}>
              <span className="material-symbols-outlined">{tool.icon}</span>
            </div>
            <h3 className="font-semibold text-white mb-1">{tool.title}</h3>
            <p className="text-sm text-[#c9ad92]">{tool.desc}</p>
            {!tool.active && <Badge className="mt-2">Coming Soon</Badge>}
          </GlassCard>
        ))}
      </div>

      {/* Flashcard Generator */}
      {activeTab === 'flashcards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Source Material */}
          <div className="lg:col-span-2">
            <GlassCard className="flex flex-col h-[500px]">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 -mx-6 -mt-6 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  <h3 className="text-white font-semibold">Source Material</h3>
                </div>
                <span className="text-xs text-[#c9ad92]">{sourceText.length} characters</span>
              </div>
              
              <textarea 
                className="w-full flex-1 bg-transparent text-white placeholder-[#c9ad92]/50 focus:ring-0 text-sm resize-none leading-relaxed border-none outline-none"
                placeholder={`Paste your notes here, or type a topic summary to generate flashcards automatically...

Example:
The Directive Principles of State Policy are guidelines to the central and state governments of India, to be kept in mind while framing laws and policies. These provisions, contained in Part IV of the Constitution of India, are not enforceable by any court, but the principles laid down therein are considered fundamental in the governance of the country...`}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              ></textarea>
              
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-xs text-[#c9ad92]">
                  Cost: ~10 tokens per generation
                </span>
                <Button 
                  icon="auto_awesome" 
                  onClick={handleGenerateFlashcards}
                  disabled={loading || !sourceText.trim()}
                >
                  {loading ? 'Generating...' : 'Generate Cards'}
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <GlassCard className="h-[500px] flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none z-10"></div>
              <div className="px-5 py-4 border-b border-white/5 bg-white/5 -mx-6 -mt-6 mb-4 flex justify-between items-center">
                <h3 className="text-white font-semibold text-sm">Preview</h3>
                {flashcards.length > 0 && (
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {currentCardIndex + 1} / {flashcards.length}
                  </span>
                )}
              </div>
              
              <div className="flex-1 flex items-center justify-center relative">
                {flashcards.length > 0 ? (
                  <>
                    {/* Card Stack Effect */}
                    <div className="absolute w-[85%] h-[60%] bg-white/5 rounded-xl top-[15%] opacity-40 scale-90 translate-y-4"></div>
                    <div className="absolute w-[90%] h-[60%] bg-white/5 rounded-xl top-[18%] opacity-60 scale-95 translate-y-2"></div>
                    
                    {/* Main Card */}
                    <div 
                      className="relative w-full max-w-[260px] aspect-[4/5] bg-[#2a241d] border border-white/10 rounded-xl shadow-2xl p-6 flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors z-20"
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-[#c9ad92] uppercase tracking-widest">
                          {flashcards[currentCardIndex]?.topic || 'UPSC'}
                        </span>
                        <span className="material-symbols-outlined text-[#c9ad92]">flip</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center text-center">
                        <p className="text-lg font-medium text-white leading-relaxed">
                          {isFlipped 
                            ? flashcards[currentCardIndex]?.back 
                            : flashcards[currentCardIndex]?.front
                          }
                        </p>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Navigation Arrows */}
                    <button 
                      onClick={handlePrevCard}
                      disabled={currentCardIndex === 0}
                      className="absolute left-2 p-2 rounded-full bg-black/40 hover:bg-primary/80 text-white transition-all backdrop-blur-sm z-30 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button 
                      onClick={handleNextCard}
                      disabled={currentCardIndex === flashcards.length - 1}
                      className="absolute right-2 p-2 rounded-full bg-black/40 hover:bg-primary/80 text-white transition-all backdrop-blur-sm z-30 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </>
                ) : (
                  <div className="text-center text-[#c9ad92]">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-30">style</span>
                    <p className="text-sm">Generate flashcards to see preview</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-white/5 flex justify-between items-center z-20">
                <button 
                  className="text-xs text-[#c9ad92] hover:text-white flex items-center gap-1 transition-colors"
                  disabled={flashcards.length === 0}
                >
                  <span className="material-symbols-outlined text-[16px]">bookmark_border</span> Save Deck
                </button>
                <button 
                  className="text-xs text-[#c9ad92] hover:text-white flex items-center gap-1 transition-colors"
                  disabled={flashcards.length === 0}
                >
                  <span className="material-symbols-outlined text-[16px]">share</span> Share
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* OCR Pipeline */}
      {activeTab === 'ocr' && (
        <GlassCard>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">document_scanner</span>
              <h3 className="text-white font-semibold">OCR Pipeline</h3>
            </div>
            <span className="text-xs text-[#c9ad92]">Supported: JPG, PNG, PDF</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dropzone */}
            <div className="border-2 border-dashed border-[#483623] hover:border-primary/50 bg-white/[0.02] rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer group h-64">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-[#c9ad92] mb-4 group-hover:text-primary group-hover:scale-110 transition-all">
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
              </div>
              <h4 className="text-white font-medium mb-1">Upload Answer Sheet</h4>
              <p className="text-[#c9ad92] text-sm text-center max-w-[200px]">Drag & drop handwritten pages or click to browse</p>
              <p className="text-xs text-primary mt-4">Coming Soon in Phase 2</p>
            </div>
            
            {/* Output Preview */}
            <div className="flex flex-col h-64">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-white">Digitized Output</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#c9ad92]">Ready</span>
                </div>
              </div>
              <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-4 overflow-y-auto font-mono text-sm text-[#c9ad92] leading-relaxed">
                <p className="opacity-50">// Upload an image to start OCR processing...</p>
                <p className="opacity-50 mt-2">// Supported formats: JPG, PNG, PDF</p>
                <div className="h-px w-full bg-white/10 my-3"></div>
                <p className="text-white/30">Output will appear here...</p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* AI Summarizer */}
      {activeTab === 'summarizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <GlassCard className="flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 -mx-6 -mt-6 mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">article</span>
                <h3 className="text-white font-semibold">Input Text</h3>
              </div>
              <span className="text-xs text-[#c9ad92]">{summaryText.length} chars</span>
            </div>
            
            <textarea 
              className="w-full flex-1 bg-transparent text-white placeholder-[#c9ad92]/50 focus:ring-0 text-sm resize-none leading-relaxed border-none outline-none"
              placeholder="Paste a long article, news piece, or chapter content here to get a UPSC-focused summary..."
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
            ></textarea>
            
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="text-xs text-[#c9ad92]">Cost: ~5 tokens</span>
              <Button 
                icon="summarize" 
                onClick={handleSummarize}
                disabled={loading || !summaryText.trim()}
              >
                {loading ? 'Summarizing...' : 'Summarize'}
              </Button>
            </div>
          </GlassCard>

          {/* Output */}
          <GlassCard className="flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 -mx-6 -mt-6 mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="text-white font-semibold">UPSC Summary</h3>
              </div>
              {summarizedContent && (
                <button 
                  className="text-xs text-primary hover:text-primary/80"
                  onClick={() => navigator.clipboard.writeText(summarizedContent)}
                >
                  Copy
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto text-sm text-[#c9ad92] leading-relaxed">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner text="Generating summary..." />
                </div>
              ) : summarizedContent ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  {summarizedContent.split('\n').map((para, i) => (
                    <p key={i} className="mb-3 text-white/80">{para}</p>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-30">summarize</span>
                  <p>Your UPSC-optimized summary will appear here</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tips Section */}
      <GlassCard className="bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary">tips_and_updates</span>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Pro Tips for Study Tools</h4>
            <ul className="text-sm text-[#c9ad92] space-y-1">
              <li>• <strong className="text-white">Flashcards:</strong> Paste NCERT chapter summaries for quick revision cards</li>
              <li>• <strong className="text-white">OCR:</strong> Works best with clear handwriting and good lighting</li>
              <li>• <strong className="text-white">Summarizer:</strong> Great for condensing The Hindu editorials into key points</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
