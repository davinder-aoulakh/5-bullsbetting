import React from 'react';
import { Card } from "@/components/ui/card";
import { Lock, Shield, Eye, Database, Globe, UserCheck } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Política de Privacidade</h1>
          <p className="text-white/60">
            Última atualização: Janeiro de 2024
          </p>
        </div>

        {/* LGPD Badge */}
        <Card className="bg-emerald-500/10 border-emerald-500/20 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Conformidade com a LGPD</h3>
              <p className="text-white/60 text-sm">
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
              </p>
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card className="bg-white/5 border-white/10 p-8">
          <div className="space-y-8 text-white/80">
            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-purple-400" />
                1. Informações que Coletamos
              </h2>
              <p className="mb-4">
                Coletamos as seguintes categorias de dados pessoais:
              </p>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <h4 className="font-bold text-white mb-2">Dados de Identificação</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Nome completo</li>
                    <li>CPF</li>
                    <li>Data de nascimento</li>
                    <li>Documento de identidade (imagem)</li>
                    <li>Foto facial (selfie)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <h4 className="font-bold text-white mb-2">Dados de Contato</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>E-mail</li>
                    <li>Número de telefone</li>
                    <li>Endereço</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <h4 className="font-bold text-white mb-2">Dados Financeiros</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Histórico de transações</li>
                    <li>Chaves PIX</li>
                    <li>Dados bancários para saque</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <h4 className="font-bold text-white mb-2">Dados de Uso</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Histórico de apostas</li>
                    <li>Preferências de uso</li>
                    <li>Endereço IP</li>
                    <li>Dados de geolocalização</li>
                    <li>Informações do dispositivo</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-purple-400" />
                2. Como Usamos seus Dados
              </h2>
              <p className="mb-4">Utilizamos seus dados pessoais para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-white">Verificação de Identidade:</strong> Confirmar sua identidade 
                  conforme exigido pela Portaria SPA/MF 722/2024
                </li>
                <li>
                  <strong className="text-white">Prevenção à Fraude:</strong> Proteger contra atividades 
                  fraudulentas e lavagem de dinheiro
                </li>
                <li>
                  <strong className="text-white">Operação do Serviço:</strong> Processar apostas, depósitos 
                  e saques
                </li>
                <li>
                  <strong className="text-white">Jogo Responsável:</strong> Monitorar padrões de jogo e 
                  aplicar limites de proteção
                </li>
                <li>
                  <strong className="text-white">Conformidade Legal:</strong> Cumprir obrigações regulatórias 
                  e responder a solicitações de autoridades
                </li>
                <li>
                  <strong className="text-white">Comunicação:</strong> Enviar notificações sobre sua conta, 
                  apostas e atualizações do serviço
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-purple-400" />
                3. Compartilhamento de Dados
              </h2>
              <p className="mb-4">Podemos compartilhar seus dados com:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-white">Provedores de Verificação:</strong> DataChecker e Scope 
                  para validação de identidade e KYC
                </li>
                <li>
                  <strong className="text-white">Autoridades Reguladoras:</strong> SPA/MF e outros órgãos 
                  governamentais quando exigido por lei
                </li>
                <li>
                  <strong className="text-white">Processadores de Pagamento:</strong> Para processar 
                  transações financeiras
                </li>
                <li>
                  <strong className="text-white">Prestadores de Serviços:</strong> Empresas que nos auxiliam 
                  na operação da plataforma
                </li>
              </ul>
              <p className="mt-4 text-sm text-white/60">
                Todos os parceiros são obrigados a manter a confidencialidade e segurança 
                dos seus dados conforme a LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Armazenamento e Segurança</h2>
              <div className="p-4 rounded-lg bg-white/5 mb-4">
                <h4 className="font-bold text-white mb-2">Localização dos Dados</h4>
                <p className="text-sm">
                  Seus dados são armazenados em servidores localizados no Brasil, em conformidade 
                  com a Portaria SPA/MF 722/2024 que exige que dados de clientes sejam mantidos 
                  em território nacional ou em países com acordos de cooperação legal.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-bold text-white mb-2">Medidas de Segurança</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controle de acesso baseado em funções</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Backups regulares e plano de recuperação de desastres</li>
                  <li>Auditorias de segurança periódicas</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-purple-400" />
                5. Seus Direitos (LGPD)
              </h2>
              <p className="mb-4">Conforme a LGPD, você tem direito a:</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Confirmação', desc: 'Saber se tratamos seus dados' },
                  { title: 'Acesso', desc: 'Obter cópia dos seus dados' },
                  { title: 'Correção', desc: 'Corrigir dados incompletos ou inexatos' },
                  { title: 'Anonimização', desc: 'Anonimizar ou bloquear dados desnecessários' },
                  { title: 'Portabilidade', desc: 'Transferir seus dados para outro serviço' },
                  { title: 'Eliminação', desc: 'Excluir dados tratados com consentimento' },
                  { title: 'Informação', desc: 'Saber com quem compartilhamos seus dados' },
                  { title: 'Revogação', desc: 'Revogar consentimento a qualquer momento' },
                ].map((right, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5">
                    <h4 className="font-bold text-white text-sm">{right.title}</h4>
                    <p className="text-white/60 text-xs">{right.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">
                Para exercer seus direitos, entre em contato com nosso Encarregado de Proteção 
                de Dados: dpo@5-bullsbetting.bet.br
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">6. Retenção de Dados</h2>
              <p className="mb-4">
                Mantemos seus dados pessoais pelo tempo necessário para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Resolver disputas e fazer cumprir nossos acordos</li>
                <li>Fins de auditoria e conformidade</li>
              </ul>
              <p className="mt-4 text-sm text-white/60">
                Após o encerramento da conta, mantemos dados por até 5 anos conforme 
                exigências regulatórias do setor de jogos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">7. Cookies e Tecnologias de Rastreamento</h2>
              <p className="mb-4">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Manter você conectado à sua conta</li>
                <li>Lembrar suas preferências</li>
                <li>Analisar o uso da plataforma</li>
                <li>Prevenir fraudes</li>
              </ul>
              <p className="mt-4 text-sm text-white/60">
                Você pode gerenciar suas preferências de cookies através das configurações 
                do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">8. Menores de Idade</h2>
              <p>
                Nossa plataforma é destinada exclusivamente a maiores de 18 anos. 
                Não coletamos intencionalmente dados de menores. Se tomarmos conhecimento 
                de que coletamos dados de um menor, excluiremos essas informações imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">9. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. 
                Notificaremos você sobre alterações significativas por e-mail ou 
                através de aviso na plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">10. Contato</h2>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="mb-2">
                  <strong className="text-white">Encarregado de Proteção de Dados (DPO):</strong>
                </p>
                <p className="text-sm">E-mail: dpo@5-bullsbetting.bet.br</p>
                <p className="text-sm mt-2">
                  <strong className="text-white">Suporte Geral:</strong>
                </p>
                <p className="text-sm">E-mail: suporte@5-bullsbetting.bet.br</p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}