# Market Insights Web Search Setup

Angelic报告生成系统现已集成Web Search功能，可以自动搜索社交媒体反馈、竞争对手分析、行业趋势和用户评价，让报告包含真实的市场洞察。

## 功能特性

### 自动搜索4个维度的市场洞察：

1. **社交媒体反馈** - 搜索小红书、知乎等平台的用户讨论
2. **竞争对手分析** - 搜索同类产品的市场表现和评价
3. **行业趋势** - 搜索行业报告和市场研究
4. **用户评价** - 搜索目标用户群体的真实反馈

### 技术亮点：

- ✅ **可插拔架构** - 支持多种搜索API提供商
- ✅ **智能缓存** - 24小时TTL缓存，减少API调用和成本
- ✅ **AI总结** - 使用GPT-4o自动总结搜索结果
- ✅ **优雅降级** - 搜索失败时自动回退到纯对话分析
- ✅ **双语支持** - 自动检测中英文并使用相应的搜索策略
- ✅ **超时保护** - 10秒总超时，不影响报告生成速度

## 快速开始

### 方案1：使用Serper API（推荐）

[Serper.dev](https://serper.dev)提供简单易用的Google搜索API，价格合理，质量高。

1. **注册获取API Key**
   - 访问 https://serper.dev
   - 注册账号并获取API密钥
   - 免费套餐：2,500次搜索/月

2. **配置环境变量**

在Replit的Secrets中添加以下环境变量：

```bash
# 启用market insights功能
MARKET_INSIGHTS_ENABLED=true

# 选择provider类型
MARKET_INSIGHTS_PROVIDER=serper

# Serper API密钥
SERPER_API_KEY=your_serper_api_key_here
```

3. **重启应用**

配置完成后，重启应用即可。生成Angelic报告时会自动搜索并集成市场洞察。

### 方案2：禁用Web Search（默认）

如果不需要web search功能，保持默认配置即可：

```bash
# 或者显式禁用
MARKET_INSIGHTS_ENABLED=false
```

报告将基于对话内容生成，不进行外部搜索。

## 工作原理

### 1. 搜索策略

根据创业想法，系统会执行4个并行搜索：

**中文搜索示例：**
- 社交媒体：`[想法] site:zhihu.com OR site:xiaohongshu.com`
- 竞争对手：`[想法] 竞争对手 市场分析`
- 行业趋势：`[想法] 行业趋势 市场报告`
- 用户评价：`[想法] 用户评价 使用体验`

**英文搜索示例：**
- 社交媒体：`[idea] social media feedback reviews`
- 竞争对手：`[idea] competitors market analysis`
- 行业趋势：`[idea] industry trends market report`
- 用户评价：`[idea] user reviews feedback`

### 2. AI总结

每个搜索类别的前5条结果会被GPT-4o总结成2-3段文字，包含：
- 具体数据和观点
- 来源链接引用
- 客观中立的分析

### 3. 集成到报告

市场洞察会被插入到Angelic报告生成的prompt中，作为客观参考数据与对话内容结合分析。

## 架构说明

### Provider接口

```typescript
interface IMarketInsightsProvider {
  getInsights(idea: string, language: 'zh' | 'en'): Promise<MarketInsights>;
}
```

### 当前实现的Providers：

1. **NoopProvider** (默认)
   - 不执行任何搜索
   - 返回空的market insights
   - 适合开发环境或不需要搜索的场景

2. **SerperProvider**
   - 使用Serper.dev API
   - 支持中英文双语搜索
   - 内置24小时缓存
   - 8秒单次搜索超时

### 未来可扩展的Providers：

- Google Custom Search API
- Bing Web Search API
- 其他搜索服务

## 成本估算

### Serper API定价：

- 免费套餐：2,500次搜索/月（约625份报告）
- 付费套餐：$50/月 = 50,000次搜索（约12,500份报告）

每份报告消耗4次搜索（4个维度），缓存24小时内相同想法不重复搜索。

### OpenAI成本：

每份报告额外消耗约2,000-3,000 tokens用于总结搜索结果。

## 性能指标

- **搜索延迟**：5-8秒（4个并行搜索 + AI总结）
- **总超时**：10秒（超时后自动回退）
- **缓存命中**：相同想法24小时内即时返回（<100ms）
- **报告生成总时间**：增加5-8秒（不影响用户体验）

## 监控和调试

### 日志输出：

```bash
# Provider初始化
📊 Using Serper market insights provider

# 搜索开始
🔍 Fetching market insights via Serper API...

# 搜索成功
✅ Market insights gathered successfully

# 使用缓存
📦 Using cached market insights

# 搜索失败（优雅降级）
⚠️  Market insights failed, continuing without: Market insights timeout
```

### 常见问题：

**Q: 为什么搜索没有生效？**
- 检查SERPER_API_KEY是否正确配置
- 检查MARKET_INSIGHTS_ENABLED=true
- 检查MARKET_INSIGHTS_PROVIDER=serper
- 查看服务器日志确认provider类型

**Q: 搜索超时怎么办？**
- 系统会自动回退到纯对话分析
- 不影响报告生成，只是缺少外部市场洞察
- 可以增加超时时间（不推荐，影响用户体验）

**Q: 如何验证搜索结果？**
- 查看生成的报告中是否有"市场洞察数据"章节
- 检查报告中的数据来源链接
- 对比有/无搜索的报告质量差异

## 安全注意事项

1. **API密钥保护**
   - 永远不要在代码中硬编码API密钥
   - 使用Replit Secrets管理敏感信息
   - 不要将密钥提交到Git仓库

2. **速率限制**
   - 缓存机制减少重复搜索
   - 超时保护防止资源浪费
   - 监控API配额使用情况

3. **数据验证**
   - 系统自动过滤虚假链接
   - 仅使用搜索API返回的官方结果
   - 不执行任意URL爬取

## 示例报告对比

### 无Web Search (默认)

报告基于对话内容分析，使用AI的通用知识和逻辑推理。

### 有Web Search (Serper)

报告包含：
- 最新的社交媒体用户反馈
- 真实的竞争对手数据
- 当前的行业趋势
- 实际的用户评价
- 可验证的数据来源链接

**质量提升：**
- ✅ 更准确的市场规模估算
- ✅ 更真实的竞争格局分析
- ✅ 更及时的行业趋势洞察
- ✅ 更可靠的用户需求验证

## 下一步计划

- [ ] 支持更多搜索API提供商
- [ ] 前端UI允许用户手动输入市场证据
- [ ] 异步后台搜索，生成报告后发送邮件通知
- [ ] 搜索结果持久化存储
- [ ] 更精细的缓存策略（按行业/领域分类）

---

如有问题，请参考代码文件：
- `server/services/market-insights.ts` - Provider实现
- `server/services/angelic-report-generator.ts` - 报告生成集成
- `server/routes.ts` - API集成
