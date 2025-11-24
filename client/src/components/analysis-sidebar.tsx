import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Target, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisData {
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

interface AnalysisSidebarProps {
  analysisData: AnalysisData | null;
  isVisible: boolean;
}

export function AnalysisSidebar({ analysisData, isVisible }: AnalysisSidebarProps) {
  if (!isVisible || !analysisData) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="w-80 space-y-4" data-testid="analysis-sidebar">
      {/* 评分区域 */}
      <Card className="p-4" data-testid="score-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">投资评分</h3>
        </div>
        
        {/* 总分 */}
        <div className="mb-4 p-3 bg-muted rounded-lg" data-testid="total-score">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">总分</span>
            <span className={cn("text-2xl font-bold", getScoreColor(analysisData.score.total))}>
              {analysisData.score.total}/100
            </span>
          </div>
          <Progress value={analysisData.score.total} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">{analysisData.score.conclusion}</p>
        </div>

        {/* 分维度评分 */}
        <div className="space-y-3">
          <div data-testid="demand-score">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">需求强度</span>
              <span className={cn("font-semibold", getScoreColor(analysisData.score.demand))}>
                {analysisData.score.demand}/100
              </span>
            </div>
            <Progress value={analysisData.score.demand} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">{analysisData.score.reasoning.demand}</p>
          </div>

          <div data-testid="competition-score">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">竞争格局</span>
              <span className={cn("font-semibold", getScoreColor(analysisData.score.competition))}>
                {analysisData.score.competition}/100
              </span>
            </div>
            <Progress value={analysisData.score.competition} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">{analysisData.score.reasoning.competition}</p>
          </div>

          <div data-testid="monetization-score">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">变现路径</span>
              <span className={cn("font-semibold", getScoreColor(analysisData.score.monetization))}>
                {analysisData.score.monetization}/100
              </span>
            </div>
            <Progress value={analysisData.score.monetization} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">{analysisData.score.reasoning.monetization}</p>
          </div>
        </div>
      </Card>

      {/* 困难点 */}
      <Card className="p-4" data-testid="challenges-card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">关键困难点</h3>
        </div>
        
        {analysisData.challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无识别的困难点</p>
        ) : (
          <div className="space-y-2">
            {analysisData.challenges.map((challenge, index) => (
              <div 
                key={index} 
                className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800"
                data-testid={`challenge-${index}`}
              >
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-orange-700 dark:text-orange-300">{challenge}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 待办清单 */}
      <Card className="p-4" data-testid="todo-card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">行动清单</h3>
        </div>
        
        {analysisData.todoList.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无待办事项</p>
        ) : (
          <div className="space-y-2">
            {analysisData.todoList.map((todo, index) => (
              <div 
                key={index} 
                className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800"
                data-testid={`todo-${index}`}
              >
                {todo.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span className={cn(
                    "text-sm",
                    todo.completed ? "line-through text-muted-foreground" : "text-blue-700 dark:text-blue-300"
                  )}>
                    {todo.task}
                  </span>
                  {todo.deadline && (
                    <div className="text-xs text-muted-foreground mt-1">
                      截止：{todo.deadline}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}