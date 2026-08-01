import React from 'react';
import { WALLET_CONNECT_LEADERBOARD_BONUS } from '../firebaseLeaderboard';
import { getDefaultPieceSet } from '../config/chessPieceSets';

interface HowToContentProps {
  variant?: 'default' | 'mobile';
  /** When provided, shows a "Learn by playing" button that opens the Lawbster Chess School. */
  onStartTutorial?: () => void;
}

export const HowToContent: React.FC<HowToContentProps> = ({ variant = 'default', onStartTutorial }) => {
  const defaultPieceSet = getDefaultPieceSet();
  const pieceKey = [
    {
      code: 'p',
      name: 'Pawn',
      description: 'Walks 1 step forward (2 on its first move) and captures diagonally. Reach the far side and it becomes a Queen!',
    },
    {
      code: 'n',
      name: 'Knight',
      description: 'Jumps in an L shape — the only piece that can hop over others.',
    },
    {
      code: 'b',
      name: 'Bishop',
      description: 'Slides diagonally, as far as it wants.',
    },
    {
      code: 'r',
      name: 'Rook',
      description: 'Slides in straight lines — up, down, left, right.',
    },
    {
      code: 'q',
      name: 'Queen',
      description: 'The strongest piece — slides any direction, any distance.',
    },
    {
      code: 'k',
      name: 'King',
      description: 'Takes 1 step in any direction. Protect him — if he is trapped, you lose!',
    },
  ] as const;

  const howToMove = [
    'Tap one of your Blue pieces. Dots light up on every square it can go.',
    'Tap a lit square — your piece moves there.',
    'Land on a Red piece to capture it.',
    'Trap the Red King so it cannot escape — that is checkmate, and you win!',
  ];

  const vsClawbFlow = [
    'From Chess Home, keep VS AI selected and press Start Match.',
    'Pick your chess set, then Easy or Hard.',
    'Easy is great for learning. Hard is a serious chess engine — good luck.',
    'No wallet needed to play. Connect one if you want your wins saved to the leaderboard.',
  ];

  const pvpFlow = [
    'Connect your wallet (wagers use real tokens — this part is for grown-ups).',
    'Open PvP, create a match with your wager, or join someone else’s.',
    'When an opponent joins, the game starts — Blue always moves first.',
    'Win the game, win the pot.',
  ];

  return (
    <div className={`how-to-section ${variant === 'mobile' ? 'mobile' : ''}`}>
      <h4>How to Play Lawb Chess</h4>
      <div className="how-to-content">
        {onStartTutorial && (
          <p>
            <button type="button" className="how-to-school-btn" onClick={onStartTutorial}>
              🎓 New to chess? Learn by playing — open the Lawbster Chess School
            </button>
          </p>
        )}
        <p>
          <strong>What is Lawb Chess?</strong> Chess, but lawbsters. Your Blue army starts at the
          bottom, the Red army at the top. Blue always moves first. The goal: trap the other
          team&apos;s King.
        </p>

        <p><strong>Never played chess? Three things to know:</strong></p>
        <ul className="how-to-list">
          <li>You and your opponent take turns moving one piece at a time.</li>
          <li>Every piece moves its own special way (see the piece key below).</li>
          <li>You win by checkmate — trapping the enemy King with no escape.</li>
        </ul>

        <p><strong>How to move:</strong></p>
        <ol className="how-to-list how-to-list-numbered">
          {howToMove.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <p><strong>Play vs Clawb (the robot lawbster):</strong></p>
        <ol className="how-to-list how-to-list-numbered">
          {vsClawbFlow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <p><strong>Play vs real people (PvP wagers):</strong></p>
        <ol className="how-to-list how-to-list-numbered">
          {pvpFlow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p>
          <strong>New — On-Chain Wagers (beta):</strong> the ⛓ tab on the chess page plays wager
          chess where the blockchain itself is the referee and the bank: it checks every move,
          holds both stakes, and pays the winner automatically. Live on Arbitrum ($DMT),
          Ethereum ($CULT), and Base — plus ETH and NFT wagers.
        </p>

        <p><strong>Meet the pieces:</strong></p>
        {/* Class names deliberately avoid the "piece" substring — see ChessGame.css
            .how-to-key-* comment (theme catch-alls hijack [class*="piece"]). */}
        <ul className="how-to-list how-to-key-list">
          {pieceKey.map((piece) => (
            <li key={piece.code} className="how-to-key-row">
              <img
                src={defaultPieceSet.pieceImages[piece.code]}
                alt={`${piece.name} piece`}
                className="how-to-key-icon"
                loading="lazy"
              />
              <span>
                <strong>{piece.name}:</strong> {piece.description}
              </span>
            </li>
          ))}
        </ul>

        <p><strong>Words you will hear:</strong></p>
        <ul className="how-to-list">
          <li><strong>Check:</strong> your King is being attacked — you must save him right now.</li>
          <li><strong>Checkmate:</strong> the King cannot be saved. Game over.</li>
          <li><strong>Stalemate:</strong> no legal moves but the King is safe — the game is a tie.</li>
          <li><strong>Castling</strong> and <strong>en passant</strong> (two fancy chess moves) both work here.</li>
        </ul>

        <p>
          <strong>Leaderboard:</strong> Win = 3 points, tie = 1, loss = 0. Connecting a wallet for
          the first time adds {WALLET_CONNECT_LEADERBOARD_BONUS} bonus points, and your wins only
          save while a wallet is connected.
        </p>

        <p>
          <strong>For the curious — the contracts:</strong>{' '}
          <a
            href="https://arbiscan.io/address/0x3112AF5728520F52FD1C6710dD7bD52285a68e47"
            target="_blank"
            rel="noopener noreferrer"
            className="how-to-contract-link"
          >
            Arbitrum
          </a>
          {' · '}
          <a
            href="https://etherscan.io/address/0x6aa574B21212C6E7436Eb26A27542F1AEFfFad87"
            target="_blank"
            rel="noopener noreferrer"
            className="how-to-contract-link"
          >
            Ethereum
          </a>
          {' · '}
          <a
            href="https://basescan.org/address/0xBe0C68afE6f412d052C8fa306e9191D2b6371Aec"
            target="_blank"
            rel="noopener noreferrer"
            className="how-to-contract-link"
          >
            Base
          </a>
        </p>
      </div>
    </div>
  );
};
