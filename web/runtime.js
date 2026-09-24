import { createClient } from './vendor/supabase-js-2.95.0.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TURNSTILE_SITE_KEY } from './config.js';
import { copy } from './data-refined.js';

const PROGRESS_KEY = 'gcn_progress_v1';
const IMMUTABLE_PREVIEW_HOST=/^[a-f0-9]{24}--graduate-career-navigator\.netlify\.app$/i;

function isTurnstilePreviewHost() {
  const host=String(window.location.hostname||'').toLowerCase();
  return host === 'localhost'
    || host === '127.0.0.1'
    || host.startsWith('deploy-preview-')
    || IMMUTABLE_PREVIEW_HOST.test(host);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
export const state = {
  lang: localStorage.getItem('gcn_lang') || 'en', userId: null, sessionId: null,
  startedAt: null, questionStartedAt: null, researchConsent: false, profile: {}, capabilities: {},
  preferences: {}, constraints: {}, capIndex: 0, prefIndex: 0, resumeInfo: null,
};
export const app = document.querySelector('#app');
const progressWrap = document.querySelector('#progress-wrap');
const progressBar = document.querySelector('#progress-bar');
const progressLabel = document.querySelector('#progress-label');
const progressTime = document.querySelector('#progress-time');
export const languageToggle = document.querySelector('#language-toggle');

export const t = (key) => copy[state.lang][key];
export const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

export function setStatus(message = '', isError = false) {
  const el = document.querySelector('#status'); if (!el) return;
  el.textContent = message; el.className = `status${isError ? ' error' : ''}`;
}

export function showProgress(step, fraction = 0) {
  progressWrap.classList.remove('hidden');
  progressLabel.textContent = state.lang === 'en' ? `Step ${step} of 4` : `ধাপ ${step} / ৪`;
  progressTime.textContent = state.lang === 'en' ? 'Usually 10–15 minutes' : 'সাধারণত ১০–১৫ মিনিট';
  const progressPercent = Math.min(100, (((step - 1) / 4) + fraction / 4) * 100);
  progressBar.value = progressPercent;
  progressBar.setAttribute('aria-valuenow', String(Math.round(progressPercent)));
}
export function hideProgress() { progressWrap.classList.add('hidden'); }

export function saveProgress(stage) {
  if (!state.sessionId) return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ session_id: state.sessionId, stage, updated_at: new Date().toISOString() }));
}
export function clearSavedProgress() { localStorage.removeItem(PROGRESS_KEY); }
export function go(stage) {
  saveProgress(stage);
  window.dispatchEvent(new CustomEvent('gcn:navigate', { detail: stage }));
}

export function scrollAssessmentTop({ smooth = true } = {}) {
  requestAnimationFrame(() => {
    const shell = document.querySelector('.shell');
    if (!shell) return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const top = Math.max(0, shell.getBoundingClientRect().top + window.scrollY - 12);
    window.scrollTo({ top, behavior: smooth && !reducedMotion ? 'smooth' : 'auto' });
  });
}

export function startQuestionTimer() { state.questionStartedAt = Date.now(); }
export function elapsedQuestionMs() { return state.questionStartedAt ? Math.max(0, Date.now() - state.questionStartedAt) : null; }

export async function logEvent(eventName, metadata = {}) {
  if (!state.userId) return;
  const { error } = await supabase.from('product_events').insert({
    user_id: state.userId,
    session_id: state.sessionId,
    event_name: eventName,
    metadata,
  });
  if (error) console.warn('Product event was not recorded:', eventName, error.message);
}

export async function getExistingAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data.session;
  if (session) state.userId = session.user.id;
  return session;
}

export async function ensureAnonymousSession(captchaToken = null) {
  let session = await getExistingAuthSession();
  if (!session) {
    if (!String(TURNSTILE_SITE_KEY || '').trim() && !isTurnstilePreviewHost()) {
      throw new Error(state.lang === 'en'
        ? 'The assessment is temporarily unavailable. Please try again shortly.'
        : 'মূল্যায়ন সাময়িকভাবে পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।');
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      throw new Error(state.lang === 'en' ? 'Could not start the assessment. Please try again.' : 'মূল্যায়ন শুরু করা যায়নি। আবার চেষ্টা করুন।');
    }
    const options = captchaToken ? { options: { captchaToken } } : undefined;
    const { data, error } = await supabase.auth.signInAnonymously(options);
    if (error) throw error;
    session = data.session;
  }
  state.userId = session.user.id;
  return session;
}
