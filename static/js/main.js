// Nav shadow on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 12);
});

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Lightbox
const lb = document.getElementById('lb');
const lbImg = document.getElementById('lb-img');
document.querySelectorAll('.figure img, .zoom').forEach(img => {
  img.addEventListener('click', () => {
    lbImg.src = img.dataset.full || img.src;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});
function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
lb.addEventListener('click', closeLb);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

// Tabs
document.querySelectorAll('.tabs').forEach(group => {
  const tabs = group.querySelectorAll('.tab');
  const panels = group.parentElement.querySelectorAll('.panel');
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    panels[i].classList.add('active');
  }));
});

// Copy bibtex
function copyBib(btn) {
  const txt = document.getElementById('bib').innerText;
  navigator.clipboard.writeText(txt).then(() => {
    const o = btn.innerText; btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = o, 1600);
  });
}
