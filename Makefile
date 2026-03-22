.DEFAULT_GOAL := help

# ── Help ────────────────────────────────────────────────────────────

.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  setup              Install deps, copy .env templates"
	@echo "  dev                Start Next.js + Convex"
	@echo ""
	@echo "Build:"
	@echo "  build              Build all packages"
	@echo "  lint               Lint all packages"
	@echo "  typecheck          Type-check all packages"
	@echo ""
	@echo "Deploy:"
	@echo "  deploy-convex      Deploy Convex backend"
	@echo "  deploy-graphiti-main  Deploy Graphiti (main) to Fly.io"
	@echo "  deploy-graphiti-test  Deploy Graphiti (test) to Fly.io"
	@echo "  deploy             Deploy Convex + Graphiti main"

# ── Development ─────────────────────────────────────────────────────

.PHONY: setup dev

setup:
	pnpm install
	@[ -f .env ] || cp .env.example .env
	@[ -f apps/web/.env.local ] || cp apps/web/.env.example apps/web/.env.local
	@echo ""
	@echo "Setup done. Edit .env files with your API keys:"
	@echo "  .env                              (OPENAI_API_KEY, CONVEX_DEPLOY_KEY)"
	@echo "  apps/web/.env.local               (WorkOS keys)"

dev:
	pnpm dev

# ── Build ───────────────────────────────────────────────────────────

.PHONY: build lint typecheck

build:
	pnpm build

lint:
	pnpm lint

typecheck:
	pnpm typecheck

# ── Deploy ──────────────────────────────────────────────────────────

.PHONY: deploy deploy-convex deploy-graphiti-main deploy-graphiti-test

deploy-convex:
	npx convex deploy

deploy-graphiti-main:
	cd services/knowledge-engine && ./deploy.sh main

deploy-graphiti-test:
	cd services/knowledge-engine && ./deploy.sh test

deploy: deploy-convex deploy-graphiti-main
	@echo ""
	@echo "Convex deployed. Vercel deploys via webhook on main push."
