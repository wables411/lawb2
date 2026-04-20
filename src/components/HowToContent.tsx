import React from 'react';
import { WALLET_CONNECT_LEADERBOARD_BONUS } from '../firebaseLeaderboard';

interface HowToContentProps {
  variant?: 'default' | 'mobile';
}

export const HowToContent: React.FC<HowToContentProps> = ({ variant = 'default' }) => {
  const pieceKey = [
    'Pawn: Moves forward 1 (or 2 from start), captures diagonally, promotes on last rank.',
    'Knight: Moves in an L shape (2 + 1) and can jump over pieces.',
    'Bishop: Moves any number of squares diagonally.',
    'Rook: Moves any number of squares horizontally or vertically.',
    'Queen: Moves any number of squares in any one direction.',
    'King: Moves 1 square in any direction. Keep this piece safe.',
  ];

  const singlePlayerFlow = [
    'From Chess Home, keep VS AI selected and click Start Match.',
    'Choose your piece set and difficulty (Easy or Hard).',
    'Blue starts first from the bottom. Red starts at the top.',
    'Click a piece, then click a highlighted legal square to move.',
  ];

  const basePvpFlow = [
    'Connect your wallet and switch to Base mainnet (Chain ID 8453).',
    'Open PvP and create a token wager match, or join an open one.',
    'When creating, confirm required wallet transaction(s).',
    'When an opponent joins, match starts automatically and Blue moves first.',
    'Winner claims payout from the contract after game end.',
  ];

  return (
    <div className={`how-to-section ${variant === 'mobile' ? 'mobile' : ''}`}>
      <h4>How to Play Lawb Chess Beta 3000</h4>
      <div className="how-to-content">
        <p>
          <strong>Current Live Scope:</strong> Lawb Chess PvP wagering is Base-first right now. Sanko has sunsetted for new matches. Solana contract play is not active in this client.
        </p>
        <p>
          <strong>Objective:</strong> Checkmate the opponent king. Blue starts at the bottom and always moves first. Red starts at the top.
        </p>

        <p><strong>Single Player (VS AI):</strong></p>
        <ol className="how-to-list how-to-list-numbered">
          {singlePlayerFlow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <p><strong>PvP on Base:</strong></p>
        <ol className="how-to-list how-to-list-numbered">
          {basePvpFlow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <p><strong>Chess Piece Key:</strong></p>
        <ul className="how-to-list">
          {pieceKey.map((piece) => (
            <li key={piece}>{piece}</li>
          ))}
        </ul>

        <p><strong>Special Rules:</strong></p>
        <ul className="how-to-list">
          <li>Check: Your king is under attack and must be defended immediately.</li>
          <li>Checkmate: King is under attack with no legal escape, game over.</li>
          <li>Stalemate: No legal move but not in check, game ends in draw.</li>
          <li>Castling and en passant are supported where legal.</li>
        </ul>

        <p>
          <strong>Leaderboard:</strong> Win = 3 points, Draw = 1, Loss = 0. First WalletConnect/Reown connection adds {WALLET_CONNECT_LEADERBOARD_BONUS} bonus points. Holdings score and collection perks come from your Lawb profile inventory.
        </p>

        <p>
          <strong>Base Contract:</strong>{' '}
          <a
            href="https://basescan.org/address/0x06b6aae693cf1af27d5a5df0d0ac88af3fac9e11"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#32CD32' }}
          >
            0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11
          </a>
        </p>

        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#000000', borderRadius: '4px', fontSize: '12px' }}>
          <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Network Name:</strong> Base Mainnet</p>
          <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>RPC URL:</strong> https://mainnet.base.org</p>
          <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Chain ID:</strong> 8453</p>
          <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Currency Symbol:</strong> ETH</p>
        </div>
      </div>
    </div>
  );
};

