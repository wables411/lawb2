#!/bin/bash
# Check what's in the existing lawb2 directory

echo "=== CHECKING EXISTING SETUP ==="
echo ""

echo "=== Directory structure ==="
ls -la /root/lawb2/ 2>/dev/null | head -20

echo ""
echo "=== Stockfish API file ==="
if [ -f /root/lawb2/stockfish-api.cjs ]; then
    echo "Found stockfish-api.cjs:"
    head -30 /root/lawb2/stockfish-api.cjs
fi

echo ""
echo "=== Package.json ==="
if [ -f /root/lawb2/package.json ]; then
    cat /root/lawb2/package.json | grep -A 5 -B 5 "name\|scripts\|dependencies" | head -20
fi

echo ""
echo "=== Nginx sites ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null
echo ""
cat /etc/nginx/sites-enabled/* 2>/dev/null | grep -A 10 "server_name\|proxy_pass" | head -20

echo ""
echo "=== Systemd services ==="
systemctl list-units --type=service | grep -E "stockfish|chess|node" || echo "No chess/stockfish services"

echo ""
echo "=== PM2 processes ==="
pm2 list 2>/dev/null || echo "PM2 not installed or no processes"

