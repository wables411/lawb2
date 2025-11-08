#!/bin/bash
# Comprehensive droplet check script

echo "=========================================="
echo "DIGITALOCEAN DROPLET STATUS CHECK"
echo "=========================================="
echo ""

echo "=== SYSTEM INFO ==="
echo "Hostname: $(hostname)"
echo "IP: $(hostname -I | awk '{print $1}')"
echo "Uptime: $(uptime -p)"
echo ""

echo "=== DOCKER STATUS ==="
if command -v docker &> /dev/null; then
    echo "✓ Docker is INSTALLED"
    docker --version
    echo ""
    echo "Running containers:"
    docker ps
    echo ""
    echo "All containers (including stopped):"
    docker ps -a
else
    echo "✗ Docker is NOT INSTALLED"
fi
echo ""

echo "=== PORT 3001 STATUS ==="
if sudo lsof -i :3001 &> /dev/null; then
    echo "✓ Port 3001 is IN USE:"
    sudo lsof -i :3001
else
    echo "✗ Port 3001 is FREE (nothing running)"
fi
echo ""

echo "=== STOCKFISH STATUS ==="
if command -v stockfish &> /dev/null; then
    echo "✓ Stockfish is INSTALLED"
    stockfish --version
else
    echo "✗ Stockfish is NOT INSTALLED"
fi
echo ""

echo "=== NODE.JS PROCESSES ==="
NODE_PROCS=$(ps aux | grep -E "node|stockfish" | grep -v grep)
if [ -n "$NODE_PROCS" ]; then
    echo "✓ Found Node.js/Stockfish processes:"
    echo "$NODE_PROCS"
else
    echo "✗ No Node.js/Stockfish processes running"
fi
echo ""

echo "=== NGINX STATUS ==="
if command -v nginx &> /dev/null; then
    echo "✓ Nginx is INSTALLED"
    sudo nginx -t 2>&1
    echo ""
    echo "Enabled sites:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "  (none)"
else
    echo "✗ Nginx is NOT INSTALLED"
fi
echo ""

echo "=== CHESS/STOCKFISH FILES ==="
FILES=$(find /root -name "*stockfish*" -o -name "*chess*" 2>/dev/null | head -10)
if [ -n "$FILES" ]; then
    echo "✓ Found files:"
    echo "$FILES"
else
    echo "✗ No chess/stockfish files found in /root"
fi
echo ""

echo "=== DISK USAGE ==="
df -h | grep -E "Filesystem|/dev/"
echo ""

echo "=== MEMORY USAGE ==="
free -h
echo ""

echo "=== RECENT LOGINS ==="
last -n 5
echo ""

echo "=========================================="
echo "CHECK COMPLETE"
echo "=========================================="
