/**
 * Intelligent Recommendations System for SignumLBRI
 * 
 * This system provides AI-powered recommendations for:
 * - Book recommendations based on user preferences
 * - Similar books suggestions
 * - Price optimization
 * - User behavior analysis
 * - Market trends prediction
 */

interface UserPreference {
  userId: string;
  subjects: string[];
  gradeLevels: string[];
  priceRange: { min: number; max: number };
  preferredConditions: string[];
  authors: string[];
  publishers: string[];
  interactionHistory: BookInteraction[];
  lastUpdated: Date;
}

interface BookInteraction {
  bookId: string;
  userId: string;
  type: 'view' | 'like' | 'purchase' | 'search' | 'share' | 'bookmark';
  timestamp: Date;
  context?: {
    searchQuery?: string;
    referrer?: string;
    sessionId?: string;
  };
  weight: number; // Importance score for this interaction
}

interface BookFeatures {
  bookId: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  subject: string;
  gradeLevel: string;
  category: string;
  tags: string[];
  averagePrice: number;
  condition: string;
  popularity: number;
  userRating: number;
  textComplexity: number;
  similarBooks: string[];
  lastUpdated: Date;
}

interface RecommendationResult {
  bookId: string;
  score: number;
  confidence: number;
  reasons: string[];
  type: 'collaborative' | 'content' | 'hybrid' | 'trending' | 'personalized';
  metadata: {
    popularity: number;
    userMatch: number;
    contentMatch: number;
    priceMatch: number;
    availabilityScore: number;
  };
}

interface MarketTrend {
  subject: string;
  gradeLevel: string;
  trend: 'rising' | 'falling' | 'stable';
  changePercentage: number;
  volume: number;
  averagePrice: number;
  predictedPrice: number;
  confidence: number;
  period: string;
}

class IntelligentRecommendationEngine {
  private userPreferences: Map<string, UserPreference> = new Map();
  private bookFeatures: Map<string, BookFeatures> = new Map();
  private interactions: BookInteraction[] = [];
  private marketTrends: Map<string, MarketTrend> = new Map();
  
  // Machine learning weights and parameters
  private weights = {
    collaborative: 0.4,
    contentBased: 0.3,
    popularity: 0.2,
    recency: 0.1
  };

  private config = {
    maxRecommendations: 10,
    minConfidence: 0.3,
    trendingThreshold: 0.7,
    similarityThreshold: 0.5,
    interactionDecayDays: 30
  };

  /**
   * Initialize the recommendation engine
   */
  public async initialize(): Promise<void> {
    console.log('🤖 Initializing Intelligent Recommendation Engine...');
    
    try {
      // Load existing data
      await this.loadUserPreferences();
      await this.loadBookFeatures();
      await this.loadInteractionHistory();
      await this.calculateMarketTrends();
      
      console.log('✅ Recommendation engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize recommendation engine:', error);
      throw error;
    }
  }

  /**
   * Get personalized book recommendations for a user
   */
  public async getRecommendationsForUser(
    userId: string, 
    limit: number = this.config.maxRecommendations,
    options: {
      includeTypes?: Array<RecommendationResult['type']>;
      excludeOwned?: boolean;
      priceRange?: { min: number; max: number };
    } = {}
  ): Promise<RecommendationResult[]> {
    
    const userPrefs = this.userPreferences.get(userId);
    if (!userPrefs) {
      // Return trending books for new users
      return this.getTrendingRecommendations(limit);
    }

    const recommendations: RecommendationResult[] = [];

    // Collaborative filtering recommendations
    if (!options.includeTypes || options.includeTypes.includes('collaborative')) {
      const collaborative = await this.getCollaborativeRecommendations(userId, limit);
      recommendations.push(...collaborative);
    }

    // Content-based recommendations
    if (!options.includeTypes || options.includeTypes.includes('content')) {
      const contentBased = await this.getContentBasedRecommendations(userId, limit);
      recommendations.push(...contentBased);
    }

    // Trending recommendations
    if (!options.includeTypes || options.includeTypes.includes('trending')) {
      const trending = await this.getTrendingRecommendations(Math.ceil(limit * 0.3));
      recommendations.push(...trending);
    }

    // Personalized recommendations based on recent activity
    if (!options.includeTypes || options.includeTypes.includes('personalized')) {
      const personalized = await this.getPersonalizedRecommendations(userId, limit);
      recommendations.push(...personalized);
    }

    // Combine and rank recommendations
    const combinedRecs = this.combineAndRankRecommendations(recommendations);
    
    // Apply filters
    let filteredRecs = this.applyFilters(combinedRecs, options);
    
    // Remove duplicates and limit results
    filteredRecs = this.removeDuplicates(filteredRecs).slice(0, limit);
    
    // Update user preferences based on recommendations
    this.updateUserPreferencesFromRecommendations(userId, filteredRecs);
    
    return filteredRecs;
  }

  /**
   * Collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    const userPrefs = this.userPreferences.get(userId);
    if (!userPrefs) return [];

    const userInteractions = this.interactions.filter(i => i.userId === userId);
    const userBooks = new Set(userInteractions.map(i => i.bookId));

    // Find similar users based on book interactions
    const similarUsers = this.findSimilarUsers(userId);
    const recommendations: RecommendationResult[] = [];

    for (const similarUser of similarUsers.slice(0, 10)) {
      const otherUserInteractions = this.interactions.filter(
        i => i.userId === similarUser.userId && !userBooks.has(i.bookId)
      );

      for (const interaction of otherUserInteractions) {
        const book = this.bookFeatures.get(interaction.bookId);
        if (!book) continue;

        const score = this.calculateCollaborativeScore(interaction, similarUser.similarity);
        if (score > this.config.minConfidence) {
          recommendations.push({
            bookId: interaction.bookId,
            score,
            confidence: score * 0.8, // Slightly lower confidence for collaborative
            reasons: [`Users with similar interests also liked this book`, `Popular among similar users`],
            type: 'collaborative',
            metadata: {
              popularity: book.popularity,
              userMatch: similarUser.similarity,
              contentMatch: 0,
              priceMatch: this.calculatePriceMatch(book, userPrefs),
              availabilityScore: 0.8
            }
          });
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Content-based recommendations
   */
  private async getContentBasedRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    const userPrefs = this.userPreferences.get(userId);
    if (!userPrefs) return [];

    const userInteractions = this.interactions.filter(i => i.userId === userId);
    const likedBooks = userInteractions
      .filter(i => i.type === 'like' || i.type === 'purchase')
      .map(i => this.bookFeatures.get(i.bookId))
      .filter(book => book !== undefined);

    if (likedBooks.length === 0) return [];

    const recommendations: RecommendationResult[] = [];
    const userBookIds = new Set(userInteractions.map(i => i.bookId));

    // Find books similar to user's liked books
    for (const [bookId, book] of this.bookFeatures) {
      if (userBookIds.has(bookId)) continue;

      let totalSimilarity = 0;
      let matchCount = 0;

      for (const likedBook of likedBooks) {
        const similarity = this.calculateBookSimilarity(book, likedBook);
        if (similarity > this.config.similarityThreshold) {
          totalSimilarity += similarity;
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const avgSimilarity = totalSimilarity / matchCount;
        const contentMatch = this.calculateContentMatch(book, userPrefs);
        const score = (avgSimilarity * 0.7) + (contentMatch * 0.3);

        if (score > this.config.minConfidence) {
          recommendations.push({
            bookId,
            score,
            confidence: score * 0.9,
            reasons: this.generateContentBasedReasons(book, likedBooks),
            type: 'content',
            metadata: {
              popularity: book.popularity,
              userMatch: 0,
              contentMatch,
              priceMatch: this.calculatePriceMatch(book, userPrefs),
              availabilityScore: 0.9
            }
          });
        }
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Trending recommendations
   */
  private async getTrendingRecommendations(limit: number): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    // Get books from trending categories
    for (const [trendKey, trend] of this.marketTrends) {
      if (trend.trend === 'rising' && trend.confidence > this.config.trendingThreshold) {
        
        // Find books in this trending category
        const trendingBooks = Array.from(this.bookFeatures.values())
          .filter(book => 
            book.subject === trend.subject && 
            book.gradeLevel === trend.gradeLevel
          )
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, Math.ceil(limit / 3));

        for (const book of trendingBooks) {
          const score = (trend.changePercentage / 100) * (book.popularity / 100);
          
          recommendations.push({
            bookId: book.bookId,
            score,
            confidence: trend.confidence,
            reasons: [
              `Trending in ${book.subject} for ${book.gradeLevel}`,
              `${trend.changePercentage.toFixed(1)}% increase in popularity`
            ],
            type: 'trending',
            metadata: {
              popularity: book.popularity,
              userMatch: 0,
              contentMatch: 0,
              priceMatch: 0.8, // Neutral price match for trending
              availabilityScore: 0.8
            }
          });
        }
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Personalized recommendations based on recent activity
   */
  private async getPersonalizedRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    const recentInteractions = this.interactions
      .filter(i => i.userId === userId)
      .filter(i => {
        const daysSince = (Date.now() - i.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= this.config.interactionDecayDays;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    if (recentInteractions.length === 0) return [];

    const recommendations: RecommendationResult[] = [];
    const interactedBooks = new Set(recentInteractions.map(i => i.bookId));

    // Analyze user's recent behavior patterns
    const patterns = this.analyzeUserPatterns(recentInteractions);
    
    // Find books matching recent patterns
    for (const [bookId, book] of this.bookFeatures) {
      if (interactedBooks.has(bookId)) continue;

      const patternMatch = this.calculatePatternMatch(book, patterns);
      if (patternMatch > this.config.minConfidence) {
        recommendations.push({
          bookId,
          score: patternMatch,
          confidence: patternMatch * 0.85,
          reasons: this.generatePatternBasedReasons(patterns, book),
          type: 'personalized',
          metadata: {
            popularity: book.popularity,
            userMatch: patternMatch,
            contentMatch: 0,
            priceMatch: 0.8,
            availabilityScore: 0.9
          }
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Find users similar to the given user
   */
  private findSimilarUsers(userId: string): Array<{ userId: string; similarity: number }> {
    const userInteractions = this.interactions.filter(i => i.userId === userId);
    const userBooks = new Set(userInteractions.map(i => i.bookId));

    const similarities: Array<{ userId: string; similarity: number }> = [];

    // Group interactions by user
    const userGroups = new Map<string, BookInteraction[]>();
    for (const interaction of this.interactions) {
      if (interaction.userId === userId) continue;
      
      if (!userGroups.has(interaction.userId)) {
        userGroups.set(interaction.userId, []);
      }
      userGroups.get(interaction.userId)!.push(interaction);
    }

    // Calculate similarity with each user
    for (const [otherUserId, otherInteractions] of userGroups) {
      const otherBooks = new Set(otherInteractions.map(i => i.bookId));
      
      // Jaccard similarity
      const intersection = new Set([...userBooks].filter(x => otherBooks.has(x)));
      const union = new Set([...userBooks, ...otherBooks]);
      
      const similarity = intersection.size / union.size;
      
      if (similarity > 0.1) { // Minimum similarity threshold
        similarities.push({ userId: otherUserId, similarity });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate similarity between two books
   */
  private calculateBookSimilarity(book1: BookFeatures, book2: BookFeatures): number {
    let similarity = 0;
    let factors = 0;

    // Subject similarity
    if (book1.subject === book2.subject) {
      similarity += 0.3;
    }
    factors += 0.3;

    // Grade level similarity
    if (book1.gradeLevel === book2.gradeLevel) {
      similarity += 0.25;
    }
    factors += 0.25;

    // Author similarity
    if (book1.author === book2.author) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Publisher similarity
    if (book1.publisher === book2.publisher) {
      similarity += 0.1;
    }
    factors += 0.1;

    // Tag similarity (Jaccard coefficient)
    const tags1 = new Set(book1.tags);
    const tags2 = new Set(book2.tags);
    const tagIntersection = new Set([...tags1].filter(x => tags2.has(x)));
    const tagUnion = new Set([...tags1, ...tags2]);
    
    if (tagUnion.size > 0) {
      const tagSimilarity = tagIntersection.size / tagUnion.size;
      similarity += tagSimilarity * 0.15;
    }
    factors += 0.15;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate how well a book matches user content preferences
   */
  private calculateContentMatch(book: BookFeatures, userPrefs: UserPreference): number {
    let match = 0;
    let weight = 0;

    // Subject match
    if (userPrefs.subjects.includes(book.subject)) {
      match += 0.4;
    }
    weight += 0.4;

    // Grade level match
    if (userPrefs.gradeLevels.includes(book.gradeLevel)) {
      match += 0.3;
    }
    weight += 0.3;

    // Author preference
    if (userPrefs.authors.includes(book.author)) {
      match += 0.2;
    }
    weight += 0.2;

    // Publisher preference
    if (userPrefs.publishers.includes(book.publisher)) {
      match += 0.1;
    }
    weight += 0.1;

    return weight > 0 ? match / weight : 0;
  }

  /**
   * Calculate price match score
   */
  private calculatePriceMatch(book: BookFeatures, userPrefs: UserPreference): number {
    const { min, max } = userPrefs.priceRange;
    
    if (book.averagePrice >= min && book.averagePrice <= max) {
      // Perfect match
      return 1.0;
    } else if (book.averagePrice < min) {
      // Below range - still good but slightly lower score
      return 0.8;
    } else {
      // Above range - penalize based on how much over
      const overage = book.averagePrice - max;
      const penalty = Math.min(overage / max, 0.5); // Max 50% penalty
      return Math.max(0.3, 1.0 - penalty);
    }
  }

  /**
   * Calculate collaborative filtering score
   */
  private calculateCollaborativeScore(interaction: BookInteraction, userSimilarity: number): number {
    const interactionWeight = this.getInteractionWeight(interaction.type);
    const recencyBonus = this.calculateRecencyBonus(interaction.timestamp);
    
    return userSimilarity * interactionWeight * recencyBonus;
  }

  /**
   * Get weight for different interaction types
   */
  private getInteractionWeight(type: BookInteraction['type']): number {
    const weights = {
      'purchase': 1.0,
      'like': 0.8,
      'bookmark': 0.7,
      'share': 0.6,
      'view': 0.3,
      'search': 0.2
    };
    
    return weights[type] || 0.1;
  }

  /**
   * Calculate recency bonus for interactions
   */
  private calculateRecencyBonus(timestamp: Date): number {
    const daysSince = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince <= 1) return 1.0;
    if (daysSince <= 7) return 0.9;
    if (daysSince <= 30) return 0.7;
    if (daysSince <= 90) return 0.5;
    
    return 0.3;
  }

  /**
   * Analyze user behavior patterns
   */
  private analyzeUserPatterns(interactions: BookInteraction[]): any {
    const patterns = {
      preferredSubjects: new Map<string, number>(),
      preferredGradeLevels: new Map<string, number>(),
      interactionTimes: [] as number[],
      searchPatterns: [] as string[],
      behaviorTrend: 'stable' as 'increasing' | 'decreasing' | 'stable'
    };

    for (const interaction of interactions) {
      const book = this.bookFeatures.get(interaction.bookId);
      if (!book) continue;

      // Subject preferences
      const currentSubjectCount = patterns.preferredSubjects.get(book.subject) || 0;
      patterns.preferredSubjects.set(book.subject, currentSubjectCount + interaction.weight);

      // Grade level preferences
      const currentGradeCount = patterns.preferredGradeLevels.get(book.gradeLevel) || 0;
      patterns.preferredGradeLevels.set(book.gradeLevel, currentGradeCount + interaction.weight);

      // Interaction times
      patterns.interactionTimes.push(interaction.timestamp.getHours());

      // Search patterns
      if (interaction.context?.searchQuery) {
        patterns.searchPatterns.push(interaction.context.searchQuery);
      }
    }

    return patterns;
  }

  /**
   * Calculate how well a book matches user patterns
   */
  private calculatePatternMatch(book: BookFeatures, patterns: any): number {
    let score = 0;
    let weight = 0;

    // Subject pattern match
    const subjectScore = patterns.preferredSubjects.get(book.subject) || 0;
    if (subjectScore > 0) {
      score += Math.min(subjectScore / 10, 1.0) * 0.5;
    }
    weight += 0.5;

    // Grade level pattern match
    const gradeScore = patterns.preferredGradeLevels.get(book.gradeLevel) || 0;
    if (gradeScore > 0) {
      score += Math.min(gradeScore / 10, 1.0) * 0.3;
    }
    weight += 0.3;

    // Popularity boost
    score += (book.popularity / 100) * 0.2;
    weight += 0.2;

    return weight > 0 ? score / weight : 0;
  }

  /**
   * Combine and rank all recommendations
   */
  private combineAndRankRecommendations(recommendations: RecommendationResult[]): RecommendationResult[] {
    // Group by book ID and combine scores
    const bookScores = new Map<string, RecommendationResult>();

    for (const rec of recommendations) {
      const existing = bookScores.get(rec.bookId);
      
      if (existing) {
        // Combine scores using weighted average
        const combinedScore = (existing.score + rec.score * this.weights[rec.type]) / 2;
        existing.score = combinedScore;
        existing.confidence = Math.max(existing.confidence, rec.confidence);
        existing.reasons.push(...rec.reasons);
        
        // Update metadata
        existing.metadata.userMatch = Math.max(existing.metadata.userMatch, rec.metadata.userMatch);
        existing.metadata.contentMatch = Math.max(existing.metadata.contentMatch, rec.metadata.contentMatch);
        existing.metadata.priceMatch = (existing.metadata.priceMatch + rec.metadata.priceMatch) / 2;
      } else {
        bookScores.set(rec.bookId, { ...rec });
      }
    }

    return Array.from(bookScores.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Apply filters to recommendations
   */
  private applyFilters(
    recommendations: RecommendationResult[],
    options: {
      excludeOwned?: boolean;
      priceRange?: { min: number; max: number };
    }
  ): RecommendationResult[] {
    return recommendations.filter(rec => {
      const book = this.bookFeatures.get(rec.bookId);
      if (!book) return false;

      // Price range filter
      if (options.priceRange) {
        const { min, max } = options.priceRange;
        if (book.averagePrice < min || book.averagePrice > max) {
          return false;
        }
      }

      // Confidence threshold
      if (rec.confidence < this.config.minConfidence) {
        return false;
      }

      return true;
    });
  }

  /**
   * Remove duplicate recommendations
   */
  private removeDuplicates(recommendations: RecommendationResult[]): RecommendationResult[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.bookId)) {
        return false;
      }
      seen.add(rec.bookId);
      return true;
    });
  }

  /**
   * Generate reasons for content-based recommendations
   */
  private generateContentBasedReasons(book: BookFeatures, likedBooks: BookFeatures[]): string[] {
    const reasons: string[] = [];
    
    for (const likedBook of likedBooks) {
      if (book.subject === likedBook.subject) {
        reasons.push(`Similar subject to "${likedBook.title}"`);
      }
      if (book.author === likedBook.author) {
        reasons.push(`Same author as "${likedBook.title}"`);
      }
      if (book.gradeLevel === likedBook.gradeLevel) {
        reasons.push(`Same grade level as books you liked`);
      }
    }

    if (book.popularity > 80) {
      reasons.push(`Highly popular among students`);
    }

    return reasons.slice(0, 3); // Limit to 3 reasons
  }

  /**
   * Generate reasons for pattern-based recommendations
   */
  private generatePatternBasedReasons(patterns: any, book: BookFeatures): string[] {
    const reasons: string[] = [];

    if (patterns.preferredSubjects.has(book.subject)) {
      reasons.push(`Matches your interest in ${book.subject}`);
    }

    if (patterns.preferredGradeLevels.has(book.gradeLevel)) {
      reasons.push(`For ${book.gradeLevel}, which you often browse`);
    }

    if (book.popularity > 70) {
      reasons.push(`Trending among students`);
    }

    return reasons;
  }

  /**
   * Update user preferences based on recommendations shown
   */
  private updateUserPreferencesFromRecommendations(userId: string, recommendations: RecommendationResult[]): void {
    // This would update user preferences based on which recommendations are shown
    // Implementation would track what was recommended for future learning
    console.log(`📊 Updated preferences for user ${userId} based on ${recommendations.length} recommendations`);
  }

  /**
   * Placeholder methods for data loading (would connect to database)
   */
  private async loadUserPreferences(): Promise<void> {
    console.log('📚 Loading user preferences...');
    // Would load from database
  }

  private async loadBookFeatures(): Promise<void> {
    console.log('📖 Loading book features...');
    // Would load from database
  }

  private async loadInteractionHistory(): Promise<void> {
    console.log('📈 Loading interaction history...');
    // Would load from database
  }

  private async calculateMarketTrends(): Promise<void> {
    console.log('📊 Calculating market trends...');
    // Would analyze historical data
  }
}

// Export the recommendation engine
export {
  IntelligentRecommendationEngine,
  UserPreference,
  BookInteraction,
  BookFeatures,
  RecommendationResult,
  MarketTrend
};

// Create and export default instance
export const recommendationEngine = new IntelligentRecommendationEngine();
