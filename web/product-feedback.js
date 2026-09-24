import { app, state, logEvent } from './runtime.js';

function mountProductFeedback() {
  const paywall = app.querySelector('.paywall');
  if (!paywall || !state.sessionId || app.querySelector('#product-feedback')) return;
  const en = state.lang === 'en';

  const section = document.createElement('section');
  section.id = 'product-feedback';
  section.className = 'preview-section';
  section.innerHTML = `
    <div class="section-heading"><span>✦</span><div>
      <h3>${en ? 'Help us make this more useful' : 'এটি আরও কাজে লাগাতে আমাদের সাহায্য করুন'}</h3>
      <p>${en ? 'Optional product feedback. This is separate from research consent and does not change your result.' : 'এই মতামত দেওয়া সম্পূর্ণ ঐচ্ছিক। গবেষণায় অংশ নেওয়ার সম্মতি থেকে এটি আলাদা এবং আপনার ফল বদলাবে না।'}</p>
    </div></div>
    <form id="product-feedback-form" class="feedback-card">
      <fieldset>
        <legend>${en ? 'How useful was this free result?' : 'এই ফ্রি ফলটি আপনার কতটা কাজে লেগেছে?'}</legend>
        <div class="feedback-rating">
          ${[1,2,3,4,5].map(n => `<label><input type="radio" name="usefulness" value="${n}" required><span>${n}</span></label>`).join('')}
        </div>
        <div class="feedback-scale"><span>${en ? 'Not useful' : 'কাজে লাগেনি'}</span><span>${en ? 'Very useful' : 'খুব কাজে লেগেছে'}</span></div>
      </fieldset>
      <div class="field">
        <label>${en ? 'Would you recommend this to another graduate?' : 'আপনি কি অন্য কোনো গ্র্যাজুয়েটকে এটি ব্যবহার করতে বলবেন?'}</label>
        <select name="recommend">
          <option value="">${en ? 'Prefer not to say' : 'বলতে চাই না'}</option>
          <option value="yes">${en ? 'Yes' : 'হ্যাঁ'}</option>
          <option value="maybe">${en ? 'Maybe' : 'হয়তো'}</option>
          <option value="no">${en ? 'No' : 'না'}</option>
        </select>
      </div>
      <div class="field">
        <label>${en ? 'What would make the result more useful? (optional)' : 'ফলটি আরও কাজে লাগাতে কী বদলানো দরকার? (ঐচ্ছিক)'}</label>
        <textarea name="comment" maxlength="1000" rows="4" placeholder="${en ? 'A short comment is enough.' : 'সংক্ষেপে লিখলেই হবে।'}"></textarea>
      </div>
      <div class="actions"><button class="secondary" type="submit">${en ? 'Send feedback' : 'মতামত পাঠান'}</button></div>
      <div id="product-feedback-status" class="status" aria-live="polite"></div>
    </form>`;

  paywall.insertAdjacentElement('afterend', section);

  section.querySelector('#product-feedback-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const usefulness = Number(form.get('usefulness'));
    const recommend = String(form.get('recommend') || '');
    const comment = String(form.get('comment') || '').trim().slice(0,1000);
    const button = event.currentTarget.querySelector('button[type=submit]');
    const status = section.querySelector('#product-feedback-status');
    if (!Number.isInteger(usefulness) || usefulness < 1 || usefulness > 5) return;

    button.disabled = true;
    if (status) status.textContent = en ? 'Sending…' : 'পাঠানো হচ্ছে…';
    await logEvent('product_feedback_submitted', {
      surface:'free_result',
      usefulness_rating:usefulness,
      recommend:recommend || null,
      comment:comment || null,
    });
    button.textContent = en ? 'Feedback sent' : 'মতামত পাঠানো হয়েছে';
    if (status) status.textContent = en ? 'Thank you. This will help us improve the product.' : 'ধন্যবাদ। এটি সেবাটি আরও ভালো করতে সাহায্য করবে।';
    event.currentTarget.querySelectorAll('input,select,textarea').forEach(el => { el.disabled = true; });
  });
}

const observer = new MutationObserver(() => mountProductFeedback());
observer.observe(app, { childList:true, subtree:true });
mountProductFeedback();
