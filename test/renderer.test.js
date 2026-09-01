'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rendererDir = path.join(__dirname, '..', 'src', 'renderer');
const html = fs.readFileSync(path.join(rendererDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(rendererDir, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(rendererDir, 'renderer.js'), 'utf8');

test('renderer uses Blora 2.0 structure and token layer', () => {
  assert.match(html, /class="blora-shell"/);
  assert.match(html, /class="blora-panel blora-panel--local"/);
  assert.match(css, /--blora-accent/);
  assert.match(css, /data-variant/);
  assert.doesNotMatch(`${html}${css}${js}`, /blora-btn|Blora\.init|blora\.js/);
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
