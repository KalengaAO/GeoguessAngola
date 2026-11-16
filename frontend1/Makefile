.PHONY: all run setup dev build start install lint lint-fix format format-check check fix prepare husky clean help

all: run

run: dev

setup: install husky

dev:
	pnpm dev

build:
	pnpm build

start: build
	pnpm start

install:
	pnpm install

lint:
	pnpm lint

lint-fix:
	pnpm exec eslint . --fix
	pnpm lint . --fix

format:
	pnpm exec prettier . --write

format-check:
	pnpm exec prettier . --check

check: format-check lint build

fix: format lint-fix

prepare: husky

husky:
	pnpm exec husky
	@if [ -f .husky/pre-commit ]; then chmod +x .husky/pre-commit; fi

clean:
	rm -rf .next

help:
	@printf '%s\n' 'GeoAngola - comandos de desenvolvimento'
	@printf '%s\n' '' 'PRIMEIRA CONFIGURACAO:'
	@printf '%s\n' '  make setup         Instala dependencias e prepara o Husky'
	@printf '%s\n' '  make install       Instala dependencias; o pnpm executa o prepare automaticamente'
	@printf '%s\n' '  make husky         Recria/prepara a pasta de hooks do Husky'
	@printf '%s\n' '' 'RODAR O PROJETO:'
	@printf '%s\n' '  make dev           Inicia o Next.js em desenvolvimento'
	@printf '%s\n' '  make start         Gera o build automaticamente e inicia producao'
	@printf '%s\n' '  make build         Gera o build de producao sem iniciar o servidor'
	@printf '%s\n' '' 'CORRIGIR PROBLEMAS:'
	@printf '%s\n' '  make format        Formata todos os arquivos com Prettier'
	@printf '%s\n' '  make format-check  Verifica a formatacao sem alterar arquivos'
	@printf '%s\n' '  make lint          Procura erros com ESLint'
	@printf '%s\n' '  make lint-fix      Corrige automaticamente problemas do ESLint'
	@printf '%s\n' '  make fix           Executa formatacao e correcao automatica do ESLint'
	@printf '%s\n' '  make check         Verifica Prettier, ESLint e build de producao'
	@printf '%s\n' '' 'MANUTENCAO:'
	@printf '%s\n' '  make clean         Remove o diretorio .next'
	@printf '%s\n' '' 'FLUXO RECOMENDADO:'
	@printf '%s\n' '  1. make setup      (apenas na primeira vez)'
	@printf '%s\n' '  2. make dev        (desenvolvimento diario)'
	@printf '%s\n' '  3. make fix        (antes de enviar alteracoes)'
	@printf '%s\n' '  4. make check      (validacao final antes do pull request)'