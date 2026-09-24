import { LAUNCH_PRICE_BDT } from './config.js';
import { app, state, supabase, t, esc, showProgress, setStatus, hideProgress, logEvent, scrollAssessmentTop, saveProgress, go } from './runtime.js';
import { mountPaidReportDeliveryIfUnlocked } from './paid-report-delivery.js';

let loadingMessageTimer = null;
let paidInterestRecorded = false;
const PREVIEW_TIMEOUT_MS = 25000;
const loadingMessages = {
  en: [
    'Reading the overall shape of your capability answers…',
    'Comparing that profile with your work preferences…',
    'Keeping the practical information you gave us in view…',
    'Preparing a short set of directions you can act on…',
  ],
  bn: [
    'আপনার সক্ষমতা-সংক্রান্ত উত্তরগুলোর সামগ্রিক চিত্র দেখা হচ্ছে…',
    'সেটি আপনার কাজের পছন্দের সঙ্গে মিলিয়ে দেখা হচ্ছে…',
    'আপনার দেওয়া বাস্তব পরিস্থিতির তথ্যগুলোও বিবেচনায় রাখা হচ্ছে…',
    'আপনি এখনই কাজে লাগাতে পারেন এমন কয়েকটি দিক প্রস্তুত করা হচ্ছে…',
  ],
};

function selected(value, target) { return value === target ? 'selected' : ''; }
function checked(list, target) { return Array.isArray(list) && list.includes(target) ? 'checked' : ''; }

export function renderConstraints() {
  clearLoadingState();
  showProgress(4, .75);
  const c = state.constraints || {};
  const income = c.income_urgency || c.top_priorities?.[0] || '';
  const relocation = c.relocation_ok || c.mobility_band || '';
  const remote = c.remote_ok === true ? 'yes' : c.remote_ok === false ? 'no' : '';
  const salary = c.salary_band || '';
  const opportunities = c.opportunity_types || ['full_time'];
  const constraintsLede = state.lang === 'en'
    ? 'These answers help us understand what may be practical for you. At this stage they are used cautiously and do not automatically rule careers in or out.'
    : 'এই উত্তরগুলো কোন দিক আপনার জন্য বাস্তবে বেশি সুবিধাজনক হতে পারে তা বুঝতে সাহায্য করে। এই পর্যায়ে এগুলো সতর্কভাবে ব্যবহার করা হয়; কোনো ক্যারিয়ারকে স্বয়ংক্রিয়ভাবে বাদ দেওয়া বা নিশ্চিত করা হয় না।';

  app.innerHTML = `
    <p class="eyebrow">${state.lang === 'en' ? 'Your situation now' : 'আপনার বর্তমান পরিস্থিতি'}</p>
    <h2>${t('constraintsTitle')}</h2>
    <p class="lede compact-lede">${constraintsLede}</p>
    <form id="constraints-form" class="field-grid">
      <div class="field"><label>${state.lang === 'en' ? 'How urgently do you need income?' : 'আয় কতটা জরুরি?'}</label><select name="income_urgency" required><option value="">${state.lang === 'en' ? 'Choose' : 'বেছে নিন'}</option><option value="immediate" ${selected(income,'immediate')}>${state.lang === 'en' ? 'As soon as possible' : 'যত দ্রুত সম্ভব'}</option><option value="1_3_months" ${selected(income,'1_3_months')}>${state.lang === 'en' ? 'Within 1–3 months' : '১–৩ মাসের মধ্যে'}</option><option value="can_wait" ${selected(income,'can_wait')}>${state.lang === 'en' ? 'I can wait for a stronger fit' : 'আরও ভালো মিলের জন্য অপেক্ষা করতে পারি'}</option></select></div>
      <div class="field"><label>${state.lang === 'en' ? 'Would you relocate for the right job?' : 'ভালো কাজের জন্য অন্য জায়গায় যেতে পারবেন?'}</label><select name="relocation_ok" required><option value="">${state.lang === 'en' ? 'Choose' : 'বেছে নিন'}</option><option value="yes" ${selected(relocation,'yes')}>${state.lang === 'en' ? 'Yes' : 'হ্যাঁ'}</option><option value="maybe" ${selected(relocation,'maybe')}>${state.lang === 'en' ? 'Maybe' : 'সম্ভব হতে পারে'}</option><option value="no" ${selected(relocation,'no')}>${state.lang === 'en' ? 'No' : 'না'}</option></select></div>
      <div class="field"><label>${state.lang === 'en' ? 'Are you open to remote work?' : 'রিমোট কাজ বিবেচনা করবেন?'}</label><select name="remote_ok" required><option value="">${state.lang === 'en' ? 'Choose' : 'বেছে নিন'}</option><option value="yes" ${selected(remote,'yes')}>${state.lang === 'en' ? 'Yes' : 'হ্যাঁ'}</option><option value="no" ${selected(remote,'no')}>${state.lang === 'en' ? 'No' : 'না'}</option></select></div>
      <div class="field"><label>${state.lang === 'en' ? 'Minimum monthly pay you would seriously consider' : 'মাসিক ন্যূনতম কত বেতন বাস্তবে বিবেচনা করবেন'}</label><select name="salary_band" required><option value="">${state.lang === 'en' ? 'Choose' : 'বেছে নিন'}</option><option value="under_20" ${selected(salary,'under_20')}>${state.lang === 'en' ? 'Below ৳20,000' : '৳২০,০০০-এর কম'}</option><option value="20_30" ${selected(salary,'20_30')}>${state.lang === 'en' ? '৳20,000–30,000' : '৳২০,০০০–৩০,০০০'}</option><option value="30_45" ${selected(salary,'30_45')}>${state.lang === 'en' ? '৳30,000–45,000' : '৳৩০,০০০–৪৫,০০০'}</option><option value="45_plus" ${selected(salary,'45_plus')}>${state.lang === 'en' ? '৳45,000+' : '৳৪৫,০০০+'}</option></select></div>
      <div class="field full"><label>${state.lang === 'en' ? 'Which opportunities would you seriously consider?' : 'কোন ধরনের কাজ বা সুযোগ আপনি বাস্তবে বিবেচনা করবেন?'}</label><div class="check-grid">${opportunityOptions().map((o) => `<label class="check-option"><input type="checkbox" name="opportunity_types" value="${o.value}" ${checked(opportunities,o.value)}/> <span>${state.lang === 'en' ? o.en : o.bn}</span></label>`).join('')}</div></div>
      <div class="actions field full"><button class="primary" type="submit">${state.lang === 'en' ? 'Show my free result' : 'আমার ফ্রি ফল দেখান'}</button></div>
      <div id="status" class="status field full"></div>
    </form>`;
  document.querySelector('#constraints-form').addEventListener('submit', saveAndPreview);
  scrollAssessmentTop();
}

function opportunityOptions() {
  return [
    { value: 'full_time', en: 'Full-time job', bn: 'পূর্ণকালীন চাকরি' },
    { value: 'internship', en: 'Internship / trainee role', bn: 'ইন্টার্নশিপ / ট্রেইনি পদ' },
    { value: 'contract', en: 'Contract / project work', bn: 'চুক্তিভিত্তিক / প্রজেক্ট কাজ' },
    { value: 'part_time', en: 'Part-time work', bn: 'খণ্ডকালীন কাজ' },
    { value: 'self_employment', en: 'Freelance / self-employment', bn: 'ফ্রিল্যান্স / স্বনিযুক্ত কাজ' },
  ];
}

function previewTimeout() {
  return new Promise((_, reject) => window.setTimeout(() => {
    const error = new Error('PREVIEW_TIMEOUT');
    error.code = 'PREVIEW_TIMEOUT';
    reject(error);
  }, PREVIEW_TIMEOUT_MS));
}

async function requestPreview({ reopened = false, retry = false } = {}) {
  renderLoading();
  try {
    const result = await Promise.race([
      supabase.functions.invoke('generate-preview', { body: { session_id: state.sessionId } }),
      previewTimeout(),
    ]);
    const { data, error } = result || {};
    if (error) throw error;
    await logEvent(reopened ? 'preview_reopened' : (retry ? 'preview_retry_succeeded' : 'preview_viewed'), {
      run_id: data?.run_id,
      engine_version: data?.engine_version,
    });
    clearLoadingState();
    renderPreview(data);
    return true;
  } catch (error) {
    clearLoadingState();
    if (error?.code === 'PREVIEW_TIMEOUT' || error?.message === 'PREVIEW_TIMEOUT') {
      await logEvent('preview_timeout', { timeout_ms: PREVIEW_TIMEOUT_MS, reopened, retry });
      renderPreviewRecovery({ reopened });
      return false;
    }
    await logEvent('preview_failure', { message: String(error?.message || error), reopened, retry });
    throw error;
  }
}

function renderPreviewRecovery({ reopened = false } = {}) {
  hideProgress();
  app.innerHTML = `
    <p class="eyebrow">${state.lang === 'en' ? 'Your result is taking longer' : 'ফল তৈরি হতে একটু বেশি সময় লাগছে'}</p>
    <h2>${state.lang === 'en' ? 'This is taking longer than expected.' : 'স্বাভাবিকের চেয়ে বেশি সময় লাগছে।'}</h2>
    <p class="lede compact-lede">${state.lang === 'en'
      ? 'Your answers are saved. You can try again safely; a repeated request will not create a different result for the same saved answers.'
      : 'আপনার উত্তর সংরক্ষিত আছে। নিরাপদে আবার চেষ্টা করতে পারেন; একই সংরক্ষিত উত্তরের জন্য আবার চেষ্টা করলে আলাদা ফল তৈরি হবে না।'}</p>
    <div class="actions">
      <button id="preview-retry" class="primary" type="button">${state.lang === 'en' ? 'Try again' : 'আবার চেষ্টা করুন'}</button>
      <button id="preview-home" class="secondary" type="button">${state.lang === 'en' ? 'Return home' : 'হোমে ফিরুন'}</button>
    </div>`;
  document.querySelector('#preview-retry')?.addEventListener('click', async () => {
    await logEvent('preview_retry', { reopened });
    try { await requestPreview({ reopened, retry:true }); }
    catch (error) {
      clearLoadingState();
      renderPreviewRecovery({ reopened });
      const h2 = app.querySelector('h2');
      if (h2) h2.textContent = state.lang === 'en' ? 'We still could not load the result.' : 'ফলটি এখনও খোলা যায়নি।';
    }
  });
  document.querySelector('#preview-home')?.addEventListener('click', () => go('welcome'));
  scrollAssessmentTop();
}

async function saveAndPreview(event) {
  event.preventDefault();
  const btn = event.currentTarget.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    const form = new FormData(event.currentTarget);
    const types = form.getAll('opportunity_types');
    if (!types.length) throw new Error(state.lang === 'en' ? 'Choose at least one opportunity type.' : 'অন্তত একটি কাজ বা সুযোগ বেছে নিন।');
    state.constraints = {
      income_urgency: form.get('income_urgency'),
      relocation_ok: form.get('relocation_ok'),
      remote_ok: form.get('remote_ok') === 'yes',
      salary_band: form.get('salary_band'),
      opportunity_types: types,
    };
    const { error } = await supabase.from('constraint_responses').upsert({ session_id: state.sessionId, ...state.constraints });
    if (error) throw error;
    await logEvent('constraints_completed', { opportunity_types: types });
    await requestPreview();
  } catch (error) {
    clearLoadingState();
    renderConstraints();
    setStatus(error.message || 'Could not generate the preview.', true);
  }
}

export async function restoreLastResult() {
  if (!state.sessionId) return;
  try {
    await requestPreview({ reopened: true });
  } catch (error) {
    clearLoadingState();
    app.innerHTML = `<p class="eyebrow">${state.lang === 'en' ? 'Saved result' : 'সংরক্ষিত ফল'}</p><h2>${state.lang === 'en' ? 'We could not reopen the result.' : 'ফলটি আবার খোলা যায়নি।'}</h2><p class="lede">${esc(error.message || '')}</p><div class="actions"><button id="return-home" class="secondary" type="button">${state.lang === 'en' ? 'Return home' : 'হোমে ফিরুন'}</button></div>`;
    document.querySelector('#return-home')?.addEventListener('click', () => go('welcome'));
    scrollAssessmentTop();
  }
}

function renderLoading() {
  clearLoadingState();
  showProgress(4, 1);
  const messages = loadingMessages[state.lang];
  let messageIndex = 0;
  app.innerHTML = `
    <p class="eyebrow">${state.lang === 'en' ? 'Preparing your free result' : 'আপনার ফ্রি ফল প্রস্তুত হচ্ছে'}</p>
    <h2>${t('previewLoading')}</h2>
    <p class="lede compact-lede">${state.lang === 'en' ? 'We are combining your answers into a small number of practical directions.' : 'আপনার উত্তরগুলো মিলিয়ে কয়েকটি বাস্তবসম্মত দিক তৈরি করা হচ্ছে।'}</p>
    <div class="result-loading-box" aria-live="polite">
      <div class="result-loader" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="result-loading-copy"><strong id="loading-message">${esc(messages[0])}</strong><span>${state.lang === 'en' ? 'Most results are ready quickly. If it takes too long, we will give you a safe retry option.' : 'বেশিরভাগ ফল দ্রুত তৈরি হয়। বেশি সময় লাগলে নিরাপদে আবার চেষ্টা করার সুযোগ দেখানো হবে।'}</span></div>
    </div>`;
  loadingMessageTimer = window.setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    const el = document.querySelector('#loading-message');
    if (el) el.textContent = messages[messageIndex];
  }, 1250);
  scrollAssessmentTop();
}

function clearLoadingState() {
  if (loadingMessageTimer) window.clearInterval(loadingMessageTimer);
  loadingMessageTimer = null;
}

function catLabel(c) {
  const en = { ready_now: 'Ready now', within_reach: 'Within reach', explore: 'Worth exploring' };
  const bn = { ready_now: 'এখনই চেষ্টা করার মতো', within_reach: 'অল্প প্রস্তুতিতে নাগালের মধ্যে', explore: 'খুঁজে দেখার মতো' };
  return (state.lang === 'en' ? en : bn)[c] || c;
}

function linkedInSearch(term) { return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(term || 'Graduate')}&location=Bangladesh`; }

function renderPreview(data) {
  hideProgress();
  const results = data?.preview || [];
  const strengths = data?.strengths || [];
  const insight = data?.insight || null;
  const focus = data?.focus || null;
  const contrast = data?.profile_contrast || null;
  const legacyProjection = data?.legacy_preference_projection === true;
  const actions = data?.actions || [];
  const searchTerms = data?.search_terms || [];
  const reportReference = data?.report_reference || null;
  const firstSearch = searchTerms[0] || 'Graduate jobs';
  const explanation = state.lang === 'en'
    ? 'This is not a personality test or a job score. It shows which kinds of work fit your answers best and what you can do next.'
    : 'এটি ব্যক্তিত্ব পরীক্ষা নয়, চাকরি পাওয়ার নম্বরও নয়। আপনার উত্তর দেখে কোন ধরনের কাজ আপনার সঙ্গে বেশি মেলে এবং এখন কী করতে পারেন—তার একটি বাস্তবসম্মত ধারণা।';
  const contrastTitle = contrast?.status === 'limited_second_strength'
    ? (state.lang === 'en' ? 'One clear standout, not a forced second' : 'একটি স্পষ্ট শক্তি, জোর করে দ্বিতীয়টি নয়')
    : (state.lang === 'en' ? 'No artificial standout' : 'জোর করে কোনো শক্তি দেখানো হচ্ছে না');
  const rankReadinessNote = state.lang === 'en'
    ? 'The order shows which directions fit your overall answers best. The label shows how ready you appear to be for each one today, so a lower path can still be “Ready now”.'
    : 'উপরে থাকা পথগুলো আপনার সামগ্রিক উত্তরের সঙ্গে বেশি মেলে। প্রতিটি চিহ্ন দেখায়, আজ সেই কাজের জন্য আপনি কতটা প্রস্তুত। তাই তালিকার নিচের কোনো পথও “এখনই চেষ্টা করার মতো” হতে পারে।';

  state.resumeInfo = { type: 'completed', sessionId: state.sessionId, currentRunId: data?.run_id };
  saveProgress('last_result');

  app.innerHTML = `
    <p class="eyebrow">${state.lang === 'en' ? 'Your free result' : 'আপনার ফ্রি ফল'}</p>
    <h2>${t('previewTitle')}</h2>
    <p class="lede compact-lede">${explanation}</p>

    ${legacyProjection ? `<div class="discovery-card even-profile-card"><span>${state.lang === 'en' ? 'EARLIER ASSESSMENT VERSION' : 'আগের মূল্যায়ন সংস্করণ'}</span><strong>${state.lang === 'en' ? 'This saved result uses an earlier preference instrument' : 'এই সংরক্ষিত ফলে আগের পছন্দের প্রশ্ন ব্যবহার করা হয়েছে'}</strong><p>${state.lang === 'en' ? 'We can still reopen it, but its work-preference estimate is less detailed than a new assessment using the current repeated-comparison questions.' : 'ফলটি এখনও খোলা যায়, তবে বর্তমান বারবার করা তুলনার প্রশ্নে নতুন মূল্যায়ন দিলে কাজের পছন্দ সম্পর্কে আরও বিস্তারিত ধারণা পাওয়া যাবে।'}</p></div>` : ''}
    ${contrast ? `<div class="discovery-card even-profile-card"><span>${state.lang === 'en' ? 'A NOTE ABOUT YOUR ANSWERS' : 'আপনার উত্তর সম্পর্কে একটি কথা'}</span><strong>${contrastTitle}</strong><p>${esc(state.lang === 'en' ? contrast.message_en : contrast.message_bn)}</p></div>` : ''}
    ${insight ? `<div class="discovery-card"><span>${state.lang === 'en' ? 'WHAT MAY BE EASY TO MISS' : 'যেটি সহজে চোখ এড়িয়ে যেতে পারে'}</span><strong>${esc(state.lang === 'en' ? insight.headline_en : insight.headline_bn)}</strong><p>${esc(state.lang === 'en' ? insight.text_en : insight.text_bn)}</p></div>` : ''}

    <section class="preview-section">
      <div class="section-heading"><span>01</span><div><h3>${state.lang === 'en' ? 'Career directions to look at first' : 'প্রথমে যে ক্যারিয়ার দিকগুলো দেখবেন'}</h3><p>${state.lang === 'en' ? 'These are directions, not promises of a job.' : 'এগুলো সম্ভাব্য দিক, চাকরির নিশ্চয়তা নয়।'}</p><p class="subtle">${rankReadinessNote}</p></div></div>
      <div class="result-list">${results.map(r => `<article class="result-card"><span class="tag">${catLabel(r.category)}</span><h3>${esc(state.lang === 'en' ? r.label_en : r.label_bn)}</h3><p>${esc(state.lang === 'en' ? r.reason_en : r.reason_bn)}</p></article>`).join('')}</div>
    </section>

    ${strengths.length ? `<section class="preview-section"><div class="section-heading"><span>02</span><div><h3>${state.lang === 'en' ? 'What you already have' : 'আপনার যে শক্তিগুলো ইতিমধ্যে আছে'}</h3><p>${state.lang === 'en' ? 'These are relative standouts in your own answers, not rankings against other graduates.' : 'এগুলো আপনার নিজের উত্তরের তুলনায় শক্ত দিক—অন্য গ্র্যাজুয়েটের সঙ্গে তুলনা নয়।'}</p></div></div><div class="strength-grid">${strengths.map(s => `<div class="strength-card"><strong>${esc(state.lang === 'en' ? s.label_en : s.label_bn)}</strong><span>${esc(state.lang === 'en' ? s.note_en : s.note_bn)}</span></div>`).join('')}</div></section>` : ''}

    ${focus ? `<section class="preview-section focus-section"><div class="section-heading"><span>03</span><div><h3>${state.lang === 'en' ? 'One thing worth strengthening' : 'একটি বিষয় শক্ত করা সবচেয়ে কাজে লাগবে'}</h3><p>${state.lang === 'en' ? 'This is the capability most worth strengthening first for your leading directions.' : 'আপনার প্রধান ক্যারিয়ার দিকগুলোর জন্য এই সক্ষমতাটি আগে শক্ত করা সবচেয়ে কাজে দেবে।'}</p></div></div><div class="focus-card"><strong>${esc(state.lang === 'en' ? focus.label_en : focus.label_bn)}</strong><p>${state.lang === 'en' ? 'The specific practice task is included in the next steps below.' : 'নির্দিষ্ট অনুশীলনটি নিচের পরবর্তী পদক্ষেপে দেওয়া আছে।'}</p></div></section>` : ''}

    <section class="preview-section"><div class="section-heading"><span>04</span><div><h3>${state.lang === 'en' ? 'Three useful next steps' : 'এখন কাজে লাগবে এমন তিনটি পদক্ষেপ'}</h3><p>${state.lang === 'en' ? 'Doable actions, not generic motivation.' : 'সাধারণ উৎসাহ নয়—বাস্তবে করা যায় এমন পদক্ষেপ।'}</p></div></div><ol class="action-list">${actions.map(a => `<li>${esc(state.lang === 'en' ? a.en : a.bn)}</li>`).join('')}</ol></section>

    <section class="preview-section search-section"><div class="section-heading"><span>05</span><div><h3>${state.lang === 'en' ? 'Try these job-search terms today' : 'আজই এই শব্দগুলো দিয়ে চাকরি খুঁজুন'}</h3><p>${state.lang === 'en' ? 'Search by the work you can do, not only by your degree title.' : 'শুধু ডিগ্রির নাম নয়—আপনি যে কাজ করতে পারেন, সে অনুযায়ী খুঁজুন।'}</p></div></div><div class="search-tags">${searchTerms.map(term => `<span>${esc(term)}</span>`).join('')}</div><div class="job-links"><a class="secondary button-link" href="https://jobs.bdjobs.com/jobsearch-cache.asp" target="_blank" rel="noopener">${state.lang === 'en' ? `Bdjobs — search “${esc(firstSearch)}”` : `Bdjobs — “${esc(firstSearch)}” খুঁজুন`}</a><a class="secondary button-link" href="${linkedInSearch(firstSearch)}" target="_blank" rel="noopener">LinkedIn — ${esc(firstSearch)}</a></div></section>

    ${reportReference ? `<div class="career-reference"><div><span>${state.lang === 'en' ? 'RESULT REFERENCE' : 'ফল রেফারেন্স'}</span><strong>${esc(reportReference)}</strong></div><p>${state.lang === 'en' ? 'Keep this reference if you contact support about this result.' : 'এই ফল নিয়ে সহায়তা চাইলে রেফারেন্সটি সঙ্গে রাখুন।'}</p></div>` : ''}

    <div class="paywall">
      <div><span class="small-kicker">${state.lang === 'en' ? 'FULL REPORT' : 'পূর্ণ রিপোর্ট'}</span><strong>${t('paidTitle')}</strong><p>${state.lang === 'en' ? 'Your full report uses these same saved answers to show whether each path is mainly a capability gap, a proof gap or a positioning issue — then gives a path-specific approach, what not to waste time on, and a 30-day plan.' : 'পূর্ণ রিপোর্টে এই একই সংরক্ষিত উত্তর দেখে বোঝানো হবে—প্রতিটি পথে এখন মূল সমস্যা সক্ষমতার ঘাটতি, দেখানোর মতো প্রমাণের ঘাটতি, নাকি নিজেকে ভালোভাবে উপস্থাপন করা। এরপর থাকবে পথভিত্তিক করণীয়, কোথায় সময় নষ্ট না করাই ভালো এবং ৩০ দিনের পরিকল্পনা।'}</p></div>
      <div class="actions"><button id="paid-interest" class="primary" type="button">${state.lang === 'en' ? `I’m interested in the ৳${LAUNCH_PRICE_BDT} report` : `৳${LAUNCH_PRICE_BDT} রিপোর্টে আমি আগ্রহী`}</button><a class="secondary button-link" href="${state.lang === 'en' ? './sample-report.html' : './sample-report-bn.html'}" target="_blank" rel="noopener">${state.lang === 'en' ? 'View sample report' : 'নমুনা রিপোর্ট দেখুন'}</a></div>
      <p id="paid-interest-note" class="subtle">${state.lang === 'en' ? 'Payment is not switched on yet. Clicking interest does not charge you.' : 'পেমেন্ট এখনও চালু হয়নি। আগ্রহ জানালে কোনো টাকা কাটা হবে না।'}</p>
    </div>`;


  document.querySelector('#paid-interest')?.addEventListener('click', async (event) => {
    if (!paidInterestRecorded) {
      paidInterestRecorded = true;
      await logEvent('paid_report_interest', { price_bdt: LAUNCH_PRICE_BDT, run_id: data?.run_id });
    }
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = state.lang === 'en' ? 'Interest recorded' : 'আগ্রহ নথিভুক্ত হয়েছে';
    const note = document.querySelector('#paid-interest-note');
    if (note) note.textContent = state.lang === 'en' ? 'Thank you. Payment is not open yet; this simply tells us the report may be useful to you.' : 'ধন্যবাদ। পেমেন্ট এখনও চালু হয়নি; এটি শুধু জানায় যে রিপোর্টটি আপনার কাজে লাগতে পারে।';
  });

  mountPaidReportDeliveryIfUnlocked().catch((error) => {
    console.warn('Paid report delivery state could not be checked:', error?.message || error);
  });

  scrollAssessmentTop();
}
