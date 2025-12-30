import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, Eye, Lock } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function TermsAcceptance({ onAccept, termsAccepted, privacyAccepted, setTermsAccepted, setPrivacyAccepted }) {
  const { t } = useLanguage();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-black" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t('terms_title')}
        </h3>
        <p className="text-white/60 text-sm">
          {t('terms_subtitle')}
        </p>
      </div>

      {/* Terms Card */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <button
          onClick={() => setShowTerms(!showTerms)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">{t('terms_of_use')}</p>
              <p className="text-white/50 text-sm">{t('terms_of_use_desc')}</p>
            </div>
          </div>
          <Eye className="w-5 h-5 text-white/50" />
        </button>
        
        {showTerms && (
          <ScrollArea className="h-48 border-t border-white/10">
            <div className="p-4 text-white/70 text-sm space-y-2">
              <p><strong className="text-white">{t('terms_eligibility')}</strong></p>
              <p>{t('terms_eligibility_text')}</p>
              
              <p><strong className="text-white">{t('terms_unique_account')}</strong></p>
              <p>{t('terms_unique_account_text')}</p>
              
              <p><strong className="text-white">{t('terms_identity_verification')}</strong></p>
              <p>{t('terms_identity_verification_text')}</p>
              
              <p><strong className="text-white">{t('terms_responsible_gaming')}</strong></p>
              <p>{t('terms_responsible_gaming_text')}</p>
              
              <p><strong className="text-white">{t('terms_payment_methods')}</strong></p>
              <p>{t('terms_payment_methods_text')}</p>
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Privacy Card */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">{t('terms_privacy_policy')}</p>
              <p className="text-white/50 text-sm">{t('terms_privacy_policy_desc')}</p>
            </div>
          </div>
          <Eye className="w-5 h-5 text-white/50" />
        </button>
        
        {showPrivacy && (
          <ScrollArea className="h-48 border-t border-white/10">
            <div className="p-4 text-white/70 text-sm space-y-2">
              <p><strong className="text-white">{t('privacy_data_collection')}</strong></p>
              <p>{t('privacy_data_collection_text')}</p>
              
              <p><strong className="text-white">{t('privacy_data_usage')}</strong></p>
              <p>{t('privacy_data_usage_text')}</p>
              
              <p><strong className="text-white">{t('privacy_sharing')}</strong></p>
              <p>{t('privacy_sharing_text')}</p>
              
              <p><strong className="text-white">{t('privacy_rights')}</strong></p>
              <p>{t('privacy_rights_text')}</p>
              
              <p><strong className="text-white">{t('privacy_security')}</strong></p>
              <p>{t('privacy_security_text')}</p>
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={setTermsAccepted}
            className="border-white/30 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 mt-0.5"
          />
          <label htmlFor="terms" className="text-white/70 text-sm cursor-pointer">
            Li e aceito os <span className="text-amber-400">Termos de Uso</span> da plataforma 5-BullsBetting
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="privacy"
            checked={privacyAccepted}
            onCheckedChange={setPrivacyAccepted}
            className="border-white/30 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 mt-0.5"
          />
          <label htmlFor="privacy" className="text-white/70 text-sm cursor-pointer">
            Li e aceito a <span className="text-amber-400">Política de Privacidade</span> e autorizo o tratamento dos meus dados conforme a LGPD
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="age"
            checked={termsAccepted && privacyAccepted}
            disabled
            className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 mt-0.5"
          />
          <label htmlFor="age" className="text-white/50 text-sm">
            Declaro ter 18 anos ou mais de idade
          </label>
        </div>
      </div>
    </div>
  );
}