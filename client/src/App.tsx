import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import Landing from "@/pages/landing";
import Chat from "@/pages/chat";
import Admin from "@/pages/admin";
import About from "@/pages/about";
import Reports from "@/pages/reports";
import ReportView from "@/pages/report-view";
import ReportCheckout from "@/pages/report-checkout";
import AuthPage from "@/pages/auth";
import FeedbackPage from "@/pages/feedback";
import Leaderboard from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/chat" component={Chat} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/admin" component={Admin} />
      <Route path="/about" component={About} />
      <Route path="/my-reports" component={Reports} />
      <Route path="/reports/:reportId" component={ReportView} />
      <Route path="/checkout" component={ReportCheckout} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="angelic-ui-theme">
        <LanguageProvider defaultLanguage="zh" storageKey="angelic-ui-language">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
