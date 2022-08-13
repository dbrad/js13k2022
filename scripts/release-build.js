const esbuild = require('esbuild');
const { DEFINITIONS } = require('./definitions');

const result = esbuild.buildSync({
  entryPoints: ["src/ts/game.ts"],
  bundle: true,
  format: 'iife',
  write: false,
  define: {
    "DEBUG": false,
    ...DEFINITIONS
  },
  loader: {
    ".webp": "dataurl"
  }
});

for (let out of result.outputFiles)
{
  console.log(out.text);
}