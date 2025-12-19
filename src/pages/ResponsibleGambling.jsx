import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Heart, 
  Clock, 
  Ban, 
  Phone, 
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResponsibleGambling() {
  const tips = [
    {
      icon: Clock,
      title: 'Defina Limites de Tempo',
      description: 'Estabeleça um tempo máximo para suas sessões de jogo e respeite esse limite.'
    },
    {
      icon: Shield,
      title: 'Defina um Orçamento',
      description: 'Só aposte o que você pode perder. Nunca use dinheiro destinado a contas essenciais.'
    },
    {
      icon: AlertTriangle,
      title: 'Reconheça os Sinais',
      description: 'Se você está apostando para recuperar perdas ou mentindo sobre seus hábitos, busque ajuda.'
    },
    {
      icon: Heart,
      title: 'Cuide da Saúde Mental',
      description: 'Não use o jogo como escape para problemas emocionais ou financeiros.'
    }
  ];

  const warningsSigns = [
    'Apostar mais do que pode pagar',
    'Mentir para família sobre hábitos de jogo',
    'Apostar para recuperar perdas',
    'Negligenciar trabalho ou família pelo jogo',
    'Pedir dinheiro emprestado para apostar',
    'Sentir-se ansioso quando não está apostando',
    'Aumentar o valor das apostas para sentir a mesma emoção',
    'Continuar apostando mesmo após grandes perdas'
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Jogo Responsável
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Na 5-BullsBetting, a segurança e o bem-estar dos nossos usuários são prioridade. 
              Conheça as ferramentas e recursos disponíveis para um jogo consciente.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tools */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Ferramentas de Controle
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 p-6 h-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <tip.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{tip.title}</h3>
                <p className="text-white/60 text-sm">{tip.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Warning Signs */}
      <div className="bg-white/[0.02] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Sinais de Alerta
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Reconheça os sinais de que o jogo pode estar se tornando um problema
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {warningsSigns.map((sign, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span className="text-white/80">{sign}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Self Exclusion */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Ban className="w-8 h-8 text-red-400" />
                <h2 className="text-2xl font-bold text-white">Autoexclusão</h2>
              </div>
              <p className="text-white/70 mb-6">
                Se você sente que precisa de uma pausa, oferecemos opções de autoexclusão 
                temporária ou permanente. Durante este período, sua conta será bloqueada 
                e você não poderá acessar a plataforma.
              </p>
              <p className="text-white/60 text-sm mb-6">
                O Brasil possui um sistema nacional de autoexclusão (SIGAP) que permite 
                que você se exclua de todas as plataformas de apostas licenciadas.
              </p>
              <Link to={createPageUrl('Profile')}>
                <Button className="gold-gradient text-black font-bold">
                  Gerenciar Autoexclusão
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5">
                <h4 className="text-white font-medium mb-2">Autoexclusão Temporária</h4>
                <p className="text-white/60 text-sm">
                  Bloqueie sua conta por um período determinado (24 horas a 6 meses)
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <h4 className="text-white font-medium mb-2">Autoexclusão Permanente</h4>
                <p className="text-white/60 text-sm">
                  Encerre sua conta permanentemente. Esta ação é irreversível.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Help Resources */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Recursos de Ajuda
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white/5 border-white/10 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">CVV - Centro de Valorização da Vida</h3>
            <p className="text-white/60 text-sm mb-4">
              Apoio emocional e prevenção do suicídio
            </p>
            <a 
              href="tel:188"
              className="text-2xl font-bold text-blue-400"
            >
              188
            </a>
            <p className="text-white/50 text-xs mt-2">Ligação gratuita, 24 horas</p>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Jogadores Anônimos</h3>
            <p className="text-white/60 text-sm mb-4">
              Grupo de apoio para pessoas com compulsão por jogo
            </p>
            <a 
              href="https://www.jogadoresanonimos.org.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-400 hover:underline"
            >
              Visitar Site
              <ExternalLink className="w-4 h-4" />
            </a>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">CAPS - Centro de Atenção Psicossocial</h3>
            <p className="text-white/60 text-sm mb-4">
              Atendimento público em saúde mental
            </p>
            <p className="text-white/50 text-sm">
              Procure a unidade mais próxima de você
            </p>
          </Card>
        </div>
      </div>

      {/* Quiz Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Teste seus hábitos de jogo
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-6">
            Responda algumas perguntas rápidas para avaliar se seus hábitos de jogo 
            são saudáveis.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={createPageUrl('Profile')}>
              <Button className="gold-gradient text-black font-bold">
                Definir Limites de Depósito
              </Button>
            </Link>
            <a 
              href="https://www.begambleaware.org/gambling-problems/do-i-have-a-gambling-problem"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Fazer Teste Online
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </Card>
      </div>

      {/* Commitment */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6">
            Nosso Compromisso
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: CheckCircle2,
                title: 'Verificação de Idade',
                description: 'Proibimos rigorosamente o acesso de menores de 18 anos'
              },
              {
                icon: Shield,
                title: 'Proteção de Dados',
                description: 'Seus dados são protegidos conforme a LGPD'
              },
              {
                icon: Heart,
                title: 'Suporte Dedicado',
                description: 'Equipe treinada para orientar sobre jogo responsável'
              }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3">
                  <item.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-white font-bold mb-1">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}