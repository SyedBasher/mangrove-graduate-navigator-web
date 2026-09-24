import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read=p=>readFileSync(p,'utf8');
const config=read('web/config.js');
const constraints=read('web/constraints-preview.js');
const client=read('web/api-client.js');
const full=read('web/full-report.js');
const headers=read('web/_headers');

test('public shell points proprietary calls at Mangrove private API',()=>{
  assert.match(config,/MANGROVE_API_BASE = 'https:\/\/api\.mangroveintel\.com\/api\/v1'/);
  assert.match(client,/\/assessment\/preview/);
  assert.match(client,/\/report\/full/);
  assert.match(client,/Authorization:/);
});

test('browser no longer calls proprietary Supabase functions directly',()=>{
  assert.doesNotMatch(constraints,/functions\.invoke\('generate-preview'/);
  assert.doesNotMatch(full,/functions\/v1\/render-paid-report-html/);
  assert.match(constraints,/generatePreview\(state\.sessionId/);
});

test('Cloudflare Pages CSP permits only the Mangrove gateway plus required client services',()=>{
  assert.match(headers,/https:\/\/api\.mangroveintel\.com/);
  assert.match(headers,/https:\/\/challenges\.cloudflare\.com/);
  assert.match(headers,/https:\/\/hdftqqhrsvespkdhunlr\.supabase\.co/);
});
