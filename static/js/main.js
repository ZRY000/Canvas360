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
document.querySelectorAll('.figure img, .pair img, .zoom').forEach(img => {
  img.addEventListener('click', () => {
    lbImg.src = img.dataset.full || img.src;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});
function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
lb.addEventListener('click', closeLb);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

// Tabs (panel-based, e.g. Applications)
document.querySelectorAll('.tabs:not([data-gallery])').forEach(group => {
  const tabs = group.querySelectorAll('.tab');
  const panels = group.parentElement.querySelectorAll('.panel');
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    panels[i].classList.add('active');
  }));
});

// Dataset gallery: tab switching + carousel
const GAL_ORDER = ['style_transfer', 'inpainting', 'outpainting', 'editing'];
document.querySelectorAll('.tabs[data-gallery]').forEach(group => {
  const tabs = group.querySelectorAll('.tab');
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    GAL_ORDER.forEach((t, j) => {
      const g = document.getElementById('gal-' + t);
      if (g) g.style.display = (i === j) ? '' : 'none';
    });
  }));
});

function galNav(task, dir) {
  const gal = document.getElementById('gal-' + task);
  if (!gal) return;
  const tracks = gal.querySelectorAll('.track');
  let cur = 0;
  tracks.forEach((t, i) => { if (t.classList.contains('active')) cur = i; });
  tracks[cur].classList.remove('active');
  const next = (cur + dir + tracks.length) % tracks.length;
  tracks[next].classList.add('active');
}


// Copy bibtex
function copyBib(btn) {
  const txt = document.getElementById('bib').innerText;
  navigator.clipboard.writeText(txt).then(() => {
    const o = btn.innerText; btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = o, 1600);
  });
}
