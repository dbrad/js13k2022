const esbuild = require('esbuild');
const http = require('http');
const { DEFINITIONS } = require('./definitions');

esbuild.serve({
  servedir: "build/debug",
  host: "localhost"
}, {
  entryPoints: ["src/ts/game.ts"],
  bundle: true,
  format: 'iife',
  sourcemap: true,
  outfile: "build/debug/game.js",
  define: {
    "DEBUG": true,
    ...DEFINITIONS
  },
  loader: {
    ".webp": "dataurl"
  }
}).then(result =>
{
  const { host, port } = result;

  http.createServer((req, res) =>
  {
    const options = {
      hostname: host,
      port: port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, proxyRes =>
    {
      if (proxyRes.statusCode === 404)
      {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>A custom 404 page</h1>');
        return;
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Cross-origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-origin-Opener-Policy', 'same-origin');
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    req.pipe(proxyReq, { end: true });
  }).listen(3000);

  console.log(`Serving running on http://localhost:3000`);
});