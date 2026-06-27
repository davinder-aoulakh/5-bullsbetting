import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { name, email, phone, cpf, country, id_type, id_value } = body;

    // Get access token directly (call our own auth logic)
    const clientId = Deno.env.get('DATACHECKER_CLIENT_ID');
    const clientSecret = Deno.env.get('DATACHECKER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ 
        error: 'DataChecker credentials not configured' 
      }, { status: 500 });
    }

    const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch(`https://developer.staging.datachecker.nl/api/v2/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scopes: [
          'productapi.idverify.write',
          'productapi.faceverify.write',
          'productapi.sdk.read',
          'productapi.secureidlink.write',
          'productapi.poll.read',
          'productapi.result.read'
        ]
      })
    });

    if (!tokenResponse.ok) {
      return Response.json({ 
        error: 'Failed to authenticate with DataChecker'
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Create secure ID link
    const identifierValue = id_value || cpf || '';
    const customerReference = `5bulls_${country}_${identifierValue.replace(/\W/g, '')}_${Date.now()}`;
    
    const response = await fetch(`${DATACHECKER_BASE_URL}/api/v2/secureidlink`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product: 'IDV_PREMIUM',
        name: name,
        emailAddress: email,
        phoneNumber: phone,
        communicationModes: [],
        disableCommunication: true,
        languagePrefix: 'pt',
        customerReference: customerReference,
        enableOneTimePassword: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails = errorText;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson;
        
        // Check for insufficient balance error
        if (errorJson.code === 9 || errorJson.message === 'NotEnoughBalance') {
          return Response.json({ 
            error: 'DataChecker account has insufficient balance. Please contact support to add credits.',
            details: errorDetails
          }, { status: 400 });
        }
      } catch (e) {
        // If not JSON, use text as is
      }
      
      return Response.json({ 
        error: 'Failed to create verification link',
        details: errorDetails
      }, { status: 400 });
    }

    const data = await response.json();

    console.log('✅ SecureIDLink created successfully:', {
      transactionId: data.transactionId,
      secureId: data.secureId,
      customerReference: customerReference
    });

    // Note: Verification log will be created after user account is created upon successful verification

    return Response.json({
      link: data.link,
      transactionId: data.transactionId,
      qrCode: data.qrCode,
      secureId: data.secureId,
      customerReference: customerReference
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});