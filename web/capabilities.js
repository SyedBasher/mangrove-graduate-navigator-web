import { capabilityItems, evidenceOptions } from './data-refined.js';
import { localizeCapability } from './bangla-capability-copy.js';
import { app, state, supabase, t, esc, showProgress, setStatus, startQuestionTimer, elapsedQuestionMs, logEvent, go, scrollAssessmentTop } from './runtime.js';

export function renderCapability() {
  const item = capabilityItems[state.capIndex];
  const display = localizeCapability(item, state.lang);
  showProgress(2, (state.capIndex + 1) / capabilityItems.length);
  const current = state.capabilities[item.code] || {};

  app.innerHTML = `
    <p class="question-counter">${state.capIndex + 1} / ${capabilityItems.length}</p>
    <p class="eyebrow">${state.lang === 'en' ? 'Workplace capabilities' : 'কর্মক্ষেত্রের সক্ষমতা'}</p>
    <h2>${esc(display.label)}</h2>
    <p class="question-prompt">${esc(display.question)}</p>
    <div class="example-box"><strong>${state.lang === 'en' ? 'What we mean' : 'আমরা যা বোঝাচ্ছি'}</strong><span>${esc(display.example)}</span></div>
    ${state.capIndex === 0 ? `<div class="response-quality-note"><strong>${state.lang === 'en' ? 'For a useful result' : 'ফলটি যেন সত্যিই কাজে লাগে'}</strong><span>${state.lang === 'en'
      ? 'Choose the option that best describes what you can do now, usually on your own or with only a little help. Do not answer for what you hope to learn later. There is no “best” answer — the more realistic you are, the more useful your result will be.'
      : 'এখন আপনি সাধারণত নিজে কী করতে পারেন, সেটাই বেছে নিন। ভবিষ্যতে কী শিখতে চান, সেটা এখানে ধরছি না। সবচেয়ে ভালো শোনায় এমন উত্তর নেওয়ার দরকার নেই—আপনার বাস্তব অবস্থার সঙ্গে যে উত্তরটি মেলে, সেটিই ফলকে বেশি কাজে লাগবে।'}</span></div>` : ''}
    <div class="capability-step-label"><span>1</span><strong>${state.lang === 'en' ? 'Choose what you can do today' : 'আজ আপনি কী করতে পারেন তা বেছে নিন'}</strong></div>
    <div class="choice-stack">
      ${display.options.map(o => choice(o, current.level)).join('')}
    </div>
    <div id="evidence-slot"></div>
    <div class="actions">
      ${state.capIndex > 0 ? `<button id="cap-back" class="secondary" type="button">${t('back')}</button>` : ''}
      <button id="cap-next" class="primary" type="button" disabled>${t('next')}</button>
    </div>
    <div id="status" class="status"></div>`;

  document.querySelectorAll('[data-level]').forEach(btn => btn.addEventListener('click', () => chooseLevel(btn.dataset.level)));
  document.querySelector('#cap-next').addEventListener('click', saveCapability);
  document.querySelector('#cap-back')?.addEventListener('click', () => { state.capIndex--; renderCapability(); });
  if (current.level) chooseLevel(current.level, true);
  scrollAssessmentTop();
  startQuestionTimer();
}

function choice(option, selected) {
  return `<button class="choice capability-choice ${selected === option.value ? 'selected' : ''}" type="button" data-level="${option.value}"><span>${esc(option.label)}</span></button>`;
}

function chooseLevel(level, preserve = false) {
  const item = capabilityItems[state.capIndex];
  if (!preserve) {
    const previous = state.capabilities[item.code] || {};
    state.capabilities[item.code] = {
      level,
      evidenceContexts: previous.evidenceContexts || [],
      noEvidence: previous.noEvidence || false,
      evidenceChoiceMade: previous.evidenceChoiceMade || false,
    };
  }
  const current = state.capabilities[item.code];
  current.level = level;
  document.querySelectorAll('[data-level]').forEach(btn => btn.classList.toggle('selected', btn.dataset.level === level));

  const selectedContexts = new Set(current.evidenceContexts || []);
  document.querySelector('#evidence-slot').innerHTML = `
    <div class="evidence-box">
      <div class="capability-step-label evidence-step"><span>2</span><strong>${state.lang === 'en' ? 'Add the evidence behind that answer' : 'এখন এই উত্তরের পেছনের বাস্তব অভিজ্ঞতা জানান'}</strong></div>
      <div class="evidence-heading">
        <strong>${t('evidenceTitle')}</strong>
        <span>${state.lang === 'en'
          ? 'Select every setting where you have genuinely used this capability. We use these examples to understand your experience; we do not simply count how many boxes you select.'
          : 'যে যে জায়গায় সত্যিই এই সক্ষমতাটি ব্যবহার করেছেন, সবগুলোই বেছে নিন। আমরা এগুলো দিয়ে আপনার অভিজ্ঞতার ধরন বুঝি—শুধু কয়টি ঘরে টিক দিয়েছেন, তা গুনি না।'}</span>
      </div>
      <div class="chip-row">
        ${evidenceOptions.map(([value, en, bn]) => `<button type="button" class="chip ${selectedContexts.has(value) ? 'selected' : ''}" data-evidence="${value}">${esc(state.lang === 'en' ? en : bn)}</button>`).join('')}
        <button type="button" class="chip ${current.noEvidence ? 'selected muted-chip' : ''}" data-evidence-none="true">${state.lang === 'en' ? 'I have not used this in a real task yet' : 'বাস্তব কোনো কাজে এখনও ব্যবহার করিনি'}</button>
      </div>
    </div>`;

  document.querySelectorAll('[data-evidence]').forEach(btn => btn.addEventListener('click', () => {
    current.noEvidence = false;
    current.evidenceChoiceMade = true;
    const value = btn.dataset.evidence;
    const contexts = new Set(current.evidenceContexts || []);
    contexts.has(value) ? contexts.delete(value) : contexts.add(value);
    current.evidenceContexts = [...contexts];
    refreshEvidenceButtons(current);
  }));

  document.querySelector('[data-evidence-none]').addEventListener('click', () => {
    current.noEvidence = !current.noEvidence;
    current.evidenceChoiceMade = true;
    if (current.noEvidence) current.evidenceContexts = [];
    refreshEvidenceButtons(current);
  });

  document.querySelector('#cap-next').disabled = !(current.level && current.evidenceChoiceMade && (current.noEvidence || current.evidenceContexts.length));
}

function refreshEvidenceButtons(current) {
  const contexts = new Set(current.evidenceContexts || []);
  document.querySelectorAll('[data-evidence]').forEach(btn => btn.classList.toggle('selected', contexts.has(btn.dataset.evidence)));
  const none = document.querySelector('[data-evidence-none]');
  none.classList.toggle('selected', !!current.noEvidence);
  none.classList.toggle('muted-chip', !!current.noEvidence);
  document.querySelector('#cap-next').disabled = !(current.level && current.evidenceChoiceMade && (current.noEvidence || current.evidenceContexts.length));
}

function strongestEvidence(contexts = []) {
  const rank = { university: 1, personal_volunteer: 2, internship: 3, paid_regular: 4 };
  return contexts.slice().sort((a, b) => (rank[b] || 0) - (rank[a] || 0))[0] || 'none';
}

async function saveCapability() {
  const item = capabilityItems[state.capIndex];
  const r = state.capabilities[item.code];
  if (!r?.level || !r?.evidenceChoiceMade) return;
  const next = document.querySelector('#cap-next'); next.disabled = true;
  try {
    const contexts = r.noEvidence ? [] : (r.evidenceContexts || []);
    const { error } = await supabase.from('capability_responses').upsert({
      session_id: state.sessionId,
      capability_code: item.code,
      response_level: r.level,
      evidence_context: strongestEvidence(contexts),
      evidence_contexts: contexts,
      response_time_ms: elapsedQuestionMs(),
    });
    if (error) throw error;
    if (state.capIndex < capabilityItems.length - 1) {
      state.capIndex++;
      renderCapability();
    } else {
      await logEvent('capabilities_completed', { count: capabilityItems.length });
      state.prefIndex = 0;
      go('preferences');
    }
  } catch (error) {
    next.disabled = false;
    setStatus(error.message, true);
  }
}
