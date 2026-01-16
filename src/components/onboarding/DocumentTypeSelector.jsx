import React from 'react';
import { Card } from '@/components/ui/card';
import { CreditCard, FileText } from 'lucide-react';

export default function DocumentTypeSelector({ country, selectedType, onSelect }) {
  const getDocumentTypes = () => {
    switch (country) {
      case 'AU':
        return [
          { value: 'driver_license', label: "Driver's License", icon: CreditCard },
          { value: 'passport', label: 'Passport', icon: FileText }
        ];
      case 'NL':
        return [
          { value: 'driver_license', label: "Driver's License", icon: CreditCard },
          { value: 'passport', label: 'Passport', icon: FileText },
          { value: 'identity_card', label: 'National ID', icon: CreditCard }
        ];
      case 'CW':
        return [
          { value: 'passport', label: 'Passport', icon: FileText },
          { value: 'sedula', label: 'Sédula (ID Card)', icon: CreditCard }
        ];
      default:
        return [];
    }
  };

  const types = getDocumentTypes();

  if (types.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Select Document Type</h3>
        <p className="text-white/60 text-sm">Choose which document you'll use for verification</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {types.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.value}
              onClick={() => onSelect(type.value)}
              className={`cursor-pointer transition-all p-4 ${
                selectedType === type.value
                  ? 'bg-amber-500/20 border-amber-500 border-2'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-center">
                <Icon className={`w-8 h-8 mx-auto mb-2 ${
                  selectedType === type.value ? 'text-amber-400' : 'text-white/60'
                }`} />
                <p className={`text-sm font-medium ${
                  selectedType === type.value ? 'text-white' : 'text-white/70'
                }`}>
                  {type.label}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}