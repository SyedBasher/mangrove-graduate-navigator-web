import { PAYMENTS_ENABLED } from './config.js';
import { app, state } from './runtime.js';
import { generateFullReport } from './api-client.js';

function fullReportUrl() {
  const params = new URLSearchParams({
    session: String(state.sessionId || ''),
    lang: state.lang === 'bn' ? 'bn' : 'en',
  });
  return `./full-report.html?${params.toString()}`;
}

function showUnlockedReportLink() {
  const paywall = app.querySelector('.paywall');
  const interestButton = paywall?.querySelector('#paid-interest');
  const note = paywall?.querySelector('#paid-interest-note');
  const actions = paywall?.querySelector('.actions');
  if (!paywall || !interestButton || !actions) return false;

  interestButton.hidden = true;

  let link = paywall.querySelector('#open-full-report');
  if (!link) {
    link = document.createElement('a');
    link.id = 'open-full-report';
    link.className = 'primary button-link';
    link.href = fullReportUrl();
    link.textContent = state.lang === 'bn' ? 'আমার পূর্ণ রিপোর্ট খুলুন' : 'Open my full report';
    actions.insertBefore(link, actions.firstChild);
  }

  if (note) {
    note.textContent = state.lang === 'bn'
      ? 'আপনার পূর্ণ রিপোর্ট প্রস্তুত আছে।'
      : 'Your full report is ready.';
  }
  return true;
}

export async function mountPaidReportDeliveryIfUnlocked() {
  // Hard launch gate: this code remains inert until payments are explicitly enabled.
  if (!PAYMENTS_ENABLED || !state.sessionId) return false;

  try {
    await generateFullReport(state.sessionId, { country: 'BD' });
  } catch (error) {
    // Locked reports stay on the normal purchase/interest surface.
    if (error?.status === 402) return false;
    throw error;
  }

  return showUnlockedReportLink();
}
