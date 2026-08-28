import { useEffect, useState } from 'react';
import { TIDES_URL } from '../../config/diveConsole';

/**
 * 潮汐 TIDES — the ambient activity rail (dive-console overhaul step 3).
 * Reads the droplet-published static feed (tides.mjs; 2-min cron, 30s CDN cache)
 * — one ~9KB GET per minute while the menu is open, zero Firebase.
 * Renders nothing until the first successful fetch, so a feed outage costs
 * the menu nothing.
 */

type TideEvent = {
  t: number;
  kind: string;
  wallet?: string;
  survivalSec?: number;
  points?: number;
  won?: boolean;
};

const MAX_ROWS = 8;

function who(wallet: string | undefined): string {
  if (!wallet) return '???';
  if (wallet.startsWith('0x') && wallet.length > 12) return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  if (wallet.length > 10) return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
  return wallet;
}

function ago(t: number, lang: 'en' | 'zh', nowSec: number): string {
  const d = Math.max(0, nowSec - t);
  if (d < 3600) return lang === 'zh' ? `${Math.max(1, Math.floor(d / 60))}分钟前` : `${Math.max(1, Math.floor(d / 60))}m`;
  if (d < 86400) return lang === 'zh' ? `${Math.floor(d / 3600)}小时前` : `${Math.floor(d / 3600)}h`;
  return lang === 'zh' ? `${Math.floor(d / 86400)}天前` : `${Math.floor(d / 86400)}d`;
}

/** One line per event; unknown kinds (future feed versions) render nothing. */
function line(e: TideEvent, lang: 'en' | 'zh'): string | null {
  const w = who(e.wallet);
  const s = e.survivalSec !== undefined ? Math.round(e.survivalSec) : null;
  if (lang === 'zh') {
    switch (e.kind) {
      case 'reef_run': return `${w} 完成了 ${s ?? '?'} 秒潜水`;
      case 'chess_open': return `${w} 发起了国际象棋对局`;
      case 'chess_end': return `${w} 赢得了国际象棋对局`;
      case 'jackpot_enter': return `${w} 进入了礁石金库挑战`;
      case 'jackpot_score': return e.won ? null : `${w} 挑战了金库门槛`;
      case 'jackpot_won': return `${w} 夺得了金库！`;
      case 'jackpot_defended': return `卫冕者守住了金库`;
      case 'jackpot_funded': return `${w} 为奖池注资`;
      case 'jackpot_bar_reset': return `门槛已重置——金库开放`;
      default: return null;
    }
  }
  switch (e.kind) {
    case 'reef_run': return `${w} hauled a ${s ?? '?'}s dive`;
    case 'chess_open': return `${w} opened a chess match`;
    case 'chess_end': return `${w} won a chess match`;
    case 'jackpot_enter': return `${w} entered the reef jackpot`;
    case 'jackpot_score': return e.won ? null : `${w} challenged the bar`;
    case 'jackpot_won': return `${w} TOOK THE VAULT`;
    case 'jackpot_defended': return `the champion defended the vault`;
    case 'jackpot_funded': return `${w} fed the pot`;
    case 'jackpot_bar_reset': return `bar reset — the vault is open`;
    default: return null;
  }
}

export default function TidesRail({ lang }: { lang: 'en' | 'zh' }) {
  const [events, setEvents] = useState<TideEvent[] | null>(null);

  useEffect(() => {
    let alive = true;
    const ctl = new AbortController();
    const load = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(TIDES_URL, { signal: ctl.signal });
        if (!res.ok) return;
        const body = (await res.json()) as { events?: TideEvent[] };
        if (alive && Array.isArray(body.events)) setEvents(body.events);
      } catch {
        // feed unreachable — keep whatever we had (or stay hidden)
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    // Hidden tabs skip fetches (load() guards on visibility) — load the moment the
    // tab is shown again instead of waiting out the rest of the 60s tick.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      ctl.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!events || events.length === 0) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const rows = events
    .map((e) => ({ e, text: line(e, lang) }))
    .filter((r): r is { e: TideEvent; text: string } => r.text !== null)
    .slice(0, MAX_ROWS);
  if (rows.length === 0) return null;

  return (
    <div className="rw-drawer ra-tides">
      <div className="rw-drawer-head">
        {lang === 'zh' ? '潮汐' : 'TIDES'} <span className="rw-zh">· 潮汐</span>
        <span className="rw-drawer-hint">{lang === 'zh' ? '珊瑚礁实时动态' : 'live across the reef'}</span>
      </div>
      <ul className="ra-tides-list">
        {rows.map(({ e, text }) => (
          <li key={`${e.t}-${e.kind}-${e.wallet ?? ''}`} className={`ra-tides-row ra-tides-${e.kind}`}>
            <span className="ra-tides-ago">{ago(e.t, lang, nowSec)}</span>
            <span className="ra-tides-text">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
