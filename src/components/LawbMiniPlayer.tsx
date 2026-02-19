import React, { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import Popup from './Popup';
import { useLawbAudio } from '../contexts/LawbAudioContext';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: 10,
    boxSizing: 'border-box',
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    flex: 1,
    border: '2px inset #fff',
    background: '#000',
    color: '#00ff66',
    padding: '6px 8px',
    fontFamily: 'monospace',
    fontSize: 12,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  btnRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  btn: {
    border: '2px outset #fff',
    background: '#c0c0c0',
    color: '#000',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: 12,
    '&:active': {
      border: '2px inset #c0c0c0',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  slimBtn: {
    padding: '6px 8px',
    minWidth: 40,
    textAlign: 'center',
  },
  meter: {
    border: '2px inset #fff',
    background: '#0f0f0f',
    height: 10,
    width: '100%',
    position: 'relative',
    marginBottom: 10,
  },
  meterFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, #00ff66, #00b7ff)',
    width: (p: { pct: number }) => `${p.pct}%`,
  },
  metaRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 'auto',
  },
  label: {
    fontSize: 12,
    color: '#000',
    userSelect: 'none',
  },
  slider: {
    flex: 1,
  },
  smallNote: {
    fontSize: 11,
    color: '#333',
    marginTop: 8,
  },
});

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

const LawbMiniPlayer: React.FC = () => {
  const { state, actions } = useLawbAudio();
  const pct = useMemo(() => {
    if (!state.durationSec) return 0;
    return Math.max(0, Math.min(100, (state.currentTimeSec / state.durationSec) * 100));
  }, [state.currentTimeSec, state.durationSec]);
  const classes = useStyles({ pct });

  const title = state.currentTrack
    ? `${state.currentTrack.user?.username ? `${state.currentTrack.user.username} - ` : ''}${state.currentTrack.title}`
    : 'Lawb Player';

  return (
    <Popup
      id="lawb-mini-player"
      isOpen={state.showMiniPlayer}
      onClose={() => actions.toggleMiniPlayer()}
      onMinimize={() => actions.toggleMiniPlayer()}
      title="LAWBAMP"
      initialPosition={{ x: 20, y: 80 }}
      initialSize={{ width: 380, height: 240 }}
      zIndex={999998}
    >
      <div className={classes.container}>
        <div className={classes.topRow}>
          <div className={classes.title} title={title}>{title}</div>
        </div>

        <div className={classes.btnRow}>
          <button className={`${classes.btn} ${classes.slimBtn}`} type="button" onClick={() => { void actions.prev(); }} disabled={!state.isReady || state.isLoading}>
            {'<<'}
          </button>
          <button className={`${classes.btn} ${classes.slimBtn}`} type="button" onClick={() => { void actions.togglePlay(); }} disabled={!state.isReady || state.isLoading}>
            {state.isPlaying ? 'Pause' : 'Play'}
          </button>
          <button className={`${classes.btn} ${classes.slimBtn}`} type="button" onClick={() => { void actions.next(); }} disabled={!state.isReady || state.isLoading}>
            {'>>'}
          </button>

          <button className={classes.btn} type="button" onClick={() => actions.toggleShuffle()} disabled={!state.isReady}>
            {state.shuffleEnabled ? 'Shuffle:ON' : 'Shuffle:OFF'}
          </button>
        </div>

        <div className={classes.meter} title={`${fmtTime(state.currentTimeSec)} / ${fmtTime(state.durationSec)}`}>
          <div className={classes.meterFill} />
        </div>

        <div className={classes.metaRow}>
          <div className={classes.label}>Vol</div>
          <input
            className={classes.slider}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.volume}
            onChange={(e) => actions.setVolume(Number(e.target.value))}
          />
          <div className={classes.label}>{fmtTime(state.currentTimeSec)}</div>
        </div>

        {state.error && (
          <div className={classes.smallNote} style={{ color: '#a10000' }}>
            {state.error}
          </div>
        )}
        {!state.currentTrack && (
          <div className={classes.smallNote}>
            Click Play to load SoundCloud likes and start shuffling.
          </div>
        )}
      </div>
    </Popup>
  );
};

export default LawbMiniPlayer;

