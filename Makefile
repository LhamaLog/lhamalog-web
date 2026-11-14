ifeq ($(OS),Windows_NT)
NPM := npm.cmd
else
NPM := npm
endif

# Produção local: React compilado servido pelo Nginx (compose.yaml na raiz).
COMPOSE := docker compose
# Alternativa de desenvolvimento: servidor Vite. Não use ao mesmo tempo (porta 5173).
COMPOSE_DEV := docker compose -f compose.dev.yaml

.PHONY: run build test up down logs status config dev dev-down dev-logs dev-status \
	infra-up infra-down infra-ps infra-logs infra-config

run:
	$(NPM) run dev

build:
	$(NPM) run build

test:
	$(NPM) test

# Sobe o frontend compilado em segundo plano.
up: infra-up

infra-up:
	$(COMPOSE) up -d --build

# Para e remove os containers. Volumes nomeados são mantidos.
down: infra-down

infra-down:
	$(COMPOSE) down

logs: infra-logs

infra-logs:
	$(COMPOSE) logs -f

status: infra-ps

infra-ps:
	$(COMPOSE) ps

config: infra-config

infra-config:
	$(COMPOSE) config -q

dev:
	$(COMPOSE_DEV) up -d --build

dev-down:
	$(COMPOSE_DEV) down

dev-logs:
	$(COMPOSE_DEV) logs -f

dev-status:
	$(COMPOSE_DEV) ps
