#!/bin/bash
# Deploy the LawbChess global ELO indexer (LAWBCHESS_ONCHAIN_SPEC.md §8b) to the
# existing Stockfish droplet. Run ON the droplet as root:
#   curl -s https://raw.githubusercontent.com/wables411/lawb2/main/deploy-elo-indexer.sh | bash
#
# What it does: installs Node if missing, fetches elo-indexer/indexer.mjs from the
# repo, installs a */10 cron. NO new servers, no Netlify functions — $0/month.
#
# ONE MANUAL STEP (before the cron can write to Firebase):
#   Put a Firebase service-account key at /root/elo-indexer/service-account.json
#   (Firebase console > project chess-220ee > Project settings > Service accounts >
#    Generate new private key). Until then runs fail loudly in the log — chain
#   scanning still works, nothing breaks.

set -e

echo "== LawbChess ELO indexer deploy =="

# Node >= 18 (built-in fetch). The droplet runs the chess API inside Docker, so the
# host may not have Node yet.
if command -v node >/dev/null && [ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -ge 18 ]; then
    echo "node $(node --version) present"
else
    echo "installing Node 20 (NodeSource)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

mkdir -p /root/elo-indexer
cd /root/elo-indexer

echo "fetching indexer.mjs from lawb2@main..."
curl -fsS -o indexer.mjs https://raw.githubusercontent.com/wables411/lawb2/main/elo-indexer/indexer.mjs

# Smoke test (no Firebase write): scans all three chains and replays.
echo "smoke test (dry run)..."
node indexer.mjs --dry-run

# Publish target: a static file nginx serves at https://chess.lawb.xyz/elo.json.
# No credentials anywhere — the frontend reads this URL (Firebase node is a fallback).
mkdir -p /var/www/elo
chmod 755 /var/www/elo

# Wire nginx: add "location = /elo.json" to every chess.lawb.xyz server block that
# doesn't have it yet. Backup + config test + rollback — never leaves nginx broken.
NGINX_WIRED=no
for cfg in /etc/nginx/sites-enabled/*; do
    [ -f "$cfg" ] || continue
    grep -q "chess.lawb.xyz" "$cfg" || continue
    if grep -q "location = /elo.json" "$cfg"; then
        echo "nginx: $cfg already serves /elo.json"
        NGINX_WIRED=yes
        continue
    fi
    cp "$cfg" "$cfg.bak-elo"
    # Insert the location right after each server_name line naming chess.lawb.xyz.
    # (In a port-80 redirect block a server-level return wins, so the extra location
    # there is inert — harmless.)
    awk '{ print } /server_name[^;]*chess\.lawb\.xyz/ {
        print "    location = /elo.json {";
        print "        alias /var/www/elo/elo.json;";
        print "        default_type application/json;";
        print "        add_header Access-Control-Allow-Origin *;";
        print "        add_header Cache-Control \"public, max-age=60\";";
        print "    }";
    }' "$cfg.bak-elo" > "$cfg"
    if nginx -t 2>/dev/null; then
        NGINX_WIRED=yes
        echo "nginx: wired /elo.json into $cfg"
    else
        mv "$cfg.bak-elo" "$cfg"
        echo "!! nginx config test FAILED after edit — restored $cfg untouched"
    fi
done
if [ "$NGINX_WIRED" = yes ]; then
    systemctl reload nginx && echo "nginx reloaded"
else
    echo "!! no chess.lawb.xyz nginx config found/wired — elo.json will not be public (Firebase fallback still works)"
fi

# Cron wrapper: cap the log so it can never fill the disk.
cat > run.sh << 'EOF'
#!/bin/bash
cd /root/elo-indexer
[ -f indexer.log ] && [ "$(stat -c%s indexer.log)" -gt 1000000 ] && tail -c 200000 indexer.log > indexer.log.tmp && mv indexer.log.tmp indexer.log
echo "--- $(date -u '+%F %T')" >> indexer.log
ELO_OUT_DIR=/var/www/elo node indexer.mjs >> indexer.log 2>&1
EOF
chmod +x run.sh

# First real publish right now (also proves the whole path before the cron takes over).
ELO_OUT_DIR=/var/www/elo node indexer.mjs
echo -n "public check: "
curl -s -o /dev/null -w "https://chess.lawb.xyz/elo.json -> HTTP %{http_code}\n" https://chess.lawb.xyz/elo.json || true

# Install the cron line once (marker-based, idempotent).
if ! crontab -l 2>/dev/null | grep -q 'elo-indexer/run.sh'; then
    (crontab -l 2>/dev/null; echo "*/10 * * * * /root/elo-indexer/run.sh") | crontab -
    echo "cron installed: every 10 minutes"
else
    echo "cron already installed"
fi

echo ""
echo "== DONE =="
echo "Scores publish to https://chess.lawb.xyz/elo.json every 10 minutes — no credentials needed."
echo "(Optional: a Firebase service-account key at /root/elo-indexer/service-account.json"
echo " additionally mirrors scores to the /chessElo Firebase node.)"
echo "Logs: tail -f /root/elo-indexer/indexer.log"
echo "To update the indexer later: re-run this script."
