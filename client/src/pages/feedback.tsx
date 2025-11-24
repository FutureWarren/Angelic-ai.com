import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { AppMenu } from "@/components/app-menu";

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    feedbackType: "general",
    subject: "",
    email: "",
    content: "",
    rating: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  // Get reportId from URL if coming from report page
  const params = new URLSearchParams(window.location.search);
  const reportId = params.get('reportId');
  const conversationId = params.get('conversationId');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast({
        title: language === 'zh' ? "请输入反馈内容" : "Please enter feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/feedback", {
        ...formData,
        reportId,
        conversationId,
      });

      setSubmitted(true);
      toast({
        title: language === 'zh' ? "反馈已提交" : "Feedback submitted",
        description: language === 'zh' ? "感谢您的宝贵意见！" : "Thank you for your valuable feedback!",
      });

      setTimeout(() => {
        setLocation('/');
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: language === 'zh' ? "提交失败" : "Submission failed",
        description: language === 'zh' ? "请稍后重试" : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">
              {language === 'zh' ? '感谢反馈！' : 'Thank You!'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'zh' 
                ? '您的反馈对我们非常重要，我们会认真考虑您的建议。' 
                : 'Your feedback is very important to us. We will carefully consider your suggestions.'}
            </p>
            <Button onClick={() => setLocation('/')} data-testid="button-back-home">
              {language === 'zh' ? '返回首页' : 'Back to Home'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity">
              Angelic
            </h1>
          </Link>
          <AppMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {language === 'zh' ? '反馈与建议' : 'Feedback & Suggestions'}
            </CardTitle>
            <CardDescription>
              {language === 'zh'
                ? '我们重视每一位用户的意见。请告诉我们您的想法、遇到的问题或改进建议。'
                : 'We value every user\'s opinion. Please tell us your thoughts, issues encountered, or suggestions for improvement.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div className="space-y-2">
                <Label htmlFor="feedbackType">
                  {language === 'zh' ? '反馈类型' : 'Feedback Type'}
                </Label>
                <Select
                  value={formData.feedbackType}
                  onValueChange={(value) => setFormData({ ...formData, feedbackType: value })}
                >
                  <SelectTrigger id="feedbackType" data-testid="select-feedback-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      {language === 'zh' ? '一般反馈' : 'General Feedback'}
                    </SelectItem>
                    <SelectItem value="report">
                      {language === 'zh' ? '报告相关' : 'Report Related'}
                    </SelectItem>
                    <SelectItem value="bug">
                      {language === 'zh' ? '问题报告' : 'Bug Report'}
                    </SelectItem>
                    <SelectItem value="feature">
                      {language === 'zh' ? '功能建议' : 'Feature Request'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">
                  {language === 'zh' ? '主题（选填）' : 'Subject (Optional)'}
                </Label>
                <Input
                  id="subject"
                  placeholder={language === 'zh' ? '简短描述您的反馈...' : 'Briefly describe your feedback...'}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  data-testid="input-feedback-subject"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  {language === 'zh' ? '邮箱（选填）' : 'Email (Optional)'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={language === 'zh' ? '如需回复请留下邮箱...' : 'Leave your email if you want a reply...'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-feedback-email"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  {language === 'zh' ? '反馈内容 *' : 'Feedback Content *'}
                </Label>
                <Textarea
                  id="content"
                  placeholder={language === 'zh' 
                    ? '请详细描述您的反馈、问题或建议...' 
                    : 'Please describe your feedback, issue, or suggestion in detail...'}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="min-h-[150px]"
                  required
                  data-testid="textarea-feedback-content"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !formData.content.trim()}
                data-testid="button-submit-feedback"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {language === 'zh' ? '提交中...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '提交反馈' : 'Submit Feedback'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
