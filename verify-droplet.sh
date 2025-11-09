#!/bin/bash

# DigitalOcean Droplet Verification Script
# Run this script on your droplet to verify the Stockfish API setup

echo "=========================================="
echo "DigitalOcean Droplet Verification"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Note: Some checks require root. Run with sudo if needed."
    echo ""
fi

echo "1. System Information"
echo "-------------------"
echo "Hostname: $(hostname)"
echo "IP Address: $(hostname -I | awk '{print $1}')"
echo "OS: $(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo ""

echo "2. Docker Status"
echo "-------------------"
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    docker --version
    echo ""
    echo "Docker containers:"
    docker ps -a
    echo ""
    echo "Checking for chess-stockfish-api container:"
    if docker ps | grep -q chess-stockfish-api; then
        echo "✅ chess-stockfish-api container is RUNNING"
        echo ""
        echo "Container logs (last 20 lines):"
        docker logs --tail 20 chess-stockfish-api
    else
        echo "❌ chess-stockfish-api container is NOT running"
        echo ""
        echo "All containers:"
        docker ps -a
    fi
else
    echo "❌ Docker is NOT installed"
fi
echo ""

echo "3. Stockfish Installation"
echo "-------------------"
if command -v stockfish &> /dev/null; then
    echo "✅ Stockfish is installed"
    stockfish --version 2>&1 | head -1
else
    echo "❌ Stockfish is NOT installed"
fi
echo ""

echo "4. Nginx Status"
echo "-------------------"
if command -v nginx &> /dev/null; then
    echo "✅ Nginx is installed"
    echo ""
    echo "Nginx status:"
    systemctl status nginx --no-pager -l 2>&1 | head -5
    echo ""
    echo "Checking for chess-api config:"
    if [ -f /etc/nginx/sites-available/chess-api ]; then
        echo "✅ chess-api config exists"
        echo ""
        echo "Config file:"
        cat /etc/nginx/sites-available/chess-api
    elif [ -L /etc/nginx/sites-enabled/chess-api ]; then
        echo "✅ chess-api config is enabled"
    else
        echo "❌ chess-api config NOT found"
        echo ""
        echo "Available Nginx configs:"
        ls -la /etc/nginx/sites-available/ 2>/dev/null || echo "No sites-available directory"
        ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled directory"
    fi
else
    echo "❌ Nginx is NOT installed"
fi
echo ""

echo "5. SSL Certificate"
echo "-------------------"
if command -v certbot &> /dev/null; then
    echo "✅ Certbot is installed"
    echo ""
    echo "Certificates:"
    sudo certbot certificates 2>/dev/null || echo "Run with sudo to see certificates"
else
    echo "⚠️  Certbot is NOT installed (SSL may not be configured)"
fi
echo ""

echo "6. Port Status"
echo "-------------------"
echo "Checking port 3001 (Stockfish API):"
if netstat -tuln 2>/dev/null | grep -q :3001 || ss -tuln 2>/dev/null | grep -q :3001; then
    echo "✅ Port 3001 is LISTENING"
    netstat -tuln 2>/dev/null | grep :3001 || ss -tuln 2>/dev/null | grep :3001
else
    echo "❌ Port 3001 is NOT listening"
fi
echo ""
echo "Checking port 80 (HTTP):"
if netstat -tuln 2>/dev/null | grep -q :80 || ss -tuln 2>/dev/null | grep -q :80; then
    echo "✅ Port 80 is LISTENING"
else
    echo "❌ Port 80 is NOT listening"
fi
echo ""
echo "Checking port 443 (HTTPS):"
if netstat -tuln 2>/dev/null | grep -q :443 || ss -tuln 2>/dev/null | grep -q :443; then
    echo "✅ Port 443 is LISTENING"
else
    echo "❌ Port 443 is NOT listening"
fi
echo ""

echo "7. Local API Test"
echo "-------------------"
echo "Testing API on localhost:3001:"
if curl -s http://localhost:3001/api/stockfish > /dev/null; then
    echo "✅ API responds on localhost:3001"
    echo ""
    echo "Response:"
    curl -s http://localhost:3001/api/stockfish
    echo ""
else
    echo "❌ API does NOT respond on localhost:3001"
fi
echo ""

echo "8. File Check"
echo "-------------------"
echo "Checking for Stockfish API files:"
if [ -f /root/chess-api/simple-stockfish-api.js ] || [ -f ~/chess-api/simple-stockfish-api.js ]; then
    echo "✅ simple-stockfish-api.js found"
else
    echo "❌ simple-stockfish-api.js NOT found"
    echo "Looking in common locations:"
    find /root /home -name "simple-stockfish-api.js" 2>/dev/null | head -5
fi
echo ""

if [ -f /root/chess-api/docker-compose.chess-api.yml ] || [ -f ~/chess-api/docker-compose.chess-api.yml ]; then
    echo "✅ docker-compose.chess-api.yml found"
else
    echo "❌ docker-compose.chess-api.yml NOT found"
fi
echo ""

echo "9. DNS Check (from droplet)"
echo "-------------------"
echo "Checking DNS resolution for chess.lawb.xyz:"
if dig +short chess.lawb.xyz 2>/dev/null | grep -q .; then
    echo "✅ DNS resolves:"
    dig +short chess.lawb.xyz
    echo ""
    echo "Current droplet IP:"
    hostname -I | awk '{print $1}'
else
    echo "❌ DNS does NOT resolve (or dig not installed)"
fi
echo ""

echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. If Docker container is not running: cd ~/chess-api && docker compose -f docker-compose.chess-api.yml up -d"
echo "2. If Nginx is not configured: Check /etc/nginx/sites-available/chess-api"
echo "3. If SSL is not set up: sudo certbot --nginx -d chess.lawb.xyz"
echo "4. If DNS doesn't resolve: Configure A record at your domain registrar"

