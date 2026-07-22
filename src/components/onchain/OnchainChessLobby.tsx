// On-chain chess lobby (Phase 4): chain picker + create a wager game (native / ERC-20 / NFT)
// + open an existing game by code (to join or spectate).

import React, { useState } from 'react';
import { parseEther, parseUnits, zeroAddress } from 'viem';
import { useAccount, useChainId, usePublicClient, useSwitchChain } from 'wagmi';
import { useOnchainChessActions } from '../../hooks/useOnchainChessActions';
import { LAWB_CHESS_CHAIN_IDS, LAWB_CHESS_NFT_COLLECTIONS, LAWB_CHESS_WAGER_TOKENS, getLawbChessAddress } from '../../config/lawbChessOnchain';
import { WagerKind } from '../../utils/lawbChessBoard';
import { stringToCode, type GameCode } from '../../utils/lawbChessMoves';

const CHAINS: { id: number; name: string }[] = [
  { id: LAWB_CHESS_CHAIN_IDS.baseSepolia, name: 'Base Sepolia (testnet)' },
  { id: LAWB_CHESS_CHAIN_IDS.base, name: 'Base' },
  { id: LAWB_CHESS_CHAIN_IDS.ethereum, name: 'Ethereum' },
  { id: LAWB_CHESS_CHAIN_IDS.arbitrum, name: 'Arbitrum' },
];

type WagerType = 'native' | 'erc20' | 'erc721' | 'erc1155';

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
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const actions = useOnchainChessActions();

  const [wagerType, setWagerType] = useState<WagerType>('native');
  const [amount, setAmount] = useState('0.01');
  const [decimals, setDecimals] = useState('18');
  const [tokenAddr, setTokenAddr] = useState('');
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

  return (
    <div style={panel}>
      <h3 style={{ margin: '4px 0' }}>On-Chain Chess</h3>

      <label style={row}>
        Network:
        <select value={chainId} onChange={(e) => switchChain?.({ chainId: Number(e.target.value) })} style={input}>
          {CHAINS.map((c) => (
            <option key={c.id} value={c.id} disabled={!getLawbChessAddress(c.id)}>
              {c.name}{getLawbChessAddress(c.id) ? '' : ' — not deployed'}
            </option>
          ))}
        </select>
      </label>

      {!isConnected && <div style={{ color: '#e0a000' }}>Connect your wallet to create or join.</div>}
      {isConnected && !deployedHere && (
        <div style={{ color: '#e0a000' }}>Not deployed on this network — switch to Arbitrum.</div>
      )}

      <fieldset style={box} disabled={!isConnected || !deployedHere || busy}>
        <legend>Create game</legend>
        <label style={row}>
          Wager type:
          <select style={input} value={wagerType} onChange={(e) => setWagerType(e.target.value as WagerType)}>
            <option value="native">Native (ETH)</option>
            <option value="erc20">ERC-20 token</option>
            <option value="erc721">NFT (ERC-721)</option>
            <option value="erc1155">NFT (ERC-1155)</option>
          </select>
        </label>

        {wagerType === 'native' && (
          <label style={row}>Wager (ETH): <input style={input} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        )}
        {wagerType === 'erc20' && (
          <>
            {featuredTokens.length > 0 && (
              <label style={row}>
                Token:
                <select
                  style={input}
                  value={featuredTokens.find((t) => t.address.toLowerCase() === tokenAddr.toLowerCase())?.address ?? ''}
                  onChange={(e) => {
                    const t = featuredTokens.find((ft) => ft.address === e.target.value);
                    if (t) { setTokenAddr(t.address); setDecimals(String(t.decimals)); }
                  }}
                >
                  <option value="">— custom (paste address) —</option>
                  {featuredTokens.map((t) => <option key={t.address} value={t.address}>{t.label}</option>)}
                </select>
              </label>
            )}
            <label style={row}>Token addr: <input style={input} value={tokenAddr} placeholder="0x…" onChange={(e) => setTokenAddr(e.target.value)} /></label>
            <label style={row}>Amount: <input style={input} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
            <label style={row}>Decimals: <input style={input} value={decimals} onChange={(e) => setDecimals(e.target.value)} /></label>
          </>
        )}
        {isNft && (
          <>
            <label style={row}>
              Collection:
              <select style={input} value={nftAddr} onChange={(e) => setNftAddr(e.target.value)}>
                <option value="">— select / custom —</option>
                {nftCollections.map((c) => <option key={c.address} value={c.address}>{c.label}</option>)}
              </select>
            </label>
            <label style={row}>Address: <input style={input} value={nftAddr} placeholder="0x…" onChange={(e) => setNftAddr(e.target.value)} /></label>
            <label style={row}>Token ID: <input style={input} value={tokenId} onChange={(e) => setTokenId(e.target.value)} /></label>
            {wagerType === 'erc1155' && (
              <label style={row}>Quantity: <input style={input} value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
            )}
            <div style={{ fontSize: 11, color: '#888' }}>Same-collection wager · winner takes both · no house fee.</div>
          </>
        )}

        <label style={row}>Time each (min): <input style={input} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
        <label style={row}>Increment (sec): <input style={input} value={increment} onChange={(e) => setIncrement(e.target.value)} /></label>
        <button style={btn} onClick={create} disabled={busy}>{busy ? (status ?? 'Working…') : 'Create & get code'}</button>
      </fieldset>

      <fieldset style={box} disabled={busy}>
        <legend>Open a game by code (join or watch)</legend>
        <label style={row}>
          Code: <input style={input} value={joinCode} maxLength={6}
            onChange={(e) => setJoinCode(e.target.value)} placeholder="abc123" />
        </label>
        <button style={btn} onClick={open}>Open</button>
      </fieldset>

      {err && <div style={{ color: '#c0392b', fontSize: 12, maxWidth: 360 }}>{err}</div>}

      <button style={{ ...btn, marginTop: 4 }} onClick={onPlayDemo}>
        ▶ Try local sandbox (no wallet)
      </button>
    </div>
  );
};

const panel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 14,
  maxWidth: 380, margin: '0 auto', fontFamily: "'MS Sans Serif', Arial, sans-serif",
  fontSize: 13, color: '#eee',
};
const box: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #555', padding: 10,
};
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 };
const input: React.CSSProperties = { fontFamily: 'inherit', fontSize: 12, padding: '4px 6px', flex: '0 1 auto', minWidth: 0, maxWidth: 200 };
const btn: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 12, padding: '6px 10px', cursor: 'pointer',
  background: '#c0c0c0', border: '2px outset #fff', color: '#000',
};
