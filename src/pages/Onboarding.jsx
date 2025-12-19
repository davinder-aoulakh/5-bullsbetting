import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Shield,
  Zap,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import StepIndicator from '@/components/onboarding/StepIndicator';
import CPFInput from '@/components/onboarding/CPFInput';
import IdentityConfirmation from '@/components/onboarding/IdentityConfirmation';
import TermsAcceptance from '@/components/onboarding/TermsAcceptance';
import IDVerification from '@/components/onboarding/IDVerification';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [cpfValidating, setCpfValidating] = useState(false);
  const [cpfValid, setCpfValid] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  
  const [userData, setUserData] = useState({});
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const [kycPassed, setKycPassed] = useState(false);
  const [idvCompleted, setIdvCompleted] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const steps = [
    { label: 'CPF' },
    { label: 'Conta' },
    { label: 'Dados' },
    { label: 'Termos' },
    { label: 'Verificação' },
  ];

  // CPF validation
  const validateCPF = (cpfValue) => {
    const digits = cpfValue.replace(/\D/g, '');
    
    if (digits.length !== 11) return false;
    
    // Check for known invalid CPFs
    if (/^(\d)\1+$/.test(digits)) return false;
    
    // Validate checksum
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.charAt(10))) return false;
    
    return true;
  };

  const handleCPFChange = (value) => {
    setCpf(value);
    setCpfError('');
    setCpfValid(false);
    
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) {
      setCpfValidating(true);
      
      // Simulate CPF validation and data fetch
      setTimeout(() => {
        if (validateCPF(value)) {
          setCpfValid(true);
          // Simulate fetching user data from CPF
          setUserData({
            full_name: 'João Silva Santos',
            date_of_birth: '1990-05-15',
            cpf: value
          });
        } else {
          setCpfError('CPF inválido. Verifique os números digitados.');
        }
        setCpfValidating(false);
      }, 1500);
    }
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return cpfValid && !cpfValidating;
      case 2:
        return validateEmail(email) && validatePassword(password) && phone.replace(/\D/g, '').length >= 10;
      case 3:
        return userData.full_name && userData.date_of_birth;
      case 4:
        return termsAccepted && privacyAccepted && kycPassed;
      case 5:
        return idvCompleted;
      default:
        return false;
    }
  };

  const handleKYCCheck = async () => {
    setLoading(true);
    // Simulate Scope KYC check
    await new Promise(resolve => setTimeout(resolve, 2000));
    setKycPassed(true);
    setLoading(false);
  };

  const handleIDVComplete = (result) => {
    if (result.verified) {
      setIdvCompleted(true);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // In a real app, this would create the account
      // For now, redirect to login
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate(createPageUrl('Home'));
    } catch (err) {
      setError('Erro ao finalizar cadastro. Tente novamente.');
    }
    setLoading(false);
  };

  const nextStep = async () => {
    if (currentStep === 4 && !kycPassed) {
      await handleKYCCheck();
      if (kycPassed) {
        setCurrentStep(prev => Math.min(prev + 1, 5));
      }
    } else if (currentStep === 5 && idvCompleted) {
      await handleComplete();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  useEffect(() => {
    if (currentStep === 4 && termsAccepted && privacyAccepted && !kycPassed) {
      handleKYCCheck();
    }
  }, [termsAccepted, privacyAccepted, currentStep]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <span className="text-black font-black text-lg">5B</span>
          </div>
          <span className="font-bold text-xl">
            <span className="gold-text">5-Bulls</span>
            <span className="text-white/80">Betting</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <StepIndicator 
            currentStep={currentStep} 
            totalSteps={5} 
            steps={steps}
          />

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 rounded-2xl">
            <AnimatePresence mode="wait">
              {/* Step 1: CPF */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Bem-vindo à 5-BullsBetting
                    </h2>
                    <p className="text-white/60">
                      Comece informando seu CPF para criar sua conta
                    </p>
                  </div>

                  <CPFInput
                    value={cpf}
                    onChange={handleCPFChange}
                    error={cpfError}
                    isValidating={cpfValidating}
                    isValid={cpfValid}
                  />

                  <div className="grid grid-cols-3 gap-2 pt-4">
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <Shield className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <span className="text-xs text-white/60">Seguro</span>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <span className="text-xs text-white/60">Rápido</span>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <span className="text-xs text-white/60">Licenciado</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Account Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Crie sua conta
                    </h2>
                    <p className="text-white/60">
                      Preencha seus dados de acesso
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white/80">Celular</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/80">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {password && password.length < 8 && (
                        <p className="text-amber-400 text-xs">A senha deve ter pelo menos 8 caracteres</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Identity Confirmation */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <IdentityConfirmation userData={userData} />
                </motion.div>
              )}

              {/* Step 4: Terms & KYC */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TermsAcceptance
                    termsAccepted={termsAccepted}
                    privacyAccepted={privacyAccepted}
                    setTermsAccepted={setTermsAccepted}
                    setPrivacyAccepted={setPrivacyAccepted}
                  />
                  
                  {loading && (
                    <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        <div>
                          <p className="text-white font-medium">Verificando conformidade...</p>
                          <p className="text-white/60 text-sm">Checando listas de exclusão e PEP</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {kycPassed && (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-white font-medium">Verificação aprovada</p>
                          <p className="text-white/60 text-sm">Você pode prosseguir com o cadastro</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 5: ID Verification */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <IDVerification
                    onComplete={handleIDVComplete}
                    isMobile={isMobile}
                    userData={userData}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed() || loading}
                  className="gold-gradient text-black font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : idvCompleted ? (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="gold-gradient text-black font-semibold hover:opacity-90"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      Começar a Apostar
                      <Trophy className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mt-4">{error}</p>
            )}
          </Card>

          {/* Help */}
          <p className="text-center text-white/40 text-sm mt-6">
            Precisa de ajuda?{' '}
            <button className="text-amber-400 hover:underline">
              Fale conosco
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}