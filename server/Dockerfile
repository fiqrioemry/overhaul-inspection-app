FROM oven/bun:1.3.14
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
RUN bunx prisma generate --schema=prisma/schema.prisma

# Tambahkan ini
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

CMD bunx prisma migrate deploy --schema=prisma/schema.prisma && bun src/index.ts
