import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BetSlip({ 
  selections, 
  onRemoveSelection, 
  onClearAll, 
  onPlaceBet,
  isPlacing,
  userBalance = 0,
  isMinimized,
  onToggleMinimize
}) {
  const [stake, setStake] = useState('');
  const [betType, setBetType] = useState('single'); // single or parlay
  const [showSuccess, setShowSuccess] = useState(false);

  const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
  const potentialReturn = parseFloat(stake || 0) * (betType === 'parlay' ? totalOdds : selections[0]?.odds || 0);

  const quickStakes = [10, 25, 50, 100, 250];

  const handlePlaceBet = async () => {
    if (!stake || parseFloat(stake) <= 0) return;
    if (parseFloat(stake) > userBalance) return;
    
    await onPlaceBet({
      selections,
      stake: parseFloat(stake),
      betType,
      totalOdds: betType === 'parlay' ? totalOdds : selections[0]?.odds,
      potentialReturn
    });
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setStake('');
    }, 3000);
  };

  if (selections.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto md:w-96 z-40"
    >
      <Card className="bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={onToggleMinimize}
          className="w-full flex items-center justify-between p-4 border-b border-white/10 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Calculator className="w-4 h-4 text-black" />
            </div>
            <span className="text-white font-bold">Bilhete</span>
            <Badge className="bg-amber-500/20 text-amber-400 border-0">
              {selections.length}
            </Badge>
          </div>
          {isMinimized ? (
            <ChevronUp className="w-5 h-5 text-white/50" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/50" />
          )}
        </button>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {showSuccess ? (
                <div className="p-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Aposta Realizada!</h3>
                  <p className="text-white/60">Boa sorte!</p>
                </div>
              ) : (
                <>
                  {/* Bet Type Selector */}
                  {selections.length > 1 && (
                    <div className="p-3 border-b border-white/10">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBetType('single')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            betType === 'single'
                              ? 'bg-amber-500 text-black'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          Simples
                        </button>
                        <button
                          onClick={() => setBetType('parlay')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            betType === 'parlay'
                              ? 'bg-amber-500 text-black'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          Múltipla ({totalOdds.toFixed(2)})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selections */}
                  <div className="max-h-60 overflow-y-auto">
                    {selections.map((selection, index) => (
                      <div 
                        key={index}
                        className="p-3 border-b border-white/5 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {selection.selection}
                          </p>
                          <p className="text-white/50 text-xs truncate">
                            {selection.eventName}
                          </p>
                          <p className="text-white/40 text-xs">
                            {selection.market}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold">
                            {selection.odds.toFixed(2)}
                          </span>
                          <button
                            onClick={() => onRemoveSelection(index)}
                            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stake Input */}
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {quickStakes.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setStake(amount.toString())}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-colors"
                        >
                          R${amount}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                        R$
                      </span>
                      <Input
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        placeholder="0,00"
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white text-lg font-bold"
                      />
                    </div>

                    {parseFloat(stake) > userBalance && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Saldo insuficiente</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2">
                      <span className="text-white/60">Retorno Potencial</span>
                      <span className="text-xl font-bold text-emerald-400">
                        R$ {potentialReturn.toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={handlePlaceBet}
                      disabled={!stake || parseFloat(stake) <= 0 || parseFloat(stake) > userBalance || isPlacing}
                      className="w-full h-12 gold-gradient text-black font-bold text-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {isPlacing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Fazer Aposta'
                      )}
                    </Button>

                    <button
                      onClick={onClearAll}
                      className="w-full flex items-center justify-center gap-2 py-2 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Limpar Bilhete</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}