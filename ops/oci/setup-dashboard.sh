#!/usr/bin/env bash
set -euo pipefail

# Dashboard Setup Script for OCI VM
# Installs: Python pip, Streamlit deps, nginx, certbot
# Usage: ssh into VM then: sudo bash /opt/michael-business/portfolio-michael-santos/ops/oci/setup-dashboard.sh

DASHBOARD_DIR="/opt/michael-business/portfolio-michael-santos/dashboard"
NGINX_CONF_SRC="/opt/michael-business/portfolio-michael-santos/ops/oci/nginx/dashboard.conf"
DOMAIN="${DASHBOARD_DOMAIN:-analytics.michael.business}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-michael@michael.business}"

echo "=== Dashboard Setup ==="

# 1. Install system packages
echo "[1/6] Installing system packages"
dnf install -y python3-pip nginx certbot python3-certbot-nginx httpd-tools

# 2. Install Python dependencies
echo "[2/6] Installing Python dependencies"
sudo -u michaelworker pip3 install --user -r "$DASHBOARD_DIR/requirements.txt"

# 3. Install systemd service
echo "[3/6] Installing Streamlit systemd service"
STREAMLIT_PATH=$(sudo -u michaelworker bash -lc 'which streamlit 2>/dev/null || echo /home/michaelworker/.local/bin/streamlit')
cp /opt/michael-business/portfolio-michael-santos/ops/oci/systemd/michael-dashboard.service /etc/systemd/system/
sed -i "s|/usr/local/bin/streamlit|${STREAMLIT_PATH}|g" /etc/systemd/system/michael-dashboard.service
systemctl daemon-reload
systemctl enable michael-dashboard.service

# 4. Setup nginx
echo "[4/6] Configuring nginx"
cp "$NGINX_CONF_SRC" /etc/nginx/conf.d/dashboard.conf

if [[ ! -f /etc/nginx/conf.d/.htpasswd ]]; then
  echo "  Creating .htpasswd (set your password now)"
  htpasswd -c /etc/nginx/conf.d/.htpasswd michael
else
  echo "  .htpasswd already exists"
fi

nginx -t

# 5. Firewall
echo "[5/6] Opening firewall ports"
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 6. SSL certificate
echo "[6/6] Obtaining SSL certificate"
if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  echo "  Certificate already exists for ${DOMAIN}"
else
  echo "  Requesting certificate for ${DOMAIN}"
  echo "  IMPORTANT: DNS A record for ${DOMAIN} must point to this VM IP first"
  certbot --nginx -d "$DOMAIN" --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --redirect
fi

# Start services
systemctl enable --now nginx
systemctl start michael-dashboard.service

echo ""
echo "=== Dashboard Setup Complete ==="
echo "Streamlit: systemctl status michael-dashboard"
echo "Nginx: systemctl status nginx"
echo "URL: https://${DOMAIN}"
echo ""
echo "If SSL failed, ensure DNS points ${DOMAIN} -> $(curl -s ifconfig.me) then rerun certbot:"
echo "  certbot --nginx -d ${DOMAIN} --email ${CERTBOT_EMAIL} --agree-tos --no-eff-email"
