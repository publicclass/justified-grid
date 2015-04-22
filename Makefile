.PHONY: build
.SUFFIXES:

VERSION=$(shell node -e 'console.log(require("./package.json").version)')

build: examples/justified-grid.min.js
	@: # silent!

examples/%.min.js: examples/justified-grid.js
	@./node_modules/.bin/browserify -s justifyGrid -t uglifyify $< > $@

examples/justified-grid.js: index.js
	@./node_modules/.bin/browserify -s justifyGrid $< > $@
