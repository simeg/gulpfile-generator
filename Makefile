.PHONY: ci-prepare coverage install lint test

YARN=$(shell which yarn)
NPM=$(shell which npm)
NPM_BIN=$(shell npm bin)

ci-prepare:
	$(NPM) install -g yarn gulp codecov istanbul

coverage:
	@NODE_ENV=test $(NPM_BIN)/istanbul cover $(NPM_BIN)/mocha --report lcovonly -- -R spec

install:
	@$(YARN)

lint:
	@NODE_ENV=test $(NPM_BIN)/gulp json lint

test:
	@$(NPM_BIN)/gulp test
