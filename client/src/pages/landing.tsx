import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Lightbulb, TrendingUp, Target, Users, Sparkles, AlertTriangle, Search, BarChart3, Zap, Shield, CheckCircle2, Award, Brain } from "lucide-react";
import angelicLogo from "@assets/angelic-logo.png";
import angelicLogoLight from "@assets/angelic-logo-light.png";
import angelicLogoCenterLight from "@assets/angelic-logo-center-light.png";
import angelicLogoDark from "@assets/angelic-logo-dark.png";
import { AppMenu } from "@/components/app-menu";
import { useTheme } from "@/components/theme-provider";
import { useTranslations } from "@/hooks/use-translations";
import { useEffect, useState, useRef } from "react";

export default function Landing() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { theme } = useTheme();
  const { t } = useTranslations();

  useEffect(() => {
    document.title = t('site.title');
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '通过AI智能分析，将您的创业想法转化为可行的商业计划。专业诊断，精准建议，让每个创意都有实现的可能。体验Angelic的创业智能分析服务。');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = '通过AI智能分析，将您的创业想法转化为可行的商业计划。专业诊断，精准建议，让每个创意都有实现的可能。体验Angelic的创业智能分析服务。';
      document.head.appendChild(meta);
    }
  }, [t]);

  useEffect(() => {
    // Wait for DOM to be ready
    const setupObserver = () => {
      // Intersection observer for scroll animations
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId = entry.target.getAttribute('data-section');
              if (sectionId) {
                setVisibleSections(prev => {
                  const newSet = new Set(prev);
                  newSet.add(sectionId);
                  return newSet;
                });
              }
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      // Observe all sections - ensure they exist first
      const sections = document.querySelectorAll('[data-section]');
      if (sections.length > 0) {
        sections.forEach((section) => {
          observerRef.current?.observe(section);
        });

        // Initial hero animation - only trigger once
        setTimeout(() => {
          setVisibleSections(prev => {
            // Only add if not already present to prevent re-animation
            if (!prev.has('hero')) {
              const newSet = new Set(prev);
              newSet.add('hero');
              return newSet;
            }
            return prev;
          });
        }, 100);
      }
    };

    // Use RAF to ensure DOM is ready
    requestAnimationFrame(() => {
      setupObserver();
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src={theme === 'light' ? angelicLogoLight : angelicLogoDark} 
                alt="Angelic Logo" 
                className="h-16 w-auto opacity-90"
                data-testid="img-logo"
              />
            </div>
            <div className="flex items-center space-x-2">
              <AppMenu />
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90" size="sm" data-testid="button-start-experience">
                <Link href="/chat">{t('nav.experience')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-future-purple flex items-center justify-center min-h-screen" data-section="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
          <div className="max-w-4xl mx-auto">
            <div className={`mb-8 transition-all duration-1000 ${
              visibleSections.has('hero') ? 'animate-float-up' : 'opacity-0-scale'
            }`}>
              <img 
                src={theme === 'light' ? angelicLogoCenterLight : angelicLogo} 
                alt="Angelic - Startup Intelligence" 
                className="h-40 w-auto mx-auto mb-8 opacity-95"
                data-testid="img-hero-logo"
              />
            </div>
            
            <h1 className={`text-3xl sm:text-5xl lg:text-7xl font-light tracking-tight text-foreground mb-6 sm:mb-8 transition-all duration-1000 ${
              visibleSections.has('hero') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              <span className="font-extralight">{t('hero.title.inspire')}</span>
              <span className="mx-2 sm:mx-3 font-normal">·</span>
              <span className="font-extralight">{t('hero.title.analyze')}</span>
              <span className="mx-2 sm:mx-3 font-normal">·</span>
              <span className="font-extralight">{t('hero.title.grow')}</span>
            </h1>
            
            <p className={`text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto transition-all duration-1000 ${
              visibleSections.has('hero') ? 'animate-fade-in-up anim-delay-500' : 'opacity-0-init'
            }`}>
              {t('hero.subtitle')}
            </p>
            
            <div className={`flex justify-center transition-all duration-1000 ${
              visibleSections.has('hero') ? 'animate-scale-in anim-delay-700' : 'opacity-0-scale'
            }`}>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 h-auto" 
                data-testid="button-learn-more"
                asChild
              >
                <Link href="/about">
                  {t('hero.learn-more')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 bg-dynamic-grid" data-section="mission">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-6 sm:mb-10 md:mb-12">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-3 sm:mb-4 md:mb-6 transition-all duration-1000 ${
              visibleSections.has('mission') ? 'animate-fade-in-up' : 'opacity-0-init'
            }`}>
              {t('mission.title')}
            </h2>
            <p className={`text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto transition-all duration-1000 ${
              visibleSections.has('mission') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              {t('mission.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <Card className={`p-4 sm:p-6 md:p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('mission') ? 'animate-slide-in-left anim-delay-100' : 'opacity-0-left'
            }`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
                <Lightbulb className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-foreground" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground mb-2 sm:mb-3 md:mb-4">{t('mission.point1.title')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('mission.point1.desc')}
              </p>
            </Card>
            
            <Card className={`p-4 sm:p-6 md:p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('mission') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-foreground" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground mb-2 sm:mb-3 md:mb-4">{t('mission.point2.title')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('mission.point2.desc')}
              </p>
            </Card>
            
            <Card className={`p-4 sm:p-6 md:p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('mission') ? 'animate-slide-in-right anim-delay-500' : 'opacity-0-right'
            }`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
                <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-foreground" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground mb-2 sm:mb-3 md:mb-4">{t('mission.point3.title')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('mission.point3.desc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Angelic Report Highlights Section */}
      <section id="angelic-report" className="py-20 bg-cross-rays" data-section="angelic-report">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-6 transition-all duration-1000 ${
              visibleSections.has('angelic-report') ? 'animate-fade-in-up' : 'opacity-0-init'
            }`}>
              {t('angelic-report.title')}
            </h2>
            <p className={`text-lg text-muted-foreground max-w-3xl mx-auto transition-all duration-1000 ${
              visibleSections.has('angelic-report') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              {t('angelic-report.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className={`p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('angelic-report') ? 'animate-fade-in-up anim-delay-100' : 'opacity-0-init'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('angelic-report.feature1.title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('angelic-report.feature1.desc')}</p>
                </div>
              </div>
            </Card>

            <Card className={`p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('angelic-report') ? 'animate-fade-in-up anim-delay-200' : 'opacity-0-init'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('angelic-report.feature2.title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('angelic-report.feature2.desc')}</p>
                </div>
              </div>
            </Card>

            <Card className={`p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('angelic-report') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('angelic-report.feature3.title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('angelic-report.feature3.desc')}</p>
                </div>
              </div>
            </Card>

            <Card className={`p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('angelic-report') ? 'animate-fade-in-up anim-delay-400' : 'opacity-0-init'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('angelic-report.feature4.title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('angelic-report.feature4.desc')}</p>
                </div>
              </div>
            </Card>

            <Card className={`p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('angelic-report') ? 'animate-fade-in-up anim-delay-500' : 'opacity-0-init'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('angelic-report.feature5.title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('angelic-report.feature5.desc')}</p>
                </div>
              </div>
            </Card>

            <Card className={`p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('angelic-report') ? 'animate-fade-in-up anim-delay-600' : 'opacity-0-init'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('angelic-report.feature6.title')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('angelic-report.feature6.desc')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Section - Enhanced */}
      <section id="why-choose" className="py-20 bg-gradient-subtle" data-section="why-choose">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-6 transition-all duration-1000 ${
              visibleSections.has('why-choose') ? 'animate-fade-in-up' : 'opacity-0-init'
            }`}>
              {t('why-choose.title')}
            </h2>
            <p className={`text-lg text-muted-foreground max-w-3xl mx-auto transition-all duration-1000 ${
              visibleSections.has('why-choose') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              {t('why-choose.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className={`p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('why-choose') ? 'animate-slide-in-left anim-delay-100' : 'opacity-0-left'
            }`}>
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-3">{t('why-choose.point1.title')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t('why-choose.point1.desc')}</p>
                </div>
              </div>
            </Card>

            <Card className={`p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('why-choose') ? 'animate-slide-in-right anim-delay-200' : 'opacity-0-right'
            }`}>
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-3">{t('why-choose.point2.title')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t('why-choose.point2.desc')}</p>
                </div>
              </div>
            </Card>

            <Card className={`p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('why-choose') ? 'animate-slide-in-left anim-delay-300' : 'opacity-0-left'
            }`}>
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-3">{t('why-choose.point3.title')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t('why-choose.point3.desc')}</p>
                </div>
              </div>
            </Card>

            <Card className={`p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${
              visibleSections.has('why-choose') ? 'animate-slide-in-right anim-delay-400' : 'opacity-0-right'
            }`}>
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-3">{t('why-choose.point4.title')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t('why-choose.point4.desc')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-dynamic-grid" data-section="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-10 md:mb-12">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-3 sm:mb-4 md:mb-6 transition-all duration-1000 ${
              visibleSections.has('features') ? 'animate-fade-in-up' : 'opacity-0-init'
            }`}>
              {t('features.title')}
            </h2>
            <p className={`text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto transition-all duration-1000 ${
              visibleSections.has('features') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Card className={`p-3 sm:p-4 md:p-6 text-center transition-all duration-500 ${
              visibleSections.has('features') ? 'animate-fade-in-up anim-delay-100' : 'opacity-0-init'
            }`}>
              <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary mx-auto mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-xs sm:text-sm md:text-base font-medium text-foreground mb-1 sm:mb-2">{t('features.team.title')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('features.team.desc')}</p>
            </Card>
            
            <Card className={`p-3 sm:p-4 md:p-6 text-center transition-all duration-500 ${
              visibleSections.has('features') ? 'animate-fade-in-up anim-delay-200' : 'opacity-0-init'
            }`}>
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary mx-auto mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-xs sm:text-sm md:text-base font-medium text-foreground mb-1 sm:mb-2">{t('features.innovation.title')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('features.innovation.desc')}</p>
            </Card>
            
            <Card className={`p-3 sm:p-4 md:p-6 text-center transition-all duration-500 ${
              visibleSections.has('features') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary mx-auto mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-xs sm:text-sm md:text-base font-medium text-foreground mb-1 sm:mb-2">{t('features.risk.title')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('features.risk.desc')}</p>
            </Card>
            
            <Card className={`p-3 sm:p-4 md:p-6 text-center transition-all duration-500 ${
              visibleSections.has('features') ? 'animate-fade-in-up anim-delay-400' : 'opacity-0-init'
            }`}>
              <Search className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary mx-auto mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-xs sm:text-sm md:text-base font-medium text-foreground mb-1 sm:mb-2">{t('features.research.title')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('features.research.desc')}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-pattern bg-gradient-subtle" data-section="process">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-10 md:mb-12">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-3 sm:mb-4 md:mb-6 transition-all duration-1000 ${
              visibleSections.has('process') ? 'animate-fade-in-up' : 'opacity-0-init'
            }`}>
              {t('process.title')}
            </h2>
            <p className={`text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto transition-all duration-1000 ${
              visibleSections.has('process') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              {t('process.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            <div className={`text-center transition-all duration-500 ${
              visibleSections.has('process') ? 'animate-fade-in-up anim-delay-200' : 'opacity-0-init'
            }`}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 text-lg sm:text-xl md:text-2xl font-light transition-all duration-500 ${
                visibleSections.has('process') ? 'animate-scale-in anim-delay-400' : 'opacity-0-scale'
              }`}>
                01
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground mb-2 sm:mb-3 md:mb-4">{t('process.step1.title')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('process.step1.desc')}
              </p>
            </div>
            
            <div className={`text-center transition-all duration-500 ${
              visibleSections.has('process') ? 'animate-fade-in-up anim-delay-400' : 'opacity-0-init'
            }`}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 text-lg sm:text-xl md:text-2xl font-light transition-all duration-500 ${
                visibleSections.has('process') ? 'animate-scale-in anim-delay-600' : 'opacity-0-scale'
              }`}>
                02
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground mb-2 sm:mb-3 md:mb-4">{t('process.step2.title')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('process.step2.desc')}
              </p>
            </div>
            
            <div className={`text-center transition-all duration-500 ${
              visibleSections.has('process') ? 'animate-fade-in-up anim-delay-600' : 'opacity-0-init'
            }`}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 text-lg sm:text-xl md:text-2xl font-light transition-all duration-500 ${
                visibleSections.has('process') ? 'animate-scale-in anim-delay-800' : 'opacity-0-scale'
              }`}>
                03
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground mb-2 sm:mb-3 md:mb-4">{t('process.step3.title')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('process.step3.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 bg-future-purple bg-foreground text-background" data-section="cta">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 transition-all duration-1000 ${
            visibleSections.has('cta') ? 'animate-fade-in-up' : 'opacity-0-init'
          }`}>
            {t('cta.title')}
          </h2>
          <p className={`text-base sm:text-lg md:text-xl mb-8 sm:mb-12 opacity-90 transition-all duration-1000 ${
            visibleSections.has('cta') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
          }`}>
            {t('cta.subtitle')}
          </p>
          <Button 
            asChild 
            size="lg" 
            variant="secondary"
            className={`text-lg px-12 py-6 h-auto font-medium transition-all duration-1000 ${
              visibleSections.has('cta') ? 'animate-scale-in anim-delay-500' : 'opacity-0-scale'
            }`}
            data-testid="button-start-final"
          >
            <Link href="/chat">
              {t('cta.button')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
