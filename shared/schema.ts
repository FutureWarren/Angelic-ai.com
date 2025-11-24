import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
// From Replit Auth blueprint integration
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (updated for Replit Auth)
// From Replit Auth blueprint integration
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For email/password authentication (bcrypt hash)
  authProvider: varchar("auth_provider").default("oidc"), // "oidc" or "email"
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false), // Admin role flag
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"), // For anonymous session tracking
  idea: text("idea").notNull(),
  result: json("result").$type<AnalysisResult>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New tables for chat functionality
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"), // For anonymous session tracking
  title: text("title"), // Optional conversation title
  email: text("email"), // User email for report delivery
  aiPersona: varchar("ai_persona").default("consultant"), // AI analysis mode: consultant (Angelic advisor) or customer (user perspective)
  reportRequested: timestamp("report_requested"), // When user requested full report
  reportSent: timestamp("report_sent"), // When report was sent via email
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  metadata: json("metadata"), // Store additional data like focusArea, needsMoreInfo etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New table for storing detailed reports
// Integrated with Stripe blueprint (javascript_stripe)
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  email: text("email"),
  fullReport: json("full_report").$type<AngelicReport>().notNull(), // Only Angelic reports
  reportType: varchar("report_type").default("angelic"), // Only "angelic" type supported
  shareToken: varchar("share_token").unique(), // 分享链接token (for public sharing)
  isPublic: varchar("is_public").default("false"), // 是否公开 ("true"/"false")
  shareCount: varchar("share_count").default("0"), // 分享查看次数
  paymentStatus: varchar("payment_status").default("pending"), // "pending" | "paid" | "failed" | "refunded"
  stripePaymentIntentId: varchar("stripe_payment_intent_id"), // Stripe payment intent ID
  amount: varchar("amount").default("0"), // Amount in cents (e.g., "2000" for $20.00)
  currency: varchar("currency").default("usd"), // Currency code
  paidAt: timestamp("paid_at"), // When payment was completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"), // Track when user viewed the report
});

// Feedback system for collecting user feedback
export const feedbacks = pgTable("feedbacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"), // For anonymous users
  email: text("email"), // Contact email (optional)
  feedbackType: varchar("feedback_type").notNull(), // "general" | "report" | "bug" | "feature"
  reportId: varchar("report_id").references(() => reports.id), // Optional: feedback on specific report
  conversationId: varchar("conversation_id").references(() => conversations.id), // Optional: feedback on conversation
  rating: varchar("rating"), // Optional: 1-5 stars or satisfaction level
  subject: text("subject"), // Feedback subject/title
  content: text("content").notNull(), // Main feedback content
  isRead: varchar("is_read").default("false"), // Admin has read this feedback
  adminNotes: text("admin_notes"), // Admin's private notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").notNull().unique(), // Reset token (hashed)
  expiresAt: timestamp("expires_at").notNull(), // Token expiration time (15 minutes from creation)
  used: boolean("used").default(false), // Whether token has been used
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ELO Ranking System Tables

// Ideas table - stores startup ideas for evaluation
export const ideas = pgTable("ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(), // The startup idea description
  category: varchar("category"), // e.g., "SaaS", "Hardware", "Marketplace"
  stage: varchar("stage"), // e.g., "Concept", "MVP", "Launched"
  userId: varchar("user_id").references(() => users.id), // Optional: link to user
  conversationId: varchar("conversation_id").references(() => conversations.id), // Optional: link to conversation
  isPublic: varchar("is_public").default("false"), // Whether user allows public display ("true"/"false")
  aiSummary: text("ai_summary"), // AI-generated anonymized summary for public display
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Evals table - stores evaluation results for ideas
export const evals = pgTable("evals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ideaId: varchar("idea_id").references(() => ideas.id).notNull(),
  viabilityScore: varchar("viability_score").notNull(), // 0-100
  excellenceScore: varchar("excellence_score").notNull(), // 0-100
  decision: varchar("decision").notNull(), // "Go" | "Conditional Go" | "Drop"
  uncertainty: varchar("uncertainty").notNull(), // "Low" | "Med" | "High"
  topRisks: json("top_risks").$type<string[]>().notNull(), // Array of risk strings
  keyEnablers: json("key_enablers").$type<string[]>().notNull(), // Array of enabler strings
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ratings table - stores ELO scores for ideas
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ideaId: varchar("idea_id").references(() => ideas.id).notNull().unique(),
  eloScore: varchar("elo_score").default("1500").notNull(), // Default ELO is 1500
  matchCount: varchar("match_count").default("0").notNull(), // Number of comparisons
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Matches table - stores head-to-head comparison results
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ideaAId: varchar("idea_a_id").references(() => ideas.id).notNull(),
  ideaBId: varchar("idea_b_id").references(() => ideas.id).notNull(),
  winner: varchar("winner").notNull(), // "A" | "B"
  reasons: json("reasons").$type<string[]>().notNull(), // Array of reason strings
  confidence: varchar("confidence").notNull(), // "Low" | "Med" | "High"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface AnalysisResult {
  summary: string; // 整体分析总结
  advantages: string[];
  challenges: string[];
  marketPotential: {
    score: number;
    description: string;
  };
  nextSteps: string[];
}

// Enhanced Angelic Report with quantitative framework (Investment-grade analysis)
export interface AngelicReport {
  // 报告元数据
  idea: string;
  conversationId: string;
  generatedAt: string;
  
  // 1. 核心摘要 (Executive Summary) - 量化评级
  executiveSummary: {
    rating: 'Excellent' | 'Viable' | 'Borderline' | 'Not Viable'; // 结论标签
    overallScore: number; // 加权总分 (0-100)
    structureBonus: boolean; // 结构性差异上浮系数是否生效（Innovation≥75且Market≥70时）
    
    // 新的突破潜力字段（优先使用）
    breakthroughBonus?: number; // 突破潜力加分值 (0-15)
    breakthroughReasons?: string[]; // 突破潜力触发原因（新版）
    
    // 旧的突破潜力字段（向后兼容）
    breakthroughSignal?: boolean; // 是否检测到突破潜力信号（旧版）
    breakthroughPotential?: number; // 突破潜力值 (0-1)（旧版）
    bpReasons?: string[]; // 突破潜力触发原因（旧版）
    
    autoFail: {
      triggered: boolean; // 是否触发自动不及格
      reasons: string[]; // 不及格原因
      reversalConditions?: string[]; // 可逆转条件（最多2条）
    };
    keyHighlights: string[]; // 2个核心亮点
    criticalConcerns: string[]; // 2个关键顾虑
    overallConclusion: string; // 总结性结论（2-3句）
  };
  
  // 2. 评分框架 (Scoring Framework) - 客观化量化评分
  scoringFramework: {
    dimensions: {
      innovation: {
        weight: 25; // 权重25%
        score: number; // 0-100
        subIndicators: Array<{
          indicator: string; // 指标名称
          score: number; // 得分
          rationale: string; // 理由（≤30字）
        }>;
        explanation: string; // 总体说明
      };
      feasibility: {
        weight: 25;
        score: number;
        trlLevel: number; // 技术成熟度1-9
        trlScore: number; // 映射到40-95分
        blockingFactors: string[]; // 阻断因子
        topVerificationPaths: Array<{
          path: string; // 验证路径
          effort: string; // 工作量（如"x小时标注y条样本"）
          expectedOutcome: string; // 预期结果
        }>;
        explanation: string;
      };
      marketPotential: {
        weight: 25;
        score: number;
        marketSize: string; // 市场规模（如"$500M-$1B globally"）
        cagr: string; // 复合年增长率（如"15-20% (2023-2028)"）
        tam: { value: string; assumptions: string[] }; // TAM with key assumptions
        sam: { value: string; assumptions: string[] }; 
        som: { value: string; assumptions: string[] };
        growthRate: string; // 历史/预测增速
        willingnessToPayEvidence: string; // 付费意愿证据
        missingDataPoints: string[]; // 需要用户补齐的数据点（最多3个）
        dataSources?: Array<{ // 数据来源（可选）
          label: string; // 来源标签（如"Gartner 2024"）
          url: string; // 链接URL
        }>;
        explanation: string;
      };
      competitiveLandscape: {
        weight: 15;
        score: number;
        competitors: Array<{ // 主要竞争对手列表（3-5个）
          name: string; // 竞争对手名称
          description: string; // 简短描述（≤30字）
          website?: string; // 官网链接（可选）
          strengths: string[]; // 优势（1-2个）
          weaknesses: string[]; // 劣势（1-2个）
        }>;
        metrics: {
          competitorCount: number; // N: 竞争者数
          recentFunding: number; // F: 近12月融资事件数
          concentrationRatio: number; // CR5: 前5名市场集中度(%)
        };
        explanation: string;
      };
      commercialSustainability: {
        weight: 10;
        score: number;
        unitEconomics: {
          status: 'positive' | 'negative' | 'unclear';
          grossMargin: string; // 毛利率估算
          paybackPeriod: string; // 回本周期
          improvementPath?: string; // 改善路径（如果为负）
        };
        regulatoryClarity: 'high' | 'medium' | 'low';
        explanation: string;
      };
    };
    weightedTotal: number; // 加权总分
  };
  
  // 3. 技术与市场细化 (Technical & Market Details) - 表格化
  technicalMarketDetails: {
    technical: {
      trl: {
        level: number; // 1-9
        mappedScore: number; // 映射到40-95分区间
        description: string; // TRL阶段描述
      };
      blockingFactors: string[]; // 数据可得、标注成本、实时性、推理成本等
      verificationPaths: Array<{
        path: string; // 验证路径
        costEfficiency: string; // 性价比描述
      }>;
    };
    market: {
      targetUsers: {
        primary: string; // 主人群（≤20字）
        secondary: string; // 副人群（≤20字）
        channels: string; // 可触达渠道（≤20字）
      };
      tamSamSom: {
        tam: { range: string; keyAssumptions: string[] };
        sam: { range: string; keyAssumptions: string[] };
        som: { range: string; keyAssumptions: string[] };
      };
      paymentWillingness: {
        historicalARPU: string; // 历史同类ARPU区间
        competitorPricing: string; // 竞品定价锚
      };
      evidenceSources: {
        provided: string[]; // 已有证据
        needed: string[]; // 待补充数据点（最多3个）
      };
    };
  };
  
  // 4. 红/蓝海与竞争强度 (Competition Analysis) - 公式化
  competitionAnalysis: {
    saturationIndex: {
      value: number; // S_total = 0.7*S_macro + 0.3*(1 - S_niche) - 双层模型
      macroSaturation: number; // S_macro = 0.5·norm(N) + 0.3·norm(F) + 0.2·norm(CR5) - 宏观行业饱和度
      nicheSaturationIndex: number; // S_niche (0-1) - 细分技术领域饱和度（越低越蓝海）
      classification: 'red_ocean' | 'blue_ocean' | 'neutral'; // S_total≥0.7红海, S_total≤0.3蓝海
      components: {
        normalizedN: number; // 归一化竞争者数
        normalizedF: number; // 归一化融资事件数
        normalizedCR5: number; // 归一化CR5
      };
    };
    differentiation: {
      keywordCoverage: number; // 与Top5竞品差集/并集 (%)
      substituteBarriers: {
        exclusiveData: boolean; // 独占数据
        switchingCost: boolean; // 迁移惯性
        compliance: boolean; // 合规壁垒
      };
      score: number; // 差异化得分
    };
    dataSources?: Array<{ // 竞争数据来源（可选）
      label: string; // 来源标签（如"Crunchbase 2024"）
      url: string; // 链接URL
    }>;
    summary: string; // 竞争格局总结
  };
  
  // 5. 风险与里程碑 (Risks & Milestones) - 可执行、可验收
  risksAndMilestones: {
    mergedRisks: string[]; // 风险依赖链分析：合并的技术体验-用户教育复合风险
    topRisks: Array<{
      risk: string; // 风险描述
      priority: 1 | 2 | 3; // Top3优先级
      mitigationAction: string; // 可验证缓解动作
      acceptanceCriteria: {
        metric: string; // 验收指标
        target: string; // 目标值（时间/数值）
      };
    }>;
    milestonePath: Array<{
      phase: string; // 如"T+30天"、"T+90天"、"T+180天"
      objective: string; // 目标
      kpis: Array<{
        metric: string; // 指标名
        target: string; // 目标值（如"≥Y"）
      }>;
    }>;
  };
  
  // 6. 结论与下一步 (Conclusion & Next Steps) - 含通过/不通过门槛
  conclusion: {
    decision: 'Go' | 'Go with Conditions' | 'Hold'; // 三档决策
    decisionRationale: string; // 决策理由
    weakestLink: {
      area: string; // 最薄弱短板
      recommendedAction: string; // 对应动作
    };
    conditionalRequirements?: string[]; // 如果是"Go with Conditions"的前提条件
    nextSteps: string[]; // 下一步具体行动（2-3条）
    brandTagline: string; // "Angelic | 让每个想法都被认真对待。"
  };
  
  // 7. 搜索来源 (Search Sources) - Web搜索结果可视化
  searchSources?: Array<{
    title: string; // 来源标题
    url: string; // 链接URL
    snippet: string; // 摘要
    category: string; // 分类：socialMedia | competitors | industry | userReviews
  }>;
}

// Legacy interface (keep for backwards compatibility with existing reports)
export interface DetailedReport {
  idea: string;
  conversationSummary: string;
  
  marketAnalysis: {
    targetMarket: string;
    marketSize: string;
    marketGrowthRate: string;
    demandAnalysis: string;
    industryTrends: string[];
    userPersona: {
      demographics: string;
      painPoints: string[];
      behaviors: string;
    };
    score: number;
  };
  
  competitiveAnalysis: {
    competitors: Array<{
      name: string;
      strengths: string[];
      weaknesses: string[];
      marketShare: string;
      pricing: string;
    }>;
    competitiveLandscape: string;
    differentiation: string;
    competitiveAdvantage: string;
    barrierToEntry: string;
    threats: string[];
    score: number;
  };
  
  businessModel: {
    revenueStreams: Array<{
      source: string;
      description: string;
      potential: string;
    }>;
    monetizationStrategy: string;
    pricingModel: string;
    unitEconomics: string;
    profitabilityAnalysis: string;
    financialProjection: {
      year1: string;
      year2: string;
      year3: string;
    };
    score: number;
  };
  
  executionPlan: {
    phases: Array<{
      phase: string;
      duration: string;
      objectives: string[];
      keyActivities: string[];
      successMetrics: string[];
    }>;
    resourceRequirements: Array<{
      category: string;
      items: string[];
      estimatedCost: string;
    }>;
    teamRequirements: Array<{
      role: string;
      responsibilities: string;
      timeline: string;
    }>;
    fundingNeeds: string;
    fundingAllocation: Array<{
      category: string;
      percentage: string;
      amount: string;
    }>;
  };
  
  riskAssessment: {
    riskMatrix: Array<{
      risk: string;
      impact: 'high' | 'medium' | 'low';
      probability: 'high' | 'medium' | 'low';
      mitigation: string;
      contingency: string;
    }>;
    majorRisks: string[];
    mitigationStrategies: string[];
  };
  
  overallScore: number;
  recommendation: string;
  strengths: string[];
  improvements: string[];
  nextSteps: Array<{
    action: string;
    priority: 'immediate' | 'short-term' | 'long-term';
    timeline: string;
  }>;
  
  vcInsights: {
    fundingReadiness: string;
    fundingStage: string;
    attractivenessToVCs: string;
    investmentHighlights: string[];
    redFlags: string[];
    suggestedVCs: Array<{
      name: string;
      focus: string;
      typicalCheck: string;
      reason: string;
    }>;
    pitchKeyPoints: string[];
  };
}

// Upsert user schema for Replit Auth
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  idea: true,
}).extend({
  sessionId: z.string().optional(),
});

// Chat-related schemas
export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  email: true,
  aiPersona: true,
}).extend({
  sessionId: z.string().optional(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  conversationId: true,
  role: true,
  content: true,
  metadata: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  conversationId: true,
  email: true,
  fullReport: true,
});

// Email collection schema
export const emailCollectionSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  sessionId: z.string(),
  conversationId: z.string().optional(),
});

// Email/Password authentication schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Feedback schema
export const insertFeedbackSchema = createInsertSchema(feedbacks).pick({
  email: true,
  feedbackType: true,
  reportId: true,
  conversationId: true,
  rating: true,
  subject: true,
  content: true,
}).extend({
  sessionId: z.string().optional(),
  email: z.string().email().optional(),
  feedbackType: z.enum(["general", "report", "bug", "feature"]),
  rating: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().min(1, "Feedback content is required"),
});

// ELO Ranking System Schemas
export const insertIdeaSchema = createInsertSchema(ideas).pick({
  text: true,
  category: true,
  stage: true,
  userId: true,
  conversationId: true,
  isPublic: true,
  aiSummary: true,
});

export const insertEvalSchema = createInsertSchema(evals).pick({
  ideaId: true,
  viabilityScore: true,
  excellenceScore: true,
  decision: true,
  uncertainty: true,
  topRisks: true,
  keyEnablers: true,
});

export const insertRatingSchema = createInsertSchema(ratings).pick({
  ideaId: true,
  eloScore: true,
  matchCount: true,
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  ideaAId: true,
  ideaBId: true,
  winner: true,
  reasons: true,
  confidence: true,
});

// API request/response schemas for ELO endpoints
export const evaluateRequestSchema = z.object({
  idea_id: z.string().optional(),
  text: z.string().min(10, "Idea description must be at least 10 characters"),
  category: z.string().optional(),
  stage: z.string().optional(),
});

export const compareRequestSchema = z.object({
  ideaA_id: z.string(),
  ideaB_id: z.string(),
});

export const topListRequestSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacks.$inferSelect;
export type EmailCollection = z.infer<typeof emailCollectionSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ELO Ranking Types
export type Idea = typeof ideas.$inferSelect;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Eval = typeof evals.$inferSelect;
export type InsertEval = z.infer<typeof insertEvalSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>;
export type CompareRequest = z.infer<typeof compareRequestSchema>;
export type TopListRequest = z.infer<typeof topListRequestSchema>;

// Password Reset Types
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = Omit<PasswordResetToken, 'id' | 'createdAt'>;
