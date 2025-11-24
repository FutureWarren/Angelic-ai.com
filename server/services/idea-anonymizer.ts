import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface AnonymizationResult {
  aiSummary: string;
  category: string;
}

export async function generateAnonymousSummary(originalIdea: string, language: 'zh' | 'en' = 'zh'): Promise<AnonymizationResult> {
  const systemPrompt = language === 'zh'
    ? `你是一个创意匿名化助手。你的任务是将用户的创业想法转化为模糊化的、匿名的摘要，以保护隐私但保留展示价值。

规则：
1. **模糊化细节**：移除具体的产品名称、公司名、地点、特定技术细节
2. **保留本质**：保留创意的核心类别、领域和价值主张
3. **通用化描述**：使用更广泛的术语替代具体描述
4. **简洁性**：摘要应该是1-2句话，不超过50个字
5. **分类**：识别创意的主要分类（如"AI健康"、"金融科技"、"教育平台"等）

示例：
- 原文："开发一个AI健身App，利用计算机视觉分析用户动作，提供个性化训练方案"
- 摘要："AI健康教练类产品，专注个性化计划"
- 分类："AI健康"

- 原文："为中小企业提供智能财务管理SaaS，集成报销、预算、税务功能"
- 摘要："企业财务管理平台，面向中小企业"
- 分类："企业SaaS"

请以JSON格式回复：{"summary": "模糊摘要", "category": "分类"}`
    : `You are an idea anonymization assistant. Your task is to transform users' startup ideas into fuzzy, anonymous summaries that protect privacy while retaining display value.

Rules:
1. **Blur Details**: Remove specific product names, company names, locations, specific technical details
2. **Retain Essence**: Keep the core category, domain, and value proposition
3. **Generalize**: Use broader terms to replace specific descriptions
4. **Brevity**: Summary should be 1-2 sentences, max 50 words
5. **Categorize**: Identify the main category (e.g., "AI Health", "FinTech", "EdTech")

Examples:
- Original: "Build an AI fitness app using computer vision to analyze user movements and provide personalized training"
- Summary: "AI health coach product focusing on personalized plans"
- Category: "AI Health"

- Original: "Provide smart financial management SaaS for SMEs with expense, budget, and tax features"
- Summary: "Business finance management platform for SMEs"
- Category: "Enterprise SaaS"

Please respond in JSON format: {"summary": "fuzzy summary", "category": "category"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: originalIdea }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      aiSummary: result.summary || (language === 'zh' ? '创业项目' : 'Startup Project'),
      category: result.category || (language === 'zh' ? '其他' : 'Other')
    };
  } catch (error) {
    console.error('Error generating anonymous summary:', error);
    return {
      aiSummary: language === 'zh' ? '创业项目' : 'Startup Project',
      category: language === 'zh' ? '其他' : 'Other'
    };
  }
}
