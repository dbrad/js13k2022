install:
	./tools/7z/7za x tools.7z -otools -y
	mkdir build
	mkdir dist
	yarn install
	
uninstall:
	rm -rf build
	rm -rf dist
	rm -rf node_modules
	rm -f  tools/*.*

dev:
	rm -rf build/debug
	mkdir build/debug
	cp src/html/index.html build/debug/index.html
	node scripts/server.js

release:
	rm -rf build/release
	mkdir build/release
	cp src/html/index.html build/release/index.html
	node scripts/release-build.js | node_modules/.bin/terser --config-file scripts/terser.config.json -o build/release/game.js
	yarn roadroller build/release/game.js -O2 -Zab7 -Zlr1310 -Zmc4 -Zmd21 -S0,1,2,3,6,7,13,21,25,42,113,394 -o build/release/game.js
	rm -rf dist
	mkdir -p dist/src
	yarn html-inline -i ./build/release/index.html -o ./dist/src/index.html
	tools/7z/7za a -tzip dist/game.zip ./dist/src/*
	tools/ect-0.8.3.exe -9 -zip dist/game.zip
	node scripts/check-file-size.js
	tools/cloc-1.86 ./src/ts

release-web:
	rm -rf build/release
	mkdir build/release
	cp src/html/index.html build/release/index.html
	node scripts/release-build.js | node_modules/.bin/terser --config-file scripts/terser.config.json -o build/release/game.js
	yarn roadroller build/release/game.js -O1 -Zab7 -Zlr1310 -Zmc4 -Zmd21 -S0,1,2,3,6,7,13,21,25,42,113,394 -o build/release/game.js
	rm -rf dist
	mkdir -p dist/src
	yarn html-inline -i ./build/release/index.html -o ./dist/src/index.html
	tools/7z/7za a -tzip dist/game.zip ./dist/src/*
	tools/ect-0.8.3.exe -9 -zip dist/game.zip
	node scripts/check-file-size.js
	tools/cloc-1.86 ./src/ts

netlify-deploy:
	node_modules\.bin\netlify deploy --dir dist/src --prod