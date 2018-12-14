.PHONY: test

NPM=$(shell which npm)
NPM_BIN=$(shell npm bin)

test:
	$(NPM_BIN)/gulp test
