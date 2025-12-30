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
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [pollingInterval]);

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

        if (pollResponse.data.error) {
          clearInterval(interval);
          setError(pollResponse.data.error);
          setStatus('error');
          return;
        }

        if (pollResponse.data.completed && pollResponse.data.results?.length > 0) {
          clearInterval(interval);
          const resultId = pollResponse.data.results[0].resultId;
          await getResult(resultId);
        }
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(interval);
        setError(err.message || 'Failed to check verification status');
        setStatus('error');
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
      }
      // Check if still polling after timeout
      setStatus((currentStatus) => {
        if (currentStatus === 'polling') {
          setError(t('verify_error_title'));
          return 'error';
        }
        return currentStatus;
      });
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
        <p className="text-white font-medium">{t('verify_initializing')}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-8">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-white font-medium mb-2">{t('verify_error_title')}</p>
        <p className="text-white/60 text-sm mb-4">{error}</p>
        <Button onClick={handleRetry} className="gold-gradient text-black">
          {t('verify_retry')}
        </Button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{t('verify_success_title')}</h3>
        <p className="text-white/60 mb-4">{t('verify_success_desc')}</p>
      </motion.div>
    );
  }

  if (status === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{t('verify_failed_title')}</h3>
        <p className="text-white/60 mb-4">{t('verify_failed_desc')}</p>
        <Button onClick={handleRetry} className="gold-gradient text-black">
          {t('verify_retry')}
        </Button>
      </motion.div>
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
            {t('verify_desktop_title')}
          </h3>
          <p className="text-white/60">
            {t('verify_desktop_desc')}
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
            <span>{t('verify_desktop_waiting')}</span>
          </div>
        )}

        <div className="text-white/40 text-sm">
          <p>{t('verify_desktop_no_scan')}</p>
          <button 
            onClick={() => window.open(verificationData.link, '_blank')}
            className="text-amber-400 hover:underline mt-1"
          >
            {t('verify_desktop_get_link')}
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
                {t('verify_identity_title')}
              </h3>
              <p className="text-white/60 mb-6">
                {t('verify_open_instruction')}
              </p>
            </>
          ) : (
            <>
              <Loader2 className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">
                {t('verify_waiting_title')}
              </h3>
              <p className="text-white/60 mb-6">
                {t('verify_waiting_desc')}
              </p>
            </>
          )}
        </div>

        <Button
          onClick={() => window.open(verificationData.link, '_blank')}
          className="gold-gradient text-black font-semibold w-full"
          disabled={status !== 'ready'}
        >
          {status === 'ready' ? t('verify_open_button') : t('verify_in_progress')}
        </Button>

        {status === 'polling' && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
            <p className="text-white/80 text-sm">
              {t('verify_instructions_step1')}
              <br />
              {t('verify_instructions_step2')}
              <br />
              {t('verify_instructions_step3')}
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return null;
}