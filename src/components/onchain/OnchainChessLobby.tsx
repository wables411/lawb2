// On-chain chess lobby (Phase 4): pick a wager + create a game, or open one by code.
//
// Visual note: colors/backgrounds are set INLINE (linear-gradient / explicit color)
// rather than via a stylesheet. The chess page's .lawb-app-dark-mode universal rules
// force background:#000 / color:#00ff00 on any element WITHOUT an inline background-image
// or color — the same reason ChessTutorial styles inline. Layout-only props may use CSS.

import React, { useCallback, useEffect, useState } from 'react';
import { formatEther, formatUnits, parseEther, parseUnits, zeroAddress } from 'viem';
import { useAccount, useChainId, usePublicClient, useSwitchChain } from 'wagmi';
import { useOnchainChessActions } from '../../hooks/useOnchainChessActions';
import {
  LAWB_CHESS_ABI, LAWB_CHESS_CHAIN_IDS, LAWB_CHESS_DEPLOY_BLOCK, LAWB_CHESS_NFT_COLLECTIONS,
  LAWB_CHESS_WAGER_TOKENS, getLawbChessAddress,
} from '../../config/lawbChessOnchain';
import { getGlobalElo } from '../../firebaseElo';
import { GameStatus, WagerKind, parseGameTuple, type OnchainGame } from '../../utils/lawbChessBoard';
import { codeToString, stringToCode, type GameCode } from '../../utils/lawbChessMoves';
import { oc as C, solid, ocInput, ocBtnPrimary, ocBtnSecondary, ocChip, FieldLabel, TokenGlyph } from './onchainUi';

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

export interface OnchainChessLobbyProps {
  onEnterGame: (code: GameCode) => void;
  onPlayDemo: () => void;
}

export const OnchainChessLobby: React.FC<OnchainChessLobbyProps> = ({ onEnterGame, onPlayDemo }) => {
  const { isConnected, address } = useAccount();
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
  // Your global cross-chain ELO (indexer-fed read-only node); null = unrated/unavailable.
  const [myGlobalElo, setMyGlobalElo] = useState<number | null>(null);
  useEffect(() => {
    setMyGlobalElo(null);
    if (address) void getGlobalElo(address).then((e) => setMyGlobalElo(e?.elo ?? null));
  }, [address]);

  // Open matches on the selected chain, straight from the contract: GameCreated events
  // (one getLogs from the deploy block) → games() status via one multicall → status OPEN.
  // One-shot per chain visit + manual refresh — NO polling (bandwidth guardrail).
  const [openMatches, setOpenMatches] = useState<{ code: `0x${string}`; game: OnchainGame }[] | null>(null);
  const [openScanErr, setOpenScanErr] = useState<string | null>(null);
  const scanOpenMatches = useCallback(async () => {
    const proxy = getLawbChessAddress(chainId);
    const fromBlock = LAWB_CHESS_DEPLOY_BLOCK[chainId];
    if (!publicClient || !proxy || fromBlock === undefined) { setOpenMatches([]); return; }
    setOpenMatches(null);
    setOpenScanErr(null);
    try {
      const logs = await publicClient.getContractEvents({
        address: proxy, abi: LAWB_CHESS_ABI, eventName: 'GameCreated', fromBlock, toBlock: 'latest',
      });
      const codes = [...new Set(
        logs.map((l) => (l as { args?: { code?: `0x${string}` } }).args?.code).filter(Boolean) as `0x${string}`[],
      )].slice(-50); // bound the status reads; codes are reusable so games() below is the truth
      const reads = codes.length === 0 ? [] : await publicClient.multicall({
        contracts: codes.map((code) => ({
          address: proxy, abi: LAWB_CHESS_ABI, functionName: 'games' as const, args: [code],
        })),
        allowFailure: true,
      });
      const open: { code: `0x${string}`; game: OnchainGame }[] = [];
      codes.forEach((code, i) => {
        const r = reads[i];
        if (r?.status !== 'success') return;
        const game = parseGameTuple(r.result as Parameters<typeof parseGameTuple>[0]);
        if (game.status === GameStatus.OPEN) open.push({ code, game });
      });
      setOpenMatches(open.reverse()); // newest first
    } catch (e) {
      setOpenScanErr((e as Error)?.message?.split('\n')[0] ?? 'scan failed');
      setOpenMatches([]);
    }
  }, [chainId, publicClient]);
  useEffect(() => { void scanOpenMatches(); }, [scanOpenMatches]);

  // Human label for a game's stake, matching the create form's featured lists.
  const stakeLabel = (g: OnchainGame): string => {
    if (g.kind === WagerKind.NATIVE) return `${formatEther(g.wager)} ETH`;
    if (g.kind === WagerKind.ERC20) {
      const t = (LAWB_CHESS_WAGER_TOKENS[chainId] ?? []).find((x) => x.address.toLowerCase() === g.token.toLowerCase());
      return t ? `${formatUnits(g.wager, t.decimals)} ${t.label.split(' ')[0]}` : `custom token ${g.token.slice(0, 6)}…`;
    }
    const c = (LAWB_CHESS_NFT_COLLECTIONS[chainId] ?? []).find((x) => x.address.toLowerCase() === g.token.toLowerCase());
    return `NFT · ${c ? c.label : `${g.token.slice(0, 6)}…`}`;
  };

  const deployedHere = !!getLawbChessAddress(chainId);
  const nftCollections = LAWB_CHESS_NFT_COLLECTIONS[chainId] ?? [];
  const featuredTokens = LAWB_CHESS_WAGER_TOKENS[chainId] ?? [];
  const featured = featuredTokens[0]; // per-chain featured ERC-20 (DMT on Arb, CULT on ETH, none on Base)
  const isNft = wagerType === 'erc721' || wagerType === 'erc1155';
  const chainName = CHAINS.find((c) => c.id === chainId)?.name ?? `chain ${chainId}`;

  // Following a chain switch, an auto-filled featured token from the previous chain would be
  // invalid here (the contract's allowlist is per-chain) — swap it for this chain's featured
  // token, or fall back to native. Custom user-typed addresses are never any chain's featured
  // token, so they pass through untouched.
  useEffect(() => {
    const isOtherChainsFeatured = Object.values(LAWB_CHESS_WAGER_TOKENS).some((tokens) =>
      tokens.some((t) => t.address.toLowerCase() === tokenAddr.toLowerCase()));
    if (!tokenAddr || (isOtherChainsFeatured && !featuredTokens.some((t) => t.address.toLowerCase() === tokenAddr.toLowerCase()))) {
      if (featured) { setTokenAddr(featured.address); setDecimals(String(featured.decimals)); }
      else { setTokenAddr(''); setWagerType((w) => (w === 'erc20' ? 'native' : w)); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  // Which chip is active: featured erc20 (DMT/CULT) / ETH (native) / NFT / Custom (erc20, no featured match)
  const featuredMatch = featuredTokens.find((t) => t.address.toLowerCase() === tokenAddr.toLowerCase());
  const activeChip: 'dmt' | 'eth' | 'nft' | 'custom' =
    wagerType === 'native' ? 'eth' : isNft ? 'nft' : featuredMatch ? 'dmt' : 'custom';
  const unitLabel = wagerType === 'native' ? 'ETH' : featuredMatch ? featuredMatch.label.split(' ')[0] : 'TOKEN';

  const pickDmt = () => {
    setWagerType('erc20');
    if (featured) { setTokenAddr(featured.address); setDecimals(String(featured.decimals)); }
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

  const createDisabled = !isConnected || !deployedHere || busy;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 16, padding: 18,
      width: '100%', maxWidth: 440, margin: '0 auto', flexShrink: 0, boxSizing: 'border-box',
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
              Lawb <span style={{ color: C.cyan }}>Chess</span>
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: C.muted2 }}>
              On-Chain Arena
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {myGlobalElo !== null && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 11,
              padding: '7px 11px', borderRadius: 999, color: C.muted,
              backgroundImage: solid('#0a1322'), border: `1px solid ${C.line}`,
            }}>
              GLOBAL ELO {myGlobalElo}
            </span>
          )}
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
          <span>On-chain chess runs on <strong style={{ color: C.gold }}>Arbitrum</strong> ($DMT), <strong style={{ color: C.gold }}>Ethereum</strong> ($CULT) and <strong style={{ color: C.gold }}>Base</strong>.</span>
          <button type="button" onClick={() => switchChain?.({ chainId: ARBITRUM_ID })} style={ocBtnSecondary}>
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

        {/* chain picker — outside the fieldset so it stays usable from an unsupported chain */}
        <FieldLabel>Chain</FieldLabel>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
          {CHAINS.filter((c) => c.id !== LAWB_CHESS_CHAIN_IDS.baseSepolia && !!getLawbChessAddress(c.id)).map((c) => (
            <button key={c.id} type="button" onClick={() => switchChain?.({ chainId: c.id })}
              style={ocChip(chainId === c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        <fieldset disabled={createDisabled} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          {/* wager token chips */}
          <FieldLabel>Wager token</FieldLabel>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {featured && (
              <button type="button" onClick={pickDmt} style={ocChip(activeChip === 'dmt', C.goldline)}>
                <TokenGlyph on={activeChip === 'dmt'} char="◆" /> {featured.label.split(' ')[0]}
              </button>
            )}
            <button type="button" onClick={pickEth} style={ocChip(activeChip === 'eth')}>
              <TokenGlyph on={activeChip === 'eth'} char="Ξ" /> ETH
            </button>
            <button type="button" onClick={pickNft} style={ocChip(activeChip === 'nft')}>
              <TokenGlyph on={activeChip === 'nft'} char="◇" /> NFT
            </button>
            <button type="button" onClick={pickCustom} style={ocChip(activeChip === 'custom')}>
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
                  <input value={tokenAddr} onChange={(e) => setTokenAddr(e.target.value)} placeholder="Token address 0x…" style={ocInput()} />
                  <input value={decimals} onChange={(e) => setDecimals(e.target.value)} placeholder="dec" style={{ ...ocInput(), maxWidth: 64, textAlign: 'center' }} />
                </div>
              )}
            </div>
          )}

          {/* NFT wager fields */}
          {isNft && (
            <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FieldLabel>NFT wager</FieldLabel>
              <div style={{ display: 'flex', gap: 7 }}>
                <button type="button" onClick={() => setWagerType('erc721')} style={ocChip(wagerType === 'erc721')}>ERC-721</button>
                <button type="button" onClick={() => setWagerType('erc1155')} style={ocChip(wagerType === 'erc1155')}>ERC-1155</button>
              </div>
              {nftCollections.length > 0 && (
                <select value={nftAddr} onChange={(e) => setNftAddr(e.target.value)} style={ocInput()}>
                  <option value="">— select / custom collection —</option>
                  {nftCollections.map((c) => <option key={c.address} value={c.address}>{c.label}</option>)}
                </select>
              )}
              <input value={nftAddr} onChange={(e) => setNftAddr(e.target.value)} placeholder="Collection address 0x…" style={ocInput()} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Token ID" style={ocInput()} />
                {wagerType === 'erc1155' && (
                  <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" style={{ ...ocInput(), maxWidth: 72 }} />
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted2 }}>Same-collection wager · winner takes both · no house fee.</div>
            </div>
          )}

          {/* time control — labels sit ABOVE the inputs so they can't overflow the box */}
          <FieldLabel>Time control</FieldLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={timeSubLabel}>Minutes each</div>
              <div style={timeInputBox}>
                <input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal" style={timeInput} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={timeSubLabel}>+ Increment&nbsp;(s)</div>
              <div style={timeInputBox}>
                <input value={increment} onChange={(e) => setIncrement(e.target.value)} inputMode="numeric" style={timeInput} />
              </div>
            </div>
          </div>

          <button type="button" onClick={create} disabled={busy} style={{ ...ocBtnPrimary, width: '100%' }}>
            {busy ? (status ?? 'Working…') : 'Create match & get code'}
          </button>
        </fieldset>

        <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>
          <span style={{ color: C.cyan, flex: '0 0 auto' }}>⛓</span>
          <span>Token wagers take two transactions (approve, then create). The contract escrows both stakes and settles on checkmate, resign, or timeout — no middleman.</span>
        </div>
      </div>

      {/* open matches (contract-derived, per selected chain) */}
      <div style={{ backgroundImage: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: C.ink }}>
            Open matches · {chainName}
          </div>
          <button type="button" onClick={() => { void scanOpenMatches(); }} disabled={openMatches === null} style={ocBtnSecondary}>
            Refresh
          </button>
        </div>
        {openMatches === null && (
          <div style={{ fontSize: 12, color: C.muted2 }}>Scanning the chain for open wagers…</div>
        )}
        {openMatches !== null && openMatches.length === 0 && (
          <div style={{ fontSize: 12, color: C.muted2 }}>
            {openScanErr ? `Couldn't scan for open matches (${openScanErr}) — try Refresh.`
              : 'No open wagers on this chain right now — create one above and share the code.'}
          </div>
        )}
        {openMatches !== null && openMatches.map(({ code, game }) => (
          <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
            borderTop: `1px solid ${C.line}` }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 13, color: C.cyan,
              letterSpacing: '.12em', textTransform: 'uppercase' }}>#{codeToString(code as GameCode)}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis' }}>
              <b style={{ color: C.gold }}>{stakeLabel(game)}</b>
              <span style={{ color: C.muted2 }}> · {Math.round(game.whiteTime / 60)}m{game.increment > 0 ? `+${game.increment}s` : ''} · by {game.white.slice(0, 6)}…{game.white.slice(-4)}</span>
            </span>
            <button type="button" onClick={() => onEnterGame(code as GameCode)} style={ocBtnSecondary}>
              {address && game.white.toLowerCase() === address.toLowerCase() ? 'Open' : 'Join'}
            </button>
          </div>
        ))}
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
          <button type="button" onClick={open} disabled={busy} style={ocBtnSecondary}>Open</button>
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

const timeSubLabel: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase',
  color: C.muted2, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};
const timeInputBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', backgroundImage: C.inset, border: `1px solid ${C.line}`,
  borderRadius: 10, padding: '9px 11px',
};
const timeInput: React.CSSProperties = {
  flex: 1, minWidth: 0, width: '100%', background: 'transparent', border: 0, outline: 'none',
  color: C.ink, fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700,
};
