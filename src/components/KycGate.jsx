import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Drop this component at the top of any page that requires KYC.
 * Pass `kycStatus` from the loaded user. Returns null if approved.
 */
export default function KycGate({ kycStatus }) {
  if (kycStatus === 'approved') return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Identity Verification Required
        </h2>
        <p className="text-white/60 mb-8">
          Please complete your identity verification to access this section. This is required to comply with regulatory obligations.
        </p>
        <Link to={createPageUrl('Onboarding')}>
          <Button className="gold-gradient text-black font-bold px-8 h-12">
            Complete Verification
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}