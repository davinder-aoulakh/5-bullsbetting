import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { 
  Home, 
  Trophy, 
  Wallet, 
  User, 
  Menu, 
  X, 
  LogOut,
  Zap,
  ChevronDown,
  Shield,
  Globe
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const { language, toggleLanguage, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      setUser(null);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Pages that don't need the full layout (onboarding)
  const minimalLayoutPages = ['Onboarding', 'OnboardingVerification'];
  
  if (minimalLayoutPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <style>{`
          :root {
            --primary: 45 93% 47%;
            --primary-foreground: 0 0% 100%;
            --accent: 45 93% 47%;
            --brand-gold: #D4AF37;
            --brand-dark: #0A0A0A;
          }
        `}</style>
        {children}
      </div>
    );
  }

  const navItems = [
    { name: t('nav_home'), page: 'Home', icon: Home },
    { name: t('nav_sports'), page: 'Sports', icon: Trophy },
    { name: t('nav_live'), page: 'LiveBetting', icon: Zap },
  ];

  const userNavItems = [
    { name: t('nav_wallet'), page: 'Wallet', icon: Wallet },
    { name: t('nav_my_bets'), page: 'MyBets', icon: Trophy },
    { name: t('nav_profile'), page: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <style>{`
        :root {
          --primary: 45 93% 47%;
          --primary-foreground: 0 0% 100%;
          --accent: 45 93% 47%;
          --brand-gold: #D4AF37;
          --brand-dark: #0A0A0A;
        }
        
        .gold-gradient {
          background: linear-gradient(135deg, #D4AF37 0%, #F4E5B2 50%, #D4AF37 100%);
        }
        
        .gold-text {
          background: linear-gradient(135deg, #D4AF37 0%, #F4E5B2 50%, #D4AF37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
                <span className="text-black font-black text-lg">5B</span>
              </div>
              <span className="hidden sm:block font-bold text-xl">
                <span className="gold-text">5-Bulls</span>
                <span className="text-white/80">Betting</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPageName === item.page
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  {language === 'pt' ? 'EN' : 'PT'}
                </span>
              </button>

              {loading ? (
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              ) : user ? (
                <>
                  {/* Balance */}
                  <Link
                    to={createPageUrl('Wallet')}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">
                      R$ {(user.wallet_balance || 0).toFixed(2)}
                    </span>
                  </Link>

                  {/* Deposit Button */}
                  <Link to={createPageUrl('Wallet')}>
                    <Button className="gold-gradient text-black font-semibold hover:opacity-90 transition-opacity">
                      {t('nav_deposit')}
                    </Button>
                  </Link>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-white/50 hidden sm:block" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10">
                      <div className="px-3 py-2 border-b border-white/10">
                        <p className="text-sm font-medium text-white">{user.full_name || 'Usuário'}</p>
                        <p className="text-xs text-white/50">{user.email}</p>
                      </div>
                      {userNavItems.map((item) => (
                        <DropdownMenuItem key={item.page} asChild>
                          <Link
                            to={createPageUrl(item.page)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-400 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav_logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to={createPageUrl('Onboarding')}>
                    <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">
                      {t('nav_login')}
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Onboarding')}>
                    <Button className="gold-gradient text-black font-semibold hover:opacity-90">
                      {t('nav_signup')}
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-slate-900/95 backdrop-blur-lg">
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentPageName === item.page
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              {user && (
                <>
                  <div className="border-t border-white/10 my-2" />
                  {userNavItems.map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
                  <span className="text-black font-black text-lg">5B</span>
                </div>
                <span className="font-bold text-xl gold-text">5-BullsBetting</span>
              </div>
              <p className="text-white/50 text-sm">
                Plataforma de apostas esportivas regulamentada e segura.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">Licenciado no Brasil</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">{t('footer_sports')}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to={createPageUrl('Sports')} className="hover:text-white">{t('sports_soccer')}</Link></li>
                <li><Link to={createPageUrl('Sports')} className="hover:text-white">{t('sports_basketball')}</Link></li>
                <li><Link to={createPageUrl('Sports')} className="hover:text-white">{t('sports_volleyball')}</Link></li>
                <li><Link to={createPageUrl('Sports')} className="hover:text-white">{t('sports_mma')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">{t('footer_account')}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to={createPageUrl('Wallet')} className="hover:text-white">{t('footer_deposits')}</Link></li>
                <li><Link to={createPageUrl('Wallet')} className="hover:text-white">{t('footer_withdrawals')}</Link></li>
                <li><Link to={createPageUrl('MyBets')} className="hover:text-white">{t('nav_my_bets')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">{t('footer_support')}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to={createPageUrl('ResponsibleGambling')} className="hover:text-white">{t('footer_responsible_gambling')}</Link></li>
                <li><Link to={createPageUrl('Terms')} className="hover:text-white">{t('footer_terms')}</Link></li>
                <li><Link to={createPageUrl('Privacy')} className="hover:text-white">{t('footer_privacy')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2024 5-BullsBetting. {t('footer_rights')}.
            </p>
            <div className="flex items-center gap-4 text-white/40 text-xs">
              <span>🔞 {t('footer_age_restriction')}</span>
              <span>•</span>
              <span>{t('footer_play_responsibly')}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-card border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {[...navItems, { name: t('nav_wallet'), page: 'Wallet', icon: Wallet }].map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center gap-1 px-4 py-2 ${
                currentPageName === item.page ? 'text-amber-400' : 'text-white/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}