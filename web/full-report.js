import { createClient } from './vendor/supabase-js-2.95.0.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, MANGROVE_API_BASE } from './config.js';

const HANDOFF_KEY = 'gcn:paid-report-handoff';

function reportHandoff() {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const session = String(fragment.get('session') || query.get('session') || '');
  const lang = (fragment.get('lang') || query.get('lang')) === 'bn' ? 'bn' : 'en';

  if (session) {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ session, lang }));
    // Keep pseudonymous session identifiers out of browser history and referrers.
    history.replaceState(null, '', './full-report.html');
    return { session, lang };
  }

  try {
    const saved = JSON.parse(sessionStorage.getItem(HANDOFF_KEY) || '{}');
    return {
      session: String(saved?.session || ''),
      lang: saved?.lang === 'bn' ? 'bn' : 'en',
    };
  } catch {
    return { session: '', lang: 'en' };
  }
}

const handoff = reportHandoff();
const language = handoff.lang;
const sessionId = handoff.session;
document.documentElement.lang = language;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const base = String(MANGROVE_API_BASE || '').replace(/\/$/, '');

async function fail(message) {
  const title = document.querySelector('#full-report-title');
  const status = document.querySelector('#full-report-status');
  if (title) title.textContent = language === 'bn' ? 'রিপোর্ট খোলা যায়নি' : 'Report unavailable';
  if (status) status.textContent = message;
}

async function load() {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return fail(language === 'bn' ? 'ফলাফলের পেজে ফিরে গিয়ে আবার চেষ্টা করুন।' : 'Return to your result and try again.');
  }

  const { data, error } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (error || !token) {
    return fail(language === 'bn' ? 'নিরাপদ সেশন পাওয়া যায়নি।' : 'A secure session could not be found.');
  }

  const response = await fetch(`${base}/report/full`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId, language, country: 'BD' }),
  });

  if (!response.ok) {
    return fail(response.status === 402
      ? (language === 'bn' ? 'এই রিপোর্টটি এখনও আনলক হয়নি।' : 'This report has not been unlocked yet.')
      : (language === 'bn' ? 'রিপোর্টটি এখন খোলা যাচ্ছে না।' : 'The report is unavailable right now.'));
  }

  const html = await response.text();
  if (!/^<!doctype html>/i.test(html.trim())) {
    return fail(language === 'bn' ? 'রিপোর্টটি এখন খোলা যাচ্ছে না।' : 'The report is unavailable right now.');
  }

  document.open();
  document.write(html);
  document.close();
}

load().catch(() => fail(language === 'bn' ? 'রিপোর্টটি এখন খোলা যাচ্ছে না।' : 'The report is unavailable right now.'));
