#!/bin/bash
# Deploy the Reef Run replay validator (REEFRUN_ONCHAIN_SPEC.md §3) to the
# existing Stockfish/chess droplet. Run ON the droplet as root:
#   curl -s https://raw.githubusercontent.com/wables411/lawb2/main/deploy-reef-validator.sh | bash
#
# What it does: fetches the validator (server + replay judge + sim bundle) from
# the repo, runs it as a systemd service on 127.0.0.1:8787, and wires nginx so
# it's public at https://chess.lawb.xyz/reef/{health,validate}.
# No credentials needed — the validator only judges proofs. Same droplet,
# $0/month extra.
#
# To update later: rebuild the sim bundle in lawb2 (`npm run validator:build`),
# commit + push, then re-run this script. The bundle MUST match the deployed
# game's sim or honest runs get rejected.

set -e

echo "== Reef Run validator deploy =="

if ! command -v node >/dev/null || [ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -lt 18 ]; then
    echo "installing Node 20 (NodeSource)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "node $(node --version)"

mkdir -p /root/reef-validator
cd /root/reef-validator

echo "fetching validator from lawb2@main..."
RAW=https://raw.githubusercontent.com/wables411/lawb2/main/reef-validator
curl -fsS -o server.mjs "$RAW/server.mjs"
curl -fsS -o replayProof.cjs "$RAW/replayProof.cjs"
curl -fsS -o _reefRunSim.cjs "$RAW/_reefRunSim.cjs"

# Smoke test: judge a garbage proof (must come back invalid, not crash).
node -e '
const { validateRunProof } = require("/root/reef-validator/replayProof.cjs");
const v = validateRunProof({ deterministic: true, characterId: "clawb", seed: 1,
  steps: 600, survivalSec: 999, inputLog: [], maxActiveObstacles: 12 });
if (v.valid !== false) { console.error("smoke test FAILED", v); process.exit(1); }
console.log("smoke test ok (forged proof rejected:", v.reason + ")");
'

# systemd service (idempotent overwrite).
cat > /etc/systemd/system/reef-validator.service << 'EOF'
[Unit]
Description=Reef Run replay validator (judges run proofs by replaying the game sim)
After=network.target

[Service]
ExecStart=/usr/bin/node /root/reef-validator/server.mjs
Environment=REEF_VALIDATOR_PORT=8787
Environment=REEF_VALIDATOR_HOST=127.0.0.1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now reef-validator
systemctl restart reef-validator
sleep 1
echo -n "local health: "
curl -fsS http://127.0.0.1:8787/health && echo ""

# Wire nginx: proxy /reef/ -> the validator on every chess.lawb.xyz server block.
# Backup + config test + rollback — never leaves nginx broken (same as elo deploy).
NGINX_WIRED=no
for cfg in /etc/nginx/sites-enabled/*; do
    [ -f "$cfg" ] || continue
    grep -q "chess.lawb.xyz" "$cfg" || continue
    if grep -q "location /reef/" "$cfg"; then
        echo "nginx: $cfg already proxies /reef/"
        NGINX_WIRED=yes
        continue
    fi
    cp "$cfg" "$cfg.bak-reef"
    awk '{ print } /server_name[^;]*chess\.lawb\.xyz/ {
        print "    location /reef/ {";
        print "        proxy_pass http://127.0.0.1:8787/;";
        print "        proxy_set_header Host $host;";
        print "        client_max_body_size 1m;";
        print "    }";
    }' "$cfg.bak-reef" > "$cfg"
    if nginx -t 2>/dev/null; then
        NGINX_WIRED=yes
        echo "nginx: wired /reef/ into $cfg"
    else
        mv "$cfg.bak-reef" "$cfg"
        echo "!! nginx config test FAILED after edit — restored $cfg untouched"
    fi
done
if [ "$NGINX_WIRED" = yes ]; then
    systemctl reload nginx && echo "nginx reloaded"
else
    echo "!! no chess.lawb.xyz nginx config found — validator is up but not public"
fi

echo -n "public check: "
curl -s -o /dev/null -w "https://chess.lawb.xyz/reef/health -> HTTP %{http_code}\n" https://chess.lawb.xyz/reef/health || true

echo ""
echo "== DONE =="
echo "Validator: https://chess.lawb.xyz/reef/validate (POST run proof -> verdict)"
echo "Point the site at it: VITE_REEF_VALIDATOR_URL=https://chess.lawb.xyz/reef in Netlify env."
echo "Logs: journalctl -u reef-validator -f"
