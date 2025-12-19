import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  User,
  Shield,
  Bell,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Clock,
  Ban,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form states
  const [phone, setPhone] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [oddsFormat, setOddsFormat] = useState('decimal');
  
  // Responsible gambling
  const [dailyLimit, setDailyLimit] = useState(0);
  const [weeklyLimit, setWeeklyLimit] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  
  // Dialogs
  const [selfExclusionDialog, setSelfExclusionDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setPhone(userData.phone || '');
      setNotificationsEnabled(userData.notifications_enabled !== false);
      setOddsFormat(userData.preferred_odds_format || 'decimal');
      setDailyLimit(userData.deposit_limit_daily || 0);
      setWeeklyLimit(userData.deposit_limit_weekly || 0);
      setMonthlyLimit(userData.deposit_limit_monthly || 0);
      setSessionTimeout(userData.session_timeout_minutes || 30);
    } catch (e) {
      navigate(createPageUrl('Onboarding'));
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        phone,
        notifications_enabled: notificationsEnabled,
        preferred_odds_format: oddsFormat
      });
      await loadUser();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleSaveLimits = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        deposit_limit_daily: dailyLimit || null,
        deposit_limit_weekly: weeklyLimit || null,
        deposit_limit_monthly: monthlyLimit || null,
        session_timeout_minutes: sessionTimeout
      });
      await loadUser();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
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
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user?.full_name || 'Usuário'}</h1>
              <p className="text-white/60">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {user?.verification_status === 'verified' ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Verificado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Pendente
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="profile" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Shield className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="responsible" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Lock className="w-4 h-4 mr-2" />
              Jogo Responsável
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Informações Pessoais</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Nome Completo</Label>
                    <Input
                      value={user?.full_name || ''}
                      disabled
                      className="bg-white/5 border-white/10 text-white/50"
                    />
                    <p className="text-white/40 text-xs">Nome não pode ser alterado</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70">E-mail</Label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-white/5 border-white/10 text-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70">CPF</Label>
                    <Input
                      value={user?.cpf || ''}
                      disabled
                      className="bg-white/5 border-white/10 text-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70">Celular</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Preferências</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Notificações</p>
                      <p className="text-white/50 text-sm">Receber alertas de apostas e promoções</p>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70">Formato de Odds</Label>
                    <div className="flex gap-2">
                      {['decimal', 'fractional', 'american'].map((format) => (
                        <button
                          key={format}
                          onClick={() => setOddsFormat(format)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            oddsFormat === format
                              ? 'bg-amber-500 text-black'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {format === 'decimal' ? 'Decimal' : format === 'fractional' ? 'Fracionário' : 'Americano'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/50 text-sm mb-2">Membro desde</p>
                    <p className="text-white">
                      {user?.created_date 
                        ? format(new Date(user.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="gold-gradient text-black font-bold"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Segurança da Conta</h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-white font-medium">Senha</p>
                        <p className="text-white/50 text-sm">Última alteração: nunca</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setPasswordDialog(true)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Alterar
                    </Button>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Verificação em duas etapas</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Sua conta está protegida com autenticação biométrica facial.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Sessões Ativas</h3>
                
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Sessão atual</p>
                      <p className="text-white/50 text-sm">
                        Último acesso: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full mt-4 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Responsible Gambling Tab */}
          <TabsContent value="responsible">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-2">Limites de Depósito</h3>
                <p className="text-white/50 text-sm mb-6">
                  Defina limites para controlar seus gastos
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Limite Diário</Label>
                      <span className="text-amber-400 font-bold">
                        {dailyLimit > 0 ? `R$ ${dailyLimit}` : 'Sem limite'}
                      </span>
                    </div>
                    <Slider
                      value={[dailyLimit]}
                      onValueChange={(value) => setDailyLimit(value[0])}
                      max={5000}
                      step={100}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Limite Semanal</Label>
                      <span className="text-amber-400 font-bold">
                        {weeklyLimit > 0 ? `R$ ${weeklyLimit}` : 'Sem limite'}
                      </span>
                    </div>
                    <Slider
                      value={[weeklyLimit]}
                      onValueChange={(value) => setWeeklyLimit(value[0])}
                      max={20000}
                      step={500}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Limite Mensal</Label>
                      <span className="text-amber-400 font-bold">
                        {monthlyLimit > 0 ? `R$ ${monthlyLimit}` : 'Sem limite'}
                      </span>
                    </div>
                    <Slider
                      value={[monthlyLimit]}
                      onValueChange={(value) => setMonthlyLimit(value[0])}
                      max={50000}
                      step={1000}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={handleSaveLimits}
                    disabled={saving}
                    className="w-full gold-gradient text-black font-bold"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Limites'}
                  </Button>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-2">Tempo de Sessão</h3>
                  <p className="text-white/50 text-sm mb-4">
                    Você será desconectado após este período de inatividade
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Minutos</Label>
                      <span className="text-amber-400 font-bold">{sessionTimeout} min</span>
                    </div>
                    <Slider
                      value={[sessionTimeout]}
                      onValueChange={(value) => setSessionTimeout(value[0])}
                      min={15}
                      max={120}
                      step={15}
                      className="w-full"
                    />
                  </div>
                </Card>

                <Card className="bg-red-500/10 border-red-500/20 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Ban className="w-6 h-6 text-red-400" />
                    <h3 className="text-lg font-bold text-white">Autoexclusão</h3>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Se você sente que precisa de uma pausa, pode se autoexcluir temporariamente ou permanentemente.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSelfExclusionDialog(true)}
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Solicitar Autoexclusão
                  </Button>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium mb-1">Precisa de ajuda?</p>
                      <p className="text-white/60 text-sm">
                        Se você ou alguém que conhece tem problemas com jogo, ligue para o CVV: 188
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Self Exclusion Dialog */}
      <Dialog open={selfExclusionDialog} onOpenChange={setSelfExclusionDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Ban className="w-6 h-6 text-red-400" />
              Autoexclusão
            </DialogTitle>
            <DialogDescription className="text-white/60">
              A autoexclusão é uma decisão importante. Você não poderá reverter imediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-white/80 text-sm">
                Ao solicitar autoexclusão, sua conta será bloqueada e você não poderá:
              </p>
              <ul className="list-disc list-inside mt-2 text-white/60 text-sm space-y-1">
                <li>Fazer login na plataforma</li>
                <li>Fazer novas apostas</li>
                <li>Depositar fundos</li>
              </ul>
            </div>

            <p className="text-white/50 text-sm">
              Para solicitar autoexclusão, entre em contato com nosso suporte ou acesse o 
              sistema nacional de autoexclusão (SIGAP).
            </p>

            <Button
              variant="outline"
              onClick={() => setSelfExclusionDialog(false)}
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Alterar Senha</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Senha Atual</Label>
              <Input
                type="password"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <Button className="w-full gold-gradient text-black font-bold">
              Alterar Senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}