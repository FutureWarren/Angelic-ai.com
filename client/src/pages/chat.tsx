import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat-interface";
import { AIPersonaSelector } from "@/components/ai-persona-selector";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/useAuth";
import { Menu, Plus, LogIn, LogOut, User, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { Link } from "wouter";
import angelicLogo from "@assets/angelic-logo.png";
import angelicLogoLight from "@assets/angelic-logo-light.png";
import angelicLogoDark from "@assets/angelic-logo-dark.png";
import type { Conversation } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { AppMenu } from "@/components/app-menu";

type AIPersona = 'consultant' | 'customer';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

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

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [clearInput, setClearInput] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<AIPersona>('consultant');
  const { toast } = useToast();
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  // Fetch user's conversations if authenticated
  const { data: conversations, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
  });

  // 当有新对话创建后，自动展开侧边栏并刷新
  useEffect(() => {
    if (conversationId && isAuthenticated) {
      refetchConversations();
      // 在桌面端自动展开侧边栏显示历史记录
      if (window.innerWidth >= 768) {
        setSidebarCollapsed(false);
      }
    }
  }, [conversationId, isAuthenticated, refetchConversations]);

  // 处理登录后的待处理报告生成（只运行一次）
  const hasProcessedPendingRef = useRef(false);
  
  useEffect(() => {
    const handlePendingReportGeneration = async () => {
      // 只在用户登录时处理
      if (!isAuthenticated) return;
      
      // 如果已经处理过，直接返回
      if (hasProcessedPendingRef.current) return;
      
      // 检查localStorage中是否有待处理的报告生成请求
      const pendingData = localStorage.getItem('pendingReportGeneration');
      if (!pendingData) return;
      
      // 标记为已处理，防止重复执行
      hasProcessedPendingRef.current = true;
      
      try {
        const parsed = JSON.parse(pendingData);
        const { conversationId: pendingConvId, sessionId, timestamp } = parsed;
        
        // 验证payload完整性
        if (!pendingConvId || !sessionId) {
          console.error('Invalid pending report data:', parsed);
          localStorage.removeItem('pendingReportGeneration');
          toast({
            variant: "destructive",
            title: language === 'zh' ? '数据错误' : 'Data Error',
            description: language === 'zh' 
              ? '无法恢复对话，数据不完整。' 
              : 'Cannot restore conversation, incomplete data.',
            duration: 6000,
          });
          return;
        }
        
        // 检查时间戳，如果超过30分钟就过期了
        if (Date.now() - timestamp > 30 * 60 * 1000) {
          localStorage.removeItem('pendingReportGeneration');
          toast({
            title: language === 'zh' ? '会话已过期' : 'Session Expired',
            description: language === 'zh' 
              ? '您的对话会话已过期，请重新开始。' 
              : 'Your conversation session has expired. Please start over.',
            duration: 6000,
          });
          return;
        }
        
        // 1. 关联匿名对话到当前用户
        const associateResponse = await fetch('/api/conversations/associate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: pendingConvId, sessionId })
        });
        
        if (!associateResponse.ok) {
          const errorData = await associateResponse.json().catch(() => ({ message: 'Unknown error' }));
          // 失败时重置标记，允许重试
          hasProcessedPendingRef.current = false;
          throw new Error(errorData.message || 'Failed to associate conversation');
        }
        
        // 只在关联成功后才清除localStorage
        localStorage.removeItem('pendingReportGeneration');
        
        // 2. 加载对话消息
        const messagesResponse = await fetch(`/api/conversations/${pendingConvId}/messages`);
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.createdAt)
          }));
          setMessages(loadedMessages);
          setConversationId(pendingConvId);
          
          // 更新AI角色
          if (data.conversation?.aiPersona) {
            setSelectedPersona(data.conversation.aiPersona as AIPersona);
          }
        }
        
        // 3. 显示成功提示
        toast({
          title: language === 'zh' ? '欢迎回来！' : 'Welcome back!',
          description: language === 'zh' 
            ? '正在为您生成报告，请稍候...' 
            : 'Generating your report, please wait...',
          duration: 3000,
        });
        
        // 4. 自动生成报告（延迟500ms让用户看到提示）
        setTimeout(async () => {
          try {
            const reportResponse = await fetch('/api/generate-angelic-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId: pendingConvId, sessionId })
            });
            
            if (reportResponse.ok) {
              const reportData = await reportResponse.json();
              toast({
                title: language === 'zh' ? '报告生成成功！' : 'Report generated!',
                description: language === 'zh' 
                  ? '您的Angelic报告已生成，请在"我的报告"中查看。' 
                  : 'Your Angelic report has been generated. View it in "My Reports".',
                duration: 8000,
              });
              
              // 刷新对话列表
              refetchConversations();
            } else {
              throw new Error('Report generation failed');
            }
          } catch (error) {
            console.error('Auto-generate report error:', error);
            toast({
              variant: "destructive",
              title: language === 'zh' ? '报告生成失败' : 'Report Generation Failed',
              description: language === 'zh' 
                ? '自动生成报告失败，您可以稍后在对话中手动点击生成按钮重试。' 
                : 'Automatic report generation failed. You can manually click the generate button in the conversation later.',
              duration: 8000,
            });
          }
        }, 500);
        
      } catch (error) {
        console.error('Handle pending report generation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          variant: "destructive",
          title: language === 'zh' ? '处理失败' : 'Processing failed',
          description: language === 'zh' 
            ? `无法恢复您的对话：${errorMessage}。请刷新页面重试或重新开始对话。` 
            : `Failed to restore your conversation: ${errorMessage}. Please refresh the page or start a new conversation.`,
          duration: 8000,
        });
        // 失败时不删除localStorage，允许用户刷新页面重试
      }
    };
    
    handlePendingReportGeneration();
  }, [isAuthenticated]);

  useEffect(() => {
    document.title = t("chat.title");
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t("chat.meta"));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = t("chat.meta");
      document.head.appendChild(meta);
    }

    // 确保页面加载时滚动到顶部
    window.scrollTo(0, 0);
  }, [t]);

  // Add initial AI welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: language === 'zh' 
          ? `[身体后靠] 好，Angelic这边。15年看下来，什么样的想法都见过了——有些成了独角兽，有些死在PPT里。

我不是来给你泼冷水的，也不会无脑鼓励 🤔 我会帮你看清楚这个想法的真实潜力——哪里强，哪里弱，能走多远。

先说说你的想法吧。别藏着掖着，也别担心听起来不够完美。每个伟大的想法一开始都是粗糙的 💡

我需要理解几件事：谁会真正用这个？市场有多大？怎么赚钱？竞争对手在干什么？你现在做到哪一步了？

[点头] 来吧，跟我说说 🎯`
          : `[leans back] Alright, Angelic here. 15 years in—I've seen ideas that became unicorns and ones that died in the deck.

I'm not here to shoot you down or sugarcoat things 🤔 I'll help you see the real potential of this idea—where it's strong, where it's weak, how far it can go.

So tell me your idea. Don't hold back, and don't worry if it sounds rough. Every great idea starts that way 💡

I need to understand a few things: who's actually going to use this? How big is the market? How do you make money? What are competitors doing? Where are you with it right now?

[nods] Let's hear it 🎯`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [language]); // Re-run when language changes

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // 自动检测语言并切换UI（仅在第一次用户消息时）
    let effectiveLanguage = language;
    const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;
    if (isFirstUserMessage) {
      const chineseCharCount = (message.match(/[\u4e00-\u9fa5]/g) || []).length;
      const detectedLanguage = (chineseCharCount / message.length > 0.2) ? 'zh' : 'en';
      
      // 如果检测到的语言与当前UI语言不匹配，自动切换
      if (detectedLanguage !== language) {
        setLanguage(detectedLanguage);
        effectiveLanguage = detectedLanguage;  // 使用检测到的语言值
      }
    }

    // 添加用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: messages,
          conversationId: conversationId,
          sessionId: getSessionId(),
          uiLanguage: effectiveLanguage,  // 使用实际有效的语言值
          aiPersona: selectedPersona  // 传递当前选择的AI角色
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '对话失败，请重试');
      }

      const data = await response.json();
      
      // 添加AI回复
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // 更新分析数据
      if (data.analysisData) {
        setAnalysisData(data.analysisData);
      }
      
      // 更新conversationId
      if (data.conversationId) {
        setConversationId(data.conversationId);
        // Refetch conversations list when a new conversation is created
        if (isAuthenticated) {
          refetchConversations();
        }
      }

      // 更新follow-up问题
      if (data.followUpQuestions && data.followUpQuestions.length > 0) {
        setFollowUpQuestions(data.followUpQuestions);
      } else {
        setFollowUpQuestions([]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // 增强的错误分类处理
      let title = t("chat.errors.general");
      let description = t("chat.errors.general-desc");
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('failed to fetch') || errorMessage.includes('network') || errorMessage.includes('连接')) {
          title = t("chat.errors.network");
          description = t("chat.errors.network-desc");
        } else if (errorMessage.includes('500')) {
          title = t("chat.errors.server");
          description = t("chat.errors.server-desc");
        } else if (errorMessage.includes('400') || errorMessage.includes('输入')) {
          title = t("chat.errors.input");
          description = t("chat.errors.input-desc");
        } else if (errorMessage.includes('ai对话服务暂时不可用')) {
          title = t("chat.errors.ai-unavailable");
          description = t("chat.errors.ai-unavailable-desc");
        } else {
          description = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: title,
        description,
        duration: 6000,
      });

      // 移除失败的用户消息
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setAnalysisData(null);
    setClearInput(true);
    setConversationId(undefined);
    setFollowUpQuestions([]);
  };

  const handleInputCleared = () => {
    setClearInput(false);
  };

  // Load conversation from history
  const handleLoadConversation = async (convId: string) => {
    try {
      // Include sessionId for authorization if not authenticated
      const sessionId = getSessionId();
      const url = new URL(`/api/conversations/${convId}/messages`, window.location.origin);
      if (!isAuthenticated && sessionId) {
        url.searchParams.set('sessionId', sessionId);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();
      
      // Convert database messages to chat messages format
      const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt)
      }));

      setMessages(loadedMessages);
      setConversationId(convId);
      setFollowUpQuestions([]);
      setShowSidebar(false); // Close sidebar on mobile after selecting
      
      // Initialize persona from conversation if available
      if (data.conversation?.aiPersona) {
        setSelectedPersona(data.conversation.aiPersona as AIPersona);
      }

      toast({
        title: t("chat.conversation-loaded"),
        description: data.conversation.title || t("chat.conversation-loaded-desc"),
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        variant: "destructive",
        title: t("chat.errors.load-conversation"),
        description: t("chat.errors.load-conversation-desc"),
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dynamic-grid">
      {/* Conversation History Sidebar */}
      {isAuthenticated && (
        <aside 
          className={cn(
            "fixed md:relative inset-y-0 left-0 z-50 bg-background/95 backdrop-blur-sm border-r border-border transform transition-all duration-200 ease-in-out flex flex-col",
            showSidebar ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed ? "md:w-0 md:translate-x-0" : "md:w-64 md:translate-x-0",
            !sidebarCollapsed && "w-64"
          )}
          data-testid="conversation-sidebar"
        >
          <div className={cn(
            "flex flex-col h-full transition-opacity duration-200",
            sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            <div className="p-4 border-b border-border">
              <Button 
                onClick={handleNewConversation}
                className="w-full"
                data-testid="button-new-conversation-sidebar"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("nav.new-conversation")}
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversations && conversations.length > 0 ? (
                conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant={conv.id === conversationId ? "secondary" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => handleLoadConversation(conv.id)}
                    data-testid={`button-conversation-${conv.id}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {conv.title || t("chat.untitled-conversation")}
                    </span>
                  </Button>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  {t("chat.no-conversations")}
                </div>
              )}
            </div>
            
            {/* User Menu at Bottom - ChatGPT style */}
            <div className="p-4 border-t border-border">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    data-testid="button-user-menu-sidebar"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="truncate">{user?.firstName || user?.email}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                    data-testid="button-logout-sidebar"
                  >
                    <a href="/api/logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("nav.logout")}
                    </a>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  className="w-full"
                  asChild
                  data-testid="button-login-sidebar"
                >
                  <a href="/api/login">
                    <LogIn className="w-4 h-4 mr-2" />
                    {t("nav.login")}
                  </a>
                </Button>
              )}
            </div>
          </div>
          
          {/* Collapse button for desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-6 rounded-full bg-background border border-border hover:bg-accent z-50",
              sidebarCollapsed && "left-full ml-1"
            )}
            data-testid="button-collapse-sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </aside>
      )}

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] md:hidden pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            setShowSidebar(false);
          }}
          data-testid="sidebar-overlay"
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* ChatGPT-style Header */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Sidebar Toggle + Logo */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                data-testid="button-toggle-sidebar"
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <Link href="/">
              <img 
                src={theme === 'light' ? angelicLogoLight : angelicLogoDark} 
                alt="Angelic" 
                className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                data-testid="img-chat-logo"
              />
            </Link>
          </div>

          {/* Right: App Menu + Login button */}
          <div className="flex items-center gap-2">
            <AppMenu />
            {!isAuthenticated && (
              <Button
                variant="default"
                size="sm"
                asChild
                data-testid="link-login"
              >
                <Link href="/auth">
                  <LogIn className="w-4 h-4 mr-2" />
                  {t("nav.login")}
                </Link>
              </Button>
            )}
          </div>
          </div>
        </header>

        {/* Full-screen Chat Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="h-full max-w-4xl mx-auto flex flex-col">
            {/* AI Persona Selector */}
            <AIPersonaSelector
              selectedPersona={selectedPersona}
              onSelectPersona={setSelectedPersona}
            />
            
            {/* Chat Interface - 允许匿名用户使用 */}
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              clearInput={clearInput}
              onInputCleared={handleInputCleared}
              followUpQuestions={followUpQuestions}
              conversationId={conversationId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}