import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Shield,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScopeVerification({ userData, sessionId, onComplete }) {
  const [status, setStatus] = useState('initializing'); // initializing, screening, approved, rejected, manual_review, error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    startVerification();
  }, []);

  const startVerification = async () => {
    try {
      setLoading(true);
      setStatus('screening');
      setError(null);

      console.log('🚀 [ScopeVerification] Starting Scope CDD verification...');
      console.log('👤 [ScopeVerification] User data:', JSON.stringify(userData, null, 2));
      console.log('🆔 [ScopeVerification] Session ID:', sessionId);

      const requestPayload = {
        userData,
        sessionId
      };
      console.log('📤 [ScopeVerification] Request payload:', JSON.stringify(requestPayload, null, 2));

      const response = await base44.functions.invoke('scopeCompleteVerification', requestPayload);

      console.log('📊 [ScopeVerification] Response status:', response.status);
      console.log('📊 [ScopeVerification] Response headers:', response.headers);
      console.log('📊 [ScopeVerification] Response data:', JSON.stringify(response.data, null, 2));

      if (response.data.error) {
        console.error('❌ [ScopeVerification] API returned error:', {
          error: response.data.error,
          details: response.data.details,
          parsedError: response.data.parsedError,
          stack: response.data.stack,
          status: response.data.status,
          url: response.data.url
        });
        
        // Create user-friendly error message
        let userMessage = response.data.error;
        if (response.data.details) {
          try {
            const parsedDetails = JSON.parse(response.data.details);
            userMessage += `: ${parsedDetails.message || parsedDetails.error || response.data.details}`;
          } catch (e) {
            userMessage += `: ${response.data.details}`;
          }
        }
        
        throw new Error(userMessage);
      }

      const { status: verificationStatus, approved, reason, risk_score, details } = response.data;

      console.log('✅ [ScopeVerification] Verification complete:', {
        status: verificationStatus,
        approved,
        reason,
        risk_score
      });

      setResult({
        status: verificationStatus,
        approved,
        reason,
        risk_score,
        details
      });

      setStatus(verificationStatus);

      // Call onComplete with result
      if (onComplete) {
        console.log('📞 [ScopeVerification] Calling onComplete callback');
        onComplete({
          verified: approved,
          status: verificationStatus,
          reason,
          risk_score
        });
      }

    } catch (err) {
      console.error('❌ [ScopeVerification] Verification error:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message);
      setStatus('error');
    } finally {
      setLoading(false);
      console.log('🏁 [ScopeVerification] Verification process finished');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'initializing':
      case 'screening':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-amber-400" />
                </div>
                <Loader2 className="w-24 h-24 text-amber-400 animate-spin absolute -top-2 -left-2" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Compliance Screening
              </h3>
              <p className="text-white/60">
                Checking sanctions lists, PEP databases, and risk factors...
              </p>
              <p className="text-white/40 text-sm mt-2">
                This may take up to 60 seconds
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-white/60">Sanctions</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-white/60">PEP</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-white/60">Risk Check</p>
              </div>
            </div>
          </motion.div>
        );

      case 'approved':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Compliance Approved! ✓
              </h3>
              <p className="text-white/60">
                You've passed all compliance checks
              </p>
              {result?.risk_score !== undefined && (
                <p className="text-white/40 text-sm mt-2">
                  Risk Score: {result.risk_score}/100
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 text-sm">
                ✓ No sanctions matches<br />
                ✓ No PEP alerts<br />
                ✓ Low risk profile
              </p>
            </div>
          </motion.div>
        );

      case 'rejected':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Unable to Approve
              </h3>
              <p className="text-white/60">
                We're unable to complete your registration at this time
              </p>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
              <p className="text-red-400 text-sm font-medium mb-2">
                Reason:
              </p>
              <p className="text-white/80 text-sm">
                {result?.reason || 'Compliance requirements not met'}
              </p>
            </div>

            <div className="text-white/60 text-sm">
              <p>If you believe this is an error, please contact support.</p>
            </div>
          </motion.div>
        );

      case 'manual_review':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-amber-400" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Manual Review Required
              </h3>
              <p className="text-white/60">
                Your application requires additional verification
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
              <p className="text-amber-400 text-sm font-medium mb-2">
                Status:
              </p>
              <p className="text-white/80 text-sm">
                {result?.reason || 'Additional checks needed'}
              </p>
            </div>

            <div className="text-white/60 text-sm space-y-2">
              <p>Our compliance team will review your application within 24-48 hours.</p>
              <p>You'll receive an email notification once the review is complete.</p>
            </div>

            <Button
              onClick={() => window.location.href = '/'}
              className="gold-gradient text-black font-semibold"
            >
              Return to Home
            </Button>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Verification Error
              </h3>
              <p className="text-white/60">
                Something went wrong during verification
              </p>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
              <p className="text-red-400 text-sm">
                {error || 'An unexpected error occurred'}
              </p>
            </div>

            <Button
              onClick={startVerification}
              disabled={loading}
              className="gold-gradient text-black font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </Card>
  );
}