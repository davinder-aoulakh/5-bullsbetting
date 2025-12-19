import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sportIcons = {
  soccer: '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  mma: '🥊',
  tennis: '🎾',
  esports: '🎮',
  american_football: '🏈'
};

export default function MyBets() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedBet, setExpandedBet] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      navigate(createPageUrl('Onboarding'));
    }
    setLoading(false);
  };

  const { data: bets } = useQuery({
    queryKey: ['my-bets', user?.id],
    queryFn: () => base44.entities.Bet.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id,
    initialData: []
  });

  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    if (filter === 'pending') return bet.status === 'pending';
    if (filter === 'won') return bet.status === 'won' || bet.status === 'partially_won';
    if (filter === 'lost') return bet.status === 'lost';
    return true;
  });

  const stats = {
    total: bets.length,
    pending: bets.filter(b => b.status === 'pending').length,
    won: bets.filter(b => b.status === 'won').length,
    lost: bets.filter(b => b.status === 'lost').length,
    totalStake: bets.reduce((acc, b) => acc + b.stake, 0),
    totalWon: bets.filter(b => b.status === 'won').reduce((acc, b) => acc + (b.actual_return || b.potential_return), 0)
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-0">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'won':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ganhou
          </Badge>
        );
      case 'lost':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Perdeu
          </Badge>
        );
      case 'partially_won':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Parcial
          </Badge>
        );
      default:
        return <Badge className="bg-white/10 text-white/60 border-0">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Minhas Apostas</h1>
              <p className="text-white/60">Acompanhe seus bilhetes</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm">Total de Apostas</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm">Apostas Pendentes</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm">Taxa de Acerto</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {stats.total > 0 ? ((stats.won / (stats.won + stats.lost)) * 100 || 0).toFixed(0) : 0}%
              </p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm">Lucro Total</p>
              <p className={`text-2xl font-bold mt-1 ${
                stats.totalWon - stats.totalStake >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                R$ {(stats.totalWon - stats.totalStake).toFixed(2)}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              Todas ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              Pendentes ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="won" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              Ganhas ({stats.won})
            </TabsTrigger>
            <TabsTrigger value="lost" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              Perdidas ({stats.lost})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bets List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {filteredBets.length > 0 ? (
          <div className="space-y-4">
            {filteredBets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        bet.status === 'won' ? 'bg-emerald-500/20' :
                        bet.status === 'lost' ? 'bg-red-500/20' :
                        'bg-amber-500/20'
                      }`}>
                        {bet.bet_type === 'parlay' ? (
                          <TrendingUp className={`w-5 h-5 ${
                            bet.status === 'won' ? 'text-emerald-400' :
                            bet.status === 'lost' ? 'text-red-400' :
                            'text-amber-400'
                          }`} />
                        ) : (
                          <span className="text-xl">
                            {sportIcons[bet.selections?.[0]?.sport] || '🏆'}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">
                            {bet.bet_type === 'parlay' 
                              ? `Múltipla (${bet.selections?.length || 0})` 
                              : bet.selections?.[0]?.event_name || 'Aposta'}
                          </p>
                          {getStatusBadge(bet.status)}
                        </div>
                        <p className="text-white/50 text-sm">
                          {format(new Date(bet.created_date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white/50 text-sm">Aposta</p>
                        <p className="text-white font-bold">R$ {bet.stake.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-sm">
                          {bet.status === 'won' ? 'Ganho' : 'Retorno Potencial'}
                        </p>
                        <p className={`font-bold ${
                          bet.status === 'won' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          R$ {(bet.actual_return || bet.potential_return).toFixed(2)}
                        </p>
                      </div>
                      {expandedBet === bet.id ? (
                        <ChevronUp className="w-5 h-5 text-white/50" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/50" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedBet === bet.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/10 p-4 space-y-3">
                          {bet.selections?.map((selection, index) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">
                                  {sportIcons[selection.sport] || '🏆'}
                                </span>
                                <div>
                                  <p className="text-white font-medium">{selection.selection}</p>
                                  <p className="text-white/50 text-sm">{selection.event_name}</p>
                                  <p className="text-white/40 text-xs">{selection.market}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-amber-400 font-bold">{selection.odds.toFixed(2)}</p>
                                {selection.status && (
                                  <Badge className={`text-xs ${
                                    selection.status === 'won' ? 'bg-emerald-500/20 text-emerald-400' :
                                    selection.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                                    'bg-white/10 text-white/60'
                                  }`}>
                                    {selection.status === 'won' ? 'Acertou' :
                                     selection.status === 'lost' ? 'Errou' : 'Pendente'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                            <div>
                              <p className="text-white/50 text-sm">Odds Total</p>
                              <p className="text-white font-bold">{bet.total_odds.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white/50 text-sm">ID do Bilhete</p>
                              <p className="text-white/70 text-sm font-mono">{bet.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10 p-8 text-center">
            <CalendarDays className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              {filter === 'all' ? 'Nenhuma aposta ainda' : 'Nenhuma aposta encontrada'}
            </h3>
            <p className="text-white/50">
              {filter === 'all' 
                ? 'Faça sua primeira aposta e acompanhe aqui!' 
                : 'Não há apostas com este filtro.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}