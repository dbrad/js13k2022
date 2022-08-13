[![Deploy To itch.io](https://github.com/dbrad/gamedev-js-2022/actions/workflows/deploy-to-itch-io.yml/badge.svg?branch=main)](https://github.com/dbrad/gamedev-js-2022/actions/workflows/deploy-to-itch-io.yml)

<br />

# Untamed Land by David Brad

### Original Version: https://fanlix.itch.io/gamedevjs-2022
### Current Version: https://fanlix.itch.io/untamed-lands

<br />
<br />

# About this project
- This project is written in TypeScript, and transpiled using the [esbuild](https://esbuild.github.io/) package.
- This project's build tools require [node.js](https://nodejs.org/en/download/) v16.8 or higher.
- This project makes use of the [yarn](https://yarnpkg.com/getting-started) package manager.
    - https://yarnpkg.com/getting-started/install
- The build tools are meant to be run on Windows, using a bash-like terminal such as Git Bash or WSL.

## This project uses a makefile to streamline the various build commands:
- ```make install``` - Installs all dependancies, and unzips some build tools from the tools.7z file included.
- ```make uninstall``` - Removes build folders, dist folders, node_modules, and tools.
- ```make dev``` - Development build process, puts the build into watch mode, and serves the game from "http://127.0.0.1:8000/".
- ```make release``` - Release build process, this will perform a single minified transpile, inline all code into the index.html, and zip the index.html and any other assets into "/dist/game.zip".
- ```make butler-deploy``` - Calls the itch.io "butler" CLI to upload the game.zip file to the itch.io project defined in the makefile.

<br />

[![Creative Commons License](https://i.creativecommons.org/l/by-nc-sa/4.0/80x15.png)](http://creativecommons.org/licenses/by-nc-sa/4.0/)  
This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).