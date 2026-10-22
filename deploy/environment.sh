#!/usr/bin/env bash
# Source before provisioning so invalid configuration fails before any changes.
: "${SERVER_IP:?Export SERVER_IP with the deployment server IPv4 address}"
if [[ ! "$SERVER_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
  echo 'SERVER_IP must be a valid IPv4 address' >&2
  exit 1
fi
IFS=. read -r -a server_ip_octets <<< "$SERVER_IP"
for server_ip_octet in "${server_ip_octets[@]}"; do
  if (( 10#$server_ip_octet > 255 )); then
    echo 'SERVER_IP must be a valid IPv4 address' >&2
    exit 1
  fi
done
unset server_ip_octet server_ip_octets
