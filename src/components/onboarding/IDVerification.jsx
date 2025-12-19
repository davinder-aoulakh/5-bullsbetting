import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  Loader2,
  User,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IDVerification({ onComplete, isMobile, userData }) {
  const [step, setStep] = useState('intro'); // intro, qr, uploading, selfie, processing, complete, error
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  // Simulated verification flow
  const startVerification = () => {
    if (isMobile) {
      setStep('document');
    } else {
      setStep('qr');
    }
  };

  const handleDocumentUpload = () => {
    setStep('uploading');
    // Simulate upload
    setTimeout(() => {
      setDocumentUploaded(true);
      setStep('selfie');
    }, 2000);
  };

  const handleSelfieCapture = () => {
    setStep('processing');
    // Simulate processing
    setTimeout(() => {
      setSelfieUploaded(true);
      setStep('complete');
      onComplete({ verified: true });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Verificação de Identidade
              </h3>
              <p className="text-white/60 text-sm">
                Para sua segurança, precisamos verificar sua identidade
              </p>
            </div>

            <div className="space-y-3">
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Documento com foto</p>
                    <p className="text-white/50 text-sm">RG, CNH ou Passaporte</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Selfie</p>
                    <p className="text-white/50 text-sm">Reconhecimento facial</p>
                  </div>
                </div>
              </Card>
            </div>

            {!isMobile && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Smartphone className="w-5 h-5" />
                  <span className="font-medium">Use seu celular</span>
                </div>
                <p className="text-white/60 text-sm">
                  Para melhor experiência, você será direcionado para continuar no celular usando um QR Code.
                </p>
              </div>
            )}

            <Button
              onClick={startVerification}
              className="w-full h-14 text-lg gold-gradient text-black font-semibold hover:opacity-90"
            >
              Iniciar Verificação
            </Button>
          </motion.div>
        )}

        {step === 'qr' && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8 text-black" />
            </div>
            
            <h3 className="text-xl font-bold text-white">
              Escaneie o QR Code
            </h3>
            <p className="text-white/60 text-sm">
              Abra a câmera do seu celular e escaneie o código abaixo
            </p>

            <div className="bg-white p-6 rounded-2xl mx-auto w-fit">
              <div className="w-48 h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
                <QrCode className="w-32 h-32 text-white" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-white/50">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Aguardando leitura do QR Code...</span>
            </div>

            <Button
              variant="ghost"
              onClick={() => setStep('document')}
              className="text-white/60 hover:text-white"
            >
              Ou continue pelo computador
            </Button>
          </motion.div>
        )}

        {step === 'document' && (
          <motion.div
            key="document"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white">
              Fotografe seu documento
            </h3>
            <p className="text-white/60 text-sm">
              Posicione seu RG, CNH ou Passaporte em um local bem iluminado
            </p>

            <div className="aspect-[4/3] bg-slate-800/50 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4">
              <Camera className="w-12 h-12 text-white/30" />
              <p className="text-white/40 text-sm">
                Toque para capturar
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-white/50">
              <div className="p-2 rounded-lg bg-white/5">
                <p>✓ Boa iluminação</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <p>✓ Sem reflexos</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <p>✓ Documento inteiro</p>
              </div>
            </div>

            <Button
              onClick={handleDocumentUpload}
              className="w-full h-14 text-lg gold-gradient text-black font-semibold hover:opacity-90"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capturar Documento
            </Button>
          </motion.div>
        )}

        {step === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 py-12"
          >
            <Loader2 className="w-16 h-16 text-amber-400 animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-white">
              Processando documento...
            </h3>
            <p className="text-white/60 text-sm">
              Aguarde enquanto validamos seu documento
            </p>
          </motion.div>
        )}

        {step === 'selfie' && (
          <motion.div
            key="selfie"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-emerald-400 text-sm font-medium">Documento verificado</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white">
              Agora tire uma selfie
            </h3>
            <p className="text-white/60 text-sm">
              Posicione seu rosto dentro do círculo e olhe diretamente para a câmera
            </p>

            <div className="relative w-64 h-64 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-500/50 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <User className="w-20 h-20 text-white/30" />
              </div>
            </div>

            <Button
              onClick={handleSelfieCapture}
              className="w-full h-14 text-lg gold-gradient text-black font-semibold hover:opacity-90"
            >
              <Camera className="w-5 h-5 mr-2" />
              Tirar Selfie
            </Button>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 py-12"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <User className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white">
              Verificando identidade...
            </h3>
            <p className="text-white/60 text-sm">
              Comparando sua selfie com o documento
            </p>
            
            <div className="space-y-2 max-w-xs mx-auto">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Documento validado</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Verificando biometria facial</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className="text-2xl font-bold text-white">
              Verificação Concluída!
            </h3>
            <p className="text-white/60">
              Sua identidade foi verificada com sucesso
            </p>

            <div className="space-y-2 max-w-xs mx-auto text-sm">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Documento autêntico</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reconhecimento facial validado</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>CPF confirmado</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            
            <h3 className="text-2xl font-bold text-white">
              Verificação Falhou
            </h3>
            <p className="text-white/60">
              Não foi possível verificar sua identidade
            </p>

            <Button
              onClick={() => setStep('intro')}
              className="gold-gradient text-black font-semibold"
            >
              Tentar Novamente
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}