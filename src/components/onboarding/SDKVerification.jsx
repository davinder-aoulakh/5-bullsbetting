import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';
import AutoCapture from '@datachecker/autocapture';
import FaceVerify from '@datachecker/faceverify';

export default function SDKVerification({ onComplete, userData, isMobile }) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState('init'); // init, id_capture, id_processing, id_polling, face_capture, face_processing, face_polling, success, failed
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Use refs to avoid race conditions
  const customerReferenceRef = useRef(null);
  const idTxRef = useRef(null);
  const faceTxRef = useRef(null);
  const compareImageRef = useRef(null);
  const acInstanceRef = useRef(null);
  const fvInstanceRef = useRef(null);
  const pollTimeoutRef = useRef(null);

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

  // Generate stable customerReference once at start
  const initializeCustomerReference = () => {
    if (!customerReferenceRef.current) {
      const docIdentifier = userData.cpf || userData.id_value || 'unknown';
      const sessionId = Date.now();
      customerReferenceRef.current = `5bulls_${userData.country}_${docIdentifier}_${sessionId}`;
      console.log('🔑 Generated stable customerReference:', customerReferenceRef.current);
    }
  };

  // Start ID document capture
  const startIDCapture = async () => {
    try {
      console.log('🚀 Starting ID capture...');
      initializeCustomerReference();
      setStep('id_capture');
      setError('');

      // Get SDK token for AutoCapture
      const tokenResponse = await base44.functions.invoke('datacheckerGetSDKToken', {
        services: 'AUTO_CAPTURE',
        customerReference: customerReferenceRef.current
      });

      if (tokenResponse.data.error) {
        throw new Error(tokenResponse.data.error);
      }

      const { token, transactionId } = tokenResponse.data;
      idTxRef.current = transactionId;
      console.log('✅ Got AutoCapture SDK token, transactionId:', transactionId);

      // Initialize AutoCapture
      const AC = new AutoCapture();
      acInstanceRef.current = AC;

      // Don't use DESKTOP_MODE in production
      const isDevMode = window.location.hostname === 'localhost' || window.location.hostname.includes('staging');
      
      AC.init({
        CONTAINER_ID: 'ac-mount',
        LANGUAGE: getSDKTranslations(),
        TOKEN: token,
        onComplete: handleIDCaptureComplete,
        onError: handleIDCaptureError,
        onUserExit: handleIDCaptureExit,
        DEBUG: false,
        DESKTOP_MODE: isDevMode && !isMobile,
        APPROVAL: true,
        ALLOWED_DOCUMENTS: {
          IDENTITY_CARD: ['FRONT', 'BACK'],
          PASSPORT: ['FRONT'],
          DRIVING_LICENSE: ['FRONT', 'BACK']
        }
      });

    } catch (err) {
      console.error('❌ Failed to start ID capture:', err.message);
      setError(err.message || 'Failed to initialize document scanner');
      setStep('failed');
    }
  };

  const handleIDCaptureComplete = async (data) => {
    try {
      console.log('✅ ID capture completed, full data:', data);
      console.log('Images count:', data.images?.length);
      setStep('id_processing');

      // Extract images with proper type handling
      const images = data.images.map((base64String, index) => {
        const base64Data = base64String.includes(',') 
          ? base64String.split(',')[1] 
          : base64String;

        // Preserve SDK metadata for type determination
        let imageType = 'IDENTITY_CARD';
        if (data.meta?.[index]) {
          const meta = data.meta[index];
          if (meta.force_capture) {
            imageType = 'FORCED';
          } else if (meta.page_type) {
            imageType = meta.page_type;
          } else if (meta.document_type) {
            imageType = meta.document_type;
          }
        }

        return {
          data: base64Data,
          type: imageType
        };
      });

      console.log('📸 Processed images:', images.map(img => ({ type: img.type, dataLength: img.data?.length })));

      // Clean up AutoCapture instance
      if (acInstanceRef.current) {
        acInstanceRef.current.remove();
        acInstanceRef.current = null;
      }

      // Submit images to DataChecker
      console.log('📤 Submitting ID images...');
      const submitResponse = await base44.functions.invoke('datacheckerSubmitIDVerify', {
        transactionId: idTxRef.current,
        images
      });

      if (submitResponse.data.error) {
        throw new Error(submitResponse.data.error);
      }

      console.log('✅ ID images submitted successfully');

      // Poll for ID result
      setStep('id_polling');
      await pollForIDResult();

    } catch (err) {
      console.error('❌ ID processing error:', err.message);
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

  // Poll for ID result with exponential backoff
  const pollForIDResult = async () => {
    console.log('🔄 Polling for ID result...');
    
    let delay = 2000; // Start with 2 seconds
    const maxDelay = 10000; // Max 10 seconds
    const maxDuration = 3 * 60 * 1000; // 3 minutes total
    const startTime = Date.now();

    const poll = async () => {
      try {
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ Polling ID result... elapsed: ${(elapsed/1000).toFixed(1)}s, delay: ${delay}ms`);

        if (elapsed > maxDuration) {
          throw new Error('Verification timeout - please try again');
        }

        const pollResponse = await base44.functions.invoke('datacheckerPoll', {
          transactionId: idTxRef.current,
          customerReference: customerReferenceRef.current,
          expectedProduct: 'IDV_LITE'
        });

        console.log('📥 ID poll response:', JSON.stringify(pollResponse.data, null, 2));

        if (pollResponse.data.completed && pollResponse.data.resultId) {
          console.log('✅ ID verification completed, resultId:', pollResponse.data.resultId);
          
          // Get the detailed result
          const resultResponse = await base44.functions.invoke('datacheckerGetResult', {
            resultId: pollResponse.data.resultId,
            expectedProduct: 'IDV_LITE'
          });

          console.log('✅ ID result retrieved');

          // Store debug info for display
          const debugData = {
            identityApproved: resultResponse.data.identityApproved,
            imagesCount: resultResponse.data.images?.length,
            imageTypes: resultResponse.data.images?.map(img => ({
              type: img.type,
              pageType: img.pageType,
              hasData: !!img.data,
              dataLength: img.data?.length
            }))
          };
          setDebugInfo(debugData);
          console.log('Debug info:', JSON.stringify(debugData, null, 2));

          // Extract COMPARE image from result - try multiple strategies
          let compareImage = resultResponse.data.images?.find(
            img => img.type === 'COMPARE' || img.pageType === 'COMPARE'
          );

          // Fallback 1: Look for PORTRAIT type
          if (!compareImage) {
            console.log('⚠️ No COMPARE type found, trying PORTRAIT...');
            compareImage = resultResponse.data.images?.find(
              img => img.type === 'PORTRAIT' || img.pageType === 'PORTRAIT'
            );
          }

          // Fallback 2: Use the first image if it exists
          if (!compareImage && resultResponse.data.images?.length > 0) {
            console.log('⚠️ No PORTRAIT found, using first available image...');
            compareImage = resultResponse.data.images[0];
          }

          if (!compareImage) {
            console.error('❌ No usable image found');
            throw new Error('No face image found in ID verification result. Please ensure your document photo is clear.');
          }

          console.log('✅ Using image for face comparison, type:', compareImage.type || compareImage.pageType);
          compareImageRef.current = compareImage.data;
          console.log('✅ COMPARE image extracted from ID result');

          // Check if ID was approved
          if (!resultResponse.data.identityApproved) {
            console.error('❌ Identity not approved');
            throw new Error('Document verification failed');
          }

          console.log('🎉 ID verification complete! Moving to face capture in 1s...');

          // Move to face capture
          setTimeout(() => startFaceCapture(), 1000);
          } else {
          console.log('⏳ ID verification not complete yet, will retry...');
          // Continue polling with exponential backoff
          delay = Math.min(delay * 1.5, maxDelay);
          pollTimeoutRef.current = setTimeout(poll, delay);
          }

      } catch (err) {
        console.error('❌ ID polling error:', err.message);
        setError(err.message || 'Failed to verify identity');
        setStep('failed');
      }
    };

    poll();
  };

  // Start face capture
  const startFaceCapture = async () => {
    try {
      console.log('👤 Starting face capture...');
      setStep('face_capture');
      setError('');

      // Get SDK token for FaceVerify with SAME customerReference
      const tokenResponse = await base44.functions.invoke('datacheckerGetSDKToken', {
        services: 'FACE_VERIFY',
        customerReference: customerReferenceRef.current,
        numberOfChallenges: 2,
        validateWatermark: true
      });

      if (tokenResponse.data.error) {
        throw new Error(tokenResponse.data.error);
      }

      const { token, transactionId } = tokenResponse.data;
      faceTxRef.current = transactionId;
      console.log('✅ Got FaceVerify SDK token, transactionId:', transactionId);

      // Initialize FaceVerify
      const FV = new FaceVerify();
      fvInstanceRef.current = FV;

      const isDevMode = window.location.hostname === 'localhost' || window.location.hostname.includes('staging');

      await FV.init({
        CONTAINER_ID: 'fv-mount',
        LANGUAGE: getSDKTranslations(),
        TOKEN: token,
        onComplete: handleFaceCaptureComplete,
        onError: handleFaceCaptureError,
        onUserExit: handleFaceCaptureExit,
        DEBUG: false,
        DESKTOP_MODE: isDevMode && !isMobile
      });

      FV.start();

    } catch (err) {
      console.error('❌ Failed to start face capture:', err.message);
      setError(err.message || 'Failed to initialize face verification');
      setStep('failed');
    }
  };

  const handleFaceCaptureComplete = async (data) => {
    try {
      console.log('✅ Face capture completed');
      setStep('face_processing');

      // Clean up FaceVerify instance
      if (fvInstanceRef.current) {
        fvInstanceRef.current.stop();
        fvInstanceRef.current = null;
      }

      // Build images array with COMPARE first, then LIVE images
      const images = [
        {
          type: 'COMPARE',
          data: compareImageRef.current
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

      console.log('📤 Submitting face verification with COMPARE + LIVE images...');

      // Submit face verification
      const submitPayload = {
        transactionId: faceTxRef.current,
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

      // Poll for face result
      setStep('face_polling');
      await pollForFaceResult();

    } catch (err) {
      console.error('❌ Face processing error:', err.message);
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

  // Poll for Face result with exponential backoff
  const pollForFaceResult = async () => {
    console.log('🔄 Polling for Face result...');
    
    let delay = 2000;
    const maxDelay = 10000;
    const maxDuration = 3 * 60 * 1000;
    const startTime = Date.now();

    const poll = async () => {
      try {
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ Polling Face result... elapsed: ${(elapsed/1000).toFixed(1)}s, delay: ${delay}ms`);

        if (elapsed > maxDuration) {
          throw new Error('Verification timeout - please try again');
        }

        const pollResponse = await base44.functions.invoke('datacheckerPoll', {
          transactionId: faceTxRef.current,
          customerReference: customerReferenceRef.current,
          expectedProduct: 'FACE_VERIFY'
        });

        console.log('📥 Face poll response:', JSON.stringify(pollResponse.data, null, 2));

        if (pollResponse.data.completed && pollResponse.data.resultId) {
          console.log('✅ Face verification completed, resultId:', pollResponse.data.resultId);
          
          // Get the detailed result
          const resultResponse = await base44.functions.invoke('datacheckerGetResult', {
            resultId: pollResponse.data.resultId,
            expectedProduct: 'FACE_VERIFY'
          });

          console.log('✅ Face result retrieved');

          // Final approval decision
          const finalApproved = resultResponse.data.faceApproved === true;

          if (finalApproved) {
            console.log('🎉 Verification successful!');
            setStep('success');
            
            const resultData = {
              verified: true,
              idTransactionId: idTxRef.current,
              faceTransactionId: faceTxRef.current,
              customerReference: customerReferenceRef.current
            };
            
            setTimeout(() => onComplete(resultData), 2000);
          } else {
            throw new Error('Face verification failed');
          }
        } else {
          // Continue polling with exponential backoff
          delay = Math.min(delay * 1.5, maxDelay);
          pollTimeoutRef.current = setTimeout(poll, delay);
        }

      } catch (err) {
        console.error('❌ Face polling error:', err.message);
        setError(err.message || 'Failed to verify face');
        setStep('failed');
      }
    };

    poll();
  };

  const handleRetry = () => {
    setError('');
    setRetryCount(prev => prev + 1);
    setStep('init');
    customerReferenceRef.current = null;
    idTxRef.current = null;
    faceTxRef.current = null;
    compareImageRef.current = null;
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      if (acInstanceRef.current) {
        acInstanceRef.current.remove();
      }
      if (fvInstanceRef.current) {
        fvInstanceRef.current.stop();
      }
    };
  }, []);

  // Auto-start verification when component mounts
  useEffect(() => {
    if (step === 'init') {
      console.log('🚀 Starting verification flow...');
      startIDCapture();
    }
  }, [step]);

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
        
        {debugInfo && (
          <div className="mt-4 p-4 bg-slate-800 rounded-lg text-left max-w-md mx-auto">
            <p className="text-xs text-white/70 mb-2 font-mono">Debug Info:</p>
            <pre className="text-xs text-white/60 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        {retryCount < 3 && (
          <Button onClick={handleRetry} className="gold-gradient text-black mt-4">
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
              ? 'Posicione seu documento dentro do quadro.' 
              : 'Position your document within the frame.'}
          </p>
        </div>
        <div 
          id="ac-mount"
          className="rounded-xl overflow-hidden"
          style={{ maxWidth: '500px', margin: '0 auto' }}
        />
      </div>
    );
  }

  if (step === 'id_processing' || step === 'id_polling') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">
          {language === 'pt' ? 'Processando documento...' : 'Processing document...'}
        </p>
        <p className="text-white/40 text-sm mt-2">
          {language === 'pt' ? 'Isso pode levar alguns segundos' : 'This may take a few seconds'}
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
              ? 'Siga as instruções na tela.' 
              : 'Follow the on-screen instructions.'}
          </p>
        </div>
        <div 
          id="fv-mount"
          className="rounded-xl overflow-hidden"
          style={{ maxWidth: '500px', margin: '0 auto' }}
        />
      </div>
    );
  }

  if (step === 'face_processing' || step === 'face_polling') {
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