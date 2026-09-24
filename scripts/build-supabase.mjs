import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

await mkdir('web/vendor', { recursive: true });

await build({
  entryPoints: ['scripts/supabase-entry.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  legalComments: 'external',
  outfile: 'web/vendor/supabase-js-2.95.0.js',
});
