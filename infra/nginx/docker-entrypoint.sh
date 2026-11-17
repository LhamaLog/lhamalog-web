#!/bin/sh
set -eu
# shellcheck disable=SC1091
. /lhamalog-render-config.sh
exec /docker-entrypoint.sh "$@"
