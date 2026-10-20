ifeq ($(OS),Windows_NT)
NPM := npm.cmd
else
NPM := npm
endif

COMPOSE := docker compose -f infra/local/compose.yaml

.PHONY: run build infra-up infra-down infra-ps infra-logs infra-config

run:
	$(NPM) run dev

build:
	$(NPM) run build

infra-up:
	$(COMPOSE) up -d --build

infra-down:
	$(COMPOSE) down

infra-ps:
	$(COMPOSE) ps

infra-logs:
	$(COMPOSE) logs -f

infra-config:
	$(COMPOSE) config -q
