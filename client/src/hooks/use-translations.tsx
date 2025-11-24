import { useCallback } from "react";
import { useLanguage } from "@/components/language-provider"

export type TranslationKey = 
  | "site.title"
  | "site.subtitle"
  | "nav.about"
  | "nav.experience"
  | "nav.admin"
  | "nav.back-home"
  | "nav.analysis-report"
  | "nav.new-conversation"
  | "nav.login"
  | "nav.logout"
  | "nav.feedback"
  | "hero.title.inspire"
  | "hero.title.analyze" 
  | "hero.title.grow"
  | "hero.subtitle"
  | "hero.learn-more"
  | "mission.title"
  | "mission.subtitle"
  | "mission.point1.title"
  | "mission.point1.desc"
  | "mission.point2.title"
  | "mission.point2.desc"
  | "mission.point3.title"
  | "mission.point3.desc"
  | "features.title"
  | "features.subtitle"
  | "features.ai.title"
  | "features.ai.desc"
  | "features.market.title"
  | "features.market.desc"
  | "features.personalized.title"
  | "features.personalized.desc"
  | "features.actionable.title"
  | "features.actionable.desc"
  | "features.team.title"
  | "features.team.desc"
  | "features.innovation.title"
  | "features.innovation.desc"
  | "features.risk.title"
  | "features.risk.desc"
  | "features.research.title"
  | "features.research.desc"
  | "process.title"
  | "process.subtitle"
  | "process.step1.title"
  | "process.step1.desc"
  | "process.step2.title"
  | "process.step2.desc"
  | "process.step3.title"
  | "process.step3.desc"
  | "cta.title"
  | "cta.subtitle"
  | "cta.button"
  | "angelic-report.title"
  | "angelic-report.subtitle"
  | "angelic-report.feature1.title"
  | "angelic-report.feature1.desc"
  | "angelic-report.feature2.title"
  | "angelic-report.feature2.desc"
  | "angelic-report.feature3.title"
  | "angelic-report.feature3.desc"
  | "angelic-report.feature4.title"
  | "angelic-report.feature4.desc"
  | "angelic-report.feature5.title"
  | "angelic-report.feature5.desc"
  | "angelic-report.feature6.title"
  | "angelic-report.feature6.desc"
  | "why-choose.title"
  | "why-choose.subtitle"
  | "why-choose.point1.title"
  | "why-choose.point1.desc"
  | "why-choose.point2.title"
  | "why-choose.point2.desc"
  | "why-choose.point3.title"
  | "why-choose.point3.desc"
  | "why-choose.point4.title"
  | "why-choose.point4.desc"
  | "auth.login.title"
  | "auth.login.subtitle"
  | "auth.login.email"
  | "auth.login.password"
  | "auth.login.button"
  | "auth.login.no-account"
  | "auth.login.register-link"
  | "auth.login.or-continue-with"
  | "auth.login.replit-auth"
  | "auth.register.title"
  | "auth.register.subtitle"
  | "auth.register.email"
  | "auth.register.password"
  | "auth.register.firstName"
  | "auth.register.lastName"
  | "auth.register.button"
  | "auth.register.have-account"
  | "auth.register.login-link"
  | "auth.error.email-required"
  | "auth.error.email-invalid"
  | "auth.error.password-required"
  | "auth.error.password-min"
  | "auth.error.email-exists"
  | "auth.error.invalid-credentials"
  | "auth.error.registration-failed"
  | "auth.error.login-failed"
  // About页面翻译
  | "about.title"
  | "about.meta"
  | "about.hero.title"
  | "about.hero.subtitle"
  | "about.story.title"
  | "about.story.p1"
  | "about.story.p2"
  | "about.story.p3"
  | "about.mission.title"
  | "about.mission.subtitle"
  | "about.mission.content.p1"
  | "about.mission.content.p2"
  | "about.mission.content.p3"
  | "about.mission.card.title"
  | "about.mission.card.item1"
  | "about.mission.card.item2"
  | "about.mission.card.item3"
  | "about.mission.card.item4"
  | "about.why.title"
  | "about.why.p1"
  | "about.why.p2"
  | "about.why.p3"
  | "about.why.card.title"
  | "about.why.card.quote"
  | "about.why.card.bottom"
  | "about.cta.title"
  | "about.cta.subtitle"
  | "about.cta.button"
  | "about.cta.note"
  | "about.footer.home"
  | "about.footer.admin"
  | "about.footer.copyright"
  // Chat页面翻译
  | "chat.title"
  | "chat.meta"
  | "chat.header.title"
  | "chat.header.subtitle"
  | "chat.welcome.tagline"
  | "chat.welcome.title"
  | "chat.welcome.subtitle"
  | "chat.interface.assistant-name"
  | "chat.interface.assistant-desc"
  | "chat.interface.welcome"
  | "chat.interface.welcome-desc"
  | "chat.interface.placeholder"
  | "chat.interface.send-hint"
  | "chat.interface.follow-up-hint"
  | "chat.errors.network"
  | "chat.errors.network-desc"
  | "chat.errors.server"
  | "chat.errors.server-desc"
  | "chat.errors.input"
  | "chat.errors.input-desc"
  | "chat.errors.ai-unavailable"
  | "chat.errors.ai-unavailable-desc"
  | "chat.errors.general"
  | "chat.errors.general-desc"
  | "chat.conversation-loaded"
  | "chat.conversation-loaded-desc"
  | "chat.errors.load-conversation"
  | "chat.errors.load-conversation-desc"
  | "chat.untitled-conversation"
  | "chat.no-conversations"
  // AI Partner角色相关翻译
  | "persona.consultant.name"
  | "persona.consultant.desc"
  | "persona.customer.name"
  | "persona.customer.desc"
  | "persona.switch.tooltip"
  // 报告相关翻译
  | "report.title"
  | "report.description"
  | "report.empty.title"
  | "report.empty.description"
  | "report.content.title"
  | "report.content.market"
  | "report.content.competition"
  | "report.content.actionable"
  | "report.content.business-model"
  | "report.content.risk"
  | "report.content.investor"
  | "report.requested.title"
  | "report.requested.description"
  | "report.requested.time"
  | "report.available.title"
  | "report.available.description"
  | "report.features.market-analysis"
  | "report.features.competition-analysis"
  | "report.features.business-plan"
  | "report.features.investor-advice"
  | "report.button.request"
  | "report.button.generate"
  | "report.generating"
  | "report.generating.status1"
  | "report.generating.status2"
  | "report.generating.status3"
  | "report.generating.status4"
  | "report.generating.status5"
  | "report.dialog.title"
  | "report.dialog.description"
  | "report.dialog.placeholder"
  | "report.dialog.info"
  | "report.dialog.cancel"
  | "report.dialog.submit"
  | "report.errors.need-conversation"
  | "report.errors.need-conversation-desc"
  | "report.errors.empty-email"
  | "report.errors.empty-email-desc"
  | "report.errors.invalid-email"
  | "report.errors.invalid-email-desc"
  | "report.errors.request-failed"
  | "report.errors.request-failed-desc"
  | "report.success.title"
  | "report.success.description"

const translations = {
  zh: {
    "site.title": "Angelic - AI创业智能分析平台",
    "site.subtitle": "将创意转化为现实",
    "nav.about": "关于Angelic",
    "nav.experience": "开始体验",
    "nav.admin": "管理",
    "nav.back-home": "返回首页",
    "nav.analysis-report": "分析报告",
    "nav.new-conversation": "新对话",
    "nav.login": "登录",
    "nav.logout": "退出登录",
    "nav.feedback": "反馈",
    "hero.title.inspire": "启发",
    "hero.title.analyze": "分析",
    "hero.title.grow": "成长",
    "hero.subtitle": "通过 AI 智能分析，将您的创业想法转化为可行的商业计划。专业诊断，精准建议，让每个创意都有实现的可能。",
    "hero.learn-more": "了解更多",
    "mission.title": "为什么选择 Angelic？",
    "mission.subtitle": "我们致力于为创业者提供最专业的AI分析服务",
    "mission.point1.title": "AI 驱动的深度分析",
    "mission.point1.desc": "运用先进的人工智能技术，对您的创业想法进行360度全方位分析，发现潜在机会和风险点。",
    "mission.point2.title": "专业投资人视角",
    "mission.point2.desc": "基于真实投资人的经验和标准，为您提供最接近市场现实的评估和建议。",
    "mission.point3.title": "个性化行动方案",
    "mission.point3.desc": "根据您的具体情况，量身定制可执行的商业计划和下一步行动指南。",
    "features.title": "核心功能特色",
    "features.subtitle": "全方位创业分析，助力您的商业成功",
    "features.ai.title": "AI 智能对话",
    "features.ai.desc": "与专业AI助手深度交流，挖掘您创业想法的每个细节，获得即时反馈和建议。",
    "features.market.title": "市场分析报告",
    "features.market.desc": "生成详细的市场分析报告，包括竞争对手分析、目标用户画像和市场规模评估。",
    "features.personalized.title": "个性化建议",
    "features.personalized.desc": "基于您的背景和资源，提供量身定制的商业策略和执行路径。",
    "features.actionable.title": "可执行计划",
    "features.actionable.desc": "将分析结果转化为具体的行动计划，包括时间线、里程碑和资源需求。",
    "features.team.title": "团队协作",
    "features.team.desc": "智能团队匹配与协作建议",
    "features.innovation.title": "创新评估",
    "features.innovation.desc": "AI驱动的创新度评分",
    "features.risk.title": "风险预警",
    "features.risk.desc": "潜在风险识别与规避策略",
    "features.research.title": "市场调研",
    "features.research.desc": "深度市场分析与竞品研究",
    "process.title": "简单三步",
    "process.subtitle": "从想法到商业计划，只需三个步骤",
    "process.step1.title": "分享想法",
    "process.step1.desc": "与AI助手分享您的创业想法，无论是初步概念还是详细计划。",
    "process.step2.title": "深度分析",
    "process.step2.desc": "AI系统对您的想法进行全面分析，包括市场潜力、可行性和风险评估。",
    "process.step3.title": "获得报告",
    "process.step3.desc": "收到详细的分析报告和个性化建议，开始您的创业之旅。",
    "cta.title": "准备好开始了吗？",
    "cta.subtitle": "立即体验 Angelic 的AI创业分析服务",
    "cta.button": "开始分析",
    "angelic-report.title": "Angelic 专业分析报告",
    "angelic-report.subtitle": "投资级量化评估，为创业决策提供数据支撑",
    "angelic-report.feature1.title": "5维度加权评分",
    "angelic-report.feature1.desc": "创新性25%、可行性25%、市场潜力25%、竞争力15%、可持续性10%，科学量化项目综合实力",
    "angelic-report.feature2.title": "突破潜力检测",
    "angelic-report.feature2.desc": "识别具备10倍回报潜力的项目，评估技术融合、市场增长、网络效应和赢家通吃动态",
    "angelic-report.feature3.title": "红蓝海双层分析",
    "angelic-report.feature3.desc": "区分宏观市场饱和度与细分赛道机会，发现红海中的蓝海战略空间",
    "angelic-report.feature4.title": "风险依赖链分析",
    "angelic-report.feature4.desc": "检测并合并关联风险，提供统一缓解路径，避免分散应对互相依赖的风险",
    "angelic-report.feature5.title": "TRL技术成熟度",
    "angelic-report.feature5.desc": "采用1-9级技术就绪等级评估，明确技术开发阶段和所需投入",
    "angelic-report.feature6.title": "可执行里程碑",
    "angelic-report.feature6.desc": "具体KPI指标、验收标准和时间线，将分析转化为可落地的行动计划",
    "why-choose.title": "为什么选择 Angelic",
    "why-choose.subtitle": "专业、客观、可落地的创业分析服务",
    "why-choose.point1.title": "投资人级别的专业分析",
    "why-choose.point1.desc": "采用真实投资机构的评估框架，结合TAM/SAM/SOM市场分析、竞争集中度CR5指标等专业方法，为您的项目提供投资级别的全面评估",
    "why-choose.point2.title": "客观量化的评分体系",
    "why-choose.point2.desc": "拒绝模糊的主观判断，采用数学公式和明确标准进行评分。每个维度都有具体的评估指标和自动失效门槛，确保分析结果客观可靠",
    "why-choose.point3.title": "前瞻性的创新识别",
    "why-choose.point3.desc": "突破潜力系统专门识别具有结构性优势的项目，发现那些可能被传统评估忽视但具有指数级增长潜力的创新机会",
    "why-choose.point4.title": "可执行的行动方案",
    "why-choose.point4.desc": "不只是告诉你问题在哪里，更重要的是给出具体的解决方案。每个建议都配有明确的KPI、验收标准和时间节点，让你知道下一步该做什么",
    "auth.login.title": "登录",
    "auth.login.subtitle": "使用邮箱登录您的账户",
    "auth.login.email": "邮箱地址",
    "auth.login.password": "密码",
    "auth.login.button": "登录",
    "auth.login.no-account": "还没有账户？",
    "auth.login.register-link": "立即注册",
    "auth.login.or-continue-with": "或使用以下方式登录",
    "auth.login.replit-auth": "其他登录",
    "auth.register.title": "注册账户",
    "auth.register.subtitle": "创建您的账户开始使用",
    "auth.register.email": "邮箱地址",
    "auth.register.password": "密码（至少8位）",
    "auth.register.firstName": "名字（选填）",
    "auth.register.lastName": "姓氏（选填）",
    "auth.register.button": "注册",
    "auth.register.have-account": "已有账户？",
    "auth.register.login-link": "立即登录",
    "auth.error.email-required": "请输入邮箱地址",
    "auth.error.email-invalid": "请输入有效的邮箱地址",
    "auth.error.password-required": "请输入密码",
    "auth.error.password-min": "密码至少需要8位字符",
    "auth.error.email-exists": "该邮箱已被注册",
    "auth.error.invalid-credentials": "邮箱或密码错误",
    "auth.error.registration-failed": "注册失败，请稍后重试",
    "auth.error.login-failed": "登录失败，请稍后重试",
    // About页面中文翻译
    "about.title": "关于 Angelic - AI创业智能分析平台",
    "about.meta": "了解Angelic AI创业智能分析平台的使命、愿景和团队。我们致力于通过AI技术帮助创业者将创意转化为成功的商业实践。",
    "about.hero.title": "让第一个投资人永不缺席",
    "about.hero.subtitle": "每个伟大的创业想法，都值得被认真对待",
    "about.story.title": "我们发现的问题",
    "about.story.p1": "在这个充满创新的时代，每天都有无数个创业想法在创业者的脑海中诞生。然而，我们观察到一个令人痛心的现象：太多优秀的想法因为缺乏专业的早期评估而胎死腹中。",
    "about.story.p2": "传统的创业环境中，创业者往往要独自面对最初的不确定性。没有人告诉他们这个想法是否值得投入，市场机会在哪里，风险有多大。等到他们意识到问题时，时间和资源已经消耗殆尽。",
    "about.story.p3": "我们相信，每一个认真的创业想法，都应该有一个专业的\"第一个投资人\"——不是为了金钱，而是为了给出诚恳的建议。",
    "about.mission.title": "Angelic 的使命",
    "about.mission.subtitle": "成为每个创业者的第一个投资人",
    "about.mission.content.p1": "我们要解决的，不仅仅是创业分析的技术问题，更是创业生态中的情感和信任问题。",
    "about.mission.content.p2": "通过AI技术，我们为每个创业想法提供细致入微的分析，像一个经验丰富的投资人一样，从市场机会、竞争格局、商业模式到执行风险，给出专业而诚恳的建议。",
    "about.mission.content.p3": "我们希望成为创业路上的第一盏明灯，让每个有价值的想法都能得到应有的重视和指导。",
    "about.mission.card.title": "我们的承诺",
    "about.mission.card.item1": "• 对每个想法都给予同等的尊重和认真分析",
    "about.mission.card.item2": "• 提供诚实、专业、可执行的建议",
    "about.mission.card.item3": "• 保护创业者的想法和隐私",
    "about.mission.card.item4": "• 持续学习和改进，与创业者共同成长",
    "about.why.title": "为什么我们要这样做",
    "about.why.p1": "我们的团队曾经都是创业者。我们深知那种在深夜独自思考商业模式的孤独，那种对市场不确定性的焦虑，那种渴望有人能给出专业建议的迫切。",
    "about.why.p2": "我们也见过太多优秀的创业者，因为缺乏早期的专业指导而走了弯路，浪费了宝贵的时间和资源。这让我们意识到，创业生态中最缺少的不是资金，而是真诚的早期建议。",
    "about.why.p3": "所以我们决定用AI技术来解决这个问题。不是因为AI很酷，而是因为它能够24小时不间断地为每个创业者提供专业、客观、无偏见的分析。",
    "about.why.card.title": "我们的初心",
    "about.why.card.quote": "让每个认真的创业想法都能得到认真的对待，让每个有梦想的创业者都不再孤单。",
    "about.why.card.bottom": "这不仅仅是我们的产品理念，更是我们的人生信念。",
    "about.cta.title": "你的想法值得被认真对待",
    "about.cta.subtitle": "不管是一个模糊的概念，还是一个成型的商业计划，我们都愿意成为你的第一个投资人，给出最诚恳的建议。",
    "about.cta.button": "开始我们的对话",
    "about.cta.note": "完全免费，无需注册，我们只想听听你的想法",
    "about.footer.home": "首页",
    "about.footer.admin": "管理后台",
    "about.footer.copyright": "© 2025 Angelic. 启发创业智能.",
    // Chat页面中文翻译
    "chat.title": "AI创业助手 - Angelic智能分析平台",
    "chat.meta": "与Angelic AI助手对话，获得专业的创业想法分析和商业建议。让AI帮助您验证创意、识别机会、规避风险。",
    "chat.header.title": "AI 创业助手",
    "chat.header.subtitle": "专业创业分析与建议",
    "chat.welcome.tagline": "用 AI 帮你验证创业想法，让第一个投资人永不缺席。",
    "chat.welcome.title": "开始您的创业分析",
    "chat.welcome.subtitle": "描述您的创业想法，获得专业的 AI 分析和建议",
    "chat.interface.assistant-name": "Angelic AI 助手",
    "chat.interface.assistant-desc": "专业的创业分析导师，随时为您提供建议",
    "chat.interface.welcome": "欢迎使用 Angelic AI！",
    "chat.interface.welcome-desc": "告诉我您的创业想法，我们一起来分析和完善它",
    "chat.interface.placeholder": "例如：我想做一个AI驱动的健身APP",
    "chat.interface.send-hint": "按 Enter 发送，Shift + Enter 换行",
    "chat.interface.follow-up-hint": "相关问题：",
    "chat.errors.network": "网络连接错误",
    "chat.errors.network-desc": "无法连接到服务器，请检查网络连接后重试",
    "chat.errors.server": "服务器错误",
    "chat.errors.server-desc": "服务器暂时不可用，请稍后重试",
    "chat.errors.input": "输入错误",
    "chat.errors.input-desc": "请检查您的输入是否符合要求",
    "chat.errors.ai-unavailable": "AI服务不可用",
    "chat.errors.ai-unavailable-desc": "AI对话服务暂时维护中，请稍后重试",
    "chat.errors.general": "对话失败",
    "chat.errors.general-desc": "对话过程中出现未知错误，请重试",
    "chat.conversation-loaded": "对话已加载",
    "chat.conversation-loaded-desc": "历史对话已成功加载",
    "chat.errors.load-conversation": "加载对话失败",
    "chat.errors.load-conversation-desc": "无法加载对话历史，请稍后重试",
    "chat.untitled-conversation": "未命名对话",
    "chat.no-conversations": "暂无对话历史",
    // AI Partner角色中文翻译
    "persona.consultant.name": "Angelic 顾问",
    "persona.consultant.desc": "专业分析，投资级诊断",
    "persona.customer.name": "模拟顾客",
    "persona.customer.desc": "从用户视角提出真实需求和疑虑",
    "persona.switch.tooltip": "切换分析模式",
    // 报告相关中文翻译
    "report.title": "完整分析报告",
    "report.description": "获取专业详细的创业分析报告",
    "report.empty.title": "完整分析报告",
    "report.empty.description": "开始与AI助手对话后，您可以申请获取详细的创业分析报告",
    "report.content.title": "报告包含内容",
    "report.content.market": "市场分析",
    "report.content.competition": "竞争分析",
    "report.content.actionable": "行动建议",
    "report.content.business-model": "商业模式",
    "report.content.risk": "风险评估",
    "report.content.investor": "投资人视角",
    "report.requested.title": "报告申请成功",
    "report.requested.description": "我们正在为您生成详细的创业分析报告，完成后将发送到您的邮箱。",
    "report.requested.time": "通常需要 2-5 分钟完成生成",
    "report.available.title": "查看完整报告",
    "report.available.description": "获取专业详细的创业分析报告，包含市场分析、竞争评估、商业模式建议等",
    "report.features.market-analysis": "详细的市场机会分析",
    "report.features.competition-analysis": "竞争对手深度评估",
    "report.features.business-plan": "可执行的商业计划",
    "report.features.investor-advice": "投资人视角的专业建议",
    "report.button.request": "获取完整报告",
    "report.button.generate": "生成完整分析报告",
    "report.generating": "生成中...",
    "report.generating.status1": "AI正在翻阅资料",
    "report.generating.status2": "分析市场趋势",
    "report.generating.status3": "评估竞争格局",
    "report.generating.status4": "计算风险指标",
    "report.generating.status5": "生成诊断报告",
    "report.dialog.title": "获取完整分析报告",
    "report.dialog.description": "请输入您的邮箱地址，我们将为您生成详细的创业分析报告并发送到您的邮箱。",
    "report.dialog.placeholder": "请输入您的邮箱地址",
    "report.dialog.info": "📧 报告将包含：详细市场分析、竞争评估、商业模式建议、执行计划、风险评估和投资人视角等专业内容",
    "report.dialog.cancel": "取消",
    "report.dialog.submit": "申请报告",
    "report.errors.need-conversation": "需要先开始对话",
    "report.errors.need-conversation-desc": "请先与AI助手进行对话，然后再申请完整报告",
    "report.errors.empty-email": "邮箱不能为空",
    "report.errors.empty-email-desc": "请输入您的邮箱地址",
    "report.errors.invalid-email": "邮箱格式不正确",
    "report.errors.invalid-email-desc": "请输入有效的邮箱地址",
    "report.errors.request-failed": "申请失败",
    "report.errors.request-failed-desc": "报告申请失败，请稍后重试",
    "report.success.title": "报告申请成功！",
    "report.success.description": "我们正在为您生成详细的创业分析报告，完成后将发送到您的邮箱"
  },
  en: {
    "site.title": "Angelic - AI Startup Analysis Platform",
    "site.subtitle": "Transform Ideas into Reality",
    "nav.about": "About Angelic",
    "nav.experience": "Get Started",
    "nav.admin": "Admin",
    "nav.back-home": "Back to Home",
    "nav.analysis-report": "Analysis Report",
    "nav.new-conversation": "New Chat",
    "nav.login": "Sign In",
    "nav.logout": "Logout",
    "nav.feedback": "Feedback",
    "hero.title.inspire": "Inspire",
    "hero.title.analyze": "Analyze",
    "hero.title.grow": "Grow",
    "hero.subtitle": "Transform your startup ideas into viable business plans through AI-powered analysis. Professional diagnosis, precise recommendations, making every creative idea achievable.",
    "hero.learn-more": "Learn More",
    "mission.title": "Why Choose Angelic?",
    "mission.subtitle": "We are committed to providing entrepreneurs with the most professional AI analysis services",
    "mission.point1.title": "AI-Driven Deep Analysis",
    "mission.point1.desc": "Utilize advanced artificial intelligence technology to conduct 360-degree comprehensive analysis of your startup ideas, discovering potential opportunities and risk points.",
    "mission.point2.title": "Professional Investor Perspective",
    "mission.point2.desc": "Based on real investor experience and standards, we provide you with the most market-realistic evaluations and recommendations.",
    "mission.point3.title": "Personalized Action Plans",
    "mission.point3.desc": "According to your specific situation, we create customized executable business plans and next-step action guides.",
    "features.title": "Core Features",
    "features.subtitle": "Comprehensive startup analysis to support your business success",
    "features.ai.title": "AI Intelligent Conversation",
    "features.ai.desc": "Engage in deep conversations with professional AI assistants, explore every detail of your startup idea, and get instant feedback and suggestions.",
    "features.market.title": "Market Analysis Reports",
    "features.market.desc": "Generate detailed market analysis reports, including competitor analysis, target user profiles, and market size assessments.",
    "features.personalized.title": "Personalized Recommendations",
    "features.personalized.desc": "Based on your background and resources, provide customized business strategies and execution paths.",
    "features.actionable.title": "Actionable Plans",
    "features.actionable.desc": "Transform analysis results into specific action plans, including timelines, milestones, and resource requirements.",
    "features.team.title": "Team Collaboration",
    "features.team.desc": "Intelligent team matching and collaboration recommendations",
    "features.innovation.title": "Innovation Assessment",
    "features.innovation.desc": "AI-driven innovation scoring",
    "features.risk.title": "Risk Warning",
    "features.risk.desc": "Potential risk identification and mitigation strategies",
    "features.research.title": "Market Research",
    "features.research.desc": "In-depth market analysis and competitive research",
    "process.title": "Simple Three Steps",
    "process.subtitle": "From idea to business plan, just three steps",
    "process.step1.title": "Share Your Idea",
    "process.step1.desc": "Share your startup idea with our AI assistant, whether it's a preliminary concept or detailed plan.",
    "process.step2.title": "Deep Analysis",
    "process.step2.desc": "Our AI system conducts comprehensive analysis of your idea, including market potential, feasibility, and risk assessment.",
    "process.step3.title": "Get Report",
    "process.step3.desc": "Receive detailed analysis reports and personalized recommendations to start your entrepreneurial journey.",
    "cta.title": "Ready to Start?",
    "cta.subtitle": "Experience Angelic's AI startup analysis service now",
    "cta.button": "Start Analysis",
    "angelic-report.title": "Angelic Professional Analysis Report",
    "angelic-report.subtitle": "Investment-grade quantitative assessment, data-driven decision support",
    "angelic-report.feature1.title": "5-Dimension Weighted Scoring",
    "angelic-report.feature1.desc": "Innovation 25%, Feasibility 25%, Market 25%, Competition 15%, Sustainability 10% - scientifically quantify project strength",
    "angelic-report.feature2.title": "Breakthrough Potential Detection",
    "angelic-report.feature2.desc": "Identify projects with 10x return potential, evaluating tech fusion, market growth, network effects and winner-takes-most dynamics",
    "angelic-report.feature3.title": "Red/Blue Ocean Dual Analysis",
    "angelic-report.feature3.desc": "Distinguish macro market saturation from niche opportunities, discover blue ocean strategies within red ocean markets",
    "angelic-report.feature4.title": "Risk Dependency Chain Analysis",
    "angelic-report.feature4.desc": "Detect and merge related risks, provide unified mitigation paths, avoid scattered handling of interdependent risks",
    "angelic-report.feature5.title": "TRL Technology Readiness",
    "angelic-report.feature5.desc": "Adopt 1-9 level technology readiness assessment, clarify development stage and required investment",
    "angelic-report.feature6.title": "Actionable Milestones",
    "angelic-report.feature6.desc": "Specific KPI metrics, acceptance criteria and timelines, transform analysis into executable action plans",
    "why-choose.title": "Why Choose Angelic",
    "why-choose.subtitle": "Professional, objective, actionable startup analysis service",
    "why-choose.point1.title": "Investor-Grade Professional Analysis",
    "why-choose.point1.desc": "Adopt real investment institution evaluation frameworks, combining TAM/SAM/SOM market analysis, CR5 concentration indicators and other professional methods for investment-grade comprehensive assessment",
    "why-choose.point2.title": "Objective Quantified Scoring System",
    "why-choose.point2.desc": "Reject vague subjective judgments, use mathematical formulas and clear standards for scoring. Each dimension has specific evaluation indicators and auto-fail thresholds to ensure objective and reliable results",
    "why-choose.point3.title": "Forward-Looking Innovation Recognition",
    "why-choose.point3.desc": "Breakthrough Potential system specifically identifies projects with structural advantages, discovering exponential growth opportunities that may be overlooked by traditional assessments",
    "why-choose.point4.title": "Actionable Solutions",
    "why-choose.point4.desc": "Not just identifying problems, but providing specific solutions. Each recommendation comes with clear KPIs, acceptance criteria and timelines, telling you exactly what to do next",
    "auth.login.title": "Log In",
    "auth.login.subtitle": "Sign in to your account with email",
    "auth.login.email": "Email Address",
    "auth.login.password": "Password",
    "auth.login.button": "Log In",
    "auth.login.no-account": "Don't have an account?",
    "auth.login.register-link": "Sign Up",
    "auth.login.or-continue-with": "Or continue with",
    "auth.login.replit-auth": "Other Options",
    "auth.register.title": "Create Account",
    "auth.register.subtitle": "Create your account to get started",
    "auth.register.email": "Email Address",
    "auth.register.password": "Password (min 8 characters)",
    "auth.register.firstName": "First Name (optional)",
    "auth.register.lastName": "Last Name (optional)",
    "auth.register.button": "Sign Up",
    "auth.register.have-account": "Already have an account?",
    "auth.register.login-link": "Log In",
    "auth.error.email-required": "Email is required",
    "auth.error.email-invalid": "Please enter a valid email",
    "auth.error.password-required": "Password is required",
    "auth.error.password-min": "Password must be at least 8 characters",
    "auth.error.email-exists": "Email already registered",
    "auth.error.invalid-credentials": "Invalid email or password",
    "auth.error.registration-failed": "Registration failed, please try again",
    "auth.error.login-failed": "Login failed, please try again",
    // About页面英文翻译
    "about.title": "About Angelic - AI Startup Analysis Platform",
    "about.meta": "Learn about Angelic AI Startup Analysis Platform's mission, vision and team. We are committed to helping entrepreneurs transform ideas into successful business practices through AI technology.",
    "about.hero.title": "Your First Investor Never Absent",
    "about.hero.subtitle": "Every great startup idea deserves to be taken seriously",
    "about.story.title": "The Problem We Discovered",
    "about.story.p1": "In this era full of innovation, countless startup ideas are born in entrepreneurs' minds every day. However, we observed a heartbreaking phenomenon: too many excellent ideas die prematurely due to lack of professional early assessment.",
    "about.story.p2": "In the traditional entrepreneurial environment, entrepreneurs often have to face initial uncertainties alone. No one tells them whether the idea is worth investing in, where market opportunities are, and how big the risks are. By the time they realize the problems, time and resources have been exhausted.",
    "about.story.p3": "We believe that every serious startup idea should have a professional \"first investor\" - not for money, but to give sincere advice.",
    "about.mission.title": "Angelic's Mission",
    "about.mission.subtitle": "To be the first investor for every entrepreneur",
    "about.mission.content.p1": "What we want to solve is not only the technical problems of startup analysis, but also the emotional and trust issues in the entrepreneurial ecosystem.",
    "about.mission.content.p2": "Through AI technology, we provide detailed analysis for every startup idea. Like an experienced investor, we give professional and sincere advice on market opportunities, competitive landscape, business models, and execution risks.",
    "about.mission.content.p3": "We hope to become the first beacon on the entrepreneurial road, so that every valuable idea can get the attention and guidance it deserves.",
    "about.mission.card.title": "Our Promise",
    "about.mission.card.item1": "• Give equal respect and serious analysis to every idea",
    "about.mission.card.item2": "• Provide honest, professional, actionable advice",
    "about.mission.card.item3": "• Protect entrepreneurs' ideas and privacy",
    "about.mission.card.item4": "• Continuously learn and improve, growing together with entrepreneurs",
    "about.why.title": "Why We Do This",
    "about.why.p1": "Our team members were all entrepreneurs. We deeply understand the loneliness of thinking about business models alone late at night, the anxiety about market uncertainty, and the urgency of wanting professional advice.",
    "about.why.p2": "We have also seen too many excellent entrepreneurs take detours due to lack of early professional guidance, wasting precious time and resources. This made us realize that what the entrepreneurial ecosystem lacks most is not capital, but sincere early advice.",
    "about.why.p3": "So we decided to use AI technology to solve this problem. Not because AI is cool, but because it can provide professional, objective, unbiased analysis for every entrepreneur 24/7.",
    "about.why.card.title": "Our Original Intention",
    "about.why.card.quote": "Let every serious startup idea be taken seriously, and let every entrepreneur with dreams no longer be alone.",
    "about.why.card.bottom": "This is not only our product philosophy, but also our life belief.",
    "about.cta.title": "Your Idea Deserves to Be Taken Seriously",
    "about.cta.subtitle": "Whether it's a vague concept or a mature business plan, we are willing to be your first investor and give you the most sincere advice.",
    "about.cta.button": "Start Our Conversation",
    "about.cta.note": "Completely free, no registration required, we just want to hear your ideas",
    "about.footer.home": "Home",
    "about.footer.admin": "Admin Dashboard",
    "about.footer.copyright": "© 2025 Angelic. Inspiring Entrepreneurial Intelligence.",
    // Chat页面英文翻译
    "chat.title": "AI Startup Assistant - Angelic Analysis Platform",
    "chat.meta": "Chat with Angelic AI assistant to get professional startup idea analysis and business advice. Let AI help you validate ideas, identify opportunities, and avoid risks.",
    "chat.header.title": "AI Startup Assistant",
    "chat.header.subtitle": "Professional startup analysis and advice",
    "chat.welcome.tagline": "Use AI to validate your startup ideas, ensuring your first investor is never absent.",
    "chat.welcome.title": "Start Your Startup Analysis",
    "chat.welcome.subtitle": "Describe your startup idea and get professional AI analysis and advice",
    "chat.interface.assistant-name": "Angelic AI Assistant",
    "chat.interface.assistant-desc": "Professional startup analysis mentor, always here to provide advice",
    "chat.interface.welcome": "Welcome to Angelic AI!",
    "chat.interface.welcome-desc": "Tell me your startup idea, and let's analyze and refine it together",
    "chat.interface.placeholder": "e.g., I want to create an AI-powered fitness app",
    "chat.interface.send-hint": "Press Enter to send, Shift + Enter for new line",
    "chat.interface.follow-up-hint": "Related questions:",
    "chat.errors.network": "Network Connection Error",
    "chat.errors.network-desc": "Unable to connect to server, please check your network connection and try again",
    "chat.errors.server": "Server Error",
    "chat.errors.server-desc": "Server is temporarily unavailable, please try again later",
    "chat.errors.input": "Input Error",
    "chat.errors.input-desc": "Please check if your input meets the requirements",
    "chat.errors.ai-unavailable": "AI Service Unavailable",
    "chat.errors.ai-unavailable-desc": "AI chat service is temporarily under maintenance, please try again later",
    "chat.errors.general": "Chat Failed",
    "chat.errors.general-desc": "An unknown error occurred during the conversation, please try again",
    "chat.conversation-loaded": "Conversation Loaded",
    "chat.conversation-loaded-desc": "Historical conversation successfully loaded",
    "chat.errors.load-conversation": "Load Conversation Failed",
    "chat.errors.load-conversation-desc": "Unable to load conversation history, please try again later",
    "chat.untitled-conversation": "Untitled Conversation",
    "chat.no-conversations": "No conversation history",
    // AI Partner角色英文翻译
    "persona.consultant.name": "Angelic Advisor",
    "persona.consultant.desc": "Professional analysis, investment-grade diagnosis",
    "persona.customer.name": "Customer Persona",
    "persona.customer.desc": "Real user perspective with needs and concerns",
    "persona.switch.tooltip": "Switch analysis mode",
    // 报告相关英文翻译
    "report.title": "Complete Analysis Report",
    "report.description": "Get professional detailed startup analysis report",
    "report.empty.title": "Complete Analysis Report",
    "report.empty.description": "After starting a conversation with the AI assistant, you can request to get a detailed startup analysis report",
    "report.content.title": "Report Contents",
    "report.content.market": "Market Analysis",
    "report.content.competition": "Competitive Analysis",
    "report.content.actionable": "Action Plan",
    "report.content.business-model": "Business Model",
    "report.content.risk": "Risk Assessment",
    "report.content.investor": "Investor Perspective",
    "report.requested.title": "Report Request Successful",
    "report.requested.description": "We are generating a detailed startup analysis report for you, which will be sent to your email upon completion.",
    "report.requested.time": "Usually takes 2-5 minutes to complete",
    "report.available.title": "Get Complete Report",
    "report.available.description": "Get professional detailed startup analysis report, including market analysis, competitive assessment, business model recommendations, etc.",
    "report.features.market-analysis": "Detailed market opportunity analysis",
    "report.features.competition-analysis": "In-depth competitive assessment",
    "report.features.business-plan": "Actionable business plan",
    "report.features.investor-advice": "Professional advice from investor perspective",
    "report.button.request": "Get Complete Report",
    "report.button.generate": "Generate Complete Analysis Report",
    "report.generating": "Generating...",
    "report.generating.status1": "AI reviewing materials",
    "report.generating.status2": "Analyzing market trends",
    "report.generating.status3": "Evaluating competitive landscape",
    "report.generating.status4": "Calculating risk metrics",
    "report.generating.status5": "Creating diagnostic report",
    "report.dialog.title": "Get Complete Analysis Report",
    "report.dialog.description": "Please enter your email address, and we will generate a detailed startup analysis report and send it to your email.",
    "report.dialog.placeholder": "Please enter your email address",
    "report.dialog.info": "📧 Report will include: detailed market analysis, competitive assessment, business model recommendations, execution plan, risk assessment, and investor perspective professional content",
    "report.dialog.cancel": "Cancel",
    "report.dialog.submit": "Request Report",
    "report.errors.need-conversation": "Need to start conversation first",
    "report.errors.need-conversation-desc": "Please start a conversation with the AI assistant first, then request the complete report",
    "report.errors.empty-email": "Email cannot be empty",
    "report.errors.empty-email-desc": "Please enter your email address",
    "report.errors.invalid-email": "Invalid email format",
    "report.errors.invalid-email-desc": "Please enter a valid email address",
    "report.errors.request-failed": "Request failed",
    "report.errors.request-failed-desc": "Report request failed, please try again later",
    "report.success.title": "Report Request Successful!",
    "report.success.description": "We are generating a detailed startup analysis report for you, which will be sent to your email upon completion"
  }
} as const

export function useTranslations() {
  const { language } = useLanguage()
  
  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key
  }, [language])
  
  return { t, language }
}