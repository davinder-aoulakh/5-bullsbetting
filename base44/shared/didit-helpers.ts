export const STATUS_MAP: Record<string, string> = {
  'not started': 'pending',
  'in progress': 'in_progress',
  'approved': 'approved',
  'declined': 'declined',
  'in review': 'in_review',
  'abandoned': 'abandoned',
  'expired': 'expired'
};

export function mapStatus(rawStatus: string): string {
  return STATUS_MAP[rawStatus.toLowerCase()] ?? 'pending';
}

export function buildFailureReason(decision: any): string {
  const failed: string[] = [];

  const idv = decision?.kyc?.id_verification;
  if (idv && idv.status && idv.status.toLowerCase() !== 'approved') {
    if (idv.document_expired) {
      failed.push('the identity document is expired');
    } else {
      failed.push('document authenticity check failed');
    }
  }

  const liveness = decision?.kyc?.liveness;
  if (liveness && liveness.passed === false) {
    failed.push('liveness/selfie check failed');
  }

  const faceMatch = decision?.kyc?.face_match;
  if (faceMatch && faceMatch.passed === false) {
    failed.push('face match check failed');
  }

  const ageVerification = decision?.kyc?.age_verification;
  if (ageVerification && ageVerification.passed === false) {
    failed.push('age verification failed');
  }

  if (failed.length === 0) {
    return 'Verification was declined. Please contact support for more information.';
  }

  const list = failed.join(', ');
  return `Verification declined: ${list.charAt(0).toUpperCase() + list.slice(1)}.`;
}

export function logStatusToVerificationLogStatus(mappedStatus: string): string {
  if (mappedStatus === 'approved') return 'passed';
  if (mappedStatus === 'declined') return 'failed';
  if (mappedStatus === 'in_review') return 'manual_review';
  return 'pending';
}