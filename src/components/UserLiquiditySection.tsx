import React, { useEffect, useState } from 'react';
import {
  BASE_UNISWAP_V3_POSITION_MANAGER,
  BASE_UNISWAP_V4_POSITION_MANAGER,
  METEORA_CLAWB_LAWB_POOL,
} from '../config/lpPools';
import { fetchMeteoraPoolJson, fetchMeteoraUserPnlJson } from '../utils/meteoraDlmm';
import { fetchBaseUniswapClawbWethPositions, type BaseClawbWethPosition } from '../utils/uniswapV3ClawbWeth';
import {
  fetchBaseUniswapV4ClawbEthPositions,
  type BaseUniswapV4ClawbPosition,
} from '../utils/uniswapV4ClawbEth';

export interface UserLiquiditySectionProps {
  isMobile: boolean;
  solanaAddress?: string;
  evmAddress?: string;
}

type MeteoraPos = {
  positionAddress?: string;
  pnlUsd?: string | number;
  feePerTvl24h?: string | number;
  allTimeFees?: { total?: { usd?: string | number } };
};

function fmtNum(v: number, dec = 2): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(dec)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(dec)}K`;
  return v.toFixed(dec);
}

function shortenSol(s: string): string {
  if (s.length <= 12) return s;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function formatUniRpcError(raw: string): string {
  if (/429|Too many request|rate.?limit/i.test(raw)) {
    return 'Public Base RPC rate limit while scanning Uniswap (many eth_getLogs calls). Wait a bit and refresh, or set VITE_BASE_RPC_URL to your own Base endpoint.';
  }
  return raw;
}

const cardStyle: React.CSSProperties = {
  marginBottom: '20px',
  width: '100%',
  maxWidth: '600px',
  padding: '12px',
  background: '#f5f5f5',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

export const UserLiquiditySection: React.FC<UserLiquiditySectionProps> = ({
  isMobile,
  solanaAddress,
  evmAddress,
}) => {
  const [meteoraLoading, setMeteoraLoading] = useState(!!solanaAddress);
  const [meteoraErr, setMeteoraErr] = useState<string | null>(null);
  const [meteoraPool, setMeteoraPool] = useState<{ name?: string; current_price?: number } | null>(null);
  const [meteoraPositions, setMeteoraPositions] = useState<MeteoraPos[]>([]);

  const [uniLoading, setUniLoading] = useState(!!evmAddress);
  const [uniErr, setUniErr] = useState<string | null>(null);
  const [uniV3Positions, setUniV3Positions] = useState<BaseClawbWethPosition[]>([]);
  const [uniV4Positions, setUniV4Positions] = useState<BaseUniswapV4ClawbPosition[]>([]);
  const [uniV4ScanIncomplete, setUniV4ScanIncomplete] = useState(false);

  useEffect(() => {
    if (!solanaAddress) {
      setMeteoraLoading(false);
      setMeteoraPool(null);
      setMeteoraPositions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setMeteoraLoading(true);
      setMeteoraErr(null);
      try {
        const [pool, pnl] = await Promise.all([
          fetchMeteoraPoolJson(METEORA_CLAWB_LAWB_POOL),
          fetchMeteoraUserPnlJson(METEORA_CLAWB_LAWB_POOL, solanaAddress, 'open'),
        ]);
        if (cancelled) return;
        const p = pool as { name?: string; current_price?: number };
        setMeteoraPool({ name: p?.name, current_price: Number(p?.current_price ?? 0) });
        const list = Array.isArray((pnl as { positions?: MeteoraPos[] })?.positions)
          ? (pnl as { positions: MeteoraPos[] }).positions
          : [];
        setMeteoraPositions(list);
      } catch (e: unknown) {
        if (!cancelled) setMeteoraErr(e instanceof Error ? e.message : 'Meteora load failed');
      } finally {
        if (!cancelled) setMeteoraLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [solanaAddress]);

  useEffect(() => {
    if (!evmAddress || !/^0x[a-fA-F0-9]{40}$/.test(evmAddress)) {
      setUniLoading(false);
      setUniV3Positions([]);
      setUniV4Positions([]);
      setUniV4ScanIncomplete(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setUniLoading(true);
      setUniErr(null);
      setUniV4ScanIncomplete(false);
      try {
        const owner = evmAddress as `0x${string}`;
        const [v3, v4] = await Promise.all([
          fetchBaseUniswapClawbWethPositions(owner),
          fetchBaseUniswapV4ClawbEthPositions(owner),
        ]);
        if (!cancelled) {
          setUniV3Positions(v3);
          setUniV4Positions(v4.positions);
          setUniV4ScanIncomplete(v4.scanIncomplete);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Uniswap scan failed';
          setUniErr(formatUniRpcError(msg));
        }
      } finally {
        if (!cancelled) setUniLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [evmAddress]);

  if (!solanaAddress && !evmAddress) return null;

  return (
    <div style={{ width: '100%', maxWidth: '600px', marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '13px' : '14px' }}>
        Your liquidity (CLAWB pairs)
      </h4>
      <p style={{ margin: '0 0 12px 0', fontSize: isMobile ? '10px' : '11px', color: '#555' }}>
        Wallets used: {solanaAddress ? `Solana ${shortenSol(solanaAddress)}` : '—'}
        {evmAddress ? ` · Base/EVM ${evmAddress.slice(0, 6)}…${evmAddress.slice(-4)}` : ''}
      </p>

      {solanaAddress && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: isMobile ? '12px' : '13px' }}>Meteora DLMM — CLAWB / LAWB (Solana)</strong>
            <a
              href={`https://www.meteora.ag/dlmm/${METEORA_CLAWB_LAWB_POOL}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '10px' }}
            >
              Pool ↗
            </a>
          </div>
          {meteoraLoading && <div style={{ fontSize: '11px', color: '#666' }}>Loading…</div>}
          {meteoraErr && <div style={{ fontSize: '11px', color: '#c0392b' }}>{meteoraErr}</div>}
          {!meteoraLoading && !meteoraErr && meteoraPool && (
            <div style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>
              {meteoraPool.name ?? 'CLAWB-LAWB'} · price ~{Number(meteoraPool.current_price ?? 0).toFixed(4)} CLAWB/LAWB
            </div>
          )}
          {!meteoraLoading && !meteoraErr && meteoraPositions.length === 0 && (
            <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#666' }}>No open positions in this pool.</div>
          )}
          {meteoraPositions.map((p, idx) => {
            const pnl = p.pnlUsd != null ? Number(String(p.pnlUsd).replace(/,/g, '')) : NaN;
            const fees =
              p.allTimeFees?.total?.usd != null ? Number(String(p.allTimeFees.total.usd).replace(/,/g, '')) : NaN;
            const addr = p.positionAddress || '';
            return (
              <div
                key={addr || `m-${idx}`}
                style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: isMobile ? '10px' : '11px',
                }}
              >
                <div>
                  <strong>Position</strong> {addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—'}
                </div>
                {!Number.isNaN(pnl) && <div>PnL (USD): ~${fmtNum(pnl)}</div>}
                {!Number.isNaN(fees) && fees > 0 && <div>Fees claimed (USD): ~${fmtNum(fees)}</div>}
                {addr && (
                  <a
                    href={`https://www.meteora.ag/dlmm/${METEORA_CLAWB_LAWB_POOL}?referrer=portfolio&position=${encodeURIComponent(addr)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '10px' }}
                  >
                    Open in Meteora ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {evmAddress && /^0x[a-fA-F0-9]{40}$/.test(evmAddress) && (
        <div style={{ ...cardStyle, marginTop: solanaAddress ? '12px' : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: isMobile ? '12px' : '13px' }}>Uniswap — CLAWB pools (Base)</strong>
            <a
              href="https://app.uniswap.org/explore/pools/base"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '10px' }}
            >
              Uniswap ↗
            </a>
          </div>
          <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#666' }}>
            $CLAWB is on Base (not Ethereum L1). v4 often uses native ETH + CLAWB; v3 uses WETH + CLAWB.
          </p>
          {uniLoading && <div style={{ fontSize: '11px', color: '#666' }}>Scanning positions…</div>}
          {uniErr && <div style={{ fontSize: '11px', color: '#c0392b' }}>{uniErr}</div>}
          {!uniLoading && !uniErr && uniV4ScanIncomplete && (
            <div style={{ fontSize: '10px', color: '#856404', marginBottom: '8px' }}>
              Some v4 positions may be outside the recent on-chain scan window. Open Uniswap for the full list.
            </div>
          )}
          {!uniLoading && !uniErr && uniV3Positions.length === 0 && uniV4Positions.length === 0 && (
            <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#666' }}>
              No matching CLAWB v3/v4 liquidity found for this wallet on Base.
            </div>
          )}

          {uniV4Positions.length > 0 && (
            <div style={{ marginBottom: uniV3Positions.length ? '14px' : 0 }}>
              <div style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: 600, marginBottom: '6px' }}>
                v4 (native ETH or WETH + CLAWB)
              </div>
              {uniV4Positions.map((p) => (
                <div
                  key={`v4-${p.tokenId}`}
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: isMobile ? '10px' : '11px',
                  }}
                >
                  <div>
                    <strong>Position</strong> #{p.tokenId} · {p.usesNativeEth ? 'CLAWB / ETH' : 'CLAWB / WETH'} · fee{' '}
                    {(p.fee / 10000).toFixed(2)}%
                  </div>
                  <div>Liquidity (raw): {p.liquidity.toString()}</div>
                  <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <a
                      href={`https://app.uniswap.org/positions/v4/base/${p.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '10px' }}
                    >
                      Open in Uniswap ↗
                    </a>
                    <a
                      href={`https://basescan.org/nft/${BASE_UNISWAP_V4_POSITION_MANAGER}/${p.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '10px' }}
                    >
                      Basescan ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uniV3Positions.length > 0 && (
            <div>
              <div style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: 600, marginBottom: '6px' }}>
                v3 (CLAWB / WETH)
              </div>
              {uniV3Positions.map((p) => (
                <div
                  key={`v3-${p.tokenId}`}
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: isMobile ? '10px' : '11px',
                  }}
                >
                  <div>
                    <strong>NFT #</strong> {p.tokenId} · <strong>fee tier</strong> {p.fee / 10_000}%
                  </div>
                  <div>Liquidity (raw): {p.liquidity.toString()}</div>
                  {(p.tokensOwed0 > 0n || p.tokensOwed1 > 0n) && (
                    <div>
                      Pending fees (raw): {p.tokensOwed0.toString()} / {p.tokensOwed1.toString()}
                    </div>
                  )}
                  <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <a
                      href={`https://app.uniswap.org/positions/v3/base/${p.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '10px' }}
                    >
                      Open in Uniswap ↗
                    </a>
                    <a
                      href={`https://basescan.org/nft/${BASE_UNISWAP_V3_POSITION_MANAGER}/${p.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '10px' }}
                    >
                      Basescan ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
