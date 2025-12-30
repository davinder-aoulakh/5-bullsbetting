import React from 'react';
import { Card } from "@/components/ui/card";
import { User, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function IdentityConfirmation({ userData }) {
  const { t, language } = useLanguage();
  
  const fields = [
    { 
      icon: User, 
      label: t('identity_full_name'), 
      value: userData.full_name || t('identity_not_informed') 
    },
    { 
      icon: Calendar, 
      label: t('identity_birth_date'), 
      value: userData.date_of_birth 
        ? new Date(userData.date_of_birth).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
        : t('identity_not_informed')
    },
    { 
      icon: MapPin, 
      label: t('identity_cpf'), 
      value: userData.cpf || t('identity_not_informed') 
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-black" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t('identity_confirm_title')}
        </h3>
        <p className="text-white/60 text-sm">
          {t('identity_confirm_subtitle')}
        </p>
      </div>

      <Card className="bg-white/5 border-white/10 p-4 space-y-4">
        {fields.map((field, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <field.icon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white/50 text-xs">{field.label}</p>
              <p className="text-white font-medium">{field.value}</p>
            </div>
          </div>
        ))}
      </Card>

      <p className="text-white/40 text-xs text-center">
        {t('identity_notice')}
      </p>
    </div>
  );
}