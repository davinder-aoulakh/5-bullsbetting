import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Camera, AlertCircle, Smartphone, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';
import AutoCapture from '@datachecker/autocapture';
import FaceVerify from '@datachecker/faceverify';
import QRCodeLib from 'qrcode';

export default function SDKVerification({ onComplete, userData, isMobile }) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState('init'); // init, qr_display (desktop), id_capture, id_processing, face_capture, face_processing, verifying, success, failed
  const [error, setError] = useState('');
  const [idTransactionId, setIdTransactionId] = useState(null);
  const [faceTransactionId, setFaceTransactionId] = useState(null);
  const [idImages, setIdImages] = useState([]);
  const [faceImages, setFaceImages] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [verificationUrl, setVerificationUrl] = useState(null);
  
  const acContainerRef = useRef(null);
  const fvContainerRef = useRef(null);
  const acInstanceRef = useRef(null);
  const fvInstanceRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Portuguese translations for SDK
  const getSDKTranslations = () => {
    if (language === 'pt') {
      return JSON.stringify({
        // AutoCapture translations
        capture_error: 'Não foi possível capturar a imagem. Permita acesso à câmera.',
        confirm: 'Confirmar',
        retry: 'Tentar novamente',
        environment_too_dark: 'Ambiente muito escuro',
        not_all_corners_detected: 'Posicione todo o documento na tela',
        document_too_far: 'Aproxime o documento',
        document_too_close: 'Afaste o documento',
        hold_steady: 'Mantenha firme',
        capturing: 'Capturando...',
        flip_document: 'Vire o documento',
        // FaceVerify translations
        face_not_detected: 'Rosto não detectado',
        move_closer: 'Aproxime-se',
        look_straight: 'Olhe para frente',
        follow_instructions: 'Siga as instruções',
        start_prompt: 'Toque para começar',
        no_face: 'Nenhum rosto detectado',
        face_thresh: 'Rosto coberto',
        face_far: 'Aproxime-se',
        face_close: 'Afaste-se',
        exp_dark: 'Imagem muito escura',
        blur: 'Mantenha firme',
        challenge_0: 'Centralize seu rosto',
        challenge_out: 'Rosto muito longe',
        challenge_1: 'Olhe para cima',
        challenge_2: 'Olhe para direita',
        challenge_3: 'Olhe para baixo',
        challenge_4: 'Olhe para esquerda',
        tutorial: 'Siga as instruções',
        continue: 'Continuar'
      });
    }
    return 'en';
  };

  // Start ID document capture
  const startIDCapture = async () => {
    try {
      setStep('id_capture');
      setError('');

      // Get SDK token for AutoCapture
      // Use CPF for Brazil, otherwise use the ID value (passport, license, sedula)
      const docIdentifier = userData.cpf || userData.id_value || 'unknown';
      const tokenResponse = await base44.functions.invoke('datacheckerGetSDKToken', {
        services: 'AUTO_CAPTURE',
        customerReference: `5bulls_${userData.country}_${docIdentifier}_${Date.now()}`
      });

      if (tokenResponse.data.error) {
        throw new Error(tokenResponse.data.error);
      }

      const { token, transactionId } = tokenResponse.data;
      setIdTransactionId(transactionId);

      console.log('🎫 Got AutoCapture SDK token, transactionId:', transactionId);

      // Initialize AutoCapture
      const AC = new AutoCapture();
      acInstanceRef.current = AC;

      AC.init({
        CONTAINER_ID: 'ac-mount',
        LANGUAGE: getSDKTranslations(),
        TOKEN: token,
        onComplete: handleIDCaptureComplete,
        onError: handleIDCaptureError,
        onUserExit: handleIDCaptureExit,
        DEBUG: false,
        DESKTOP_MODE: !isMobile,
        APPROVAL: true, // Show approval screen
        ALLOWED_DOCUMENTS: {
          IDENTITY_CARD: ['FRONT', 'BACK'],
          PASSPORT: ['FRONT'],
          DRIVING_LICENSE: ['FRONT', 'BACK']
        }
      });

    } catch (err) {
      console.error('❌ Failed to start ID capture:', err);
      const friendlyError = err.message?.includes('credentials') 
        ? 'Verification service is temporarily unavailable. Please try again later.'
        : err.message || 'Failed to initialize document scanner. Please check camera permissions.';
      setError(friendlyError);
      setStep('failed');
    }
  };

  const handleIDCaptureComplete = async (data) => {
    try {
      console.log('✅ ID capture completed:', data);
      setStep('id_processing');

      // Extract images from data - AutoCapture returns data.image (array of base64 strings)
      const images = data.image.map((base64String, index) => {
        // Remove data URL prefix if present
        const base64Data = base64String.includes(',') 
          ? base64String.split(',')[1] 
          : base64String;

        return {
          data: base64Data,
          type: data.meta?.[index]?.force_capture ? 'FORCED' : 'IDENTITY_CARD'
        };
      });

      setIdImages(images);

      // Clean up AutoCapture instance
      if (acInstanceRef.current) {
        acInstanceRef.current.remove();
        acInstanceRef.current = null;
      }

      // Submit images to DataChecker
      const submitResponse = await base44.functions.invoke('datacheckerSubmitIDVerify', {
        transactionId: idTransactionId,
        images
      });

      if (submitResponse.data.error) {
        throw new Error(submitResponse.data.error);
      }

      console.log('✅ ID images submitted successfully');

      // Move to face capture
      setTimeout(() => startFaceCapture(), 1000);

    } catch (err) {
      console.error('❌ ID processing error:', err);
      setError(err.message || 'Failed to process document');
      setStep('failed');
    }
  };

  const handleIDCaptureError = (err) => {
    console.error('❌ ID capture error:', err);
    
    if (acInstanceRef.current) {
      acInstanceRef.current.remove();
      acInstanceRef.current = null;
    }

    let errorMessage = 'Failed to capture document';
    if (err.code === 'CameraAccessDenied') {
      errorMessage = language === 'pt' 
        ? 'Acesso à câmera negado. Por favor, permita o acesso à câmera.' 
        : 'Camera access denied. Please allow camera access.';
    }

    setError(errorMessage);
    setStep('failed');
  };

  const handleIDCaptureExit = () => {
    console.log('⚠️ User exited ID capture');
    
    if (acInstanceRef.current) {
      acInstanceRef.current.remove();
      acInstanceRef.current = null;
    }

    setError(language === 'pt' ? 'Captura cancelada' : 'Capture cancelled');
    setStep('failed');
  };

  // Start face capture
  const startFaceCapture = async () => {
    try {
      setStep('face_capture');
      setError('');

      // Get SDK token for FaceVerify
      // Use CPF for Brazil, otherwise use the ID value (passport, license, sedula)
      const docIdentifier = userData.cpf || userData.id_value || 'unknown';
      const tokenResponse = await base44.functions.invoke('datacheckerGetSDKToken', {
        services: 'FACE_VERIFY',
        customerReference: `5bulls_${userData.country}_${docIdentifier}_${Date.now()}`,
        numberOfChallenges: 2,
        validateWatermark: true
      });

      if (tokenResponse.data.error) {
        throw new Error(tokenResponse.data.error);
      }

      const { token, transactionId } = tokenResponse.data;
      setFaceTransactionId(transactionId);

      console.log('🎫 Got FaceVerify SDK token, transactionId:', transactionId);

      // Initialize FaceVerify
      const FV = new FaceVerify();
      fvInstanceRef.current = FV;

      await FV.init({
        CONTAINER_ID: 'fv-mount',
        LANGUAGE: getSDKTranslations(),
        TOKEN: token,
        onComplete: handleFaceCaptureComplete,
        onError: handleFaceCaptureError,
        onUserExit: handleFaceCaptureExit,
        DEBUG: false,
        DESKTOP_MODE: !isMobile
      });

      // Start the face capture
      FV.start();

    } catch (err) {
      console.error('❌ Failed to start face capture:', err);
      const friendlyError = err.message?.includes('credentials')
        ? 'Verification service is temporarily unavailable. Please try again later.'
        : err.message || 'Failed to initialize face verification. Please check camera permissions.';
      setError(friendlyError);
      setStep('failed');
    }
  };

  const handleFaceCaptureComplete = async (data) => {
    try {
      console.log('✅ Face capture completed:', data);
      setStep('face_processing');

      // Clean up FaceVerify instance
      if (fvInstanceRef.current) {
        fvInstanceRef.current.stop();
        fvInstanceRef.current = null;
      }

      // For face verification, we need to submit COMPARE + LIVE images
      // Use the first ID image as COMPARE (ideally the front with face)
      const compareImage = idImages[0];

      // FaceVerify SDK returns data.images (array of captured face images)
      const images = [
        {
          type: 'COMPARE',
          data: compareImage.data
        }
      ];

      // Add captured live images from FaceVerify
      if (data.images && data.images.length > 0) {
        data.images.forEach(img => {
          const base64Data = typeof img === 'string' 
            ? (img.includes(',') ? img.split(',')[1] : img)
            : (img.data?.split(',')[1] || img.data);

          images.push({
            type: 'LIVE',
            data: base64Data
          });
        });
      }

      setFaceImages(images);

      // Submit face verification with compare image and valid_challenges if available
      const submitPayload = {
        transactionId: faceTransactionId,
        images
      };

      if (data.valid_challenges !== undefined) {
        submitPayload.valid_challenges = data.valid_challenges;
      }

      const submitResponse = await base44.functions.invoke('datacheckerSubmitFaceVerify', submitPayload);

      if (submitResponse.data.error) {
        throw new Error(submitResponse.data.error);
      }

      console.log('✅ Face images submitted successfully');

      // Now poll for both results
      pollForResults();

    } catch (err) {
      console.error('❌ Face processing error:', err);
      setError(err.message || 'Failed to process face verification');
      setStep('failed');
    }
  };

  const handleFaceCaptureError = (err) => {
    console.error('❌ Face capture error:', err);
    
    if (fvInstanceRef.current) {
      fvInstanceRef.current.stop();
      fvInstanceRef.current = null;
    }

    let errorMessage = 'Failed to capture face';
    if (err.code === 'CameraAccessDenied') {
      errorMessage = language === 'pt' 
        ? 'Acesso à câmera negado. Por favor, permita o acesso à câmera.' 
        : 'Camera access denied. Please allow camera access.';
    }

    setError(errorMessage);
    setStep('failed');
  };

  const handleFaceCaptureExit = () => {
    console.log('⚠️ User exited face capture');
    
    if (fvInstanceRef.current) {
      fvInstanceRef.current.stop();
      fvInstanceRef.current = null;
    }

    setError(language === 'pt' ? 'Captura cancelada' : 'Capture cancelled');
    setStep('failed');
  };

  // Poll for verification results
  const pollForResults = async () => {
    setStep('verifying');
    
    let idResultId = null;
    let faceResultId = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)

    const pollInterval = setInterval(async () => {
      try {
        attempts++;

        // Poll for ID result if not yet obtained
        if (!idResultId && idTransactionId) {
          const idPoll = await base44.functions.invoke('datacheckerPoll', {
            transactionId: idTransactionId
          });

          if (idPoll.data.completed && idPoll.data.results?.length > 0) {
            idResultId = idPoll.data.results[0].resultId;
            console.log('✅ ID verification completed, resultId:', idResultId);
          }
        }

        // Poll for face result if not yet obtained
        if (!faceResultId && faceTransactionId) {
          const facePoll = await base44.functions.invoke('datacheckerPoll', {
            transactionId: faceTransactionId
          });

          if (facePoll.data.completed && facePoll.data.results?.length > 0) {
            faceResultId = facePoll.data.results[0].resultId;
            console.log('✅ Face verification completed, resultId:', faceResultId);
          }
        }

        // If both results are ready, fetch and process them
        if (idResultId && faceResultId) {
          clearInterval(pollInterval);
          await processResults(idResultId, faceResultId);
        }

        // Timeout after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          throw new Error('Verification timeout - please try again');
        }

      } catch (err) {
        clearInterval(pollInterval);
        console.error('❌ Polling error:', err);
        setError(err.message || 'Failed to verify identity');
        setStep('failed');
      }
    }, 5000);
  };

  const processResults = async (idResultId, faceResultId) => {
    try {
      // Fetch ID result
      const idResult = await base44.functions.invoke('datacheckerGetResult', {
        resultId: idResultId
      });

      // Fetch face result
      const faceResult = await base44.functions.invoke('datacheckerGetResult', {
        resultId: faceResultId
      });

      console.log('📋 ID Result:', idResult.data);
      console.log('📋 Face Result:', faceResult.data);

      const idApproved = idResult.data.approved;
      const faceApproved = faceResult.data.approved;

      const resultData = {
        verified: idApproved && faceApproved,
        idTransactionId,
        faceTransactionId,
        idResult: idResult.data,
        faceResult: faceResult.data
      };

      // If this is a session-based verification, update the session
      if (sessionId) {
        try {
          const sessions = await base44.entities.VerificationSession.filter({
            session_id: sessionId
          });
          
          if (sessions && sessions.length > 0) {
            await base44.entities.VerificationSession.update(sessions[0].id, {
              status: idApproved && faceApproved ? 'completed' : 'failed',
              result: resultData
            });
          }
        } catch (err) {
          console.error('❌ Failed to update session:', err);
        }
      }

      if (idApproved && faceApproved) {
        setStep('success');
        setTimeout(() => {
          onComplete(resultData);
        }, 2000);
      } else {
        setStep('failed');
        setError(
          !idApproved 
            ? (language === 'pt' ? 'Documento não aprovado' : 'Document not approved')
            : (language === 'pt' ? 'Verificação facial não aprovada' : 'Face verification not approved')
        );
      }

    } catch (err) {
      console.error('❌ Error processing results:', err);
      setError(err.message || 'Failed to retrieve verification results');
      setStep('failed');
    }
  };

  const handleRetry = () => {
    setError('');
    setRetryCount(prev => prev + 1);
    setStep('init');
    setIdTransactionId(null);
    setFaceTransactionId(null);
    setIdImages([]);
    setFaceImages([]);
  };

  // Create verification session for desktop (QR code flow)
  const createVerificationSession = async () => {
    try {
      const sessionData = {
        session_id: `sdk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_data: userData,
        verification_mode: 'sdk',
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min expiry
      };

      await base44.entities.VerificationSession.create(sessionData);
      setSessionId(sessionData.session_id);

      // Create verification URL for mobile
      const baseUrl = window.location.origin;
      const url = `${baseUrl}${window.location.pathname}?verificationSession=${sessionData.session_id}`;
      setVerificationUrl(url);

      // Generate QR code locally using qrcode library
      const qrDataUrl = await QRCodeLib.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);

      setStep('qr_display');
      
      // Start polling for session completion
      startSessionPolling(sessionData.session_id);

    } catch (err) {
      console.error('❌ Failed to create verification session:', err);
      setError('Failed to create verification session. Please refresh and try again.');
      setStep('failed');
    }
  };

  // Start verification for QR code scan (userData already loaded by parent)
  const startQRVerification = async (sessionIdParam) => {
    try {
      console.log('📱 Starting QR code verification with session:', sessionIdParam);
      console.log('📋 Using userData from parent:', userData);
      
      // Validate that we have the required userData
      if (!userData || !userData.country || !userData.full_name) {
        throw new Error('Session data not loaded properly. Please scan the QR code again.');
      }
      
      // Update session status to in_progress
      try {
        const sessions = await base44.entities.VerificationSession.filter({
          session_id: sessionIdParam
        });
        
        if (sessions && sessions.length > 0) {
          await base44.entities.VerificationSession.update(sessions[0].id, {
            status: 'in_progress'
          });
        }
      } catch (sessionError) {
        console.warn('⚠️ Could not update session status:', sessionError);
        // Continue anyway as this is not critical
      }

      // Start verification with userData from parent
      console.log('🎬 Starting ID capture with userData:', userData);
      await startIDCapture();
    } catch (err) {
      console.error('❌ Failed to start QR verification:', err);
      setError(err.message || 'Failed to start verification. Please scan the QR code again.');
      setStep('failed');
    }
  };

  // Poll for session completion (desktop flow)
  const startSessionPolling = (sessionIdParam) => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes

    pollIntervalRef.current = setInterval(async () => {
      try {
        attempts++;

        const sessions = await base44.entities.VerificationSession.filter({
          session_id: sessionIdParam
        });

        if (sessions && sessions.length > 0) {
          const session = sessions[0];

          if (session.status === 'completed') {
            clearInterval(pollIntervalRef.current);
            setStep('success');
            
            setTimeout(() => {
              onComplete(session.result || { verified: true });
            }, 2000);
          } else if (session.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setStep('failed');
            setError('Verification failed on mobile device');
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollIntervalRef.current);
          setError('Verification timeout - session expired');
          setStep('failed');
        }
      } catch (err) {
        console.error('❌ Session polling error:', err);
      }
    }, 5000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Auto-start verification when component mounts
  useEffect(() => {
    console.log('🚀 Starting verification flow...', { step, isMobile, userData });
    
    if (step === 'init') {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionIdFromUrl = urlParams.get('verificationSession');
      
      if (sessionIdFromUrl) {
        // Mobile QR code scan - userData already loaded by Onboarding page
        console.log('📱 QR code scan detected - userData already loaded by parent');
        setSessionId(sessionIdFromUrl);
        startQRVerification(sessionIdFromUrl);
      } else if (!isMobile) {
        // Desktop - create QR code
        console.log('💻 Desktop detected - creating QR code session');
        createVerificationSession();
      } else {
        // Direct mobile access (no QR code)
        console.log('📱 Direct mobile access - starting camera capture');
        startIDCapture();
      }
    }
  }, [step, isMobile]);

  if (step === 'init') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">
          {language === 'pt' ? 'Preparando verificação...' : 'Preparing verification...'}
        </p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">
          {language === 'pt' ? 'Verificação Completa!' : 'Verification Complete!'}
        </h3>
        <p className="text-white/60">
          {language === 'pt' 
            ? 'Sua identidade foi verificada com sucesso.' 
            : 'Your identity has been successfully verified.'}
        </p>
      </motion.div>
    );
  }

  if (step === 'failed') {
    const isSDKLoadError = error && (
      error.includes('SDK') || 
      error.includes('unavailable') || 
      error.includes('não disponíveis')
    );
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">
          {language === 'pt' ? 'Verificação Falhou' : 'Verification Failed'}
        </h3>
        <p className="text-white/60 mb-4">{error}</p>
        

        
        {!isSDKLoadError && retryCount < 3 && (
          <Button onClick={handleRetry} className="gold-gradient text-black">
            {language === 'pt' ? 'Tentar Novamente' : 'Try Again'}
          </Button>
        )}
        
        {retryCount >= 3 && (
          <p className="text-white/40 text-sm mt-4">
            {language === 'pt' 
              ? 'Muitas tentativas. Use o "Modo Link" ou contate o suporte.' 
              : 'Too many attempts. Use "Link Mode" or contact support.'}
          </p>
        )}
      </motion.div>
    );
  }

  if (step === 'id_capture') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <Camera className="w-12 h-12 text-amber-400 mx-auto mb-2" />
          <h3 className="text-xl font-bold text-white mb-1">
            {language === 'pt' ? 'Escaneie seu Documento' : 'Scan Your Document'}
          </h3>
          <p className="text-white/60 text-sm">
            {language === 'pt' 
              ? 'Posicione seu documento dentro do quadro. A captura será automática.' 
              : 'Position your document within the frame. Capture will be automatic.'}
          </p>
        </div>
        <div 
          id="ac-mount" 
          ref={acContainerRef}
          className="rounded-xl overflow-hidden"
          style={{ maxWidth: '500px', margin: '0 auto' }}
        />
      </div>
    );
  }

  if (step === 'id_processing') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">
          {language === 'pt' ? 'Processando documento...' : 'Processing document...'}
        </p>
      </div>
    );
  }

  if (step === 'face_capture') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <Camera className="w-12 h-12 text-amber-400 mx-auto mb-2" />
          <h3 className="text-xl font-bold text-white mb-1">
            {language === 'pt' ? 'Verificação Facial' : 'Face Verification'}
          </h3>
          <p className="text-white/60 text-sm">
            {language === 'pt' 
              ? 'Siga as instruções na tela e mova sua cabeça conforme solicitado.' 
              : 'Follow the on-screen instructions and move your head as requested.'}
          </p>
        </div>
        <div 
          id="fv-mount" 
          ref={fvContainerRef}
          className="rounded-xl overflow-hidden"
          style={{ maxWidth: '500px', margin: '0 auto' }}
        />
      </div>
    );
  }

  if (step === 'face_processing' || step === 'verifying') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">
          {language === 'pt' ? 'Verificando sua identidade...' : 'Verifying your identity...'}
        </p>
        <p className="text-white/40 text-sm mt-2">
          {language === 'pt' ? 'Isso pode levar alguns segundos' : 'This may take a few seconds'}
        </p>
      </div>
    );
  }

  // Desktop QR Code display
  if (step === 'qr_display') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-6"
      >
        <div className="mb-6">
          <Smartphone className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {language === 'pt' ? 'Escaneie com seu Celular' : 'Scan with Your Phone'}
          </h3>
          <p className="text-white/60">
            {language === 'pt' 
              ? 'Use a câmera do seu celular para escanear o código QR e continuar a verificação.' 
              : 'Use your phone camera to scan the QR code and continue verification.'}
          </p>
        </div>

        {/* QR Code */}
        {qrCodeUrl ? (
          <div className="bg-white p-6 rounded-xl mx-auto inline-block">
            <img
              src={qrCodeUrl}
              alt="QR Code for verification"
              className="w-64 h-64"
            />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl mx-auto inline-block w-64 h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-amber-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">
            {language === 'pt' 
              ? 'Aguardando verificação no celular...' 
              : 'Waiting for verification on phone...'}
          </span>
        </div>

        <div className="text-white/40 text-sm space-y-2">
          <p>
            {language === 'pt' 
              ? 'Não consegue escanear?' 
              : "Can't scan?"}
          </p>
          <button 
            onClick={() => {
              if (verificationUrl) {
                navigator.clipboard.writeText(verificationUrl);
                alert(language === 'pt' ? 'Link copiado!' : 'Link copied!');
              }
            }}
            className="text-amber-400 hover:underline"
          >
            {language === 'pt' ? 'Copiar link de verificação' : 'Copy verification link'}
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}