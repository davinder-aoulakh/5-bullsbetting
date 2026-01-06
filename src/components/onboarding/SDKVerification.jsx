import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Camera, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';

export default function SDKVerification({ onComplete, userData, isMobile }) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState('init'); // init, id_capture, id_processing, face_capture, face_processing, verifying, success, failed
  const [error, setError] = useState('');
  const [idTransactionId, setIdTransactionId] = useState(null);
  const [faceTransactionId, setFaceTransactionId] = useState(null);
  const [idImages, setIdImages] = useState([]);
  const [faceImages, setFaceImages] = useState([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const acContainerRef = useRef(null);
  const fvContainerRef = useRef(null);
  const acInstanceRef = useRef(null);
  const fvInstanceRef = useRef(null);

  // Load DataChecker SDKs from CDN
  useEffect(() => {
    const loadSDKs = async () => {
      try {
        // Load AutoCapture SDK
        if (!window.AutoCapture) {
          const acScript = document.createElement('script');
          acScript.src = 'https://cdn.jsdelivr.net/npm/@datachecker/autocapture@latest/dist/autocapture.min.js';
          acScript.async = true;
          document.head.appendChild(acScript);
          
          await new Promise((resolve, reject) => {
            acScript.onload = resolve;
            acScript.onerror = reject;
          });
        }

        // Load FaceVerify SDK
        if (!window.FaceVerify) {
          const fvScript = document.createElement('script');
          fvScript.src = 'https://cdn.jsdelivr.net/npm/@datachecker/faceverify@latest/dist/faceverify.min.js';
          fvScript.async = true;
          document.head.appendChild(fvScript);
          
          await new Promise((resolve, reject) => {
            fvScript.onload = resolve;
            fvScript.onerror = reject;
          });
        }

        console.log('✅ DataChecker SDKs loaded');
        setSdkLoaded(true);
      } catch (err) {
        console.error('❌ Failed to load SDKs:', err);
        setError('Failed to load verification tools. Please refresh and try again.');
        setStep('failed');
      }
    };

    loadSDKs();
  }, []);

  // Portuguese translations for SDK
  const getSDKTranslations = () => {
    if (language === 'pt') {
      return JSON.stringify({
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
        face_not_detected: 'Rosto não detectado',
        move_closer: 'Aproxime-se',
        look_straight: 'Olhe para frente',
        follow_instructions: 'Siga as instruções'
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
      const tokenResponse = await base44.functions.invoke('datacheckerGetSDKToken', {
        services: 'AUTO_CAPTURE',
        customerReference: `5bulls_${userData.country}_${userData.cpf}_${Date.now()}`
      });

      if (tokenResponse.data.error) {
        throw new Error(tokenResponse.data.error);
      }

      const { token, transactionId } = tokenResponse.data;
      setIdTransactionId(transactionId);

      console.log('🎫 Got AutoCapture SDK token, transactionId:', transactionId);

      // Initialize AutoCapture
      const AC = new window.AutoCapture();
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
          IDENTITY_CARD: { requireFlip: true },
          PASSPORT: { requireFlip: false },
          DRIVING_LICENSE: { requireFlip: true }
        }
      });

    } catch (err) {
      console.error('❌ Failed to start ID capture:', err);
      setError(err.message || 'Failed to initialize document scanner');
      setStep('failed');
    }
  };

  const handleIDCaptureComplete = async (data) => {
    try {
      console.log('✅ ID capture completed:', data);
      setStep('id_processing');

      // Extract images from data
      const images = data.images.map(img => ({
        data: img.data.split(',')[1] || img.data, // Remove data URL prefix if present
        type: img.type || 'IDENTITY_CARD'
      }));

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
      const tokenResponse = await base44.functions.invoke('datacheckerGetSDKToken', {
        services: 'FACE_VERIFY',
        customerReference: `5bulls_${userData.country}_${userData.cpf}_${Date.now()}`,
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
      const FV = new window.FaceVerify();
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
      setError(err.message || 'Failed to initialize face verification');
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
      
      // The SDK should have captured live images
      // If data contains images, use them; otherwise we rely on SDK's internal upload
      const images = [
        {
          type: 'COMPARE',
          data: compareImage.data
        }
      ];

      // If SDK provides captured images, add them as LIVE
      if (data.images && data.images.length > 0) {
        data.images.forEach(img => {
          images.push({
            type: 'LIVE',
            data: img.data.split(',')[1] || img.data
          });
        });
      }

      setFaceImages(images);

      // Submit face verification with compare image
      const submitResponse = await base44.functions.invoke('datacheckerSubmitFaceVerify', {
        transactionId: faceTransactionId,
        images
      });

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

      if (idApproved && faceApproved) {
        setStep('success');
        setTimeout(() => {
          onComplete({
            verified: true,
            idTransactionId,
            faceTransactionId,
            idResult: idResult.data,
            faceResult: faceResult.data
          });
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

  // Auto-start verification when SDKs are loaded
  useEffect(() => {
    if (sdkLoaded && step === 'init') {
      startIDCapture();
    }
  }, [sdkLoaded, step]);

  if (!sdkLoaded || step === 'init') {
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
        {retryCount < 3 && (
          <Button onClick={handleRetry} className="gold-gradient text-black">
            {language === 'pt' ? 'Tentar Novamente' : 'Try Again'}
          </Button>
        )}
        {retryCount >= 3 && (
          <p className="text-white/40 text-sm mt-4">
            {language === 'pt' 
              ? 'Muitas tentativas. Entre em contato com o suporte.' 
              : 'Too many attempts. Please contact support.'}
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

  return null;
}