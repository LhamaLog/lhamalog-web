#!/bin/sh
# Writes the public browser config consumed by the SPA.
# The publishable Clerk key, the API origin and the optional OTLP endpoint are runtime settings.
# This script refuses secret keys and never prints the provided values.
set -eu

fail() {
  echo "lhamalog-web: $*" >&2
  exit 1
}

KEY=${VITE_CLERK_PUBLISHABLE_KEY:-}
API=${VITE_API_URL:-http://localhost:8080}
API=$(printf '%s' "$API" | sed 's#/*$##')

case "$KEY" in
  sk_*|*sk_test*|*sk_live*)
    fail "recusando chave secreta. Use apenas a chave publicável (pk_test_ ou pk_live_). A CLERK_SECRET_KEY não entra no frontend."
    ;;
esac

case "$KEY" in
  pk_test_*|pk_live_*) ;;
  "")
    fail "defina VITE_CLERK_PUBLISHABLE_KEY no arquivo .env com a chave publicável (pk_test_ ou pk_live_)."
    ;;
  *)
    fail "VITE_CLERK_PUBLISHABLE_KEY deve começar com pk_test_ ou pk_live_."
    ;;
esac

case "$KEY" in
  *[!A-Za-z0-9+/=_-]*)
    fail "VITE_CLERK_PUBLISHABLE_KEY contém caracteres inválidos."
    ;;
esac

if [ "${#KEY}" -lt 16 ] || [ "${#KEY}" -gt 300 ]; then
  fail "VITE_CLERK_PUBLISHABLE_KEY tem tamanho inesperado."
fi

case "$API" in
  http://*|https://*) ;;
  *)
    fail "VITE_API_URL deve ser uma URL http ou https alcançável pelo navegador."
    ;;
esac

case "$API" in
  *[\ \"\'\\@?\#]*)
    fail "VITE_API_URL deve ser só a origem, sem usuário, senha, caminho ou espaços."
    ;;
esac

case "$API" in
  https://*) rest=${API#https://} ;;
  http://*) rest=${API#http://} ;;
esac

case "$rest" in
  ""|*/*)
    fail "VITE_API_URL deve ser só a origem (esquema, host e porta), sem caminho."
    ;;
esac

if [ "${#API}" -gt 500 ]; then
  fail "VITE_API_URL é longa demais."
fi

# Optional addresses of the OTLP receiver shown in the OpenTelemetry tab: HTTP (spec 011, F4 and N4) and gRPC
# (spec 014, I2). Same rules for both; the messages name the variable and never print the value.
check_otlp() {
  name=$1
  value=$2
  [ -n "$value" ] || return 0

  case "$value" in
    http://*|https://*) ;;
    *)
      fail "$name deve ser uma URL http ou https."
      ;;
  esac

  case "$value" in
    *[\ \"\'\\@?\#]*)
      fail "$name não pode ter usuário, senha, parâmetros, âncora, aspas ou espaços."
      ;;
  esac

  if [ "${#value}" -gt 500 ]; then
    fail "$name é longa demais."
  fi
}

OTLP=${VITE_OTLP_ENDPOINT:-}
OTLP=$(printf '%s' "$OTLP" | sed 's#/*$##')
check_otlp VITE_OTLP_ENDPOINT "$OTLP"

OTLP_GRPC=${VITE_OTLP_GRPC_ENDPOINT:-}
OTLP_GRPC=$(printf '%s' "$OTLP_GRPC" | sed 's#/*$##')
check_otlp VITE_OTLP_GRPC_ENDPOINT "$OTLP_GRPC"

mkdir -p /tmp/lhamalog
tmp=$(mktemp /tmp/lhamalog/config.XXXXXX)
cat > "$tmp" <<EOF
window.__LHAMALOG_CONFIG__={"clerkPublishableKey":"$KEY","apiUrl":"$API","otlpEndpoint":"$OTLP","otlpGrpcEndpoint":"$OTLP_GRPC"};
EOF
chmod 644 "$tmp"
mv "$tmp" /tmp/lhamalog/config.js
