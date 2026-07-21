import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Trophy, 
  ChevronRight,
  Star,
  TrendingUp,
  Timer,
  Shield,
  Smartphone,
  Headphones
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (userData && userData.kyc_status !== 'approved') {
        // Attempt to finalize verification (reconcile the pre-login Didit session)
        const res = await base44.functions.invoke('finalizeUserVerification', {});
        if (!res.data?.verified) {
          window.location.href = '/Onboarding';
          return;
        }
      }
    } catch (e) {
      setUser(null);
    }
  };

  const { data: featuredEvents } = useQuery({
    queryKey: ['featured-events'],
    queryFn: () => base44.entities.SportsEvent.filter({ is_featured: true }, '-start_time', 6),
    initialData: []
  });

  const { data: liveEvents } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => base44.entities.SportsEvent.filter({ status: 'live' }, '-start_time', 4),
    initialData: []
  });

  const sportIcons = {
    soccer: '⚽',
    basketball: '🏀',
    volleyball: '🏐',
    mma: '🥊',
    tennis: '🎾',
    esports: '🎮',
    american_football: '🏈'
  };

  // Mock featured events for display
  const mockFeaturedEvents = [
    {
      id: 1,
      sport: 'soccer',
      league: 'Brasileirão Série A',
      home_team: 'Flamengo',
      away_team: 'Palmeiras',
      start_time: new Date(Date.now() + 3600000).toISOString(),
      status: 'upcoming',
      markets: [
        { name: 'Resultado', selections: [
          { name: 'Flamengo', odds: 2.10 },
          { name: 'Empate', odds: 3.25 },
          { name: 'Palmeiras', odds: 3.40 }
        ]}
      ]
    },
    {
      id: 2,
      sport: 'soccer',
      league: 'Copa Libertadores',
      home_team: 'Boca Juniors',
      away_team: 'River Plate',
      start_time: new Date(Date.now() + 7200000).toISOString(),
      status: 'upcoming',
      markets: [
        { name: 'Resultado', selections: [
          { name: 'Boca Juniors', odds: 2.50 },
          { name: 'Empate', odds: 3.10 },
          { name: 'River Plate', odds: 2.80 }
        ]}
      ]
    },
    {
      id: 3,
      sport: 'basketball',
      league: 'NBB',
      home_team: 'Flamengo',
      away_team: 'Franca',
      start_time: new Date(Date.now() + 10800000).toISOString(),
      status: 'upcoming',
      markets: [
        { name: 'Vencedor', selections: [
          { name: 'Flamengo', odds: 1.65 },
          { name: 'Franca', odds: 2.25 }
        ]}
      ]
    }
  ];

  const mockLiveEvents = [
    {
      id: 4,
      sport: 'soccer',
      league: 'Premier League',
      home_team: 'Manchester City',
      away_team: 'Liverpool',
      status: 'live',
      current_score: { home: 1, away: 1 },
      current_minute: 67,
      markets: [
        { name: 'Próximo Gol', selections: [
          { name: 'Man City', odds: 1.90 },
          { name: 'Sem Gol', odds: 3.50 },
          { name: 'Liverpool', odds: 2.10 }
        ]}
      ]
    },
    {
      id: 5,
      sport: 'mma',
      league: 'UFC 300',
      home_team: 'Alex Pereira',
      away_team: 'Jamahal Hill',
      status: 'live',
      current_minute: 2,
      markets: [
        { name: 'Vencedor', selections: [
          { name: 'Alex Pereira', odds: 1.45 },
          { name: 'Jamahal Hill', odds: 2.80 }
        ]}
      ]
    }
  ];

  const displayFeatured = featuredEvents.length > 0 ? featuredEvents : mockFeaturedEvents;
  const displayLive = liveEvents.length > 0 ? liveEvents : mockLiveEvents;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-4 py-1.5">
                <Shield className="w-4 h-4 mr-1" />
                {t('home_licensed')}
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black">
                <span className="text-white">{t('home_hero_title')}</span>
                <br />
                <span className="gold-text">{t('home_hero_title_highlight')}</span>
              </h1>
              
              <p className="text-white/60 text-lg max-w-md">
                {t('home_hero_description')}
              </p>

              <div className="flex flex-wrap gap-4">
                {!user ? (
                  <>
                    <Link to={createPageUrl('Onboarding')}>
                      <Button size="lg" className="gold-gradient text-black font-bold text-lg px-8 h-14 hover:opacity-90">
                        {t('home_signup_now')}
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl('Sports')}>
                      <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8">
                        {t('home_view_sports')}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to={createPageUrl('Sports')}>
                      <Button size="lg" className="gold-gradient text-black font-bold text-lg px-8 h-14 hover:opacity-90">
                        {t('home_bet_now')}
                        <Trophy className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl('LiveBetting')}>
                      <Button size="lg" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 h-14 px-8">
                        <Zap className="w-5 h-5 mr-2" />
                        {t('home_live')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-white/80">4.9/5 {t('home_rating')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-white/80">+100k {t('home_users')}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
                <Card className="relative bg-white/5 border-white/10 backdrop-blur-xl p-6 rounded-3xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse mr-2" />
                        {t('home_live').toUpperCase()}
                      </Badge>
                      <span className="text-white/50 text-sm">Brasileirão</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-4">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-2">
                          <span className="text-3xl">🔴</span>
                        </div>
                        <p className="text-white font-bold">Flamengo</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-black text-white">2 - 1</div>
                        <div className="text-amber-400 text-sm mt-1">72'</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mb-2">
                          <span className="text-3xl">🟢</span>
                        </div>
                        <p className="text-white font-bold">Palmeiras</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <p className="text-white/50 text-xs mb-1">Flamengo</p>
                        <p className="text-white font-bold">1.25</p>
                      </button>
                      <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <p className="text-white/50 text-xs mb-1">Empate</p>
                        <p className="text-white font-bold">6.50</p>
                      </button>
                      <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <p className="text-white/50 text-xs mb-1">Palmeiras</p>
                        <p className="text-white font-bold">8.00</p>
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Events */}
      {displayLive.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t('home_live')}</h2>
                  <p className="text-white/50 text-sm">{t('home_live_betting')}</p>
                </div>
              </div>
              <Link to={createPageUrl('LiveBetting')}>
                <Button variant="ghost" className="text-amber-400 hover:text-amber-300">
                  {t('home_view_all')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {displayLive.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/[0.07] transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{sportIcons[event.sport]}</span>
                        <span className="text-white/50 text-sm">{event.league}</span>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse mr-2" />
                        {event.current_minute ? `${event.current_minute}'` : 'LIVE'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-white font-medium">{event.home_team}</p>
                        <p className="text-white/50">{event.away_team}</p>
                      </div>
                      {event.current_score && (
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">{event.current_score.home}</p>
                          <p className="text-white/50 font-bold text-lg">{event.current_score.away}</p>
                        </div>
                      )}
                    </div>

                    {event.markets?.[0] && (
                      <div className="grid grid-cols-3 gap-2">
                        {event.markets[0].selections.slice(0, 3).map((selection, i) => (
                          <button 
                            key={i}
                            className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/50 border border-transparent transition-all"
                          >
                            <p className="text-white/50 text-xs truncate">{selection.name}</p>
                            <p className="text-amber-400 font-bold">{selection.odds.toFixed(2)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Events */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('home_featured')}</h2>
                <p className="text-white/50 text-sm">{t('home_most_bet')}</p>
              </div>
            </div>
            <Link to={createPageUrl('Sports')}>
              <Button variant="ghost" className="text-amber-400 hover:text-amber-300">
                {t('home_view_all')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayFeatured.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/[0.07] transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{sportIcons[event.sport]}</span>
                      <span className="text-white/50 text-sm">{event.league}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/50 text-sm">
                      <Timer className="w-4 h-4" />
                      {new Date(event.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-white font-medium">{event.home_team}</p>
                    <p className="text-white/50">vs {event.away_team}</p>
                  </div>

                  {event.markets?.[0] && (
                    <div className="grid grid-cols-3 gap-2">
                      {event.markets[0].selections.slice(0, 3).map((selection, i) => (
                        <button 
                          key={i}
                          className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/50 border border-transparent transition-all"
                        >
                          <p className="text-white/50 text-xs truncate">{selection.name}</p>
                          <p className="text-amber-400 font-bold">{selection.odds.toFixed(2)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-white mb-6">{t('home_sports_title')}</h2>
          
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
            {[
              { name: t('sports_soccer'), icon: '⚽', count: 234 },
              { name: t('sports_basketball'), icon: '🏀', count: 89 },
              { name: t('sports_volleyball'), icon: '🏐', count: 45 },
              { name: t('sports_mma'), icon: '🥊', count: 12 },
              { name: t('sports_tennis'), icon: '🎾', count: 67 },
              { name: t('sports_esports'), icon: '🎮', count: 156 },
              { name: t('home_more'), icon: '➕', count: null }
            ].map((sport, i) => (
              <Link 
                key={i} 
                to={createPageUrl('Sports')}
                className="group"
              >
                <Card className="bg-white/5 border-white/10 p-4 text-center hover:bg-white/10 hover:border-amber-500/30 transition-all">
                  <span className="text-3xl block mb-2">{sport.icon}</span>
                  <p className="text-white font-medium text-sm">{sport.name}</p>
                  {sport.count && (
                    <p className="text-white/40 text-xs">{sport.count} {t('home_games')}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {t('home_why_title')} <span className="gold-text">5-BullsBetting</span>?
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              {t('home_why_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: t('feature_security'),
                description: t('feature_security_desc')
              },
              {
                icon: Zap,
                title: t('feature_pix'),
                description: t('feature_pix_desc')
              },
              {
                icon: Smartphone,
                title: t('feature_mobile'),
                description: t('feature_mobile_desc')
              },
              {
                icon: Headphones,
                title: t('feature_support'),
                description: t('feature_support_desc')
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 p-6 h-full hover:bg-white/[0.07] transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30 p-8 md:p-12 rounded-3xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t('home_ready_title')}
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                {t('home_ready_desc')}
              </p>
              <Link to={createPageUrl('Onboarding')}>
                <Button size="lg" className="gold-gradient text-black font-bold text-lg px-12 h-14 hover:opacity-90">
                  {t('home_create_free')}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}