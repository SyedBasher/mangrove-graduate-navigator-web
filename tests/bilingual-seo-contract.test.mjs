import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { renderPage, PAGE_URL } from '../scripts/prerender-pages.mjs';
import { welcomeMarkup } from '../web/welcome-markup.js';
import { copy } from '../web/data-refined.js';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const pages = { en: read('web/index.html'), bn: read('web/bn/index.html') };
const runtime = read('web/runtime.js');
const app = read('web/app.js');
const robots = read('web/robots.txt');
const sitemap = read('web/sitemap.xml');

test('committed language pages match the prerender script output', () => {
  assert.equal(pages.en, renderPage('en'), 'run: node scripts/prerender-pages.mjs');
  assert.equal(pages.bn, renderPage('bn'), 'run: node scripts/prerender-pages.mjs');
});

test('each page carries its own language, canonical address and hreflang alternates', () => {
  for (const lang of ['en', 'bn']) {
    const html = pages[lang];
    assert.match(html, new RegExp(`<html lang="${lang}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${PAGE_URL[lang]}" />`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="${PAGE_URL.en}" />`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="bn" href="${PAGE_URL.bn}" />`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${PAGE_URL.en}" />`));
    assert.ok(html.includes(`<meta property="og:url" content="${PAGE_URL[lang]}" />`));
  }
  assert.equal(PAGE_URL.en, 'https://graduate.mangroveintel.com/');
  assert.equal(PAGE_URL.bn, 'https://graduate.mangroveintel.com/bn/');
});

test('interface text is in the HTML before scripts run, in the right language', () => {
  for (const lang of ['en', 'bn']) {
    const html = pages[lang];
    for (const key of ['startEyebrow', 'startTitle', 'start', 'sample', 'privacy', 'privacy3']) {
      assert.ok(html.includes(copy[lang][key]), `${lang} page is missing ${key}`);
    }
    assert.ok(html.includes(welcomeMarkup(lang)), `${lang} welcome markup is not prerendered`);
  }
  assert.ok(!pages.en.includes(copy.bn.startTitle));
  assert.ok(!pages.bn.includes(copy.en.startTitle));
});

test('language switch links between the two addresses and marks the current one', () => {
  assert.match(pages.en, /<a href="\/" hreflang="en" lang="en" class="active" aria-current="page" data-language="en">English<\/a>/);
  assert.match(pages.en, /<a href="\/bn\/" hreflang="bn" lang="bn" data-language="bn">বাংলা<\/a>/);
  assert.match(pages.bn, /<a href="\/" hreflang="en" lang="en" data-language="en">English<\/a>/);
  assert.match(pages.bn, /<a href="\/bn\/" hreflang="bn" lang="bn" class="active" aria-current="page" data-language="bn">বাংলা<\/a>/);
  assert.doesNotMatch(app, /localStorage\.setItem\('gcn_lang'/);
});

test('the address alone decides the interface language; the root is always English', () => {
  assert.match(runtime, /lang: pageLanguage\(\)/);
  assert.doesNotMatch(runtime, /localStorage\.getItem\('gcn_lang'\)/);
  assert.doesNotMatch(app, /state\.lang = session\.language/);
  const match = runtime.match(/return (\/\^.*?\/)\.test\(pathname\)/);
  assert.ok(match, 'pageLanguage pattern not found');
  const pattern = eval(match[1]);
  for (const path of ['/bn/', '/bn', '/bn/index.html']) assert.ok(pattern.test(path), path);
  for (const path of ['/', '/index.html', '/bnx', '/privacy.html', '/en/bn/']) assert.ok(!pattern.test(path), path);
});

test('pages work from /bn/: every local asset, script and link is root-relative', () => {
  for (const html of Object.values(pages)) {
    assert.doesNotMatch(html, /(href|src)="\.\//);
  }
  assert.doesNotMatch(read('web/welcome-markup.js'), /href="\.\//);
  assert.doesNotMatch(read('web/constraints-preview.js'), /'\.\/sample-report/);
});

test('both pages keep the product identity and share a sharing image', () => {
  for (const html of Object.values(pages)) {
    assert.match(html, /Mangrove Graduate Navigator/);
    assert.match(html, /A Mangrove Intelligence product/);
    assert.match(html, /mangrove-graduate-navigator-icon\.svg/);
    assert.match(html, /mangrove-graduate-navigator-icon-512\.png/);
    assert.ok(html.includes('<meta property="og:image" content="https://graduate.mangroveintel.com/assets/og-image.png" />'));
    assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/);
    assert.doesNotMatch(html, /<script(?![^>]*\b(?:src=|type="application\/ld\+json"))/, 'inline scripts would break the CSP');
    assert.doesNotMatch(html, /\sstyle="/, 'inline styles would break the CSP');
  }
  const png = readFileSync('web/assets/og-image.png');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('robots.txt and sitemap.xml list both language addresses', () => {
  assert.match(robots, /^Sitemap: https:\/\/graduate\.mangroveintel\.com\/sitemap\.xml$/m);
  for (const url of Object.values(PAGE_URL)) assert.ok(sitemap.includes(`<loc>${url}</loc>`), url);
  assert.equal((sitemap.match(/hreflang="bn" href="https:\/\/graduate\.mangroveintel\.com\/bn\/"/g) || []).length, 2);
  assert.ok(existsSync('web/bn/index.html'));
});
