import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, Zap } from 'lucide-react';

const sportIcons = {
  soccer: '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  mma: '🥊',
  tennis: '🎾',
  esports: '🎮',
  american_football: '🏈'
};

export default function EventCard({ event, onSelectOdd, selectedOdds }) {
  const isLive = event.status === 'live';

  const isOddSelected = (marketName, selectionName) => {
    return selectedOdds.some(
      s => s.eventId === event.id && s.market === marketName && s.selection === selectionName
    );
  };

  const handleOddClick = (market, selection) => {
    onSelectOdd({
      eventId: event.id,
      eventName: `${event.home_team} vs ${event.away_team}`,
      sport: event.sport,
      league: event.league,
      market: market.name,
      selection: selection.name,
      odds: selection.odds,
      eventDate: event.start_time
    });
  };

  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden hover:bg-white/[0.07] transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{sportIcons[event.sport]}</span>
            <span className="text-white/50 text-sm">{event.league}</span>
          </div>
          
          {isLive ? (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse mr-2" />
              {event.current_minute ? `${event.current_minute}'` : 'AO VIVO'}
            </Badge>
          ) : (
            <div className="flex items-center gap-1 text-white/50 text-sm">
              <Timer className="w-4 h-4" />
              {new Date(event.start_time).toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: '2-digit', 
                month: '2-digit' 
              })} - {new Date(event.start_time).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white font-medium flex items-center gap-2">
              {event.home_team}
              {isLive && event.current_score && (
                <span className="text-amber-400 font-bold">{event.current_score.home}</span>
              )}
            </p>
            <p className="text-white/60 flex items-center gap-2">
              {event.away_team}
              {isLive && event.current_score && (
                <span className="text-amber-400 font-bold">{event.current_score.away}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Markets */}
      <div className="p-4 space-y-4">
        {event.markets?.map((market, marketIndex) => (
          <div key={marketIndex}>
            <p className="text-white/40 text-xs mb-2 uppercase tracking-wide">
              {market.name}
            </p>
            <div className={`grid gap-2 ${
              market.selections.length === 2 ? 'grid-cols-2' : 
              market.selections.length === 3 ? 'grid-cols-3' : 
              'grid-cols-2'
            }`}>
              {market.selections.map((selection, selIndex) => {
                const selected = isOddSelected(market.name, selection.name);
                return (
                  <button
                    key={selIndex}
                    onClick={() => handleOddClick(market, selection)}
                    disabled={selection.status === 'suspended'}
                    className={`
                      p-3 rounded-lg transition-all duration-200
                      ${selected 
                        ? 'bg-amber-500 border-amber-400' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                      }
                      ${selection.status === 'suspended' ? 'opacity-50 cursor-not-allowed' : ''}
                      border
                    `}
                  >
                    <p className={`text-xs truncate mb-1 ${
                      selected ? 'text-black/70' : 'text-white/50'
                    }`}>
                      {selection.name}
                    </p>
                    <p className={`font-bold ${
                      selected ? 'text-black' : 'text-amber-400'
                    }`}>
                      {selection.odds.toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}