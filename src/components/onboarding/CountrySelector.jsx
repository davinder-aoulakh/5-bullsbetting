import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const countries = [
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'CW', name: 'Curacao', flag: '🇨🇼' }
];

export default function CountrySelector({ selectedCountry, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Select Your Country</h2>
        <p className="text-white/60">Choose your country to continue with registration</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {countries.map((country) => (
          <Card
            key={country.code}
            onClick={() => onSelect(country.code)}
            className={`relative cursor-pointer transition-all p-4 ${
              selectedCountry === country.code
                ? 'bg-amber-500/20 border-amber-500 border-2'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            {selectedCountry === country.code && (
              <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-amber-400" />
            )}
            <div className="text-center">
              <div className="text-4xl mb-2">{country.flag}</div>
              <p className="text-white font-medium">{country.name}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}