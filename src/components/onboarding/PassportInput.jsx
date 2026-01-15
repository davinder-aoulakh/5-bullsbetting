import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function PassportInput({ 
  value, 
  onChange, 
  error, 
  isValidating, 
  isValid,
  country 
}) {
  console.log('🎫 PassportInput render:', { value, country, error, isValid });
  
  const getPlaceholder = () => {
    switch (country) {
      case 'AU': return 'PA1234567';
      case 'NL': return 'AB1234567';
      case 'CW': return 'AB1234567';
      default: return 'Enter passport number';
    }
  };
  
  const handleInputChange = (e) => {
    // Keep only printable ASCII characters, remove all whitespace
    const newValue = e.target.value
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .replace(/\s/g, '')            // Remove all whitespace
      .toUpperCase();
    
    console.log('🎫 Input change:', { 
      original: e.target.value, 
      processed: newValue,
      originalCodes: [...e.target.value].map(c => c.charCodeAt(0)),
      processedCodes: [...newValue].map(c => c.charCodeAt(0))
    });
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="passport" className="text-white/80">
        Passport Number
      </Label>
      <div className="relative">
        <Input
          id="passport"
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={getPlaceholder()}
          maxLength={20}
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck="false"
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
        Enter your valid passport number for identity verification
      </p>
    </div>
  );
}