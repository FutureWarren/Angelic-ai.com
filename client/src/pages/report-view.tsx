import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AngelicReportView } from "@/components/angelic-report";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Home, Share2, Check } from "lucide-react";
import { Link } from "wouter";
import type { AngelicReport } from "@shared/schema";
import { AppMenu } from "@/components/app-menu";
import { useToast } from "@/hooks/use-toast";

export default function ReportView() {
  const { reportId } = useParams<{ reportId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Get URL parameters for share token and admin mode
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminView = urlParams.get('admin') === 'true';
  const shareToken = urlParams.get('token');

  // Fetch report data - include token in API call if present
  const apiUrlParams = new URLSearchParams();
  if (isAdminView) apiUrlParams.set('admin', 'true');
  if (shareToken) apiUrlParams.set('token', shareToken);
  const apiUrl = `/api/reports/${reportId}${apiUrlParams.toString() ? '?' + apiUrlParams.toString() : ''}`;
  
  const { data: reportData, isLoading, error } = useQuery<{
    report: AngelicReport;
    language: 'zh' | 'en';
    shareToken?: string;
    reportId: string;
  }>({
    queryKey: [apiUrl],
    enabled: !!reportId,
  });

  useEffect(() => {
    document.title = "查看报告 | Angelic";
  }, []);

  const handleCopyLink = async () => {
    // Build shareable link with token
    let reportUrl = `${window.location.origin}/reports/${reportId}`;
    if (reportData?.shareToken) {
      reportUrl += `?token=${reportData.shareToken}`;
    }
    
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      toast({
        title: reportData?.language === 'zh' ? "链接已复制" : "Link copied",
        description: reportData?.language === 'zh' 
          ? "报告链接已复制到剪贴板，任何人都可以通过此链接查看报告" 
          : "Report link has been copied to clipboard. Anyone with this link can view the report",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: reportData?.language === 'zh' ? "复制失败" : "Copy failed",
        description: reportData?.language === 'zh' 
          ? "无法复制链接，请手动复制浏览器地址栏的链接" 
          : "Failed to copy link, please manually copy the link from the address bar",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" data-testid="report-loading">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">加载报告中...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4" data-testid="report-error">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">报告加载失败</h2>
        <p className="text-muted-foreground mb-6 text-center">
          {error instanceof Error ? error.message : "无法找到该报告或您没有访问权限"}
        </p>
        <Button asChild>
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="report-view-page">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity">
              Angelic
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLink}
              data-testid="button-copy-link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {reportData?.language === 'zh' ? '已复制' : 'Copied'}
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  {reportData?.language === 'zh' ? '复制链接' : 'Copy Link'}
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" asChild data-testid="button-all-reports">
              <Link href="/my-reports">
                {reportData?.language === 'zh' ? '查看所有报告' : 'All Reports'}
              </Link>
            </Button>
            <AppMenu />
          </div>
        </div>
      </header>

      {/* Report Content */}
      <div className="container mx-auto py-8">
        <AngelicReportView report={reportData.report} language={reportData.language} />
        
        {/* Feedback Button */}
        <div className="max-w-4xl mx-auto mt-8 mb-4 flex justify-center">
          <Button 
            variant="outline" 
            asChild 
            className="gap-2"
            data-testid="button-report-feedback"
          >
            <Link href={`/feedback?reportId=${reportId}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {reportData?.language === 'zh' ? '对这份报告提供反馈' : 'Give Feedback on This Report'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
