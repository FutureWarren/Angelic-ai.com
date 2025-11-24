// Multi-provider email service - supports SendGrid, MailerSend, SMTP2GO, SMTP, and console logging
import { MailService } from '@sendgrid/mail';
import axios from 'axios';
import type { DetailedReport } from '@shared/schema';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Email service configuration - supports multiple providers
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console'; // 'brevo', 'sendgrid', 'mailersend', 'smtp2go', 'smtp', 'console'

let mailService: MailService | undefined;

// Initialize email service based on provider
if (EMAIL_PROVIDER === 'brevo' && process.env.BREVO_API_KEY) {
  console.log('📧 Email service initialized: Brevo');
  console.log('📧 Sender:', process.env.BREVO_FROM);
} else if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('📧 Email service initialized: SendGrid');
} else if (EMAIL_PROVIDER === 'mailersend' && process.env.MAILERSEND_API_KEY) {
  console.log('📧 Email service initialized: MailerSend');
} else if (EMAIL_PROVIDER === 'smtp2go' && process.env.SMTP2GO_API_KEY) {
  console.log('📧 Email service initialized: SMTP2GO');
} else if (EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST) {
  // For other SMTP providers
  console.log('📧 Email service initialized: SMTP (not yet implemented)');
} else {
  console.log('📧 Email service initialized: Console logging only (development mode)');
  console.log('📧 To enable real email sending, set EMAIL_PROVIDER and corresponding API keys');
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (EMAIL_PROVIDER === 'brevo' && process.env.BREVO_API_KEY) {
      // Brevo provider
      if (!process.env.BREVO_FROM) {
        throw new Error('BREVO_FROM environment variable is required for Brevo');
      }
      
      console.log(`📧 Sending email via Brevo to: ${params.to}`);
      
      try {
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
          sender: {
            email: process.env.BREVO_FROM,
            name: process.env.BREVO_FROM_NAME || "Angelic AI"
          },
          to: [
            {
              email: params.to
            }
          ],
          subject: params.subject,
          htmlContent: params.html,
          textContent: params.text,
        }, {
          headers: {
            'accept': 'application/json',
            'api-key': (process.env.BREVO_API_KEY || '').trim(),
            'content-type': 'application/json',
          },
        });

        if (response.status === 201) {
          console.log(`✅ Brevo email sent successfully to ${params.to}`);
          console.log(`📧 Message ID: ${response.data.messageId}`);
          return true;
        } else {
          console.error('❌ Brevo unexpected status:', response.status);
          return false;
        }
      } catch (error: any) {
        console.error('❌ Brevo sending failed:');
        
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Response:', JSON.stringify(error.response.data, null, 2));
          
          // Handle Brevo specific errors
          if (error.response.status === 400 || error.response.status === 401) {
            throw new Error(`BREVO_ERROR: ${error.response.data.message || 'API authentication or validation error'}`);
          }
        } else {
          console.error('Error:', error.message);
        }
        
        throw error;
      }
    } else if (EMAIL_PROVIDER === 'sendgrid' && mailService) {
      // SendGrid provider - only send HTML to ensure proper rendering
      // Gmail and other clients will auto-extract text if needed
      await mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        html: params.html || params.text || '',
      });
      console.log(`✅ SendGrid email sent successfully to ${params.to}`);
      return true;
    } else if (EMAIL_PROVIDER === 'mailersend' && process.env.MAILERSEND_API_KEY) {
      // MailerSend provider
      if (!process.env.MAILERSEND_FROM) {
        throw new Error('MAILERSEND_FROM environment variable is required for MailerSend');
      }
      
      try {
        const response = await axios.post('https://api.mailersend.com/v1/email', {
          from: {
            email: process.env.MAILERSEND_FROM,
            name: process.env.MAILERSEND_FROM_NAME || "Angelic AI"
          },
          to: [
            {
              email: params.to
            }
          ],
          subject: params.subject,
          text: params.text,
          html: params.html,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`,
          },
        });

        if (response.status === 202) {
          console.log(`✅ MailerSend email sent successfully to ${params.to}`);
          console.log(`📧 Message ID: ${response.data['x-message-id']}`);
          return true;
        } else {
          console.error('❌ MailerSend unexpected status:', response.status);
          return false;
        }
      } catch (error: any) {
        console.error('❌ MailerSend sending failed:');
        
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Response:', JSON.stringify(error.response.data, null, 2));
          
          // Handle MailerSend specific errors
          if (error.response.status === 422 && error.response.data?.errors) {
            const errors = error.response.data.errors;
            
            // Check for trial account limitation by error code (more reliable than string matching)
            const hasTrialLimitation = errors.some((err: any) => 
              err.field === 'to' && (
                err.message?.includes('Trial accounts') ||
                err.message?.includes('MS42225') ||
                err.message?.includes('administrator')
              )
            );
            
            if (hasTrialLimitation) {
              console.error('❌ MailerSend trial account limitation: Can only send to administrator email');
              console.error('💡 To send to any email: Upgrade MailerSend account or verify more sender domains');
              throw new Error('MAILERSEND_TRIAL_LIMITATION: Can only send emails to administrator email address. Please upgrade your MailerSend account or send to the registered admin email.');
            }
            
            // Other MailerSend errors
            throw new Error(`MAILERSEND_ERROR: ${error.response.data.message || 'Unknown MailerSend error'}`);
          }
        } else {
          console.error('Error:', error.message);
        }
        
        throw error;
      }
    } else if (EMAIL_PROVIDER === 'smtp2go' && process.env.SMTP2GO_API_KEY) {
      // SMTP2GO provider
      const response = await axios.post('https://api.smtp2go.com/v3/email/send', {
        sender: params.from,
        to: [params.to],
        subject: params.subject,
        text_body: params.text,
        html_body: params.html,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Smtp2go-Api-Key': process.env.SMTP2GO_API_KEY,
        },
      });

      if (response.status === 200 && response.data.data?.succeeded > 0) {
        console.log(`✅ SMTP2GO email sent successfully to ${params.to}`);
        console.log(`📧 Request ID: ${response.data.request_id}`);
        return true;
      } else {
        console.error('❌ SMTP2GO sending failed:', response.data);
        return false;
      }
    } else if (EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST) {
      // SMTP provider (future implementation)
      console.log(`📧 SMTP email would be sent to ${params.to}`);
      console.log(`📧 Subject: ${params.subject}`);
      // TODO: Implement SMTP sending
      return true;
    } else {
      // Console/development mode
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL SENT (Console Mode)');
      console.log('='.repeat(80));
      console.log(`📧 To: ${params.to}`);
      console.log(`📧 From: ${params.from}`);
      console.log(`📧 Subject: ${params.subject}`);
      if (params.text) {
        console.log('\n📧 Text Content:');
        console.log(params.text);
      }
      if (params.html) {
        console.log('\n📧 HTML Content (truncated):');
        console.log(params.html?.substring(0, 500) + '...');
      }
      console.log('='.repeat(80) + '\n');
      return true;
    }
  } catch (error) {
    console.error('❌ Email sending error:', error);
    
    // For provider-specific errors, rethrow for upstream handling
    if (error instanceof Error && (
      error.message.includes('MAILERSEND_TRIAL_LIMITATION') || 
      error.message.includes('MAILERSEND_ERROR') ||
      error.message.includes('BREVO_ERROR')
    )) {
      throw error;
    }
    
    return false;
  }
}

export function generateReportHTML(report: DetailedReport, userEmail: string, language: 'zh' | 'en' = 'zh'): string {
  const priorityColors: Record<string, string> = {
    immediate: '#e74c3c',
    'short-term': '#f39c12',
    'long-term': '#27ae60'
  };

  const riskColors: Record<string, string> = {
    high: '#e74c3c',
    medium: '#f39c12',
    low: '#27ae60'
  };

  const texts = language === 'zh' ? {
    metaProject: '创业项目',
    metaDate: '报告日期',
    metaRecipient: '收件人',
    navTitle: '报告导航',
    sections: [
      { id: 'summary', title: '综合评估', icon: '📋' },
      { id: 'market', title: '市场分析', icon: '📊' },
      { id: 'competition', title: '竞争格局', icon: '⚔️' },
      { id: 'business', title: '商业模式', icon: '💰' },
      { id: 'execution', title: '执行路线', icon: '🚀' },
      { id: 'risk', title: '风险评估', icon: '⚠️' },
      { id: 'vc', title: '投资视角', icon: '🏦' },
      { id: 'action', title: '行动计划', icon: '📝' }
    ],
    overallTitle: '综合评估',
    overallScoreLabel: '综合评分',
    marketPotential: '市场潜力',
    competitiveAdvantage: '竞争优势',
    businessModel: '商业模式',
    strengthsTitle: '✨ 核心优势',
    improvementsTitle: '🎯 提升方向',
    marketAnalysisTitle: '市场分析',
    targetMarket: '🎯 目标市场',
    marketSize: '📈 市场规模',
    sizeLabel: '规模：',
    growthRateLabel: '增长率：',
    demandAnalysisLabel: '需求分析：',
    industryTrends: '🔮 行业趋势',
    userPersona: '👥 用户画像',
    demographics: '人口特征：',
    painPoints: '核心痛点：',
    behaviors: '行为模式：',
    competitionTitle: '竞争格局',
    mainCompetitors: '主要竞争对手',
    strengths: '优势 STRENGTHS',
    weaknesses: '劣势 WEAKNESSES',
    pricingStrategy: '定价策略：',
    differentiation: '🎯 差异化优势',
    barrierToEntry: '🚧 进入壁垒',
    businessModelTitle: '商业模式',
    revenueStreams: '收入来源',
    revenuePotential: '收入潜力：',
    monetizationStrategy: '💡 变现策略',
    pricingModel: '💵 定价模式',
    unitEconomics: '📊 单位经济学',
    profitability: '💰 盈利能力',
    financialProjections: '📈 财务预测',
    year: '年',
    executionPlanTitle: '执行路线',
    phases: '执行阶段',
    duration: '持续时间：',
    objectives: '目标：',
    keyActivities: '关键活动：',
    successMetrics: '成功指标：',
    resourceRequirements: '资源需求',
    estimatedCost: '预估成本：',
    teamRequirements: '团队需求',
    responsibilities: '职责：',
    timeline: '时间表：',
    fundingNeeds: '融资需求',
    totalFunding: '总需求：',
    fundingAllocation: '资金分配',
    riskAssessmentTitle: '风险评估',
    riskMatrix: '风险矩阵',
    impact: '影响：',
    probability: '概率：',
    highImpact: '高影响',
    mediumImpact: '中影响',
    lowImpact: '低影响',
    highProbability: '高概率',
    mediumProbability: '中概率',
    lowProbability: '低概率',
    mitigation: '缓解措施：',
    contingency: '应急预案：',
    vcInsightsTitle: '投资人视角',
    fundingStage: '📋 融资阶段',
    fundingReadiness: '🎯 融资准备度',
    attractiveness: '💎 投资吸引力',
    investmentHighlights: '✨ 投资亮点',
    suggestedVCs: '推荐投资机构',
    investmentFocus: '投资方向：',
    pitchKeyPoints: '🎤 Pitch Deck 关键要点',
    nextStepsTitle: '下一步行动',
    priorityImmediate: '立即执行',
    priorityShortTerm: '短期(1-3月)',
    priorityLongTerm: '长期(3-12月)',
    footerTagline: '专业创业分析平台 | Professional Startup Analysis',
    footerDescription: '为创业者提供深度洞察，助力商业成功',
    footerDisclaimer: '本报告由 Angelic AI 基于对话内容生成,仅供参考。<br>实际投资决策请结合多方面因素综合考虑,建议咨询专业顾问。<br>所有市场数据、竞争分析和财务预测均基于公开信息和行业研究。'
  } : {
    metaProject: 'Startup Project',
    metaDate: 'Report Date',
    metaRecipient: 'Recipient',
    navTitle: 'Report Navigation',
    sections: [
      { id: 'summary', title: 'Overall Assessment', icon: '📋' },
      { id: 'market', title: 'Market Analysis', icon: '📊' },
      { id: 'competition', title: 'Competitive Landscape', icon: '⚔️' },
      { id: 'business', title: 'Business Model', icon: '💰' },
      { id: 'execution', title: 'Execution Plan', icon: '🚀' },
      { id: 'risk', title: 'Risk Assessment', icon: '⚠️' },
      { id: 'vc', title: 'VC Insights', icon: '🏦' },
      { id: 'action', title: 'Action Plan', icon: '📝' }
    ],
    overallTitle: 'Overall Assessment',
    overallScoreLabel: 'Overall Score',
    marketPotential: 'Market Potential',
    competitiveAdvantage: 'Competitive Advantage',
    businessModel: 'Business Model',
    strengthsTitle: '✨ Key Strengths',
    improvementsTitle: '🎯 Areas for Improvement',
    marketAnalysisTitle: 'Market Analysis',
    targetMarket: '🎯 Target Market',
    marketSize: '📈 Market Size',
    sizeLabel: 'Size: ',
    growthRateLabel: 'Growth Rate: ',
    demandAnalysisLabel: 'Demand Analysis: ',
    industryTrends: '🔮 Industry Trends',
    userPersona: '👥 User Persona',
    demographics: 'Demographics: ',
    painPoints: 'Pain Points: ',
    behaviors: 'Behaviors: ',
    competitionTitle: 'Competitive Landscape',
    mainCompetitors: 'Main Competitors',
    strengths: 'STRENGTHS',
    weaknesses: 'WEAKNESSES',
    pricingStrategy: 'Pricing Strategy: ',
    differentiation: '🎯 Differentiation',
    barrierToEntry: '🚧 Barrier to Entry',
    businessModelTitle: 'Business Model',
    revenueStreams: 'Revenue Streams',
    revenuePotential: 'Revenue Potential: ',
    monetizationStrategy: '💡 Monetization Strategy',
    pricingModel: '💵 Pricing Model',
    unitEconomics: '📊 Unit Economics',
    profitability: '💰 Profitability',
    financialProjections: '📈 Financial Projections',
    year: 'Year',
    executionPlanTitle: 'Execution Plan',
    phases: 'Execution Phases',
    duration: 'Duration: ',
    objectives: 'Objectives: ',
    keyActivities: 'Key Activities: ',
    successMetrics: 'Success Metrics: ',
    resourceRequirements: 'Resource Requirements',
    estimatedCost: 'Estimated Cost: ',
    teamRequirements: 'Team Requirements',
    responsibilities: 'Responsibilities: ',
    timeline: 'Timeline: ',
    fundingNeeds: 'Funding Needs',
    totalFunding: 'Total Needs: ',
    fundingAllocation: 'Fund Allocation',
    riskAssessmentTitle: 'Risk Assessment',
    riskMatrix: 'Risk Matrix',
    impact: 'Impact: ',
    probability: 'Probability: ',
    highImpact: 'High Impact',
    mediumImpact: 'Medium Impact',
    lowImpact: 'Low Impact',
    highProbability: 'High Probability',
    mediumProbability: 'Medium Probability',
    lowProbability: 'Low Probability',
    mitigation: 'Mitigation: ',
    contingency: 'Contingency: ',
    vcInsightsTitle: 'VC Insights',
    fundingStage: '📋 Funding Stage',
    fundingReadiness: '🎯 Funding Readiness',
    attractiveness: '💎 Attractiveness to VCs',
    investmentHighlights: '✨ Investment Highlights',
    suggestedVCs: 'Suggested VCs',
    investmentFocus: 'Investment Focus: ',
    pitchKeyPoints: '🎤 Pitch Deck Key Points',
    nextStepsTitle: 'Next Steps',
    priorityImmediate: 'Immediate',
    priorityShortTerm: 'Short-term (1-3M)',
    priorityLongTerm: 'Long-term (3-12M)',
    footerTagline: 'Professional Startup Analysis Platform',
    footerDescription: 'Empowering Entrepreneurs with Deep Insights for Business Success',
    footerDisclaimer: 'This report is generated by Angelic AI based on conversation content and is for reference only.<br>Please consider multiple factors when making investment decisions and consult professional advisors.<br>All market data, competitive analysis, and financial projections are based on public information and industry research.'
  };
  
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Angelic AI - Professional Startup Analysis Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; line-height: 1.8; color: #2c3e50; background-color: #ecf0f1; font-size: 18px;">
    
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecf0f1;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
                    
                    <!-- Header Section -->
                    <tr>
                        <td bgcolor="#000000" style="padding: 60px 40px; text-align: center; color: #ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 48px; font-weight: 100; letter-spacing: 12px; padding-bottom: 15px; text-transform: uppercase;">ANGELIC</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 18px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">Professional Startup Analysis</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Meta Information Section -->
                    <tr>
                        <td bgcolor="#f8f9fa" style="padding: 30px 40px; border-bottom: 2px solid #e9ecef;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding: 8px 0; font-size: 16px;">
                                        <span style="color: #7f8c8d; font-weight: 500;">${texts.metaProject}</span>
                                    </td>
                                    <td align="right" style="padding: 8px 0; font-size: 16px;">
                                        <span style="color: #2c3e50; font-weight: 600;">${report.idea}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 16px;">
                                        <span style="color: #7f8c8d; font-weight: 500;">${texts.metaDate}</span>
                                    </td>
                                    <td align="right" style="padding: 8px 0; font-size: 16px;">
                                        <span style="color: #2c3e50; font-weight: 600;">${new Date().toLocaleString(locale, {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 16px;">
                                        <span style="color: #7f8c8d; font-weight: 500;">${texts.metaRecipient}</span>
                                    </td>
                                    <td align="right" style="padding: 8px 0; font-size: 16px;">
                                        <span style="color: #2c3e50; font-weight: 600;">${userEmail}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Table of Contents Section -->
                    <tr>
                        <td bgcolor="#f8f9fa" style="padding: 40px; border-bottom: 3px solid #000000;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 28px; font-weight: 700; color: #000000; padding-bottom: 25px; text-align: center;">${texts.navTitle}</td>
                                </tr>
                                ${texts.sections.map(section => `
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 15px 20px; margin: 8px 0; border-left: 4px solid #000000; border-radius: 8px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 24px; padding-bottom: 5px;">${section.icon}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 16px; font-weight: 600; color: #2c3e50;">${section.title}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="8"></td></tr>
                                `).join('')}
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content Section -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                
                                <!-- 综合评估 Section -->
                                <tr>
                                    <td bgcolor="#1a1a1a" style="padding: 25px 30px; margin-bottom: 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 36px; color: #ffffff; padding-right: 15px;">📋</td>
                                                <td style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${texts.overallTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                <!-- Score Hero -->
                                <tr>
                                    <td bgcolor="#000000" style="padding: 50px 40px; text-align: center; border-radius: 12px; color: #ffffff;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 80px; font-weight: 700; line-height: 1; padding-bottom: 15px;">
                                                    ${report.overallScore}<span style="font-size: 40px; opacity: 0.6; font-weight: 300;">/100</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 22px; letter-spacing: 2px; padding-bottom: 20px;">${texts.overallScoreLabel}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 18px; line-height: 1.7;">${report.recommendation}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                <!-- Metrics Cards -->
                                <tr>
                                    <td>
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="33%" valign="top" style="padding-right: 10px;">
                                                    <table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f8f9fa" style="border: 2px solid #e9ecef; border-radius: 12px; text-align: center;">
                                                        <tr>
                                                            <td style="font-size: 42px; font-weight: 700; color: #000000; padding-bottom: 10px;">${report.marketAnalysis.score}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-size: 16px; color: #7f8c8d; font-weight: 500;">${texts.marketPotential}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="33%" valign="top" style="padding: 0 5px;">
                                                    <table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f8f9fa" style="border: 2px solid #e9ecef; border-radius: 12px; text-align: center;">
                                                        <tr>
                                                            <td style="font-size: 42px; font-weight: 700; color: #000000; padding-bottom: 10px;">${report.competitiveAnalysis.score}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-size: 16px; color: #7f8c8d; font-weight: 500;">${texts.competitiveAdvantage}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="33%" valign="top" style="padding-left: 10px;">
                                                    <table width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#f8f9fa" style="border: 2px solid #e9ecef; border-radius: 12px; text-align: center;">
                                                        <tr>
                                                            <td style="font-size: 42px; font-weight: 700; color: #000000; padding-bottom: 10px;">${report.businessModel.score}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-size: 16px; color: #7f8c8d; font-weight: 500;">${texts.businessModel}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                ${report.strengths && report.strengths.length > 0 ? `
                                <tr>
                                    <td bgcolor="#e8f8f5" style="padding: 25px 30px; border-left: 5px solid #27ae60; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.strengthsTitle}</td>
                                            </tr>
                                            ${report.strengths.map(s => `
                                            <tr>
                                                <td style="padding: 10px 0 10px 25px; font-size: 17px; line-height: 1.7;">
                                                    <span style="color: #3498db; font-weight: 700; padding-right: 10px;">●</span>${s}
                                                </td>
                                            </tr>
                                            `).join('')}
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                ${report.improvements && report.improvements.length > 0 ? `
                                <tr>
                                    <td bgcolor="#fef9e7" style="padding: 25px 30px; border-left: 5px solid #f39c12; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.improvementsTitle}</td>
                                            </tr>
                                            ${report.improvements.map(i => `
                                            <tr>
                                                <td style="padding: 10px 0 10px 25px; font-size: 17px; line-height: 1.7;">
                                                    <span style="color: #3498db; font-weight: 700; padding-right: 10px;">●</span>${i}
                                                </td>
                                            </tr>
                                            `).join('')}
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                <tr><td height="50"></td></tr>
                                
                                <!-- 市场分析 Section -->
                                <tr>
                                    <td bgcolor="#1a1a1a" style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 36px; color: #ffffff; padding-right: 15px;">📊</td>
                                                <td style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${texts.marketAnalysisTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 5px solid #3498db; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.targetMarket}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.marketAnalysis.targetMarket}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                <tr>
                                    <td bgcolor="#f4ecf7" style="padding: 25px 30px; border-left: 5px solid #9b59b6; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.marketSize}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${texts.sizeLabel}</strong>${report.marketAnalysis.marketSize}</td>
                                            </tr>
                                            ${report.marketAnalysis.marketGrowthRate ? `
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${texts.growthRateLabel}</strong>${report.marketAnalysis.marketGrowthRate}</td>
                                            </tr>
                                            ` : ''}
                                            ${report.marketAnalysis.demandAnalysis ? `
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${texts.demandAnalysisLabel}</strong>${report.marketAnalysis.demandAnalysis}</td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                ${report.marketAnalysis.industryTrends && report.marketAnalysis.industryTrends.length > 0 ? `
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 5px solid #3498db; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.industryTrends}</td>
                                            </tr>
                                            ${report.marketAnalysis.industryTrends.map(trend => `
                                            <tr>
                                                <td style="padding: 10px 0 10px 25px; font-size: 17px; line-height: 1.7;">
                                                    <span style="color: #3498db; font-weight: 700; padding-right: 10px;">●</span>${trend}
                                                </td>
                                            </tr>
                                            `).join('')}
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                ${report.marketAnalysis.userPersona ? `
                                <tr>
                                    <td bgcolor="#e8f8f5" style="padding: 25px 30px; border-left: 5px solid #27ae60; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.userPersona}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${texts.demographics}</strong>${report.marketAnalysis.userPersona.demographics}</td>
                                            </tr>
                                            ${report.marketAnalysis.userPersona.painPoints && report.marketAnalysis.userPersona.painPoints.length > 0 ? `
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${texts.painPoints}</strong></td>
                                            </tr>
                                            ${report.marketAnalysis.userPersona.painPoints.map(p => `
                                            <tr>
                                                <td style="padding: 10px 0 10px 25px; font-size: 17px; line-height: 1.7;">
                                                    <span style="color: #3498db; font-weight: 700; padding-right: 10px;">●</span>${p}
                                                </td>
                                            </tr>
                                            `).join('')}
                                            ` : ''}
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${texts.behaviors}</strong>${report.marketAnalysis.userPersona.behaviors}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                <tr><td height="50"></td></tr>
                                
                                <!-- 竞争格局 Section -->
                                <tr>
                                    <td bgcolor="#1a1a1a" style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 36px; color: #ffffff; padding-right: 15px;">⚔️</td>
                                                <td style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${texts.competitionTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 5px solid #3498db; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7;">${report.competitiveAnalysis.competitiveLandscape}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                ${report.competitiveAnalysis.competitors && report.competitiveAnalysis.competitors.length > 0 ? `
                                <tr>
                                    <td style="font-size: 24px; font-weight: 700; color: #2c3e50; padding: 30px 0 20px 0;">${texts.mainCompetitors}</td>
                                </tr>
                                ${report.competitiveAnalysis.competitors.map(comp => `
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 30px; border: 3px solid #ecf0f1; border-radius: 12px; margin-bottom: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-bottom: 20px; border-bottom: 2px solid #ecf0f1;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 24px; font-weight: 700; color: #2c3e50;">${comp.name}</td>
                                                            <td align="right" bgcolor="#3498db" style="padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 600; color: #ffffff;">${comp.marketShare}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr><td height="15"></td></tr>
                                            <tr>
                                                <td>
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td width="48%" valign="top" bgcolor="#d5f4e6" style="padding: 18px; border: 2px solid #27ae60; border-radius: 10px;">
                                                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                                    <tr>
                                                                        <td style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e7e34; padding-bottom: 10px;">${texts.strengths}</td>
                                                                    </tr>
                                                                    ${comp.strengths.map(s => `
                                                                    <tr>
                                                                        <td style="padding: 8px 0 8px 20px; font-size: 16px; line-height: 1.6;">
                                                                            <span style="color: #27ae60; font-weight: 700; padding-right: 8px;">●</span>${s}
                                                                        </td>
                                                                    </tr>
                                                                    `).join('')}
                                                                </table>
                                                            </td>
                                                            <td width="4%"></td>
                                                            <td width="48%" valign="top" bgcolor="#fadbd8" style="padding: 18px; border: 2px solid #e74c3c; border-radius: 10px;">
                                                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                                    <tr>
                                                                        <td style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c0392b; padding-bottom: 10px;">${texts.weaknesses}</td>
                                                                    </tr>
                                                                    ${comp.weaknesses.map(w => `
                                                                    <tr>
                                                                        <td style="padding: 8px 0 8px 20px; font-size: 16px; line-height: 1.6;">
                                                                            <span style="color: #e74c3c; font-weight: 700; padding-right: 8px;">●</span>${w}
                                                                        </td>
                                                                    </tr>
                                                                    `).join('')}
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr><td height="15"></td></tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7;"><strong>${texts.pricingStrategy}</strong>${comp.pricing}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                `).join('')}
                                ` : ''}
                                
                                <tr>
                                    <td bgcolor="#e8f8f5" style="padding: 25px 30px; border-left: 5px solid #27ae60; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.differentiation}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.competitiveAnalysis.differentiation}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                ${report.competitiveAnalysis.barrierToEntry ? `
                                <tr>
                                    <td bgcolor="#f4ecf7" style="padding: 25px 30px; border-left: 5px solid #9b59b6; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.barrierToEntry}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.competitiveAnalysis.barrierToEntry}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                <tr><td height="50"></td></tr>
                                
                                <!-- 商业模式 Section -->
                                <tr>
                                    <td bgcolor="#1a1a1a" style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 36px; color: #ffffff; padding-right: 15px;">💰</td>
                                                <td style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${texts.businessModelTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                ${report.businessModel.revenueStreams && report.businessModel.revenueStreams.length > 0 ? `
                                <tr>
                                    <td style="font-size: 24px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.revenueStreams}</td>
                                </tr>
                                ${report.businessModel.revenueStreams.map(stream => `
                                <tr>
                                    <td bgcolor="#f8f9fa" style="padding: 25px 30px; border-left: 5px solid #27ae60; border-radius: 0 10px 10px 0; margin-bottom: 15px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 12px;">${stream.source}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; color: #2c3e50; padding: 10px 0;">${stream.description}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 16px; color: #7f8c8d; padding: 5px 0;"><strong>${texts.revenuePotential}</strong>${stream.potential}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="15"></td></tr>
                                `).join('')}
                                ` : ''}
                                
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 5px solid #3498db; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.monetizationStrategy}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.businessModel.monetizationStrategy}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 5px solid #3498db; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.pricingModel}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.businessModel.pricingModel}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                ${report.businessModel.unitEconomics ? `
                                <tr>
                                    <td bgcolor="#f4ecf7" style="padding: 25px 30px; border-left: 5px solid #9b59b6; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.unitEconomics}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.businessModel.unitEconomics}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                ${report.businessModel.financialProjection ? `
                                <tr>
                                    <td bgcolor="#e8f8f5" style="padding: 25px 30px; border-left: 5px solid #27ae60; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.financialProjections}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${language === 'zh' ? '第一' : 'Year 1'}${texts.year}：</strong>${report.businessModel.financialProjection.year1}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${language === 'zh' ? '第二' : 'Year 2'}${texts.year}：</strong>${report.businessModel.financialProjection.year2}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${language === 'zh' ? '第三' : 'Year 3'}${texts.year}：</strong>${report.businessModel.financialProjection.year3}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                <tr><td height="50"></td></tr>
                                
                                <!-- 执行路线 Section -->
                                <tr>
                                    <td bgcolor="#1a1a1a" style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 36px; color: #ffffff; padding-right: 15px;">🚀</td>
                                                <td style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${texts.executionPlanTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                <tr>
                                    <td bgcolor="#f4ecf7" style="padding: 25px 30px; border-left: 5px solid #9b59b6; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">💰 ${texts.fundingNeeds}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.executionPlan.fundingNeeds}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                ${report.executionPlan.fundingAllocation && report.executionPlan.fundingAllocation.length > 0 ? `
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 5px solid #3498db; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">💸 ${texts.fundingAllocation}</td>
                                            </tr>
                                            ${report.executionPlan.fundingAllocation.map(alloc => `
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;"><strong>${alloc.category}：</strong>${alloc.percentage} (${alloc.amount})</td>
                                            </tr>
                                            `).join('')}
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                ${report.executionPlan.phases && report.executionPlan.phases.length > 0 ? `
                                <tr>
                                    <td style="font-size: 24px; font-weight: 700; color: #2c3e50; padding: 40px 0 20px 0;">${texts.phases}</td>
                                </tr>
                                ${report.executionPlan.phases.map((phase, idx) => `
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 30px; border: 3px solid #ecf0f1; border-radius: 12px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-bottom: 25px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 26px; font-weight: 700; color: #2c3e50;">${language === 'zh' ? '阶段' : 'Phase'} ${idx + 1}: ${phase.phase}</td>
                                                            <td align="right" bgcolor="#000000" style="padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; color: #ffffff;">${phase.duration}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            
                                            ${phase.objectives && phase.objectives.length > 0 ? `
                                            <tr>
                                                <td style="padding: 20px 0;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 18px; font-weight: 600; color: #2c3e50; padding-bottom: 12px;">${language === 'zh' ? '核心目标' : 'Core Objectives'}</td>
                                                        </tr>
                                                        ${phase.objectives.map(obj => `
                                                        <tr>
                                                            <td bgcolor="#e8f8f5" style="padding: 14px 20px; margin: 10px 0; border-left: 3px solid #27ae60; border-radius: 8px; font-size: 17px; line-height: 1.7;">
                                                                <span style="color: #27ae60; font-weight: 700; font-size: 20px; padding-right: 12px;">✓</span>${obj}
                                                            </td>
                                                        </tr>
                                                        <tr><td height="10"></td></tr>
                                                        `).join('')}
                                                    </table>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            
                                            ${phase.keyActivities && phase.keyActivities.length > 0 ? `
                                            <tr>
                                                <td style="padding: 20px 0;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 18px; font-weight: 600; color: #2c3e50; padding-bottom: 12px;">${language === 'zh' ? '关键活动' : 'Key Activities'}</td>
                                                        </tr>
                                                        ${phase.keyActivities.map(act => `
                                                        <tr>
                                                            <td style="padding: 10px 0 10px 25px; font-size: 17px; line-height: 1.7;">
                                                                <span style="color: #3498db; font-weight: 700; padding-right: 10px;">●</span>${act}
                                                            </td>
                                                        </tr>
                                                        `).join('')}
                                                    </table>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            
                                            ${phase.successMetrics && phase.successMetrics.length > 0 ? `
                                            <tr>
                                                <td style="padding: 20px 0;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 18px; font-weight: 600; color: #2c3e50; padding-bottom: 12px;">${language === 'zh' ? '成功指标' : 'Success Metrics'}</td>
                                                        </tr>
                                                        ${phase.successMetrics.map(metric => `
                                                        <tr>
                                                            <td style="padding: 10px 0 10px 25px; font-size: 17px; line-height: 1.7;">
                                                                <span style="color: #3498db; font-weight: 700; padding-right: 10px;">●</span>${metric}
                                                            </td>
                                                        </tr>
                                                        `).join('')}
                                                    </table>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="25"></td></tr>
                                `).join('')}
                                ` : ''}
                                
                                <tr><td height="50"></td></tr>
                                
                                <!-- 风险评估 Section -->
                                <tr>
                                    <td bgcolor="#1a1a1a" style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 36px; color: #ffffff; padding-right: 15px;">⚠️</td>
                                                <td style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${texts.riskAssessmentTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                ${report.riskAssessment.riskMatrix && report.riskAssessment.riskMatrix.length > 0 ? `
                                <tr>
                                    <td style="font-size: 24px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.riskMatrix}</td>
                                </tr>
                                ${report.riskAssessment.riskMatrix.map(risk => `
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px; border: 3px solid #ecf0f1; border-radius: 12px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-bottom: 18px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 19px; font-weight: 700; color: #2c3e50; width: 70%;">${risk.risk}</td>
                                                            <td align="right" style="width: 30%;">
                                                                <table cellpadding="0" cellspacing="0" border="0">
                                                                    <tr>
                                                                        <td bgcolor="${riskColors[risk.impact]}" style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 700; color: #ffffff; text-align: center; margin-bottom: 6px;">
                                                                            ${risk.impact === 'high' ? texts.highImpact : risk.impact === 'medium' ? texts.mediumImpact : texts.lowImpact}
                                                                        </td>
                                                                    </tr>
                                                                    <tr><td height="6"></td></tr>
                                                                    <tr>
                                                                        <td bgcolor="${riskColors[risk.probability]}" style="padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 700; color: #ffffff; text-align: center;">
                                                                            ${risk.probability === 'high' ? texts.highProbability : risk.probability === 'medium' ? texts.mediumProbability : texts.lowProbability}
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-top: 18px; border-top: 2px solid #ecf0f1;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 16px; line-height: 1.7; padding: 10px 0;"><strong>${texts.mitigation}</strong>${risk.mitigation}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-size: 16px; line-height: 1.7; padding: 10px 0;"><strong>${texts.contingency}</strong>${risk.contingency}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                `).join('')}
                                ` : ''}
                                
                                <tr><td height="50"></td></tr>
                                
                                <!-- 投资视角 Section -->
                                <tr>
                                    <td bgcolor="#1a1a1a" style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 36px; color: #ffffff; padding-right: 15px;">🏦</td>
                                                <td style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${texts.vcInsightsTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 5px solid #3498db; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.fundingStage}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.vcInsights.fundingStage || '种子轮/天使轮'}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 5px solid #3498db; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.fundingReadiness}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.vcInsights.fundingReadiness}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                <tr>
                                    <td bgcolor="#f4ecf7" style="padding: 25px 30px; border-left: 5px solid #9b59b6; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.attractiveness}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 10px 0;">${report.vcInsights.attractivenessToVCs}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                
                                ${report.vcInsights.investmentHighlights && report.vcInsights.investmentHighlights.length > 0 ? `
                                <tr>
                                    <td bgcolor="#e8f8f5" style="padding: 25px 30px; border-left: 5px solid #27ae60; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.investmentHighlights}</td>
                                            </tr>
                                            ${report.vcInsights.investmentHighlights.map(h => `
                                            <tr>
                                                <td style="padding: 10px 0 10px 25px; font-size: 17px; line-height: 1.7;">
                                                    <span style="color: #3498db; font-weight: 700; padding-right: 10px;">●</span>${h}
                                                </td>
                                            </tr>
                                            `).join('')}
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                ${report.vcInsights.suggestedVCs && report.vcInsights.suggestedVCs.length > 0 ? `
                                <tr>
                                    <td style="font-size: 24px; font-weight: 700; color: #2c3e50; padding: 40px 0 20px 0;">${texts.suggestedVCs}</td>
                                </tr>
                                ${report.vcInsights.suggestedVCs.map(vc => `
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 30px; border: 3px solid #ecf0f1; border-radius: 12px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-bottom: 15px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 22px; font-weight: 700; color: #2c3e50;">${vc.name}</td>
                                                            <td align="right" bgcolor="#27ae60" style="padding: 8px 18px; border-radius: 8px; font-size: 15px; font-weight: 700; color: #ffffff;">${vc.typicalCheck}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; padding: 12px 0;"><strong>${texts.investmentFocus}</strong>${vc.focus}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 17px; line-height: 1.7; color: #7f8c8d; padding: 5px 0;">${vc.reason}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                `).join('')}
                                ` : ''}
                                
                                ${report.vcInsights.pitchKeyPoints && report.vcInsights.pitchKeyPoints.length > 0 ? `
                                <tr>
                                    <td bgcolor="#fef9e7" style="padding: 25px 30px; border-left: 5px solid #f39c12; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #2c3e50; padding-bottom: 15px;">${texts.pitchKeyPoints}</td>
                                            </tr>
                                            ${report.vcInsights.pitchKeyPoints.map(p => `
                                            <tr>
                                                <td style="padding: 10px 0 10px 25px; font-size: 17px; line-height: 1.7;">
                                                    <span style="color: #3498db; font-weight: 700; padding-right: 10px;">●</span>${p}
                                                </td>
                                            </tr>
                                            `).join('')}
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="20"></td></tr>
                                ` : ''}
                                
                                <tr><td height="50"></td></tr>
                                
                                <!-- 行动计划 Section -->
                                <tr>
                                    <td bgcolor="#1a1a1a" style="padding: 25px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 36px; color: #ffffff; padding-right: 15px;">📝</td>
                                                <td style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">${texts.nextStepsTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="30"></td></tr>
                                
                                ${report.nextSteps && report.nextSteps.length > 0 ? report.nextSteps.map((step, idx) => `
                                <tr>
                                    <td bgcolor="#ffffff" style="padding: 25px 30px; border-left: 6px solid ${priorityColors[step.priority] || '#3498db'}; border-radius: 0 10px 10px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-bottom: 10px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 19px; font-weight: 600; color: #2c3e50; width: 70%;">${idx + 1}. ${step.action}</td>
                                                            <td align="right" bgcolor="${priorityColors[step.priority] || '#3498db'}" style="padding: 7px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; color: #ffffff; width: 30%;">
                                                                ${step.priority === 'immediate' ? texts.priorityImmediate : step.priority === 'short-term' ? texts.priorityShortTerm : texts.priorityLongTerm}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 16px; color: #7f8c8d; padding-top: 5px;">⏱️ ${step.timeline}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td height="18"></td></tr>
                                `).join('') : ''}
                                
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer Section -->
                    <tr>
                        <td bgcolor="#000000" style="padding: 50px 40px; text-align: center; color: #ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 32px; font-weight: 100; letter-spacing: 6px; padding-bottom: 20px;">ANGELIC</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 16px; opacity: 0.8; padding: 12px 0; line-height: 1.6;">${texts.footerTagline}</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 16px; opacity: 0.8; padding: 12px 0; line-height: 1.6;">${texts.footerDescription}</td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 35px; border-top: 1px solid rgba(255,255,255,0.2); margin-top: 35px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 14px; opacity: 0.6; line-height: 1.8; padding-top: 5px;">
                                                    ${texts.footerDisclaimer}<br>
                                                    © ${new Date().getFullYear()} Angelic AI. All rights reserved.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
  `;
}

// Send report ready notification with link
export async function sendReportNotification(
  userEmail: string,
  reportId: string,
  reportLink: string,
  language: 'zh' | 'en' = 'zh'
): Promise<boolean> {
  const texts = language === 'zh' ? {
    subject: '您的Angelic分析报告已生成 ✨',
    greeting: '您好！',
    message1: '您在 Angelic 上请求的创业分析报告已经生成完成。',
    message2: '点击下方按钮即可查看完整的专业分析报告：',
    buttonText: '查看我的报告',
    validityNote: '温馨提示：此链接长期有效，您可以随时查看或分享给他人。',
    footerText: 'Angelic | 让每个想法都被认真对待',
    footerDisclaimer: '这是一封自动发送的邮件，请勿直接回复。'
  } : {
    subject: 'Your Angelic Analysis Report is Ready ✨',
    greeting: 'Hello!',
    message1: 'Your startup analysis report requested on Angelic has been successfully generated.',
    message2: 'Click the button below to view your complete professional analysis report:',
    buttonText: 'View My Report',
    validityNote: 'Note: This link is permanently valid. You can view or share it anytime.',
    footerText: 'Angelic | Every idea deserves to be taken seriously',
    footerDisclaimer: 'This is an automated email. Please do not reply directly.'
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td bgcolor="#000000" style="padding: 40px 30px; text-align: center;">
                            <div style="font-size: 36px; font-weight: 100; letter-spacing: 8px; color: #ffffff;">ANGELIC</div>
                            <div style="font-size: 14px; font-weight: 300; letter-spacing: 2px; color: #ffffff; margin-top: 10px;">STARTUP ANALYSIS</div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0;">${texts.greeting}</p>
                            
                            <p style="font-size: 16px; line-height: 1.6; color: #666666; margin: 0 0 15px 0;">
                                ${texts.message1}
                            </p>
                            
                            <p style="font-size: 16px; line-height: 1.6; color: #666666; margin: 0 0 30px 0;">
                                ${texts.message2}
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="${reportLink}" style="display: inline-block; padding: 16px 48px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; letter-spacing: 1px;">${texts.buttonText}</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-size: 14px; line-height: 1.6; color: #999999; margin: 30px 0 0 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                                💡 ${texts.validityNote}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td bgcolor="#f8f9fa" style="padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="font-size: 14px; font-weight: 600; color: #333333; margin: 0 0 10px 0;">${texts.footerText}</p>
                            <p style="font-size: 12px; color: #999999; margin: 0;">${texts.footerDisclaimer}</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;

  const from = process.env.SENDGRID_FROM || process.env.MAILERSEND_FROM || process.env.BREVO_FROM || 'noreply@angelic.ai';

  return await sendEmail({
    to: userEmail,
    from,
    subject: texts.subject,
    html,
    text: `${texts.greeting}\n\n${texts.message1}\n\n${texts.message2}\n\n${reportLink}\n\n${texts.validityNote}\n\n${texts.footerText}\n${texts.footerDisclaimer}`
  });
}

// Send password reset email
export async function sendPasswordResetEmail(
  userEmail: string,
  resetLink: string,
  language: 'zh' | 'en' = 'zh'
): Promise<boolean> {
  const texts = language === 'zh' ? {
    subject: '重置您的 Angelic 密码 🔐',
    greeting: '您好！',
    message1: '我们收到了您的密码重置请求。',
    message2: '请点击下方按钮重置您的密码：',
    buttonText: '重置密码',
    validityNote: '温馨提示：此链接将在 15 分钟后失效，请尽快完成密码重置。',
    ignoreNote: '如果您没有请求重置密码，请忽略此邮件。',
    footerText: 'Angelic | 让每个想法都被认真对待',
    footerDisclaimer: '这是一封自动发送的邮件，请勿直接回复。'
  } : {
    subject: 'Reset Your Angelic Password 🔐',
    greeting: 'Hello!',
    message1: 'We received a request to reset your password.',
    message2: 'Click the button below to reset your password:',
    buttonText: 'Reset Password',
    validityNote: 'Note: This link will expire in 15 minutes. Please complete the password reset promptly.',
    ignoreNote: 'If you did not request a password reset, please ignore this email.',
    footerText: 'Angelic | Every idea deserves to be taken seriously',
    footerDisclaimer: 'This is an automated email. Please do not reply directly.'
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td bgcolor="#000000" style="padding: 40px 30px; text-align: center;">
                            <div style="font-size: 36px; font-weight: 100; letter-spacing: 8px; color: #ffffff;">ANGELIC</div>
                            <div style="font-size: 14px; font-weight: 300; letter-spacing: 2px; color: #ffffff; margin-top: 10px;">STARTUP ANALYSIS</div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0;">${texts.greeting}</p>
                            
                            <p style="font-size: 16px; line-height: 1.6; color: #666666; margin: 0 0 15px 0;">
                                ${texts.message1}
                            </p>
                            
                            <p style="font-size: 16px; line-height: 1.6; color: #666666; margin: 0 0 30px 0;">
                                ${texts.message2}
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="${resetLink}" style="display: inline-block; padding: 16px 48px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; letter-spacing: 1px;">${texts.buttonText}</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-size: 14px; line-height: 1.6; color: #999999; margin: 30px 0 0 0; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                                ⚠️ ${texts.validityNote}
                            </p>
                            
                            <p style="font-size: 14px; line-height: 1.6; color: #999999; margin: 20px 0 0 0;">
                                ${texts.ignoreNote}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td bgcolor="#f8f9fa" style="padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="font-size: 14px; font-weight: 600; color: #333333; margin: 0 0 10px 0;">${texts.footerText}</p>
                            <p style="font-size: 12px; color: #999999; margin: 0;">${texts.footerDisclaimer}</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;

  const from = process.env.SENDGRID_FROM || process.env.MAILERSEND_FROM || process.env.BREVO_FROM || 'noreply@angelic.ai';

  return await sendEmail({
    to: userEmail,
    from,
    subject: texts.subject,
    html,
    text: `${texts.greeting}\n\n${texts.message1}\n\n${texts.message2}\n\n${resetLink}\n\n${texts.validityNote}\n\n${texts.ignoreNote}\n\n${texts.footerText}\n${texts.footerDisclaimer}`
  });
}

export function getEmailServiceInstructions(): string {
  return `
# 邮件服务配置指南

现支持多个邮件服务商，选择其一配置即可：

🥇 MailerSend (推荐 - 最优免费额度)
- 注册：https://www.mailersend.com/
- 免费额度：3,000封/月，12,000封/年
- 设置环境变量：
  EMAIL_PROVIDER=mailersend
  MAILERSEND_API_KEY=your_api_key
  MAILERSEND_FROM=noreply@yourdomain.com

🥈 Brevo (推荐 - 每日额度高)
- 注册：https://www.brevo.com/
- 免费额度：300封/天，9,000封/月
- 设置环境变量：
  EMAIL_PROVIDER=brevo
  BREVO_API_KEY=your_api_key
  BREVO_FROM=noreply@yourdomain.com

🥉 SMTP2GO
- 注册：https://www.smtp2go.com/pricing
- 免费额度：1,000封邮件/月
- 设置环境变量：
  EMAIL_PROVIDER=smtp
  SMTP_HOST=smtp.mailersend.com
  SMTP_PORT=587
  SMTP_USER=your_username
  SMTP_PASS=your_password

🥉 SendGrid
- 注册：https://sendgrid.com
- 设置环境变量：
  EMAIL_PROVIDER=sendgrid
  SENDGRID_API_KEY=your_api_key
- 注意：已无免费额度

如果暂时不设置邮件服务，系统将在控制台显示邮件内容（开发模式）。
  `;
}
