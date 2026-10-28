import { defineConfig } from 'vite';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const files = {
  '/__effects/config': resolve('src/effects.config.json'),
  '/__effects/presets': resolve('src/effects.presets.json'),
};

// Dev-only endpoints the playground uses to write values back to disk.
// `apply: 'serve'` keeps this out of `vite build` entirely.
const effectsWriter = {
  name: 'effects-writer',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const file = files[req.url];
      if (!file || req.method !== 'POST') return next();
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        try {
          await writeFile(file, JSON.stringify(JSON.parse(body), null, 2) + '\n');
          res.statusCode = 204;
        } catch (err) {
          res.statusCode = 400;
          res.write(String(err));
        }
        res.end();
      });
    });
  },
};

export default defineConfig({
  plugins: [effectsWriter],
  build: {
    // Only the real site is built; playground/ never reaches dist/.
    rollupOptions: { input: resolve('index.html') },
  },
});
