const esbuild = require('esbuild');
const { DEFINITIONS } = require('./definitions');
const { stringsPlugin } = require('./strings-plugin');

esbuild.build({
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
  },
  plugins: [stringsPlugin]
}).then(result =>
{

  for (let out of result.outputFiles)
  {
    console.log(out.text);
  }
});
