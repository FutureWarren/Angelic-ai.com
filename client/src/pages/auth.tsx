import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";
import { useLanguage } from "@/components/language-provider";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslations();
  const { language } = useLanguage();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: language === "zh" ? "错误" : "Error",
        description: language === "zh" ? "请填写所有必填字段" : "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      toast({
        title: language === "zh" ? "登录成功" : "Login successful",
        description: language === "zh" ? "欢迎回来！" : "Welcome back!",
      });
      setLocation("/chat");
    } catch (error: any) {
      toast({
        title: language === "zh" ? "登录失败" : "Login failed",
        description: error.message || t("auth.error.login-failed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerEmail || !registerPassword) {
      toast({
        title: language === "zh" ? "错误" : "Error",
        description: language === "zh" ? "请填写所有必填字段" : "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 8) {
      toast({
        title: language === "zh" ? "错误" : "Error",
        description: language === "zh" ? "密码至少需要8位字符" : "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register", {
        email: registerEmail,
        password: registerPassword,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      toast({
        title: language === "zh" ? "注册成功" : "Registration successful",
        description: language === "zh" ? "账户创建成功！" : "Account created successfully!",
      });
      setLocation("/chat");
    } catch (error: any) {
      const message = error.message || "";
      if (message.includes("already registered") || message.includes("已被注册")) {
        toast({
          title: language === "zh" ? "注册失败" : "Registration failed",
          description: t("auth.error.email-exists"),
          variant: "destructive",
        });
      } else {
        toast({
          title: language === "zh" ? "注册失败" : "Registration failed",
          description: t("auth.error.registration-failed"),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === "zh" ? "返回首页" : "Back to Home"}
        </Link>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? t("auth.login.title") : t("auth.register.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin ? t("auth.login.subtitle") : t("auth.register.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLogin ? (
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t("auth.login.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      data-testid="input-login-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t("auth.login.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      data-testid="input-login-password"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login-submit"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("auth.login.button")}
                </Button>
              </form>
            ) : (
              <form onSubmit={onRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">{t("auth.register.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      autoComplete="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      data-testid="input-register-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t("auth.register.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      autoComplete="new-password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      data-testid="input-register-password"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-firstname">{t("auth.register.firstName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-firstname"
                        placeholder={language === "zh" ? "张" : "Future"}
                        className="pl-10"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        data-testid="input-register-firstname"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-lastname">{t("auth.register.lastName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-lastname"
                        placeholder={language === "zh" ? "三" : "Wei"}
                        className="pl-10"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        data-testid="input-register-lastname"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-register-submit"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("auth.register.button")}
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("auth.login.or-continue-with")}
                </span>
              </div>
            </div>

            {/* Replit Auth Button */}
            <Button
              variant="outline"
              className="w-full"
              asChild
              data-testid="button-replit-auth"
            >
              <a href="/api/login">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 5v14h14V5H5zm7 12H7v-5h5v5zm0-7H7V7h5v3zm5 7h-3v-5h3v5z"/>
                </svg>
                {t("auth.login.replit-auth")}
              </a>
            </Button>

            {/* Toggle Login/Register */}
            <div className="text-center text-sm">
              {isLogin ? (
                <>
                  <span className="text-muted-foreground">{t("auth.login.no-account")} </span>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-primary hover:underline font-medium"
                    data-testid="link-register"
                  >
                    {t("auth.login.register-link")}
                  </button>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">{t("auth.register.have-account")} </span>
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary hover:underline font-medium"
                    data-testid="link-login"
                  >
                    {t("auth.register.login-link")}
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
