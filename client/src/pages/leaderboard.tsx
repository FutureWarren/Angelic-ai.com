import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Sparkles, Award, Medal } from "lucide-react";
import { Link } from "wouter";

interface LeaderboardIdea {
  rank: number;
  idea_id: string;
  text: string;
  category: string | null;
  stage: string | null;
  elo_score: number;
  match_count: number;
  viability_score: number | null;
  excellence_score: number | null;
  decision: string | null;
  badge: string | null;
  badge_color: string;
  badge_description: string;
  percentile: number;
}

interface LeaderboardResponse {
  total: number;
  ideas: LeaderboardIdea[];
}

export default function Leaderboard() {
  const { language } = useLanguage();
  
  const { data, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['/api/top'],
  });

  const getBadgeIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5" />;
    if (rank === 2) return <Medal className="w-5 h-5" />;
    if (rank === 3) return <Award className="w-5 h-5" />;
    return <Sparkles className="w-4 h-4" />;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500 dark:text-yellow-400";
    if (rank === 2) return "text-gray-400 dark:text-gray-300";
    if (rank === 3) return "text-orange-600 dark:text-orange-400";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:bg-black dark:from-black dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-border/40 dark:border-white/5 bg-background/50 dark:bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-2" data-testid="heading-leaderboard">
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                {language === 'zh' ? '创意排行榜' : 'Idea Leaderboard'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'zh' 
                  ? '通过AI评估和竞争性比较排名的顶级创业想法'
                  : 'Top startup ideas ranked through AI evaluation and competitive comparison'}
              </p>
            </div>
            <Link href="/">
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-home">
                {language === 'zh' ? '返回首页' : 'Back to Home'}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          </div>
        )}

        {!isLoading && data && data.total === 0 && (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {language === 'zh' ? '暂无排名' : 'No Rankings Yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'zh' 
                ? '排行榜需要至少3场比赛才能确保排名的可靠性。评估更多想法以建立排行榜！'
                : 'The leaderboard requires at least 3 matches to ensure reliable rankings. Evaluate more ideas to build the leaderboard!'}
            </p>
            <Link href="/chat">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all" data-testid="button-evaluate-idea">
                {language === 'zh' ? '评估新想法' : 'Evaluate New Idea'}
              </button>
            </Link>
          </Card>
        )}

        {!isLoading && data && data.total > 0 && (
          <div className="space-y-4">
            {/* Stats Banner */}
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800/30">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="stat-total-ideas">{data.total}</div>
                  <div className="text-sm text-muted-foreground">{language === 'zh' ? '已排名想法' : 'Ranked Ideas'}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-pink-600 dark:text-pink-400" data-testid="stat-top-elo">
                    {Math.max(...data.ideas.map(i => i.elo_score))}
                  </div>
                  <div className="text-sm text-muted-foreground">{language === 'zh' ? '最高ELO' : 'Top ELO'}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400" data-testid="stat-top-badge">
                    {data.ideas[0]?.badge || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">{language === 'zh' ? '顶级徽章' : 'Top Badge'}</div>
                </div>
              </div>
            </Card>

            {/* Leaderboard List */}
            {data.ideas.map((idea) => (
              <Card 
                key={idea.idea_id} 
                className={`p-6 hover:shadow-lg transition-all ${idea.rank <= 3 ? 'border-2' : ''} ${
                  idea.rank === 1 ? 'border-yellow-400/50 dark:border-yellow-500/30 bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-950/10' :
                  idea.rank === 2 ? 'border-gray-300/50 dark:border-gray-500/30 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-950/10' :
                  idea.rank === 3 ? 'border-orange-400/50 dark:border-orange-500/30 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/10' : ''
                }`}
                data-testid={`card-idea-${idea.idea_id}`}
              >
                <div className="flex items-start gap-6">
                  {/* Rank */}
                  <div className={`flex flex-col items-center justify-center min-w-[80px] ${getRankColor(idea.rank)}`}>
                    {getBadgeIcon(idea.rank)}
                    <div className="text-4xl font-bold mt-2">#{idea.rank}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {language === 'zh' ? '排名' : 'Rank'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Idea Text with Privacy Indicator */}
                    <div className="mb-3">
                      <h3 className="text-xl font-semibold text-foreground dark:text-white" data-testid={`text-idea-${idea.idea_id}`}>
                        {idea.text}
                      </h3>
                      {/* @ts-ignore - type definition might not include privacy fields yet */}
                      {idea.is_anonymized && !idea.is_own && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {language === 'zh' ? '（匿名化展示以保护隐私）' : '(Anonymized for privacy)'}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {/* @ts-ignore - type definition might not include is_own yet */}
                      {idea.is_own && (
                        <Badge className="text-xs bg-green-600 dark:bg-green-700 text-white border-green-600 dark:border-green-700">
                          {language === 'zh' ? '您的项目' : 'Your Project'}
                        </Badge>
                      )}
                      {/* @ts-ignore - type definition might not include is_public yet */}
                      {idea.is_public && idea.is_own && (
                        <Badge className="text-xs bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700">
                          {language === 'zh' ? '公开展示' : 'Public'}
                        </Badge>
                      )}
                      {idea.category && (
                        <Badge variant="outline" className="text-xs">
                          {idea.category}
                        </Badge>
                      )}
                      {idea.stage && (
                        <Badge variant="outline" className="text-xs">
                          {idea.stage}
                        </Badge>
                      )}
                      {idea.badge && (
                        <Badge 
                          style={{ backgroundColor: `${idea.badge_color}20`, borderColor: idea.badge_color, color: idea.badge_color }}
                          className="text-xs font-semibold"
                          data-testid={`badge-${idea.idea_id}`}
                        >
                          {idea.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="bg-muted/50 dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="text-muted-foreground text-xs mb-1">ELO {language === 'zh' ? '评分' : 'Score'}</div>
                        <div className="text-2xl font-bold text-foreground dark:text-white" data-testid={`elo-${idea.idea_id}`}>{idea.elo_score}</div>
                      </div>
                      <div className="bg-muted/50 dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="text-muted-foreground text-xs mb-1">{language === 'zh' ? '比赛次数' : 'Matches'}</div>
                        <div className="text-2xl font-bold text-foreground dark:text-white" data-testid={`matches-${idea.idea_id}`}>{idea.match_count}</div>
                      </div>
                      {idea.viability_score !== null && (
                        <div className="bg-muted/50 dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="text-muted-foreground text-xs mb-1">{language === 'zh' ? '可行性' : 'Viability'}</div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid={`viability-${idea.idea_id}`}>{idea.viability_score}</div>
                        </div>
                      )}
                      {idea.excellence_score !== null && (
                        <div className="bg-muted/50 dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="text-muted-foreground text-xs mb-1">{language === 'zh' ? '卓越性' : 'Excellence'}</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid={`excellence-${idea.idea_id}`}>{idea.excellence_score}</div>
                        </div>
                      )}
                      <div className="bg-muted/50 dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="text-muted-foreground text-xs mb-1">{language === 'zh' ? '百分位' : 'Percentile'}</div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid={`percentile-${idea.idea_id}`}>{idea.percentile}%</div>
                      </div>
                    </div>

                    {/* Badge Description */}
                    {idea.badge && (
                      <div className="mt-3 text-xs text-muted-foreground italic">
                        {idea.badge_description}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
