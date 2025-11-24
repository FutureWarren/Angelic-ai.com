import { useTranslations } from "@/hooks/use-translations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Sparkles, UserCircle } from "lucide-react";

type AIPersona = 'consultant' | 'customer';

interface AIPersonaSelectorProps {
  selectedPersona: AIPersona;
  onSelectPersona: (persona: AIPersona) => void;
}

const personaIcons: Record<AIPersona, React.ComponentType<{ className?: string }>> = {
  consultant: Sparkles,
  customer: UserCircle
};

export function AIPersonaSelector({ selectedPersona, onSelectPersona }: AIPersonaSelectorProps) {
  const { t } = useTranslations();

  const personas: AIPersona[] = ['consultant', 'customer'];

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <span className="text-sm text-muted-foreground mr-2" data-testid="text-persona-label">
        {t('persona.switch.tooltip')}:
      </span>
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-2">
          {personas.map((persona) => {
            const Icon = personaIcons[persona];
            return (
              <Tooltip key={persona}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectPersona(persona)}
                    data-testid={`button-persona-${persona}`}
                    className={cn(
                      "flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200",
                      "border-2 hover:scale-105 active:scale-95",
                      selectedPersona === persona
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border/30 hover:border-primary/50 hover:bg-accent/50"
                    )}
                  >
                    <Icon className={cn(
                      "w-6 h-6 mb-1 transition-colors",
                      selectedPersona === persona ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-[10px] font-medium",
                      selectedPersona === persona ? "text-primary" : "text-muted-foreground"
                    )}>
                      {t(`persona.${persona}.name` as any)}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="text-sm font-semibold">{t(`persona.${persona}.name` as any)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t(`persona.${persona}.desc` as any)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
