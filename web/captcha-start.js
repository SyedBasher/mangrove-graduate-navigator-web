import { ensureAnonymousSession, getExistingAuthSession } from './runtime.js';
import { isTurnstileConfigured, isTurnstileTestMode, mountTurnstile, resetTurnstile } from './turnstile.js';

let challengeInFlight = false;

function lang() {
  return document.documentElement.lang === 'bn' || localStorage.getItem('gcn_lang') === 'bn' ? 'bn' : 'en';
}

function message(en, bn) {
  return lang() === 'bn' ? bn : en;
}

function ensureChallengeHost(button) {
  let wrap = document.querySelector('#turnstile-start-wrap');
  if (wrap) return wrap;
  wrap = document.createElement('div');
  wrap.id = 'turnstile-start-wrap';
  wrap.className = 'turnstile-start-wrap';
  wrap.innerHTML = `
    <p class="subtle turnstile-start-copy"></p>
    <div id="turnstile-start-widget"></div>
    <p id="turnstile-start-status" class="status" aria-live="polite"></p>`;
  const actions = button.closest('.welcome-actions');
  (actions?.parentElement || button.parentElement)?.insertBefore(wrap, actions?.nextSibling || null);
  return wrap;
}

function setChallengeStatus(text, isError=false) {
  const el = document.querySelector('#turnstile-start-status');
  if (!el) return;
  el.textContent = text;
  el.className = `status${isError ? ' error' : ''}`;
}

async function completeChallenge(button) {
  if (challengeInFlight) return;
  challengeInFlight = true;
  button.disabled = true;
  const wrap = ensureChallengeHost(button);
  const copy = wrap.querySelector('.turnstile-start-copy');
  copy.textContent = isTurnstileTestMode()
    ? message('Private-preview bot-protection test. No real challenge is required.', 'প্রাইভেট প্রিভিউতে বট-প্রোটেকশন পরীক্ষা চলছে। বাস্তব চ্যালেঞ্জ লাগবে না।')
    : message('A quick security check protects the assessment from automated abuse.', 'একটি দ্রুত নিরাপত্তা যাচাই স্বয়ংক্রিয় অপব্যবহার থেকে মূল্যায়নকে সুরক্ষিত রাখে।');
  setChallengeStatus(message('Checking…', 'যাচাই হচ্ছে…'));

  try {
    await mountTurnstile(wrap.querySelector('#turnstile-start-widget'), {
      onReady: async token => {
        if (!token) return;
        try {
          setChallengeStatus(message('Verified. Starting assessment…', 'যাচাই সম্পন্ন। মূল্যায়ন শুরু হচ্ছে…'));
          await ensureAnonymousSession(token);
          button.dataset.captchaReady = 'true';
          challengeInFlight = false;
          button.disabled = false;
          button.click();
        } catch (error) {
          challengeInFlight = false;
          button.disabled = false;
          resetTurnstile();
          setChallengeStatus(error?.message || message('Security check failed. Try again.', 'নিরাপত্তা যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'), true);
        }
      },
      onExpired: () => {
        challengeInFlight = false;
        button.disabled = false;
        setChallengeStatus(message('Security check expired. Try again.', 'নিরাপত্তা যাচাইয়ের সময় শেষ হয়েছে। আবার চেষ্টা করুন।'), true);
      },
      onError: () => {
        challengeInFlight = false;
        button.disabled = false;
        wrap.querySelector('#turnstile-start-widget')?.replaceChildren();
        setChallengeStatus(message('Security check could not load. Try again.', 'নিরাপত্তা যাচাই লোড হয়নি। আবার চেষ্টা করুন।'), true);
      },
    });
  } catch (error) {
    challengeInFlight = false;
    button.disabled = false;
    wrap.querySelector('#turnstile-start-widget')?.replaceChildren();
    setChallengeStatus(error?.message || message('Security check could not load. Try again.', 'নিরাপত্তা যাচাই লোড হয়নি। আবার চেষ্টা করুন।'), true);
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
