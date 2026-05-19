ENV ?= development

# ─── Development ───────────────────────────────────────────
run:
	bun --env-file=.env.$(ENV) run --hot src/index.ts

install:
	bun install

reset:
	bunx prisma migrate reset

prisma-init:
	bunx prisma init --datasource-provider postgresql

generate:
	bunx prisma generate --schema=prisma/schema.prisma

migrate:
	@if [ -z "$(name)" ]; then \
		echo "❌ Please provide migration name: make migrate name=your_name"; \
		exit 1; \
	fi
	bunx prisma migrate dev --name $(name) --schema=prisma/schema.prisma

seed:
	bun run prisma/seed.ts

up:
	docker compose -f docker-compose.dev.yml up -d --build

down:
	docker compose -f docker-compose.dev.yml down

# ─── Production ────────────────────────────────────────────

# Pertama kali deploy (dari nol)
prod-init:
	bun install --production
	bunx prisma generate --schema=prisma/schema.prisma
	bunx prisma migrate deploy --schema=prisma/schema.prisma
	docker compose -f docker-compose.prod.yml up -d --build

# Update (push berikutnya) — tidak down -v, container tetap jalan
prod-update:
	bun install --production
	bunx prisma generate --schema=prisma/schema.prisma
	bunx prisma migrate deploy --schema=prisma/schema.prisma
	docker compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml down