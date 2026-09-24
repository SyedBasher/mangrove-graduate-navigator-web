import { app, state } from './runtime.js';

function enhancePaywall() {
  const paywall = app.querySelector('.paywall');
  if (!paywall || paywall.dataset.personalizedValue === 'true') return;
  paywall.dataset.personalizedValue = 'true';
  const intro = paywall.querySelector('div:first-child p');
  if (intro) {
    intro.textContent = state.lang === 'en'
      ? 'The full report is built from the answers behind this exact result. It keeps the same career order, then shows why each path fits you, what evidence would strengthen it, which jobs to search for, and what to do over the next 30 days.'
      : 'পূর্ণ রিপোর্টটি আপনার এই উত্তরগুলোর ওপরই তৈরি হবে। ক্যারিয়ারের ক্রম একই থাকবে; এরপর দেখবেন কোন পথগুলো কেন আপনার সঙ্গে মেলে, কোন সক্ষমতার প্রমাণ আগে তৈরি করা সবচেয়ে কাজে দেবে, কী ধরনের চাকরি খুঁজবেন এবং আগামী ৩০ দিনে কী করবেন।';
  }

  const value = document.createElement('div');
  value.className = 'paid-value-grid';
  value.innerHTML = state.lang === 'en'
    ? `<div><strong>Why each path fits you</strong><span>Your actual capability answers, work preferences and evidence are used to explain each direction.</span></div>
       <div><strong>What proof to build next</strong><span>Concrete work samples or evidence based on what you have already demonstrated.</span></div>
       <div><strong>Your 30-day plan</strong><span>The sequence changes with income urgency, opportunity type, remote work and relocation.</span></div>
       <div><strong>Where not to spend time</strong><span>Advice based on your own gaps and evidence rather than a generic course list.</span></div>`
    : `<div><strong>প্রতিটি পথ কেন আপনার সঙ্গে মেলে</strong><span>আপনার সক্ষমতা, কাজের পছন্দ এবং বাস্তব অভিজ্ঞতার উত্তর ধরে ব্যাখ্যা করা হবে।</span></div>
       <div><strong>এরপর কী প্রমাণ তৈরি করবেন</strong><span>আপনি ইতিমধ্যে কী দেখিয়েছেন, তার ভিত্তিতে নির্দিষ্ট কাজের নমুনা বা প্রমাণের পরামর্শ।</span></div>
       <div><strong>আপনার ৩০ দিনের পরিকল্পনা</strong><span>আয় কতটা জরুরি, কী ধরনের কাজ চান, রিমোট কাজ ও স্থান বদলের সুযোগ—এসব অনুযায়ী ধাপ বদলাবে।</span></div>
       <div><strong>কোথায় সময় নষ্ট না করাই ভালো</strong><span>সবার জন্য একই কোর্সের তালিকা নয়—আপনার নিজের ঘাটতি ও প্রমাণ অনুযায়ী পরামর্শ।</span></div>`;

  const actions = paywall.querySelector('.actions');
  if (actions) paywall.insertBefore(value, actions);
}

const observer = new MutationObserver(enhancePaywall);
observer.observe(app, { childList:true, subtree:true });
enhancePaywall();
