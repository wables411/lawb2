// On-chain chess lobby (Phase 4): pick a wager + create a game, or open one by code.
//
// Visual note: colors/backgrounds are set INLINE (linear-gradient / explicit color)
// rather than via a stylesheet. The chess page's .lawb-app-dark-mode universal rules
// force background:#000 / color:#00ff00 on any element WITHOUT an inline background-image
// or color — the same reason ChessTutorial styles inline. Layout-only props may use CSS.

import React, { useState } from 'react';
import { parseEther, parseUnits, zeroAddress } from 'viem';
import { useAccount, useChainId, usePublicClient, useSwitchChain } from 'wagmi';
import { useOnchainChessActions } from '../../hooks/useOnchainChessActions';
import { LAWB_CHESS_CHAIN_IDS, LAWB_CHESS_NFT_COLLECTIONS, LAWB_CHESS_WAGER_TOKENS, getLawbChessAddress } from '../../config/lawbChessOnchain';
import { WagerKind } from '../../utils/lawbChessBoard';
import { stringToCode, type GameCode } from '../../utils/lawbChessMoves';

type WagerType = 'native' | 'erc20' | 'erc721' | 'erc1155';

const CHAINS: { id: number; name: string }[] = [
  { id: LAWB_CHESS_CHAIN_IDS.arbitrum, name: 'Arbitrum' },
  { id: LAWB_CHESS_CHAIN_IDS.base, name: 'Base' },
  { id: LAWB_CHESS_CHAIN_IDS.ethereum, name: 'Ethereum' },
  { id: LAWB_CHESS_CHAIN_IDS.baseSepolia, name: 'Base Sepolia (testnet)' },
];

const ARBITRUM_ID = LAWB_CHESS_CHAIN_IDS.arbitrum;
const DEFAULT_TOKEN = LAWB_CHESS_WAGER_TOKENS[ARBITRUM_ID]?.[0];

function randomCode(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
const isAddr = (a: string): a is `0x${string}` => /^0x[0-9a-fA-F]{40}$/.test(a.trim());

/* ---- deep-sea palette (inline so the theme-nuke can't blank it) ---- */
const C = {
  panel: 'linear-gradient(180deg, #0e1a2e, #0a1322)',
  card: 'linear-gradient(180deg, #101d33, #0b1626)',
  inset: 'linear-gradient(180deg, #081019, #0a1322)',
  chipOff: 'linear-gradient(180deg, #0e1a2e, #0c1728)',
  cyan: '#3fe0d6', gold: '#f2b73c', ink: '#dbe6f5', muted: '#8298b8', muted2: '#5f728f',
  line: 'rgba(86,196,214,.18)', line2: 'rgba(86,196,214,.34)', goldline: 'rgba(242,183,60,.42)',
};
const solid = (c: string) => `linear-gradient(${c}, ${c})`;

export interface OnchainChessLobbyProps {
  onEnterGame: (code: GameCode) => void;
  onPlayDemo: () => void;
}

export const OnchainChessLobby: React.FC<OnchainChessLobbyProps> = ({ onEnterGame, onPlayDemo }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const actions = useOnchainChessActions();

  const [wagerType, setWagerType] = useState<WagerType>('erc20');
  const [amount, setAmount] = useState('1000');
  const [decimals, setDecimals] = useState(DEFAULT_TOKEN ? String(DEFAULT_TOKEN.decimals) : '18');
  const [tokenAddr, setTokenAddr] = useState<string>(DEFAULT_TOKEN?.address ?? '');
  const [nftAddr, setNftAddr] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [minutes, setMinutes] = useState('5');
  const [increment, setIncrement] = useState('0');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const deployedHere = !!getLawbChessAddress(chainId);
  const nftCollections = LAWB_CHESS_NFT_COLLECTIONS[chainId] ?? [];
  const featuredTokens = LAWB_CHESS_WAGER_TOKENS[chainId] ?? [];
  const isNft = wagerType === 'erc721' || wagerType === 'erc1155';
  const chainName = CHAINS.find((c) => c.id === chainId)?.name ?? `chain ${chainId}`;

  // Which chip is active: DMT (featured erc20) / ETH (native) / NFT / Custom (erc20, no featured match)
  const featuredMatch = featuredTokens.find((t) => t.address.toLowerCase() === tokenAddr.toLowerCase());
  const activeChip: 'dmt' | 'eth' | 'nft' | 'custom' =
    wagerType === 'native' ? 'eth' : isNft ? 'nft' : featuredMatch ? 'dmt' : 'custom';
  const unitLabel = wagerType === 'native' ? 'ETH' : featuredMatch ? featuredMatch.label.split(' ')[0] : 'TOKEN';

  const pickDmt = () => {
    setWagerType('erc20');
    if (DEFAULT_TOKEN) { setTokenAddr(DEFAULT_TOKEN.address); setDecimals(String(DEFAULT_TOKEN.decimals)); }
  };
  const pickEth = () => setWagerType('native');
  const pickNft = () => setWagerType('erc721');
  const pickCustom = () => { setWagerType('erc20'); setTokenAddr(''); };

  const waitFor = async (hash: `0x${string}`) => {
    if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
  };

  const create = async () => {
    setErr(null);
    const baseTimeSec = Math.round(parseFloat(minutes) * 60);
    if (!(baseTimeSec >= 30 && baseTimeSec <= 7 * 24 * 3600)) { setErr('Time must be 30s–7 days'); return; }
    const incrementSec = Math.max(0, Math.round(parseFloat(increment) || 0));
    if (incrementSec > 86400) { setErr('Increment must be ≤ 1 day (86400s)'); return; }
    const code = stringToCode(randomCode());
    setBusy(true);
    try {
      if (wagerType === 'native') {
        let wager: bigint;
        try { wager = parseEther(amount); } catch { throw new Error('Invalid amount'); }
        if (wager <= 0n) throw new Error('Wager must be > 0');
        setStatus('Creating game…');
        await actions.createGame({ code, kind: WagerKind.NATIVE, token: zeroAddress, wager, baseTimeSec, incrementSec });
      } else if (wagerType === 'erc20') {
        if (!isAddr(tokenAddr)) throw new Error('Invalid token address');
        const dec = Math.max(0, Math.round(parseFloat(decimals) || 18));
        let wager: bigint;
        try { wager = parseUnits(amount, dec); } catch { throw new Error('Invalid amount'); }
        if (wager <= 0n) throw new Error('Wager must be > 0');
        setStatus('Approving token…');
        await waitFor(await actions.approveErc20(tokenAddr, wager));
        setStatus('Creating game…');
        await actions.createGame({ code, kind: WagerKind.ERC20, token: tokenAddr, wager, baseTimeSec, incrementSec });
      } else if (wagerType === 'erc721') {
        if (!isAddr(nftAddr)) throw new Error('Invalid NFT address');
        const id = BigInt(tokenId || '0');
        setStatus('Approving NFT…');
        await waitFor(await actions.approveErc721(nftAddr, id));
        setStatus('Creating game…');
        await actions.createGameERC721({ code, nft: nftAddr, tokenId: id, baseTimeSec, incrementSec });
      } else {
        if (!isAddr(nftAddr)) throw new Error('Invalid NFT address');
        const id = BigInt(tokenId || '0');
        const qty = BigInt(quantity || '1');
        if (qty <= 0n) throw new Error('Quantity must be > 0');
        setStatus('Approving NFT…');
        await waitFor(await actions.setNftApprovalForAll(nftAddr, true));
        setStatus('Creating game…');
        await actions.createGameERC1155({ code, nft: nftAddr, tokenId: id, quantity: qty, baseTimeSec, incrementSec });
      }
      onEnterGame(code);
    } catch (e) {
      setErr((e as Error)?.message?.split('\n')[0] ?? 'create failed');
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  const open = () => {
    const trimmed = joinCode.trim().toLowerCase();
    if (!trimmed) { setErr('Enter a game code'); return; }
    if (trimmed.length > 6) { setErr('Codes are at most 6 characters'); return; }
    onEnterGame(stringToCode(trimmed));
  };

  const chipStyle = (on: boolean, accent = C.line2): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 13px', borderRadius: 10,
    cursor: 'pointer', fontSize: 12.5, fontWeight: 700, letterSpacing: '.02em',
    color: on ? C.ink : C.muted,
    backgroundImage: on ? solid('rgba(63,224,214,.10)') : C.chipOff,
    border: `1px solid ${on ? accent : C.line}`,
    boxShadow: on ? `0 0 0 1px ${accent}` : 'none',
  });

  const createDisabled = !isConnected || !deployedHere || busy;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 16, padding: 18, maxWidth: 440, margin: '0 auto',
      fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif",
      color: C.ink, backgroundImage: C.panel, border: `1px solid ${C.line}`, borderRadius: 16,
      boxShadow: '0 24px 60px rgba(0,0,0,.45)',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 18,
            backgroundImage: solid('#0c2436'), border: `1px solid ${C.line2}`, boxShadow: `inset 0 0 16px rgba(63,224,214,.25)`,
          }}>⛓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', color: C.ink }}>
              Lawbster <span style={{ color: C.cyan }}>Chess</span>
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted2 }}>
              On-Chain Arena
            </div>
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'ui-monospace, monospace', fontSize: 11,
          padding: '7px 11px', borderRadius: 999, color: deployedHere ? C.muted : C.gold,
          backgroundImage: solid('#0a1322'), border: `1px solid ${deployedHere ? C.line : C.goldline}`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%',
            backgroundImage: solid(deployedHere ? C.cyan : C.gold),
            boxShadow: `0 0 8px ${deployedHere ? C.cyan : C.gold}` }} />
          {chainName}
        </span>
      </div>

      {/* connection / chain gate */}
      {!isConnected && (
        <div style={{ fontSize: 12.5, color: C.gold, backgroundImage: solid('rgba(242,183,60,.08)'),
          border: `1px solid ${C.goldline}`, borderRadius: 11, padding: '11px 13px' }}>
          Connect your wallet to create or join a wager.
        </div>
      )}
      {isConnected && !deployedHere && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
          fontSize: 12.5, color: C.ink, backgroundImage: solid('rgba(242,183,60,.08)'),
          border: `1px solid ${C.goldline}`, borderRadius: 11, padding: '11px 13px' }}>
          <span>On-chain chess runs on <strong style={{ color: C.gold }}>Arbitrum</strong> ($DMT).</span>
          <button type="button" onClick={() => switchChain?.({ chainId: ARBITRUM_ID })} style={primaryBtn(false)}>
            Switch to Arbitrum
          </button>
        </div>
      )}

      {/* create a wager */}
      <div style={{ backgroundImage: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16,
        opacity: createDisabled && isConnected && !deployedHere ? 0.55 : 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 3, color: C.ink }}>
          Create a wager
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.45 }}>
          The blockchain is referee and bank — it validates every move on-chain, escrows both stakes, and pays the winner automatically.
        </div>

        <fieldset disabled={createDisabled} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          {/* wager token chips */}
          <FieldLabel>Wager token</FieldLabel>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            <button type="button" onClick={pickDmt} style={chipStyle(activeChip === 'dmt', C.goldline)}>
              <TokenGlyph on={activeChip === 'dmt'} char="◆" /> DMT
            </button>
            <button type="button" onClick={pickEth} style={chipStyle(activeChip === 'eth')}>
              <TokenGlyph on={activeChip === 'eth'} char="Ξ" /> ETH
            </button>
            <button type="button" onClick={pickNft} style={chipStyle(activeChip === 'nft')}>
              <TokenGlyph on={activeChip === 'nft'} char="◇" /> NFT
            </button>
            <button type="button" onClick={pickCustom} style={chipStyle(activeChip === 'custom')}>
              <TokenGlyph on={activeChip === 'custom'} char="+" /> Custom
            </button>
          </div>

          {/* amount (token/native wagers) */}
          {!isNft && (
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>Amount — each player stakes</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundImage: C.inset,
                border: `1px solid ${C.line}`, borderRadius: 12, padding: '6px 10px' }}>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal"
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none',
                    color: C.ink, fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: 700 }} />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 700, color: C.gold }}>{unitLabel}</span>
              </div>
              {activeChip === 'custom' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input value={tokenAddr} onChange={(e) => setTokenAddr(e.target.value)} placeholder="Token address 0x…" style={textInput()} />
                  <input value={decimals} onChange={(e) => setDecimals(e.target.value)} placeholder="dec" style={{ ...textInput(), maxWidth: 64, textAlign: 'center' }} />
                </div>
              )}
            </div>
          )}

          {/* NFT wager fields */}
          {isNft && (
            <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FieldLabel>NFT wager</FieldLabel>
              <div style={{ display: 'flex', gap: 7 }}>
                <button type="button" onClick={() => setWagerType('erc721')} style={chipStyle(wagerType === 'erc721')}>ERC-721</button>
                <button type="button" onClick={() => setWagerType('erc1155')} style={chipStyle(wagerType === 'erc1155')}>ERC-1155</button>
              </div>
              {nftCollections.length > 0 && (
                <select value={nftAddr} onChange={(e) => setNftAddr(e.target.value)} style={textInput()}>
                  <option value="">— select / custom collection —</option>
                  {nftCollections.map((c) => <option key={c.address} value={c.address}>{c.label}</option>)}
                </select>
              )}
              <input value={nftAddr} onChange={(e) => setNftAddr(e.target.value)} placeholder="Collection address 0x…" style={textInput()} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Token ID" style={textInput()} />
                {wagerType === 'erc1155' && (
                  <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" style={{ ...textInput(), maxWidth: 72 }} />
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted2 }}>Same-collection wager · winner takes both · no house fee.</div>
            </div>
          )}

          {/* time control */}
          <FieldLabel>Time control</FieldLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundImage: C.inset,
                border: `1px solid ${C.line}`, borderRadius: 10, padding: '8px 10px' }}>
                <input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal"
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none',
                    color: C.ink, fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700 }} />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, color: C.muted2, textTransform: 'uppercase', letterSpacing: '.1em' }}>min each</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundImage: C.inset,
                border: `1px solid ${C.line}`, borderRadius: 10, padding: '8px 10px' }}>
                <input value={increment} onChange={(e) => setIncrement(e.target.value)} inputMode="numeric"
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none',
                    color: C.ink, fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700 }} />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, color: C.muted2, textTransform: 'uppercase', letterSpacing: '.1em' }}>+sec inc</span>
              </div>
            </div>
          </div>

          <button type="button" onClick={create} disabled={busy} style={primaryBtn(true)}>
            {busy ? (status ?? 'Working…') : 'Create match & get code'}
          </button>
        </fieldset>

        <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>
          <span style={{ color: C.cyan, flex: '0 0 auto' }}>⛓</span>
          <span>Token wagers take two transactions (approve, then create). The contract escrows both stakes and settles on checkmate, resign, or timeout — no middleman.</span>
        </div>
      </div>

      {/* open by code */}
      <div style={{ backgroundImage: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10, color: C.ink }}>
          Open a game by code
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={joinCode} maxLength={6} onChange={(e) => setJoinCode(e.target.value)} placeholder="ENTER CODE"
            style={{ flex: 1, minWidth: 0, backgroundImage: C.inset, border: `1px solid ${C.line}`, borderRadius: 10,
              color: C.ink, fontFamily: 'ui-monospace, monospace', fontSize: 15, letterSpacing: '.25em',
              textAlign: 'center', textTransform: 'uppercase', padding: '11px', outline: 'none' }} />
          <button type="button" onClick={open} disabled={busy} style={secondaryBtn()}>Open</button>
        </div>
        <div style={{ fontSize: 11.5, color: C.muted2, marginTop: 8 }}>Join to play, or open any code to spectate a live match.</div>
      </div>

      {err && (
        <div style={{ color: '#ff9d94', fontSize: 12, backgroundImage: solid('rgba(232,86,74,.10)'),
          border: '1px solid rgba(232,86,74,.35)', borderRadius: 10, padding: '9px 12px' }}>
          {err}
        </div>
      )}

      {/* practice */}
      <button type="button" onClick={onPlayDemo} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12,
        border: `1px dashed ${C.line}`, borderRadius: 12, cursor: 'pointer',
        backgroundImage: solid('rgba(63,224,214,.03)'), color: C.muted, fontSize: 12, fontWeight: 600,
      }}>
        ▶ <span>Try the local sandbox — no wallet, no wager</span>
      </button>
    </div>
  );
};

/* ---- small presentational helpers ---- */
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '.14em',
    textTransform: 'uppercase', color: C.muted2, marginBottom: 7 }}>{children}</div>
);

const TokenGlyph: React.FC<{ on: boolean; char: string }> = ({ on, char }) => (
  <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11,
    color: on ? '#241701' : C.cyan,
    backgroundImage: on ? solid(C.gold) : solid('rgba(63,224,214,.12)') }}>{char}</span>
);

const textInput = (): React.CSSProperties => ({
  flex: 1, minWidth: 0, backgroundImage: C.inset, border: `1px solid ${C.line}`, borderRadius: 9,
  color: C.ink, fontFamily: 'ui-monospace, monospace', fontSize: 12.5, padding: '9px 10px', outline: 'none',
});

const primaryBtn = (full: boolean): React.CSSProperties => ({
  width: full ? '100%' : undefined, border: 0, cursor: 'pointer', borderRadius: 11, padding: full ? '14px' : '8px 14px',
  fontWeight: 800, fontSize: full ? 12.5 : 11.5, letterSpacing: '.09em', textTransform: 'uppercase', color: '#04211f',
  backgroundImage: 'linear-gradient(150deg, #5cf0e4, #25b3a8)', boxShadow: '0 10px 24px rgba(63,224,214,.28)',
});

const secondaryBtn = (): React.CSSProperties => ({
  border: `1px solid ${C.line2}`, cursor: 'pointer', borderRadius: 10, padding: '11px 18px',
  fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: C.cyan,
  backgroundImage: solid('#12213a'),
});
