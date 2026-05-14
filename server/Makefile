ENV ?= development

run:
	bun --env-file=.env.$(ENV) run --hot src/index.ts

init:
	bun install

reset:
	bunx prisma migrate reset

init:
	bunx prisma init --datasource-provider postgresql --output @/generated/prisma

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