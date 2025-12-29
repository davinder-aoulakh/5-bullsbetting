import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const body = await req.json();
    const { resultId } = body;

    if (!resultId) {
      return Response.json({ 
        error: 'resultId is required' 
      }, { status: 400 });
    }

    // Get access token
    const tokenResponse = await base44.functions.invoke('datacheckerAuth');
    if (!tokenResponse.data?.accessToken) {
      return Response.json({ 
        error: 'Failed to get authentication token' 
      }, { status: 500 });
    }

    const accessToken = tokenResponse.data.accessToken;

    // Get detailed result
    const response = await fetch(
      `${DATACHECKER_BASE_URL}/api/v2/result/${resultId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ 
        error: 'Failed to get verification result',
        details: error
      }, { status: response.status });
    }

    const data = await response.json();

    // Determine overall status
    const identityApproved = data.identity?.result === 'APPROVED';
    const faceApproved = data.faceVerify?.result === 'APPROVED';
    const overallApproved = identityApproved && faceApproved;

    // Update verification log
    const logs = await base44.asServiceRole.entities.VerificationLog.filter({
      user_id: user.id,
      reference_id: data.transactionId
    });

    if (logs.length > 0) {
      await base44.asServiceRole.entities.VerificationLog.update(logs[0].id, {
        status: overallApproved ? 'passed' : 'failed',
        result_details: {
          identityResult: data.identity?.result,
          faceResult: data.faceVerify?.result,
          documentType: data.identity?.data?.documentType,
          extractedData: {
            name: data.identity?.data?.name?.fullname,
            dateOfBirth: data.identity?.data?.dateOfBirth,
            documentNumber: data.identity?.data?.documentNumber
          }
        }
      });
    }

    // If approved, update user verification status
    if (overallApproved) {
      await base44.asServiceRole.entities.User.update(user.id, {
        kyc_verified: true,
        verification_date: new Date().toISOString()
      });
    }

    return Response.json({
      approved: overallApproved,
      result: data.result,
      identity: {
        result: data.identity?.result,
        data: data.identity?.data
      },
      faceVerify: {
        result: data.faceVerify?.result
      },
      transactionId: data.transactionId
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});