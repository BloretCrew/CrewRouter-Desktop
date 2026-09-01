'use strict';

const api = window.crewrouterDesktop;
const runtimeError = document.getElementById('runtime-error');

function showRuntimeError(message) {
  if (runtimeError) runtimeError.textContent = message;
  const status = document.getElementById('status');
  const feedback = document.querySelector('.blora-feedback');
  if (status) status.textContent = message;
  if (feedback) feedback.dataset.state = 'error';
}

if (!api) {
  showRuntimeError('桌面桥接加载失败，请重启应用后重试。');
  throw new Error('CrewRouter Desktop preload API unavailable');
}
const formEl = document.getElementById('connection-form');
const statusEl = document.getElementById('status');
const feedbackEl = document.querySelector('.blora-feedback');
const introEl = document.getElementById('intro');
const urlEl = document.getElementById('remote-url');
const urlErrorEl = document.getElementById('url-error');
const localButton = document.getElementById('local');
const remoteButton = document.getElementById('remote');
const quitButton = document.getElementById('quit');
let isBusy = false;

function setStatus(message, state = 'idle') {
  statusEl.textContent = message;
  feedbackEl.dataset.state = state;
}
function busy(value) {
  isBusy = value;
  localButton.disabled = value;
  remoteButton.disabled = value;
  quitButton.disabled = value;
  localButton.setAttribute('aria-busy', String(value));
  remoteButton.setAttribute('aria-busy', String(value));
}
function setUrlError(message = '') {
  urlErrorEl.textContent = message;
  urlEl.setAttribute('aria-invalid', message ? 'true' : 'false');
}
function showError(error) {
  busy(false);
  setStatus(error?.message || '连接失败，请检查地址后重试。', 'error');
}
function describeStatus(status) {
  if (!status) return;
  if (status.error) return showError(new Error(status.error));
  if (status.mode) {
    const authLabel = status.auth ? (status.auth.required === false ? '免登录' : `登录：${(status.auth.methods || []).join('、') || '服务器'}`) : '';
    const metadata = [status.runtime, status.edition, authLabel].filter(Boolean).join(' · ');
    introEl.textContent = `当前连接：${status.mode === 'local' ? '本地' : '远程'}${metadata ? `（${metadata}）` : ''}`;
  }
  if (status.message) setStatus(status.message, status.mode ? 'success' : 'idle');
}

localButton.addEventListener('click', async () => {
  if (isBusy) return;
  busy(true);
  setStatus('正在启动本地服务…');
  try { await api.chooseMode('local'); } catch (error) { showError(error); }
});

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (isBusy) return;
  const url = urlEl.value.trim();
  setUrlError();
  if (!url) {
    setUrlError('请输入远程服务器地址。');
    setStatus('需要服务器地址才能连接。', 'error');
    urlEl.focus();
    return;
  }
  let parsed;
  try { parsed = new URL(url); } catch { setUrlError('请输入有效的 URL。'); setStatus('地址格式不正确。', 'error'); urlEl.focus(); return; }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    setUrlError('仅支持 http:// 或 https:// 地址。');
    setStatus('地址格式不正确。', 'error');
    urlEl.focus();
    return;
  }
  busy(true);
  setStatus('正在通过官方 Demo 转向入口连接…');
  try { await api.connectRemote(url); } catch (error) { showError(error); }
});

quitButton.addEventListener('click', () => { if (!isBusy) api.quit(); });
api.onStatus(describeStatus);
api.getStatus().then(describeStatus).catch(showError);
