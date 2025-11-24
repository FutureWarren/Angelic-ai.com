import { 
  type User, 
  type UpsertUser,
  type Analysis, 
  type InsertAnalysis, 
  type AnalysisResult,
  type Conversation,
  type InsertConversation,
  type ChatMessage,
  type InsertChatMessage,
  type Report,
  type InsertReport,
  type Feedback,
  type InsertFeedback,
  type Idea,
  type InsertIdea,
  type Eval,
  type InsertEval,
  type Rating,
  type InsertRating,
  type Match,
  type InsertMatch,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  users, 
  analyses, 
  conversations, 
  chatMessages,
  reports,
  feedbacks,
  ideas,
  evals,
  ratings,
  matches,
  passwordResetTokens
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User methods (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createEmailUser(email: string, hashedPassword: string, firstName?: string, lastName?: string): Promise<User>;
  
  // Analysis methods (legacy)
  createAnalysis(analysis: InsertAnalysis & { result: AnalysisResult; userId?: string; sessionId?: string }): Promise<Analysis>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getAnalysesByUser(userId: string): Promise<Analysis[]>;
  getAnalysesBySession(sessionId: string): Promise<Analysis[]>;
  
  // Chat methods
  createConversation(conversation: InsertConversation & { userId?: string; sessionId?: string }): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string): Promise<Conversation[]>;
  getConversationsBySession(sessionId: string): Promise<Conversation[]>;
  updateConversation(id: string, updates: Partial<Pick<Conversation, 'title' | 'updatedAt' | 'email' | 'reportRequested' | 'reportSent' | 'aiPersona' | 'userId'>>): Promise<void>;
  
  addMessageToConversation(message: InsertChatMessage): Promise<ChatMessage>;
  getConversationMessages(conversationId: string): Promise<ChatMessage[]>;
  
  // Report methods
  createReport(report: InsertReport & { reportType?: string }): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReportsByConversation(conversationId: string): Promise<Report[]>;
  getReportsByUser(userId: string): Promise<Report[]>;
  updateReport(id: string, updates: Partial<Pick<Report, 'sentAt' | 'viewedAt'>>): Promise<void>;
  markReportViewed(id: string): Promise<void>;
  getReportByShareToken(shareToken: string): Promise<Report | undefined>;
  incrementShareCount(id: string): Promise<void>;
  
  // Payment-related report methods (integrated with Stripe blueprint - javascript_stripe)
  createPendingReport(conversationId: string, stripePaymentIntentId: string, amount: string, currency: string): Promise<string>;
  getReportsByPaymentIntent(paymentIntentId: string): Promise<Report[]>;
  updateReportPaymentStatus(id: string, updates: { paymentStatus: string; paidAt: Date }): Promise<void>;
  
  // Admin methods for statistics
  getConversationsWithEmails(): Promise<Conversation[]>;
  getTotalReports(): Promise<Report[]>;
  getRecentEmailCollections(limit: number): Promise<Conversation[]>;
  getTotalConversations(): Promise<number>;
  getAllReportsWithScores(): Promise<Report[]>;
  getAllUsers(): Promise<User[]>;
  
  // Feedback methods
  createFeedback(feedback: InsertFeedback & { userId?: string; sessionId?: string }): Promise<Feedback>;
  getAllFeedbacks(): Promise<Feedback[]>;
  getFeedback(id: string): Promise<Feedback | undefined>;
  markFeedbackRead(id: string): Promise<void>;
  updateFeedbackNotes(id: string, notes: string): Promise<void>;
  
  // ELO Ranking System methods
  createIdea(idea: InsertIdea): Promise<Idea>;
  getIdea(id: string): Promise<Idea | undefined>;
  
  createEval(eval: InsertEval): Promise<Eval>;
  getEval(ideaId: string): Promise<Eval | undefined>;
  
  createOrUpdateRating(rating: InsertRating): Promise<Rating>;
  getRating(ideaId: string): Promise<Rating | undefined>;
  getTopRatedIdeas(limit: number): Promise<Array<{ idea: Idea; rating: Rating; eval: Eval | null }>>;
  
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchesForIdea(ideaId: string): Promise<Match[]>;
  getIdeasNearElo(targetElo: number, category: string | null, excludeIds: string[], limit: number): Promise<Array<{ idea: Idea; rating: Rating }>>;
  
  // Password reset methods
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if user exists by ID (primary key)
    const existingUserById = await this.getUser(userData.id);
    
    if (existingUserById) {
      // User exists with this ID, update it
      const [updated] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return updated;
    }
    
    // Check if user already exists by email (for email conflict detection)
    const existingUserByEmail = userData.email ? await this.getUserByEmail(userData.email) : undefined;
    
    if (existingUserByEmail) {
      // If user exists with different ID (email conflict)
      // This can happen when switching auth providers
      // Return the existing user to avoid duplicate constraint error
      console.warn(`Email ${userData.email} already exists with different ID. Returning existing user.`);
      return existingUserByEmail;
    }
    
    // User doesn't exist, insert new user
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async createEmailUser(email: string, hashedPassword: string, firstName?: string, lastName?: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        authProvider: "email",
        firstName: firstName || null,
        lastName: lastName || null,
      })
      .returning();
    return user;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis & { result: AnalysisResult; userId?: string; sessionId?: string }): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values({
        idea: insertAnalysis.idea,
        result: insertAnalysis.result,
        userId: insertAnalysis.userId || null,
        sessionId: insertAnalysis.sessionId || null,
      })
      .returning();
    return analysis;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis || undefined;
  }

  // Additional method for getting user's analysis history
  async getAnalysesByUser(userId: string): Promise<Analysis[]> {
    return await db.select().from(analyses).where(eq(analyses.userId, userId));
  }

  // Method for getting analysis history by session ID (for anonymous users)
  async getAnalysesBySession(sessionId: string): Promise<Analysis[]> {
    return await db.select().from(analyses)
      .where(eq(analyses.sessionId, sessionId))
      .orderBy(analyses.createdAt);
  }

  // Chat conversation methods
  async createConversation(insertConversation: InsertConversation & { userId?: string; sessionId?: string }): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({
        title: insertConversation.title || null,
        userId: insertConversation.userId || null,
        sessionId: insertConversation.sessionId || null,
        aiPersona: insertConversation.aiPersona || 'consultant',
      })
      .returning();
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversationsBySession(sessionId: string): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(eq(conversations.sessionId, sessionId))
      .orderBy(desc(conversations.updatedAt));
  }

  async updateConversation(id: string, updates: Partial<Pick<Conversation, 'title' | 'updatedAt' | 'email' | 'reportRequested' | 'reportSent' | 'aiPersona' | 'userId'>>): Promise<void> {
    await db.update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  // Chat message methods
  async addMessageToConversation(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        conversationId: insertMessage.conversationId,
        role: insertMessage.role,
        content: insertMessage.content,
      })
      .returning();
    return message;
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  // Report methods
  async createReport(insertReport: InsertReport & { reportType?: string; shareToken?: string }): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values({
        conversationId: insertReport.conversationId,
        email: insertReport.email || null,
        fullReport: insertReport.fullReport as any,
        reportType: insertReport.reportType || 'legacy',
        shareToken: insertReport.shareToken || null,
        isPublic: 'false',
        shareCount: '0'
      })
      .returning();
    return report;
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportsByConversation(conversationId: string): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.conversationId, conversationId))
      .orderBy(desc(reports.createdAt));
  }

  async updateReport(id: string, updates: Partial<Pick<Report, 'sentAt' | 'viewedAt'>>): Promise<void> {
    await db.update(reports)
      .set(updates)
      .where(eq(reports.id, id));
  }

  async getReportsByUser(userId: string): Promise<Report[]> {
    return await db.select()
      .from(reports)
      .innerJoin(conversations, eq(reports.conversationId, conversations.id))
      .where(eq(conversations.userId, userId))
      .orderBy(desc(reports.createdAt))
      .then(results => results.map(r => r.reports));
  }

  async markReportViewed(id: string): Promise<void> {
    await db.update(reports)
      .set({ viewedAt: new Date() })
      .where(eq(reports.id, id));
  }

  async getReportByShareToken(shareToken: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.shareToken, shareToken));
    return report || undefined;
  }

  async incrementShareCount(id: string): Promise<void> {
    const report = await this.getReport(id);
    if (report) {
      const currentCount = parseInt(report.shareCount || '0');
      await db.update(reports)
        .set({ shareCount: (currentCount + 1).toString() })
        .where(eq(reports.id, id));
    }
  }

  // Payment-related report methods (integrated with Stripe blueprint - javascript_stripe)
  async createPendingReport(
    conversationId: string,
    stripePaymentIntentId: string,
    amount: string,
    currency: string
  ): Promise<string> {
    const [report] = await db
      .insert(reports)
      .values({
        conversationId,
        fullReport: {} as any, // Will be filled after payment succeeds
        reportType: 'angelic',
        paymentStatus: 'pending',
        stripePaymentIntentId,
        amount,
        currency,
        isPublic: 'false',
        shareCount: '0'
      })
      .returning();
    return report.id;
  }

  async getReportsByPaymentIntent(paymentIntentId: string): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.stripePaymentIntentId, paymentIntentId))
      .orderBy(desc(reports.createdAt));
  }

  async updateReportPaymentStatus(
    id: string,
    updates: { paymentStatus: string; paidAt: Date }
  ): Promise<void> {
    await db.update(reports)
      .set(updates)
      .where(eq(reports.id, id));
  }

  // Admin methods for statistics
  async getConversationsWithEmails(): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(sql`email IS NOT NULL AND email != ''`)
      .orderBy(desc(conversations.createdAt));
  }

  async getTotalReports(): Promise<Report[]> {
    return await db.select().from(reports)
      .orderBy(desc(reports.createdAt));
  }

  async getRecentEmailCollections(limit: number): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(sql`email IS NOT NULL AND email != ''`)
      .orderBy(desc(conversations.reportRequested))
      .limit(limit);
  }

  async getTotalConversations(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(conversations);
    return Number(result[0]?.count || 0);
  }

  async getAllReportsWithScores(): Promise<Report[]> {
    return await db.select().from(reports)
      .orderBy(desc(reports.createdAt));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users)
      .orderBy(desc(users.createdAt));
  }

  // Feedback methods
  async createFeedback(feedback: InsertFeedback & { userId?: string; sessionId?: string }): Promise<Feedback> {
    const [created] = await db.insert(feedbacks)
      .values({
        ...feedback,
        userId: feedback.userId || null,
        sessionId: feedback.sessionId || null,
        isRead: 'false'
      })
      .returning();
    return created;
  }

  async getAllFeedbacks(): Promise<Feedback[]> {
    return await db.select().from(feedbacks)
      .orderBy(desc(feedbacks.createdAt));
  }

  async getFeedback(id: string): Promise<Feedback | undefined> {
    const [feedback] = await db.select().from(feedbacks)
      .where(eq(feedbacks.id, id));
    return feedback || undefined;
  }

  async markFeedbackRead(id: string): Promise<void> {
    await db.update(feedbacks)
      .set({ isRead: 'true' })
      .where(eq(feedbacks.id, id));
  }

  async updateFeedbackNotes(id: string, notes: string): Promise<void> {
    await db.update(feedbacks)
      .set({ adminNotes: notes })
      .where(eq(feedbacks.id, id));
  }

  // ELO Ranking System methods
  async createIdea(idea: InsertIdea): Promise<Idea> {
    const [created] = await db.insert(ideas)
      .values(idea)
      .returning();
    return created;
  }

  async getIdea(id: string): Promise<Idea | undefined> {
    const [idea] = await db.select().from(ideas)
      .where(eq(ideas.id, id));
    return idea || undefined;
  }

  async createEval(evalData: InsertEval): Promise<Eval> {
    const [created] = await db.insert(evals)
      .values(evalData)
      .returning();
    return created;
  }

  async getEval(ideaId: string): Promise<Eval | undefined> {
    const [evalResult] = await db.select().from(evals)
      .where(eq(evals.ideaId, ideaId))
      .orderBy(desc(evals.updatedAt))
      .limit(1);
    return evalResult || undefined;
  }

  async createOrUpdateRating(ratingData: InsertRating): Promise<Rating> {
    // Check if rating exists
    const existing = await this.getRating(ratingData.ideaId);
    
    if (existing) {
      const [updated] = await db.update(ratings)
        .set({
          eloScore: ratingData.eloScore,
          matchCount: ratingData.matchCount,
          lastUpdated: new Date()
        })
        .where(eq(ratings.ideaId, ratingData.ideaId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(ratings)
        .values(ratingData)
        .returning();
      return created;
    }
  }

  async getRating(ideaId: string): Promise<Rating | undefined> {
    const [rating] = await db.select().from(ratings)
      .where(eq(ratings.ideaId, ideaId));
    return rating || undefined;
  }

  async getTopRatedIdeas(limit: number): Promise<Array<{ idea: Idea; rating: Rating; eval: Eval | null }>> {
    // Get top rated ideas with at least 3 matches
    const topRatings = await db.select()
      .from(ratings)
      .where(sql`CAST(${ratings.matchCount} AS INTEGER) >= 3`)
      .orderBy(desc(sql`CAST(${ratings.eloScore} AS REAL)`))
      .limit(limit);
    
    const results = await Promise.all(topRatings.map(async (rating) => {
      const idea = await this.getIdea(rating.ideaId);
      const evalResult = await this.getEval(rating.ideaId);
      return { idea: idea!, rating, eval: evalResult || null };
    }));
    
    return results.filter(r => r.idea !== undefined);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [created] = await db.insert(matches)
      .values(match)
      .returning();
    return created;
  }

  async getMatchesForIdea(ideaId: string): Promise<Match[]> {
    return await db.select().from(matches)
      .where(sql`${matches.ideaAId} = ${ideaId} OR ${matches.ideaBId} = ${ideaId}`)
      .orderBy(desc(matches.createdAt));
  }

  async getIdeasNearElo(
    targetElo: number, 
    category: string | null, 
    excludeIds: string[], 
    limit: number
  ): Promise<Array<{ idea: Idea; rating: Rating }>> {
    // Build conditions array
    const conditions = [];
    
    if (excludeIds.length > 0) {
      conditions.push(sql`${ideas.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`);
    }
    
    if (category) {
      conditions.push(eq(ideas.category, category));
    }
    
    // Apply combined conditions
    let query = db.select()
      .from(ratings)
      .innerJoin(ideas, eq(ratings.ideaId, ideas.id))
      .orderBy(sql`ABS(CAST(${ratings.eloScore} AS REAL) - ${targetElo})`);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query.limit(limit);
    
    return results.map(row => ({
      idea: row.ideas,
      rating: row.ratings
    }));
  }

  // Comprehensive Admin Dashboard Statistics
  async getAdminDashboardStats() {
    // 1. Conversation & Message Statistics
    const totalConversations = await this.getTotalConversations();
    const conversationsWithEmails = await db.select({ count: sql`count(*)` })
      .from(conversations)
      .where(sql`email IS NOT NULL AND email != ''`);
    const emailCount = Number(conversationsWithEmails[0]?.count || 0);

    const totalMessages = await db.select({ count: sql`count(*)` })
      .from(chatMessages);
    const userMessages = await db.select({ count: sql`count(*)` })
      .from(chatMessages)
      .where(eq(chatMessages.role, 'user'));
    const assistantMessages = await db.select({ count: sql`count(*)` })
      .from(chatMessages)
      .where(eq(chatMessages.role, 'assistant'));

    // 2. Report Statistics (All Angelic reports now)
    const totalReports = await db.select({ count: sql`count(*)` })
      .from(reports);
    const paidReports = await db.select({ count: sql`count(*)` })
      .from(reports)
      .where(eq(reports.paymentStatus, 'paid'));

    // 3. Payment Statistics
    const paidReportsData = await db.select()
      .from(reports)
      .where(eq(reports.paymentStatus, 'paid'));
    const totalRevenue = paidReportsData.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    // 4. ELO Ranking Statistics
    const totalIdeas = await db.select({ count: sql`count(*)` })
      .from(ideas);
    const totalEvals = await db.select({ count: sql`count(*)` })
      .from(evals);
    const totalMatches = await db.select({ count: sql`count(*)` })
      .from(matches);
    
    // Ideas eligible for ranking (Viability >= 60)
    const rankedIdeas = await db.select({ count: sql`count(*)` })
      .from(evals)
      .where(sql`CAST(${evals.viabilityScore} AS INTEGER) >= 60`);

    // 5. Report Quality Statistics (All reports are Angelic)
    const angelicReportsData = await db.select()
      .from(reports);

    let avgScore = 0;
    let excellentCount = 0;
    let viableCount = 0;
    let borderlineCount = 0;
    let notViableCount = 0;
    let breakthroughCount = 0;
    let structureBonusCount = 0;

    if (angelicReportsData.length > 0) {
      let totalScore = 0;
      let scoreCount = 0;

      angelicReportsData.forEach(report => {
        const fr: any = report.fullReport;
        if (fr?.executiveSummary?.overallScore) {
          totalScore += fr.executiveSummary.overallScore;
          scoreCount++;
        }
        
        const rating = fr?.executiveSummary?.rating;
        if (rating === 'Excellent') excellentCount++;
        else if (rating === 'Viable') viableCount++;
        else if (rating === 'Borderline') borderlineCount++;
        else if (rating === 'Not Viable') notViableCount++;

        if (fr?.executiveSummary?.breakthroughSignal) breakthroughCount++;
        if (fr?.executiveSummary?.structureBonus) structureBonusCount++;
      });

      avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    }

    // 6. User Statistics
    const totalUsers = await db.select({ count: sql`count(*)` })
      .from(users);
    const authenticatedConvs = await db.select({ count: sql`count(*)` })
      .from(conversations)
      .where(sql`user_id IS NOT NULL`);
    const anonymousConvs = await db.select({ count: sql`count(*)` })
      .from(conversations)
      .where(sql`user_id IS NULL`);

    // 7. Sharing & Feedback
    const publicReports = await db.select({ count: sql`count(*)` })
      .from(reports)
      .where(eq(reports.isPublic, 'true'));
    const totalFeedbacks = await db.select({ count: sql`count(*)` })
      .from(feedbacks);

    return {
      conversations: {
        total: totalConversations,
        withEmails: emailCount,
        authenticated: Number(authenticatedConvs[0]?.count || 0),
        anonymous: Number(anonymousConvs[0]?.count || 0),
        emailConversionRate: totalConversations > 0 
          ? Math.round((emailCount / totalConversations) * 100) 
          : 0
      },
      messages: {
        total: Number(totalMessages[0]?.count || 0),
        user: Number(userMessages[0]?.count || 0),
        assistant: Number(assistantMessages[0]?.count || 0)
      },
      reports: {
        total: Number(totalReports[0]?.count || 0),
        paid: Number(paidReports[0]?.count || 0),
        paymentSuccessRate: Number(totalReports[0]?.count || 0) > 0
          ? Math.round((Number(paidReports[0]?.count || 0) / Number(totalReports[0]?.count || 0)) * 100)
          : 0
      },
      payments: {
        totalRevenue: totalRevenue / 100, // Convert cents to dollars
        paidReportsCount: Number(paidReports[0]?.count || 0)
      },
      eloRanking: {
        totalIdeas: Number(totalIdeas[0]?.count || 0),
        totalEvaluations: Number(totalEvals[0]?.count || 0),
        totalMatches: Number(totalMatches[0]?.count || 0),
        rankedIdeas: Number(rankedIdeas[0]?.count || 0),
        rankingParticipationRate: Number(totalIdeas[0]?.count || 0) > 0
          ? Math.round((Number(rankedIdeas[0]?.count || 0) / Number(totalIdeas[0]?.count || 0)) * 100)
          : 0
      },
      reportQuality: {
        avgScore,
        ratingDistribution: {
          excellent: excellentCount,
          viable: viableCount,
          borderline: borderlineCount,
          notViable: notViableCount
        },
        breakthroughDetectionRate: angelicReportsData.length > 0
          ? Math.round((breakthroughCount / angelicReportsData.length) * 100)
          : 0,
        structureBonusRate: angelicReportsData.length > 0
          ? Math.round((structureBonusCount / angelicReportsData.length) * 100)
          : 0
      },
      users: {
        totalRegistered: Number(totalUsers[0]?.count || 0)
      },
      engagement: {
        publicReports: Number(publicReports[0]?.count || 0),
        feedbackSubmissions: Number(totalFeedbacks[0]?.count || 0)
      }
    };
  }

  // Password reset methods
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      );
    return resetToken || undefined;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async deleteExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < NOW()`);
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
