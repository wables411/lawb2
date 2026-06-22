// On-chain chess lobby (Phase 4): chain picker + create a native-ETH wager game + open an
// existing game by code (to join or spectate). ERC-20/NFT wagers are supported by the
// contract + hooks; they'll be surfaced in a later UI pass.

import React, { useState } from 'react';
import { parseEther, zeroAddress } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useOnchainChessActions } from '../../hooks/useOnchainChessActions';
import { LAWB_CHESS_CHAIN_IDS, getLawbChessAddress } from '../../config/lawbChessOnchain';
import { WagerKind } from '../../utils/lawbChessBoard';
import { stringToCode, type GameCode } from '../../utils/lawbChessMoves';

const CHAINS: { id: number; name: string }[] = [
  { id: LAWB_CHESS_CHAIN_IDS.baseSepolia, name: 'Base Sepolia (testnet)' },
  { id: LAWB_CHESS_CHAIN_IDS.base, name: 'Base' },
  { id: LAWB_CHESS_CHAIN_IDS.ethereum, name: 'Ethereum' },
  { id: LAWB_CHESS_CHAIN_IDS.arbitrum, name: 'Arbitrum' },
];

function randomCode(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export interface OnchainChessLobbyProps {
  onEnterGame: (code: GameCode) => void;
}

export const OnchainChessLobby: React.FC<OnchainChessLobbyProps> = ({ onEnterGame }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const actions = useOnchainChessActions();

  const [amount, setAmount] = useState('0.01');
  const [minutes, setMinutes] = useState('5');
  const [increment, setIncrement] = useState('0');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const deployedHere = !!getLawbChessAddress(chainId);

  const create = async () => {
    setErr(null);
    const baseTimeSec = Math.round(parseFloat(minutes) * 60);
    if (!(baseTimeSec >= 30 && baseTimeSec <= 7 * 24 * 3600)) { setErr('Time must be 30s–7 days'); return; }
    let wager: bigint;
    try { wager = parseEther(amount); } catch { setErr('Invalid amount'); return; }
    if (wager <= 0n) { setErr('Wager must be > 0'); return; }
    const code = stringToCode(randomCode());
    setBusy(true);
    try {
      await actions.createGame({
        code, kind: WagerKind.NATIVE, token: zeroAddress, wager,
        baseTimeSec, incrementSec: Math.max(0, Math.round(parseFloat(increment) || 0)),
      });
      onEnterGame(code);
    } catch (e) {
      setErr((e as Error)?.message?.split('\n')[0] ?? 'create failed');
    } finally {
      setBusy(false);
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
        <div style={{ color: '#e0a000' }}>Not deployed on this network — switch to Base Sepolia.</div>
      )}

      <fieldset style={box} disabled={!isConnected || !deployedHere || busy}>
        <legend>Create game (native ETH wager)</legend>
        <label style={row}>Wager (ETH): <input style={input} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <label style={row}>Time each (min): <input style={input} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
        <label style={row}>Increment (sec): <input style={input} value={increment} onChange={(e) => setIncrement(e.target.value)} /></label>
        <button style={btn} onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create & get code'}</button>
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
const input: React.CSSProperties = { fontFamily: 'inherit', fontSize: 12, padding: '4px 6px', flex: '0 0 auto', minWidth: 0 };
const btn: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 12, padding: '6px 10px', cursor: 'pointer',
  background: '#c0c0c0', border: '2px outset #fff', color: '#000',
};
