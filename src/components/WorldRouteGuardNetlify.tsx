/**
 * WorldRouteGuardNetlify — Netlify build: /world shows stream-only message.
 * No ClawbWorld import = no Three.js world bundle, no world assets needed.
 * Local builds use WorldRouteGuard which lazy-loads ClawbWorld.
 */
import React from 'react';

const RETAKE_URL = 'https://retake.tv/clawb';

const WorldRouteGuardNetlify: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a1628',
      color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif',
      padding: 24,
      textAlign: 'center',
    }}
  >
    <p style={{ marginBottom: 16, fontSize: 18 }}>Clawb&apos;s World streams live on Retake TV.</p>
    <a
      href={RETAKE_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#38bdf8',
        textDecoration: 'underline',
        fontSize: 20,
      }}
    >
      Watch on retake.tv/clawb
    </a>
  </div>
);

export default WorldRouteGuardNetlify;
