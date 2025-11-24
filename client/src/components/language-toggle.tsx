import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === "zh" ? "en" : "zh")
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-9 w-9 p-0"
      data-testid="language-toggle"
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">切换语言 / Switch Language</span>
    </Button>
  )
}