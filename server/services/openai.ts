import OpenAI from "openai";
import { appendFileSync } from "fs";
import { getPersonaSystemPrompt } from "../ai-personas";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  uiLanguage?: 'zh' | 'en';
  aiPersona?: 'consultant' | 'customer';
}

export interface AnalysisData {
  score: {
    demand: number;
    competition: number;
    monetization: number;
    total: number;
    conclusion: string;
    reasoning: {
      demand: string;
      competition: string;
      monetization: string;
    };
  };
  challenges: string[];
  todoList: {
    task: string;
    deadline?: string;
    completed?: boolean;
  }[];
}

export interface ChatResponse {
  response: string;
  conversationHistory: ChatMessage[];
  analysisData?: AnalysisData;
  followUpQuestions?: string[];
}

// Clean up AI response to remove any ChatGPT-like formatting
function cleanAIResponse(text: string): string {
  let cleaned = text;
  
  // Remove markdown bold
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove numbered lists (1. 2. 3. or 1) 2) 3))
  cleaned = cleaned.replace(/^\d+[\.)]\s+/gm, '');
  
  // Remove emoji numbered lists (1️⃣ 2️⃣ 3️⃣)
  cleaned = cleaned.replace(/[0-9]️⃣\s*/g, '');
  
  // Remove bullet points
  cleaned = cleaned.replace(/^[•\-\*]\s+/gm, '');
  
  return cleaned.trim();
}

export async function chatWithAI(request: ChatRequest): Promise<ChatResponse> {
  try {
    const uiLanguage = request.uiLanguage || 'zh';
    const aiPersona = request.aiPersona || 'consultant';
    const languageInstruction = uiLanguage === 'zh' 
      ? '你必须用中文回复 / You MUST respond in Chinese' 
      : 'You MUST respond in English / 你必须用英文回复';
    
    // Get persona-specific system prompt or use default
    let systemPrompt: string;
    if (aiPersona !== 'consultant') {
      // Use persona-specific prompt
      systemPrompt = `🚨 UI LANGUAGE: ${uiLanguage.toUpperCase()} 🚨
${languageInstruction}

━━━━━━━━━━━━━━━━━━━━━━

${getPersonaSystemPrompt(aiPersona)}

━━━━━━━━━━━━━━━━━━━━━━

CRITICAL FORMATTING RULES

ABSOLUTELY FORBIDDEN - These make you sound like ChatGPT:
❌ NO numbered lists (1. 2. 3. or 1️⃣ 2️⃣ 3️⃣)
❌ NO markdown bold (**text**)
❌ NO headers (###, ##, ####)
❌ NO bullet points (*, -, •)
❌ NO structured formatting of any kind

✅ REQUIRED - Sound like a real person talking:
✅ Use 4-6 short conversational sentences/paragraphs
✅ Break up thoughts naturally - avoid long blocks
✅ Use natural emoji in sentences (🤔 ⚠️ 🚩 🎯 💡 💪 💬)
✅ Ask questions conversationally, not in a list
✅ Each sentence should be punchy and clear

Always match the UI language exactly (${uiLanguage}).`;
    } else {
      // Use default Angelic consultant prompt
      systemPrompt = `语言：必须用${uiLanguage === 'zh' ? '中文' : 'English'}回复所有内容。

你是Angelic，创业顾问。

核心规则：
- 每次只探讨一个话题
- 每次只问一个问题
- 绝对不要使用类似"首先"、"其次"、"再次"、"最后"这样的连接词
- 绝对不要在一次回复中列出多个问题
- 用2-4句简短的话回应用户，然后问一个具体问题
- 等用户回答后，下一次再问下一个话题

禁止使用的格式：
- 编号列表
- 项目符号
- markdown格式

正确做法：简短回应，然后问一个聚焦的问题。`;
    }
    
    // 构建对话历史消息数组
    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // 添加对话历史
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      request.conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // 添加当前用户消息
    messages.push({
      role: "user",
      content: request.message
    });

    console.log('🚀 Starting OpenAI chat API call...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 1500,
      temperature: 0.4  // Lowered from 0.7 for more consistent, controlled responses
    });

    console.log('✅ OpenAI chat API call completed successfully');
    
    const message = response.choices[0]?.message;
    if (!message?.content) {
      throw new Error('AI回复为空，请重试');
    }

    const rawAIResponse = typeof message.content === 'string' ? message.content : 
                       Array.isArray(message.content) ? (message.content as any[]).find(p => p.type === 'text')?.text || '' : '';

    if (!rawAIResponse.trim()) {
      throw new Error('AI回复内容为空，请重试');
    }

    // Clean the AI response to remove ChatGPT-like formatting
    const aiResponse = cleanAIResponse(rawAIResponse);

    // 🚨 CRITICAL GUARD: Reject responses with multi-question list patterns
    // Only reject if it contains MULTIPLE ordering words in sequence (indicating a list structure)
    const orderingWords = ['首先', '其次', '再次', '最后', '第一', '第二', '第三'];
    const orderingWordCount = orderingWords.filter(word => aiResponse.includes(word)).length;
    
    // Only reject if 2 or more ordering words appear (indicating a structured list)
    if (orderingWordCount >= 2) {
      console.warn(`⚠️ AI response contains ${orderingWordCount} ordering words (multi-question list detected), rejecting...`);
      // Return a simple fallback response that asks only ONE question
      const fallbackResponse = uiLanguage === 'zh' 
        ? '让我先了解一下：你的目标用户是谁？请描述一个具体的人和他们遇到的问题。'
        : 'Let me start with this: Who is your target user? Describe a specific person and the problem they face.';
      
      const updatedHistory: ChatMessage[] = [
        ...(request.conversationHistory || []),
        {
          role: 'user',
          content: request.message,
          timestamp: new Date()
        },
        {
          role: 'assistant', 
          content: fallbackResponse,
          timestamp: new Date()
        }
      ];
      
      return {
        response: fallbackResponse,
        conversationHistory: updatedHistory
      };
    }

    // 构建完整的对话历史
    const updatedHistory: ChatMessage[] = [
      ...(request.conversationHistory || []),
      {
        role: 'user',
        content: request.message,
        timestamp: new Date()
      },
      {
        role: 'assistant', 
        content: aiResponse,
        timestamp: new Date()
      }
    ];

    // Generate follow-up questions (Perplexity-style)
    let followUpQuestions: string[] = [];
    try {
      const followUpPrompt = uiLanguage === 'zh' 
        ? `基于以下对话，生成3个简短的后续问题（每个问题最多15个字），帮助用户深化他们的创业想法。问题应该：
1. 直接、尖锐、有针对性
2. 挑战用户思考具体细节
3. 用自然的口语化表达，不要使用序号或格式化

对话历史：
用户：${request.message}
AI：${aiResponse}

请只返回3个问题，每行一个问题，不要编号，不要额外解释：`
        : `Based on the following conversation, generate 3 concise follow-up questions (max 15 words each) to help deepen their startup idea. Questions should:
1. Be direct, sharp, and targeted
2. Challenge them to think about specific details
3. Use natural conversational language, no numbering or formatting

Conversation history:
User: ${request.message}
AI: ${aiResponse}

Return only 3 questions, one per line, no numbering, no extra explanation:`;

      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: followUpPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const followUpContent = followUpResponse.choices[0]?.message?.content;
      if (followUpContent) {
        followUpQuestions = followUpContent
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 0 && !q.match(/^\d+[\.)]/)) // Filter out numbered items
          .slice(0, 3); // Take first 3 questions
      }
    } catch (error) {
      console.error("Error generating follow-up questions:", error);
      // If follow-up generation fails, continue without them
    }

    console.log('✅ Chat response processed successfully');
    return {
      response: aiResponse,
      conversationHistory: updatedHistory,
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined
    };

  } catch (error) {
    console.error("OpenAI chat API error:", error);
    throw new Error("AI对话服务暂时不可用，请稍后重试");
  }
}

// Legacy interfaces for backward compatibility (deprecated)
export interface StartupAnalysisRequest {
  idea: string;
}

export interface StartupAnalysisResponse {
  summary: string;
  advantages: string[];
  challenges: string[];
  marketPotential: {
    score: number;
    description: string;
  };
  nextSteps: string[];
}

// Legacy function for backward compatibility - converts to chat format
export async function analyzeStartupIdea(idea: string): Promise<StartupAnalysisResponse> {
  const chatResponse = await chatWithAI({
    message: `请分析这个创业想法：${idea}`,
    conversationHistory: []
  });
  
  // Return a basic structure for backward compatibility during migration
  return {
    summary: chatResponse.response,
    advantages: ["使用新聊天功能获取详细优势分析"],
    challenges: ["使用新聊天功能获取详细挑战分析"],
    marketPotential: { score: 3, description: "使用新聊天功能获取详细市场分析" },
    nextSteps: ["使用新聊天功能获取详细下一步建议"]
  };
}
