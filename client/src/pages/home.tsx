import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat-interface";
import { AnalysisSidebar } from "@/components/analysis-sidebar";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Wifi, Server, AlertTriangle, History, BarChart3 } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { Link } from "wouter";

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
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [clearInput, setClearInput] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

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
          sessionId: getSessionId()
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
        setShowAnalysis(true);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // 增强的错误分类处理
      let title = "对话失败";
      let description = "对话过程中出现未知错误，请重试";
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('failed to fetch') || errorMessage.includes('network') || errorMessage.includes('连接')) {
          title = "网络连接错误";
          description = "无法连接到服务器，请检查网络连接后重试";
        } else if (errorMessage.includes('500')) {
          title = "服务器错误";
          description = "服务器暂时不可用，请稍后重试";
        } else if (errorMessage.includes('400') || errorMessage.includes('输入')) {
          title = "输入错误";
          description = "请检查您的输入是否符合要求";
        } else if (errorMessage.includes('ai对话服务暂时不可用')) {
          title = "AI服务不可用";
          description = "AI对话服务暂时维护中，请稍后重试";
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
    setShowAnalysis(false);
    setClearInput(true);
  };

  const handleInputCleared = () => {
    setClearInput(false);
  };

  const toggleAnalysis = () => {
    setShowAnalysis(!showAnalysis);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <i className="fas fa-wings text-white text-lg"></i>
              </div>
              <h1 className="text-2xl font-bold gradient-text bg-[#ffffff]">Angelic AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/history">
                <Button variant="ghost" size="sm" data-testid="button-history">
                  <History className="w-4 h-4 mr-2" />
                  历史记录
                </Button>
              </Link>
              {analysisData && (
                <Button 
                  variant={showAnalysis ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleAnalysis}
                  data-testid="button-toggle-analysis"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  分析报告
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNewConversation}
                data-testid="button-new-conversation"
              >
                新对话
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          {messages.length === 0 && (
            <div className="text-center space-y-6" data-testid="hero-section">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold text-center">
                  <span className="gradient-text bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    创业想法诊断助手
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  与专业的AI创业导师对话，获得个性化的商业建议、市场分析和实用指导
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-lightbulb text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <h3 className="font-semibold mb-2">创意分析</h3>
                  <p className="text-sm text-muted-foreground">
                    深入分析您的创业想法，挖掘潜在机会
                  </p>
                </Card>
                
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-chart-line text-blue-600 dark:text-blue-400 text-xl"></i>
                  </div>
                  <h3 className="font-semibold mb-2">市场洞察</h3>
                  <p className="text-sm text-muted-foreground">
                    提供市场趋势分析和竞争情报
                  </p>
                </Card>
                
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-route text-purple-600 dark:text-purple-400 text-xl"></i>
                  </div>
                  <h3 className="font-semibold mb-2">行动指导</h3>
                  <p className="text-sm text-muted-foreground">
                    获得具体可行的下一步建议
                  </p>
                </Card>
              </div>
            </div>
          )}

          {/* Chat Interface with Analysis Sidebar */}
          <div className="flex gap-6">
            {/* Chat Interface */}
            <div className={`transition-all duration-300 ${showAnalysis ? 'flex-1' : 'w-full'}`}>
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                clearInput={clearInput}
                onInputCleared={handleInputCleared}
              />
            </div>
            
            {/* Analysis Sidebar */}
            {showAnalysis && (
              <div className="transition-all duration-300">
                <AnalysisSidebar
                  analysisData={analysisData}
                  isVisible={showAnalysis}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}