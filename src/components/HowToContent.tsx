import React from 'react';

interface HowToContentProps {
  variant?: 'default' | 'mobile';
}

// Web browser version - ONLY shows Sanko content, no Base app detection
export const HowToContent: React.FC<HowToContentProps> = ({ variant = 'default' }) => {
  // Desktop/Web version (Sanko) - NO Base app detection, this is web browser only
  return (
    <div className={`how-to-section ${variant === 'mobile' ? 'mobile' : ''}`}>
      <h4>How to Play Lawb Chess Beta 3000 on Sanko</h4>
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
          <li><strong>Checkmate:</strong> When your king is under attack with no legal moves to escape. endGame.</li>
          <li><strong>Stalemate:</strong> When you have no legal moves but your king is not in check (draw). endGame.</li>
          <li><strong>Pawn Promotion:</strong> When a pawn reaches the opposite end of chess board, Player chooses which chess piece to swap pawn out for.</li>
        </ul>
        <p><strong>Match Modes:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
          <li><strong>Single Player:</strong> Choose easy or Hard difficulty and practice against the computer.</li>
          <li><strong>Multiplayer:</strong> wage $DMT, $LAWB, $GOLD or $MOSS and challenge other players on Sanko mainnet. Winner takes the pot minus 5% house fee. Each match smokes the ticker.</li>
        </ul>
        <p><strong>Multiplayer Flow:</strong></p>
        <ol style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
          <li>Connect your wallet to Sanko mainnet</li>
          <li>Create a match and set your wager amount in $DMT, $LAWB, $GOLD or $MOSS</li>
          <li>Share your invite code with an opponent</li>
          <li>Opponent joins and matches your wager</li>
          <li>Match begins automatically - Blue (Player 1) moves first</li>
          <li>Winner claims the pot minus 5% house fee</li>
        </ol>
        <p><strong>Leaderboard:</strong> All matches are tracked to your connected wallet. Win = 3 points, Draw = 1 point, Loss = 0 points.</p>
        <p><strong>Lawb Chess Mainnet Contract:</strong> <a href="https://explorer.sanko.xyz/address/0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56?tab=contract" target="_blank" rel="noopener noreferrer" style={{color: '#32CD32'}}>0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56</a></p>
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#000000', borderRadius: '4px', fontSize: '12px' }}>
          <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Network Name:</strong> Sanko Mainnet</p>
          <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>RPC URL:</strong> https://mainnet.sanko.xyz</p>
          <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Chain ID:</strong> 1996</p>
          <p style={{ margin: '2px 0', color: '#32CD32' }}><strong>Currency Symbol:</strong> DMT</p>
        </div>
      </div>
    </div>
  );
};

