// Victory / Defeat / Draw overlay for the on-chain chess UI. Plays the matching sound on
// mount and shows the celebration gif (reusing the live game's assets).

import React, { useEffect } from 'react';
import { playChessSound } from '../../utils/chessSounds';
import './onchainChess.css';

export type GameOutcome = 'win' | 'loss' | 'draw';

export interface OnchainChessResultProps {
  outcome: GameOutcome;
  /** e.g. "Checkmate", "Resignation", "Timeout" */
  detail?: string;
  onClose: () => void;
}

const TITLE: Record<GameOutcome, string> = { win: 'Victory!', loss: 'Defeat', draw: 'Draw' };
const GIF: Record<GameOutcome, string | null> = {
  win: '/images/victory.gif',
  loss: '/images/loser.gif',
  draw: null,
};

export const OnchainChessResult: React.FC<OnchainChessResultProps> = ({ outcome, detail, onClose }) => {
  useEffect(() => {
    playChessSound(outcome === 'win' ? 'victory' : outcome === 'loss' ? 'loser' : 'check');
  }, [outcome]);

  return (
    <div className={`oc-result-overlay ${outcome === 'loss' ? 'defeat' : ''}`} onClick={onClose}>
      <div className="oc-result-modal" onClick={(e) => e.stopPropagation()}>
        {GIF[outcome] && <img src={GIF[outcome] as string} alt={TITLE[outcome]} />}
        <div className="oc-result-title">{TITLE[outcome]}</div>
        {detail && <div className="oc-result-sub">{detail}</div>}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
