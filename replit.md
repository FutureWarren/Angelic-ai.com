# Angelic - AI Startup Intelligent Analysis Platform

## Overview

Angelic is a full-stack web application for AI-powered analysis of startup ideas, offering investment-grade quantitative evaluations. It features full Chinese/English bilingualism, an animated introduction, and an AI chat for idea refinement. Users can interact with AI to develop concepts before generating professional diagnostic reports. The platform's signature Angelic Reports utilize a rigorous 5-dimension weighted scoring framework (Innovation 25%, Feasibility 25%, Market 25%, Competition 15%, Sustainability 10%) with objective metrics, auto-fail gates, and Red/Blue Ocean analysis. These consultancy-grade reports provide quantified insights, mathematical formulas, and actionable milestones, all within a modern dark/light mode interface with smooth animations. Angelic aims to deliver data-driven, objective analysis for entrepreneurs seeking investment-grade insights.

## Recent Changes (November 21, 2025)

### AI Model: Using GPT-4o-mini
- **Report Generation**: Currently using OpenAI GPT-4o-mini for report generation
  - Attempted migration to Anthropic Claude 3.5 Sonnet but Replit AI Integrations does not support Claude models
  - Reverted to OpenAI GPT-4o-mini (via Replit AI Integrations)
  - Using structured JSON output mode (`response_format: { type: "json_object" }`) for reliable parsing
  - No separate API key needed, billed to Replit credits
- **Market Insights Summarization**: Also using GPT-4o-mini
  - Lightweight model for cost-effective summarization of web search results
  - Maintains quality while reducing token costs

## Recent Changes (October 31, 2025)

### Security Enhancements & Admin Access Control
- **Role-Based Admin Protection**: Implemented comprehensive two-layer admin security
  - Added `isAdmin` boolean field to users schema (default: false)
  - Created `requireAdmin` middleware that validates both authentication AND admin role
  - All admin API endpoints (`/api/admin/*`) now protected by requireAdmin middleware
  - Frontend admin page verifies admin status and redirects unauthorized users to homepage
- **API Rate Limiting**: Configured express-rate-limit to prevent abuse and cost overruns
  - Chat API: 20 requests per 15 minutes per IP address
  - Report generation: 3 requests per hour per IP address
  - Prevents automated abuse while allowing normal user activity
- **Database Migration**: Successfully added `is_admin` column to users table in production database

### Report System Cleanup & Feedback Feature (October 30, 2025)
- **Legacy Report System Removed**: Completely removed detailed report generation system, now exclusively using Angelic reports
  - Changed database schema default `reportType` to "angelic"
  - Removed `generateDetailedReport` function and all legacy report generation code
  - Removed legacy report tracking from admin statistics
  - Updated all email notifications to reference only Angelic reports
- **Email Simplification**: Email notifications now send lightweight report view links instead of full HTML reports
  - Implemented `sendReportNotification` function with professional email template
  - All report emails include permanent shareable links to web-based report viewer
  - Removed dependency on `generateReportHTML` for report delivery
- **Post-Report Feedback System**: Implemented automatic feedback collection after report viewing
  - Feedback dialog automatically appears 500ms after user closes Angelic report
  - Required 1-5 star rating with optional text feedback
  - Integrated with existing `/api/feedback` endpoint
  - One-time display per report session to avoid annoyance
- **Admin Dashboard Enhancements**: 
  - Added Users tab showing all registered users with email, auth provider, and registration date
  - Added ranking badges (#1, #2, #3) to top report scores in statistics table

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frameworks**: React 18 with TypeScript, Wouter for routing, shadcn/ui (built on Radix UI) for components, Tailwind CSS for styling.
- **Visuals**: Elegant animated introduction, dark/light mode, smooth staged animations, full-screen vertical paging with hardware-accelerated transitions, dynamic hero logo switching.
- **Accessibility**: ARIA, keyboard handling, reduced-motion, consistent navigation (wheel, touch, keyboard, navigation dots).
- **Localization**: Comprehensive Chinese/English bilingualism across all pages with persistent preference and localized SEO.

### Technical Implementations
- **Frontend**: Vite for building, TanStack React Query for server state.
- **Backend**: Node.js with Express.js, TypeScript with ES modules, RESTful API design, Zod for request validation, abstract storage layer.
- **Data Storage**: Currently in-memory, but designed for PostgreSQL with Drizzle ORM and Neon Database serverless driver. Drizzle Kit for migrations.
- **Authentication**: Dual system supporting OIDC (Replit Auth) and email/password with bcrypt hashing, unified via Passport.js and a PostgreSQL session store. Includes token refresh, secure cookies, and CSRF protection.
- **Payment System**: Stripe integration for per-report payments. Features a defined payment flow, database schema extensions for payment status, and secure webhook handling.
- **User Feedback**: Comprehensive system for both authenticated and anonymous users, storing feedback types, content, ratings, and contextual references. Includes admin features for managing feedback.
- **AI Analysis**:
    - **Model**: OpenAI GPT-4o for chat and report generation.
    - **Bilingualism**: Auto-language detection for UI and AI responses.
    - **Dual AI Modes**: "Angelic Advisor" (professional consultant) and "Customer Persona" (user perspective) with distinct system prompts and UI switching.
    - **Dual Report System**:
        - **Angelic Reports**: Investment-grade with a 6-section structure, enhanced 5-dimension scoring (including Structure Bonus, Anti-Anchoring Safeguards, Breakthrough Potential System), Dual-Layer Red/Blue Ocean Analysis, Risk Dependency Chain Analysis, objective metrics (TRL, TAM/SAM/SOM, CR5), and actionable outputs.
        - **Legacy Detailed Reports**: Professional HTML-formatted analysis.
    - **Context Extraction**: AI analyzes conversation history for structured quantitative analysis.
    - **Market Insights**: Pluggable system (e.g., Serper.dev) for web search integration, providing AI-summarized insights across 4 dimensions (social media, competitors, trends, user reviews), with smart caching and graceful degradation.
    - **Report Display**: Full-screen consultancy-grade UI with visualizations, risk badges, and KPIs, featuring dynamic loading states.
    - **Email & Sharing**: Multi-provider email for bilingual notifications and shareable public links with view tracking.
    - **Data Validation**: Filters out fake/placeholder URLs from report data sources.
    - **ELO Ranking System**: Competitive ranking system to distinguish high-quality ideas:
        - **Dual Scoring**: Viability (0-100, feasibility) + Excellence (0-100, long-term potential)
        - **Eligibility**: Only ideas with Viability ≥60 enter the ranking pool (initial ELO: 1500)
        - **Auto-Matching**: New ideas automatically compared against 5 similar-ELO opponents using LLM judge
        - **Pairwise Comparison**: GPT-4o-mini evaluates ideas across viability, excellence, execution clarity, and breakthrough potential
        - **ELO Algorithm**: Standard formula with K=24, accumulates across sequential matches
        - **Badge System**: Legendary/Platinum/Gold/Silver/Bronze/Emerging tiers based on ELO score and match count
        - **Leaderboard**: GET /api/top returns ranked ideas (minimum 3 matches) with badges, percentiles, and complete evaluation data
        - **Cross-Category**: Global ranking allows comparison across all idea categories for objective assessment

### System Design Choices
- **Design Patterns**: Separation of concerns (client, server, shared), end-to-end TypeScript for type safety, modular React components, comprehensive error handling, responsive design, and WCAG compliance via Radix UI.

## External Dependencies

### Core Technologies
- **React Ecosystem**
- **Express.js**
- **PostgreSQL** (via Neon Database)
- **Drizzle ORM**

### UI and Styling
- **Radix UI**
- **Tailwind CSS**
- **Lucide React** (icons)
- **Google Fonts**

### AI and External Services
- **OpenAI API** (GPT-4o)
- **SendGrid** (email service)
- **Stripe** (payment processing)
- **Serper.dev** (optional, for market insights)

### Development and Build Tools
- **Vite**
- **TypeScript**
- **ESBuild**

### State Management and Data Fetching
- **TanStack React Query**
- **React Hook Form**
- **Zod** (validation)