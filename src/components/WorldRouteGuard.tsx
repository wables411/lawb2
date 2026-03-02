/**
 * WorldRouteGuard — Clawb's World is local/OBS-only.
 * On localhost: renders ClawbWorld (for OBS/Retake TV stream).
 * On lawb.xyz: redirects to home with stream info.
 */
import React from 'react';
import { lazy, Suspense } from 'react';

const ClawbWorld = lazy(() => import('./ClawbWorld'));

const RETAKE_URL = 'https://retake.tv/clawb';

function isLocalWorld(): boolean {
  if (typeof window === 'undefined') return false;
  const h = (window.location?.hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1';
}

const WorldStreamOnly: React.FC = () => (
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

const WorldRouteGuard: React.FC = () => {
  if (isLocalWorld()) {
    return (
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              fontSize: 24,
              background: '#0a1628',
              color: '#e2e8f0',
            }}
          >
            Entering Clawb&apos;s World...
          </div>
        }
      >
        <ClawbWorld />
      </Suspense>
    );
  }
  return <WorldStreamOnly />;
};

export default WorldRouteGuard;
