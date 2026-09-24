import { ensureAnonymousSession, getExistingAuthSession, setStatus, state } from './runtime.js';
import { isTurnstileConfigured, mountTurnstile, resetTurnstile } from './turnstile.js';

let challengeInFlight = false;

function ensureChallengeHost() {
  let wrap = document.querySelector('#turnstile-start-wrap');
  if (wrap) return wrap;

  wrap = document.createElement('div');
  wrap.id = 'turnstile-start-wrap';
  wrap.setAttribute('aria-hidden', 'true');
  Object.assign(wrap.style, {
    position: 'fixed',
    left: '-10000px',
    top: '-10000px',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    pointerEvents: 'none'
  });

  const host = document.createElement('div');
  host.id = 'turnstile-start-widget';
  wrap.appendChild(host);
  document.body.appendChild(wrap);
  return wrap;
}

function genericStartError() {
  return state.lang === 'bn'
    ? 'মূল্যায়ন শুরু করা যায়নি। আবার চেষ্টা করুন।'
    : 'Could not start the assessment. Please try again.';
}

function failStart(button, error) {
  challengeInFlight = false;
  button.disabled = false;
  resetTurnstile();
  const wrap = document.querySelector('#turnstile-start-wrap');
  wrap?.querySelector('#turnstile-start-widget')?.replaceChildren();
  console.warn('Assessment start verification failed:', error?.message || error);
  setStatus(genericStartError(), true);
}

function continueAfterAuth(button) {
  button.dataset.authReady = 'true';
  button.dataset.captchaReady = 'true';
  challengeInFlight = false;
  button.disabled = false;
  button.click();
}

async function completeChallenge(button) {
  if (challengeInFlight) return;
  challengeInFlight = true;
  button.disabled = true;
  setStatus('');

  const wrap = ensureChallengeHost();
  let settled = false;
  let timeoutId = null;

  const finish = () => {
    if (settled) return;
    settled = true;
    if (timeoutId) clearTimeout(timeoutId);
    continueAfterAuth(button);
  };

  const finalFailure = error => {
    if (settled) return;
    settled = true;
    if (timeoutId) clearTimeout(timeoutId);
    failStart(button, error);
  };

  timeoutId = setTimeout(async () => {
    if (settled) return;
    const existing = await getExistingAuthSession().catch(() => null);
    if (existing) {
      finish();
      return;
    }
    finalFailure(new Error('Verification timed out'));
  }, 8000);

  try {
    await mountTurnstile(wrap.querySelector('#turnstile-start-widget'), {
      onReady: async token => {
        if (settled || !token) return;
        try {
          await ensureAnonymousSession(token);
          finish();
        } catch (error) {
          finalFailure(error);
        }
      },
      // Invisible Turnstile can briefly emit an error/expiry callback while
      // retrying internally. Do not surface that transient state to the user.
      // The timeout above is the only fallback if no valid session is created.
      onExpired: () => {},
      onError: () => {},
    });
  } catch (error) {
    finalFailure(error);
  }
}

document.addEventListener('click', async event => {
  const button = event.target.closest?.('#start-button');
  if (!button || !isTurnstileConfigured()) return;

  if (button.dataset.captchaReady === 'true') {
    delete button.dataset.captchaReady;
    return;
  }

  const existing = await getExistingAuthSession().catch(() => null);
  if (existing) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  await completeChallenge(button);
}, true);
