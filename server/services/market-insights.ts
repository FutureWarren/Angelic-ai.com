import OpenAI from "openai";
import type { MarketInsights, SearchSource } from "./angelic-report-generator";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/**
 * Market Insights Provider Interface
 * Decouples report generation from market data source
 */
export interface IMarketInsightsProvider {
  getInsights(idea: string, language: 'zh' | 'en'): Promise<MarketInsights>;
}

/**
 * No-op Provider - Returns empty insights (default behavior)
 * Used when no external search API is configured
 */
export class NoopProvider implements IMarketInsightsProvider {
  async getInsights(_idea: string, _language: 'zh' | 'en'): Promise<MarketInsights> {
    return {};
  }
}

/**
 * Serper Provider - Uses Serper.dev API for web search
 * Requires SERPER_API_KEY environment variable
 */
export class SerperProvider implements IMarketInsightsProvider {
  private cache: Map<string, { data: MarketInsights; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly API_TIMEOUT = 8000; // 8 seconds

  private getCacheKey(idea: string, language: string): string {
    // Simple hash for cache key
    return `${language}:${idea.substring(0, 100)}`;
  }

  async getInsights(idea: string, language: 'zh' | 'en'): Promise<MarketInsights> {
    const cacheKey = this.getCacheKey(idea, language);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      console.log('📦 Using cached market insights');
      return cached.data;
    }

    try {
      console.log('🔍 Fetching market insights via Serper API...');
      
      const apiKey = process.env.SERPER_API_KEY;
      if (!apiKey) {
        console.warn('⚠️  SERPER_API_KEY not configured, skipping market insights');
        return {};
      }

      // Collect all search sources for visualization
      const allSearchSources: SearchSource[] = [];

      // Search strategy: 4 parallel searches for different insights
      const searches = await Promise.allSettled([
        this.searchSocialMedia(idea, language, apiKey),
        this.searchCompetitors(idea, language, apiKey),
        this.searchIndustryTrends(idea, language, apiKey),
        this.searchUserReviews(idea, language, apiKey)
      ]);

      const results = searches.map((s, idx) => {
        if (s.status === 'fulfilled') {
          // Collect sources for visualization
          if (s.value.sources) {
            allSearchSources.push(...s.value.sources);
          }
          return s.value.summary;
        }
        return '';
      });
      
      const insights: MarketInsights = {
        socialMediaFeedback: results[0] || undefined,
        competitorAnalysis: results[1] || undefined,
        industryTrends: results[2] || undefined,
        userReviews: results[3] || undefined,
        searchSources: allSearchSources.length > 0 ? allSearchSources : undefined
      };

      // Cache the results
      this.cache.set(cacheKey, { data: insights, timestamp: Date.now() });
      
      return insights;
    } catch (error) {
      console.error('❌ Market insights fetch failed:', error);
      return {};
    }
  }

  private async searchSocialMedia(idea: string, language: 'zh' | 'en', apiKey: string): Promise<{summary: string, sources: SearchSource[]}> {
    try {
      const query = language === 'zh' 
        ? `${idea} site:zhihu.com OR site:xiaohongshu.com OR site:weixin.qq.com`
        : `${idea} site:reddit.com OR site:producthunt.com OR site:medium.com`;
      
      const results = await this.performSearch(query, apiKey, language);
      const summary = await this.summarizeResults(results, 'social media feedback', language);
      const sources = results.slice(0, 5).map(r => ({
        title: r.title || '',
        url: r.link || '',
        snippet: r.snippet || '',
        category: 'socialMedia'
      }));
      
      return { summary, sources };
    } catch (error) {
      console.error('❌ Social media search failed:', error instanceof Error ? error.message : error);
      return { summary: '', sources: [] };
    }
  }

  private async searchCompetitors(idea: string, language: 'zh' | 'en', apiKey: string): Promise<{summary: string, sources: SearchSource[]}> {
    try {
      const query = language === 'zh'
        ? `${idea} 竞争对手 市场分析`
        : `${idea} competitors market analysis site:crunchbase.com OR site:techcrunch.com`;
      
      const results = await this.performSearch(query, apiKey, language);
      const summary = await this.summarizeResults(results, 'competitor analysis', language);
      const sources = results.slice(0, 5).map(r => ({
        title: r.title || '',
        url: r.link || '',
        snippet: r.snippet || '',
        category: 'competitors'
      }));
      
      return { summary, sources };
    } catch (error) {
      console.error('❌ Competitor search failed:', error instanceof Error ? error.message : error);
      return { summary: '', sources: [] };
    }
  }

  private async searchIndustryTrends(idea: string, language: 'zh' | 'en', apiKey: string): Promise<{summary: string, sources: SearchSource[]}> {
    try {
      const query = language === 'zh'
        ? `${idea} 行业趋势 市场报告`
        : `${idea} industry trends market report site:techcrunch.com OR site:theverge.com OR site:wired.com`;
      
      const results = await this.performSearch(query, apiKey, language);
      const summary = await this.summarizeResults(results, 'industry trends', language);
      const sources = results.slice(0, 5).map(r => ({
        title: r.title || '',
        url: r.link || '',
        snippet: r.snippet || '',
        category: 'industry'
      }));
      
      return { summary, sources };
    } catch (error) {
      console.error('❌ Industry trends search failed:', error instanceof Error ? error.message : error);
      return { summary: '', sources: [] };
    }
  }

  private async searchUserReviews(idea: string, language: 'zh' | 'en', apiKey: string): Promise<{summary: string, sources: SearchSource[]}> {
    try {
      const query = language === 'zh'
        ? `${idea} 用户评价 使用体验`
        : `${idea} user reviews feedback site:ycombinator.com OR site:reddit.com`;
      
      const results = await this.performSearch(query, apiKey, language);
      const summary = await this.summarizeResults(results, 'user reviews', language);
      const sources = results.slice(0, 5).map(r => ({
        title: r.title || '',
        url: r.link || '',
        snippet: r.snippet || '',
        category: 'userReviews'
      }));
      
      return { summary, sources };
    } catch (error) {
      console.error('❌ User reviews search failed:', error instanceof Error ? error.message : error);
      return { summary: '', sources: [] };
    }
  }

  private async performSearch(query: string, apiKey: string, language: 'zh' | 'en'): Promise<any[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.API_TIMEOUT);

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          gl: language === 'zh' ? 'cn' : 'us',
          hl: language === 'zh' ? 'zh-cn' : 'en',
          num: 5
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`);
      }

      const data = await response.json();
      return data.organic || [];
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  private async summarizeResults(results: any[], category: string, language: 'zh' | 'en'): Promise<string> {
    if (!results || results.length === 0) {
      return '';
    }

    // Extract titles, snippets, and links
    const items = results.slice(0, 5).map(r => ({
      title: r.title,
      snippet: r.snippet,
      link: r.link
    }));

    const prompt = language === 'zh'
      ? `基于以下搜索结果，总结关于"${category}"的关键洞察（2-3段，每段2-3句话）。包含具体数据和观点，引用来源链接：\n\n${JSON.stringify(items, null, 2)}`
      : `Based on the following search results, summarize key insights about "${category}" (2-3 paragraphs, 2-3 sentences each). Include specific data and viewpoints, cite source links:\n\n${JSON.stringify(items, null, 2)}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: language === 'zh'
              ? "你是一位专业的市场研究分析师。总结搜索结果时要客观、具体，引用真实链接。"
              : "You are a professional market research analyst. Summarize search results objectively and specifically, citing real links."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('❌ AI summarization failed:', error instanceof Error ? error.message : error);
      return '';
    }
  }
}

// Singleton instances for persistent caching across requests
let providerInstance: IMarketInsightsProvider | null = null;

/**
 * Provider Factory (Singleton)
 * Returns appropriate provider based on environment configuration
 * Uses singleton pattern to maintain cache across requests
 */
export function getMarketInsightsProvider(): IMarketInsightsProvider {
  // Return existing instance if available
  if (providerInstance) {
    return providerInstance;
  }

  const providerType = process.env.MARKET_INSIGHTS_PROVIDER || 'noop';
  const enabled = process.env.MARKET_INSIGHTS_ENABLED !== 'false';

  if (!enabled) {
    console.log('📊 Market insights disabled via MARKET_INSIGHTS_ENABLED flag');
    providerInstance = new NoopProvider();
    return providerInstance;
  }

  switch (providerType.toLowerCase()) {
    case 'serper':
      console.log('📊 Using Serper market insights provider');
      providerInstance = new SerperProvider();
      return providerInstance;
    case 'noop':
    default:
      console.log('📊 Using no-op market insights provider (no external search)');
      providerInstance = new NoopProvider();
      return providerInstance;
  }
}
