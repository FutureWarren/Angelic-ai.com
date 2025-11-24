import { AngelicReport } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Target, Shield, Rocket, Heart, BarChart3, Users, Trophy, AlertTriangle, ExternalLink, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AngelicReportViewProps {
  report: AngelicReport;
  language: 'zh' | 'en';
}

export function AngelicReportView({ report, language }: AngelicReportViewProps) {
  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'Excellent': return <Trophy className="w-6 h-6 text-green-600" />;
      case 'Viable': return <CheckCircle2 className="w-6 h-6 text-blue-600" />;
      case 'Borderline': return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'Not Viable': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Viable': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Borderline': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Not Viable': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'Go': return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'Go with Conditions': return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'Hold': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getOceanColor = (classification: string) => {
    switch (classification) {
      case 'blue_ocean': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'red_ocean': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Check if this is a legacy format report without required fields
  if (!report.executiveSummary) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-8 px-4" data-testid="legacy-report-notice">
        <Card>
          <CardHeader>
            <CardTitle>报告格式不兼容</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {language === 'zh' 
                ? '此报告为旧版格式，暂不支持查看。请联系管理员获取支持。' 
                : 'This is a legacy format report that is not currently supported for viewing. Please contact administrator for support.'}
            </p>
            <div className="mt-4 p-4 bg-muted rounded">
              <p className="text-sm font-medium mb-2">报告ID: {(report as any).id}</p>
              <p className="text-sm text-muted-foreground">想法: {report.idea}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4" data-testid="angelic-report">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="report-title">
          {language === 'zh' ? 'Angelic 投资级分析报告' : 'Angelic Investment-Grade Analysis'}
        </h1>
        <p className="text-xl text-muted-foreground" data-testid="report-idea">{report.idea}</p>
        <p className="text-sm text-muted-foreground">
          {language === 'zh' ? '生成时间' : 'Generated'}: {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* 1. Executive Summary */}
      <Card data-testid="section-executive-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6" />
            {language === 'zh' ? '1. 核心摘要' : '1. Executive Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            {getRatingIcon(report.executiveSummary.rating)}
            <div className="flex-1">
              <div className="font-semibold text-lg" data-testid="rating">
                {report.executiveSummary.rating}
              </div>
              <Progress value={report.executiveSummary.overallScore} className="mt-2 h-3" />
            </div>
            <Badge className={getRatingColor(report.executiveSummary.rating)} data-testid="overall-score">
              {report.executiveSummary.overallScore}/100
            </Badge>
          </div>

          {((report.executiveSummary.breakthroughBonus && report.executiveSummary.breakthroughBonus > 0) || 
            (report.executiveSummary.breakthroughSignal && report.executiveSummary.bpReasons)) && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800 rounded-lg" data-testid="breakthrough-signal">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                {language === 'zh' ? '🚀 突破潜力信号检测' : '🚀 Breakthrough Potential Detected'}
              </h4>
              <div className="mb-2">
                <Badge className="bg-purple-600 text-white" data-testid="bp-value">
                  {report.executiveSummary.breakthroughBonus !== undefined ? (
                    `+${report.executiveSummary.breakthroughBonus} ${language === 'zh' ? '分' : 'pts'}`
                  ) : (
                    `BP: ${((report.executiveSummary.breakthroughPotential || 0) * 100).toFixed(0)}%`
                  )}
                </Badge>
              </div>
              <ul className="space-y-1">
                {(report.executiveSummary.breakthroughReasons || report.executiveSummary.bpReasons || []).map((reason, idx) => (
                  <li key={idx} className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2" data-testid={`bp-reason-${idx}`}>
                    <Rocket className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
                {language === 'zh' 
                  ? '该项目具有突破潜力，展现非线性优势。突破潜力加分已纳入最终评分。' 
                  : 'This project demonstrates breakthrough potential with nonlinear advantages. Bonus points factored into final score.'}
              </p>
            </div>
          )}

          {report.executiveSummary.autoFail && report.executiveSummary.autoFail.triggered && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg" data-testid="auto-fail-notice">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                ⚠️ {language === 'zh' ? '自动不及格触发' : 'Auto-Fail Triggered'}
              </h4>
              <ul className="space-y-1">
                {report.executiveSummary.autoFail.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-red-700 dark:text-red-300" data-testid={`auto-fail-reason-${idx}`}>
                    • {reason}
                  </li>
                ))}
              </ul>
              {report.executiveSummary.autoFail.reversalConditions && report.executiveSummary.autoFail.reversalConditions.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-red-800 dark:text-red-200 mb-1">
                    {language === 'zh' ? '可逆转条件：' : 'Reversal Conditions:'}
                  </h5>
                  <ul className="space-y-1">
                    {report.executiveSummary.autoFail.reversalConditions.map((condition, idx) => (
                      <li key={idx} className="text-sm text-red-700 dark:text-red-300" data-testid={`reversal-condition-${idx}`}>
                        • {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap" data-testid="overall-conclusion">{report.executiveSummary.overallConclusion}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600 dark:text-green-400">
                {language === 'zh' ? '✨ 核心亮点' : '✨ Key Highlights'}
              </h4>
              <ul className="space-y-1">
                {report.executiveSummary.keyHighlights.map((highlight, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2" data-testid={`highlight-${idx}`}>
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                {language === 'zh' ? '⚠️ 关键顾虑' : '⚠️ Critical Concerns'}
              </h4>
              <ul className="space-y-1">
                {report.executiveSummary.criticalConcerns.map((concern, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2" data-testid={`concern-${idx}`}>
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Scoring Framework */}
      <Card data-testid="section-scoring-framework">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {language === 'zh' ? '2. 量化评分框架' : '2. Quantitative Scoring Framework'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* Innovation */}
            <div className="p-4 border rounded-lg" data-testid="dimension-innovation">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{language === 'zh' ? '创新性 (Innovation)' : 'Innovation'}</h4>
                <Badge variant="outline">{report.scoringFramework.dimensions.innovation.score}/100 ({report.scoringFramework.dimensions.innovation.weight}%)</Badge>
              </div>
              <Progress value={report.scoringFramework.dimensions.innovation.score} className="mb-3 h-2" />
              <div className="space-y-2">
                {report.scoringFramework.dimensions.innovation.subIndicators.map((indicator, idx) => (
                  <div key={idx} className="text-sm flex items-start gap-2" data-testid={`innovation-indicator-${idx}`}>
                    <span className="font-medium min-w-[60px]">{indicator.score}分:</span>
                    <span>{indicator.indicator} - {indicator.rationale}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">{report.scoringFramework.dimensions.innovation.explanation}</p>
            </div>

            {/* Feasibility */}
            <div className="p-4 border rounded-lg" data-testid="dimension-feasibility">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{language === 'zh' ? '可行性 (Feasibility)' : 'Feasibility'}</h4>
                <Badge variant="outline">{report.scoringFramework.dimensions.feasibility.score}/100 ({report.scoringFramework.dimensions.feasibility.weight}%)</Badge>
              </div>
              <Progress value={report.scoringFramework.dimensions.feasibility.score} className="mb-3 h-2" />
              <div className="text-sm space-y-2">
                <div><span className="font-medium">TRL Level:</span> {report.scoringFramework.dimensions.feasibility.trlLevel}/9 (Score: {report.scoringFramework.dimensions.feasibility.trlScore})</div>
                {report.scoringFramework.dimensions.feasibility.blockingFactors.length > 0 && (
                  <div>
                    <span className="font-medium">{language === 'zh' ? '阻断因子:' : 'Blocking Factors:'}</span>
                    <ul className="list-disc list-inside ml-4">
                      {report.scoringFramework.dimensions.feasibility.blockingFactors.map((factor, idx) => (
                        <li key={idx} data-testid={`blocking-factor-${idx}`}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.scoringFramework.dimensions.feasibility.topVerificationPaths.length > 0 && (
                  <div>
                    <span className="font-medium">{language === 'zh' ? '验证路径:' : 'Verification Paths:'}</span>
                    {report.scoringFramework.dimensions.feasibility.topVerificationPaths.map((path, idx) => (
                      <div key={idx} className="ml-4 mt-1" data-testid={`verification-path-${idx}`}>
                        <div>• {path.path}</div>
                        <div className="text-muted-foreground ml-4">- {language === 'zh' ? '工作量' : 'Effort'}: {path.effort}</div>
                        <div className="text-muted-foreground ml-4">- {language === 'zh' ? '预期结果' : 'Expected'}: {path.expectedOutcome}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">{report.scoringFramework.dimensions.feasibility.explanation}</p>
            </div>

            {/* Market Potential */}
            <div className="p-4 border rounded-lg" data-testid="dimension-market-potential">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{language === 'zh' ? '市场潜力 (Market Potential)' : 'Market Potential'}</h4>
                <Badge variant="outline">{report.scoringFramework.dimensions.marketPotential.score}/100 ({report.scoringFramework.dimensions.marketPotential.weight}%)</Badge>
              </div>
              <Progress value={report.scoringFramework.dimensions.marketPotential.score} className="mb-3 h-2" />
              
              {/* Market Size & CAGR */}
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                  <div className="text-xs text-muted-foreground mb-1">{language === 'zh' ? '市场规模' : 'Market Size'}</div>
                  <div className="font-semibold text-lg">{report.scoringFramework.dimensions.marketPotential.marketSize}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border-l-4 border-green-600">
                  <div className="text-xs text-muted-foreground mb-1">CAGR</div>
                  <div className="font-semibold text-lg text-green-700 dark:text-green-300">{report.scoringFramework.dimensions.marketPotential.cagr}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="p-2 bg-muted rounded">
                  <div className="font-medium">TAM: {report.scoringFramework.dimensions.marketPotential.tam.value}</div>
                  <ul className="text-xs text-muted-foreground mt-1">
                    {report.scoringFramework.dimensions.marketPotential.tam.assumptions.map((a, idx) => (
                      <li key={idx}>• {a}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="font-medium">SAM: {report.scoringFramework.dimensions.marketPotential.sam.value}</div>
                  <ul className="text-xs text-muted-foreground mt-1">
                    {report.scoringFramework.dimensions.marketPotential.sam.assumptions.map((a, idx) => (
                      <li key={idx}>• {a}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="font-medium">SOM: {report.scoringFramework.dimensions.marketPotential.som.value}</div>
                  <ul className="text-xs text-muted-foreground mt-1">
                    {report.scoringFramework.dimensions.marketPotential.som.assumptions.map((a, idx) => (
                      <li key={idx}>• {a}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 text-sm space-y-1">
                <div><span className="font-medium">{language === 'zh' ? '增长率' : 'Growth Rate'}:</span> {report.scoringFramework.dimensions.marketPotential.growthRate}</div>
                <div><span className="font-medium">{language === 'zh' ? '付费意愿证据' : 'Willingness to Pay'}:</span> {report.scoringFramework.dimensions.marketPotential.willingnessToPayEvidence}</div>
                
                {/* Data Sources */}
                {report.scoringFramework.dimensions.marketPotential.dataSources && report.scoringFramework.dimensions.marketPotential.dataSources.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      {language === 'zh' ? '📊 数据来源' : '📊 Data Sources'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.scoringFramework.dimensions.marketPotential.dataSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          data-testid={`market-source-${idx}`}
                        >
                          <span>{source.label}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {report.scoringFramework.dimensions.marketPotential.missingDataPoints.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">{language === 'zh' ? '待补充数据:' : 'Missing Data:'}</span>
                    <ul className="list-disc list-inside ml-2 text-yellow-700 dark:text-yellow-300">
                      {report.scoringFramework.dimensions.marketPotential.missingDataPoints.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">{report.scoringFramework.dimensions.marketPotential.explanation}</p>
            </div>

            {/* Competitive Landscape */}
            <div className="p-4 border rounded-lg" data-testid="dimension-competitive-landscape">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{language === 'zh' ? '竞争格局 (Competitive Landscape)' : 'Competitive Landscape'}</h4>
                <Badge variant="outline">{report.scoringFramework.dimensions.competitiveLandscape.score}/100 ({report.scoringFramework.dimensions.competitiveLandscape.weight}%)</Badge>
              </div>
              <Progress value={report.scoringFramework.dimensions.competitiveLandscape.score} className="mb-3 h-2" />
              
              {/* Competitors List */}
              {report.scoringFramework.dimensions.competitiveLandscape.competitors && report.scoringFramework.dimensions.competitiveLandscape.competitors.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-sm mb-2">{language === 'zh' ? '主要竞争对手' : 'Main Competitors'}</h5>
                  <div className="space-y-3">
                    {report.scoringFramework.dimensions.competitiveLandscape.competitors.map((competitor, idx) => (
                      <div key={idx} className="p-3 bg-muted/50 rounded-lg" data-testid={`competitor-${idx}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-semibold flex items-center gap-2">
                              <span>{competitor.name}</span>
                              {competitor.website && (
                                <a
                                  href={competitor.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                  data-testid={`competitor-website-${idx}`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{competitor.description}</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 mt-2 text-sm">
                          <div>
                            <span className="font-medium text-green-600 dark:text-green-400">{language === 'zh' ? '优势' : 'Strengths'}:</span>
                            <ul className="list-disc list-inside ml-2">
                              {competitor.strengths.map((strength, sidx) => (
                                <li key={sidx} className="text-muted-foreground">{strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="font-medium text-red-600 dark:text-red-400">{language === 'zh' ? '劣势' : 'Weaknesses'}:</span>
                            <ul className="list-disc list-inside ml-2">
                              {competitor.weaknesses.map((weakness, widx) => (
                                <li key={widx} className="text-muted-foreground">{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-2xl font-bold">{report.scoringFramework.dimensions.competitiveLandscape.metrics.competitorCount}</div>
                  <div className="text-xs text-muted-foreground">{language === 'zh' ? '竞争者数' : 'Competitors'}</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-2xl font-bold">{report.scoringFramework.dimensions.competitiveLandscape.metrics.recentFunding}</div>
                  <div className="text-xs text-muted-foreground">{language === 'zh' ? '近12月融资' : '12M Funding'}</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-2xl font-bold">{report.scoringFramework.dimensions.competitiveLandscape.metrics.concentrationRatio}%</div>
                  <div className="text-xs text-muted-foreground">CR5</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{report.scoringFramework.dimensions.competitiveLandscape.explanation}</p>
            </div>

            {/* Commercial Sustainability */}
            <div className="p-4 border rounded-lg" data-testid="dimension-commercial-sustainability">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{language === 'zh' ? '商业可持续性 (Commercial Sustainability)' : 'Commercial Sustainability'}</h4>
                <Badge variant="outline">{report.scoringFramework.dimensions.commercialSustainability.score}/100 ({report.scoringFramework.dimensions.commercialSustainability.weight}%)</Badge>
              </div>
              <Progress value={report.scoringFramework.dimensions.commercialSustainability.score} className="mb-3 h-2" />
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">{language === 'zh' ? '单位经济学' : 'Unit Economics'}:</span>
                  <Badge variant={report.scoringFramework.dimensions.commercialSustainability.unitEconomics.status === 'positive' ? 'default' : 'destructive'} className="ml-2">
                    {report.scoringFramework.dimensions.commercialSustainability.unitEconomics.status}
                  </Badge>
                </div>
                <div><span className="font-medium">{language === 'zh' ? '毛利率' : 'Gross Margin'}:</span> {report.scoringFramework.dimensions.commercialSustainability.unitEconomics.grossMargin}</div>
                <div><span className="font-medium">{language === 'zh' ? '回本周期' : 'Payback Period'}:</span> {report.scoringFramework.dimensions.commercialSustainability.unitEconomics.paybackPeriod}</div>
                {report.scoringFramework.dimensions.commercialSustainability.unitEconomics.improvementPath && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <span className="font-medium text-blue-800 dark:text-blue-200">{language === 'zh' ? '改善路径' : 'Improvement Path'}:</span>
                    <span className="text-blue-700 dark:text-blue-300 ml-2">{report.scoringFramework.dimensions.commercialSustainability.unitEconomics.improvementPath}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">{language === 'zh' ? '合规清晰度' : 'Regulatory Clarity'}:</span>
                  <Badge variant="outline" className="ml-2">{report.scoringFramework.dimensions.commercialSustainability.regulatoryClarity}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{report.scoringFramework.dimensions.commercialSustainability.explanation}</p>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
            <div className="font-semibold text-lg">
              {language === 'zh' ? '加权总分' : 'Weighted Total'}: {report.scoringFramework.weightedTotal}/100
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Technical & Market Details */}
      {report.technicalMarketDetails?.technical && report.technicalMarketDetails?.market && (
        <Card data-testid="section-technical-market-details">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              {language === 'zh' ? '3. 技术与市场细化' : '3. Technical & Market Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Technical */}
              <div>
                <h4 className="font-semibold mb-3">{language === 'zh' ? '技术细节' : 'Technical Details'}</h4>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium">TRL {report.technicalMarketDetails.technical.trl.level}/9 (Score: {report.technicalMarketDetails.technical.trl.mappedScore})</div>
                    <div className="text-muted-foreground mt-1">{report.technicalMarketDetails.technical.trl.description}</div>
                  </div>
                  {report.technicalMarketDetails.technical.blockingFactors.length > 0 && (
                    <div>
                      <div className="font-medium mb-1">{language === 'zh' ? '阻断因子' : 'Blocking Factors'}:</div>
                      <ul className="list-disc list-inside ml-2">
                        {report.technicalMarketDetails.technical.blockingFactors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.technicalMarketDetails.technical.verificationPaths.length > 0 && (
                    <div>
                      <div className="font-medium mb-1">{language === 'zh' ? '验证路径' : 'Verification Paths'}:</div>
                      {report.technicalMarketDetails.technical.verificationPaths.map((path, idx) => (
                        <div key={idx} className="ml-2 mt-1">
                          <div>• {path.path}</div>
                          <div className="text-muted-foreground ml-4">({path.costEfficiency})</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Market */}
              <div>
                <h4 className="font-semibold mb-3">{language === 'zh' ? '市场细节' : 'Market Details'}</h4>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium mb-2">{language === 'zh' ? '目标用户' : 'Target Users'}</div>
                    <div><span className="font-medium">{language === 'zh' ? '主人群' : 'Primary'}:</span> {report.technicalMarketDetails.market.targetUsers.primary}</div>
                    <div><span className="font-medium">{language === 'zh' ? '副人群' : 'Secondary'}:</span> {report.technicalMarketDetails.market.targetUsers.secondary}</div>
                    <div><span className="font-medium">{language === 'zh' ? '渠道' : 'Channels'}:</span> {report.technicalMarketDetails.market.targetUsers.channels}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">{language === 'zh' ? '付费意愿' : 'Payment Willingness'}:</div>
                    <div className="ml-2">
                      <div>• ARPU: {report.technicalMarketDetails.market.paymentWillingness.historicalARPU}</div>
                      <div>• {language === 'zh' ? '竞品定价' : 'Competitor Pricing'}: {report.technicalMarketDetails.market.paymentWillingness.competitorPricing}</div>
                    </div>
                  </div>
                  {(report.technicalMarketDetails.market.evidenceSources.provided.length > 0 || report.technicalMarketDetails.market.evidenceSources.needed.length > 0) && (
                    <div>
                      <div className="font-medium mb-1">{language === 'zh' ? '数据证据' : 'Evidence Sources'}:</div>
                      {report.technicalMarketDetails.market.evidenceSources.provided.length > 0 && (
                        <div className="ml-2">
                          <div className="text-green-600 dark:text-green-400">{language === 'zh' ? '已有' : 'Provided'}:</div>
                          <ul className="list-disc list-inside ml-2">
                            {report.technicalMarketDetails.market.evidenceSources.provided.map((e, idx) => (
                              <li key={idx}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {report.technicalMarketDetails.market.evidenceSources.needed.length > 0 && (
                        <div className="ml-2 mt-1">
                          <div className="text-yellow-600 dark:text-yellow-400">{language === 'zh' ? '待补充' : 'Needed'}:</div>
                          <ul className="list-disc list-inside ml-2">
                            {report.technicalMarketDetails.market.evidenceSources.needed.map((e, idx) => (
                              <li key={idx}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Competition Analysis */}
      {report.competitionAnalysis && (
        <Card data-testid="section-competition-analysis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {language === 'zh' ? '4. 红蓝海与竞争分析' : '4. Ocean Strategy & Competition'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{language === 'zh' ? '市场饱和度指数' : 'Saturation Index'}</h4>
                <Badge className={getOceanColor(report.competitionAnalysis.saturationIndex.classification)}>
                  {report.competitionAnalysis.saturationIndex.classification.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-center mb-3">
              <div className="text-4xl font-bold">{report.competitionAnalysis.saturationIndex.value.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">S = 0.5·N + 0.3·F + 0.2·CR5</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-bold">{report.competitionAnalysis.saturationIndex.components.normalizedN.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Normalized N</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-bold">{report.competitionAnalysis.saturationIndex.components.normalizedF.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Normalized F</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-bold">{report.competitionAnalysis.saturationIndex.components.normalizedCR5.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Normalized CR5</div>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-3">{language === 'zh' ? '差异化分析' : 'Differentiation Analysis'}</h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">{language === 'zh' ? '关键词覆盖差异' : 'Keyword Coverage'}:</span>
                <span className="ml-2">{report.competitionAnalysis.differentiation.keywordCoverage}%</span>
              </div>
              <div>
                <span className="font-medium">{language === 'zh' ? '替代壁垒' : 'Substitute Barriers'}:</span>
                <div className="ml-4 mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {report.competitionAnalysis.differentiation.substituteBarriers.exclusiveData ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>{language === 'zh' ? '独占数据' : 'Exclusive Data'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.competitionAnalysis.differentiation.substituteBarriers.switchingCost ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>{language === 'zh' ? '迁移成本' : 'Switching Cost'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.competitionAnalysis.differentiation.substituteBarriers.compliance ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>{language === 'zh' ? '合规壁垒' : 'Compliance'}</span>
                  </div>
                </div>
              </div>
              <div>
                <span className="font-medium">{language === 'zh' ? '差异化得分' : 'Differentiation Score'}:</span>
                <span className="ml-2">{report.competitionAnalysis.differentiation.score}/100</span>
              </div>
            </div>
          </div>

          {/* Competition Data Sources */}
          {report.competitionAnalysis.dataSources && report.competitionAnalysis.dataSources.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                {language === 'zh' ? '📊 竞争数据来源' : '📊 Competition Data Sources'}
              </div>
              <div className="flex flex-wrap gap-2">
                {report.competitionAnalysis.dataSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                    data-testid={`competition-source-${idx}`}
                  >
                    <span>{source.label}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-sm">{report.competitionAnalysis.summary}</p>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 5. Risks & Milestones */}
      {report.risksAndMilestones && (
        <Card data-testid="section-risks-milestones">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              {language === 'zh' ? '5. 风险与里程碑' : '5. Risks & Milestones'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">{language === 'zh' ? 'Top 3 风险' : 'Top 3 Risks'}</h4>
              <div className="space-y-3">
                {report.risksAndMilestones.topRisks.map((risk, idx) => (
                <div key={idx} className="p-3 border rounded-lg" data-testid={`risk-${idx}`}>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5">#{risk.priority}</Badge>
                    <div className="flex-1">
                      <div className="font-medium">{risk.risk}</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        <div><span className="font-medium">{language === 'zh' ? '缓解动作' : 'Mitigation'}:</span> {risk.mitigationAction}</div>
                        <div className="mt-1">
                          <span className="font-medium">{language === 'zh' ? '验收标准' : 'Acceptance'}:</span>
                          <span className="ml-2">{risk.acceptanceCriteria.metric} → {risk.acceptanceCriteria.target}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">{language === 'zh' ? '里程碑路径' : 'Milestone Path'}</h4>
            <div className="space-y-3">
              {report.risksAndMilestones.milestonePath.map((milestone, idx) => (
                <div key={idx} className="p-3 border rounded-lg" data-testid={`milestone-${idx}`}>
                  <div className="font-medium text-primary">{milestone.phase}</div>
                  <div className="text-sm mt-1">{milestone.objective}</div>
                  <div className="mt-2 space-y-1">
                    {milestone.kpis.map((kpi, kidx) => (
                      <div key={kidx} className="text-sm flex items-center gap-2" data-testid={`kpi-${idx}-${kidx}`}>
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span>{kpi.metric}: {kpi.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 6. Conclusion & Next Steps */}
      {report.conclusion && (
        <Card data-testid="section-conclusion">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-6 h-6" />
              {language === 'zh' ? '6. 结论与下一步' : '6. Conclusion & Next Steps'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {getDecisionIcon(report.conclusion.decision)}
            <div className="flex-1">
              <div className="font-semibold text-lg" data-testid="decision">
                {report.conclusion.decision}
              </div>
              <p className="text-sm text-muted-foreground mt-1" data-testid="decision-rationale">
                {report.conclusion.decisionRationale}
              </p>
            </div>
          </div>

          <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              {language === 'zh' ? '最薄弱环节' : 'Weakest Link'}
            </h4>
            <div className="text-sm">
              <div><span className="font-medium">{language === 'zh' ? '领域' : 'Area'}:</span> {report.conclusion.weakestLink.area}</div>
              <div className="mt-1"><span className="font-medium">{language === 'zh' ? '建议动作' : 'Recommended Action'}:</span> {report.conclusion.weakestLink.recommendedAction}</div>
            </div>
          </div>

          {report.conclusion.conditionalRequirements && report.conclusion.conditionalRequirements.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">{language === 'zh' ? '前提条件' : 'Conditional Requirements'}</h4>
              <ul className="space-y-1">
                {report.conclusion.conditionalRequirements.map((req, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2" data-testid={`conditional-req-${idx}`}>
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">{language === 'zh' ? '下一步行动' : 'Next Steps'}</h4>
            <ul className="space-y-1">
              {report.conclusion.nextSteps.map((step, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2" data-testid={`next-step-${idx}`}>
                  <Rocket className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center pt-6 border-t">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Heart className="w-5 h-5 text-red-500" />
              <span>{report.conclusion.brandTagline}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 7. Search Sources Visualization (if available) */}
      {report.searchSources && report.searchSources.length > 0 && (
        <Card data-testid="section-search-sources">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-6 h-6" />
              {language === 'zh' ? '7. 搜索来源' : '7. Search Sources'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {language === 'zh' 
                ? `以下是生成本报告时搜索的${report.searchSources.length}个真实来源，点击查看详情。` 
                : `The following are ${report.searchSources.length} real sources searched when generating this report. Click to view details.`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.searchSources.map((source, idx) => {
                const getCategoryLabel = (cat: string) => {
                  if (language === 'zh') {
                    switch (cat) {
                      case 'socialMedia': return '社交媒体';
                      case 'competitors': return '竞争对手';
                      case 'industry': return '行业趋势';
                      case 'userReviews': return '用户评价';
                      default: return cat;
                    }
                  } else {
                    switch (cat) {
                      case 'socialMedia': return 'Social Media';
                      case 'competitors': return 'Competitors';
                      case 'industry': return 'Industry';
                      case 'userReviews': return 'User Reviews';
                      default: return cat;
                    }
                  }
                };

                const getCategoryColor = (cat: string) => {
                  switch (cat) {
                    case 'socialMedia': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                    case 'competitors': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
                    case 'industry': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                    case 'userReviews': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
                    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
                  }
                };

                return (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-4 border rounded-lg hover:shadow-lg hover:border-primary transition-all duration-200 bg-card"
                    data-testid={`search-source-${idx}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={getCategoryColor(source.category)} data-testid={`source-category-${idx}`}>
                        {getCategoryLabel(source.category)}
                      </Badge>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2" data-testid={`source-title-${idx}`}>
                      {source.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3" data-testid={`source-snippet-${idx}`}>
                      {source.snippet}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 truncate" title={source.url}>
                      {new URL(source.url).hostname}
                    </p>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
