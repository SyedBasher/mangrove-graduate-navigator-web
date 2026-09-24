import { TURNSTILE_SITE_KEY } from './config.js';

// Cloudflare's documented always-pass visible test key. It is used only on
// localhost and Netlify deploy-preview hosts so we can exercise the complete
// client flow before production credentials exist. It must never be treated as
// production bot protection.
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

let scriptPromise = null;
let widgetId = null;
let token = null;

const IMMUTABLE_PREVIEW_HOST=/^[a-f0-9]{24}--graduate-career-navigator\.netlify\.app$/i;

function isPreviewHost() {
  const host = String(window.location.hostname || '').toLowerCase();
  return host === 'localhost'
    || host === '127.0.0.1'
    || host.startsWith('deploy-preview-')
    || IMMUTABLE_PREVIEW_HOST.test(host);
}

export function effectiveTurnstileSiteKey() {
  const configured = String(TURNSTILE_SITE_KEY || '').trim();
  if (configured) return configured;
  return isPreviewHost() ? TURNSTILE_TEST_SITE_KEY : '';
}

export function isTurnstileConfigured() {
  return Boolean(effectiveTurnstileSiteKey());
}

export function isTurnstileTestMode() {
  return !String(TURNSTILE_SITE_KEY || '').trim() && isPreviewHost();
}

function loadTurnstileScript() {
  if (!isTurnstileConfigured()) return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-gcn-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.turnstile), { once:true });
      existing.addEventListener('error', () => reject(new Error('Turnstile could not load.')), { once:true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.gcnTurnstile = 'true';
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('Turnstile could not load.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function mountTurnstile(container, { onReady, onExpired, onError } = {}) {
  token = null;
  if (!isTurnstileConfigured() || !container) {
    onReady?.(null);
    return null;
  }
  const turnstile = await loadTurnstileScript();
  if (!turnstile) return null;
  if (widgetId !== null) {
    try { turnstile.remove(widgetId); } catch {}
    widgetId = null;
  }
  widgetId = turnstile.render(container, {
    sitekey: effectiveTurnstileSiteKey(),
    theme: 'auto',
    size: 'normal',
    appearance: 'interaction-only',
    callback: value => {
      token = value;
      onReady?.(value);
    },
    'expired-callback': () => {
      token = null;
      onExpired?.();
    },
    'error-callback': () => {
      token = null;
      onError?.();
    },
  });
  return widgetId;
}

export function getTurnstileToken() {
  return token;
}

export function resetTurnstile() {
  token = null;
  if (widgetId !== null && window.turnstile) {
    try { window.turnstile.reset(widgetId); } catch {}
  }
}
