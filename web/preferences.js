import { preferenceItems } from './preference-design.js';
import { app, state, supabase, t, esc, showProgress, setStatus, startQuestionTimer, elapsedQuestionMs, logEvent, go, scrollAssessmentTop } from './runtime.js';

function stepDots(current, total) {
  return Array.from({ length: total }, (_, i) => `<span class="preference-dot ${i < current ? 'done' : ''} ${i === current ? 'current' : ''}" aria-hidden="true"></span>`).join('');
}

function preferenceIntro() {
  return state.lang === 'en'
    ? 'Imagine the pay and employer are roughly similar. Which kind of work would you actually prefer to do? Choose what feels more like you, not what sounds more impressive. Some themes appear more than once on purpose. If neither option stands out, choose “No strong preference.”'
    : 'ধরে নিন, বেতন আর নিয়োগদাতা মোটামুটি একই রকম। তাহলে কোন ধরনের কাজটি আপনি সত্যি বেশি করতে চাইবেন? বেশি মর্যাদাপূর্ণ শোনায় বলে নয়—যেটি আপনার বেশি পছন্দ, সেটিই নিন। একই ধরনের কাজ একাধিকবার আসতে পারে; আমরা ইচ্ছা করেই রেখেছি। কোনোটিই আলাদা করে বেশি পছন্দ না হলে “বিশেষ পছন্দ নেই” নিন।';
}

export function renderPreference() {
  const item = preferenceItems[state.prefIndex];
  const total = preferenceItems.length;
  showProgress(3, (state.prefIndex + 1) / total);
  const selected = state.preferences[item.code];
  app.classList.remove('preference-enter');
  app.innerHTML = `
    <div class="preference-position" aria-label="${state.lang === 'en' ? `Preference ${state.prefIndex + 1} of ${total}` : `পছন্দ ${state.prefIndex + 1} / ${total}`}">
      <div><strong>${state.lang === 'en' ? `Preference ${state.prefIndex + 1} of ${total}` : `পছন্দ ${state.prefIndex + 1} / ${total}`}</strong><span>${state.lang === 'en' ? 'Eight short comparisons' : 'আটটি সংক্ষিপ্ত তুলনা'}</span></div>
      <div class="preference-dots">${stepDots(state.prefIndex, total)}</div>
    </div>
    <p class="eyebrow">${state.lang === 'en' ? 'How you prefer to work' : 'আপনি কীভাবে কাজ করতে পছন্দ করেন'}</p>
    <h2>${t('prefTitle')}</h2>
    <p class="lede compact-lede">${esc(preferenceIntro())}</p>
    <div class="tradeoff-grid">
      <button class="choice tradeoff-card ${selected === 'a' ? 'selected' : ''}" type="button" data-pref="a"><span class="option-kicker">A</span><strong>${esc(state.lang === 'en' ? item.a_en : item.a_bn)}</strong></button>
      <div class="tradeoff-or">${state.lang === 'en' ? 'OR' : 'অথবা'}</div>
      <button class="choice tradeoff-card ${selected === 'b' ? 'selected' : ''}" type="button" data-pref="b"><span class="option-kicker">B</span><strong>${esc(state.lang === 'en' ? item.b_en : item.b_bn)}</strong></button>
    </div>
    <button class="neutral-choice ${selected === 'n' ? 'selected' : ''}" type="button" data-pref="n">${state.lang === 'en' ? 'No strong preference between these two' : 'এই দুটির মধ্যে বিশেষ পছন্দ নেই'}</button>
    <div id="preference-saved" class="preference-saved" aria-live="polite"></div>
    <div class="actions">${state.prefIndex > 0 ? `<button id="pref-back" class="secondary" type="button">${t('back')}</button>` : ''}</div>
    <div id="status" class="status"></div>`;

  requestAnimationFrame(() => app.classList.add('preference-enter'));
  document.querySelectorAll('[data-pref]').forEach(btn => btn.addEventListener('click', () => savePreference(btn.dataset.pref)));
  document.querySelector('#pref-back')?.addEventListener('click', () => { state.prefIndex--; renderPreference(); });
  scrollAssessmentTop();
  startQuestionTimer();
}

async function savePreference(selected) {
  const item = preferenceItems[state.prefIndex];
  state.preferences[item.code] = selected;
  document.querySelectorAll('[data-pref]').forEach(b => {
    b.disabled = true;
    b.classList.toggle('selected', b.dataset.pref === selected);
  });
  const saved = document.querySelector('#preference-saved');
  if (saved) saved.textContent = state.lang === 'en' ? '✓ Choice saved — moving to the next question' : '✓ উত্তরটি রাখা হয়েছে — পরের তুলনায় যাচ্ছেন';
  try {
    const { error } = await supabase.from('preference_choices').upsert({
      session_id: state.sessionId,
      pair_id: item.code,
      option_selected: selected,
      response_time_ms: elapsedQuestionMs(),
    });
    if (error) throw error;
    await new Promise(resolve => setTimeout(resolve, 180));
    if (state.prefIndex < preferenceItems.length - 1) {
      state.prefIndex++;
      renderPreference();
    } else {
      await logEvent('preferences_completed', { count: preferenceItems.length, design_version: '0.5.1', wording_version: '0.5.4' });
      go('constraints');
    }
  } catch (error) {
    setStatus(error.message, true);
    if (saved) saved.textContent = '';
    document.querySelectorAll('[data-pref]').forEach(b => b.disabled = false);
  }
}
