import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisResult as SharedAnalysisResult } from "@shared/schema";

// Backward compatible type for existing data without summary
type AnalysisResult = Omit<SharedAnalysisResult, 'summary'> & {
  summary?: string;
};

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function AnalysisResults({ result, onReset }: AnalysisResultsProps) {
  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 !== 0;
    const emptyStars = 5 - Math.ceil(score);

    return (
      <div className="flex space-x-1">
        {/* Full stars */}
        {Array(fullStars).fill(0).map((_, i) => (
          <i key={`full-${i}`} className="fas fa-star text-yellow-400"></i>
        ))}
        {/* Half star */}
        {hasHalfStar && <i className="fas fa-star-half-alt text-yellow-400"></i>}
        {/* Empty stars */}
        {Array(emptyStars).fill(0).map((_, i) => (
          <i key={`empty-${i}`} className="far fa-star text-gray-300"></i>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in" data-testid="div-results-section">
      <Card className="p-6 shadow-lg" data-testid="card-analysis-results">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
            <i className="fas fa-robot text-accent-foreground text-sm"></i>
          </div>
          <h3 className="text-lg font-semibold text-foreground">AI 诊断结果</h3>
          <span className="ml-auto text-sm text-muted-foreground">刚刚</span>
        </div>
        
        {/* AI Analysis Summary - with backward compatibility */}
        {result.summary && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6" data-testid="card-summary">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mr-2">
                <i className="fas fa-brain text-accent-foreground text-xs"></i>
              </div>
              <h4 className="font-semibold text-accent-foreground">AI 分析总结</h4>
            </div>
            <p className="text-sm text-foreground leading-relaxed" data-testid="text-summary">
              {result.summary}
            </p>
          </div>
        )}
        
        {/* Analysis Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Advantages Card */}
          <div className="bg-card border border-green-700/30 rounded-lg p-5" data-testid="card-advantages">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-2">
                <i className="fas fa-thumbs-up text-white text-xs"></i>
              </div>
              <h4 className="font-semibold text-green-300">优势分析</h4>
            </div>
            <ul className="space-y-2 text-sm text-green-200">
              {result.advantages.map((advantage, index) => (
                <li key={index} className="flex items-start" data-testid={`text-advantage-${index}`}>
                  <i className="fas fa-check text-green-400 mt-1 mr-2 text-xs"></i>
                  {advantage}
                </li>
              ))}
            </ul>
          </div>

          {/* Challenges Card */}
          <div className="bg-card border border-amber-700/30 rounded-lg p-5" data-testid="card-challenges">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center mr-2">
                <i className="fas fa-exclamation-triangle text-white text-xs"></i>
              </div>
              <h4 className="font-semibold text-amber-300">挑战分析</h4>
            </div>
            <ul className="space-y-2 text-sm text-amber-200">
              {result.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start" data-testid={`text-challenge-${index}`}>
                  <i className="fas fa-minus text-amber-400 mt-1 mr-2 text-xs"></i>
                  {challenge}
                </li>
              ))}
            </ul>
          </div>

          {/* Market Potential Card */}
          <div className="bg-card border border-blue-700/30 rounded-lg p-5" data-testid="card-market-potential">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                <i className="fas fa-chart-line text-white text-xs"></i>
              </div>
              <h4 className="font-semibold text-blue-300">市场潜力</h4>
            </div>
            <div className="space-y-3 text-sm text-blue-200">
              <div className="flex justify-between items-center">
                <span>整体评分：</span>
                <div className="flex items-center">
                  <div className="flex space-x-1 mr-2" data-testid="div-market-score-stars">
                    {renderStars(result.marketPotential.score)}
                  </div>
                  <span className="font-semibold" data-testid="text-market-score">
                    {result.marketPotential.score}/5
                  </span>
                </div>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(result.marketPotential.score / 5) * 100}%` }}
                  data-testid="div-market-score-bar"
                ></div>
              </div>
              <p className="text-xs" data-testid="text-market-description">
                {result.marketPotential.description}
              </p>
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="bg-card border border-purple-700/30 rounded-lg p-5" data-testid="card-next-steps">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                <i className="fas fa-road text-white text-xs"></i>
              </div>
              <h4 className="font-semibold text-purple-300">建议下一步</h4>
            </div>
            <ol className="space-y-2 text-sm text-purple-200">
              {result.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start" data-testid={`text-next-step-${index}`}>
                  <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border">
          <Button 
            variant="secondary" 
            className="flex-1"
            data-testid="button-export-report"
          >
            <i className="fas fa-download mr-2"></i>
            导出报告
          </Button>
          <Button 
            variant="default" 
            className="flex-1"
            data-testid="button-share-results"
          >
            <i className="fas fa-share mr-2"></i>
            分享结果
          </Button>
          <Button 
            variant="default" 
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={onReset}
            data-testid="button-reset-analysis"
          >
            <i className="fas fa-redo mr-2"></i>
            重新分析
          </Button>
        </div>
      </Card>
    </div>
  );
}
