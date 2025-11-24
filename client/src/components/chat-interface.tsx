import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Bot, User, FileText, Mail, Loader2, Sparkles, CreditCard } from "lucide-react";
import { AngelicReportView } from "./angelic-report";
import type { AngelicReport } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/use-translations";
import { useToast } from "@/hooks/use-toast";
import { getSessionId } from "@/lib/session";
import { useLocation } from "wouter";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  clearInput?: boolean;
  onInputCleared?: () => void;
  followUpQuestions?: string[];
  conversationId?: string;
}

export function ChatInterface({ messages, onSendMessage, isLoading, clearInput, onInputCleared, followUpQuestions, conversationId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportRequested, setReportRequested] = useState(false);
  const [showAngelicReport, setShowAngelicReport] = useState(false);
  const [angelicReport, setAngelicReport] = useState<AngelicReport | null>(null);
  const [reportLanguage, setReportLanguage] = useState<'zh' | 'en'>('zh');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatingStatusIndex, setGeneratingStatusIndex] = useState(0);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, language } = useTranslations();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // 加载状态消息数组（根据索引访问）
  const loadingStatusKeys: Array<"report.generating.status1" | "report.generating.status2" | "report.generating.status3" | "report.generating.status4" | "report.generating.status5"> = [
    "report.generating.status1",
    "report.generating.status2",
    "report.generating.status3",
    "report.generating.status4",
    "report.generating.status5"
  ];

  // Handle follow-up question click
  const handleFollowUpClick = (question: string) => {
    setInput(question);
    // Auto-focus textarea
    textareaRef.current?.focus();
  };

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 动态切换加载提示文案（每2秒切换）
  useEffect(() => {
    if (isGeneratingReport) {
      setGeneratingStatusIndex(0);
      const interval = setInterval(() => {
        setGeneratingStatusIndex((prev) => (prev + 1) % 5);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGeneratingReport]);

  // 监听报告对话框关闭，显示反馈弹窗
  useEffect(() => {
    if (!showAngelicReport && angelicReport && !hasShownFeedback) {
      // 用户关闭了报告，显示反馈弹窗
      const timer = setTimeout(() => {
        setShowFeedbackDialog(true);
        setHasShownFeedback(true);
      }, 500); // 延迟500ms让对话框关闭动画完成
      return () => clearTimeout(timer);
    }
  }, [showAngelicReport, angelicReport, hasShownFeedback]);

  // 处理外部清空输入框请求
  useEffect(() => {
    if (clearInput) {
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      onInputCleared?.();
    }
  }, [clearInput, onInputCleared]);

  // 处理发送消息
  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput("");
  };

  // 处理按键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 自动调整文本框高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // 重置高度以计算新的滚动高度
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120); // 最大120px
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // 生成Angelic报告（直接在网站上显示）
  const handleGenerateAngelicReport = async () => {
    // 检查是否登录
    if (!isAuthenticated) {
      // 显示登录提示对话框
      toast({
        title: language === 'zh' ? '需要登录' : 'Login Required',
        description: language === 'zh' 
          ? '生成完整报告需要登录，登录后您的对话记录将被保存，并自动为您生成报告。' 
          : 'Generating a complete report requires login. Your conversation will be saved and the report will be generated automatically after login.',
        duration: 6000,
      });
      
      // 保存当前状态到localStorage，登录后恢复
      localStorage.setItem('pendingReportGeneration', JSON.stringify({
        conversationId,
        sessionId: getSessionId(),
        timestamp: Date.now()
      }));
      
      // 跳转到登录页面
      setLocation('/auth');
      return;
    }
    
    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/generate-angelic-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          sessionId: getSessionId()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '生成报告失败');
      }

      const data = await response.json();
      setAngelicReport(data.report);
      setReportLanguage(data.language);
      setShowAngelicReport(true);
      
      toast({
        title: t("report.success.title"),
        description: "报告已生成，正在为您展示...",
        duration: 3000,
      });

    } catch (error) {
      console.error('Generate report error:', error);
      toast({
        variant: "destructive",
        title: "生成报告失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        duration: 6000,
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // 处理报告请求 - 跳转到支付页面（Stripe payment integration）
  const handleRequestReport = () => {
    if (!conversationId) {
      toast({
        variant: "destructive",
        title: "无法生成报告",
        description: "请先开始对话",
        duration: 3000,
      });
      return;
    }

    // Navigate to payment checkout page
    setLocation(`/checkout?conversationId=${conversationId}&reportType=angelic`);
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

  // 处理反馈提交
  const handleSubmitFeedback = async () => {
    if (!feedbackRating) {
      toast({
        variant: "destructive",
        title: language === 'zh' ? '请选择评分' : 'Please select a rating',
        description: language === 'zh' ? '评分是必填项' : 'Rating is required',
      });
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackType: 'report',
          content: feedbackContent.trim() || `${feedbackRating} stars`,
          rating: feedbackRating.toString(),
          conversationId: conversationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast({
        title: language === 'zh' ? '感谢您的反馈！' : 'Thank you for your feedback!',
        description: language === 'zh' 
          ? '您的意见对我们非常重要' 
          : 'Your feedback helps us improve',
        duration: 5000,
      });

      setShowFeedbackDialog(false);
      setFeedbackRating(null);
      setFeedbackContent("");
      
    } catch (error) {
      console.error('Submit feedback error:', error);
      toast({
        variant: "destructive",
        title: language === 'zh' ? '提交失败' : 'Submission failed',
        description: language === 'zh' ? '请稍后重试' : 'Please try again later',
        duration: 6000,
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // 判断是否应该显示报告请求按钮（只在最后一条AI消息下方显示，且至少有2条消息）
  const shouldShowReportButton = (index: number) => {
    if (reportRequested) return false;
    if (messages.length < 2) return false;
    const message = messages[index];
    if (message.role !== 'assistant') return false;
    
    // 只在最后一条AI消息下显示
    const isLastMessage = index === messages.length - 1;
    const isLastAssistantMessage = !messages.slice(index + 1).some(m => m.role === 'assistant');
    
    return isLastMessage || isLastAssistantMessage;
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full" data-testid="chat-interface">
      {/* 聊天消息区域 - 全屏样式 */}
      <div className="flex-1 overflow-hidden flex flex-col" data-testid="chat-messages-container">
        <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4" data-testid="messages-list">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center" data-testid="welcome-message">
              <Bot className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-lg font-medium">{t("chat.interface.welcome")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("chat.interface.welcome-desc")}</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index}>
                <div
                  className={cn(
                    "flex w-full",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <div
                    className={cn(
                      "flex max-w-[80%] gap-2",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* 头像 */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        message.role === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-accent text-accent-foreground"
                      )}
                    >
                      {message.role === 'user' ? 
                        <User className="w-4 h-4" /> : 
                        <Bot className="w-4 h-4" />
                      }
                    </div>
                    
                    {/* 消息内容 */}
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 break-words",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground border border-border"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.timestamp && (
                        <div className={cn(
                          "text-xs mt-1 opacity-70",
                          message.role === 'user' ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 免费生成 Angelic 报告按钮 */}
                {shouldShowReportButton(index) && (
                  <div className="flex justify-start mt-2 ml-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAngelicReport}
                      disabled={isGeneratingReport}
                      className="text-xs h-8 gap-1.5 hover:bg-primary/10 hover:text-primary border-primary/20"
                      data-testid="button-generate-report"
                    >
                      {isGeneratingReport ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {language === 'zh' ? '生成中...' : 'Generating...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          {language === 'zh' ? '生成 Angelic 报告' : 'Generate Angelic Report'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex justify-start" data-testid="loading-indicator">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2 border border-border">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: "0ms"}}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: "150ms"}}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: "300ms"}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Follow-up Questions (Perplexity-style) */}
          {!isLoading && followUpQuestions && followUpQuestions.length > 0 && messages.length > 0 && (
            <div className="flex justify-start mt-4 animate-fadeInUp" data-testid="follow-up-questions">
              <div className="flex flex-col gap-2 max-w-[80%]">
                <div className="text-xs text-muted-foreground ml-10">
                  {t("chat.interface.follow-up-hint")}
                </div>
                <div className="flex flex-col gap-2 ml-10">
                  {followUpQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowUpClick(question)}
                      className="justify-start text-left h-auto py-2 px-3 hover:bg-accent/50 transition-colors"
                      data-testid={`button-follow-up-${index}`}
                    >
                      <span className="text-sm text-foreground">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 - 固定在底部 */}
      <div className="border-t border-border bg-background p-4 flex-shrink-0" data-testid="chat-input-container">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={t("chat.interface.placeholder")}
            className="resize-none min-h-[40px] max-h-[120px]"
            disabled={isLoading}
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="px-3 self-end"
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>{t("chat.interface.send-hint")}</span>
          <span>{input.length}/1000</span>
        </div>
      </div>

      {/* Angelic报告展示对话框 - 全屏 */}
      <Dialog open={showAngelicReport} onOpenChange={setShowAngelicReport}>
        <DialogContent className="max-w-screen-2xl w-full h-[90vh] p-0 overflow-hidden" data-testid="angelic-report-dialog">
          <div className="h-full overflow-y-auto">
            {angelicReport && (
              <AngelicReportView report={angelicReport} language={reportLanguage} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 邮件收集对话框 (保留,暂时不用) */}
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

      {/* 报告反馈对话框 */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md" data-testid="feedback-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              {language === 'zh' ? '报告反馈' : 'Report Feedback'}
            </DialogTitle>
            <DialogDescription>
              {language === 'zh' 
                ? '您对这份报告的质量满意吗？您的反馈将帮助我们改进服务。' 
                : 'Are you satisfied with the quality of this report? Your feedback helps us improve our service.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 评分选择 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'zh' ? '整体评分' : 'Overall Rating'} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 justify-center" data-testid="rating-selector">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={feedbackRating === rating ? "default" : "outline"}
                    size="lg"
                    onClick={() => setFeedbackRating(rating)}
                    className="w-12 h-12"
                    data-testid={`rating-${rating}`}
                  >
                    {rating}
                  </Button>
                ))}
              </div>
            </div>

            {/* 可选的文字反馈 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'zh' ? '详细反馈（可选）' : 'Detailed Feedback (Optional)'}
              </label>
              <Textarea
                placeholder={language === 'zh' 
                  ? '请告诉我们您的想法...' 
                  : 'Tell us what you think...'}
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                disabled={isSubmittingFeedback}
                className="min-h-[100px]"
                data-testid="input-feedback-content"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackDialog(false)}
                disabled={isSubmittingFeedback}
                className="flex-1"
                data-testid="button-skip-feedback"
              >
                {language === 'zh' ? '跳过' : 'Skip'}
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback || !feedbackRating}
                className="flex-1"
                data-testid="button-submit-feedback"
              >
                {isSubmittingFeedback && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'zh' ? '提交' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}