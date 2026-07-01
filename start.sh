#!/usr/bin/env bash
set -e

echo "=== Building frontend ==="
npm install
npm run build

echo "=== Building server ==="
cd server
npm install
npx prisma generate
npx prisma db push
npx tsx src/seed.ts
npx tsc

echo "=== Starting server ==="
exec node dist/index.js
