import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Mail, 
  FileText, 
  TrendingUp, 
  RefreshCw,
  ArrowLeft,
  Calendar,
  Target,
  MessageSquare,
  MessageCircle,
  CheckCircle,
  Star,
  Eye
} from "lucide-react";
import { Link, useLocation } from "wouter";
import angelicLogo from "@assets/angelic-logo.png";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AdminStats {
  conversations: {
    total: number;
    withEmails: number;
    authenticated: number;
    anonymous: number;
    emailConversionRate: number;
  };
  messages: {
    total: number;
    user: number;
    assistant: number;
  };
  reports: {
    total: number;
    paid: number;
    paymentSuccessRate: number;
  };
  payments: {
    totalRevenue: number;
    paidReportsCount: number;
  };
  eloRanking: {
    totalIdeas: number;
    totalEvaluations: number;
    totalMatches: number;
    rankedIdeas: number;
    rankingParticipationRate: number;
  };
  reportQuality: {
    avgScore: number;
    ratingDistribution: {
      excellent: number;
      viable: number;
      borderline: number;
      notViable: number;
    };
    breakthroughDetectionRate: number;
    structureBonusRate: number;
  };
  users: {
    totalRegistered: number;
  };
  engagement: {
    publicReports: number;
    feedbackSubmissions: number;
  };
}

interface Feedback {
  id: string;
  userId: string | null;
  sessionId: string | null;
  conversationId: string | null;
  reportId: string | null;
  type: 'bug' | 'feature' | 'general';
  content: string;
  rating: number | null;
  isRead: string; // "true" | "false" as varchar in DB
  adminNotes: string | null;
  createdAt: string;
}

interface ReportScore {
  id: string;
  conversationId: string;
  reportType: string;
  createdAt: string;
  idea: string;
  overallScore: number | null;
  rating: string | null;
  structureBonus?: boolean;
  breakthroughSignal?: boolean;
  dimensions: {
    innovation: number | null;
    feasibility: number | null;
    marketPotential: number | null;
    competition: number | null;
    sustainability: number | null;
  } | null;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState<string>('');

  // Redirect to auth page if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "需要登录",
        description: "访问管理后台需要先登录",
        duration: 3000,
      });
      setLocation('/auth');
    } else if (!authLoading && isAuthenticated && user && !user.isAdmin) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有管理员权限",
        duration: 3000,
      });
      setLocation('/');
    }
  }, [isAuthenticated, authLoading, user, setLocation, toast]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  const { data: feedbacks, isLoading: feedbacksLoading, refetch: refetchFeedbacks } = useQuery<Feedback[]>({
    queryKey: ['/api/admin/feedbacks'],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  const { data: reportScores, isLoading: scoresLoading, refetch: refetchScores } = useQuery<ReportScore[]>({
    queryKey: ['/api/admin/report-scores'],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  const markReadMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      return apiRequest('PATCH', `/api/admin/feedbacks/${feedbackId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedbacks'] });
      toast({
        title: "已标记为已读",
        description: "反馈状态已更新",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ feedbackId, notes }: { feedbackId: string; notes: string }) => {
      return apiRequest('PATCH', `/api/admin/feedbacks/${feedbackId}/notes`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedbacks'] });
      setEditingNotes(null);
      setNotesValue('');
      toast({
        title: "备注已保存",
        description: "管理员备注已更新",
      });
    },
  });

  const handleSaveNotes = (feedbackId: string) => {
    updateNotesMutation.mutate({ feedbackId, notes: notesValue });
  };

  const getFeedbackTypeBadge = (type: string) => {
    const badges = {
      bug: <Badge variant="destructive" data-testid={`badge-type-bug`}>Bug</Badge>,
      feature: <Badge variant="default" className="bg-blue-500" data-testid={`badge-type-feature`}>功能建议</Badge>,
      general: <Badge variant="secondary" data-testid={`badge-type-general`}>一般反馈</Badge>,
    };
    return badges[type as keyof typeof badges] || badges.general;
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" data-testid="link-home">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <img src={angelicLogo} alt="Angelic" className="h-8 w-8" />
                <h1 className="text-xl font-semibold text-white">管理后台</h1>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchStats();
                refetchFeedbacks();
                refetchScores();
              }}
              data-testid="button-refresh"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新数据
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-4 mb-8 bg-gray-800 border-gray-700">
            <TabsTrigger value="stats" data-testid="tab-stats" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              数据统计
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              用户列表
            </TabsTrigger>
            <TabsTrigger value="report-scores" data-testid="tab-report-scores" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" />
              报告评分
            </TabsTrigger>
            <TabsTrigger value="feedbacks" data-testid="tab-feedbacks" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              用户反馈
              {feedbacks && feedbacks.filter(f => f.isRead !== 'true').length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {feedbacks.filter(f => f.isRead !== 'true').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {/* Overview Stats - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-gray-800 border-gray-700" data-testid="card-total-conversations">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">总对话数</p>
                    <p className="text-3xl font-bold text-white">{stats?.conversations?.total || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      登录 {stats?.conversations?.authenticated || 0} | 匿名 {stats?.conversations?.anonymous || 0}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-6 bg-gray-800 border-gray-700" data-testid="card-total-messages">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">AI消息总数</p>
                    <p className="text-3xl font-bold text-white">{stats?.messages?.total || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      用户 {stats?.messages?.user || 0} | AI {stats?.messages?.assistant || 0}
                    </p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-6 bg-gray-800 border-gray-700" data-testid="card-reports-total">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">报告总数</p>
                    <p className="text-3xl font-bold text-white">{stats?.reports?.total || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      全部为 Angelic 报告
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-500" />
                </div>
              </Card>

              <Card className="p-6 bg-gray-800 border-gray-700" data-testid="card-revenue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">总收入</p>
                    <p className="text-3xl font-bold text-white">${stats?.payments?.totalRevenue?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      已付款 {stats?.payments?.paidReportsCount || 0} 份
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </Card>
            </div>

            {/* Row 2: ELO Ranking & Report Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="p-6 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  ELO排名系统
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">创意总数</span>
                    <span className="font-medium text-gray-200">{stats?.eloRanking?.totalIdeas || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">AI评估次数</span>
                    <span className="font-medium text-gray-200">{stats?.eloRanking?.totalEvaluations || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">对比匹配数</span>
                    <span className="font-medium text-gray-200">{stats?.eloRanking?.totalMatches || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">参与排名创意</span>
                    <span className="font-medium text-gray-200">{stats?.eloRanking?.rankedIdeas || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">排名参与率</span>
                    <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                      {stats?.eloRanking?.rankingParticipationRate || 0}%
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <Star className="w-5 h-5 mr-2" />
                  报告质量指标
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">平均总分</span>
                    <span className="font-medium text-gray-200 text-xl">{stats?.reportQuality?.avgScore || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">突破潜力检测率</span>
                    <Badge variant="default" className="bg-orange-600">
                      {stats?.reportQuality?.breakthroughDetectionRate || 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">结构加成触发率</span>
                    <Badge variant="default" className="bg-blue-600">
                      {stats?.reportQuality?.structureBonusRate || 0}%
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">评级分布：</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-green-400 font-bold">{stats?.reportQuality?.ratingDistribution?.excellent || 0}</div>
                        <div className="text-gray-500">卓越</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">{stats?.reportQuality?.ratingDistribution?.viable || 0}</div>
                        <div className="text-gray-500">可行</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">{stats?.reportQuality?.ratingDistribution?.borderline || 0}</div>
                        <div className="text-gray-500">边缘</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-bold">{stats?.reportQuality?.ratingDistribution?.notViable || 0}</div>
                        <div className="text-gray-500">不可行</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 3: User & Engagement Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="p-6 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <Users className="w-5 h-5 mr-2" />
                  用户统计
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">注册用户数</span>
                    <span className="font-medium text-gray-200">{stats?.users?.totalRegistered || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">邮箱收集数</span>
                    <span className="font-medium text-gray-200">{stats?.conversations?.withEmails || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">邮箱转化率</span>
                    <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                      {stats?.conversations?.emailConversionRate || 0}%
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  支付统计
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">报告总数</span>
                    <span className="font-medium text-gray-200">{stats?.reports?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">已付款报告</span>
                    <span className="font-medium text-gray-200">{stats?.reports?.paid || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">支付成功率</span>
                    <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                      {stats?.reports?.paymentSuccessRate || 0}%
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <Eye className="w-5 h-5 mr-2" />
                  互动统计
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">公开分享报告</span>
                    <span className="font-medium text-gray-200">{stats?.engagement?.publicReports || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">用户反馈数</span>
                    <span className="font-medium text-gray-200">{stats?.engagement?.feedbackSubmissions || 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
                <Users className="w-5 h-5 mr-2" />
                注册用户列表
              </h3>

              {usersLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">加载用户数据中...</p>
                </div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无注册用户</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-users">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-400">邮箱</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">姓名</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">认证方式</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">注册时间</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">最后更新</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750" data-testid={`user-row-${user.id}`}>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-200">{user.email}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-300">
                              {user.firstName || user.lastName 
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : '未设置'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={user.authProvider === 'oidc' ? 'default' : 'secondary'}
                              className={user.authProvider === 'oidc' ? 'bg-blue-600' : 'bg-gray-600'}
                            >
                              {user.authProvider === 'oidc' ? 'Replit Auth' : '邮箱密码'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-sm text-gray-400">
                              <Calendar className="w-3.5 h-3.5 mr-1.5" />
                              {new Date(user.createdAt).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-sm text-gray-400">
                              {new Date(user.updatedAt).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="report-scores">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
                <Target className="w-5 h-5 mr-2" />
                创业想法评分列表
              </h3>

              {scoresLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">加载报告评分中...</p>
                </div>
              ) : !reportScores || reportScores.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无报告评分数据</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-report-scores">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-400 w-16">排名</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">创业想法</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">报告类型</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">总分</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">评级</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">各维度得分</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">生成时间</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportScores.map((report, index) => (
                        <tr key={report.id} className="border-b border-gray-700 hover:bg-gray-750" data-testid={`score-row-${report.id}`}>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="outline"
                              className={
                                index === 0 ? 'border-yellow-500 text-yellow-400 font-bold' :
                                index === 1 ? 'border-gray-400 text-gray-300 font-bold' :
                                index === 2 ? 'border-orange-600 text-orange-400 font-bold' :
                                'border-gray-600 text-gray-400'
                              }
                            >
                              #{index + 1}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-200 line-clamp-2">{report.idea || '未知想法'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="default"
                              className="bg-purple-600"
                            >
                              Angelic
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-white">{report.overallScore || '-'}</span>
                              {report.structureBonus && (
                                <Badge variant="default" className="bg-blue-600 text-xs">结构加成</Badge>
                              )}
                              {report.breakthroughSignal && (
                                <Badge variant="default" className="bg-orange-600 text-xs">突破潜力</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {report.rating && (
                              <Badge 
                                variant="outline"
                                className={
                                  report.rating === 'Excellent' ? 'border-green-600 text-green-400' :
                                  report.rating === 'Viable' ? 'border-blue-600 text-blue-400' :
                                  report.rating === 'Borderline' ? 'border-yellow-600 text-yellow-400' :
                                  'border-red-600 text-red-400'
                                }
                              >
                                {report.rating === 'Excellent' ? '卓越' : 
                                 report.rating === 'Viable' ? '可行' : 
                                 report.rating === 'Borderline' ? '边缘' : '不可行'}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {report.dimensions ? (
                              <div className="grid grid-cols-5 gap-1 text-xs text-gray-300">
                                <div className="flex flex-col items-center">
                                  <span className="text-gray-500">创新</span>
                                  <span className="font-medium">{report.dimensions.innovation || '-'}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-gray-500">可行</span>
                                  <span className="font-medium">{report.dimensions.feasibility || '-'}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-gray-500">市场</span>
                                  <span className="font-medium">{report.dimensions.marketPotential || '-'}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-gray-500">竞争</span>
                                  <span className="font-medium">{report.dimensions.competition || '-'}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-gray-500">持续</span>
                                  <span className="font-medium">{report.dimensions.sustainability || '-'}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-400">
                              {new Date(report.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                              data-testid={`button-view-report-${report.id}`}
                            >
                              <Link href={`/reports/${report.id}?admin=true`}>
                                <Eye className="w-4 h-4 mr-1" />
                                查看
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="feedbacks">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
                <MessageSquare className="w-5 h-5 mr-2" />
                用户反馈列表
              </h3>

              {feedbacksLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">加载反馈中...</p>
                </div>
              ) : !feedbacks || feedbacks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无用户反馈</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div 
                      key={feedback.id} 
                      className={`border rounded-lg p-4 ${feedback.isRead !== 'true' ? 'bg-blue-900 border-blue-700' : 'bg-gray-750 border-gray-600'}`}
                      data-testid={`feedback-${feedback.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getFeedbackTypeBadge(feedback.type)}
                          {feedback.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">{feedback.rating}/5</span>
                            </div>
                          )}
                          {feedback.isRead !== 'true' && (
                            <Badge variant="destructive" className="text-xs">新</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {feedback.isRead !== 'true' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markReadMutation.mutate(feedback.id)}
                              disabled={markReadMutation.isPending}
                              data-testid={`button-mark-read-${feedback.id}`}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              标记已读
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedFeedback(expandedFeedback === feedback.id ? null : feedback.id)}
                            data-testid={`button-toggle-${feedback.id}`}
                            className="text-gray-300 hover:bg-gray-700"
                          >
                            {expandedFeedback === feedback.id ? '收起' : '展开'}
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-400 mb-2">
                        提交时间: {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                      </p>

                      <div className="bg-gray-700 rounded p-3 mb-3">
                        <p className="text-sm whitespace-pre-wrap text-gray-200">{feedback.content}</p>
                      </div>

                      {expandedFeedback === feedback.id && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4">
                            {feedback.userId && <div>用户ID: {feedback.userId}</div>}
                            {feedback.sessionId && <div>会话ID: {feedback.sessionId.slice(0, 8)}...</div>}
                            {feedback.conversationId && <div>对话ID: {feedback.conversationId.slice(0, 8)}...</div>}
                            {feedback.reportId && <div>报告ID: {feedback.reportId.slice(0, 8)}...</div>}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">管理员备注</label>
                            {editingNotes === feedback.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={notesValue}
                                  onChange={(e) => setNotesValue(e.target.value)}
                                  placeholder="添加管理员备注..."
                                  className="min-h-[80px] bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500"
                                  data-testid={`textarea-notes-${feedback.id}`}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveNotes(feedback.id)}
                                    disabled={updateNotesMutation.isPending}
                                    data-testid={`button-save-notes-${feedback.id}`}
                                  >
                                    保存
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingNotes(null);
                                      setNotesValue('');
                                    }}
                                    data-testid={`button-cancel-notes-${feedback.id}`}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                  >
                                    取消
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {feedback.adminNotes ? (
                                  <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mb-2">
                                    <p className="text-sm whitespace-pre-wrap text-yellow-200">{feedback.adminNotes}</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400 italic mb-2">暂无备注</p>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingNotes(feedback.id);
                                    setNotesValue(feedback.adminNotes || '');
                                  }}
                                  data-testid={`button-edit-notes-${feedback.id}`}
                                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                >
                                  {feedback.adminNotes ? '编辑备注' : '添加备注'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
