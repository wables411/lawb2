#!/bin/bash
# Nginx configuration for chess.lawb.xyz

echo "=========================================="
echo "NGINX CONFIGURATION"
echo "=========================================="
echo ""

# Create Nginx config
echo "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/chess-api << 'NGINX_CONFIG'
server {
    listen 80;
    server_name chess.lawb.xyz;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONFIG

# Enable the site
echo "Enabling site..."
ln -sf /etc/nginx/sites-available/chess-api /etc/nginx/sites-enabled/

# Test Nginx config
echo "Testing Nginx configuration..."
if nginx -t; then
    echo "✓ Nginx configuration is valid"
    systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "✗ Nginx configuration has errors"
    exit 1
fi

echo ""
echo "=========================================="
echo "NGINX CONFIGURED!"
echo "=========================================="
echo ""
echo "Next: Set up SSL with Let's Encrypt"
echo "Run: sudo certbot --nginx -d chess.lawb.xyz"

