#!/bin/sh
set -e

# Docker volume'lar root olarak mount edilir.
# Upload ve log dizinlerinin appuser tarafından yazılabilir olmasını sağla.
if [ "$(id -u)" = "0" ]; then
  chown -R appuser:appgroup /app/uploads /app/logs 2>/dev/null || true
  chmod -R 775 /app/uploads /app/logs 2>/dev/null || true
  exec su-exec appuser "$@"
else
  # Zaten appuser olarak çalışıyorsak doğrudan başlat
  exec "$@"
fi
