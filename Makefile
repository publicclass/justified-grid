.PHONY: build
.SUFFIXES:

VERSION=$(shell node -e 'console.log(require("./package.json").version)')

build: justified-grid-${VERSION}.min.js justified-grid-latest.min.js
	@: # silent!

%.min.js: justified-grid.js
	@./node_modules/.bin/browserify -s justifyGrid -t uglifyify $< > $@

justified-grid.js: index.js
	@./node_modules/.bin/browserify -s justifyGrid $< > $@
