import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Filter,
  ChevronRight,
  Calendar,
  Star,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '@/components/betting/EventCard';
import BetSlip from '@/components/betting/BetSlip';
import KycGate from '@/components/KycGate';

const sports = [
  { id: 'all', name: 'Todos', icon: '🏆' },
  { id: 'soccer', name: 'Futebol', icon: '⚽' },
  { id: 'basketball', name: 'Basquete', icon: '🏀' },
  { id: 'volleyball', name: 'Vôlei', icon: '🏐' },
  { id: 'mma', name: 'MMA', icon: '🥊' },
  { id: 'tennis', name: 'Tênis', icon: '🎾' },
  { id: 'esports', name: 'E-Sports', icon: '🎮' },
];

// Mock data for events
const mockEvents = [
  {
    id: '1',
    sport: 'soccer',
    league: 'Brasileirão Série A',
    home_team: 'Flamengo',
    away_team: 'Palmeiras',
    start_time: new Date(Date.now() + 3600000).toISOString(),
    status: 'upcoming',
    markets: [
      { name: 'Resultado Final', selections: [
        { name: 'Flamengo', odds: 2.10, status: 'active' },
        { name: 'Empate', odds: 3.25, status: 'active' },
        { name: 'Palmeiras', odds: 3.40, status: 'active' }
      ]},
      { name: 'Ambas Marcam', selections: [
        { name: 'Sim', odds: 1.85, status: 'active' },
        { name: 'Não', odds: 1.95, status: 'active' }
      ]}
    ]
  },
  {
    id: '2',
    sport: 'soccer',
    league: 'Copa Libertadores',
    home_team: 'Boca Juniors',
    away_team: 'River Plate',
    start_time: new Date(Date.now() + 7200000).toISOString(),
    status: 'upcoming',
    markets: [
      { name: 'Resultado Final', selections: [
        { name: 'Boca Juniors', odds: 2.50, status: 'active' },
        { name: 'Empate', odds: 3.10, status: 'active' },
        { name: 'River Plate', odds: 2.80, status: 'active' }
      ]}
    ]
  },
  {
    id: '3',
    sport: 'basketball',
    league: 'NBB',
    home_team: 'Flamengo',
    away_team: 'Franca',
    start_time: new Date(Date.now() + 10800000).toISOString(),
    status: 'upcoming',
    markets: [
      { name: 'Vencedor', selections: [
        { name: 'Flamengo', odds: 1.65, status: 'active' },
        { name: 'Franca', odds: 2.25, status: 'active' }
      ]},
      { name: 'Total de Pontos', selections: [
        { name: 'Mais de 180.5', odds: 1.90, status: 'active' },
        { name: 'Menos de 180.5', odds: 1.90, status: 'active' }
      ]}
    ]
  },
  {
    id: '4',
    sport: 'mma',
    league: 'UFC 300',
    home_team: 'Alex Pereira',
    away_team: 'Jamahal Hill',
    start_time: new Date(Date.now() + 86400000).toISOString(),
    status: 'upcoming',
    markets: [
      { name: 'Vencedor', selections: [
        { name: 'Alex Pereira', odds: 1.45, status: 'active' },
        { name: 'Jamahal Hill', odds: 2.80, status: 'active' }
      ]},
      { name: 'Método de Vitória', selections: [
        { name: 'Nocaute', odds: 1.75, status: 'active' },
        { name: 'Decisão', odds: 2.20, status: 'active' }
      ]}
    ]
  },
  {
    id: '5',
    sport: 'volleyball',
    league: 'Superliga',
    home_team: 'Cruzeiro',
    away_team: 'Minas',
    start_time: new Date(Date.now() + 14400000).toISOString(),
    status: 'upcoming',
    markets: [
      { name: 'Vencedor', selections: [
        { name: 'Cruzeiro', odds: 1.55, status: 'active' },
        { name: 'Minas', odds: 2.40, status: 'active' }
      ]}
    ]
  },
  {
    id: '6',
    sport: 'soccer',
    league: 'Premier League',
    home_team: 'Manchester City',
    away_team: 'Liverpool',
    start_time: new Date(Date.now() + 172800000).toISOString(),
    status: 'upcoming',
    markets: [
      { name: 'Resultado Final', selections: [
        { name: 'Man City', odds: 1.75, status: 'active' },
        { name: 'Empate', odds: 3.80, status: 'active' },
        { name: 'Liverpool', odds: 4.50, status: 'active' }
      ]}
    ]
  }
];

export default function Sports() {
  const [selectedSport, setSelectedSport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const { data: events } = useQuery({
    queryKey: ['sports-events', selectedSport],
    queryFn: async () => {
      if (selectedSport === 'all') {
        return base44.entities.SportsEvent.filter({ status: 'upcoming' }, 'start_time', 50);
      }
      return base44.entities.SportsEvent.filter({ sport: selectedSport, status: 'upcoming' }, 'start_time', 50);
    },
    initialData: []
  });

  const displayEvents = events.length > 0 ? events : mockEvents.filter(e => 
    selectedSport === 'all' || e.sport === selectedSport
  );

  const filteredEvents = displayEvents.filter(event => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.home_team.toLowerCase().includes(query) ||
      event.away_team.toLowerCase().includes(query) ||
      event.league.toLowerCase().includes(query)
    );
  });

  const handleSelectOdd = (selection) => {
    const existingIndex = betSelections.findIndex(
      s => s.eventId === selection.eventId && s.market === selection.market
    );

    if (existingIndex >= 0) {
      // If same selection, remove it
      if (betSelections[existingIndex].selection === selection.selection) {
        setBetSelections(prev => prev.filter((_, i) => i !== existingIndex));
      } else {
        // If different selection on same market, replace it
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
      // Update user balance
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

  // Group events by league
  const eventsByLeague = filteredEvents.reduce((acc, event) => {
    if (!acc[event.league]) {
      acc[event.league] = [];
    }
    acc[event.league].push(event);
    return acc;
  }, {});

  if (user && user.kyc_status !== 'approved') return <KycGate kycStatus={user.kyc_status} />;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-white/5 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="text"
              placeholder="Buscar times, ligas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Sports Filter */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
                    ${selectedSport === sport.id 
                      ? 'bg-amber-500 text-black font-medium' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }
                  `}
                >
                  <span>{sport.icon}</span>
                  <span>{sport.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Events */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {Object.keys(eventsByLeague).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(eventsByLeague).map(([league, leagueEvents]) => (
              <div key={league}>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">{league}</h2>
                  <Badge className="bg-white/10 text-white/60 border-0">
                    {leagueEvents.length}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {leagueEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <EventCard
                        event={event}
                        onSelectOdd={handleSelectOdd}
                        selectedOdds={betSelections}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-white/50">
              Não há jogos disponíveis para este esporte no momento.
            </p>
          </div>
        )}
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