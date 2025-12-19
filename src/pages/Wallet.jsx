import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  QrCode,
  Loader2,
  TrendingUp,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Wallet() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPixCode, setShowPixCode] = useState(false);

  const queryClient = useQueryClient();

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

  const { data: transactions } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user?.id,
    initialData: []
  });

  const quickAmounts = [50, 100, 200, 500, 1000];

  const depositMutation = useMutation({
    mutationFn: async (depositAmount) => {
      // Create transaction
      await base44.entities.Transaction.create({
        user_id: user.id,
        type: 'deposit',
        amount: depositAmount,
        balance_before: user.wallet_balance || 0,
        balance_after: (user.wallet_balance || 0) + depositAmount,
        payment_method: 'pix',
        status: 'completed'
      });
      
      // Update user balance
      await base44.auth.updateMe({
        wallet_balance: (user.wallet_balance || 0) + depositAmount
      });
    },
    onSuccess: () => {
      loadUser();
      queryClient.invalidateQueries(['transactions']);
      setDepositDialogOpen(false);
      setShowPixCode(false);
      setAmount('');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ withdrawAmount, pixKeyValue }) => {
      // Create pending withdrawal
      await base44.entities.Transaction.create({
        user_id: user.id,
        type: 'withdrawal',
        amount: withdrawAmount,
        balance_before: user.wallet_balance || 0,
        balance_after: (user.wallet_balance || 0) - withdrawAmount,
        payment_method: 'pix',
        payment_reference: pixKeyValue,
        status: 'pending'
      });
      
      // Update user balance
      await base44.auth.updateMe({
        wallet_balance: (user.wallet_balance || 0) - withdrawAmount
      });
    },
    onSuccess: () => {
      loadUser();
      queryClient.invalidateQueries(['transactions']);
      setWithdrawDialogOpen(false);
      setAmount('');
      setPixKey('');
    }
  });

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (depositAmount < 20) return;
    
    setProcessingPayment(true);
    setShowPixCode(true);
    
    // Simulate PIX generation and payment
    setTimeout(async () => {
      await depositMutation.mutateAsync(depositAmount);
      setProcessingPayment(false);
    }, 3000);
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount < 20 || withdrawAmount > (user?.wallet_balance || 0)) return;
    if (!pixKey) return;
    
    await withdrawMutation.mutateAsync({ withdrawAmount, pixKeyValue: pixKey });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'bet_placed':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'bet_won':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-white/50" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Concluído</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pendente</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-0">Falhou</Badge>;
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
      <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-white/60 mb-1">Saldo Disponível</p>
              <h1 className="text-4xl font-black text-white">
                R$ {(user?.wallet_balance || 0).toFixed(2)}
              </h1>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setDepositDialogOpen(true)}
                className="gold-gradient text-black font-bold px-6 hover:opacity-90"
              >
                <Plus className="w-5 h-5 mr-2" />
                Depositar
              </Button>
              <Button
                onClick={() => setWithdrawDialogOpen(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={(user?.wallet_balance || 0) < 20}
              >
                <ArrowUpRight className="w-5 h-5 mr-2" />
                Sacar
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm">Total Depositado</p>
              <p className="text-xl font-bold text-white mt-1">
                R$ {transactions.filter(t => t.type === 'deposit' && t.status === 'completed')
                  .reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
              </p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm">Total Sacado</p>
              <p className="text-xl font-bold text-white mt-1">
                R$ {transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed')
                  .reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
              </p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm">Apostas</p>
              <p className="text-xl font-bold text-white mt-1">
                R$ {transactions.filter(t => t.type === 'bet_placed')
                  .reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
              </p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm">Ganhos</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                R$ {transactions.filter(t => t.type === 'bet_won')
                  .reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl font-bold text-white mb-6">Histórico de Transações</h2>

        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/5 border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.type === 'deposit' || transaction.type === 'bet_won'
                          ? 'bg-emerald-500/20'
                          : 'bg-red-500/20'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">
                          {transaction.type === 'deposit' && 'Depósito'}
                          {transaction.type === 'withdrawal' && 'Saque'}
                          {transaction.type === 'bet_placed' && 'Aposta'}
                          {transaction.type === 'bet_won' && 'Ganho'}
                        </p>
                        <p className="text-white/50 text-sm">
                          {format(new Date(transaction.created_date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'deposit' || transaction.type === 'bet_won'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'bet_won' ? '+' : '-'}
                        R$ {transaction.amount.toFixed(2)}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10 p-8 text-center">
            <WalletIcon className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhuma transação</h3>
            <p className="text-white/50 mb-4">Faça seu primeiro depósito para começar a apostar!</p>
            <Button
              onClick={() => setDepositDialogOpen(true)}
              className="gold-gradient text-black font-bold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Fazer Depósito
            </Button>
          </Card>
        )}
      </div>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Depositar via PIX</DialogTitle>
          </DialogHeader>

          {!showPixCode ? (
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Valor do Depósito</Label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        amount === amt.toString()
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      R${amt}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">R$</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="pl-10 h-12 bg-white/5 border-white/10 text-lg"
                  />
                </div>
                {parseFloat(amount) < 20 && amount && (
                  <p className="text-amber-400 text-sm">Valor mínimo: R$ 20,00</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Depósito Seguro</span>
                </div>
                <p className="text-white/60 text-sm">
                  Pagamentos via PIX são processados instantaneamente e de forma segura.
                </p>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) < 20}
                className="w-full h-12 gold-gradient text-black font-bold text-lg"
              >
                Gerar PIX
              </Button>
            </div>
          ) : (
            <div className="space-y-6 mt-4 text-center">
              {processingPayment ? (
                <>
                  <div className="w-48 h-48 mx-auto bg-white rounded-xl p-4 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-slate-800" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Escaneie o QR Code</p>
                    <p className="text-white/50 text-sm">ou copie o código PIX abaixo</p>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                    <code className="flex-1 text-xs text-white/70 truncate">
                      00020126580014BR.GOV.BCB.PIX01365BULLS...
                    </code>
                    <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Aguardando pagamento...</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Depósito Confirmado!</h3>
                    <p className="text-white/60">
                      R$ {parseFloat(amount).toFixed(2)} foi adicionado ao seu saldo.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Sacar via PIX</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-white/50 text-sm">Saldo Disponível</p>
              <p className="text-2xl font-bold text-white">
                R$ {(user?.wallet_balance || 0).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Valor do Saque</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">R$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  max={user?.wallet_balance || 0}
                  className="pl-10 h-12 bg-white/5 border-white/10 text-lg"
                />
              </div>
              {parseFloat(amount) > (user?.wallet_balance || 0) && (
                <p className="text-red-400 text-sm">Saldo insuficiente</p>
              )}
              {parseFloat(amount) < 20 && amount && (
                <p className="text-amber-400 text-sm">Valor mínimo: R$ 20,00</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                className="h-12 bg-white/5 border-white/10"
              />
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-medium">Importante</span>
              </div>
              <p className="text-white/60 text-sm">
                O saque será processado em até 24 horas. A chave PIX deve estar cadastrada no seu nome.
              </p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={
                !amount || 
                parseFloat(amount) < 20 || 
                parseFloat(amount) > (user?.wallet_balance || 0) ||
                !pixKey ||
                withdrawMutation.isPending
              }
              className="w-full h-12 gold-gradient text-black font-bold text-lg"
            >
              {withdrawMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Solicitar Saque'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}