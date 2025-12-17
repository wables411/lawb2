import React from 'react';

interface HowToContentProps {
  variant?: 'default' | 'mobile';
}

import { isBaseMiniApp } from '../utils/baseMiniapp';

export const HowToContent: React.FC<HowToContentProps> = ({ variant = 'default' }) => {
  // Check Base app detection - this is INDEPENDENT of mobile/desktop variant
  // variant is only for styling, NOT for determining Base app vs web app
  // Use state to force re-check on mount
  const [isBaseApp, setIsBaseApp] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Check iframe - PRIMARY method
    try {
      if (window.self !== window.top) return true;
    } catch (e) {
      // Cross-origin iframe = definitely Base app
      return true;
    }
    
    // Check URL/referrer for Base/Farcaster indicators
    const hostname = window.location.hostname.toLowerCase();
    try {
      const referrer = document.referrer.toLowerCase();
      if (hostname.includes('farcaster') || hostname.includes('base') ||
          referrer.includes('farcaster') || referrer.includes('base') ||
          referrer.includes('warpcast')) {
        return true;
      }
    } catch (e) {
      // Referrer might not be accessible
    }
    
    // Check user agent
    const ua = navigator.userAgent?.toLowerCase() || '';
    if (ua.includes('farcaster') || ua.includes('base')) {
      return true;
    }
    
    return isBaseMiniApp();
  });
  
  // Re-check on mount and after delay to catch timing issues
  React.useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      
      let detected = false;
      
      // Check iframe - PRIMARY method (most reliable)
      try {
        if (window.self !== window.top) {
          detected = true;
        }
      } catch (e) {
        // Cross-origin iframe = definitely Base app
        // This exception is thrown when we can't access window.top from cross-origin iframe
        detected = true;
      }
      
      // If not detected yet, check other indicators
      if (!detected) {
        // Check URL/referrer for Base/Farcaster indicators
        const hostname = window.location.hostname.toLowerCase();
        try {
          const referrer = document.referrer.toLowerCase();
          if (hostname.includes('farcaster') || hostname.includes('base') ||
              referrer.includes('farcaster') || referrer.includes('base') ||
              referrer.includes('warpcast') || referrer.includes('wallet.farcaster')) {
            detected = true;
          }
        } catch (e) {
          // Referrer might not be accessible
        }
      }
      
      if (!detected) {
        // Check user agent
        const ua = navigator.userAgent?.toLowerCase() || '';
        if (ua.includes('farcaster') || ua.includes('base')) {
          detected = true;
        }
      }
      
      if (!detected) {
        // Final fallback - use the base function
        detected = isBaseMiniApp();
      }
      
      // Force update if detection changed
      if (detected !== isBaseApp) {
        setIsBaseApp(detected);
      }
    };
    
    // Check immediately
    check();
    // Check again after delays to catch any timing issues
    const t1 = setTimeout(check, 50);
    const t2 = setTimeout(check, 100);
    const t3 = setTimeout(check, 200);
    const t4 = setTimeout(check, 500);
    const t5 = setTimeout(check, 1000);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isBaseApp]);
  
  // Base App version - ONLY determined by Base app detection, not by variant
  if (isBaseApp) {
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
  }
  
  // Desktop/Web version (Sanko)
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

