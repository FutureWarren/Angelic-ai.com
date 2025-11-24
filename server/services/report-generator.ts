import OpenAI from "openai";
import type { DetailedReport } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export interface ConversationData {
  idea: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export async function generateDetailedReport(conversationData: ConversationData): Promise<{report: DetailedReport, language: 'zh' | 'en'}> {
  try {
    console.log('🚀 Starting professional report generation...');
    
    // Detect language from conversation history
    const detectLanguage = (messages: Array<{role: string; content: string}>): 'zh' | 'en' => {
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
      const chineseCharCount = (userMessages.match(/[\u4e00-\u9fa5]/g) || []).length;
      const totalChars = userMessages.length;
      return (chineseCharCount / totalChars > 0.2) ? 'zh' : 'en';
    };

    const language = detectLanguage(conversationData.messages);
    console.log(`📝 Detected language: ${language === 'zh' ? 'Chinese' : 'English'}`);

    const conversationHistory = conversationData.messages
      .map(msg => {
        const roleLabel = language === 'zh' 
          ? (msg.role === 'user' ? '用户' : 'AI助手')
          : (msg.role === 'user' ? 'User' : 'AI Assistant');
        return `${roleLabel}: ${msg.content}`;
      })
      .join('\n\n');

    const promptChinese = `你是一位顶级创业分析师和投资顾问，拥有15年的行业经验，专注于深度市场调研、竞争分析和商业模式设计。请基于以下对话内容，生成一份专业、全面的创业分析报告。

创业想法：${conversationData.idea}

对话历史：
${conversationHistory}

---

# 报告要求

## 1. 市场分析 (Market Analysis)
- **目标市场**：精确定义细分市场，包括地理位置、人口规模、特定需求
- **市场规模**：提供具体数据（如：中国XX市场2024年规模XXX亿元）
- **市场增长率**：近3-5年CAGR，引用权威数据源（如：Statista, Gartner, 艾瑞咨询）
- **行业趋势**：列出3-5个关键趋势，每个配以具体案例或数据
- **用户画像**：详细描述典型用户的人口特征、痛点（至少3个）、行为模式

## 2. 竞争分析 (Competitive Analysis)
- **竞争格局**：分析行业竞争强度、市场集中度、主要玩家分布
- **主要竞争对手**：至少分析3个直接竞争对手：
  - 每个竞争对手的优势（至少3个）和劣势（至少2个）
  - 市场份额（具体百分比或范围）
  - 定价策略（具体价格点或定价模式）
- **差异化优势**：明确阐述如何与众不同
- **进入壁垒**：技术、资金、品牌、渠道等方面的壁垒分析
- **威胁分析**：潜在竞争者、替代品、技术变革等

## 3. 商业模式 (Business Model)
- **收入来源**：至少3个收入渠道，每个包括：
  - 来源名称
  - 详细描述
  - 收入潜力评估
- **定价模式**：具体定价策略和理由
- **单位经济学**：CAC、LTV、毛利率等关键指标的预估
- **盈利能力**：盈亏平衡分析、利润率预测
- **财务预测**：3年财务预测（收入、成本、利润）

## 4. 执行计划 (Execution Plan)
- **阶段规划**：分为3-4个阶段（如：MVP验证、市场拓展、规模化），每个阶段包括：
  - 阶段名称和持续时间
  - 3-5个核心目标
  - 关键活动清单
  - 成功指标（可量化的KPI）
- **资源需求**：按类别（技术、市场、运营等）列出，包含预估成本
- **团队需求**：列出3-5个关键岗位，包括职责和招聘时间
- **融资需求**：总融资额和详细的资金分配计划

## 5. 风险评估 (Risk Assessment)
- **风险矩阵**：至少识别5个风险，每个包括：
  - 风险描述
  - 影响程度（high/medium/low）
  - 发生概率（high/medium/low）
  - 具体的缓解措施
  - 应急预案
- **综合应对策略**：系统性的风险管理方法

## 6. 投资人视角 (VC Insights)
- **融资阶段**：明确当前适合的融资轮次
- **融资准备度**：客观评估当前融资就绪程度
- **投资吸引力**：从投资人角度分析项目价值
- **投资亮点**：3-5个吸引投资人的核心要素
- **风险警示**：2-3个投资人可能关注的问题
- **推荐投资机构**：至少3家匹配的VC，每家包括：
  - 机构名称
  - 投资方向
  - 典型投资金额
  - 推荐理由
- **Pitch要点**：5-7个pitch deck的关键内容

## 7. 综合评估
- **核心优势**：3-5个项目突出优势
- **改进方向**：3-4个需要优化的方面
- **下一步行动**：5-8个具体行动项，按优先级分类：
  - immediate（立即执行）
  - short-term（1-3个月）
  - long-term（3-12个月）

---

# 输出格式

请以JSON格式返回完整报告，严格遵循以下结构：

\`\`\`json
{
  "idea": "创业想法的简洁描述",
  "conversationSummary": "对话核心要点总结（150-200字）",
  
  "marketAnalysis": {
    "targetMarket": "目标市场描述",
    "marketSize": "市场规模数据",
    "marketGrowthRate": "增长率数据（含数据来源）",
    "demandAnalysis": "需求分析",
    "industryTrends": [
      "趋势1（包含案例或数据）",
      "趋势2",
      "趋势3"
    ],
    "userPersona": {
      "demographics": "人口特征描述",
      "painPoints": ["痛点1", "痛点2", "痛点3"],
      "behaviors": "行为模式描述"
    },
    "score": 市场评分0-100
  },
  
  "competitiveAnalysis": {
    "competitors": [
      {
        "name": "竞争对手名称",
        "strengths": ["优势1", "优势2", "优势3"],
        "weaknesses": ["劣势1", "劣势2"],
        "marketShare": "市场份额",
        "pricing": "定价策略"
      }
    ],
    "competitiveLandscape": "竞争格局分析",
    "differentiation": "差异化优势",
    "competitiveAdvantage": "核心竞争力",
    "barrierToEntry": "进入壁垒分析",
    "threats": ["威胁1", "威胁2", "威胁3"],
    "score": 竞争评分0-100
  },
  
  "businessModel": {
    "revenueStreams": [
      {
        "source": "收入来源名称",
        "description": "详细描述",
        "potential": "收入潜力评估"
      }
    ],
    "monetizationStrategy": "盈利模式详述",
    "pricingModel": "定价策略",
    "unitEconomics": "单位经济学分析（CAC、LTV等）",
    "profitabilityAnalysis": "盈利能力分析",
    "financialProjection": {
      "year1": "第一年财务预测",
      "year2": "第二年财务预测",
      "year3": "第三年财务预测"
    },
    "score": 商业模式评分0-100
  },
  
  "executionPlan": {
    "phases": [
      {
        "phase": "阶段名称",
        "duration": "持续时间",
        "objectives": ["目标1", "目标2", "目标3"],
        "keyActivities": ["活动1", "活动2", "活动3"],
        "successMetrics": ["指标1", "指标2"]
      }
    ],
    "resourceRequirements": [
      {
        "category": "资源类别",
        "items": ["具体需求1", "具体需求2"],
        "estimatedCost": "预估成本"
      }
    ],
    "teamRequirements": [
      {
        "role": "岗位名称",
        "responsibilities": "职责描述",
        "timeline": "招聘时间"
      }
    ],
    "fundingNeeds": "总融资需求",
    "fundingAllocation": [
      {
        "category": "分配类别",
        "percentage": "百分比",
        "amount": "金额"
      }
    ]
  },
  
  "riskAssessment": {
    "riskMatrix": [
      {
        "risk": "风险描述",
        "impact": "high/medium/low",
        "probability": "high/medium/low",
        "mitigation": "缓解措施",
        "contingency": "应急预案"
      }
    ],
    "majorRisks": ["主要风险1", "主要风险2"],
    "mitigationStrategies": ["应对策略1", "应对策略2"]
  },
  
  "overallScore": 总评分0-100,
  "recommendation": "总体建议（100字内）",
  "strengths": ["优势1", "优势2", "优势3"],
  "improvements": ["改进1", "改进2", "改进3"],
  
  "nextSteps": [
    {
      "action": "行动描述",
      "priority": "immediate/short-term/long-term",
      "timeline": "时间表"
    }
  ],
  
  "vcInsights": {
    "fundingReadiness": "融资准备度评估",
    "fundingStage": "适合的融资轮次",
    "attractivenessToVCs": "投资吸引力分析",
    "investmentHighlights": ["亮点1", "亮点2", "亮点3"],
    "redFlags": ["问题1", "问题2"],
    "suggestedVCs": [
      {
        "name": "投资机构名称",
        "focus": "投资方向",
        "typicalCheck": "典型投资金额",
        "reason": "推荐理由"
      }
    ],
    "pitchKeyPoints": ["要点1", "要点2", "要点3", "要点4", "要点5"]
  }
}
\`\`\`

---

# 重要提示

1. **数据真实性**：尽可能引用真实市场数据、行业报告、案例研究
2. **专业深度**：分析要深入、具体、可操作，避免泛泛而谈
3. **逻辑严密**：结论要有数据支撑，建议要有理论依据
4. **实用导向**：所有分析都要对创业者有实际指导价值
5. **完整性**：确保所有必填字段都有内容，数组至少包含最低要求数量的元素

请现在开始生成报告，以纯JSON格式输出，不要有其他说明文字。`;

    const promptEnglish = `You are a top-tier startup analyst and investment advisor with 15 years of industry experience, specializing in in-depth market research, competitive analysis, and business model design. Based on the following conversation, please generate a professional and comprehensive startup analysis report.

Startup Idea: ${conversationData.idea}

Conversation History:
${conversationHistory}

---

# Report Requirements

## 1. Market Analysis
- **Target Market**: Precisely define the market segment, including geography, population size, and specific needs
- **Market Size**: Provide specific data (e.g., US XX market size in 2024: $XXX billion)
- **Market Growth Rate**: 3-5 year CAGR, citing authoritative data sources (e.g., Statista, Gartner, McKinsey)
- **Industry Trends**: List 3-5 key trends, each with specific cases or data
- **User Persona**: Detailed description of typical user demographics, pain points (at least 3), and behavioral patterns

## 2. Competitive Analysis
- **Competitive Landscape**: Analyze industry competition intensity, market concentration, and major player distribution
- **Main Competitors**: Analyze at least 3 direct competitors:
  - Each competitor's strengths (at least 3) and weaknesses (at least 2)
  - Market share (specific percentage or range)
  - Pricing strategy (specific price points or pricing models)
- **Differentiation**: Clearly articulate how you are different
- **Barriers to Entry**: Analysis of barriers in technology, capital, brand, channels, etc.
- **Threat Analysis**: Potential competitors, substitutes, technological changes, etc.

## 3. Business Model
- **Revenue Streams**: At least 3 revenue channels, each including:
  - Source name
  - Detailed description
  - Revenue potential assessment
- **Pricing Model**: Specific pricing strategy and rationale
- **Unit Economics**: Estimates of key metrics such as CAC, LTV, gross margin
- **Profitability**: Break-even analysis, profit margin projections
- **Financial Projections**: 3-year financial forecast (revenue, costs, profits)

## 4. Execution Plan
- **Phase Planning**: Divided into 3-4 phases (e.g., MVP validation, market expansion, scaling), each including:
  - Phase name and duration
  - 3-5 core objectives
  - Key activities list
  - Success metrics (quantifiable KPIs)
- **Resource Requirements**: Listed by category (technology, marketing, operations, etc.), including estimated costs
- **Team Needs**: List 3-5 key positions, including responsibilities and hiring timeline
- **Funding Needs**: Total funding amount and detailed fund allocation plan

## 5. Risk Assessment
- **Risk Matrix**: Identify at least 5 risks, each including:
  - Risk description
  - Impact level (high/medium/low)
  - Probability (high/medium/low)
  - Specific mitigation measures
  - Contingency plan
- **Comprehensive Response Strategy**: Systematic risk management approach

## 6. VC Insights
- **Funding Stage**: Clearly identify the appropriate funding round
- **Funding Readiness**: Objectively assess current funding readiness
- **Attractiveness to VCs**: Analyze project value from an investor perspective
- **Investment Highlights**: 3-5 core elements that attract investors
- **Red Flags**: 2-3 issues that investors may be concerned about
- **Suggested VCs**: At least 3 matching VCs, each including:
  - Institution name
  - Investment focus
  - Typical check size
  - Recommendation rationale
- **Pitch Key Points**: 5-7 key elements for the pitch deck

## 7. Overall Assessment
- **Core Strengths**: 3-5 outstanding advantages of the project
- **Improvement Areas**: 3-4 aspects that need optimization
- **Next Steps**: 5-8 specific action items, categorized by priority:
  - immediate (execute immediately)
  - short-term (1-3 months)
  - long-term (3-12 months)

---

# Output Format

Please return the complete report in JSON format, strictly following this structure:

\`\`\`json
{
  "idea": "Brief description of the startup idea",
  "conversationSummary": "Summary of key conversation points (150-200 words)",
  
  "marketAnalysis": {
    "targetMarket": "Target market description",
    "marketSize": "Market size data",
    "marketGrowthRate": "Growth rate data (with source)",
    "demandAnalysis": "Demand analysis",
    "industryTrends": [
      "Trend 1 (with cases or data)",
      "Trend 2",
      "Trend 3"
    ],
    "userPersona": {
      "demographics": "Demographic description",
      "painPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
      "behaviors": "Behavioral patterns description"
    },
    "score": market_score_0_to_100
  },
  
  "competitiveAnalysis": {
    "competitors": [
      {
        "name": "Competitor name",
        "strengths": ["Strength 1", "Strength 2", "Strength 3"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "marketShare": "Market share",
        "pricing": "Pricing strategy"
      }
    ],
    "competitiveLandscape": "Competitive landscape analysis",
    "differentiation": "Differentiation advantage",
    "competitiveAdvantage": "Core competitive advantage",
    "barrierToEntry": "Barrier to entry analysis",
    "threats": ["Threat 1", "Threat 2", "Threat 3"],
    "score": competition_score_0_to_100
  },
  
  "businessModel": {
    "revenueStreams": [
      {
        "source": "Revenue source name",
        "description": "Detailed description",
        "potential": "Revenue potential assessment"
      }
    ],
    "monetizationStrategy": "Detailed monetization model",
    "pricingModel": "Pricing strategy",
    "unitEconomics": "Unit economics analysis (CAC, LTV, etc.)",
    "profitabilityAnalysis": "Profitability analysis",
    "financialProjection": {
      "year1": "Year 1 financial projection",
      "year2": "Year 2 financial projection",
      "year3": "Year 3 financial projection"
    },
    "score": business_model_score_0_to_100
  },
  
  "executionPlan": {
    "phases": [
      {
        "phase": "Phase name",
        "duration": "Duration",
        "objectives": ["Objective 1", "Objective 2", "Objective 3"],
        "keyActivities": ["Activity 1", "Activity 2", "Activity 3"],
        "successMetrics": ["Metric 1", "Metric 2"]
      }
    ],
    "resourceRequirements": [
      {
        "category": "Resource category",
        "items": ["Specific need 1", "Specific need 2"],
        "estimatedCost": "Estimated cost"
      }
    ],
    "teamRequirements": [
      {
        "role": "Position name",
        "responsibilities": "Job responsibilities",
        "timeline": "Hiring timeline"
      }
    ],
    "fundingNeeds": "Total funding needs",
    "fundingAllocation": [
      {
        "category": "Allocation category",
        "percentage": "Percentage",
        "amount": "Amount"
      }
    ]
  },
  
  "riskAssessment": {
    "riskMatrix": [
      {
        "risk": "Risk description",
        "impact": "high/medium/low",
        "probability": "high/medium/low",
        "mitigation": "Mitigation measures",
        "contingency": "Contingency plan"
      }
    ],
    "majorRisks": ["Major risk 1", "Major risk 2"],
    "mitigationStrategies": ["Strategy 1", "Strategy 2"]
  },
  
  "overallScore": overall_score_0_to_100,
  "recommendation": "Overall recommendation (within 100 words)",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  
  "nextSteps": [
    {
      "action": "Action description",
      "priority": "immediate/short-term/long-term",
      "timeline": "Timeline"
    }
  ],
  
  "vcInsights": {
    "fundingReadiness": "Funding readiness assessment",
    "fundingStage": "Appropriate funding round",
    "attractivenessToVCs": "Investment attractiveness analysis",
    "investmentHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
    "redFlags": ["Issue 1", "Issue 2"],
    "suggestedVCs": [
      {
        "name": "VC name",
        "focus": "Investment focus",
        "typicalCheck": "Typical check size",
        "reason": "Recommendation reason"
      }
    ],
    "pitchKeyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]
  }
}
\`\`\`

---

# Important Notes

1. **Data Authenticity**: Reference real market data, industry reports, and case studies whenever possible
2. **Professional Depth**: Analysis should be in-depth, specific, and actionable, avoiding generalities
3. **Logical Rigor**: Conclusions must be supported by data, recommendations must have theoretical basis
4. **Practical Orientation**: All analyses should provide practical guidance value to entrepreneurs
5. **Completeness**: Ensure all required fields have content, arrays contain at least the minimum required number of elements

Please start generating the report now, output in pure JSON format, with no other explanatory text.`;

    const prompt = language === 'zh' ? promptChinese : promptEnglish;

    const systemMessage = language === 'zh'
      ? "你是一位世界顶级的创业分析师，拥有丰富的投资银行、咨询公司和创业孵化器经验。你的分析以数据驱动、深度专业、实用可行著称。你擅长通过有限的信息进行深度推理和专业判断，生成具有投资级别质量的分析报告。请严格按照JSON格式返回完整报告。"
      : "You are a world-class startup analyst with extensive experience in investment banking, consulting firms, and startup incubators. Your analysis is known for being data-driven, deeply professional, and practically actionable. You excel at making deep inferences and professional judgments from limited information to generate investment-grade quality analysis reports. Please strictly return the complete report in JSON format.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 6000,
      temperature: 0.3, // 降低温度以获得更专业、一致的输出
      response_format: { type: "json_object" } // 强制JSON输出
    });

    console.log('✅ OpenAI report generation completed');
    
    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('AI回复为空');
    }

    let reportData: DetailedReport;
    try {
      reportData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      console.error('AI返回内容:', aiResponse.substring(0, 500));
      throw new Error('报告生成格式错误，请重试');
    }

    // 验证必要字段
    if (!reportData.idea || typeof reportData.overallScore !== 'number') {
      console.error('报告数据不完整:', JSON.stringify(reportData).substring(0, 200));
      throw new Error('报告数据不完整');
    }

    // 确保数组字段存在且有内容（添加默认值作为后备）
    if (!reportData.strengths || reportData.strengths.length === 0) {
      reportData.strengths = ["项目具有创新性", "解决了真实痛点", "市场前景广阔"];
    }
    
    if (!reportData.improvements || reportData.improvements.length === 0) {
      reportData.improvements = ["需要进一步验证市场需求", "完善商业模式细节", "加强团队建设"];
    }

    // 确保竞争对手数据完整
    if (!reportData.competitiveAnalysis.competitors || reportData.competitiveAnalysis.competitors.length === 0) {
      reportData.competitiveAnalysis.competitors = [
        {
          name: "行业领先者",
          strengths: ["品牌知名度高", "资源充足", "技术成熟"],
          weaknesses: ["创新速度慢", "决策流程复杂"],
          marketShare: "市场份额待分析",
          pricing: "定价策略待研究"
        }
      ];
    }

    // 确保阶段规划存在
    if (!reportData.executionPlan.phases || reportData.executionPlan.phases.length === 0) {
      reportData.executionPlan.phases = [
        {
          phase: "MVP验证阶段",
          duration: "0-3个月",
          objectives: ["完成产品原型", "获得初始用户", "验证核心假设"],
          keyActivities: ["产品开发", "用户测试", "数据收集"],
          successMetrics: ["用户反馈积极度", "核心功能使用率"]
        }
      ];
    }

    // 确保风险矩阵存在
    if (!reportData.riskAssessment.riskMatrix || reportData.riskAssessment.riskMatrix.length === 0) {
      reportData.riskAssessment.riskMatrix = [
        {
          risk: "市场需求不足",
          impact: "high" as const,
          probability: "medium" as const,
          mitigation: "深入市场调研，快速迭代产品",
          contingency: "调整目标市场或产品方向"
        }
      ];
    }

    console.log('📊 Professional report generated successfully');
    console.log(`📈 Overall Score: ${reportData.overallScore}/100`);
    console.log(`🎯 Market Score: ${reportData.marketAnalysis.score}/100`);
    console.log(`⚔️ Competition Score: ${reportData.competitiveAnalysis.score}/100`);
    console.log(`💰 Business Model Score: ${reportData.businessModel.score}/100`);
    
    return { report: reportData, language: language };

  } catch (error) {
    console.error("Professional report generation error:", error);
    throw new Error(`报告生成失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}
