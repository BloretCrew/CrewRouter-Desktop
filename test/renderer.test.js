'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rendererDir = path.join(__dirname, '..', 'src', 'renderer');
const packageRoot = path.join(__dirname, '..', 'node_modules', '@bloret-crew', 'blora-design');
const html = fs.readFileSync(path.join(rendererDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(rendererDir, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(rendererDir, 'renderer.js'), 'utf8');

test('renderer resolves the published Blora 2 package and loads its CSS', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  assert.match(packageJson.version, /^2\./);
  assert.equal(packageJson.type, 'module');
  assert.equal(require.resolve('@bloret-crew/blora-design/package.json'), path.join(packageRoot, 'package.json'));
  for (const file of ['dist/blora.css', 'dist/tokens.dark.css', 'dist/components/card/card.css', 'dist/components/badge/badge.css', 'dist/components/input/input.css', 'dist/components/button/button.css']) {
    assert.equal(fs.existsSync(path.join(packageRoot, file)), true, file);
    assert.match(html, new RegExp(file.replaceAll('/', '\\/')));
  }
});

test('renderer uses official Blora 2 structure without the 1.x API or local token fallback', () => {
  assert.match(html, /class="blora-shell"/);
  assert.match(html, /class="blora-card blora-card--local"/);
  assert.match(html, /class="blora-button" data-variant="primary" data-block/);
  assert.match(html, /class="blora-button" data-variant="secondary" data-block/);
  assert.doesNotMatch(`${html}${css}${js}`, /blora-btn|Blora\.init|blora\.js/);
  assert.doesNotMatch(css, /--blora-[a-z-]+\s*:/);
});

test('connection controls expose accessible labels and live feedback', () => {
  assert.match(html, /for="remote-url"/);
  assert.match(html, /aria-describedby="url-hint url-error"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /id="status" role="status"/);
  assert.match(html, /id="quit"[^>]+type="button"/);
});

test('renderer validates empty and unsupported remote URLs before IPC', () => {
  assert.match(js, /if \(!url\)/);
  assert.match(js, /仅支持 http:\/\/ 或 https:\/\/ 地址/);
  assert.match(js, /urlEl\.setAttribute\('aria-invalid', message \? 'true' : 'false'\)/);
});

test('renderer guards repeated actions and renders server metadata/errors', () => {
  assert.match(js, /if \(isBusy\) return/);
  assert.match(js, /status\.runtime/);
  assert.match(js, /status\.edition/);
  assert.match(js, /status\.auth/);
  assert.match(js, /status\.auth\.methods/);
  assert.match(js, /setStatus\(error\?\.message/);
});
