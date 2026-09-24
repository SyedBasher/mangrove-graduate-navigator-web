import { app, state, supabase } from './runtime.js';

function institutionOptions() {
  const en = state.lang === 'en';
  return `
    <option value="">${en ? 'Prefer not to say / skip' : 'বলতে চাই না / বাদ দিন'}</option>
    <option value="public_university">${en ? 'Public university' : 'সরকারি বিশ্ববিদ্যালয়'}</option>
    <option value="private_university">${en ? 'Private university' : 'বেসরকারি বিশ্ববিদ্যালয়'}</option>
    <option value="national_university_college">${en ? 'National University-affiliated college' : 'জাতীয় বিশ্ববিদ্যালয়-অধিভুক্ত কলেজ'}</option>
    <option value="other">${en ? 'Other / professional / foreign institution' : 'অন্যান্য / পেশাগত / বিদেশি প্রতিষ্ঠান'}</option>`;
}

function mountFollowup() {
  const paywall = app.querySelector('.paywall');
  if (!paywall || !state.sessionId || app.querySelector('#research-followup')) return;
  const en = state.lang === 'en';

  const section = document.createElement('section');
  section.id = 'research-followup';
  section.className = 'preview-section';
  section.innerHTML = `
    <div class="section-heading"><span>06</span><div><h3>${en ? 'Optional research choices' : 'ঐচ্ছিক গবেষণার তথ্য'}</h3><p>${en ? 'These are asked only after you receive your result. Nothing here changes your result.' : 'আপনার ফল দেখানোর পরই এগুলো জিজ্ঞেস করা হচ্ছে। এখানকার কোনো উত্তরই আপনার ফল বদলাবে না।'}</p></div></div>
    <form id="followup-form" class="field-grid">
      <div class="field full research-disclosure-compact">
        <label class="research-optin"><input id="research-consent-post" name="research_consent" type="checkbox" /> <span>${en ? 'I agree that my de-identified assessment responses may be used to improve the service and for research on graduate career pathways.' : 'আমার পরিচয়বিহীন মূল্যায়নের উত্তর সার্ভিস উন্নত করতে এবং গ্র্যাজুয়েটদের ক্যারিয়ার পথ নিয়ে গবেষণায় ব্যবহার করা যেতে পারে—এতে আমি সম্মত।'}</span></label>
      </div>

      <div id="research-extra-fields" class="field full research-extra-card hidden">
        <div class="research-extra-head">
          <span>${en ? 'OPTIONAL · RESEARCH ONLY' : 'ঐচ্ছিক · শুধু গবেষণার জন্য'}</span>
          <strong>${en ? 'A little more context helps us study graduate pathways' : 'গ্র্যাজুয়েটদের পথ বুঝতে একটু বাড়তি তথ্য সহায়ক'}</strong>
          <p>${en ? 'This information is not used in your recommendation.' : 'এই তথ্য আপনার ক্যারিয়ার পরামর্শে ব্যবহার করা হয় না।'}</p>
        </div>
        <div class="field institution-prominent">
          <label>${en ? 'Institution type (optional)' : 'প্রতিষ্ঠানের ধরন (ঐচ্ছিক)'}</label>
          <select name="institution_type">${institutionOptions()}</select>
          <span class="field-help">${en ? 'This helps us study differences in graduate pathways. You may skip it.' : 'গ্র্যাজুয়েটদের পথের পার্থক্য বুঝতে এটি সাহায্য করে। চাইলে বাদ দিতে পারেন।'}</span>
        </div>
        <div class="field full research-disclosure-compact followup-choice-block">
          <label class="research-optin"><input id="followup-consent" name="followup_consent" type="checkbox" /> <span>${en ? 'I would also like to be contacted for short research follow-ups about my job search and work outcomes, planned around 3, 6 and 12 months. My contact detail will be stored separately from my assessment responses and linked only through an internal research ID.' : 'আমার চাকরি খোঁজা ও কাজের ফল নিয়ে প্রায় ৩, ৬ ও ১২ মাস পর সংক্ষিপ্ত গবেষণা-ফলো-আপের জন্য যোগাযোগ করা যেতে পারে—এতেও আমি সম্মত। যোগাযোগের তথ্য মূল্যায়নের উত্তর থেকে আলাদা রাখা হবে এবং শুধু একটি অভ্যন্তরীণ গবেষণা আইডি দিয়ে যুক্ত করা হবে।'}</span></label>
        </div>
        <div id="followup-contact-fields" class="field-grid field full hidden">
          <div class="field"><label>${en ? 'How may we contact you?' : 'কীভাবে যোগাযোগ করা যাবে?'}</label><select name="contact_channel"><option value="email">Email</option><option value="mobile">${en ? 'Mobile number' : 'মোবাইল নম্বর'}</option></select></div>
          <div class="field"><label>${en ? 'Email or mobile number' : 'ইমেইল বা মোবাইল নম্বর'}</label><input name="contact_value" maxlength="254" placeholder="${en ? 'Only if you opt in to follow-up' : 'ফলো-আপে সম্মতি দিলে শুধু তখনই'}" /></div>
          <div id="followup-save-hint" class="field full save-action-hint hidden" aria-live="polite">${en ? 'Last step: press “Save optional research choices” below.' : 'শেষ ধাপ: নিচের “ঐচ্ছিক গবেষণার তথ্য সংরক্ষণ করুন” বাটনে চাপুন।'}</div>
        </div>
      </div>

      <div class="actions field full"><button class="secondary research-save-button" type="submit">${en ? 'Save optional research choices' : 'ঐচ্ছিক গবেষণার তথ্য সংরক্ষণ করুন'}</button></div>
      <div id="followup-status" class="status field full" aria-live="polite"></div>
    </form>`;

  paywall.parentNode.insertBefore(section, paywall);

  const researchConsent = section.querySelector('#research-consent-post');
  const researchFields = section.querySelector('#research-extra-fields');
  const followupConsent = section.querySelector('#followup-consent');
  const contactFields = section.querySelector('#followup-contact-fields');
  const contactInput = section.querySelector('input[name="contact_value"]');
  const saveHint = section.querySelector('#followup-save-hint');
  const saveButton = section.querySelector('.research-save-button');

  const cueSave = () => {
    if (!followupConsent?.checked || !String(contactInput?.value || '').trim()) return;
    saveHint?.classList.remove('hidden');
    saveButton?.classList.remove('needs-save');
    // Restart a single short emphasis. It does not loop or blink continuously.
    void saveButton?.offsetWidth;
    saveButton?.classList.add('needs-save');
  };

  researchConsent?.addEventListener('change', () => {
    researchFields?.classList.toggle('hidden', !researchConsent.checked);
    if (!researchConsent.checked && followupConsent) {
      followupConsent.checked = false;
      contactFields?.classList.add('hidden');
      saveHint?.classList.add('hidden');
      saveButton?.classList.remove('needs-save');
    }
  });
  followupConsent?.addEventListener('change', () => {
    contactFields?.classList.toggle('hidden', !followupConsent.checked);
    if (!followupConsent.checked) {
      saveHint?.classList.add('hidden');
      saveButton?.classList.remove('needs-save');
    } else {
      cueSave();
    }
  });
  contactInput?.addEventListener('input', cueSave);
  contactInput?.addEventListener('change', cueSave);

  section.querySelector('#followup-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const researchReuseConsent = form.get('research_consent') === 'on';
    const followupOptIn = form.get('followup_consent') === 'on';
    const institutionType = researchReuseConsent ? String(form.get('institution_type') || '') : '';
    const contactChannel = String(form.get('contact_channel') || 'email');
    const contactValue = String(form.get('contact_value') || '').trim();
    const status = section.querySelector('#followup-status');
    const button = event.currentTarget.querySelector('button[type=submit]');

    if (!researchReuseConsent) {
      if (status) status.textContent = en ? 'Nothing to save — research use is optional.' : 'সংরক্ষণ করার কিছু নেই—গবেষণায় অংশ নেওয়া সম্পূর্ণ ঐচ্ছিক।';
      return;
    }
    if (followupOptIn && !contactValue) {
      if (status) { status.textContent = en ? 'Enter an email or mobile number for follow-up.' : 'ফলো-আপের জন্য Email বা মোবাইল নম্বর দিন।'; status.className = 'status field full error'; }
      return;
    }

    button.disabled = true;
    button.classList.remove('needs-save');
    saveHint?.classList.add('hidden');
    if (status) { status.textContent = en ? 'Saving…' : 'সংরক্ষণ হচ্ছে…'; status.className = 'status field full'; }
    const { data, error } = await supabase.functions.invoke('save-followup', {
      body: {
        session_id: state.sessionId,
        research_consent: researchReuseConsent,
        institution_type: institutionType || null,
        followup_consent: followupOptIn,
        contact_channel: followupOptIn ? contactChannel : null,
        contact_value: followupOptIn ? contactValue : null,
      },
    });
    if (error || !data?.ok) {
      button.disabled = false;
      if (followupOptIn && contactValue) cueSave();
      if (status) { status.textContent = error?.message || data?.error || (en ? 'Could not save these choices.' : 'এই তথ্য সংরক্ষণ করা যায়নি।'); status.className = 'status field full error'; }
      return;
    }

    if (status) {
      status.textContent = followupOptIn
        ? (en ? 'Saved — thank you. Research use and follow-up remain optional and separate from your result.' : 'সংরক্ষিত হয়েছে — ধন্যবাদ। গবেষণায় ব্যবহার ও পরবর্তী যোগাযোগ দুটোই ঐচ্ছিক এবং আপনার ফলের অংশ নয়।')
        : (en ? 'Saved — thank you. No contact detail was collected.' : 'সংরক্ষিত হয়েছে — ধন্যবাদ। কোনো যোগাযোগের তথ্য নেওয়া হয়নি।');
      status.className = 'status field full saved-confirmation';
    }
    button.textContent = en ? 'Saved' : 'সংরক্ষিত';
    button.classList.add('saved-button');
  });
}

const observer = new MutationObserver(() => mountFollowup());
observer.observe(app, { childList: true, subtree: true });
mountFollowup();
