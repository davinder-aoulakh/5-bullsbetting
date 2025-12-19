import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Timer, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '@/components/betting/EventCard';
import BetSlip from '@/components/betting/BetSlip';

const sportIcons = {
  soccer: '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  mma: '🥊',
  tennis: '🎾',
  esports: '🎮',
  american_football: '🏈'
};

// Mock live events
const mockLiveEvents = [
  {
    id: 'live1',
    sport: 'soccer',
    league: 'Brasileirão Série A',
    home_team: 'Corinthians',
    away_team: 'São Paulo',
    status: 'live',
    current_score: { home: 2, away: 1 },
    current_minute: 67,
    markets: [
      { name: 'Resultado Final', selections: [
        { name: 'Corinthians', odds: 1.35, status: 'active' },
        { name: 'Empate', odds: 5.00, status: 'active' },
        { name: 'São Paulo', odds: 8.50, status: 'active' }
      ]},
      { name: 'Próximo Gol', selections: [
        { name: 'Corinthians', odds: 1.90, status: 'active' },
        { name: 'Sem Gol', odds: 3.20, status: 'active' },
        { name: 'São Paulo', odds: 2.40, status: 'active' }
      ]}
    ]
  },
  {
    id: 'live2',
    sport: 'soccer',
    league: 'Premier League',
    home_team: 'Manchester City',
    away_team: 'Liverpool',
    status: 'live',
    current_score: { home: 1, away: 1 },
    current_minute: 45,
    markets: [
      { name: 'Resultado Final', selections: [
        { name: 'Man City', odds: 2.10, status: 'active' },
        { name: 'Empate', odds: 3.40, status: 'active' },
        { name: 'Liverpool', odds: 3.20, status: 'active' }
      ]}
    ]
  },
  {
    id: 'live3',
    sport: 'basketball',
    league: 'NBA',
    home_team: 'Lakers',
    away_team: 'Celtics',
    status: 'live',
    current_score: { home: 89, away: 92 },
    current_minute: 38,
    markets: [
      { name: 'Vencedor', selections: [
        { name: 'Lakers', odds: 2.20, status: 'active' },
        { name: 'Celtics', odds: 1.70, status: 'active' }
      ]},
      { name: 'Total de Pontos', selections: [
        { name: 'Mais de 210.5', odds: 1.85, status: 'active' },
        { name: 'Menos de 210.5', odds: 1.95, status: 'active' }
      ]}
    ]
  },
  {
    id: 'live4',
    sport: 'mma',
    league: 'UFC Fight Night',
    home_team: 'Charles Oliveira',
    away_team: 'Dustin Poirier',
    status: 'live',
    current_minute: 3,
    markets: [
      { name: 'Vencedor', selections: [
        { name: 'Charles Oliveira', odds: 1.65, status: 'active' },
        { name: 'Dustin Poirier', odds: 2.25, status: 'active' }
      ]}
    ]
  },
  {
    id: 'live5',
    sport: 'tennis',
    league: 'ATP Finals',
    home_team: 'Djokovic',
    away_team: 'Alcaraz',
    status: 'live',
    current_score: { home: 1, away: 1 },
    current_minute: null,
    markets: [
      { name: 'Vencedor', selections: [
        { name: 'Djokovic', odds: 1.85, status: 'active' },
        { name: 'Alcaraz', odds: 1.95, status: 'active' }
      ]}
    ]
  }
];

export default function LiveBetting() {
  const [selectedSport, setSelectedSport] = useState('all');
  const [betSelections, setBetSelections] = useState([]);
  const [betSlipMinimized, setBetSlipMinimized] = useState(false);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

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
  };

  const { data: liveEvents } = useQuery({
    queryKey: ['live-events'],
    queryFn: () => base44.entities.SportsEvent.filter({ status: 'live' }, '-start_time', 50),
    refetchInterval: 10000, // Refresh every 10 seconds
    initialData: []
  });

  const displayEvents = liveEvents.length > 0 ? liveEvents : mockLiveEvents;

  const filteredEvents = displayEvents.filter(event => 
    selectedSport === 'all' || event.sport === selectedSport
  );

  // Get unique sports from live events
  const availableSports = ['all', ...new Set(displayEvents.map(e => e.sport))];

  const handleSelectOdd = (selection) => {
    const existingIndex = betSelections.findIndex(
      s => s.eventId === selection.eventId && s.market === selection.market
    );

    if (existingIndex >= 0) {
      if (betSelections[existingIndex].selection === selection.selection) {
        setBetSelections(prev => prev.filter((_, i) => i !== existingIndex));
      } else {
        setBetSelections(prev => prev.map((s, i) => 
          i === existingIndex ? selection : s
        ));
      }
    } else {
      setBetSelections(prev => [...prev, selection]);
    }
  };

  const handleRemoveSelection = (index) => {
    setBetSelections(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setBetSelections([]);
  };

  const placeBetMutation = useMutation({
    mutationFn: async (betData) => {
      return base44.entities.Bet.create({
        user_id: user?.id,
        bet_type: betData.betType,
        selections: betData.selections.map(s => ({
          event_id: s.eventId,
          event_name: s.eventName,
          market: s.market,
          selection: s.selection,
          odds: s.odds,
          sport: s.sport,
          league: s.league,
          event_date: s.eventDate,
          status: 'pending'
        })),
        stake: betData.stake,
        total_odds: betData.totalOdds,
        potential_return: betData.potentialReturn,
        status: 'pending',
        device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
    },
    onSuccess: async (_, betData) => {
      if (user) {
        await base44.auth.updateMe({
          wallet_balance: (user.wallet_balance || 0) - betData.stake
        });
        loadUser();
      }
      queryClient.invalidateQueries(['my-bets']);
      setBetSelections([]);
    }
  });

  const handlePlaceBet = async (betData) => {
    await placeBetMutation.mutateAsync(betData);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-b border-red-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Ao Vivo</h1>
              <p className="text-white/60">Apostas em tempo real</p>
            </div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-auto">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse mr-2" />
              {displayEvents.length} jogos ao vivo
            </Badge>
          </div>

          {/* Sports Filter */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {availableSports.map((sport) => {
                const sportData = sport === 'all' 
                  ? { icon: '🔴', name: 'Todos' }
                  : { icon: sportIcons[sport], name: sport };
                const count = sport === 'all' 
                  ? displayEvents.length 
                  : displayEvents.filter(e => e.sport === sport).length;
                
                return (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
                      ${selectedSport === sport 
                        ? 'bg-red-500 text-white font-medium' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }
                    `}
                  >
                    <span>{sportData.icon}</span>
                    <span className="capitalize">{sportData.name}</span>
                    <Badge className="bg-white/20 text-white border-0 text-xs">
                      {count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Live Events */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {filteredEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <EventCard
                  event={event}
                  onSelectOdd={handleSelectOdd}
                  selectedOdds={betSelections}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Nenhum jogo ao vivo
            </h3>
            <p className="text-white/50">
              Não há jogos ao vivo neste momento. Confira os próximos eventos.
            </p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <p className="text-white/80 text-sm">
              As odds são atualizadas em tempo real. Fique atento às mudanças durante o jogo!
            </p>
          </div>
        </Card>
      </div>

      {/* Bet Slip */}
      <AnimatePresence>
        {betSelections.length > 0 && (
          <BetSlip
            selections={betSelections}
            onRemoveSelection={handleRemoveSelection}
            onClearAll={handleClearAll}
            onPlaceBet={handlePlaceBet}
            isPlacing={placeBetMutation.isPending}
            userBalance={user?.wallet_balance || 0}
            isMinimized={betSlipMinimized}
            onToggleMinimize={() => setBetSlipMinimized(!betSlipMinimized)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}