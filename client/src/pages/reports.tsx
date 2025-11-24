import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Calendar, ExternalLink, LogIn, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/components/language-provider";
import { format } from "date-fns";
import { AppMenu } from "@/components/app-menu";

interface Report {
  id: string;
  conversationId: string;
  createdAt: string;
  reportType: 'angelic' | 'legacy';
  viewedAt: string | null;
  fullReport: any;
}

export default function Reports() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  // Fetch user's reports
  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/my-reports'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    document.title = language === 'zh' ? '我的报告 | Angelic' : 'My Reports | Angelic';
  }, [language]);

  // If not authenticated, show login message
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" data-testid="reports-login-required">
        <div className="max-w-md space-y-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">
            {language === 'zh' ? '请先登录' : 'Please Log In'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'zh' 
              ? '您需要登录才能查看您的报告历史记录。' 
              : 'You need to log in to view your report history.'}
          </p>
          <Button size="lg" asChild className="w-full">
            <Link href="/auth">
              <LogIn className="w-5 h-5 mr-2" />
              {language === 'zh' ? '登录' : 'Log In'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (authLoading || reportsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="reports-page">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity">
              Angelic
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/chat">
                {language === 'zh' ? '开始新对话' : 'New Chat'}
              </Link>
            </Button>
            <AppMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="reports-title">
            {language === 'zh' ? '我的分析报告' : 'My Analysis Reports'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'zh' 
              ? '查看您生成的所有创业想法分析报告' 
              : 'View all your startup idea analysis reports'}
          </p>
        </div>

        {!reports || reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-6">
                {language === 'zh' 
                  ? '您还没有生成任何报告。开始与Angelic AI对话，然后生成您的第一份分析报告！' 
                  : "You haven't generated any reports yet. Start chatting with Angelic AI and generate your first analysis report!"}
              </p>
              <Button asChild>
                <Link href="/chat">
                  {language === 'zh' ? '开始对话' : 'Start Chat'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="reports-list">
            {reports.map((report) => {
              const isAngelic = report.reportType === 'angelic';
              const reportTitle = isAngelic 
                ? report.fullReport?.idea || (language === 'zh' ? 'Angelic分析报告' : 'Angelic Analysis Report')
                : (language === 'zh' ? '详细分析报告' : 'Detailed Analysis Report');

              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow" data-testid={`report-card-${report.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5" />
                          <span className="line-clamp-1">{reportTitle}</span>
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(report.createdAt), 'yyyy-MM-dd HH:mm')}
                          </div>
                          <Badge variant={isAngelic ? "default" : "secondary"}>
                            {isAngelic ? 'Angelic' : 'Legacy'}
                          </Badge>
                          {report.viewedAt && (
                            <span className="text-xs">
                              {language === 'zh' ? '已查看' : 'Viewed'}
                            </span>
                          )}
                        </div>
                      </div>
                      {isAngelic && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/reports/${report.id}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '查看' : 'View'}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  {isAngelic && report.fullReport?.executiveSummary && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.fullReport.executiveSummary.overview}
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
