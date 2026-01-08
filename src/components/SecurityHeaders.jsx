import React from 'react';
import { Helmet } from 'react-helmet';

export default function SecurityHeaders() {
  // Content Security Policy for DataChecker SDK integration
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://developer.staging.datachecker.nl https://developer.datachecker.nl",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "frame-src 'self'"
  ].join('; ');

  return (
    <Helmet>
      <meta httpEquiv="Content-Security-Policy" content={csp} />
    </Helmet>
  );
}