import React, { useState, useEffect } from 'react';
import { listenToClawbStatus } from '../firebaseClawb';

const RETAKE_STREAM_URL = 'https://retake.tv/clawb';

const RetakeLiveBadge: React.FC = () => {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const unsub = listenToClawbStatus((status) => {
      setIsLive(status?.online ?? false);
    });
    return unsub;
  }, []);

  return (
    <div
      onClick={() => window.open(RETAKE_STREAM_URL, '_blank', 'noopener,noreferrer')}
      title={isLive ? 'Clawb is LIVE on Retake TV — click to watch' : 'Retake TV — click to visit'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: 'rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        fontSize: '11px',
        fontFamily: 'DejaVu Sans, Liberation Sans, Arial, sans-serif',
        color: '#cbd5e0',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isLive ? '#f56565' : '#a0aec0',
          border: '1px solid rgba(0, 0, 0, 0.3)',
          flexShrink: 0,
          animation: isLive ? 'retake-live-pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      <span>{isLive ? 'LIVE' : 'Retake TV'}</span>
      <style>{`
        @keyframes retake-live-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(245, 101, 101, 0.6); }
          50% { opacity: 0.7; box-shadow: 0 0 6px 2px rgba(245, 101, 101, 0.4); }
        }
      `}</style>
    </div>
  );
};

export default RetakeLiveBadge;
