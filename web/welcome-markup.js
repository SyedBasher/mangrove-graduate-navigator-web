// Welcome-screen markup shared by the browser renderer and the build-time prerender.
// Pure function: no DOM and no shared state, so scripts/prerender-pages.mjs can run it
// in Node and write the same HTML into web/index.html and web/bn/index.html.
import { copy } from './data-refined.js';

export function welcomeMarkup(lang, { hasCompleted = false } = {}) {
  const t = (key) => copy[lang][key];
  const en = lang === 'en';
  return `
    <div class="welcome-layout">
      <div class="welcome-main">
        <p class="eyebrow">${t('startEyebrow')}</p>
        <h1>${t('startTitle')}</h1>
        <p class="lede">${t('startLede')}</p>
        <div class="actions welcome-actions">
          <button id="start-button" class="primary" type="button">${hasCompleted ? (en ? 'Start a new assessment' : 'নতুন মূল্যায়ন শুরু করুন') : t('start')}</button>
          ${hasCompleted ? `<button id="view-last-result" class="secondary" type="button">${en ? 'View my last result' : 'আমার শেষ ফল দেখুন'}</button>` : ''}
          <a class="secondary button-link" href="${en ? '/sample-report.html' : '/sample-report-bn.html'}" target="_blank" rel="noopener">${t('sample')}</a>
        </div>
        <p class="terms-line">${en
          ? 'By starting an assessment, you agree to our <a href="/privacy.html" target="_blank" rel="noopener">Terms & Privacy</a>. Optional research choices are offered only after you receive your free result and do not affect it.'
          : 'মূল্যায়ন শুরু করলে আপনি আমাদের <a href="/privacy.html" target="_blank" rel="noopener">Terms & Privacy</a>-এ সম্মত হচ্ছেন। ঐচ্ছিক গবেষণার প্রশ্ন শুধু ফ্রি ফল পাওয়ার পর দেখানো হবে এবং এগুলো আপনার ফল বদলাবে না।'}</p>
        <div id="status" class="status"></div>
      </div>
      <aside class="welcome-proof" aria-label="Assessment features">
        <div><strong>${t('privacy')}</strong><span>${en ? 'Start with what you can do, not a polished CV.' : 'ঝকঝকে CV নয়—আপনি বাস্তবে কী করতে পারেন, সেখান থেকে শুরু।'}</span></div>
        <div><strong>${en ? 'Usually 10–15 minutes' : 'সাধারণত ১০–১৫ মিনিট'}</strong><span>${en ? 'One topic at a time. For each capability, you choose what you can do and briefly say where you have used it.' : 'একবারে একটি বিষয়। প্রতিটি সক্ষমতায় আপনি কী করতে পারেন এবং কোথায় সেটি ব্যবহার করেছেন—দুটিই সংক্ষেপে জানাবেন।'}</span></div>
        <div><strong>${t('privacy3')}</strong><span>${en ? 'You leave with strengths, a useful gap and next actions even if you do not pay.' : 'পেমেন্ট না করলেও আপনার শক্ত দিক, একটি কাজে লাগা উন্নতির জায়গা এবং পরবর্তী পদক্ষেপ পাবেন।'}</span></div>
      </aside>
    </div>`;
}
