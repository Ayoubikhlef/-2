FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/prisma ./server/prisma/
RUN cd server && npx prisma generate

COPY server/ ./server/

WORKDIR /app/server

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx src/seed.ts && npx tsx src/index.ts"]
