import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function NationalIDInput({ 
  value, 
  onChange, 
  error, 
  isValidating, 
  isValid,
  country 
}) {
  const getPlaceholder = () => {
    switch (country) {
      case 'NL':
        return 'Enter Dutch National ID number';
      default:
        return 'Enter National ID number';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="nationalId" className="text-white/80">
        National ID Number
      </Label>
      <div className="relative">
        <Input
          id="nationalId"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={getPlaceholder()}
          className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-12"
        />
        {isValidating && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 animate-spin" />
        )}
        {!isValidating && isValid && (
          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
        )}
        {!isValidating && error && (
          <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
        )}
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <p className="text-white/40 text-xs">
        Enter your valid National ID number for identity verification
      </p>
    </div>
  );
}