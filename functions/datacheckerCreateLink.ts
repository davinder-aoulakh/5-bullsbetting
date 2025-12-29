import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, cpf } = body;

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
    const customerReference = `5bulls_${user.id}_${Date.now()}`;
    
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

    // Store verification log
    await base44.asServiceRole.entities.VerificationLog.create({
      user_id: user.id,
      verification_type: 'id_document',
      provider: 'datachecker',
      reference_id: data.transactionId,
      status: 'initiated',
      result_details: {
        customerReference: customerReference,
        secureId: data.secureId
      }
    });

    return Response.json({
      link: data.link,
      transactionId: data.transactionId,
      qrCode: data.qrCode,
      secureId: data.secureId
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});