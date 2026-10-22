#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/environment.sh"
DOMAIN=${1:?Usage: domain.sh domain}
[[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]] || exit 1
apt-get install -y certbot python3-certbot-nginx
SERVER_IP_PATTERN=${SERVER_IP//./\\.}
sed -i "s/server_name $SERVER_IP_PATTERN;/server_name $DOMAIN;/g; s@https://$SERVER_IP_PATTERN\$request_uri@https://$DOMAIN\$request_uri@g" /etc/nginx/sites-available/default
nginx -t
systemctl reload nginx
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
systemctl enable --now certbot.timer
certbot renew --dry-run
