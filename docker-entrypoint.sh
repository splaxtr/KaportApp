#!/bin/sh
set -e

# Docker volume'lar root olarak mount edilir.
# Upload ve log dizinlerinin appuser tarafından yazılabilir olmasını sağla.
if [ "$(id -u)" = "0" ]; then
  chown -R appuser:appgroup /app/uploads /app/logs 2>/dev/null || true
  chmod -R 775 /app/uploads /app/logs 2>/dev/null || true

  # Migration: veritabanı şemasını güncelle
  echo "Running database migrations..."
  su-exec appuser npx prisma migrate deploy || echo "Migration failed (non-fatal), continuing..."

  # Seed: roller, yetkiler, durumlar ve admin kullanıcı oluştur (idempotent)
  echo "Running database seed..."
  su-exec appuser node prisma/seed.js || echo "Seed failed (non-fatal), continuing..."

  exec su-exec appuser "$@"
else
  # Zaten appuser olarak çalışıyorsak
  echo "Running database migrations..."
  npx prisma migrate deploy || echo "Migration failed (non-fatal), continuing..."

  echo "Running database seed..."
  node prisma/seed.js || echo "Seed failed (non-fatal), continuing..."

  exec "$@"
fi
