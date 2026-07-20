# CLAWB Base Claim Runbook

This runbook deploys and launches the sponsored `$CLAWB` claim on Base.

## 1) Build the latest Merkle snapshot

Use the updated source CSV:

`C:/Users/wable/.openclaw/clawb_weighted_allocation.csv`

```bash
node scripts/claims/build-clawb-merkle.mjs
```

Outputs:
- `public/claims/clawb-base-metadata.json`
- `public/claims/clawb-base-claims.json`

Check these values before moving on:
- `csvSha256`
- `eligibleWalletCount`
- `totalAllocation`
- `merkleRoot`

## 2) Compile the claim contract artifact

```bash
node scripts/claims/compile-distributor.mjs
```

Output:
- `artifacts/claims/ClawbMerkleDistributor.json`

## 3) Generate and store relayer wallet (one-time)

This appends relayer credentials to:
`C:/Users/wable/.openclaw/clawb/.env`

```bash
node scripts/claims/generate-relayer-wallet.mjs
```

Fund this relayer with a small amount of Base ETH for gas.

## 4) Deploy distributor contract to Base

Set your deployer key in shell:

```bash
$env:DEPLOYER_PRIVATE_KEY="0x..."
node scripts/claims/deploy-clawb-distributor.mjs
```

Copy deployed address into:
- server env: `CLAWB_CLAIM_CONTRACT_ADDRESS=0x...`
- frontend env: `VITE_CLAWB_CLAIM_CONTRACT_ADDRESS=0x...`

## 5) Fund claim pool

Transfer `$CLAWB` from treasury wallet to deployed distributor contract.
Required amount = `totalAllocation` from metadata.

## 6) Verify before launch

```bash
$env:CLAWB_CLAIM_CONTRACT_ADDRESS="0x..."
node scripts/claims/verify-clawb-distributor.mjs
```

Launch only if verification passes:
- root matches
- token matches
- funded enough = `true`

## 7) UI and relayer readiness checklist

- `.env` has `VITE_CLAWB_CLAIM_CONTRACT_ADDRESS`
- relayer env has:
  - `BASE_RELAYER_ADDRESS`
  - `BASE_RELAYER_PRIVATE_KEY`
  - `CLAWB_CLAIM_CONTRACT_ADDRESS`
  - `BASE_RPC_URL`
- Netlify functions deployed:
  - `/.netlify/functions/clawb-claim-entry`
  - `/.netlify/functions/clawb-claim-relay`

## 8) Smoke test

- Test with one eligible wallet:
  - open `Claim $CLAWB` popup
  - check eligibility
  - claim via sponsored mode
  - verify tx on BaseScan
- Test with one ineligible wallet:
  - shows not eligible

## Notes

- Users without ETH should use `Claim (Sponsored)`.
- `Claim Direct` remains available for users who prefer paying their own gas.
- Do not share the relayer private key. Keep it only in secure env storage.
