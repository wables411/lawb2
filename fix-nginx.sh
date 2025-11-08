#!/bin/bash
# Fix Nginx configuration conflicts

echo "=== Checking existing Nginx configs ==="
echo ""
echo "Enabled sites:"
ls -la /etc/nginx/sites-enabled/
echo ""
echo "Checking for chess.lawb.xyz in other configs:"
grep -r "chess.lawb.xyz" /etc/nginx/sites-enabled/ /etc/nginx/sites-available/ 2>/dev/null || echo "None found"
echo ""

echo "=== Starting Nginx ==="
systemctl start nginx
systemctl enable nginx
systemctl status nginx --no-pager | head -10

