import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function DriverLicenseInput({ 
  value, 
  onChange, 
  error, 
  isValidating, 
  isValid,
  country 
}) {
  const getPlaceholder = () => {
    switch (country) {
      case 'AU': return '12345678';
      case 'NL': return '1234567890';
      default: return 'Enter license number';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="license" className="text-white/80">
        Driver's License Number
      </Label>
      <div className="relative">
        <Input
          id="license"
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
        Enter your valid driver's license number for identity verification
      </p>
    </div>
  );
}