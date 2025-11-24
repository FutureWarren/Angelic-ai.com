import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";
import { FileText, Mail, CheckCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";

interface ReportRequestSidebarProps {
  hasConversation: boolean;
  conversationId?: string;
}

export function ReportRequestSidebar({ hasConversation, conversationId }: ReportRequestSidebarProps) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportRequested, setReportRequested] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslations();

  const handleRequestReport = () => {
    if (!hasConversation) {
      toast({
        variant: "destructive",
        title: t("report.errors.need-conversation"),
        description: t("report.errors.need-conversation-desc"),
      });
      return;
    }
    setShowEmailDialog(true);
  };

  const handleSubmitEmail = async () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: t("report.errors.empty-email"),
        description: t("report.errors.empty-email-desc"),
      });
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: t("report.errors.invalid-email"),
        description: t("report.errors.invalid-email-desc"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/request-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          sessionId: getSessionId(),
          conversationId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '申请失败');
      }

      toast({
        title: t("report.success.title"),
        description: t("report.success.description"),
        duration: 8000,
      });

      setReportRequested(true);
      setShowEmailDialog(false);
      setEmail("");
      
    } catch (error) {
      console.error('Request report error:', error);
      toast({
        variant: "destructive",
        title: t("report.errors.request-failed"),
        description: t("report.errors.request-failed-desc"),
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasConversation) {
    return (
      <Card className="p-6 h-fit" data-testid="report-sidebar-empty">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">{t("report.empty.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("report.empty.description")}
              </p>
            </div>
          </div>

        </div>
      </Card>
    );
  }

  if (reportRequested) {
    return (
      <Card className="p-6 h-fit border-green-200 bg-green-50" data-testid="report-sidebar-requested">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-green-800 mb-2">{t("report.requested.title")}</h3>
            <p className="text-sm text-green-700">
              {t("report.requested.description")}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {t("report.requested.time")}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 h-fit border-primary/20 bg-primary/5" data-testid="report-sidebar-available">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{t("report.available.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("report.available.description")}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary-foreground font-medium">1</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("report.features.market-analysis")}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary-foreground font-medium">2</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("report.features.competition-analysis")}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary-foreground font-medium">3</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("report.features.business-plan")}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary-foreground font-medium">4</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("report.features.investor-advice")}</p>
            </div>
          </div>

          <Button 
            onClick={handleRequestReport}
            className="w-full"
            data-testid="button-request-report"
          >
            <Mail className="w-4 h-4 mr-2" />
            {t("report.button.request")}
          </Button>
        </div>
      </Card>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md" data-testid="email-collection-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              {t("report.dialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("report.dialog.description")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder={t("report.dialog.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                data-testid="input-email"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) {
                    handleSubmitEmail();
                  }
                }}
              />
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {t("report.dialog.info")}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                disabled={isSubmitting}
                className="flex-1"
                data-testid="button-cancel-email"
              >
                {t("report.dialog.cancel")}
              </Button>
              <Button
                onClick={handleSubmitEmail}
                disabled={isSubmitting || !email.trim()}
                className="flex-1"
                data-testid="button-submit-email"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("report.dialog.submit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}