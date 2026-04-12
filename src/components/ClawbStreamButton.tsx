import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { CLAWB_STREAM_DANCE_GIF, CLAWB_STREAM_IDLE_GIF } from '../config/lawbIsolatedGifs';
import PretextLabel from './PretextLabel';

export interface ClawbStreamButtonHandle {
  triggerDance: () => void;
}

const IDLE_GIF = CLAWB_STREAM_IDLE_GIF;
const DANCE_GIF = CLAWB_STREAM_DANCE_GIF;
const STREAM_URL = 'https://retake.tv/clawb';
const CTA_MESSAGE = 'choose a clawb tv option';

type ClawbStreamButtonProps = {
  onAdvertiseClick?: () => void;
};

const ClawbStreamButton = forwardRef<ClawbStreamButtonHandle, ClawbStreamButtonProps>(({ onAdvertiseClick }, ref) => {
  const [isDanceMode, setIsDanceMode] = useState(false);
  const [typedText, setTypedText] = useState('');

  useImperativeHandle(ref, () => ({
    triggerDance: () => setIsDanceMode(true),
  }));

  useEffect(() => {
    if (!isDanceMode) {
      setTypedText('');
      return;
    }

    setTypedText('');
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setTypedText(CTA_MESSAGE.slice(0, i));
      if (i >= CTA_MESSAGE.length) {
        window.clearInterval(timer);
      }
    }, 28);

    return () => window.clearInterval(timer);
  }, [isDanceMode]);

  const bubbleText = useMemo(() => (typedText.length ? typedText : '\u00A0'), [typedText]);

  return (
    <div
      style={{
        position: 'fixed',
        right: 14,
        bottom: 48,
        width: 182,
        zIndex: 9998,
        userSelect: 'none',
      }}
    >
      {isDanceMode && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 24px)',
            right: 0,
            width: 'min(260px, calc(100vw - 28px))',
            minHeight: 100,
            padding: '8px 10px',
            border: 'none',
            outline: 'none',
            borderRadius: 10,
            background: '#fffff2',
            color: '#000',
            fontFamily: "'MS Sans Serif', Arial, sans-serif",
            fontSize: 14,
            lineHeight: 1.2,
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            {typedText.length ? (
              <PretextLabel
                text={typedText}
                font={'14px "MS Sans Serif", Arial, sans-serif'}
                maxWidth={240}
                maxLines={3}
                lineHeight={1.2}
                style={{ textAlign: 'left' }}
              />
            ) : (
              bubbleText
            )}
          </div>
          <button
            type="button"
            onClick={onAdvertiseClick}
            style={{
              width: '100%',
              marginBottom: 6,
              border: '2px outset #fff',
              background: '#c0c0c0',
              padding: '8px 8px',
              minHeight: 40,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            Advertise on Clawb TV
          </button>
          <button
            type="button"
            onClick={() => window.open(STREAM_URL, '_blank', 'noopener,noreferrer')}
            style={{
              width: '100%',
              border: '2px outset #fff',
              background: '#c0c0c0',
              padding: '8px 8px',
              minHeight: 40,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            Tune in to Clawbs livestream on Retake.TV
          </button>
          <span
            style={{
              position: 'absolute',
              right: 38,
              bottom: -16,
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '16px solid #fffff2',
            }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsDanceMode(true)}
        onFocus={(event) => event.currentTarget.blur()}
        title="Clawb"
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          width: '100%',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <img
          src={isDanceMode ? DANCE_GIF : IDLE_GIF}
          alt="Clawb button"
          style={{
            width: '100%',
            display: 'block',
            filter: 'drop-shadow(0 8px 10px rgba(0, 0, 0, 0.35))',
          }}
        />
      </button>
    </div>
  );
});

ClawbStreamButton.displayName = 'ClawbStreamButton';

export default ClawbStreamButton;
