/* ============================================================
   QUALICONSIG - main.js
   Conexão direta com Supabase (sem backend intermediário)
   ============================================================ */

const SUPABASE_URL  = 'https://unvnqtrylofckskjuupn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudm5xdHJ5bG9mY2tza2p1dXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzAyMDgsImV4cCI6MjA5MDIwNjIwOH0.KY_9uDFguoYDf9HLTFxkgsmIZMuN20sZJoSPTCisJ3w';

async function sb(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
    }
  });
  if (!res.ok) return null;
  return res.json();
}

document.addEventListener('DOMContentLoaded', async () => {
  initNavMobile();
  await loadSiteContent();
  initSlider();
  initContactForm();
  initSimulator();
});

async function loadSiteContent() {
  try {
    const [settings, banners, cards, whyItems, services, posts] = await Promise.all([
      sb('site_settings', '?id=eq.1&select=*'),
      sb('banners', '?is_active=eq.true&order=order_position.asc&select=*'),
      sb('cards', '?is_active=eq.true&order=order_position.asc&select=*'),
      sb('why_items', '?is_active=eq.true&order=order_position.asc&select=*'),
      sb('services', '?is_active=eq.true&order=order_position.asc&select=*'),
      sb('posts', '?status=eq.published&order=published_at.desc&limit=3&select=*'),
    ]);
    if (settings?.[0])   applySettings(settings[0]);
    if (banners?.length)  renderSlides(banners);
    if (cards?.length)    renderCards(cards);
    if (whyItems?.length) renderWhyItems(whyItems);
    if (services?.length) renderServices(services);
    if (posts?.length)    renderPosts(posts);
  } catch (e) {
    console.warn('Erro ao carregar conteudo:', e);
  }
}

function applySettings(s) {
  if (!s) return;
  const root = document.documentElement;
  if (s.color_primary)   root.style.setProperty('--yellow', s.color_primary);
  if (s.color_secondary) root.style.setProperty('--teal',   s.color_secondary);
  if (s.color_dark)      root.style.setProperty('--navy',   s.color_dark);
  const logo = document.querySelector('.site-logo img');
  if (logo && s.logo_url) { logo.src = s.logo_url; if (s.logo_height) logo.style.height = s.logo_height + 'px'; }
  const footerLogo = document.querySelector('.footer-logo');
  if (footerLogo && s.logo_url) footerLogo.src = s.logo_url;
  const simPhoto = document.querySelector('.sim-photo');
  if (simPhoto && s.simulator_image_url) simPhoto.src = s.simulator_image_url;
  const testImg = document.querySelector('.testimonial-author img');
  if (testImg && s.testimonial_image_url) testImg.src = s.testimonial_image_url;
  if (s.phone)   document.querySelectorAll('[data-phone]').forEach(el => el.textContent = s.phone);
  if (s.address) document.querySelectorAll('[data-address]').forEach(el => el.textContent = s.address);
  if (s.email)   document.querySelectorAll('[data-email]').forEach(el => el.textContent = s.email);
  if (s.cnpj)    document.querySelectorAll('[data-cnpj]').forEach(el => el.textContent = s.cnpj);
}

function renderSlides(slides) {
  const container = document.getElementById('slider-track');
  const dotsWrap  = document.getElementById('slider-dots');
  if (!container || !dotsWrap) return;
  container.innerHTML = '';
  dotsWrap.innerHTML  = '';
  slides.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (i === 0 ? ' active' : '');
    const isExternal = s.cta_url && s.cta_url.startsWith('http');
    slide.innerHTML = `
      <div class="slide-bg" style="background-image:url('${s.image_url}');background-position:${s.image_position || 'center center'}"></div>
      <div class="slide-overlay"></div>
      <div class="slide-content">
        <h1>${s.title}</h1>
        <p>${s.subtitle}</p>
        <a href="${s.cta_url || '#'}" class="btn-primary" ${isExternal ? 'target="_blank" rel="noopener"' : ''}>${s.cta_text || 'Saiba Mais'} <i class="fas fa-arrow-right"></i></a>
      </div>`;
    container.appendChild(slide);
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });
  window._sliderTotal = slides.length;
  window._sliderCurrent = 0;
}

let sliderInterval = null;
function initSlider() {
  const total = () => document.querySelectorAll('.slide').length;
  window._sliderTotal = total();
  window._sliderCurrent = 0;
  document.getElementById('arrow-prev')?.addEventListener('click', () => { const t=total(); goToSlide((window._sliderCurrent-1+t)%t); });
  document.getElementById('arrow-next')?.addEventListener('click', () => { goToSlide((window._sliderCurrent+1)%total()); });
  sliderInterval = setInterval(() => { goToSlide((window._sliderCurrent+1)%total()); }, 5500);
}

function goToSlide(index) {
  document.querySelectorAll('.slide').forEach((s,i) => s.classList.toggle('active', i===index));
  document.querySelectorAll('.dot').forEach((d,i)   => d.classList.toggle('active', i===index));
  window._sliderCurrent = index;
  clearInterval(sliderInterval);
  sliderInterval = setInterval(() => { goToSlide((window._sliderCurrent+1)%document.querySelectorAll('.slide').length); }, 5500);
}

function renderCards(cards) {
  const grid = document.getElementById('cards-grid');
  if (!grid) return;
  grid.innerHTML = cards.map(c => `
    <div class="card-item">
      <div class="card-icon-wrap">${c.icon_url ? `<img src="${c.icon_url}" style="width:36px;height:36px;object-fit:contain">` : `<i class="${c.icon_class||'fas fa-star'}"></i>`}</div>
      <h3>${c.title}</h3><p>${c.description}</p>
      <a href="${c.link_url||'#'}" class="btn-outline">${c.link_text||'Saiba Mais'} <i class="fas fa-chevron-right"></i></a>
    </div>`).join('');
}

function renderWhyItems(items) {
  const grid = document.getElementById('why-grid');
  if (!grid) return;
  grid.innerHTML = items.map(it => `
    <div class="why-item">
      <div class="why-icon"><i class="${it.icon_class||'fas fa-check-circle'}"></i></div>
      <div><h4>${it.title}</h4><p>${it.description}</p></div>
    </div>`).join('');
}

function renderServices(services) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  grid.innerHTML = services.map(s => `
    <div class="service-card">
      <img src="${s.image_url}" alt="${s.name}" onerror="this.style.opacity='0.3'">
      <div class="service-label">${s.name}</div>
    </div>`).join('');
}

function renderPosts(posts) {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  grid.innerHTML = posts.map(p => `
    <div class="blog-card">
      <div class="blog-img"><img src="${p.image_url||'images/banner1.jpg'}" alt="${p.title}"></div>
      <div class="blog-body">
        <div class="blog-meta"><span class="blog-date">${formatDate(p.published_at)}</span><span class="blog-cat">${p.category||'Noticia'}</span></div>
        <h3>${p.title}</h3><p>${p.excerpt||''}</p>
        <a href="blog/${p.slug}" class="blog-link">Ler mais <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>`).join('');
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Enviando...';
    const data = { name: form.name?.value, email: form.email?.value, phone: form.phone?.value, message: form.message?.value, read: false };
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(data),
      });
      if (res.ok) { showToast('Mensagem enviada!', 'success'); form.reset(); }
      else showToast('Erro ao enviar.', 'error');
    } catch { showToast('Erro de conexao.', 'error'); }
    btn.disabled = false; btn.textContent = 'Enviar Mensagem';
  });
}

function initSimulator() {
  const cpfInput = document.getElementById('sim-cpf');
  if (!cpfInput) return;
  cpfInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g,'').slice(0,11);
    v = v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/,'$1.$2.$3-$4');
    e.target.value = v;
  });
  document.getElementById('btn-simular')?.addEventListener('click', () => {
    const cpf = cpfInput.value.replace(/\D/g,'');
    if (cpf.length !== 11) { showToast('CPF invalido', 'error'); return; }
    window.location.href = `simulacao.html?cpf=${cpf}`;
  });
}

function initNavMobile() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('nav-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('open'));
  document.addEventListener('click', (e) => { if (!btn.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('open'); });
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'});
}

function showToast(msg, type = 'default') {
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
}
