import React from 'react';
import { Card } from "@/components/ui/card";
import { FileText, Shield, Scale } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Termos de Uso</h1>
          <p className="text-white/60">
            Última atualização: Janeiro de 2024
          </p>
        </div>

        {/* Content */}
        <Card className="bg-white/5 border-white/10 p-8">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8 text-white/80">
              <section>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-amber-400" />
                  1. Aceitação dos Termos
                </h2>
                <p>
                  Ao acessar e usar a plataforma 5-BullsBetting, você concorda em cumprir 
                  e ficar vinculado a estes Termos de Uso. Se você não concordar com 
                  qualquer parte destes termos, não poderá acessar o serviço.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">2. Elegibilidade</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Você deve ter pelo menos 18 anos de idade para usar nossos serviços.</li>
                  <li>Você deve ser residente no Brasil.</li>
                  <li>Você não pode estar inscrito em nenhuma lista de autoexclusão de jogos.</li>
                  <li>Você deve fornecer informações verdadeiras e precisas durante o cadastro.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">3. Conta de Usuário</h2>
                <p className="mb-4">
                  Cada usuário pode manter apenas uma conta ativa. A criação de múltiplas 
                  contas resultará no encerramento de todas as contas e confisco de fundos.
                </p>
                <p>
                  Você é responsável por manter a confidencialidade de suas credenciais 
                  de acesso e por todas as atividades que ocorrem em sua conta.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-amber-400" />
                  4. Verificação de Identidade
                </h2>
                <p className="mb-4">
                  Conforme exigido pela Portaria SPA/MF 722/2024, realizamos verificação 
                  completa de identidade antes da ativação da conta, incluindo:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Validação do CPF</li>
                  <li>Verificação de documento oficial com foto (RG, CNH ou Passaporte)</li>
                  <li>Reconhecimento facial biométrico</li>
                  <li>Verificação em listas de sanções e autoexclusão</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">5. Depósitos e Saques</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Aceitamos depósitos via PIX, transferência bancária e boleto.</li>
                  <li>Cartões de crédito não são aceitos, conforme regulamentação brasileira.</li>
                  <li>O valor mínimo para depósito e saque é de R$ 20,00.</li>
                  <li>Saques são processados em até 24 horas úteis.</li>
                  <li>A conta bancária para saque deve estar no mesmo nome do titular da conta.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">6. Apostas</h2>
                <p className="mb-4">
                  Todas as apostas são finais e não podem ser canceladas após confirmação. 
                  As odds exibidas no momento da confirmação da aposta são as que serão 
                  aplicadas, independentemente de alterações posteriores.
                </p>
                <p>
                  Reservamo-nos o direito de anular apostas em caso de:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Erros óbvios nas odds</li>
                  <li>Eventos cancelados ou adiados</li>
                  <li>Atividade suspeita ou fraudulenta</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">7. Jogo Responsável</h2>
                <p className="mb-4">
                  Promovemos o jogo responsável e oferecemos ferramentas para ajudar 
                  nossos usuários a manterem o controle:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Limites de depósito (diário, semanal, mensal)</li>
                  <li>Autoexclusão temporária ou permanente</li>
                  <li>Histórico completo de apostas e transações</li>
                  <li>Tempo limite de sessão</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">8. Uso Proibido</h2>
                <p className="mb-4">Você concorda em não:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Usar a plataforma para lavagem de dinheiro ou atividades ilegais</li>
                  <li>Utilizar bots, scripts ou software automatizado para apostas</li>
                  <li>Tentar manipular resultados ou explorar vulnerabilidades do sistema</li>
                  <li>Compartilhar sua conta com terceiros</li>
                  <li>Usar VPN ou outros métodos para ocultar sua localização real</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">9. Propriedade Intelectual</h2>
                <p>
                  Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones, 
                  imagens e software, é de propriedade da 5-BullsBetting ou de seus 
                  licenciadores e está protegido por leis de propriedade intelectual.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">10. Limitação de Responsabilidade</h2>
                <p>
                  A 5-BullsBetting não será responsável por perdas decorrentes de apostas, 
                  interrupções de serviço, erros técnicos ou decisões tomadas com base em 
                  informações disponíveis na plataforma. O uso da plataforma é por sua 
                  conta e risco.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">11. Alterações nos Termos</h2>
                <p>
                  Reservamo-nos o direito de modificar estes Termos a qualquer momento. 
                  As alterações entrarão em vigor imediatamente após a publicação. 
                  O uso continuado da plataforma após as alterações constitui aceitação 
                  dos novos termos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">12. Lei Aplicável</h2>
                <p>
                  Estes Termos são regidos pelas leis do Brasil. Qualquer disputa será 
                  resolvida pelos tribunais competentes do Brasil.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">13. Contato</h2>
                <p>
                  Para dúvidas sobre estes Termos de Uso, entre em contato através do 
                  nosso suporte: suporte@5-bullsbetting.bet.br
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}