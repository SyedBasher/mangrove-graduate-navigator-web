import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(p, 'utf8');
const index = read('web/index.html');
const privacy = read('web/privacy.html');
const robots = read('web/robots.txt');
const sitemap = read('web/sitemap.xml');
const manifest = read('web/site.webmanifest');
const packageJson = JSON.parse(read('package.json'));

test('homepage exposes canonical search metadata', () => {
  assert.match(index, /<link rel="canonical" href="https:\/\/graduate\.mangroveintel\.com\/" \/>/);
  assert.match(index, /name="robots" content="index,follow/);
  assert.match(index, /property="og:url" content="https:\/\/graduate\.mangroveintel\.com\/" \/>/);
  assert.match(index, /application\/ld\+json/);
});

test('search favicon uses a generated square PNG', () => {
  assert.match(index, /assets\/favicon-64\.png/);
  assert.match(index, /assets\/mangrove-graduate-navigator-icon-512\.png/);
  assert.match(packageJson.scripts.build, /build-icons\.mjs/);
  assert.ok(packageJson.devDependencies.sharp);
});

test('robots and sitemap expose canonical Graduate Navigator URLs', () => {
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Sitemap: https:\/\/graduate\.mangroveintel\.com\/sitemap\.xml/);
  assert.match(sitemap, /https:\/\/graduate\.mangroveintel\.com\//);
  assert.match(sitemap, /https:\/\/graduate\.mangroveintel\.com\/privacy\.html/);
  assert.doesNotMatch(sitemap, /full-report\.html/);
  assert.doesNotMatch(sitemap, /sample-report/);
});

test('privacy page is canonical and indexable', () => {
  assert.match(privacy, /rel="canonical" href="https:\/\/graduate\.mangroveintel\.com\/privacy\.html"/);
  assert.match(privacy, /name="robots" content="index,follow"/);
});

test('web manifest contains PNG application icons', () => {
  assert.match(manifest, /mangrove-graduate-navigator-icon-192\.png/);
  assert.match(manifest, /mangrove-graduate-navigator-icon-512\.png/);
});
