import React from 'react';
import { Card } from "@/components/ui/card";
import { User, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

export default function IdentityConfirmation({ userData }) {
  const fields = [
    { 
      icon: User, 
      label: 'Nome Completo', 
      value: userData.full_name || 'Não informado' 
    },
    { 
      icon: Calendar, 
      label: 'Data de Nascimento', 
      value: userData.date_of_birth 
        ? new Date(userData.date_of_birth).toLocaleDateString('pt-BR')
        : 'Não informado'
    },
    { 
      icon: MapPin, 
      label: 'CPF', 
      value: userData.cpf || 'Não informado' 
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-black" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Confirme seus dados
        </h3>
        <p className="text-white/60 text-sm">
          Verifique se as informações abaixo estão corretas
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
        Estes dados foram obtidos através da consulta ao seu CPF e serão utilizados 
        para verificar sua identidade conforme exigido pela Portaria SPA/MF 722/2024.
      </p>
    </div>
  );
}