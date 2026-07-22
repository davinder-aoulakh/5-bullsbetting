import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Smartphone, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export default function DiditVerification({ onComplete, userData, isMobile, onVerificationLoadingChange }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState('initializing'); // initializing | ready | polling | approved | declined | in_review | abandoned | expired | error
  const [sessionId, setSessionId] = useState(null);
  const [verificationUrl, setVerificationUrl] = useState(null);
  const [decision, setDecision] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [error, setError] = useState('');
  const pollingRef = useRef(null);
  const timeoutRef = useRef(null);

  // Notify parent of loading state
  useEffect(() => {
    const isProcessing = ['initializing', 'polling'].includes(status);
    if (onVerificationLoadingChange) onVerificationLoadingChange(isProcessing);
  }, [status, onVerificationLoadingChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    // Check if returning from Didit's hosted flow via callback URL
    const urlParams = new URLSearchParams(window.location.search);
    const returnedSessionId = urlParams.get('verificationSessionId');
    const returnedStatus = urlParams.get('status');
    if (returnedSessionId) {
      console.log('🔙 [DiditVerification] Returning from Didit redirect, session:', returnedSessionId, 'status hint:', returnedStatus);
      setSessionId(returnedSessionId);
      // Use Didit's status param as an immediate hint while the poll confirms
      const hintMap = { approved: 'approved', declined: 'declined', in_review: 'in_review' };
      const hintStatus = hintMap[returnedStatus] || 'polling';
      setStatus(hintStatus);
      // Always poll for the authoritative result
      startPolling(returnedSessionId);
    } else {
      createSession();
    }
  }, []);

  const createSession = async () => {
    try {
      setStatus('initializing');
      setError('');
      const onboardingRef = crypto.randomUUID();

      console.log('🚀 [DiditVerification] Creating session...', { country: userData?.country, idType: userData?.id_type });

      const response = await base44.functions.invoke('diditCreateSession', {
        fullName: userData?.full_name || '',
        email: userData?.email || '',
        dateOfBirth: userData?.date_of_birth || '',
        country: userData?.country || '',
        idType: userData?.id_type || '',
        idValue: userData?.id_value || '',
        onboardingRef
      });

      if (response.data?.error) throw new Error(response.data.error);

      const { sessionId: newSessionId, verificationUrl: url } = response.data;
      console.log('✅ [DiditVerification] Session created:', newSessionId);

      setSessionId(newSessionId);
      setVerificationUrl(url);
      setStatus('ready');

      // Start polling after a short delay to give user time to read the screen
      setTimeout(() => startPolling(newSessionId), 3000);

    } catch (err) {
      console.error('❌ [DiditVerification] Session creation failed:', err);
      setError(err.message || 'Failed to initialize verification');
      setStatus('error');
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startPolling = (sid) => {
    setStatus('polling');
    stopPolling(); // clear any existing

    const interval = setInterval(async () => {
      try {
        console.log('🔄 [DiditVerification] Polling status for session:', sid);
        const res = await base44.functions.invoke('diditGetSessionStatus', { sessionId: sid });

        if (res.data?.error) {
          console.error('❌ [DiditVerification] Poll error:', res.data.error);
          stopPolling();
          setError(res.data.error);
          setStatus('error');
          return;
        }

        const { status: polledStatus, decision: polledDecision, failureReason: polledReason } = res.data;
        console.log('📊 [DiditVerification] Poll result:', polledStatus);

        if (polledStatus === 'approved') {
          stopPolling();
          setDecision(polledDecision);
          setStatus('approved');
          setTimeout(() => {
            onComplete({ verified: true, sessionId: sid, provider: 'didit', decision: polledDecision });
          }, 1500);

        } else if (polledStatus === 'declined') {
          stopPolling();
          setDecision(polledDecision);
          setFailureReason(polledReason || 'Verification declined. Please try again.');
          setStatus('declined');

        } else if (polledStatus === 'in_review') {
          stopPolling();
          setDecision(polledDecision);
          setStatus('in_review');

        } else if (polledStatus === 'abandoned' || polledStatus === 'expired') {
          stopPolling();
          setStatus(polledStatus);

        }
        // pending / in_progress — keep polling

      } catch (err) {
        console.error('❌ [DiditVerification] Polling exception:', err);
        stopPolling();
        setError(err.message || 'Failed to check verification status');
        setStatus('error');
      }
    }, POLL_INTERVAL_MS);

    pollingRef.current = interval;

    // Hard timeout
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setStatus((current) => {
        if (current === 'polling') {
          setError('Verification timed out. Please try again.');
          return 'error';
        }
        return current;
      });
    }, POLL_TIMEOUT_MS);
  };

  const handleRetry = () => {
    stopPolling();
    setSessionId(null);
    setVerificationUrl(null);
    setDecision(null);
    setFailureReason('');
    setError('');
    createSession();
  };

  // --- Status renders ---

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

  if (status === 'approved') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{t('verify_success_title')}</h3>
        <p className="text-white/60">{t('verify_success_desc')}</p>
      </motion.div>
    );
  }

  if (status === 'declined') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{t('verify_failed_title')}</h3>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 text-left">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm">{failureReason}</p>
          </div>
        </div>
        <Button onClick={handleRetry} className="gold-gradient text-black">
          Try Again
        </Button>
      </motion.div>
    );
  }

  if (status === 'in_review') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Verification Under Review</h3>
        <p className="text-white/60 mb-4">
          Your verification requires manual review and cannot be completed automatically right now.
        </p>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
          <p className="text-white/80 text-sm">
            Our compliance team will review your submission. Please check back later or contact support if you haven't heard back within 24 hours.
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === 'abandoned' || status === 'expired') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <Clock className="w-16 h-16 text-white/40 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">
          {status === 'expired' ? 'Session Expired' : 'Verification Abandoned'}
        </h3>
        <p className="text-white/60 mb-6">
          {status === 'expired'
            ? 'Your verification session has expired. Please start again.'
            : 'The verification was not completed. Please start again when you are ready.'}
        </p>
        <Button onClick={handleRetry} className="gold-gradient text-black">
          Start Again
        </Button>
      </motion.div>
    );
  }

  // ready / polling states — show the verification link UI
  // When returning from a redirect we don't have a verificationUrl; show a loading state instead of blank
  if (!verificationUrl) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">Checking your verification result…</p>
      </div>
    );
  }

  // Desktop: QR code + continue link
  if (!isMobile) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
        <div className="mb-2">
          <Smartphone className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{t('verify_desktop_title')}</h3>
          <p className="text-white/60">{t('verify_desktop_desc')}</p>
        </div>

        {/* QR code via Google Charts API — no extra package needed */}
        <div className="bg-white p-4 rounded-xl mx-auto inline-block">
          <img
            src={`https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(verificationUrl)}&choe=UTF-8`}
            alt="Scan to verify on your phone"
            className="w-56 h-56"
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
            onClick={() => window.open(verificationUrl, '_blank')}
            className="text-amber-400 hover:underline mt-1"
          >
            Continue on this device
          </button>
        </div>
      </motion.div>
    );
  }

  // Mobile: redirect in same tab (Didit callback returns to /Onboarding?diditSession=...)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
      <div className="mb-6">
        {status === 'ready' ? (
          <>
            <Smartphone className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{t('verify_identity_title')}</h3>
            <p className="text-white/60 mb-6">{t('verify_open_instruction')}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-bold text-white mb-2">{t('verify_waiting_title')}</h3>
            <p className="text-white/60 mb-6">{t('verify_waiting_desc')}</p>
          </>
        )}
      </div>

      <Button
        onClick={() => { window.location.href = verificationUrl; }}
        className="gold-gradient text-black font-semibold w-full"
        disabled={status === 'polling'}
      >
        {status === 'ready' ? 'Start Verification' : t('verify_in_progress')}
      </Button>

      {status === 'polling' && (
        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Waiting for verification to complete…</span>
        </div>
      )}
    </motion.div>
  );
}