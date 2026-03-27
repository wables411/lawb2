import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';

export interface ClawbStreamButtonHandle {
  triggerDance: () => void;
}

const IDLE_GIF = '/assets/lawbidle_5s_finalfix_transparent_loop.gif';
const DANCE_GIF = '/assets/lawbdance2_5s_finalfix_transparent_loop.gif';
const STREAM_URL = 'https://retake.tv/clawb';
const CTA_MESSAGE = 'click here to visit clawbs live stream!';

const ClawbStreamButton = forwardRef<ClawbStreamButtonHandle>((_, ref) => {
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
        <button
          type="button"
          onClick={() => window.open(STREAM_URL, '_blank', 'noopener,noreferrer')}
          onFocus={(event) => event.currentTarget.blur()}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 24px)',
            right: 0,
            width: 220,
            minHeight: 62,
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
          {bubbleText}
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
        </button>
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
