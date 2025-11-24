import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  Info, 
  Languages, 
  Sun, 
  Moon, 
  MessageCircle,
  FileText,
  Globe,
  Monitor
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export function AppMenu() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          data-testid="button-app-menu"
          aria-label={language === 'zh' ? '打开菜单' : 'Open menu'}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {language === 'zh' ? '菜单' : 'Menu'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* 关于Angelic */}
        <DropdownMenuItem asChild>
          <Link href="/about" className="flex items-center cursor-pointer" data-testid="menuitem-about">
            <Info className="mr-2 h-4 w-4" />
            {language === 'zh' ? '关于 Angelic' : 'About Angelic'}
          </Link>
        </DropdownMenuItem>

        {/* 排行榜 - 暂时隐藏，功能尚未成熟 */}
        {/* <DropdownMenuItem asChild>
          <Link href="/leaderboard" className="flex items-center cursor-pointer" data-testid="menuitem-leaderboard">
            <TrendingUp className="mr-2 h-4 w-4" />
            {language === 'zh' ? '创意排行榜' : 'Leaderboard'}
          </Link>
        </DropdownMenuItem> */}

        {/* 报告历史 - 仅登录用户可见 */}
        {isAuthenticated && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/my-reports" className="flex items-center cursor-pointer" data-testid="menuitem-my-reports">
                <FileText className="mr-2 h-4 w-4" />
                {language === 'zh' ? '我的报告' : 'My Reports'}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {/* 反馈 */}
        <DropdownMenuItem asChild>
          <Link 
            href="/feedback" 
            className="flex items-center cursor-pointer"
            data-testid="menuitem-feedback"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {language === 'zh' ? '反馈' : 'Feedback'}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 语言切换 */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-testid="submenu-language">
            <Languages className="mr-2 h-4 w-4" />
            {language === 'zh' ? '语言' : 'Language'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onSelect={() => setLanguage('zh')}
              className="cursor-pointer"
              data-testid="menuitem-language-zh"
            >
              <Globe className="mr-2 h-4 w-4" />
              中文
              {language === 'zh' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setLanguage('en')}
              className="cursor-pointer"
              data-testid="menuitem-language-en"
            >
              <Globe className="mr-2 h-4 w-4" />
              English
              {language === 'en' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* 主题切换 */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-testid="submenu-theme">
            {theme === 'dark' ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            {language === 'zh' ? '主题' : 'Theme'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onSelect={() => setTheme('light')}
              className="cursor-pointer"
              data-testid="menuitem-theme-light"
            >
              <Sun className="mr-2 h-4 w-4" />
              {language === 'zh' ? '浅色' : 'Light'}
              {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setTheme('dark')}
              className="cursor-pointer"
              data-testid="menuitem-theme-dark"
            >
              <Moon className="mr-2 h-4 w-4" />
              {language === 'zh' ? '深色' : 'Dark'}
              {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setTheme('system')}
              className="cursor-pointer"
              data-testid="menuitem-theme-system"
            >
              <Monitor className="mr-2 h-4 w-4" />
              {language === 'zh' ? '跟随系统' : 'System'}
              {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
