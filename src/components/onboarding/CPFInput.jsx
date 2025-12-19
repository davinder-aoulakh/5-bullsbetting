import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function CPFInput({ value, onChange, error, isValidating, isValid }) {
  const formatCPF = (val) => {
    // Remove non-digits
    const digits = val.replace(/\D/g, '');
    
    // Apply mask: XXX.XXX.XXX-XX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handleChange = (e) => {
    const formatted = formatCPF(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cpf" className="text-white/80 text-sm font-medium">
        CPF
      </Label>
      <div className="relative">
        <Input
          id="cpf"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="000.000.000-00"
          maxLength={14}
          className={`
            h-14 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/30
            focus:border-amber-500 focus:ring-amber-500/20 pr-12
            ${error ? 'border-red-500' : isValid ? 'border-emerald-500' : ''}
          `}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isValidating && (
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          )}
          {!isValidating && isValid && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          {!isValidating && error && (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
        </div>
      </div>
      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      <p className="text-white/40 text-xs">
        Seu CPF é necessário para verificação de identidade conforme exigido pela legislação brasileira.
      </p>
    </div>
  );
}