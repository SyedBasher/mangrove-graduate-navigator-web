import { ASSESSMENT_VERSION } from './config.js';
import { state, languageToggle, supabase, getExistingAuthSession, saveProgress, go } from './runtime.js';
import { capabilityItems } from './data-refined.js';
import { preferenceItems } from './preference-design.js';
import { renderWelcome, renderProfile, startNewAssessmentFromScratch } from './welcome-profile.js';
import { renderCapability } from './capabilities.js';
import { renderPreference } from './preferences.js';
import { renderConstraints, restoreLastResult } from './constraints-preview.js';
import './product-copy-polish.js';
import './followup.js';
import './result-upsell.js';
import './product-feedback.js';
import './captcha-start.js';

let currentStage = 'welcome';
let handlingPopState = false;
const HISTORY_STAGES = new Set(['welcome','profile','capabilities','preferences','constraints','last_result']);

function syncLanguageChrome() {
  document.documentElement.lang = state.lang;
  languageToggle?.querySelectorAll('[data-language]').forEach((button) => {
    const active = button.dataset.language === state.lang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const subtitle = document.querySelector('#brand-subtitle');
  if (subtitle) subtitle.textContent = 'A Mangrove Intelligence product';
  const footerPrivacy = document.querySelector('#footer-privacy');
  if (footerPrivacy) footerPrivacy.textContent = 'Terms & Privacy';
}

function inferResumeStage() {
  if (!state.sessionId || state.resumeInfo?.type !== 'in_progress') return null;
  if (!Object.keys(state.profile || {}).length) return 'profile';

  const missingCap = capabilityItems.findIndex((item) => !state.capabilities[item.code]);
  if (missingCap >= 0) {
    state.capIndex = missingCap;
    return 'capabilities';
  }

  const missingPref = preferenceItems.findIndex((item) => !state.preferences[item.code]);
  if (missingPref >= 0) {
    state.prefIndex = missingPref;
    return 'preferences';
  }

  return 'constraints';
}

function resumeDetail(stage) {
  if (state.lang === 'bn') {
    if (stage === 'profile') return 'আপনার আগের মূল্যায়নটি অসম্পূর্ণ আছে। সংরক্ষিত উত্তরগুলো অক্ষত আছে; “চালিয়ে যান” চাপলে আপনার তথ্যের অংশ থেকে আবার শুরু হবে।';
    if (stage === 'capabilities') return `আপনার আগের মূল্যায়নটি অসম্পূর্ণ আছে। সংরক্ষিত উত্তরগুলো অক্ষত আছে; সক্ষমতা ${state.capIndex + 1} / ${capabilityItems.length} থেকে আবার শুরু হবে।`;
    if (stage === 'preferences') return `আপনার আগের মূল্যায়নটি অসম্পূর্ণ আছে। সংরক্ষিত উত্তরগুলো অক্ষত আছে; পছন্দ ${state.prefIndex + 1} / ${preferenceItems.length} থেকে আবার শুরু হবে।`;
    return 'আপনার আগের মূল্যায়নটি অসম্পূর্ণ আছে। সংরক্ষিত উত্তরগুলো অক্ষত আছে; শেষ বাস্তব-তথ্যের ধাপ থেকে আবার শুরু হবে।';
  }
  if (stage === 'profile') return 'You have an unfinished assessment. Your saved answers are still here; Continue assessment will resume from About you.';
  if (stage === 'capabilities') return `You have an unfinished assessment. Your saved answers are still here; you will resume at capability ${state.capIndex + 1} of ${capabilityItems.length}.`;
  if (stage === 'preferences') return `You have an unfinished assessment. Your saved answers are still here; you will resume at preference ${state.prefIndex + 1} of ${preferenceItems.length}.`;
  return 'You have an unfinished assessment. Your saved answers are still here; you will resume at the final practical-information step.';
}

function decorateInProgressWelcome() {
  if (state.resumeInfo?.type !== 'in_progress') return;
  const resumeStage = inferResumeStage();
  if (!resumeStage) return;
  state.resumeInfo = { ...state.resumeInfo, resumeStage };

  const main = document.querySelector('.welcome-main');
  const actions = document.querySelector('.welcome-actions');
  const oldButton = document.querySelector('#start-button');
  if (!main || !actions || !oldButton) return;

  const notice = document.createElement('div');
  notice.className = 'resume-result-card';
  notice.innerHTML = `<strong>${state.lang === 'en' ? 'Assessment in progress' : 'মূল্যায়ন অসম্পূর্ণ আছে'}</strong><span>${resumeDetail(resumeStage)}</span>`;
  main.insertBefore(notice, actions);

  const continueButton = oldButton.cloneNode(true);
  continueButton.textContent = state.lang === 'en' ? 'Continue assessment' : 'মূল্যায়ন চালিয়ে যান';
  oldButton.replaceWith(continueButton);
  continueButton.addEventListener('click', () => {
    const target = inferResumeStage() || state.resumeInfo?.resumeStage || 'profile';
    go(target);
  });

  const newButton = document.createElement('button');
  newButton.id = 'new-assessment-button';
  newButton.className = 'secondary';
  newButton.type = 'button';
  newButton.textContent = state.lang === 'en' ? 'Start a new assessment' : 'নতুন মূল্যায়ন শুরু করুন';
  const sampleLink = actions.querySelector('a.button-link');
  actions.insertBefore(newButton, sampleLink || null);
  newButton.addEventListener('click', async () => {
    const confirmed = window.confirm(state.lang === 'en'
      ? 'Start a new assessment? Your unfinished assessment will be closed and a new assessment will begin from About you.'
      : 'নতুন মূল্যায়ন শুরু করবেন? অসম্পূর্ণ মূল্যায়নটি বন্ধ হবে এবং আপনার সম্পর্কে অংশ থেকে নতুন মূল্যায়ন শুরু হবে।');
    if (!confirmed) return;
    await startNewAssessmentFromScratch(newButton);
  });

  const termsLine = document.querySelector('.terms-line');
  if (termsLine) {
    termsLine.textContent = state.lang === 'en'
      ? 'Continue assessment keeps the same saved answers. Start a new assessment closes the unfinished one and begins again from About you.'
      : 'মূল্যায়ন চালিয়ে গেলে আগের সংরক্ষিত উত্তরগুলোই থাকবে। নতুন মূল্যায়ন শুরু করলে অসম্পূর্ণটি বন্ধ হবে এবং আপনার সম্পর্কে অংশ থেকে আবার শুরু হবে।';
  }
}

function render(stage = 'welcome') {
  currentStage = HISTORY_STAGES.has(stage) ? stage : 'welcome';
  syncLanguageChrome();
  if (currentStage === 'welcome') {
    renderWelcome();
    decorateInProgressWelcome();
    return;
  }
  if (currentStage === 'profile') return renderProfile();
  if (currentStage === 'capabilities') return renderCapability();
  if (currentStage === 'preferences') return renderPreference();
  if (currentStage === 'constraints') return renderConstraints();
  if (currentStage === 'last_result') return restoreLastResult();
}

function safeHistoryStage(stage) {
  if (!HISTORY_STAGES.has(stage)) return 'welcome';
  if (state.resumeInfo?.type === 'completed' && ['profile','capabilities','preferences','constraints'].includes(stage)) {
    return 'welcome';
  }
  return stage;
}

function pushStage(stage, { replace = false } = {}) {
  const target = safeHistoryStage(stage);
  const current = history.state?.gcn ? history.state.stage : null;
  if (current === target) return;
  const payload = { gcn:true, stage:target };
  if (replace) history.replaceState(payload, '', window.location.href);
  else history.pushState(payload, '', window.location.href);
}

function capabilityState(rows = []) {
  const out = {};
  for (const row of rows) {
    const contexts = Array.isArray(row.evidence_contexts) ? row.evidence_contexts : [];
    out[row.capability_code] = {
      level: row.response_level,
      evidenceContexts: contexts,
      noEvidence: !contexts.length && row.evidence_context === 'none',
      evidenceChoiceMade: true,
    };
  }
  return out;
}

async function hydrateLatestSession() {
  const authSession = await getExistingAuthSession();
  if (!authSession) return 'welcome';

  const { data: session, error: sessionError } = await supabase
    .from('assessment_sessions')
    .select('session_id,status,language,started_at,completed_at,current_run_id,assessment_version')
    .eq('user_id', state.userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) return 'welcome';

  state.sessionId = session.session_id;
  state.startedAt = new Date(session.started_at).getTime();
  if (session.language === 'en' || session.language === 'bn') state.lang = session.language;

  if (session.status === 'completed') {
    state.resumeInfo = { type: 'completed', sessionId: state.sessionId, currentRunId: session.current_run_id, completedAt: session.completed_at };
    saveProgress('last_result');
    return 'welcome';
  }

  if (session.assessment_version !== ASSESSMENT_VERSION) {
    state.sessionId = null;
    state.resumeInfo = null;
    return 'welcome';
  }

  const [profileRes, capsRes, prefsRes, constraintsRes] = await Promise.all([
    supabase.from('profile_responses').select('*').eq('session_id', state.sessionId).maybeSingle(),
    supabase.from('capability_responses').select('capability_code,response_level,evidence_context,evidence_contexts').eq('session_id', state.sessionId),
    supabase.from('preference_choices').select('pair_id,option_selected').eq('session_id', state.sessionId),
    supabase.from('constraint_responses').select('*').eq('session_id', state.sessionId).maybeSingle(),
  ]);
  for (const result of [profileRes, capsRes, prefsRes, constraintsRes]) if (result.error) throw result.error;

  state.profile = profileRes.data || {};
  state.capabilities = capabilityState(capsRes.data || []);
  state.preferences = Object.fromEntries((prefsRes.data || []).map((row) => [row.pair_id, row.option_selected]));
  state.constraints = constraintsRes.data || {};
  state.resumeInfo = { type: 'in_progress', sessionId: state.sessionId };
  state.resumeInfo.resumeStage = inferResumeStage() || 'profile';

  return 'welcome';
}

window.addEventListener('gcn:navigate', e => {
  const target = safeHistoryStage(e.detail);
  if (!handlingPopState) pushStage(target);
  render(target);
});

window.addEventListener('popstate', (event) => {
  handlingPopState = true;
  const requested = event.state?.gcn ? event.state.stage : 'welcome';
  const target = safeHistoryStage(requested);
  if (target !== requested) pushStage(target, { replace:true });
  render(target);
  handlingPopState = false;
});

languageToggle.addEventListener('click', (event) => {
  const button = event.target.closest('[data-language]');
  if (!button || button.dataset.language === state.lang) return;
  state.lang = button.dataset.language;
  localStorage.setItem('gcn_lang', state.lang);
  syncLanguageChrome();
  if (currentStage === 'welcome') return render('welcome');
  if (state.resumeInfo?.type === 'completed') return render('welcome');
  if (!state.sessionId) return render('welcome');
  if (!Object.keys(state.profile).length) return render('profile');
  if (Object.keys(state.capabilities).length < capabilityItems.length) return render('capabilities');
  if (Object.keys(state.preferences).length < preferenceItems.length) return render('preferences');
  return render('constraints');
});

document.querySelector('.brand')?.addEventListener('click', (event) => {
  event.preventDefault();
  pushStage('welcome');
  render('welcome');
  window.scrollTo({ top: 0, behavior: 'auto' });
});

async function boot() {
  syncLanguageChrome();
  try {
    const stage = await hydrateLatestSession();
    pushStage(stage, { replace:true });
    render(stage);
  } catch (error) {
    console.warn('Could not restore the last assessment:', error?.message || error);
    state.sessionId = null;
    state.resumeInfo = null;
    pushStage('welcome', { replace:true });
    render('welcome');
  }
}

boot();
