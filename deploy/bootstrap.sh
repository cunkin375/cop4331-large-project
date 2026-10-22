#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/environment.sh"
apt-get update -qq
apt-get install -y curl gnupg openssl nginx
if ! command -v mongod >/dev/null; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
  echo 'deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse' > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -qq
  apt-get install -y mongodb-org
fi
systemctl enable --now mongod
id blackjack >/dev/null 2>&1 || useradd --system --home /opt/blackjack --shell /usr/sbin/nologin blackjack
cd /opt/blackjack
npm ci --omit=dev
npm --prefix frontend ci
npm --prefix frontend run build
if [ ! -f .env ]; then
  umask 077
  DB_PASSWORD=$(openssl rand -hex 32)
  printf 'MONGODB_URI=mongodb://blackjack:%s@127.0.0.1:27017/blackjack\nMONGODB_DB=blackjack\nPORT=5000\n' "$DB_PASSWORD" > .env
  DB_PASSWORD="$DB_PASSWORD" mongosh --quiet --eval 'db.getSiblingDB("blackjack").createUser({user:"blackjack",pwd:process.env.DB_PASSWORD,roles:[{role:"dbOwner",db:"blackjack"}]})'
  printf '\nsecurity:\n  authorization: enabled\n' >> /etc/mongod.conf
  systemctl restart mongod
fi
chown -R blackjack:blackjack /opt/blackjack
chmod 600 .env
cat > /etc/systemd/system/blackjack.service <<'UNIT'
[Unit]
Description=Blackjack Express API
After=network.target mongod.service
Requires=mongod.service
[Service]
User=blackjack
Group=blackjack
WorkingDirectory=/opt/blackjack
ExecStart=/usr/local/bin/node --env-file=.env server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
[Install]
WantedBy=multi-user.target
UNIT
mkdir -p /etc/nginx/tls
if [ ! -f /etc/nginx/tls/blackjack.crt ]; then
  openssl req -x509 -nodes -newkey rsa:3072 -days 365 -keyout /etc/nginx/tls/blackjack.key -out /etc/nginx/tls/blackjack.crt -subj "/CN=$SERVER_IP" -addext "subjectAltName=IP:$SERVER_IP"
  chmod 600 /etc/nginx/tls/blackjack.key
fi
cp -a /etc/nginx/sites-available/default /etc/nginx/sites-available/default.before-blackjack
cat > /etc/nginx/sites-available/default <<NGINX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${SERVER_IP};
    return 301 https://${SERVER_IP}\$request_uri;
}
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name ${SERVER_IP};
    ssl_certificate /etc/nginx/tls/blackjack.crt;
    ssl_certificate_key /etc/nginx/tls/blackjack.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    root /opt/blackjack/frontend/dist;
    index index.html;
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location / { try_files \$uri \$uri/ /index.html; }
}
NGINX
nginx -t
systemctl daemon-reload
systemctl enable --now blackjack
systemctl restart blackjack
systemctl reload nginx
if ufw status | grep -q 'Status: active'; then ufw allow 'Nginx Full'; fi
