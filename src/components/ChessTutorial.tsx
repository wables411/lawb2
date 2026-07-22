import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getDefaultPieceSet } from '../config/chessPieceSets';
import './ChessTutorial.css';

/*
 * Lawbster Chess School — Duolingo-style interactive tutorial.
 * Self-contained: no chess.js, no backend, progress in localStorage.
 *
 * Class names must never contain "piece", "square", "chessboard" or
 * "board-row" (theme catch-alls hijack those substrings — see the
 * .how-to-key-* comment in ChessGame.css). Colors/backgrounds that matter
 * are set inline because .lawb-app-dark-mode universal rules force
 * background:#000 / color:#00ff00 on anything without an inline style.
 */

const SIZE = 4;
const STORAGE_KEY = 'lawb_chess_school_v1';

type Board = Record<string, string>; // "c,r" -> piece code (lowercase blue, UPPERCASE red)
interface Cell { c: number; r: number }

const ck = (c: number, r: number) => `${c},${r}`;
const cellOf = (k: string): Cell => {
  const [c, r] = k.split(',').map(Number);
  return { c, r };
};
const inBoard = (c: number, r: number) => c >= 0 && c < SIZE && r >= 0 && r < SIZE;
const isRed = (p: string | undefined) => !!p && p >= 'A' && p <= 'Z';
const isBlue = (p: string | undefined) => !!p && p >= 'a' && p <= 'z';

type Goal =
  | { type: 'find'; target: Cell }
  | { type: 'reach'; star: Cell }
  | { type: 'capture'; count: number }
  | { type: 'promote' }
  | { type: 'escape' }
  | { type: 'mate' };

interface TutorialTask {
  prompt: string;
  board: Board;
  hero?: Cell; // the one blue piece the learner moves (absent for 'find' tasks)
  goal: Goal;
  success: string;
  wrongHint: string;
  moveLimit?: number;
}

interface TutorialLesson {
  id: string;
  title: string;
  icon: string; // piece code for the map icon
  intro: string;
  tasks: TutorialTask[];
}

const LESSONS: TutorialLesson[] = [
  {
    id: 'army',
    title: 'Your lawbster army',
    icon: 'k',
    intro: 'Chess is a battle between two lawbster armies. Blue (you) always moves first.',
    tasks: [
      {
        prompt: 'This is your Blue army. The King wears the tall crown — tap your King!',
        board: { '0,3': 'r', '1,3': 'k', '2,3': 'q', '3,3': 'b', '0,2': 'n', '2,2': 'p' },
        goal: { type: 'find', target: { c: 1, r: 3 } },
        success: 'That is him! Keep your King safe — if he is trapped, you lose.',
        wrongHint: 'Not that lawbster — look for the tall crown!',
      },
      {
        prompt: 'The Red army wants your King. Win by trapping THEIR King. Tap the Red King!',
        board: { '1,0': 'K', '0,1': 'P', '2,1': 'P', '1,3': 'k' },
        goal: { type: 'find', target: { c: 1, r: 0 } },
        success: 'Found him! Trap the Red King with no escape and you win — that is checkmate.',
        wrongHint: 'That is a red pawn — the King has the crown!',
      },
    ],
  },
  {
    id: 'pawn',
    title: 'The Pawn',
    icon: 'p',
    intro: 'Pawns are your little soldiers. They march forward — never backward.',
    tasks: [
      {
        prompt: 'Pawns walk 1 step forward — or 2 on their very first move. March to the ⭐!',
        board: { '1,3': 'p' },
        hero: { c: 1, r: 3 },
        goal: { type: 'reach', star: { c: 1, r: 1 } },
        success: 'Nice marching! Remember: 2 steps only on the first move.',
        wrongHint: 'Tap a blue dot to move your pawn.',
      },
      {
        prompt: 'Pawns cannot attack straight ahead — they capture DIAGONALLY. The red pawn blocks your path. Take the other one!',
        board: { '1,2': 'p', '1,1': 'P', '0,1': 'P' },
        hero: { c: 1, r: 2 },
        goal: { type: 'capture', count: 1 },
        success: 'Chomp! Diagonal capture — that is the pawn special move.',
        wrongHint: 'Tap the dot on the red pawn, one step diagonal.',
      },
      {
        prompt: 'The best pawn trick: reach the far side and it becomes a QUEEN. Go!',
        board: { '2,1': 'p' },
        hero: { c: 2, r: 1 },
        goal: { type: 'promote' },
        success: '✨ Your pawn became a Queen! Never give up on your pawns.',
        wrongHint: 'One more step forward!',
      },
    ],
  },
  {
    id: 'rook',
    title: 'The Rook',
    icon: 'r',
    intro: 'The Rook is a straight-line slider: up, down, left, right — as far as it wants.',
    tasks: [
      {
        prompt: 'Slide your Rook all the way to the ⭐!',
        board: { '0,3': 'r' },
        hero: { c: 0, r: 3 },
        goal: { type: 'reach', star: { c: 0, r: 0 } },
        success: 'Whoosh — one move, whole board. Rooks love open lines.',
        wrongHint: 'Straight lines only — tap a blue dot.',
      },
      {
        prompt: 'Pieces cannot jump over others (only Knights can). Your own pawn blocks the way up — capture the red pawn instead!',
        board: { '0,3': 'r', '0,2': 'p', '2,3': 'P' },
        hero: { c: 0, r: 3 },
        goal: { type: 'capture', count: 1 },
        success: 'Captured! Sliding pieces stop at the first thing in their path.',
        wrongHint: 'The way up is blocked — slide sideways onto the red pawn.',
      },
    ],
  },
  {
    id: 'bishop',
    title: 'The Bishop',
    icon: 'b',
    intro: 'The Bishop slides diagonally, as far as it wants. It lives on one color forever.',
    tasks: [
      {
        prompt: 'Slide your Bishop across the whole board to the ⭐!',
        board: { '0,3': 'b' },
        hero: { c: 0, r: 3 },
        goal: { type: 'reach', star: { c: 3, r: 0 } },
        success: 'Corner to corner in one move. Diagonals are powerful!',
        wrongHint: 'Diagonals only — tap a blue dot.',
      },
      {
        prompt: 'Catch the red pawn — diagonals only!',
        board: { '1,3': 'b', '3,1': 'P' },
        hero: { c: 1, r: 3 },
        goal: { type: 'capture', count: 1 },
        success: 'Got it! Bishops strike from far away.',
        wrongHint: 'Follow the diagonal to the red pawn.',
      },
    ],
  },
  {
    id: 'queen',
    title: 'The Queen',
    icon: 'q',
    intro: 'The Queen is Rook + Bishop in one lawbster: any direction, any distance.',
    tasks: [
      {
        prompt: 'Any direction, any distance. Take the Queen to the ⭐!',
        board: { '0,3': 'q' },
        hero: { c: 0, r: 3 },
        goal: { type: 'reach', star: { c: 3, r: 0 } },
        success: 'The strongest piece on the board — protect her well.',
        wrongHint: 'Straight OR diagonal — tap a blue dot.',
      },
      {
        prompt: 'Show off: capture BOTH red pawns in just two moves!',
        board: { '0,3': 'q', '0,0': 'P', '3,0': 'P' },
        hero: { c: 0, r: 3 },
        goal: { type: 'capture', count: 2 },
        moveLimit: 2,
        success: 'Double chomp! That is Queen power.',
        wrongHint: 'Straight up to the first pawn, then straight across!',
      },
    ],
  },
  {
    id: 'knight',
    title: 'The Knight',
    icon: 'n',
    intro: 'The Knight jumps in an L shape — and it is the ONLY piece that can hop over others.',
    tasks: [
      {
        prompt: 'Two steps one way, one step sideways — an L! Jump to the ⭐.',
        board: { '0,3': 'n' },
        hero: { c: 0, r: 3 },
        goal: { type: 'reach', star: { c: 1, r: 1 } },
        success: 'That is the L-jump. Tricky at first — soon your favorite.',
        wrongHint: 'Knights only land on the L spots — tap a blue dot.',
      },
      {
        prompt: 'A wall of your own pawns? No problem — Knights JUMP. Hop the wall and capture the red pawn!',
        board: {
          '1,1': 'n',
          '0,0': 'p', '1,0': 'p', '2,0': 'p', '0,1': 'p', '2,1': 'p', '0,2': 'p', '1,2': 'p', '2,2': 'p',
          '3,0': 'P',
        },
        hero: { c: 1, r: 1 },
        goal: { type: 'capture', count: 1 },
        success: 'Boing! No wall can stop a Knight.',
        wrongHint: 'Jump over the wall — land on the red pawn.',
      },
    ],
  },
  {
    id: 'king',
    title: 'King, Check & Checkmate',
    icon: 'k',
    intro: 'The King takes one careful step at a time. Lose him and you lose the game.',
    tasks: [
      {
        prompt: 'Kings move 1 step in any direction. Walk your King to the ⭐ (it takes two moves).',
        board: { '1,2': 'k' },
        hero: { c: 1, r: 2 },
        goal: { type: 'reach', star: { c: 3, r: 0 } },
        success: 'Slow and steady — Kings never rush.',
        wrongHint: 'One step at a time — tap a blue dot.',
      },
      {
        prompt: 'CHECK! The Red Rook attacks your King. You MUST move somewhere safe — tap a safe square!',
        board: { '1,1': 'k', '3,1': 'R' },
        hero: { c: 1, r: 1 },
        goal: { type: 'escape' },
        success: 'Safe! When you hear "check", saving the King comes first.',
        wrongHint: 'The Red Rook still sees that square — pick another!',
      },
      {
        prompt: 'Now YOU win one. Checkmate = attacked King with no escape. Your King guards the corner — slide your Rook to finish it!',
        board: { '3,3': 'r', '0,2': 'k', '0,0': 'K' },
        hero: { c: 3, r: 3 },
        goal: { type: 'mate' },
        success: '🦞 CHECKMATE! That is how you win at Lawb Chess. School complete!',
        wrongHint: 'Close — the Red King can still escape. Try again!',
      },
    ],
  },
];

/* ---------- move + attack generation ---------- */

const DIAG: Cell[] = [{ c: 1, r: 1 }, { c: 1, r: -1 }, { c: -1, r: 1 }, { c: -1, r: -1 }];
const ORTHO: Cell[] = [{ c: 1, r: 0 }, { c: -1, r: 0 }, { c: 0, r: 1 }, { c: 0, r: -1 }];
const L_JUMPS: Cell[] = [
  { c: 1, r: 2 }, { c: 2, r: 1 }, { c: -1, r: 2 }, { c: -2, r: 1 },
  { c: 1, r: -2 }, { c: 2, r: -1 }, { c: -1, r: -2 }, { c: -2, r: -1 },
];

function slide(board: Board, from: Cell, dirs: Cell[], forBlue: boolean): Cell[] {
  const out: Cell[] = [];
  for (const d of dirs) {
    let c = from.c + d.c;
    let r = from.r + d.r;
    while (inBoard(c, r)) {
      const occ = board[ck(c, r)];
      if (!occ) {
        out.push({ c, r });
      } else {
        if (forBlue ? isRed(occ) : isBlue(occ)) out.push({ c, r });
        break;
      }
      c += d.c;
      r += d.r;
    }
  }
  return out;
}

/** Legal destinations for the blue hero piece (red never moves in lessons). */
function heroMoves(board: Board, from: Cell): Cell[] {
  const p = board[ck(from.c, from.r)];
  if (!isBlue(p)) return [];
  switch (p) {
    case 'p': {
      const out: Cell[] = [];
      if (inBoard(from.c, from.r - 1) && !board[ck(from.c, from.r - 1)]) {
        out.push({ c: from.c, r: from.r - 1 });
        if (from.r === 3 && !board[ck(from.c, from.r - 2)]) out.push({ c: from.c, r: from.r - 2 });
      }
      for (const dc of [-1, 1]) {
        const c = from.c + dc;
        const r = from.r - 1;
        if (inBoard(c, r) && isRed(board[ck(c, r)])) out.push({ c, r });
      }
      return out;
    }
    case 'r': return slide(board, from, ORTHO, true);
    case 'b': return slide(board, from, DIAG, true);
    case 'q': return slide(board, from, [...ORTHO, ...DIAG], true);
    case 'n':
      return L_JUMPS
        .map((d) => ({ c: from.c + d.c, r: from.r + d.r }))
        .filter((t) => inBoard(t.c, t.r) && !isBlue(board[ck(t.c, t.r)]));
    case 'k':
      return [...ORTHO, ...DIAG]
        .map((d) => ({ c: from.c + d.c, r: from.r + d.r }))
        .filter((t) => inBoard(t.c, t.r) && !isBlue(board[ck(t.c, t.r)]));
    default:
      return [];
  }
}

/** Every cell attacked by one side (occupied cells included, i.e. defended). */
function attackedCells(board: Board, byRed: boolean): Set<string> {
  const out = new Set<string>();
  for (const [k, p] of Object.entries(board)) {
    if (byRed !== isRed(p)) continue;
    const from = cellOf(k);
    const code = p.toLowerCase();
    if (code === 'p') {
      const dr = byRed ? 1 : -1; // red marches down the board, blue up
      for (const dc of [-1, 1]) {
        if (inBoard(from.c + dc, from.r + dr)) out.add(ck(from.c + dc, from.r + dr));
      }
    } else if (code === 'n') {
      for (const d of L_JUMPS) {
        if (inBoard(from.c + d.c, from.r + d.r)) out.add(ck(from.c + d.c, from.r + d.r));
      }
    } else if (code === 'k') {
      for (const d of [...ORTHO, ...DIAG]) {
        if (inBoard(from.c + d.c, from.r + d.r)) out.add(ck(from.c + d.c, from.r + d.r));
      }
    } else {
      const dirs = code === 'r' ? ORTHO : code === 'b' ? DIAG : [...ORTHO, ...DIAG];
      for (const d of dirs) {
        let c = from.c + d.c;
        let r = from.r + d.r;
        while (inBoard(c, r)) {
          out.add(ck(c, r));
          if (board[ck(c, r)]) break;
          c += d.c;
          r += d.r;
        }
      }
    }
  }
  return out;
}

function redKingMated(board: Board): boolean {
  const kingEntry = Object.entries(board).find(([, p]) => p === 'K');
  if (!kingEntry) return false;
  const king = cellOf(kingEntry[0]);
  const atk = attackedCells(board, false);
  if (!atk.has(ck(king.c, king.r))) return false;
  for (const d of [...ORTHO, ...DIAG]) {
    const c = king.c + d.c;
    const r = king.r + d.r;
    if (!inBoard(c, r)) continue;
    if (isRed(board[ck(c, r)])) continue;
    if (!atk.has(ck(c, r))) return false; // empty or capturable square that is safe
  }
  return true;
}

/* ---------- progress persistence ---------- */

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* first visit or blocked storage */ }
  return new Set();
}

function saveProgress(done: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
  } catch { /* storage blocked — progress just won't persist */ }
}

/* ---------- component ---------- */

interface ChessTutorialProps {
  onClose: () => void;
  onPlayClawb?: () => void;
}

type Feedback = { text: string; tone: 'info' | 'good' | 'bad' } | null;

/* Inline-style palette (survives the theme-toggle universal overrides). */
const solid = (color: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(${color}, ${color})`,
});
const PANEL_BG = solid('#101b30');
const CELL_LIGHT = '#dbe5f2';
const CELL_DARK = '#8fa9c9';
const TEXT_MAIN = '#eef4fd';
const TEXT_DIM = '#a8bad4';
const GOLD = '#ffd478';

export const ChessTutorial: React.FC<ChessTutorialProps> = ({ onClose, onPlayClawb }) => {
  const pieceImages = useMemo(() => getDefaultPieceSet().pieceImages, []);
  const [completed, setCompleted] = useState<Set<string>>(loadProgress);
  const [lessonIdx, setLessonIdx] = useState<number | null>(null); // null = lesson map
  const [taskIdx, setTaskIdx] = useState(0);
  const [board, setBoard] = useState<Board>({});
  const [hero, setHero] = useState<Cell | null>(null);
  const [movesUsed, setMovesUsed] = useState(0);
  const [captured, setCaptured] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [locked, setLocked] = useState(false); // input freeze during success/reset pauses

  const lesson = lessonIdx === null ? null : LESSONS[lessonIdx];
  const task = lesson ? lesson.tasks[taskIdx] : null;

  const loadTask = useCallback((li: number, ti: number) => {
    const t = LESSONS[li].tasks[ti];
    setLessonIdx(li);
    setTaskIdx(ti);
    setBoard({ ...t.board });
    setHero(t.hero ? { ...t.hero } : null);
    setMovesUsed(0);
    setCaptured(0);
    setFeedback({ text: t.prompt, tone: 'info' });
    setFlash(false);
    setShake(false);
    setLocked(false);
  }, []);

  const nudge = useCallback((text: string) => {
    setFeedback({ text, tone: 'bad' });
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  }, []);

  const finishTask = useCallback((successMsg: string) => {
    if (lessonIdx === null) return;
    setLocked(true);
    setFlash(true);
    setFeedback({ text: successMsg, tone: 'good' });
    const l = LESSONS[lessonIdx];
    const isLastTask = taskIdx >= l.tasks.length - 1;
    window.setTimeout(() => {
      if (!isLastTask) {
        loadTask(lessonIdx, taskIdx + 1);
      } else {
        setCompleted((prev) => {
          const next = new Set(prev);
          next.add(l.id);
          saveProgress(next);
          return next;
        });
        setLessonIdx(null);
      }
    }, 1400);
  }, [lessonIdx, taskIdx, loadTask]);

  const resetTask = useCallback((msg: string) => {
    if (lessonIdx === null) return;
    setLocked(true);
    setFeedback({ text: msg, tone: 'bad' });
    const li = lessonIdx;
    const ti = taskIdx;
    window.setTimeout(() => loadTask(li, ti), 1100);
  }, [lessonIdx, taskIdx, loadTask]);

  // Legal destinations for the current hero.
  const dots = useMemo(() => {
    if (!task || !hero || locked) return new Set<string>();
    return new Set(heroMoves(board, hero).map((m) => ck(m.c, m.r)));
  }, [task, hero, board, locked]);

  // For the escape lesson: squares the red army attacks (computed without the
  // hero on the board, so stepping backward along the attack line stays unsafe).
  const redAttacks = useMemo(() => {
    if (!task || task.goal.type !== 'escape' || !hero) return new Set<string>();
    const ghost = { ...board };
    delete ghost[ck(hero.c, hero.r)];
    return attackedCells(ghost, true);
  }, [task, board, hero]);

  const handleMove = useCallback((to: Cell) => {
    if (!task || !hero || lessonIdx === null) return;
    const goal = task.goal;

    if (goal.type === 'escape' && redAttacks.has(ck(to.c, to.r))) {
      nudge(task.wrongHint);
      return;
    }

    const next = { ...board };
    const heroCode = next[ck(hero.c, hero.r)];
    const target = next[ck(to.c, to.r)];
    const capturedNow = captured + (isRed(target) ? 1 : 0);
    delete next[ck(hero.c, hero.r)];
    const promoted = heroCode === 'p' && to.r === 0;
    next[ck(to.c, to.r)] = promoted ? 'q' : heroCode;
    const used = movesUsed + 1;

    setBoard(next);
    setHero({ ...to });
    setMovesUsed(used);
    setCaptured(capturedNow);

    switch (goal.type) {
      case 'reach':
        if (to.c === goal.star.c && to.r === goal.star.r) return finishTask(task.success);
        break;
      case 'capture':
        if (capturedNow >= goal.count) return finishTask(task.success);
        break;
      case 'promote':
        if (promoted) return finishTask(task.success);
        break;
      case 'escape':
        return finishTask(task.success); // unsafe taps were rejected above
      case 'mate':
        if (redKingMated(next)) return finishTask(task.success);
        return resetTask(task.wrongHint);
      default:
        break;
    }

    if (task.moveLimit && used >= task.moveLimit) {
      return resetTask('Out of moves — let’s try that again!');
    }
    setFeedback({ text: goal.type === 'reach' ? 'Good — keep going to the ⭐!' : 'Good move — keep going!', tone: 'info' });
  }, [task, hero, lessonIdx, board, captured, movesUsed, redAttacks, nudge, finishTask, resetTask]);

  const handleCellTap = useCallback((cell: Cell) => {
    if (!task || locked) return;
    if (task.goal.type === 'find') {
      const { target } = task.goal;
      if (cell.c === target.c && cell.r === target.r) {
        finishTask(task.success);
      } else if (board[ck(cell.c, cell.r)]) {
        nudge(task.wrongHint);
      }
      return;
    }
    if (dots.has(ck(cell.c, cell.r))) {
      handleMove(cell);
    } else if (board[ck(cell.c, cell.r)] && !(hero && cell.c === hero.c && cell.r === hero.r)) {
      nudge('That one can’t move right now — follow the blue dots!');
    }
  }, [task, locked, board, dots, hero, nudge, finishTask, handleMove]);

  // Escape-key closes the school.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const star = task && task.goal.type === 'reach' ? task.goal.star : null;
  const inCheck = task?.goal.type === 'escape';
  const allDone = LESSONS.every((l) => completed.has(l.id));

  /* ---------- render helpers ---------- */

  const renderBoard = () => (
    <div className={`cschool-grid ${shake ? 'cschool-shake' : ''}`} role="group" aria-label="Practice board">
      {Array.from({ length: SIZE * SIZE }, (_, i) => {
        const c = i % SIZE;
        const r = Math.floor(i / SIZE);
        const k = ck(c, r);
        const piece = board[k];
        const isHero = !!hero && hero.c === c && hero.r === r;
        const isDot = dots.has(k);
        const cellBg = (r + c) % 2 === 0 ? CELL_LIGHT : CELL_DARK;
        return (
          <button
            key={k}
            type="button"
            className="cschool-cell"
            style={{
              ...solid(cellBg),
              boxShadow: isHero
                ? `inset 0 0 0 3px ${inCheck ? '#ff5a4d' : GOLD}`
                : undefined,
              cursor: isDot || task?.goal.type === 'find' ? 'pointer' : 'default',
            }}
            onClick={() => handleCellTap({ c, r })}
            aria-label={`Row ${r + 1} column ${c + 1}${piece ? ', occupied' : ''}`}
          >
            {star && star.c === c && star.r === r && !piece && (
              <span className="cschool-star" aria-hidden="true">⭐</span>
            )}
            {piece && (
              <span
                className={`cschool-fig ${isHero && !locked ? 'cschool-fig-hero' : ''}`}
                style={{ backgroundImage: `url(${pieceImages[piece]})` }}
              />
            )}
            {isDot && (
              <span
                className="cschool-dot"
                style={solid(isRed(piece) ? 'rgba(255, 90, 77, 0.85)' : 'rgba(64, 129, 222, 0.85)')}
              />
            )}
          </button>
        );
      })}
      {flash && <div className="cschool-flash" style={solid('rgba(72, 199, 116, 0.28)')} />}
    </div>
  );

  const renderLesson = () => {
    if (!lesson || !task) return null;
    return (
      <>
        <div className="cschool-lesson-head">
          <button
            type="button"
            className="cschool-linkbtn"
            style={{ color: TEXT_DIM, ...solid('transparent') }}
            onClick={() => setLessonIdx(null)}
          >
            ← Lessons
          </button>
          <div className="cschool-pips">
            {lesson.tasks.map((_, i) => (
              <span
                key={i}
                className="cschool-pip"
                style={solid(i < taskIdx ? '#48c774' : i === taskIdx ? GOLD : '#33415c')}
              />
            ))}
          </div>
        </div>
        <div className="cschool-lesson-title" style={{ color: TEXT_MAIN }}>
          <img src={pieceImages[lesson.icon]} alt="" className="cschool-title-icon" />
          {lesson.title}
        </div>
        {renderBoard()}
        <div
          className="cschool-feedback"
          style={{
            color: feedback?.tone === 'good' ? '#7ee2a1' : feedback?.tone === 'bad' ? '#ff9d94' : TEXT_MAIN,
          }}
          aria-live="polite"
        >
          {feedback?.text}
        </div>
      </>
    );
  };

  const renderMap = () => (
    <>
      <div className="cschool-map-intro" style={{ color: TEXT_DIM }}>
        Seven tiny lessons. Learn each lawbster by moving it — no reading required.
      </div>
      <div className="cschool-map">
        {LESSONS.map((l, i) => {
          const done = completed.has(l.id);
          return (
            <button
              key={l.id}
              type="button"
              className="cschool-map-item"
              style={{ ...solid(done ? '#15301f' : '#182540'), color: TEXT_MAIN }}
              onClick={() => loadTask(i, 0)}
            >
              <img src={pieceImages[l.icon]} alt="" className="cschool-map-icon" />
              <span className="cschool-map-label">
                <span className="cschool-map-num" style={{ color: TEXT_DIM }}>Lesson {i + 1}</span>
                {l.title}
              </span>
              <span className="cschool-map-check" style={{ color: done ? '#48c774' : '#33415c' }}>
                {done ? '✓' : '›'}
              </span>
            </button>
          );
        })}
        <div
          className="cschool-boss"
          style={{ ...solid(allDone ? '#3a2c10' : '#182540'), color: TEXT_MAIN }}
        >
          <span className="cschool-boss-emoji" aria-hidden="true">🦞</span>
          <span className="cschool-map-label">
            <span className="cschool-map-num" style={{ color: allDone ? GOLD : TEXT_DIM }}>
              {allDone ? 'Graduation unlocked!' : 'Graduation'}
            </span>
            Beat Clawb the robot lawbster on Easy
          </span>
          {onPlayClawb && (
            <button
              type="button"
              className="cschool-boss-btn"
              style={{ ...solid(GOLD), color: '#20293c' }}
              onClick={onPlayClawb}
            >
              Play Clawb
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="cschool-backdrop" style={solid('rgba(4, 8, 16, 0.82)')} onClick={onClose}>
      <div
        className="cschool-panel"
        style={{ ...PANEL_BG, color: TEXT_MAIN }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Lawbster Chess School"
      >
        <div className="cschool-head">
          <div className="cschool-title" style={{ color: GOLD }}>🎓 Lawbster Chess School</div>
          <button
            type="button"
            className="cschool-close"
            style={{ color: TEXT_MAIN, ...solid('transparent') }}
            onClick={onClose}
            aria-label="Close tutorial"
          >
            ✕
          </button>
        </div>
        {lessonIdx === null ? renderMap() : renderLesson()}
      </div>
    </div>
  );
};
