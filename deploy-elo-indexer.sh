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

# Cron wrapper: cap the log so it can never fill the disk.
cat > run.sh << 'EOF'
#!/bin/bash
cd /root/elo-indexer
[ -f indexer.log ] && [ "$(stat -c%s indexer.log)" -gt 1000000 ] && tail -c 200000 indexer.log > indexer.log.tmp && mv indexer.log.tmp indexer.log
echo "--- $(date -u '+%F %T')" >> indexer.log
node indexer.mjs >> indexer.log 2>&1
EOF
chmod +x run.sh

# Install the cron line once (marker-based, idempotent).
if ! crontab -l 2>/dev/null | grep -q 'elo-indexer/run.sh'; then
    (crontab -l 2>/dev/null; echo "*/10 * * * * /root/elo-indexer/run.sh") | crontab -
    echo "cron installed: every 10 minutes"
else
    echo "cron already installed"
fi

echo ""
echo "== DONE =="
if [ ! -f service-account.json ]; then
    echo "!! Firebase writes are OFF until you place the service-account key:"
    echo "   /root/elo-indexer/service-account.json  (see header of this script)"
fi
echo "Logs: tail -f /root/elo-indexer/indexer.log"
echo "To update the indexer later: re-run this script."
