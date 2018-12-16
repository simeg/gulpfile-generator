.PHONY: ci-prepare coverage install lint link test

YARN=$(shell which yarn)
NPM=$(shell which npm)
NPM_BIN=$(shell npm bin)

ci-prepare:
	$(NPM) install -g yarn gulp codecov istanbul

coverage:
	@NODE_ENV=test $(NPM_BIN)/istanbul cover $(NPM_BIN)/_mocha --report lcovonly -- -R spec

install:
	@$(YARN)

lint:
	@NODE_ENV=test $(NPM_BIN)/gulp json lint

link:
	ln -s ./source/cli.js ./gulpfile-generator

test:
	@$(NPM_BIN)/gulp test
