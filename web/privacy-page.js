const btn = document.querySelector('#privacy-lang');
if (btn) {
  btn.addEventListener('click', () => {
    const en = document.querySelector('#privacy-en');
    const bn = document.querySelector('#privacy-bn');
    if (!en || !bn) return;
    const showBn = bn.classList.contains('hidden');
    en.classList.toggle('hidden', showBn);
    bn.classList.toggle('hidden', !showBn);
    document.documentElement.lang = showBn ? 'bn' : 'en';
    btn.textContent = showBn ? 'English' : 'বাংলা';
  });
}
