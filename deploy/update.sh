#!/usr/bin/env bash
# Routine deployment; never provisions nginx/MongoDB or reads database secrets.
set -euo pipefail
if (( EUID != 0 )); then
  exec sudo -n bash "$0" "$@"
fi
archive=${1:?Usage: bash deploy/update.sh /path/to/blackjack.tar.gz}
app=/opt/blackjack
exec 9>/var/lock/blackjack-deploy.lock
flock -w 600 9

check_environment() {
  test -s "$app/.env"
  test "$(stat -c '%U:%G %a' "$app/.env")" = 'blackjack:blackjack 600'
}
check_environment
stage=$(mktemp -d /opt/blackjack-stage.XXXXXXXX)
trap 'rm -rf -- "$stage"' EXIT
tar -xzf "$archive" -C "$stage"
cd "$stage"
npm ci --omit=dev
npm --prefix frontend ci
npm test
npm --prefix frontend run lint
npm --prefix frontend run build
test -s frontend/dist/index.html

# Build before changing live files. Protect the host environment and Git metadata.
rsync -a --delete --exclude='/.env' --exclude='/.git/' "$stage/" "$app/"
check_environment
test -s "$app/frontend/dist/index.html"
systemctl restart blackjack
systemctl is-active --quiet blackjack mongod nginx
for path in / /api/health /api/leaderboard; do
  curl --fail --silent --show-error --retry 10 --retry-connrefused \
    --retry-delay 2 --retry-all-errors --max-time 10 \
    "https://cruddylit.com$path" -o /dev/null
done
echo 'Deployment and public health checks succeeded.'
