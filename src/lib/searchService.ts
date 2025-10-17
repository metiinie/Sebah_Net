// Advanced Search & Discovery Service
export interface SearchFilters {
  query?: string;
  genre?: string[];
  language?: string[];
  releaseYear?: {
    min?: number;
    max?: number;
  };
  duration?: {
    min?: number; // in minutes
    max?: number;
  };
  rating?: {
    min?: number;
    max?: number;
  };
  actors?: string[];
  tags?: string[];
  type?: 'movie' | 'music' | 'all';
  sortBy?: 'relevance' | 'title' | 'date' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'movie' | 'music';
  genre: string;
  language: string;
  releaseYear?: number;
  duration?: number;
  rating?: number;
  actors?: string[];
  tags?: string[];
  thumbnailUrl?: string;
  relevanceScore?: number;
  popularityScore?: number;
  similarityScore?: number;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'movie' | 'music' | 'actor' | 'genre';
  popularity: number;
  category?: string;
}

export interface TrendingSearch {
  query: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
}

export interface RecommendationContext {
  userId?: string;
  currentContent?: {
    id: string;
    type: 'movie' | 'music';
    genre: string;
    tags?: string[];
  };
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'tv';
  viewingHistory?: Array<{
    id: string;
    type: 'movie' | 'music';
    genre: string;
    rating?: number;
    watchTime: number;
    completed: boolean;
    timestamp: Date;
  }>;
  preferences?: {
    favoriteGenres: string[];
    preferredLanguages: string[];
    averageWatchTime: number;
    completionRate: number;
  };
}

export interface Recommendation {
  id: string;
  title: string;
  type: 'movie' | 'music';
  genre: string;
  reason: string;
  confidence: number;
  similarityScore?: number;
  collaborativeScore?: number;
  contextualScore?: number;
  thumbnailUrl?: string;
  description?: string;
}

export class SearchService {
  private static instance: SearchService;
  private searchIndex: Map<string, SearchResult[]> = new Map();
  private trendingSearches: TrendingSearch[] = [];
  private searchHistory: string[] = [];
  private userPreferences: Map<string, any> = new Map();

  private constructor() {
    this.initializeSearchIndex();
    this.loadTrendingSearches();
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  // Advanced Search Implementation
  public async search(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      let results: SearchResult[] = [];

      // Get base results based on type
      if (filters.type === 'movie') {
        results = await this.searchMovies(filters);
      } else if (filters.type === 'music') {
        results = await this.searchMusic(filters);
      } else {
        const movieResults = await this.searchMovies(filters);
        const musicResults = await this.searchMusic(filters);
        results = [...movieResults, ...musicResults];
      }

      // Apply filters
      results = this.applyFilters(results, filters);

      // Apply sorting
      results = this.applySorting(results, filters.sortBy || 'relevance', filters.sortOrder || 'desc');

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 20;
      results = results.slice(offset, offset + limit);

      // Track search query for trending
      if (filters.query) {
        this.trackSearchQuery(filters.query);
      }

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  private async searchMovies(filters: SearchFilters): Promise<SearchResult[]> {
    // In a real implementation, this would query your database
    // For now, we'll simulate with mock data
    const mockMovies: SearchResult[] = [
      {
        id: '1',
        title: 'The Dark Knight',
        description: 'Batman faces the Joker in this epic superhero film',
        type: 'movie',
        genre: 'Action',
        language: 'English',
        releaseYear: 2008,
        duration: 152,
        rating: 9.0,
        actors: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
        tags: ['superhero', 'action', 'drama', 'crime'],
        thumbnailUrl: '/thumbnails/dark-knight.jpg',
        popularityScore: 0.95
      },
      {
        id: '2',
        title: 'Inception',
        description: 'A mind-bending thriller about dreams within dreams',
        type: 'movie',
        genre: 'Sci-Fi',
        language: 'English',
        releaseYear: 2010,
        duration: 148,
        rating: 8.8,
        actors: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy'],
        tags: ['sci-fi', 'thriller', 'mind-bending', 'action'],
        thumbnailUrl: '/thumbnails/inception.jpg',
        popularityScore: 0.92
      }
    ];

    return this.filterByQuery(mockMovies, filters.query);
  }

  private async searchMusic(filters: SearchFilters): Promise<SearchResult[]> {
    // In a real implementation, this would query your database
    const mockMusic: SearchResult[] = [
      {
        id: '3',
        title: 'Bohemian Rhapsody',
        description: 'Queen\'s iconic rock opera masterpiece',
        type: 'music',
        genre: 'Rock',
        language: 'English',
        releaseYear: 1975,
        duration: 5.9,
        rating: 9.5,
        actors: ['Queen'],
        tags: ['rock', 'opera', 'classic', 'progressive'],
        thumbnailUrl: '/thumbnails/bohemian-rhapsody.jpg',
        popularityScore: 0.98
      },
      {
        id: '4',
        title: 'Hotel California',
        description: 'The Eagles\' legendary rock ballad',
        type: 'music',
        genre: 'Rock',
        language: 'English',
        releaseYear: 1976,
        duration: 6.3,
        rating: 9.2,
        actors: ['Eagles'],
        tags: ['rock', 'ballad', 'classic', 'country-rock'],
        thumbnailUrl: '/thumbnails/hotel-california.jpg',
        popularityScore: 0.94
      }
    ];

    return this.filterByQuery(mockMusic, filters.query);
  }

  private filterByQuery(results: SearchResult[], query?: string): SearchResult[] {
    if (!query) return results;

    const searchTerms = query.toLowerCase().split(' ');
    
    return results.map(result => {
      const searchableText = [
        result.title,
        result.description,
        ...(result.actors || []),
        ...(result.tags || [])
      ].join(' ').toLowerCase();

      const relevanceScore = searchTerms.reduce((score, term) => {
        if (searchableText.includes(term)) {
          // Higher score for title matches
          if (result.title.toLowerCase().includes(term)) {
            return score + 3;
          }
          // Medium score for description matches
          if (result.description?.toLowerCase().includes(term)) {
            return score + 2;
          }
          // Lower score for actor/tag matches
          return score + 1;
        }
        return score;
      }, 0);

      return {
        ...result,
        relevanceScore: relevanceScore / searchTerms.length
      };
    }).filter(result => result.relevanceScore! > 0);
  }

  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(result => {
      // Genre filter
      if (filters.genre && filters.genre.length > 0) {
        if (!filters.genre.includes(result.genre)) return false;
      }

      // Language filter
      if (filters.language && filters.language.length > 0) {
        if (!filters.language.includes(result.language)) return false;
      }

      // Release year filter
      if (filters.releaseYear) {
        if (filters.releaseYear.min && result.releaseYear && result.releaseYear < filters.releaseYear.min) {
          return false;
        }
        if (filters.releaseYear.max && result.releaseYear && result.releaseYear > filters.releaseYear.max) {
          return false;
        }
      }

      // Duration filter
      if (filters.duration) {
        if (filters.duration.min && result.duration && result.duration < filters.duration.min) {
          return false;
        }
        if (filters.duration.max && result.duration && result.duration > filters.duration.max) {
          return false;
        }
      }

      // Rating filter
      if (filters.rating) {
        if (filters.rating.min && result.rating && result.rating < filters.rating.min) {
          return false;
        }
        if (filters.rating.max && result.rating && result.rating > filters.rating.max) {
          return false;
        }
      }

      // Actors filter
      if (filters.actors && filters.actors.length > 0) {
        if (!result.actors || !filters.actors.some(actor => 
          result.actors!.some(resultActor => 
            resultActor.toLowerCase().includes(actor.toLowerCase())
          )
        )) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!result.tags || !filters.tags.some(tag => 
          result.tags!.some(resultTag => 
            resultTag.toLowerCase().includes(tag.toLowerCase())
          )
        )) {
          return false;
        }
      }

      return true;
    });
  }

  private applySorting(results: SearchResult[], sortBy: string, sortOrder: string): SearchResult[] {
    return results.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'relevance':
          aValue = a.relevanceScore || 0;
          bValue = b.relevanceScore || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'date':
          aValue = a.releaseYear || 0;
          bValue = b.releaseYear || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'popularity':
          aValue = a.popularityScore || 0;
          bValue = b.popularityScore || 0;
          break;
        default:
          aValue = a.relevanceScore || 0;
          bValue = b.relevanceScore || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Search Suggestions and Autocomplete
  public async getSearchSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Get trending searches that match
    const trendingMatches = this.trendingSearches
      .filter(trend => trend.query.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map(trend => ({
        id: `trending-${trend.query}`,
        text: trend.query,
        type: 'query' as const,
        popularity: trend.count,
        category: 'Trending'
      }));

    suggestions.push(...trendingMatches);

    // Get content suggestions
    const contentResults = await this.search({ query, limit: 5 });
    const contentSuggestions = contentResults.map(result => ({
      id: `content-${result.id}`,
      text: result.title,
      type: result.type as 'movie' | 'music',
      popularity: result.popularityScore || 0,
      category: result.genre
    }));

    suggestions.push(...contentSuggestions);

    // Get genre suggestions
    const genreSuggestions = this.getGenreSuggestions(queryLower);
    suggestions.push(...genreSuggestions);

    // Sort by popularity and relevance
    return suggestions
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  private getGenreSuggestions(query: string): SearchSuggestion[] {
    const genres = [
      'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller',
      'Romance', 'Adventure', 'Fantasy', 'Mystery', 'Crime',
      'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic'
    ];

    return genres
      .filter(genre => genre.toLowerCase().includes(query))
      .map(genre => ({
        id: `genre-${genre}`,
        text: genre,
        type: 'genre' as const,
        popularity: 0.5,
        category: 'Genre'
      }));
  }

  // Trending and Popular Searches
  public getTrendingSearches(limit: number = 10): TrendingSearch[] {
    return this.trendingSearches.slice(0, limit);
  }

  public getPopularSearches(limit: number = 10): TrendingSearch[] {
    return [...this.trendingSearches]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private trackSearchQuery(query: string): void {
    // Add to search history
    this.searchHistory.unshift(query);
    this.searchHistory = this.searchHistory.slice(0, 100); // Keep last 100 searches

    // Update trending searches
    const existing = this.trendingSearches.find(trend => trend.query === query);
    if (existing) {
      existing.count++;
      existing.trend = 'up';
    } else {
      this.trendingSearches.push({
        query,
        count: 1,
        trend: 'up',
        category: 'General'
      });
    }

    // Sort by count and keep top 50
    this.trendingSearches = this.trendingSearches
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    localStorage.setItem('trendingSearches', JSON.stringify(this.trendingSearches));
  }

  // Recommendation Engine
  public async getRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Collaborative filtering recommendations
    const collaborativeRecs = await this.getCollaborativeRecommendations(context);
    recommendations.push(...collaborativeRecs);

    // Content similarity recommendations
    const similarityRecs = await this.getSimilarityRecommendations(context);
    recommendations.push(...similarityRecs);

    // Contextual recommendations
    const contextualRecs = await this.getContextualRecommendations(context);
    recommendations.push(...contextualRecs);

    // Remove duplicates and sort by confidence
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    return uniqueRecs
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);
  }

  private async getCollaborativeRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    // Simulate collaborative filtering based on user viewing history
    if (!context.viewingHistory || context.viewingHistory.length === 0) {
      return [];
    }

    const userGenres = context.viewingHistory.map(item => item.genre);
    const genreCounts = userGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    // Get recommendations based on top genres
    const results = await this.search({
      genre: topGenres,
      limit: 10
    });

    return results.map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      genre: result.genre,
      reason: `Because you watched ${topGenres.join(', ')} content`,
      confidence: 0.8,
      collaborativeScore: 0.8,
      thumbnailUrl: result.thumbnailUrl,
      description: result.description
    }));
  }

  private async getSimilarityRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    if (!context.currentContent) return [];

    // Simulate content similarity using embeddings
    const results = await this.search({
      genre: [context.currentContent.genre],
      tags: context.currentContent.tags,
      limit: 10
    });

    return results
      .filter(result => result.id !== context.currentContent!.id)
      .map(result => ({
        id: result.id,
        title: result.title,
        type: result.type,
        genre: result.genre,
        reason: `Similar to ${context.currentContent!.id}`,
        confidence: 0.7,
        similarityScore: 0.7,
        thumbnailUrl: result.thumbnailUrl,
        description: result.description
      }));
  }

  private async getContextualRecommendions(context: RecommendationContext): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Time-based recommendations
    if (context.timeOfDay) {
      const timeBasedRecs = await this.getTimeBasedRecommendations(context.timeOfDay);
      recommendations.push(...timeBasedRecs);
    }

    // Device-based recommendations
    if (context.deviceType) {
      const deviceBasedRecs = await this.getDeviceBasedRecommendations(context.deviceType);
      recommendations.push(...deviceBasedRecs);
    }

    return recommendations;
  }

  private async getTimeBasedRecommendations(timeOfDay: string): Promise<Recommendation[]> {
    const timeGenres: { [key: string]: string[] } = {
      morning: ['Comedy', 'Romance', 'Pop'],
      afternoon: ['Action', 'Adventure', 'Rock'],
      evening: ['Drama', 'Thriller', 'Jazz'],
      night: ['Horror', 'Mystery', 'Electronic']
    };

    const genres = timeGenres[timeOfDay] || [];
    const results = await this.search({ genre: genres, limit: 5 });

    return results.map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      genre: result.genre,
      reason: `Perfect for ${timeOfDay}`,
      confidence: 0.6,
      contextualScore: 0.6,
      thumbnailUrl: result.thumbnailUrl,
      description: result.description
    }));
  }

  private async getDeviceBasedRecommendations(deviceType: string): Promise<Recommendation[]> {
    // Different content recommendations based on device
    const devicePreferences: { [key: string]: { genres: string[], limit: number } } = {
      mobile: { genres: ['Comedy', 'Pop', 'Hip-Hop'], limit: 3 },
      tablet: { genres: ['Action', 'Drama', 'Rock'], limit: 3 },
      desktop: { genres: ['Sci-Fi', 'Thriller', 'Classical'], limit: 3 },
      tv: { genres: ['Action', 'Adventure', 'Horror'], limit: 3 }
    };

    const preferences = devicePreferences[deviceType] || { genres: [], limit: 3 };
    const results = await this.search({ genre: preferences.genres, limit: preferences.limit });

    return results.map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      genre: result.genre,
      reason: `Great for ${deviceType}`,
      confidence: 0.5,
      contextualScore: 0.5,
      thumbnailUrl: result.thumbnailUrl,
      description: result.description
    }));
  }

  private deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.id)) return false;
      seen.add(rec.id);
      return true;
    });
  }

  // Personalized Home Feed
  public async getPersonalizedFeed(context: RecommendationContext): Promise<Recommendation[]> {
    const feed: Recommendation[] = [];

    // Get different types of recommendations
    const trending = await this.getTrendingRecommendations();
    const personalized = await this.getRecommendations(context);
    const recentlyWatched = await this.getRecentlyWatchedRecommendations(context);

    // Mix recommendations with different weights
    feed.push(...trending.map(rec => ({ ...rec, confidence: rec.confidence * 0.3 })));
    feed.push(...personalized.map(rec => ({ ...rec, confidence: rec.confidence * 0.5 })));
    feed.push(...recentlyWatched.map(rec => ({ ...rec, confidence: rec.confidence * 0.2 })));

    // Sort by confidence and remove duplicates
    const uniqueFeed = this.deduplicateRecommendations(feed);
    return uniqueFeed
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 30);
  }

  private async getTrendingRecommendations(): Promise<Recommendation[]> {
    const trending = this.getTrendingSearches(5);
    const results = await Promise.all(
      trending.map(trend => this.search({ query: trend.query, limit: 1 }))
    );

    return results.flat().map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      genre: result.genre,
      reason: 'Trending now',
      confidence: 0.8,
      thumbnailUrl: result.thumbnailUrl,
      description: result.description
    }));
  }

  private async getRecentlyWatchedRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    if (!context.viewingHistory || context.viewingHistory.length === 0) {
      return [];
    }

    const recentItems = context.viewingHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    const recommendations: Recommendation[] = [];
    for (const item of recentItems) {
      const similar = await this.getSimilarityRecommendations({
        currentContent: {
          id: item.id,
          type: item.type,
          genre: item.genre
        }
      });
      recommendations.push(...similar);
    }

    return recommendations;
  }

  // Utility Methods
  private initializeSearchIndex(): void {
    // Initialize search index with mock data
    // In a real implementation, this would load from your database
  }

  private loadTrendingSearches(): void {
    const saved = localStorage.getItem('trendingSearches');
    if (saved) {
      this.trendingSearches = JSON.parse(saved);
    }

    const history = localStorage.getItem('searchHistory');
    if (history) {
      this.searchHistory = JSON.parse(history);
    }
  }

  public getSearchHistory(): string[] {
    return this.searchHistory.slice(0, 10);
  }

  public clearSearchHistory(): void {
    this.searchHistory = [];
    localStorage.removeItem('searchHistory');
  }

  // Analytics
  public trackSearchClick(query: string, resultId: string): void {
    // Track search result clicks for analytics
    console.log('Search click tracked:', { query, resultId });
  }

  public trackRecommendationClick(recommendationId: string, reason: string): void {
    // Track recommendation clicks for analytics
    console.log('Recommendation click tracked:', { recommendationId, reason });
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();

