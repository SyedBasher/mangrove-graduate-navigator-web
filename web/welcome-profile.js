import { ASSESSMENT_VERSION, CONSENT_VERSION } from './config.js';
import { app, state, supabase, t, hideProgress, showProgress, setStatus, ensureAnonymousSession, logEvent, go, clearSavedProgress } from './runtime.js';
import { allDistrictOptions, divisionForDistrict } from './bd-locations.js';

const CONSENT_UI_VERSION = 'welcome-v0.4';
const BANGLA_DIGITS = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
function latinDigits(value = '') { return String(value).replace(/[০-৯]/g, d => BANGLA_DIGITS[d] || d); }
function selected(value, target) { return value === target ? 'selected' : ''; }

function resetForNewAssessment() {
  clearSavedProgress();
  state.sessionId = null;
  state.startedAt = null;
  state.researchConsent = false;
  state.profile = {};
  state.capabilities = {};
  state.preferences = {};
  state.constraints = {};
  state.capIndex = 0;
  state.prefIndex = 0;
  state.resumeInfo = null;
}

export function renderWelcome() {
  hideProgress();
  const hasCompleted = state.resumeInfo?.type === 'completed';
  app.innerHTML = `
    <div class="welcome-layout">
      <div class="welcome-main">
        <p class="eyebrow">${t('startEyebrow')}</p>
        <h1>${t('startTitle')}</h1>
        <p class="lede">${t('startLede')}</p>
        <div class="actions welcome-actions">
          <button id="start-button" class="primary" type="button">${hasCompleted ? (state.lang === 'en' ? 'Start a new assessment' : 'নতুন মূল্যায়ন শুরু করুন') : t('start')}</button>
          ${hasCompleted ? `<button id="view-last-result" class="secondary" type="button">${state.lang === 'en' ? 'View my last result' : 'আমার শেষ ফল দেখুন'}</button>` : ''}
          <a class="secondary button-link" href="${state.lang === 'en' ? './sample-report.html' : './sample-report-bn.html'}" target="_blank" rel="noopener">${t('sample')}</a>
        </div>
        <p class="terms-line">${state.lang === 'en'
          ? 'By starting an assessment, you agree to our <a href="./privacy.html" target="_blank" rel="noopener">Terms & Privacy</a>. Optional research choices are offered only after you receive your free result and do not affect it.'
          : 'মূল্যায়ন শুরু করলে আপনি আমাদের <a href="./privacy.html" target="_blank" rel="noopener">Terms & Privacy</a>-এ সম্মত হচ্ছেন। ঐচ্ছিক গবেষণার প্রশ্ন শুধু ফ্রি ফল পাওয়ার পর দেখানো হবে এবং এগুলো আপনার ফল বদলাবে না।'}</p>
        <div id="status" class="status"></div>
      </div>
      <aside class="welcome-proof" aria-label="Assessment features">
        <div><strong>${t('privacy')}</strong><span>${state.lang === 'en' ? 'Start with what you can do, not a polished CV.' : 'ঝকঝকে CV নয়—আপনি বাস্তবে কী করতে পারেন, সেখান থেকে শুরু।'}</span></div>
        <div><strong>${state.lang === 'en' ? 'Usually 10–15 minutes' : 'সাধারণত ১০–১৫ মিনিট'}</strong><span>${state.lang === 'en' ? 'One topic at a time. For each capability, you choose what you can do and briefly say where you have used it.' : 'একবারে একটি বিষয়। প্রতিটি সক্ষমতায় আপনি কী করতে পারেন এবং কোথায় সেটি ব্যবহার করেছেন—দুটিই সংক্ষেপে জানাবেন।'}</span></div>
        <div><strong>${t('privacy3')}</strong><span>${state.lang === 'en' ? 'You leave with strengths, a useful gap and next actions even if you do not pay.' : 'পেমেন্ট না করলেও আপনার শক্ত দিক, একটি কাজে লাগা উন্নতির জায়গা এবং পরবর্তী পদক্ষেপ পাবেন।'}</span></div>
      </aside>
    </div>`;

  document.querySelector('#view-last-result')?.addEventListener('click', () => go('last_result'));
  document.querySelector('#start-button')?.addEventListener('click', (event) => {
    if (hasCompleted) resetForNewAssessment();
    startAssessment(event.currentTarget);
  });
}

async function startAssessment(button = null) {
  const btn = button || document.querySelector('#start-button');
  if (!btn) return;
  btn.disabled = true;
  setStatus('');
  try {
    await ensureAnonymousSession();
    state.researchConsent = false;
    state.startedAt = Date.now();
    let { error } = await supabase.from('user_profiles').upsert({ user_id: state.userId, preferred_language: state.lang });
    if (error) throw error;

    const { data: consent, error: consentError } = await supabase.from('consent_records').insert({
      user_id: state.userId,
      consent_version: CONSENT_VERSION,
      consent_ui_version: CONSENT_UI_VERSION,
      product_terms_accepted: true,
      research_reuse_consent: false,
      longitudinal_followup_consent: false,
    }).select('consent_id').single();
    if (consentError) throw consentError;

    const { data, error: sessionError } = await supabase.from('assessment_sessions').insert({
      user_id: state.userId,
      consent_id: consent.consent_id,
      assessment_version: ASSESSMENT_VERSION,
      language: state.lang,
    }).select('session_id').single();
    if (sessionError) throw sessionError;
    state.sessionId = data.session_id;
    state.resumeInfo = { type: 'in_progress', sessionId: state.sessionId };
    await logEvent('assessment_started', { assessment_version: ASSESSMENT_VERSION, language: state.lang, consent_ui_version: CONSENT_UI_VERSION, research_reuse_consent_at_start: false });
    go('profile');
  } catch (error) {
    btn.disabled = false;
    setStatus(error.message || 'Could not start the assessment.', true);
  }
}

export async function startNewAssessmentFromScratch(button = null) {
  const oldSessionId = state.sessionId;
  if (!oldSessionId || state.resumeInfo?.type !== 'in_progress') {
    resetForNewAssessment();
    return startAssessment(button);
  }

  if (button) button.disabled = true;
  setStatus(state.lang === 'en' ? 'Starting a new assessment…' : 'নতুন মূল্যায়ন শুরু হচ্ছে…');

  try {
    const { error } = await supabase
      .from('assessment_sessions')
      .update({ status: 'abandoned' })
      .eq('session_id', oldSessionId)
      .eq('user_id', state.userId);
    if (error) throw error;

    await logEvent('assessment_abandoned_for_new_start', { abandoned_session_id: oldSessionId });
    resetForNewAssessment();
    await startAssessment(button);
  } catch (error) {
    console.warn('Could not start a new assessment:', error?.message || error);
    if (button) button.disabled = false;
    setStatus(state.lang === 'en'
      ? 'Could not start a new assessment. Please try again.'
      : 'নতুন মূল্যায়ন শুরু করা যায়নি। আবার চেষ্টা করুন।', true);
  }
}

export function renderProfile() {
  showProgress(1, .25);
  const p = state.profile || {};
  const district = p.current_district_code || '';
  app.innerHTML = `
    <p class="eyebrow">${state.lang === 'en' ? 'About you' : 'আপনার সম্পর্কে'}</p>
    <h2>${t('profileTitle')}</h2>
    <p class="lede compact-lede">${t('profileLede')}</p>
    <form id="profile-form" class="field-grid">
      <div class="field"><label>${state.lang === 'en' ? 'Highest degree' : 'সর্বোচ্চ ডিগ্রি'}</label><select name="degree_level" required><option value="">${state.lang === 'en' ? 'Choose' : 'বেছে নিন'}</option><option value="bachelor" ${selected(p.degree_level,'bachelor')}>${state.lang === 'en' ? 'Bachelor / Honours' : 'স্নাতক / অনার্স'}</option><option value="master" ${selected(p.degree_level,'master')}>${state.lang === 'en' ? "Master's" : 'স্নাতকোত্তর / মাস্টার্স'}</option><option value="other" ${selected(p.degree_level,'other')}>${state.lang === 'en' ? 'Other' : 'অন্যান্য'}</option></select></div>
      <div class="field"><label>${state.lang === 'en' ? 'Field of study' : 'পড়াশোনার বিষয়'}</label><input name="field_of_study" maxlength="100" value="${String(p.field_of_study_raw || p.field_of_study || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" placeholder="${state.lang === 'en' ? 'e.g. BBA' : 'যেমন BBA / বিবিএ'}" required /><span class="field-help">${state.lang === 'en' ? 'You can type this in English or Bangla.' : 'ইংরেজি বা বাংলায় লিখতে পারেন।'}</span></div>
      <div class="field"><label>${state.lang === 'en' ? 'Graduation year' : 'পাসের বছর'}</label><input name="graduation_year" type="text" inputmode="numeric" maxlength="4" value="${p.graduation_year || ''}" placeholder="${state.lang === 'en' ? '2026' : '২০২৬'}" required /></div>
      <div class="field"><label>${state.lang === 'en' ? 'Work experience' : 'কাজের অভিজ্ঞতা'}</label><select name="experience_band" required><option value="">${state.lang === 'en' ? 'Choose' : 'বেছে নিন'}</option><option value="none" ${selected(p.experience_band,'none')}>${state.lang === 'en' ? 'No formal experience yet' : 'এখনও আনুষ্ঠানিক কাজের অভিজ্ঞতা নেই'}</option><option value="internship" ${selected(p.experience_band,'internship')}>${state.lang === 'en' ? 'Internship / project only' : 'শুধু ইন্টার্নশিপ / প্রজেক্ট'}</option><option value="lt1" ${selected(p.experience_band,'lt1')}>${state.lang === 'en' ? 'Less than 1 year' : '১ বছরের কম'}</option><option value="1_3" ${selected(p.experience_band,'1_3')}>${state.lang === 'en' ? '1–3 years' : '১–৩ বছর'}</option><option value="gt3" ${selected(p.experience_band,'gt3')}>${state.lang === 'en' ? 'More than 3 years' : '৩ বছরের বেশি'}</option></select></div>
      <div class="field full"><label>${state.lang === 'en' ? 'District where you live now' : 'এখন কোন জেলায় থাকেন'}</label><select id="district-select" name="current_district_code" required>${allDistrictOptions(state.lang, district)}</select><span class="field-help">${state.lang === 'en' ? 'Choose where you live now, not your home district or birthplace.' : 'আপনি এখন যে জেলায় থাকেন সেটি বেছে নিন—নিজ জেলা বা জন্মস্থান নয়।'}</span></div>
      <div class="actions field full"><button class="primary" type="submit">${t('next')}</button></div>
      <div id="status" class="status field full"></div>
    </form>`;
  document.querySelector('#profile-form').addEventListener('submit', saveProfile);
}

async function saveProfile(event) {
  event.preventDefault();
  const btn = event.currentTarget.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    const form = new FormData(event.currentTarget);
    const rawField = String(form.get('field_of_study') || '').trim();
    const yearText = latinDigits(form.get('graduation_year') || '').replace(/\D/g, '');
    const graduationYear = Number(yearText);
    if (!Number.isInteger(graduationYear) || graduationYear < 1990 || graduationYear > 2035) {
      throw new Error(state.lang === 'en' ? 'Enter a valid graduation year between 1990 and 2035.' : '১৯৯০ থেকে ২০৩৫-এর মধ্যে সঠিক পাসের বছর লিখুন।');
    }
    const district = String(form.get('current_district_code') || '');
    const division = divisionForDistrict(district);
    if (!district || !division) throw new Error(state.lang === 'en' ? 'Choose the district where you live now.' : 'আপনি এখন যে জেলায় থাকেন সেটি বেছে নিন।');
    state.profile = {
      degree_level: form.get('degree_level'),
      field_of_study: rawField,
      field_of_study_raw: rawField,
      graduation_year: graduationYear,
      experience_band: form.get('experience_band'),
      current_division_code: division,
      current_district_code: district,
      current_location_code: `${division}:${district}`,
    };
    const { data: savedProfile, error } = await supabase.from('profile_responses')
      .upsert({ session_id: state.sessionId, ...state.profile })
      .select('field_of_study_normalized,field_of_study_normalizer_version')
      .single();
    if (error) throw error;
    state.profile.field_of_study_normalized = savedProfile?.field_of_study_normalized ?? rawField;
    state.profile.field_of_study_normalizer_version = savedProfile?.field_of_study_normalizer_version ?? null;
    await logEvent('profile_completed', {
      field_of_study_normalized: state.profile.field_of_study_normalized,
      field_of_study_normalizer_version: state.profile.field_of_study_normalizer_version,
      current_division_code: division,
      current_district_code: district,
    });
    state.capIndex = 0;
    go('capabilities');
  } catch (error) {
    btn.disabled = false;
    setStatus(error.message, true);
  }
}
