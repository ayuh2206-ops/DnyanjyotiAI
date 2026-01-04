'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, Button, Badge, LoadingSpinner, Toast } from '../UI';
import { getNewsArticles, getEditorialBriefs, NewsArticle, EditorialBrief } from '@/lib/db';

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  gsRelevance: string[];
  source: string;
  publishedAt: string;
  imageUrl: string;
  readTime: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'polity', name: 'Polity', icon: 'account_balance' },
  { id: 'economy', name: 'Economy', icon: 'payments' },
  { id: 'environment', name: 'Environment', icon: 'eco' },
  { id: 'science', name: 'Science & Tech', icon: 'biotech' },
  { id: 'international', name: 'International', icon: 'public' },
  { id: 'social', name: 'Social Issues', icon: 'groups' },
];

// Mock data for demonstration - used when no articles in database
const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'India-France Strategic Partnership: New Defense Agreements Signed',
    summary: 'India and France have signed multiple defense cooperation agreements during the recent bilateral summit, including joint development of advanced military systems and technology transfer provisions.',
    category: 'international',
    gsRelevance: ['GS Paper 2', 'International Relations'],
    source: 'The Hindu',
    publishedAt: '2 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400',
    readTime: '5 min',
  },
  {
    id: '2',
    title: 'RBI Maintains Repo Rate: Inflation Outlook Remains Stable',
    summary: 'The Reserve Bank of India has decided to keep the repo rate unchanged at 6.5% for the sixth consecutive time, citing stable inflation outlook while maintaining focus on withdrawal of accommodation.',
    category: 'economy',
    gsRelevance: ['GS Paper 3', 'Economy', 'Monetary Policy'],
    source: 'Economic Times',
    publishedAt: '4 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    readTime: '4 min',
  },
  {
    id: '3',
    title: 'New Ramsar Sites: India Adds 5 More Wetlands to International List',
    summary: 'India has designated 5 more wetlands as Ramsar sites, taking the total count to 80. The new sites include wetlands from Gujarat, Madhya Pradesh, and Odisha.',
    category: 'environment',
    gsRelevance: ['GS Paper 3', 'Environment', 'Biodiversity'],
    source: 'PIB',
    publishedAt: '6 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400',
    readTime: '3 min',
  },
  {
    id: '4',
    title: 'ISRO Successfully Launches XPoSat: India\'s First X-ray Polarimetry Satellite',
    summary: 'ISRO has successfully launched XPoSat, making India only the second country after NASA to have a dedicated X-ray polarimetry mission in space for studying celestial sources.',
    category: 'science',
    gsRelevance: ['GS Paper 3', 'Science & Technology', 'Space'],
    source: 'ISRO',
    publishedAt: '8 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=400',
    readTime: '6 min',
  },
  {
    id: '5',
    title: 'Supreme Court on Electoral Bonds: Transparency in Political Funding',
    summary: 'The Supreme Court has reserved its judgment on the validity of the Electoral Bonds scheme, with arguments focusing on the balance between donor privacy and voter\'s right to information.',
    category: 'polity',
    gsRelevance: ['GS Paper 2', 'Polity', 'Electoral Reforms'],
    source: 'LiveLaw',
    publishedAt: '10 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
    readTime: '7 min',
  },
  {
    id: '6',
    title: 'National Green Hydrogen Mission: Cabinet Approves ₹19,744 Crore Outlay',
    summary: 'The Union Cabinet has approved the National Green Hydrogen Mission with an initial outlay of ₹19,744 crore, aiming to make India a global hub for green hydrogen production.',
    category: 'economy',
    gsRelevance: ['GS Paper 3', 'Economy', 'Energy', 'Environment'],
    source: 'Ministry of Power',
    publishedAt: '12 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
    readTime: '5 min',
  },
];

export const DailyAffairs: React.FC = () => {
  const { user, userProfile, deductTokens } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const newsArticles = await getNewsArticles(true, 50);
      
      if (newsArticles.length > 0) {
        // Convert database articles to display format
        const formattedArticles: Article[] = newsArticles.map((article: NewsArticle) => ({
          id: article.id || '',
          title: article.title,
          summary: article.summary60Words || article.content.substring(0, 200) + '...',
          category: article.tags[0]?.toLowerCase() || 'general',
          gsRelevance: article.gsPaper || [],
          source: article.source,
          publishedAt: formatTimeAgo(article.publishedAt || article.createdAt),
          imageUrl: article.imageUrl || getDefaultImage(article.tags[0]),
          readTime: `${article.readingTime} min`,
        }));
        setArticles(formattedArticles);
      } else {
        // Use mock data if no articles in database
        setArticles(MOCK_ARTICLES);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles(MOCK_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getDefaultImage = (category: string): string => {
    const images: Record<string, string> = {
      polity: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
      economy: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
      environment: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400',
      science: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=400',
      international: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400',
    };
    return images[category?.toLowerCase()] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400';
  };

  const filteredArticles = activeCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === activeCategory);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      polity: 'text-blue-400',
      economy: 'text-green-400',
      environment: 'text-emerald-400',
      science: 'text-purple-400',
      international: 'text-orange-400',
      social: 'text-pink-400',
    };
    return colors[category] || 'text-primary';
  };

  const generateQuizFromArticle = async (articleId: string) => {
    if (!user?.uid) return;
    
    const tokenCost = 10;
    if ((userProfile?.tokens || 0) < tokenCost) {
      setToast({ message: 'Not enough tokens. Please upgrade your plan.', type: 'error' });
      return;
    }

    setGeneratingQuiz(articleId);
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      // Call quiz generation API
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: article.category,
          difficulty: 'Medium',
          count: 5,
          topics: [article.title],
          context: article.summary,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      await deductTokens(tokenCost);
      
      setToast({ message: `Quiz generated! ${data.questions.length} questions based on "${article.title}"`, type: 'success' });
    } catch (error) {
      console.error('Error generating quiz:', error);
      setToast({ message: 'Failed to generate quiz. Please try again.', type: 'error' });
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const generateSummary = async (articleId: string) => {
    if (!user?.uid) return;
    
    const tokenCost = 3;
    if ((userProfile?.tokens || 0) < tokenCost) {
      setToast({ message: 'Not enough tokens. Please upgrade your plan.', type: 'error' });
      return;
    }

    setSummaryLoading(articleId);
    try {
      await deductTokens(tokenCost);
      // Simulate summary generation - in production would call AI API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const article = articles.find(a => a.id === articleId);
      if (article) {
        setSelectedArticle(article);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setSummaryLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Daily Affairs & News</h1>
        <p className="text-[#c9ad92]">Stay updated with curated news briefs tailored for UPSC preparation</p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeCategory === cat.id
                ? 'bg-primary text-white'
                : 'bg-[#2c2219] border border-[#483623] text-[#c9ad92] hover:text-white hover:border-primary/50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">article</span>
          <span className="text-sm text-white">{filteredArticles.length} Articles</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400">schedule</span>
          <span className="text-sm text-[#c9ad92]">Updated just now</span>
        </div>
        <div className="ml-auto">
          <Button variant="ghost" icon="refresh" onClick={fetchArticles} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
          <GlassCard
            key={article.id}
            className="overflow-hidden hover:border-primary/50 transition-all group cursor-pointer flex flex-col"
          >
            {/* Image */}
            <div
              className="h-40 bg-cover bg-center relative"
              style={{ backgroundImage: `url('${article.imageUrl}')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a130c] to-transparent"></div>
              <div className="absolute top-3 left-3">
                <span
                  className={`px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-bold uppercase tracking-wide border border-white/10 ${getCategoryColor(article.category)}`}
                >
                  {CATEGORIES.find(c => c.id === article.category)?.name || article.category}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1">
                {article.gsRelevance.slice(0, 1).map((gs, idx) => (
                  <Badge key={idx} color="primary">{gs}</Badge>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
              <p className="text-[#c9ad92] text-sm leading-relaxed line-clamp-3 flex-1">
                {article.summary}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">newspaper</span>
                  {article.source}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {article.publishedAt}
                </span>
                <span>{article.readTime} read</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => generateSummary(article.id)}
                  disabled={summaryLoading === article.id}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                >
                  {summaryLoading === article.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">summarize</span>
                      60-Word Brief
                    </>
                  )}
                </button>
                <button
                  onClick={() => generateQuizFromArticle(article.id)}
                  disabled={generatingQuiz === article.id}
                  className="flex-1 py-2 rounded-lg bg-primary/20 border border-primary/30 text-xs font-medium text-primary hover:bg-primary/30 transition-all flex items-center justify-center gap-1"
                >
                  {generatingQuiz === article.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">psychology</span>
                      Generate Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      )}

      {/* Quick 60-Word Brief Panel */}
      {selectedArticle && (
        <GlassCard className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-50 shadow-2xl animate-fade-in">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">summarize</span>
              60-Word Brief
            </h4>
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-white/60 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p className="text-xs text-primary font-medium mb-2">{selectedArticle.title}</p>
          <p className="text-sm text-[#c9ad92] leading-relaxed mb-4">{selectedArticle.summary}</p>
          <div className="flex flex-wrap gap-2">
            {selectedArticle.gsRelevance.map((tag, idx) => (
              <Badge key={idx} color="blue">{tag}</Badge>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {!loading && filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-[#c9ad92] mb-3">article</span>
          <p className="text-[#c9ad92]">No articles found in this category</p>
        </div>
      )}
    </div>
  );
};
