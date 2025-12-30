import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';

export default function DataCheckerVerification({ onComplete, userData, isMobile }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState('initializing'); // initializing, ready, polling, completed, error, success, failed
  const [verificationData, setVerificationData] = useState(null);
  const [error, setError] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    initializeVerification();
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  const initializeVerification = async () => {
    try {
      setStatus('initializing');
      
      const response = await base44.functions.invoke('datacheckerCreateLink', {
        name: userData.full_name,
        email: userData.email || '',
        phone: userData.phone || '',
        cpf: userData.cpf
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setVerificationData(response.data);
      setStatus('ready');

      // Start polling after a short delay
      setTimeout(() => startPolling(response.data.transactionId), 3000);

    } catch (err) {
      console.error('Verification initialization error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initialize verification';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const startPolling = (transactionId) => {
    setStatus('polling');
    
    const interval = setInterval(async () => {
      try {
        const pollResponse = await base44.functions.invoke('datacheckerPoll', {
          transactionId
        });

        if (pollResponse.data.completed && pollResponse.data.results?.length > 0) {
          clearInterval(interval);
          const resultId = pollResponse.data.results[0].resultId;
          await getResult(resultId);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (status === 'polling') {
        setError('Verification timeout. Please try again.');
        setStatus('error');
      }
    }, 300000);
  };

  const getResult = async (resultId) => {
    try {
      const resultResponse = await base44.functions.invoke('datacheckerGetResult', {
        resultId
      });

      if (resultResponse.data.error) {
        throw new Error(resultResponse.data.error);
      }

      const approved = resultResponse.data.approved;
      setVerificationResult(resultResponse.data);
      setStatus(approved ? 'success' : 'failed');

      // Call onComplete after showing the result
      setTimeout(() => {
        onComplete({
          verified: approved,
          transactionId: verificationData.transactionId,
          result: resultResponse.data
        });
      }, approved ? 2000 : 0);

    } catch (err) {
      setError(err.message || 'Failed to retrieve verification result');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    setError('');
    initializeVerification();
  };

  if (status === 'initializing') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">Inicializando verificação...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-8">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-white font-medium mb-2">Erro na verificação</p>
        <p className="text-white/60 text-sm mb-4">{error}</p>
        <Button onClick={handleRetry} className="gold-gradient text-black">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <p className="text-white font-medium">Verificação concluída!</p>
      </div>
    );
  }

  // Desktop flow - show QR code
  if (!isMobile && verificationData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-6"
      >
        <div className="mb-6">
          <Smartphone className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Verifique sua identidade
          </h3>
          <p className="text-white/60">
            Escaneie o código QR com seu smartphone para continuar
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-xl mx-auto inline-block">
          <img
            src={`data:image/png;base64,${verificationData.qrCode}`}
            alt="QR Code for verification"
            className="w-64 h-64"
          />
        </div>

        {status === 'polling' && (
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Aguardando verificação no seu telefone...</span>
          </div>
        )}

        <div className="text-white/40 text-sm">
          <p>Não consegue escanear?</p>
          <button className="text-amber-400 hover:underline mt-1">
            Clique aqui para obter o link
          </button>
        </div>
      </motion.div>
    );
  }

  // Mobile flow - open verification in new tab
  if (isMobile && verificationData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-6"
      >
        <div className="mb-6">
          {status === 'ready' ? (
            <>
              <Smartphone className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Verificação de Identidade
              </h3>
              <p className="text-white/60 mb-6">
                Clique no botão abaixo para abrir a verificação. Após concluir, retorne a esta página.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">
                Aguardando Verificação
              </h3>
              <p className="text-white/60 mb-6">
                Complete a verificação na outra aba e aguarde aqui. Estamos verificando automaticamente...
              </p>
            </>
          )}
        </div>

        <Button
          onClick={() => window.open(verificationData.link, '_blank')}
          className="gold-gradient text-black font-semibold w-full"
          disabled={status !== 'ready'}
        >
          {status === 'ready' ? 'Abrir Verificação' : 'Verificação em Andamento'}
        </Button>

        {status === 'polling' && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
            <p className="text-white/80 text-sm">
              ✓ Complete a verificação na aba que foi aberta
              <br />
              ✓ Após enviar, retorne a esta página
              <br />
              ✓ Aguarde enquanto processamos (pode levar alguns segundos)
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return null;
}