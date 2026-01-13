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
import CountrySelector from '@/components/onboarding/CountrySelector';
import CPFInput from '@/components/onboarding/CPFInput';
import PassportInput from '@/components/onboarding/PassportInput';
import DriverLicenseInput from '@/components/onboarding/DriverLicenseInput';
import SedulaInput from '@/components/onboarding/SedulaInput';
import DocumentTypeSelector from '@/components/onboarding/DocumentTypeSelector';
import IdentityConfirmation from '@/components/onboarding/IdentityConfirmation';
import TermsAcceptance from '@/components/onboarding/TermsAcceptance';
import DataCheckerVerification from '@/components/onboarding/DataCheckerVerification';
import SDKVerification from '@/components/onboarding/SDKVerification';
import { useLanguage } from '@/components/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Onboarding() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Country and document type
  const [selectedCountry, setSelectedCountry] = useState('');
  const [documentType, setDocumentType] = useState('');
  
  // Form data
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [cpfValidating, setCpfValidating] = useState(false);
  const [cpfValid, setCpfValid] = useState(false);
  
  const [passport, setPassport] = useState('');
  const [passportError, setPassportError] = useState('');
  const [passportValidating, setPassportValidating] = useState(false);
  const [passportValid, setPassportValid] = useState(false);
  
  const [driverLicense, setDriverLicense] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [licenseValidating, setLicenseValidating] = useState(false);
  const [licenseValid, setLicenseValid] = useState(false);
  
  const [sedula, setSedula] = useState('');
  const [sedulaError, setSedulaError] = useState('');
  const [sedulaValidating, setSedulaValidating] = useState(false);
  const [sedulaValid, setSedulaValid] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  
  const [userData, setUserData] = useState({});
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const [kycPassed, setKycPassed] = useState(false);
  const [idvCompleted, setIdvCompleted] = useState(false);
  const [verificationTab, setVerificationTab] = useState('sdk'); // 'sdk' or 'link'

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const steps = [
    { label: 'Country' },
    { label: 'Identity' },
    { label: 'Account' },
    { label: 'Confirm' },
    { label: 'Terms' },
    { label: 'Verification' },
  ];

  // Check for verification session in URL (mobile QR code scan)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('verificationSession');
    
    if (sessionId) {
      // Load session data and jump to step 6
      loadSessionData(sessionId);
    }
  }, []);

  const loadSessionData = async (sessionId) => {
    try {
      setLoading(true);
      
      // Fetch the session to get user data
      const sessions = await base44.entities.VerificationSession.filter({
        session_id: sessionId
      });
      
      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        
        // Validate session expiry
        if (session.expires_at && new Date(session.expires_at) < new Date()) {
          throw new Error('Verification session has expired. Please start the registration process again.');
        }
        
        // Check if session is already used
        if (session.status === 'completed' || session.status === 'failed') {
          throw new Error('This verification session has already been used.');
        }
        const sessionUserData = session.user_data;
        
        // Populate form data from session
        setUserData(sessionUserData);
        setFullName(sessionUserData.full_name || '');
        setDateOfBirth(sessionUserData.date_of_birth || '');
        setSelectedCountry(sessionUserData.country || '');
        setEmail(sessionUserData.email || '');
        setPhone(sessionUserData.phone || '');
        
        // Set document data
        if (sessionUserData.country === 'BR') {
          setCpf(sessionUserData.cpf || '');
          setCpfValid(true);
        } else {
          setDocumentType(sessionUserData.id_type || '');
          if (sessionUserData.id_type === 'passport') {
            setPassport(sessionUserData.id_value || '');
            setPassportValid(true);
          } else if (sessionUserData.id_type === 'driver_license') {
            setDriverLicense(sessionUserData.id_value || '');
            setLicenseValid(true);
          } else if (sessionUserData.id_type === 'sedula') {
            setSedula(sessionUserData.id_value || '');
            setSedulaValid(true);
          }
        }
        
        // Mark previous steps as completed
        setKycPassed(true);
        setTermsAccepted(true);
        setPrivacyAccepted(true);
        
        // Jump to verification step
        setCurrentStep(6);
      }
    } catch (err) {
      console.error('❌ Failed to load session:', err);
      setError('Failed to load verification session');
    } finally {
      setLoading(false);
    }
  };

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
      
      setTimeout(() => {
        if (validateCPF(value)) {
          setCpfValid(true);
        } else {
          setCpfError(t('onb_cpf_invalid'));
        }
        setCpfValidating(false);
      }, 500);
    }
  };

  // Passport validation
  const validatePassport = (value, country) => {
    switch (country) {
      case 'AU': // Australian passport: Letter + 7 digits
        return /^[A-Z]\d{7}$/.test(value);
      case 'NL': // Dutch passport: 2 letters + 6 digits + 1 digit
        return /^[A-Z]{2}\d{6}\d$/.test(value);
      case 'CW': // Curacao passport (similar to Dutch)
        return /^[A-Z]{2}\d{6}\d$/.test(value);
      default:
        return value.length >= 6;
    }
  };

  const handlePassportChange = (value) => {
    setPassport(value);
    setPassportError('');
    setPassportValid(false);
    
    if (value.length >= 6) {
      setPassportValidating(true);
      
      setTimeout(() => {
        if (validatePassport(value, selectedCountry)) {
          setPassportValid(true);
        } else {
          setPassportError('Invalid passport number format');
        }
        setPassportValidating(false);
      }, 500);
    }
  };

  // Driver's license validation
  const validateDriverLicense = (value, country) => {
    switch (country) {
      case 'AU': // Australian license: 6-10 digits (varies by state - WA has 7 digits)
        return /^\d{6,10}$/.test(value);
      case 'NL': // Dutch license: 10 digits
        return /^\d{10}$/.test(value);
      default:
        return value.length >= 6;
    }
  };

  const handleDriverLicenseChange = (value) => {
    setDriverLicense(value);
    setLicenseError('');
    setLicenseValid(false);
    
    if (value.length >= 6) {
      setLicenseValidating(true);
      
      setTimeout(() => {
        if (validateDriverLicense(value, selectedCountry)) {
          setLicenseValid(true);
        } else {
          setLicenseError('Invalid driver\'s license format');
        }
        setLicenseValidating(false);
      }, 500);
    }
  };

  // Sedula validation
  const validateSedula = (value) => {
    // Curacao Sedula format validation
    return value.length >= 6 && /^[A-Z0-9]+$/.test(value);
  };

  const handleSedulaChange = (value) => {
    setSedula(value);
    setSedulaError('');
    setSedulaValid(false);
    
    if (value.length >= 6) {
      setSedulaValidating(true);
      
      setTimeout(() => {
        if (validateSedula(value)) {
          setSedulaValid(true);
        } else {
          setSedulaError('Invalid Sédula format');
        }
        setSedulaValidating(false);
      }, 500);
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
      case 1: // Country selection
        return selectedCountry !== '';
      case 2: // Identity documents
        if (selectedCountry === 'BR') {
          return cpfValid && !cpfValidating && fullName.trim() && dateOfBirth;
        } else if (selectedCountry === 'CW') {
          // Curacao needs document type selected
          if (!documentType) return false;
        } else if (selectedCountry === 'AU' || selectedCountry === 'NL') {
          // Australia/Netherlands need document type selected
          if (!documentType) return false;
        }
        
        // Check specific document validity
        let docValid = false;
        if (documentType === 'passport') {
          docValid = passportValid && !passportValidating;
        } else if (documentType === 'driver_license') {
          docValid = licenseValid && !licenseValidating;
        } else if (documentType === 'sedula') {
          docValid = sedulaValid && !sedulaValidating;
        }
        
        return docValid && fullName.trim() && dateOfBirth;
      case 3: // Account details
        return validateEmail(email) && validatePassword(password) && phone.replace(/\D/g, '').length >= 10;
      case 4: // Confirmation
        return true;
      case 5: // Terms
        return termsAccepted && privacyAccepted && kycPassed;
      case 6: // Verification
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

  const handleIDVComplete = async (result) => {
    if (result.verified) {
      setLoading(true);
      try {
        // Create account only after successful verification
        await base44.auth.signUp({
          email,
          password,
          full_name: userData.full_name,
          cpf: userData.cpf,
          phone: phone,
          date_of_birth: userData.date_of_birth,
          kyc_verified: true,
          verification_date: new Date().toISOString()
        });

        // Login automatically after registration
        await base44.auth.signIn({ email, password });
        
        // Store verification logs
        const user = await base44.auth.me();
        
        // Log ID verification
        await base44.entities.VerificationLog.create({
          user_id: user.id,
          verification_type: 'id_document',
          provider: 'datachecker',
          reference_id: result.idTransactionId || result.transactionId,
          status: 'passed',
          result_details: result.idResult || result.result
        });

        // Log face verification if SDK mode
        if (result.faceTransactionId) {
          await base44.entities.VerificationLog.create({
            user_id: user.id,
            verification_type: 'facial_recognition',
            provider: 'datachecker',
            reference_id: result.faceTransactionId,
            status: 'passed',
            result_details: result.faceResult
          });
        }

        setIdvCompleted(true);
      } catch (err) {
        setError(err.message || 'Failed to create account after verification');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Account was already created, just redirect to home
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate(createPageUrl('Home'));
    } catch (err) {
      setError(t('onb_error_complete'));
    }
    setLoading(false);
  };

  const nextStep = async () => {
    if (currentStep === 2) {
      // Set userData when moving from step 2 (identity)
      let idValue = '';
      let idType = '';
      
      if (selectedCountry === 'BR') {
        idValue = cpf;
        idType = 'cpf';
      } else if (documentType === 'passport') {
        idValue = passport;
        idType = 'passport';
      } else if (documentType === 'driver_license') {
        idValue = driverLicense;
        idType = 'driver_license';
      } else if (documentType === 'sedula') {
        idValue = sedula;
        idType = 'sedula';
      }
      
      setUserData({
        full_name: fullName,
        date_of_birth: dateOfBirth,
        country: selectedCountry,
        id_type: idType,
        id_value: idValue,
        cpf: selectedCountry === 'BR' ? cpf : undefined
      });
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else if (currentStep === 5 && !kycPassed) {
      await handleKYCCheck();
      if (kycPassed) {
        setCurrentStep(prev => Math.min(prev + 1, 6));
      }
    } else if (currentStep === 6 && idvCompleted) {
      await handleComplete();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  useEffect(() => {
    if (currentStep === 5 && termsAccepted && privacyAccepted && !kycPassed) {
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
            totalSteps={6} 
            steps={steps}
          />

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 rounded-2xl">
            <AnimatePresence mode="wait">
              {/* Step 1: Country Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CountrySelector
                    selectedCountry={selectedCountry}
                    onSelect={setSelectedCountry}
                  />
                </motion.div>
              )}

              {/* Step 2: Identity Documents */}
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
                      Identity Verification
                    </h2>
                    <p className="text-white/60">
                      Provide your identification details
                    </p>
                  </div>

                  {/* Show document type selector for non-Brazil countries */}
                  {selectedCountry !== 'BR' && (
                    <DocumentTypeSelector
                      country={selectedCountry}
                      selectedType={documentType}
                      onSelect={setDocumentType}
                    />
                  )}

                  {/* Brazil - CPF */}
                  {selectedCountry === 'BR' && (
                    <CPFInput
                      value={cpf}
                      onChange={handleCPFChange}
                      error={cpfError}
                      isValidating={cpfValidating}
                      isValid={cpfValid}
                    />
                  )}

                  {/* Passport */}
                  {documentType === 'passport' && (
                    <PassportInput
                      value={passport}
                      onChange={handlePassportChange}
                      error={passportError}
                      isValidating={passportValidating}
                      isValid={passportValid}
                      country={selectedCountry}
                    />
                  )}

                  {/* Driver's License */}
                  {documentType === 'driver_license' && (
                    <DriverLicenseInput
                      value={driverLicense}
                      onChange={handleDriverLicenseChange}
                      error={licenseError}
                      isValidating={licenseValidating}
                      isValid={licenseValid}
                      country={selectedCountry}
                    />
                  )}

                  {/* Sédula */}
                  {documentType === 'sedula' && (
                    <SedulaInput
                      value={sedula}
                      onChange={handleSedulaChange}
                      error={sedulaError}
                      isValidating={sedulaValidating}
                      isValid={sedulaValid}
                    />
                  )}

                  {/* Name and Date of Birth */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white/80">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-white/80">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="h-12 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Account Details */}
              {currentStep === 3 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {t('onb_create_account')}
                    </h2>
                    <p className="text-white/60">
                      {t('onb_fill_details')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">{t('onb_email')}</Label>
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
                      <Label htmlFor="phone" className="text-white/80">{t('onb_phone')}</Label>
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
                      <Label htmlFor="password" className="text-white/80">{t('onb_password')}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('onb_password_placeholder')}
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
                        <p className="text-amber-400 text-xs">{t('onb_password_hint')}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Identity Confirmation */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <IdentityConfirmation userData={userData} />
                </motion.div>
              )}

              {/* Step 5: Terms & KYC */}
              {currentStep === 5 && (
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
                          <p className="text-white font-medium">{t('onb_verifying_compliance')}</p>
                          <p className="text-white/60 text-sm">{t('onb_checking_lists')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {kycPassed && (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-white font-medium">{t('onb_verification_approved')}</p>
                          <p className="text-white/60 text-sm">{t('onb_can_proceed')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 6: ID Verification */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Identity Verification
                    </h2>
                    <p className="text-white/60">
                      Choose your preferred verification method
                    </p>
                  </div>

                  <Tabs value={verificationTab} onValueChange={setVerificationTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
                      <TabsTrigger value="sdk" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                        SDK Verification
                      </TabsTrigger>
                      <TabsTrigger value="link" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                        Link Verification
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="sdk" className="mt-0">
                      <SDKVerification
                        onComplete={handleIDVComplete}
                        isMobile={isMobile}
                        userData={{ ...userData, email, phone }}
                      />
                    </TabsContent>
                    
                    <TabsContent value="link" className="mt-0">
                      <DataCheckerVerification
                        onComplete={handleIDVComplete}
                        isMobile={isMobile}
                        userData={{ ...userData, email, phone }}
                      />
                    </TabsContent>
                  </Tabs>
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
                {t('onb_back')}
              </Button>

              {currentStep < 6 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed() || loading}
                  className="gold-gradient text-black font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      {t('onb_continue')}
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
                      {t('onb_start_betting')}
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
            {t('onb_need_help')}{' '}
            <button className="text-amber-400 hover:underline">
              {t('onb_contact_us')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}