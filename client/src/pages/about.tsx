import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, TrendingUp, Target, Users, Sparkles, Heart, Star } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useTheme } from "@/components/theme-provider";
import { useTranslations } from "@/hooks/use-translations";
import { useEffect, useState, useRef } from "react";
import angelicLogo from "@assets/angelic-logo.png";
import angelicLogoLight from "@assets/angelic-logo-light.png";
import angelicLogoDark from "@assets/angelic-logo-dark.png";

export default function About() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
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

    // Observe all sections
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => {
      observerRef.current?.observe(section);
    });

    // Initial hero animation
    setTimeout(() => {
      setVisibleSections(prev => {
        const newSet = new Set(prev);
        newSet.add('hero');
        return newSet;
      });
    }, 100);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    document.title = t("about.title");
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t("about.meta"));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = t("about.meta");
      document.head.appendChild(meta);
    }
  }, [t]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <img 
                  src={theme === 'light' ? angelicLogoLight : angelicLogoDark} 
                  alt="Angelic Logo" 
                  className="h-16 w-auto opacity-90 cursor-pointer"
                  data-testid="img-logo"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm" data-testid="button-back">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("nav.back-home")}
                </Link>
              </Button>
              <LanguageToggle />
              <ThemeToggle />
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90" size="sm" data-testid="button-start-experience">
                <Link href="/chat">{t("nav.experience")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-future-purple" data-section="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`mb-12 transition-all duration-1000 ${
            visibleSections.has('hero') ? 'animate-float-up' : 'opacity-0-scale'
          }`}>
            <img 
              src={theme === 'light' ? angelicLogoLight : angelicLogoDark} 
              alt="Angelic - Startup Intelligence" 
              className="h-40 w-auto mx-auto mb-12 opacity-95"
              data-testid="img-about-hero-logo"
            />
          </div>
          
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8 leading-tight transition-all duration-1000 ${
            visibleSections.has('hero') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
          }`}>
            {t("about.hero.title")}
          </h1>
          
          <p className={`text-xl text-muted-foreground mb-8 leading-relaxed max-w-4xl mx-auto transition-all duration-1000 ${
            visibleSections.has('hero') ? 'animate-fade-in-up anim-delay-500' : 'opacity-0-init'
          }`}>
            {t("about.hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20" data-section="story">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
            <h2 className={`text-4xl font-light text-foreground mb-8 text-center transition-all duration-1000 ${
              visibleSections.has('story') ? 'animate-fade-in-up' : 'opacity-0-init'
            }`}>
              {t("about.story.title")}
            </h2>
            
            <div className={`text-xl leading-relaxed text-muted-foreground space-y-6 max-w-4xl mx-auto transition-all duration-1000 ${
              visibleSections.has('story') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
            }`}>
              <p>
                {t("about.story.p1")}
              </p>
              
              <p>
                {t("about.story.p2")}
              </p>
              
              <p>
                <strong className="text-foreground">{t("about.story.p3")}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 bg-cross-rays" data-section="mission">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-4xl font-light text-foreground mb-8 text-center transition-all duration-1000 ${
            visibleSections.has('mission') ? 'animate-fade-in-up' : 'opacity-0-init'
          }`}>
{t("about.mission.title")}
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${
              visibleSections.has('mission') ? 'animate-slide-in-left anim-delay-200' : 'opacity-0-left'
            }`}>
              <h3 className="text-2xl font-medium text-foreground mb-6">
                {t("about.mission.subtitle")}
              </h3>
              
              <div className="text-lg leading-relaxed text-muted-foreground space-y-4">
                <p>
                  {t("about.mission.content.p1")}
                </p>
                
                <p>
                  {t("about.mission.content.p2")}
                </p>
                
                <p>
                  <strong className="text-foreground">
                  {t("about.mission.content.p3")}
                  </strong>
                </p>
              </div>
            </div>
            
            <Card className={`p-8 border-0 shadow-lg bg-background transition-all duration-1000 ${
              visibleSections.has('mission') ? 'animate-slide-in-right anim-delay-400' : 'opacity-0-right'
            }`}>
              <div className={`w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 transition-all duration-800 ${
                visibleSections.has('mission') ? 'animate-scale-in anim-delay-600' : 'opacity-0-scale'
              }`}>
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-medium text-foreground mb-4">{t("about.mission.card.title")}</h4>
              <ul className="text-muted-foreground space-y-3">
                <li>{t("about.mission.card.item1")}</li>
                <li>{t("about.mission.card.item2")}</li>
                <li>{t("about.mission.card.item3")}</li>
                <li>{t("about.mission.card.item4")}</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Why We Do This */}
      <section className="py-20" data-section="why">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-4xl font-light text-foreground mb-12 text-center transition-all duration-1000 ${
            visibleSections.has('why') ? 'animate-fade-in-up' : 'opacity-0-init'
          }`}>
{t("about.why.title")}
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`text-lg leading-relaxed text-muted-foreground space-y-6 transition-all duration-1000 ${
              visibleSections.has('why') ? 'animate-slide-in-left anim-delay-200' : 'opacity-0-left'
            }`}>
              <p>
                {t("about.why.p1")}
              </p>
              
              <p>
                {t("about.why.p2")}
              </p>
              
              <p>
                {t("about.why.p3")}
              </p>
            </div>
            
            <Card className={`p-8 border-0 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5 transition-all duration-1000 ${
              visibleSections.has('why') ? 'animate-slide-in-right anim-delay-400' : 'opacity-0-right'
            }`}>
              <h3 className="text-2xl font-medium text-foreground mb-6">
                {t("about.why.card.title")}
              </h3>
              <blockquote className="text-lg italic text-muted-foreground leading-relaxed">
                "{t("about.why.card.quote")}"
              </blockquote>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {t("about.why.card.bottom")}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-dynamic-grid bg-foreground text-background" data-section="cta">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-4xl font-light mb-6 transition-all duration-1000 ${
            visibleSections.has('cta') ? 'animate-fade-in-up' : 'opacity-0-init'
          }`}>
            {t("about.cta.title")}
          </h2>
          <p className={`text-xl mb-8 opacity-90 leading-relaxed transition-all duration-1000 ${
            visibleSections.has('cta') ? 'animate-fade-in-up anim-delay-300' : 'opacity-0-init'
          }`}>
            {t("about.cta.subtitle")}
          </p>
          <div className={`space-y-4 transition-all duration-1000 ${
            visibleSections.has('cta') ? 'animate-scale-in anim-delay-500' : 'opacity-0-scale'
          }`}>
            <Button asChild size="lg" variant="secondary" className="text-lg px-12 py-6 h-auto font-medium" data-testid="button-start-final">
              <Link href="/chat">
                {t("about.cta.button")}
              </Link>
            </Button>
            <p className="text-sm opacity-75 mt-4">
              {t("about.cta.note")}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <img 
                src={theme === 'light' ? angelicLogoLight : angelicLogoDark} 
                alt="Angelic" 
                className="h-8 w-auto opacity-70 mr-4"
                data-testid="img-footer-logo"
              />
              <span className="text-sm text-muted-foreground">
                {t("about.footer.copyright")}
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("about.footer.home")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}