import { ensureAnonymousSession, getExistingAuthSession, setStatus } from './runtime.js';
import { isTurnstileConfigured, mountTurnstile, resetTurnstile } from './turnstile.js';

let challengeInFlight = false;

function ensureChallengeHost(button) {
  let wrap = document.querySelector('#turnstile-start-wrap');
  if (wrap) return wrap;
  wrap = document.createElement('div');
  wrap.id = 'turnstile-start-wrap';
  wrap.className = 'turnstile-start-wrap';
  wrap.innerHTML = '<div id="turnstile-start-widget"></div>';
  const actions = button.closest('.welcome-actions');
  (actions?.parentElement || button.parentElement)?.insertBefore(wrap, actions?.nextSibling || null);
  return wrap;
}

function failStart(button, error) {
  challengeInFlight = false;
  button.disabled = false;
  resetTurnstile();
  const wrap = document.querySelector('#turnstile-start-wrap');
  wrap?.querySelector('#turnstile-start-widget')?.replaceChildren();
  setStatus(error?.message || 'Could not start the assessment. Please try again.', true);
}

async function completeChallenge(button) {
  if (challengeInFlight) return;
  challengeInFlight = true;
  button.disabled = true;
  setStatus('');
  const wrap = ensureChallengeHost(button);

  try {
    await mountTurnstile(wrap.querySelector('#turnstile-start-widget'), {
      onReady: async token => {
        if (!token) return;
        try {
          await ensureAnonymousSession(token);
          button.dataset.captchaReady = 'true';
          challengeInFlight = false;
          button.disabled = false;
          button.click();
        } catch (error) {
          failStart(button, error);
        }
      },
      onExpired: () => failStart(button, new Error('Could not start the assessment. Please try again.')),
      onError: () => failStart(button, new Error('Could not start the assessment. Please try again.')),
    });
  } catch (error) {
    failStart(button, error);
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
