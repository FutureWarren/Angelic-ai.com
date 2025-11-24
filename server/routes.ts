import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisSchema, insertConversationSchema, insertChatMessageSchema, emailCollectionSchema, registerSchema, loginSchema, type ChatMessage, insertIdeaSchema, insertEvalSchema, insertRatingSchema } from "@shared/schema";
import { analyzeStartupIdea, chatWithAI } from "./services/openai";
import { generateAngelicReport } from "./services/angelic-report-generator";
import { getMarketInsightsProvider } from "./services/market-insights";
import { sendEmail } from "./services/email";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { evaluateIdea } from "./services/idea-evaluator";
import { compareIdeas, calculateNewElo } from "./services/idea-comparer";
import { calculateBadge, getPercentileRank } from "./services/badge-calculator";
import { autoScheduleMatches } from "./services/auto-matcher";
import { z } from "zod";
import bcrypt from "bcrypt";
import passport from "passport";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";

// Initialize Stripe (from Stripe blueprint integration - javascript_stripe)
// Check if Stripe keys are available (keys might not be set initially)
const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
const stripe = stripeEnabled ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
}) : null;

// Rate limiting configuration to prevent API abuse
// Chat API: 20 requests per 15 minutes per IP
const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 chat requests per windowMs
  message: { message: "请求过于频繁，请稍后再试。Too many requests, please try again later." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: any) => {
    // Authenticated users get higher limits (can extend this later)
    return false; // Currently apply to all users
  }
});

// Report generation: 3 reports per hour per IP (expensive operation)
const reportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 report generations per hour
  message: { message: "报告生成次数已达上限，请一小时后再试。Report generation limit reached, please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to get user ID from either OIDC or email auth
function getUserId(req: any): string | undefined {
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  if (req.user?.id) {
    return req.user.id;
  }
  return undefined;
}

// Helper function to get user email from either OIDC or email auth
function getUserEmail(req: any): string | undefined {
  if (req.user?.claims?.email) {
    return req.user.claims.email;
  }
  if (req.user?.email) {
    return req.user.email;
  }
  return undefined;
}

// Helper function to check if user is authenticated
function isUserAuthenticated(req: any): boolean {
  return !!getUserId(req);
}

// Middleware to check if user is admin
const requireAdmin: any = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "需要登录 / Unauthorized" });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "需要登录 / Unauthorized" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "需要管理员权限 / Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ message: "服务器错误 / Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (from blueprint integration)
  await setupAuth(app);

  // Auth endpoint to get current user (supports both OIDC and email auth)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const user = await storage.createEmailUser(
        validatedData.email,
        hashedPassword,
        validatedData.firstName,
        validatedData.lastName
      );

      // Log user in by creating session with authType flag
      req.login({ id: user.id, email: user.email, authType: 'email' }, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        
        // Return user data (without password)
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email/Password Logout
  app.get('/api/auth/logout-email', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  // Email/Password Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Log user in by creating session with authType flag
      req.login({ id: user.id, email: user.email, authType: 'email' }, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Return user data (without password)
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Request password reset
  app.post('/api/auth/request-reset', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration attacks
      // But only send email if user exists with email auth provider
      if (user && user.authProvider === 'email') {
        // Generate secure random token
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);
        
        // Calculate expiration time (15 minutes from now)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        // Save token to database
        await storage.createPasswordResetToken({
          userId: user.id,
          token: hashedToken,
          expiresAt,
          used: false
        });
        
        // Send reset email
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        const { sendPasswordResetEmail } = await import('./services/email');
        
        try {
          await sendPasswordResetEmail(email, resetLink, 'zh');
          console.log(`Password reset email sent to ${email}`);
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
          // Don't fail the request if email sending fails
        }
      } else if (user && user.authProvider !== 'email') {
        // User exists but uses OIDC auth, silently ignore
        console.log(`Password reset requested for OIDC user ${email}, ignoring`);
      }
      
      // Always return success message
      res.json({ message: "If an account exists with this email, a password reset link has been sent" });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Verify reset token
  app.post('/api/auth/verify-reset-token', async (req, res) => {
    try {
      const { token, email } = req.body;
      
      if (!token || !email) {
        return res.status(400).json({ message: "Token and email are required" });
      }

      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user || user.authProvider !== 'email') {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Get all tokens for user (to check against all stored hashed tokens)
      const tokens = await storage.getPasswordResetToken(token);
      
      if (!tokens) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token belongs to this user
      if (tokens.userId !== user.id) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Check if token is expired
      if (new Date() > tokens.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Check if token is already used
      if (tokens.used) {
        return res.status(400).json({ message: "Reset token has already been used" });
      }

      res.json({ message: "Token is valid" });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ message: "Failed to verify reset token" });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, email, newPassword } = req.body;
      
      if (!token || !email || !newPassword) {
        return res.status(400).json({ message: "Token, email, and new password are required" });
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user || user.authProvider !== 'email') {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Find valid token
      const validTokens = await storage.getPasswordResetToken(token);
      
      if (!validTokens) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token belongs to this user
      if (validTokens.userId !== user.id) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Check if token is expired
      if (new Date() > validTokens.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Check if token is already used
      if (validTokens.used) {
        return res.status(400).json({ message: "Reset token has already been used" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Mark token as used
      await storage.markTokenAsUsed(validTokens.token);
      
      // Clean up expired tokens
      await storage.deleteExpiredTokens();
      
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });


  // Startup idea analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertAnalysisSchema.parse(req.body);
      
      if (!validatedData.idea || validatedData.idea.trim().length === 0) {
        return res.status(400).json({ message: "请输入您的创业想法" });
      }

      if (validatedData.idea.length > 1000) {
        return res.status(400).json({ message: "输入内容不能超过1000字符" });
      }

      // Call OpenAI for analysis
      const analysisResult = await analyzeStartupIdea(validatedData.idea);

      // Store the analysis with session ID for anonymous tracking
      const analysis = await storage.createAnalysis({
        idea: validatedData.idea,
        result: analysisResult,
        sessionId: validatedData.sessionId,
      });

      res.json({
        id: analysis.id,
        result: analysisResult,
      });

    } catch (error) {
      console.error("Analysis error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "输入数据格式不正确",
          errors: error.errors 
        });
      }

      // Handle AI service unavailable errors specifically
      if (error instanceof Error && error.message === "AI分析服务暂时不可用，请稍后重试") {
        return res.status(503).json({ 
          message: "AI分析服务暂时不可用，请稍后重试" 
        });
      }

      res.status(500).json({ 
        message: error instanceof Error ? error.message : "分析过程中发生错误，请稍后重试" 
      });
    }
  });

  // Get analysis by ID
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ message: "分析结果未找到" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "获取分析结果失败" });
    }
  });


  // Chat endpoint
  app.post("/api/chat", chatRateLimiter, async (req: any, res) => {
    try {
      // Define and validate request schema
      const chatRequestSchema = z.object({
        message: z.string().trim().min(1, "请输入消息内容").max(1000, "消息不能超过1000字符"),
        sessionId: z.string().optional(),
        conversationId: z.string().optional(),
        uiLanguage: z.enum(['zh', 'en']).optional().default('zh'),
        aiPersona: z.enum(['consultant', 'customer']).optional().default('consultant')
      });

      const validatedData = chatRequestSchema.parse(req.body);
      const { message, sessionId, conversationId, uiLanguage, aiPersona } = validatedData;

      // Get or create conversation
      let conversation;
      let conversationMessages: ChatMessage[] = [];

      // Check if user is authenticated
      const isAuthenticated = isUserAuthenticated(req);
      const userId = isAuthenticated ? getUserId(req) : undefined;

      if (conversationId) {
        // Use specific conversation - verify ownership first
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "对话不存在" });
        }
        
        // Authorization: verify the conversation belongs to the current user or session
        if (isAuthenticated) {
          // Authenticated user: check if conversation belongs to them (by userId OR sessionId)
          const belongsToUser = conversation.userId === userId;
          const belongsToSession = sessionId && conversation.sessionId === sessionId;
          
          if (!belongsToUser && !belongsToSession) {
            return res.status(403).json({ message: "无权访问此对话" });
          }
        } else if (sessionId) {
          // Anonymous user: check if conversation belongs to their session
          if (conversation.sessionId !== sessionId) {
            return res.status(403).json({ message: "无权访问此对话" });
          }
        } else {
          // No authentication or session
          return res.status(401).json({ message: "需要登录或提供会话ID" });
        }
        
        conversationMessages = await storage.getConversationMessages(conversationId);
      } else {
        // Create new conversation
        if (isAuthenticated) {
          // Create conversation for authenticated user
          conversation = await storage.createConversation({
            userId: userId!,
            title: message.slice(0, 50),
            aiPersona: aiPersona
          });
        } else if (sessionId) {
          // Get latest conversation for session or create new one
          const existingConversations = await storage.getConversationsBySession(sessionId);
          if (existingConversations.length > 0) {
            conversation = existingConversations[0];
            conversationMessages = await storage.getConversationMessages(conversation.id);
          } else {
            // Create new conversation for anonymous user
            conversation = await storage.createConversation({
              sessionId: sessionId,
              title: message.slice(0, 50),
              aiPersona: aiPersona
            });
          }
        } else {
          // No authentication or session
          return res.status(401).json({ message: "需要登录或提供会话ID" });
        }
      }

      // Build authoritative conversation history from database
      const conversationHistory = conversationMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Use conversation's AI persona (allow override from request for switching personas)
      const effectivePersona = aiPersona || conversation.aiPersona || 'consultant';
      
      // If persona changed, update the conversation
      if (effectivePersona !== conversation.aiPersona) {
        await storage.updateConversation(conversation.id, {
          aiPersona: effectivePersona
        });
      }

      // Call OpenAI chat service with authoritative history and persona
      const chatResponse = await chatWithAI({
        message: message,
        conversationHistory: conversationHistory,
        uiLanguage: uiLanguage,
        aiPersona: effectivePersona
      });

      // Store user message
      await storage.addMessageToConversation({
        conversationId: conversation.id,
        role: 'user',
        content: message
      });

      // Store AI response
      await storage.addMessageToConversation({
        conversationId: conversation.id,
        role: 'assistant',
        content: chatResponse.response
      });

      // Update conversation timestamp
      await storage.updateConversation(conversation.id, {
        updatedAt: new Date()
      });

      // Get updated conversation messages for response
      const updatedMessages = await storage.getConversationMessages(conversation.id);
      
      res.json({
        response: chatResponse.response,
        conversationId: conversation.id,
        messages: updatedMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt
        })),
        analysisData: chatResponse.analysisData || null
      });

    } catch (error) {
      console.error("Chat error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "输入数据格式不正确",
          errors: error.errors 
        });
      }

      if (error instanceof Error && error.message === "AI对话服务暂时不可用，请稍后重试") {
        return res.status(503).json({ 
          message: "AI对话服务暂时不可用，请稍后重试" 
        });
      }

      res.status(500).json({ 
        message: error instanceof Error ? error.message : "对话过程中发生错误，请稍后重试" 
      });
    }
  });

  // Request detailed report endpoint
  app.post("/api/request-report", async (req, res) => {
    try {
      // Validate request
      const validatedData = emailCollectionSchema.parse(req.body);
      const { email, sessionId, conversationId } = validatedData;

      console.log('📧 Report request received for email:', email);

      // Get conversation and messages
      let conversation;
      let conversationMessages: ChatMessage[] = [];

      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "对话不存在" });
        }
        conversationMessages = await storage.getConversationMessages(conversationId);
      } else if (sessionId) {
        // Get latest conversation for session
        const existingConversations = await storage.getConversationsBySession(sessionId);
        if (existingConversations.length === 0) {
          return res.status(400).json({ message: "没有找到对话记录" });
        }
        conversation = existingConversations[0];
        conversationMessages = await storage.getConversationMessages(conversation.id);
      } else {
        return res.status(400).json({ message: "需要提供sessionId或conversationId" });
      }

      if (conversationMessages.length === 0) {
        return res.status(400).json({ message: "对话记录为空，无法生成报告" });
      }

      // Update conversation with email
      await storage.updateConversation(conversation.id, {
        email: email,
        reportRequested: new Date()
      });

      // Extract the startup idea from first user message
      const firstUserMessage = conversationMessages.find(msg => msg.role === 'user');
      if (!firstUserMessage) {
        return res.status(400).json({ message: "没有找到创业想法" });
      }

      // Prepare conversation data for report generation
      const conversationData = {
        idea: firstUserMessage.content,
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt)
        }))
      };

      // Start report generation asynchronously
      generateAndSendReport(conversation.id, email, conversationData).catch(error => {
        console.error('❌ Background report generation failed:', error);
        
        // Log specific MailerSend trial limitations for admin visibility
        if (error instanceof Error && error.message.includes('MAILERSEND_TRIAL_LIMITATION')) {
          console.error('⚠️ MailerSend trial account limitation detected');
          console.error('📧 User email that failed:', email);
          console.error('💡 Action needed: Upgrade MailerSend account or ensure email matches admin email');
        }
      });

      res.json({ 
        message: "报告申请成功，我们正在生成详细报告，完成后将发送到您的邮箱",
        conversationId: conversation.id
      });

    } catch (error) {
      console.error("Request report error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "输入数据格式不正确",
          errors: error.errors 
        });
      }

      res.status(500).json({ 
        message: error instanceof Error ? error.message : "申请报告失败，请稍后重试" 
      });
    }
  });

  // Generate Angelic report (for web display, no email)
  app.post("/api/generate-angelic-report", reportRateLimiter, async (req: any, res) => {
    try {
      const conversationId = req.body.conversationId as string | undefined;
      const sessionId = req.body.sessionId as string | undefined;

      if (!conversationId && !sessionId) {
        return res.status(400).json({ message: "需要提供conversationId或sessionId" });
      }

      console.log('📊 Angelic report generation request received');

      // Get conversation and messages
      let conversation;
      let conversationMessages: ChatMessage[] = [];

      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "对话不存在" });
        }
        conversationMessages = await storage.getConversationMessages(conversationId);
      } else if (sessionId) {
        const existingConversations = await storage.getConversationsBySession(sessionId);
        if (existingConversations.length === 0) {
          return res.status(400).json({ message: "没有找到对话记录" });
        }
        conversation = existingConversations[0];
        conversationMessages = await storage.getConversationMessages(conversation.id);
      }

      if (!conversation) {
        return res.status(404).json({ message: "对话不存在" });
      }

      if (conversationMessages.length === 0) {
        return res.status(400).json({ message: "对话记录为空，无法生成报告" });
      }

      // Extract the startup idea from first user message
      const firstUserMessage = conversationMessages.find(msg => msg.role === 'user');
      if (!firstUserMessage) {
        return res.status(400).json({ message: "没有找到创业想法" });
      }

      // Prepare conversation data for report generation
      const conversationData = {
        idea: firstUserMessage.content,
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt)
        }))
      };

      console.log('🚀 Generating Angelic report...');
      
      // Detect language from conversation
      const detectLanguage = (messages: Array<{role: string; content: string}>): 'zh' | 'en' => {
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
        const chineseCharCount = (userMessages.match(/[\u4e00-\u9fa5]/g) || []).length;
        const totalChars = userMessages.length;
        return (chineseCharCount / totalChars > 0.2) ? 'zh' : 'en';
      };
      
      const detectedLanguage = detectLanguage(conversationData.messages);
      
      // Gather market insights using configured provider
      // Provider types: 'noop' (default, no search) or 'serper' (requires SERPER_API_KEY)
      // Enable/disable via MARKET_INSIGHTS_ENABLED env var
      const provider = getMarketInsightsProvider();
      let marketInsights;
      
      try {
        // Try to get market insights with generous timeout (4 searches × 8s + AI summarization)
        const insightsPromise = provider.getInsights(conversationData.idea, detectedLanguage);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Market insights timeout')), 40000) // 40 seconds
        );
        
        marketInsights = await Promise.race([insightsPromise, timeoutPromise]);
        console.log('✅ Market insights gathered successfully');
      } catch (error) {
        console.warn('⚠️  Market insights failed, continuing without:', error instanceof Error ? error.message : error);
        marketInsights = undefined;
      }
      
      // Generate the Angelic report with optional market insights
      const { report, language } = await generateAngelicReport(
        conversationData, 
        conversation.id,
        marketInsights
      );
      
      // Generate share token using crypto (URL-safe random string)
      const crypto = await import('crypto');
      const shareToken = crypto.randomBytes(16).toString('base64url');
      
      // Store report in database with share token
      const savedReport = await storage.createReport({
        conversationId: conversation.id,
        email: conversation.email || undefined,
        fullReport: report as any,
        reportType: 'angelic',
        shareToken: shareToken
      });

      console.log('✅ Angelic report generated and saved:', savedReport.id);

      // Send email notification with link to view report
      if (conversation.email || getUserEmail(req)) {
        const userEmail = conversation.email || getUserEmail(req);
        const domain = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : req.hostname;
        const reportUrl = `https://${domain}/reports/${savedReport.id}`;
        
        try {
          // Import sendReportNotification function
          const { sendReportNotification } = await import('./services/email.js');
          
          // Send professional email notification
          await sendReportNotification(userEmail!, savedReport.id, reportUrl, language);
          console.log('📧 Email notification sent to:', userEmail);
        } catch (emailError) {
          console.error('📧 Failed to send email notification:', emailError);
          // Don't fail the request if email fails
        }
      }

      res.json({ 
        message: language === 'zh' ? "报告生成成功" : "Report generated successfully",
        reportId: savedReport.id,
        report: report,
        language
      });

    } catch (error) {
      console.error("Generate Angelic report error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "生成报告失败，请稍后重试" 
      });
    }
  });

  // Get user's conversations (protected route)
  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const conversations = await storage.getConversationsByUser(userId);
      
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "获取对话列表失败" });
    }
  });

  // Get conversation messages by ID (requires authentication or session ownership)
  app.get("/api/conversations/:id/messages", async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "对话不存在" });
      }
      
      // Authorization: verify the conversation belongs to the current user or session
      const isAuthenticated = isUserAuthenticated(req);
      const sessionId = req.query.sessionId as string | undefined;
      
      if (isAuthenticated) {
        // Authenticated user: check if conversation belongs to them (by userId OR sessionId)
        const userId = getUserId(req);
        const belongsToUser = conversation.userId === userId;
        const belongsToSession = sessionId && conversation.sessionId === sessionId;
        
        if (!belongsToUser && !belongsToSession) {
          return res.status(403).json({ message: "无权访问此对话" });
        }
      } else if (sessionId) {
        // Anonymous user: check if conversation belongs to their session
        if (conversation.sessionId !== sessionId) {
          return res.status(403).json({ message: "无权访问此对话" });
        }
      } else {
        // No authentication or session
        return res.status(401).json({ message: "需要登录或提供会话ID" });
      }
      
      const messages = await storage.getConversationMessages(conversationId);
      
      res.json({
        conversation,
        messages
      });
    } catch (error) {
      console.error("Get conversation messages error:", error);
      res.status(500).json({ message: "获取对话消息失败" });
    }
  });

  // Associate anonymous conversation with logged-in user
  app.post("/api/conversations/associate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const { conversationId, sessionId } = req.body;
      
      if (!conversationId || !sessionId) {
        return res.status(400).json({ message: "缺少必要参数" });
      }
      
      // Get the conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "对话不存在" });
      }
      
      // Verify the conversation belongs to the session
      if (conversation.sessionId !== sessionId) {
        return res.status(403).json({ message: "无权关联此对话" });
      }
      
      // Update conversation to associate with user
      await storage.updateConversation(conversationId, { userId });
      
      res.json({ success: true, message: "对话已关联到您的账户" });
    } catch (error) {
      console.error("Associate conversation error:", error);
      res.status(500).json({ message: "关联对话失败" });
    }
  });

  // Get user's reports (protected route)
  app.get("/api/my-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const reports = await storage.getReportsByUser(userId);
      
      res.json(reports);
    } catch (error) {
      console.error("Get user reports error:", error);
      res.status(500).json({ message: "获取报告列表失败" });
    }
  });

  // Get single report by ID and mark as viewed
  // Supports both authenticated access (user owns report) and public access (via share token)
  app.get("/api/reports/:reportId", async (req: any, res) => {
    try {
      const reportId = req.params.reportId;
      const shareToken = req.query.token as string | undefined; // Share token for public access
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "报告不存在" });
      }

      // Get the conversation to check ownership
      const conversation = await storage.getConversation(report.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "关联对话不存在" });
      }

      // Authorization: support multiple access methods
      const isAuth = isUserAuthenticated(req);
      const isAdminView = req.query.admin === 'true'; // Admin access flag
      let accessGranted = false;
      
      // Method 1: Public access via share token
      if (shareToken && report.shareToken === shareToken) {
        accessGranted = true;
      }
      // Method 2: Authenticated user owns the report
      else if (isAuth) {
        const userId = getUserId(req);
        if (conversation.userId === userId || isAdminView) {
          accessGranted = true;
        }
      }

      if (!accessGranted) {
        return res.status(403).json({ message: "无权访问此报告 / Access denied" });
      }

      // Mark report as viewed if not already
      if (!report.viewedAt) {
        await storage.markReportViewed(reportId);
      }

      // Increment share count if accessed via share token
      if (shareToken && report.shareToken === shareToken) {
        await storage.incrementShareCount(reportId);
      }

      // Detect language from report content
      const fullReport: any = report.fullReport;
      const language = fullReport?.executiveSummary?.overview?.includes('中文') || 
                      fullReport?.idea?.match(/[\u4e00-\u9fa5]/) ? 'zh' : 'en';

      res.json({
        report: report.fullReport,
        language,
        shareToken: report.shareToken, // Include shareToken for building share links
        reportId: report.id
      });
    } catch (error) {
      console.error("Get report error:", error);
      res.status(500).json({ message: "获取报告失败" });
    }
  });

  // Admin stats endpoint for comprehensive dashboard statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "获取统计信息失败" });
    }
  });

  // Admin endpoint for viewing report scores
  app.get("/api/admin/report-scores", requireAdmin, async (req, res) => {
    try {
      const allReports = await storage.getAllReportsWithScores();
      
      // Extract score data from each report
      const reportScores = allReports.map(report => {
        const fullReport: any = report.fullReport;
        let scoreData: any = {
          id: report.id,
          conversationId: report.conversationId,
          reportType: report.reportType,
          createdAt: report.createdAt,
          idea: '',
          overallScore: null,
          rating: null,
          dimensions: null
        };

        if (report.reportType === 'angelic' && fullReport?.executiveSummary) {
          scoreData.idea = fullReport.idea || '';
          scoreData.overallScore = fullReport.executiveSummary.overallScore || null;
          scoreData.rating = fullReport.executiveSummary.rating || null;
          scoreData.structureBonus = fullReport.executiveSummary.structureBonus || false;
          scoreData.breakthroughSignal = fullReport.executiveSummary.breakthroughSignal || false;
          scoreData.dimensions = {
            innovation: fullReport.scoringFramework?.dimensions?.innovation?.score || null,
            feasibility: fullReport.scoringFramework?.dimensions?.feasibility?.score || null,
            marketPotential: fullReport.scoringFramework?.dimensions?.marketPotential?.score || null,
            competition: fullReport.scoringFramework?.dimensions?.competition?.score || null,
            sustainability: fullReport.scoringFramework?.dimensions?.sustainability?.score || null,
          };
        } else if (report.reportType === 'legacy' && fullReport?.overallScore) {
          scoreData.idea = fullReport.idea || '';
          scoreData.overallScore = fullReport.overallScore || null;
        }

        return scoreData;
      });

      // Filter out reports without scores and sort by score (descending)
      const validScores = reportScores
        .filter(r => r.overallScore !== null)
        .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

      res.json(validScores);
    } catch (error) {
      console.error("Admin report scores error:", error);
      res.status(500).json({ message: "获取报告评分失败" });
    }
  });

  // Admin endpoint for viewing all users
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "获取用户列表失败" });
    }
  });

  // Stripe Payment API routes (from Stripe blueprint - javascript_stripe)
  // Create payment intent for report generation
  app.post("/api/create-report-payment", async (req, res) => {
    try {
      if (!stripeEnabled || !stripe) {
        return res.status(503).json({ 
          message: "Payment system is not configured. Please set up Stripe API keys." 
        });
      }

      const { conversationId, reportType = 'angelic' } = req.body;

      if (!conversationId) {
        return res.status(400).json({ message: "Conversation ID is required" });
      }

      // Check if conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Define report prices (in cents)
      const REPORT_PRICES = {
        angelic: 200, // $2.00 for Angelic Reports
        legacy: 200   // $2.00 for Legacy Reports
      };

      const amount = REPORT_PRICES[reportType as keyof typeof REPORT_PRICES] || REPORT_PRICES.angelic;

      console.log(`💳 Creating payment intent for ${reportType} report: $${amount / 100}`);

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          conversationId,
          reportType,
        },
      });

      // Create report entry with pending payment status
      const reportId = await storage.createPendingReport(
        conversationId,
        paymentIntent.id,
        amount.toString(),
        "usd"
      );

      console.log(`✅ Payment intent created: ${paymentIntent.id}`);

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        reportId,
        amount 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Check payment status for a report
  app.get("/api/report-payment-status/:reportId", async (req, res) => {
    try {
      const { reportId } = req.params;

      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json({
        paymentStatus: report.paymentStatus,
        paidAt: report.paidAt,
        amount: report.amount,
        currency: report.currency,
      });
    } catch (error: any) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ 
        message: "Error checking payment status: " + error.message 
      });
    }
  });

  // Stripe webhook handler for payment confirmations
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      if (!stripeEnabled || !stripe) {
        return res.status(503).send("Stripe not configured");
      }

      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;

      // Verify webhook signature if secret is configured
      if (webhookSecret && sig) {
        try {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err: any) {
          console.error('⚠️ Webhook signature verification failed:', err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        // For development without webhook secret
        event = req.body;
      }

      console.log('🔔 Stripe webhook received:', event.type);

      // Handle the payment_intent.succeeded event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { conversationId } = paymentIntent.metadata;

        console.log(`✅ Payment succeeded for conversation: ${conversationId}`);

        // Update report payment status
        const reports = await storage.getReportsByPaymentIntent(paymentIntent.id);
        if (reports.length > 0) {
          await storage.updateReportPaymentStatus(reports[0].id, {
            paymentStatus: 'paid',
            paidAt: new Date(),
          });

          console.log(`💰 Report payment confirmed: ${reports[0].id}`);

          // Trigger background report generation and email sending
          const reportType = paymentIntent.metadata.reportType || 'angelic';
          if (reportType === 'angelic') {
            // Get conversation email and messages
            const conversation = await storage.getConversation(conversationId);
            const conversationMessages = await storage.getConversationMessages(conversationId);
            
            if (conversation?.email) {
              // Prepare conversation data
              const firstUserMessage = conversationMessages.find((msg: any) => msg.role === 'user');
              const conversationData = {
                idea: firstUserMessage?.content || '',
                messages: conversationMessages.map((msg: any) => ({
                  role: msg.role as 'user' | 'assistant',
                  content: msg.content,
                  timestamp: new Date(msg.createdAt)
                }))
              };

              // Generate and send report in the background
              generateAndSendReport(conversationId, conversation.email, conversationData);
            }
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook handler error: " + error.message });
    }
  });

  // ===== Feedback API Routes =====
  
  // Submit feedback (public endpoint - supports both authenticated and anonymous users)
  app.post("/api/feedback", async (req: any, res) => {
    try {
      const { feedbackType, subject, content, rating, email, reportId, conversationId } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: "Feedback content is required" });
      }
      
      // Get user ID from session if authenticated
      const userId = getUserId(req);
      
      const feedback = await storage.createFeedback({
        userId,
        email,
        feedbackType: feedbackType || 'general',
        subject,
        content,
        rating,
        reportId,
        conversationId,
      });
      
      console.log(`📝 New feedback received: ${feedback.id} (type: ${feedbackType})`);
      
      res.json({ 
        message: "Thank you for your feedback!",
        feedbackId: feedback.id 
      });
    } catch (error: any) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });
  
  // Get all feedbacks (admin only)
  app.get("/api/admin/feedbacks", requireAdmin, async (req: any, res) => {
    try {
      const feedbacks = await storage.getAllFeedbacks();
      res.json(feedbacks);
    } catch (error: any) {
      console.error("Error fetching feedbacks:", error);
      res.status(500).json({ message: "Failed to fetch feedbacks" });
    }
  });
  
  // Mark feedback as read (admin only)
  app.patch("/api/admin/feedbacks/:id/read", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markFeedbackRead(id);
      res.json({ message: "Feedback marked as read" });
    } catch (error: any) {
      console.error("Error marking feedback as read:", error);
      res.status(500).json({ message: "Failed to mark feedback as read" });
    }
  });
  
  // Update feedback notes (admin only)
  app.patch("/api/admin/feedbacks/:id/notes", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      await storage.updateFeedbackNotes(id, notes || '');
      res.json({ message: "Feedback notes updated" });
    } catch (error: any) {
      console.error("Error updating feedback notes:", error);
      res.status(500).json({ message: "Failed to update feedback notes" });
    }
  });

  // ===============================================
  // ELO RANKING SYSTEM ENDPOINTS
  // ===============================================

  // POST /api/evaluate - Evaluate a startup idea
  app.post('/api/evaluate', async (req, res) => {
    try {
      const evaluateSchema = z.object({
        idea_id: z.string().optional(),
        text: z.string().min(1),
        category: z.string().optional(),
        stage: z.string().optional(),
        user_id: z.string().optional(),
        conversation_id: z.string().optional(),
        is_public: z.boolean().optional().default(false), // Privacy setting
        language: z.enum(['zh', 'en']).optional().default('zh')
      });

      const data = evaluateSchema.parse(req.body);
      const userId = getUserId(req) || data.user_id;

      // Run AI evaluation
      const evalResult = await evaluateIdea(data.text, data.category, data.stage);

      // Generate AI anonymized summary if public
      let aiSummary: string | null = null;
      let anonymizedCategory: string | null = null;
      if (data.is_public) {
        const { generateAnonymousSummary } = await import('./services/idea-anonymizer.js');
        const anonymization = await generateAnonymousSummary(data.text, data.language);
        aiSummary = anonymization.aiSummary;
        anonymizedCategory = anonymization.category;
      }

      // Create or use existing idea
      let ideaId = data.idea_id;
      if (!ideaId) {
        const newIdea = await storage.createIdea({
          text: data.text,
          category: anonymizedCategory || data.category || null,
          stage: data.stage || null,
          userId: userId || null,
          conversationId: data.conversation_id || null,
          isPublic: data.is_public ? 'true' : 'false',
          aiSummary: aiSummary
        });
        ideaId = newIdea.id;
      }

      // Store evaluation
      const evalRecord = await storage.createEval({
        ideaId,
        viabilityScore: String(evalResult.viability.score),
        excellenceScore: String(evalResult.excellence.score),
        decision: evalResult.decision,
        uncertainty: evalResult.uncertainty,
        topRisks: evalResult.top_risks,
        keyEnablers: evalResult.key_enablers
      });

      // Initialize ELO rating if Viability >= 60
      if (evalResult.viability.score >= 60) {
        await storage.createOrUpdateRating({
          ideaId,
          eloScore: '1500',
          matchCount: '0'
        });

        // Trigger auto-matching in background (non-blocking)
        autoScheduleMatches(ideaId, 5).catch(err => {
          console.error('Auto-matching background error:', err);
        });
      }

      res.json({
        idea_id: ideaId,
        viability: evalResult.viability.score,
        excellence: evalResult.excellence.score,
        decision: evalResult.decision,
        uncertainty: evalResult.uncertainty,
        top_risks: evalResult.top_risks,
        key_enablers: evalResult.key_enablers,
        eligible_for_ranking: evalResult.viability.score >= 60
      });
    } catch (error: any) {
      console.error('Evaluation error:', error);
      res.status(400).json({ error: error.message || 'Evaluation failed' });
    }
  });

  // POST /api/compare - Compare two ideas and update ELO ratings
  app.post('/api/compare', async (req, res) => {
    try {
      const compareSchema = z.object({
        idea_a_id: z.string(),
        idea_b_id: z.string()
      });

      const { idea_a_id, idea_b_id } = compareSchema.parse(req.body);

      // Fetch both ideas and their evaluations
      const [ideaA, ideaB, evalA, evalB, ratingA, ratingB] = await Promise.all([
        storage.getIdea(idea_a_id),
        storage.getIdea(idea_b_id),
        storage.getEval(idea_a_id),
        storage.getEval(idea_b_id),
        storage.getRating(idea_a_id),
        storage.getRating(idea_b_id)
      ]);

      if (!ideaA || !ideaB) {
        return res.status(404).json({ error: 'One or both ideas not found' });
      }

      if (!evalA || !evalB) {
        return res.status(400).json({ error: 'Both ideas must be evaluated first' });
      }

      if (!ratingA || !ratingB) {
        return res.status(400).json({ error: 'Both ideas must have ELO ratings (Viability ≥ 60 required)' });
      }

      // Run LLM comparison
      const comparison = await compareIdeas(
        { idea: ideaA, eval: evalA },
        { idea: ideaB, eval: evalB }
      );

      // Determine outcome for ELO calculation
      let outcomeA: number;
      if (comparison.winner === 'A') {
        outcomeA = 1;
      } else if (comparison.winner === 'B') {
        outcomeA = 0;
      } else {
        outcomeA = 0.5; // Tie
      }

      // Calculate new ELO ratings
      const currentEloA = parseInt(ratingA.eloScore);
      const currentEloB = parseInt(ratingB.eloScore);
      const { newRatingA, newRatingB } = calculateNewElo(currentEloA, currentEloB, outcomeA);

      // Update ratings
      await Promise.all([
        storage.createOrUpdateRating({
          ideaId: idea_a_id,
          eloScore: String(newRatingA),
          matchCount: String(parseInt(ratingA.matchCount) + 1)
        }),
        storage.createOrUpdateRating({
          ideaId: idea_b_id,
          eloScore: String(newRatingB),
          matchCount: String(parseInt(ratingB.matchCount) + 1)
        })
      ]);

      // Record match
      await storage.createMatch({
        ideaAId: idea_a_id,
        ideaBId: idea_b_id,
        winner: comparison.winner,
        reasons: comparison.reasons,
        confidence: comparison.confidence
      });

      res.json({
        winner: comparison.winner,
        reasons: comparison.reasons,
        confidence: comparison.confidence,
        elo_changes: {
          idea_a: { old: currentEloA, new: newRatingA, change: newRatingA - currentEloA },
          idea_b: { old: currentEloB, new: newRatingB, change: newRatingB - currentEloB }
        }
      });
    } catch (error: any) {
      console.error('Comparison error:', error);
      res.status(400).json({ error: error.message || 'Comparison failed' });
    }
  });

  // GET /api/top - Get top-ranked ideas with badges (privacy-protected)
  app.get('/api/top', async (req, res) => {
    try {
      const limitParam = req.query.limit;
      const limit = limitParam ? parseInt(limitParam as string) : 20;
      
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'Invalid limit (must be 1-100)' });
      }

      const currentUserId = getUserId(req); // Get current user if authenticated
      const topIdeas = await storage.getTopRatedIdeas(limit);

      const results = topIdeas.map((item, index) => {
        const eloScore = parseInt(item.rating.eloScore);
        const matchCount = parseInt(item.rating.matchCount);
        const badgeInfo = calculateBadge(eloScore, matchCount);
        const percentile = getPercentileRank(eloScore);

        // Privacy logic: determine what text to show
        const isOwnIdea = currentUserId && item.idea.userId === currentUserId;
        const isPublic = item.idea.isPublic === 'true';
        
        let displayText: string;
        let isAnonymized = false;
        
        if (isOwnIdea) {
          // Show full text for own ideas
          displayText = item.idea.text;
        } else if (isPublic && item.idea.aiSummary) {
          // Show AI summary for public ideas
          displayText = item.idea.aiSummary;
          isAnonymized = true;
        } else {
          // Fully anonymize private ideas
          displayText = `${item.idea.category || 'Startup'} #${String(index + 1).padStart(3, '0')}`;
          isAnonymized = true;
        }

        return {
          rank: index + 1,
          idea_id: item.idea.id,
          text: displayText,
          category: item.idea.category,
          stage: item.idea.stage,
          elo_score: eloScore,
          match_count: matchCount,
          viability_score: item.eval ? parseInt(item.eval.viabilityScore) : null,
          excellence_score: item.eval ? parseInt(item.eval.excellenceScore) : null,
          decision: item.eval?.decision,
          badge: badgeInfo.badge,
          badge_color: badgeInfo.color,
          badge_description: badgeInfo.description,
          is_own: isOwnIdea,
          is_anonymized: isAnonymized,
          is_public: isPublic,
          percentile
        };
      });

      res.json({
        total: results.length,
        ideas: results
      });
    } catch (error: any) {
      console.error('Top ideas error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch top ideas' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background function to generate and send report
async function generateAndSendReport(
  conversationId: string, 
  email: string, 
  conversationData: { idea: string; messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }> }
) {
  try {
    console.log('🚀 Starting background report generation for conversation:', conversationId);
    
    // Generate Angelic report
    const { report, language } = await generateAngelicReport(conversationData, conversationId);
    
    // Store report in database
    await storage.createReport({
      conversationId,
      email,
      fullReport: report
    });

    // Get report ID for viewing link
    const reports = await storage.getReportsByConversation(conversationId);
    const reportId = reports.length > 0 ? reports[0].id : '';
    const reportViewUrl = `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/reports/${reportId}`;
    
    // Send email - use appropriate sender based on email provider
    let fromEmail = process.env.FROM_EMAIL || 'reports@angelic.ai';
    
    if (process.env.EMAIL_PROVIDER === 'brevo') {
      fromEmail = process.env.BREVO_FROM || fromEmail;
    } else if (process.env.EMAIL_PROVIDER === 'mailersend') {
      fromEmail = process.env.MAILERSEND_FROM || fromEmail;
    } else if (process.env.EMAIL_PROVIDER === 'sendgrid') {
      fromEmail = process.env.SENDGRID_FROM || fromEmail;
    }
      
    const emailSubject = language === 'zh' 
      ? `Angelic AI - 您的创业分析报告：${report.idea}`
      : `Angelic AI - Your Startup Analysis Report: ${report.idea}`;
    
    const emailHTML = language === 'zh'
      ? `<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #8B5CF6;">您的 Angelic 报告已生成</h2>
           <p>创业想法：<strong>${report.idea}</strong></p>
           <p>综合评分：<strong>${report.executiveSummary.overallScore}/100</strong></p>
           <p>评级：<strong>${report.executiveSummary.rating}</strong></p>
           <p><a href="${reportViewUrl}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">查看完整报告</a></p>
           <p style="color: #666; font-size: 14px; margin-top: 30px;">感谢使用 Angelic AI！</p>
         </body></html>`
      : `<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #8B5CF6;">Your Angelic Report is Ready</h2>
           <p>Startup Idea: <strong>${report.idea}</strong></p>
           <p>Overall Score: <strong>${report.executiveSummary.overallScore}/100</strong></p>
           <p>Rating: <strong>${report.executiveSummary.rating}</strong></p>
           <p><a href="${reportViewUrl}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Full Report</a></p>
           <p style="color: #666; font-size: 14px; margin-top: 30px;">Thank you for using Angelic AI!</p>
         </body></html>`;
    
    const emailText = language === 'zh'
      ? `您好！\n\n您申请的创业分析报告已经生成完成。\n\n创业想法：${report.idea}\n综合评分：${report.executiveSummary.overallScore}/100\n评级：${report.executiveSummary.rating}\n\n查看完整报告：${reportViewUrl}\n\n感谢使用 Angelic AI！\n\n--\nAngelic AI Team`
      : `Hello!\n\nYour startup analysis report has been generated.\n\nStartup Idea: ${report.idea}\nOverall Score: ${report.executiveSummary.overallScore}/100\nRating: ${report.executiveSummary.rating}\n\nView Full Report: ${reportViewUrl}\n\nThank you for using Angelic AI!\n\n--\nAngelic AI Team`;
    
    const emailSent = await sendEmail({
      to: email,
      from: fromEmail,
      subject: emailSubject,
      html: emailHTML,
      text: emailText
    });

    if (emailSent) {
      // Update conversation with sent timestamp
      await storage.updateConversation(conversationId, {
        reportSent: new Date()
      });
      
      // Update report with sent timestamp
      const reports = await storage.getReportsByConversation(conversationId);
      if (reports.length > 0) {
        await storage.updateReport(reports[0].id, {
          sentAt: new Date()
        });
      }
      
      console.log('✅ Report successfully sent to:', email);
    } else {
      console.error('❌ Failed to send email to:', email);
    }
    
  } catch (error) {
    console.error('❌ Background report generation/sending failed:', error);
    
    // Update report status with failure information
    try {
      const reports = await storage.getReportsByConversation(conversationId);
      if (reports.length > 0) {
        // Note: This would require extending the report schema to include failure status
        console.error('📧 Report generated but email failed for conversation:', conversationId);
      }
    } catch (updateError) {
      console.error('Failed to update report failure status:', updateError);
    }
    
    // Handle specific MailerSend errors
    if (error instanceof Error) {
      if (error.message.includes('MAILERSEND_TRIAL_LIMITATION')) {
        console.error('⚠️ MailerSend trial account limitation detected');
        console.error('📧 User email that failed:', email);
        console.error('💡 Action needed: Upgrade MailerSend account or ensure email matches admin email');
        console.error('💡 User guidance: The report was generated but could not be sent. Please contact support.');
      } else if (error.message.includes('MAILERSEND_ERROR')) {
        console.error('⚠️ MailerSend API error detected');
        console.error('📧 User email that failed:', email);
        console.error('🔧 Error details:', error.message);
      }
    }
  }
}
