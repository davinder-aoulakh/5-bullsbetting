import React from 'react';
import { Helmet } from 'react-helmet';

export default function SecurityHeaders() {
  // Content Security Policy for DataChecker SDK integration
  // Based on DataChecker documentation requirements
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval' 'unsafe-inline' blob:",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://developer.datachecker.nl https://cdn.jsdelivr.net data:",
    "img-src 'self' data: blob: https://cdn.jsdelivr.net",
    "worker-src 'self' blob:",
    "object-src 'self' blob:",
    "frame-src 'self' blob:",
    "base-uri 'none'"
  ].join('; ');

  return (
    <Helmet>
      <meta httpEquiv="Content-Security-Policy" content={csp} />
    </Helmet>
  );
}