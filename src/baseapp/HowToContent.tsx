import React from 'react';

interface HowToContentProps {
  variant?: 'default' | 'mobile';
}

// Base App version - NO DETECTION, this is ONLY for Base app
export const HowToContent: React.FC<HowToContentProps> = ({ variant = 'default' }) => {
  return (
    <div className={`how-to-section ${variant === 'mobile' ? 'mobile' : ''}`}>
      <h4>How to Play Lawb Chess Beta 3000 on Base</h4>
      <div className="how-to-content">
        <p><strong>Objective:</strong> Checkmate your opponent&apos;s king by placing it under attack with no legal moves to escape.</p>
        <p><strong>Match Setup:</strong> Blue pieces start at the bottom, Red pieces at the top. Blue always moves first.</p>
        <p><strong>Piece Movements:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
          <li><strong>Pawn:</strong> Moves forward one square (or two on first move), captures diagonally</li>
          <li><strong>Knight:</strong> Moves in L-shape: 2 squares in one direction, then 1 square perpendicular</li>
          <li><strong>Bishop:</strong> Moves any number of squares diagonally</li>
          <li><strong>Rook:</strong> Moves any number of squares horizontally or vertically</li>
          <li><strong>Queen:</strong> Moves any number of squares in any one direction</li>
          <li><strong>King:</strong> Moves one square in any direction</li>
        </ul>
        <p><strong>Special Rules:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
          <li><strong>Check:</strong> When your king is under attack - you must move to escape</li>
          <li><strong>Checkmate:</strong> When your king is under attack with no legal moves to escape. Game ends.</li>
          <li><strong>Stalemate:</strong> When you have no legal moves but your king is not in check (draw). Game ends.</li>
          <li><strong>Pawn Promotion:</strong> When a pawn reaches the opposite end of the board, you choose which piece to promote to (Queen, Rook, Bishop, or Knight).</li>
        </ul>
        <p><strong>Match Modes:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
          <li><strong>Single Player:</strong> Practice against the computer AI. Choose Easy or Hard difficulty.</li>
          <li><strong>PVP Multiplayer:</strong> Wager tokens (ETH, USDC, or any ERC-20 on Base) and challenge other players. Winner takes the pot minus 5% house fee.</li>
        </ul>
        <p><strong>PVP Multiplayer Flow:</strong></p>
        <ol style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
          <li>Connect your wallet (automatically connected in Base app)</li>
          <li>Click &quot;Create New Match&quot; and select your token and wager amount</li>
          <li>Choose your chess piece set (LawbStation or PixeLawbs if you own the NFT)</li>
          <li>Confirm the transaction to create your match</li>
          <li>Share your invite code or wait for an opponent to join from the lobby</li>
          <li>When opponent joins and matches your wager, the match begins automatically</li>
          <li>Blue (Player 1) moves first. Take turns making moves</li>
          <li>Winner claims the pot minus 5% house fee</li>
        </ol>
        <p><strong>Leaderboard:</strong> All matches are tracked to your connected wallet. Win = 3 points, Draw = 1 point, Loss = 0 points.</p>
        <p><strong>Chess Piece Sets:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
          <li><strong>LawbStation:</strong> Default set available to all players</li>
          <li><strong>PixeLawbs:</strong> Requires owning a PixeLawbs NFT (Ethereum collection)</li>
        </ul>
        <p><strong>Base Contract:</strong> <a href="https://basescan.org/address/0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11" target="_blank" rel="noopener noreferrer" style={{color: '#32CD32'}}>0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11</a></p>
      </div>
    </div>
  );
};
