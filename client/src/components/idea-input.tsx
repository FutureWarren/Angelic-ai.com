import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, MessageSquare } from "lucide-react";

interface IdeaInputProps {
  onAnalyze: (idea: string) => void;
  isAnalyzing: boolean;
}

export function IdeaInput({ onAnalyze, isAnalyzing }: IdeaInputProps) {
  const [idea, setIdea] = useState("");
  const { toast } = useToast();

  const handleIdeaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Enforce character limit strictly
    if (newValue.length <= 1000) {
      setIdea(newValue);
    }
  };

  const handleSubmit = () => {
    const trimmedIdea = idea.trim();
    
    if (!trimmedIdea) {
      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            输入不能为空
          </div>
        ),
        description: "请描述您的创业想法，让AI为您提供专业诊断",
        duration: 4000,
      });
      return;
    }
    
    if (idea.length > 1000) {
      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            内容超出限制
          </div>
        ),
        description: `当前输入${idea.length}字符，请缩短到1000字符以内`,
        duration: 4000,
      });
      return;
    }

    onAnalyze(trimmedIdea);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="p-6 shadow-lg" data-testid="card-idea-input">
      <div className="space-y-4">
        <label htmlFor="startup-idea" className="block text-lg font-semibold text-foreground">
          描述您的创业想法
        </label>
        <Textarea 
          id="startup-idea"
          rows={4}
          value={idea}
          onChange={handleIdeaChange}
          onKeyPress={handleKeyPress}
          className="resize-none"
          placeholder="例如：我想开发一个基于AI的个人健身教练应用，用户可以通过摄像头获得实时运动指导和纠正..."
          disabled={isAnalyzing}
          maxLength={1000}
          data-testid="textarea-startup-idea"
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <i className="fas fa-lightbulb mr-1"></i>
            详细描述有助于获得更准确的分析
          </div>
          <div 
            className={`text-sm ${idea.length > 1000 ? 'text-destructive' : 'text-muted-foreground'}`}
            data-testid="text-char-count"
          >
            {idea.length} / 1000
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={isAnalyzing || idea.trim().length === 0 || idea.length > 1000}
          className="w-full font-semibold py-3 px-6 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          size="lg"
          data-testid="button-diagnose"
        >
          {isAnalyzing ? (
            <>
              <i className="fas fa-spinner animate-spin mr-2"></i>
              分析中<span className="loading-dots"></span>
            </>
          ) : (
            <>
              <i className="fas fa-brain mr-2"></i>
              开始诊断
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
