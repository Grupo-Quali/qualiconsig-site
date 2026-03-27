/* ============================================================
   QUALICONSIG - JS PRINCIPAL
   Carrega conteúdo dinâmico via API e inicializa componentes
   ============================================================ */

// URL da API no Fly.io — altere após o deploy
const API_URL = window.QUALICONSIG_API || 'https://qualiconsig-api.fly.dev/api';

/* ===== INICIALIZAÇÃO ===== */
document.addEventListener('DOMContentLoaded', async () => {
  initNavMobile();
  await loadSiteContent();
  initSlider();
  initContactForm();
  initSimulator();
});

/* ===== CARREGAR CONTEÚDO VIA API ===== */
async function loadSiteContent() {
  try {
    const [slidesRes, cardsRes, servicesRes, postsRes, settingsRes, whyRes] = await Promise.all([
      fetch(`${API_URL}/banners?active=true`).catch(() => null),
      fetch(`${API_URL}/cards`).catch(() => null),
      fetch(`${API_URL}/services`).catch(() => null),
      fetch(`${API_URL}/posts?limit=3`).catch(() => null),
      fetch(`${API_URL}/settings`).catch(() => null),
      fetch(`${API_URL}/why-items`).catch(() => null),
    ]);

    if (settingsRes?.ok) {
      const settings = await settingsRes.json();
      applySettings(settings);
    }
    if (slidesRes?.ok) {
      const slides = await slidesRes.json();
      if (slides?.length) renderSlides(slides);
    }
    if (cardsRes?.ok) {
      const cards = await cardsRes.json();
      if (cards?.length) renderCards(cards);
    }
    if (servicesRes?.ok) {
      const services = await servicesRes.json();
      if (services?.length) renderServices(services);
    }
    if (postsRes?.ok) {
      const posts = await postsRes.json();
      if (posts?.length) renderPosts(posts);
    }
    if (whyRes?.ok) {
      const items = await whyRes.json();
      if (items?.length) renderWhyItems(items);
    }
  } catch (e) {
    console.warn('API indisponível, exibindo conteúdo padrão');
  }
}

/* ===== APLICAR CONFIGURAÇÕES ===== */
function applySettings(s) {
  if (!s) return;
  const root = document.documentElement;
  if (s.color_primary)   root.style.setProperty('--yellow', s.color_primary);
  if (s.color_secondary) root.style.setProperty('--teal',   s.color_secondary);
  if (s.color_dark)      root.style.setProperty('--navy',   s.color_dark);

  const logo = document.querySelector('.site-logo img');
  if (logo && s.logo_url) {
    logo.src = s.logo_url;
    if (s.logo_height) logo.style.height = s.logo_height + 'px';
  }
  const footerLogo = document.querySelector('.footer-logo');
  if (footerLogo && s.logo_url) footerLogo.src = s.logo_url;

  // Imagem do simulador
  const simPhoto = document.querySelector('.sim-photo');
  if (simPhoto && s.simulator_image_url) simPhoto.src = s.simulator_image_url;

  // Foto do depoimento
  const testImg = document.querySelector('.testimonial-author img');
  if (testImg && s.testimonial_image_url) testImg.src = s.testimonial_image_url;

  if (s.phone)   document.querySelectorAll('[data-phone]').forEach(el => el.textContent = s.phone);
  if (s.address) document.querySelectorAll('[data-address]').forEach(el => el.textContent = s.address);
  if (s.email)   document.querySelectorAll('[data-email]').forEach(el => el.textContent = s.email);
  if (s.cnpj)    document.querySelectorAll('[data-cnpj]').forEach(el => el.textContent = s.cnpj);
}

/* ===== RENDER SLIDES ===== */
function renderSlides(slides) {
  const container = document.getElementById('slider-track');
  const dotsWrap  = document.getElementById('slider-dots');
  if (!container || !dotsWrap) return;

  container.innerHTML = '';
  dotsWrap.innerHTML  = '';

  slides.sort((a, b) => a.order_position - b.order_position);

  slides.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (i === 0 ? ' active' : '');
    slide.innerHTML = `
      <div class="slide-bg" style="background-image:url('${s.image_url}');background-position:${s.image_position || 'center center'}"></div>
      <div class="slide-overlay"></div>
      <div class="slide-content">
        <h1>${s.title}</h1>
        <p>${s.subtitle}</p>
        <a href="${s.cta_url || '#'}" class="btn-primary">
          ${s.cta_text || 'Saiba Mais'} <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    `;
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

/* ===== SLIDER LOGIC ===== */
let sliderInterval = null;
function initSlider() {
  const total = () => document.querySelectorAll('.slide').length;
  window._sliderTotal = total();
  window._sliderCurrent = 0;

  document.getElementById('arrow-prev')?.addEventListener('click', () => {
    const t = total();
    goToSlide((window._sliderCurrent - 1 + t) % t);
  });
  document.getElementById('arrow-next')?.addEventListener('click', () => {
    goToSlide((window._sliderCurrent + 1) % total());
  });

  sliderInterval = setInterval(() => {
    goToSlide((window._sliderCurrent + 1) % total());
  }, 5500);
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('.dot');
  slides.forEach((s, i) => s.classList.toggle('active', i === index));
  dots.forEach((d, i)   => d.classList.toggle('active', i === index));
  window._sliderCurrent = index;
  clearInterval(sliderInterval);
  sliderInterval = setInterval(() => {
    const t = document.querySelectorAll('.slide').length;
    goToSlide((window._sliderCurrent + 1) % t);
  }, 5500);
}

/* ===== RENDER CARDS ===== */
function renderCards(cards) {
  const grid = document.getElementById('cards-grid');
  if (!grid) return;
  grid.innerHTML = cards.map(c => `
    <div class="card-item">
      <div class="card-icon-wrap">
        ${c.icon_url
          ? `<img src="${c.icon_url}" alt="${c.title}" style="width:36px;height:36px;object-fit:contain">`
          : `<i class="${c.icon_class || 'fas fa-star'}"></i>`}
      </div>
      <h3>${c.title}</h3>
      <p>${c.description}</p>
      <a href="${c.link_url || '#'}" class="btn-outline">
        ${c.link_text || 'Saiba Mais'} <i class="fas fa-chevron-right"></i>
      </a>
    </div>
  `).join('');
}

/* ===== RENDER SERVICES ===== */
function renderServices(services) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  grid.innerHTML = services.map(s => `
    <div class="service-card">
      <img src="${s.image_url}" alt="${s.name}">
      <div class="service-label">${s.name}</div>
    </div>
  `).join('');
}

/* ===== RENDER WHY ITEMS ===== */
function renderWhyItems(items) {
  const grid = document.getElementById('why-grid');
  if (!grid) return;
  grid.innerHTML = items.map(it => `
    <div class="why-item">
      <div class="why-icon"><i class="${it.icon_class || 'fas fa-check-circle'}"></i></div>
      <div>
        <h4>${it.title}</h4>
        <p>${it.description}</p>
      </div>
    </div>
  `).join('');
}

/* ===== RENDER POSTS ===== */
function renderPosts(posts) {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  grid.innerHTML = posts.map(p => `
    <div class="blog-card">
      <div class="blog-img">
        <img src="${p.image_url || 'images/banner1.jpg'}" alt="${p.title}">
      </div>
      <div class="blog-body">
        <div class="blog-meta">
          <span class="blog-date">${formatDate(p.published_at)}</span>
          <span class="blog-cat">${p.category || 'Notícia'}</span>
        </div>
        <h3>${p.title}</h3>
        <p>${p.excerpt || ''}</p>
        <a href="blog/${p.slug}" class="blog-link">Ler mais <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>
  `).join('');
}

/* ===== FORMULÁRIO CONTATO ===== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    const data = {
      name:    form.name?.value,
      email:   form.email?.value,
      phone:   form.phone?.value,
      message: form.message?.value,
    };
    try {
      const res = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showToast('Mensagem enviada com sucesso!', 'success');
        form.reset();
      } else {
        showToast('Erro ao enviar. Tente novamente.', 'error');
      }
    } catch {
      showToast('Erro de conexão. Tente novamente.', 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Enviar Mensagem';
  });
}

/* ===== SIMULADOR CPF ===== */
function initSimulator() {
  const cpfInput = document.getElementById('sim-cpf');
  if (!cpfInput) return;
  cpfInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g,'');
    if (v.length > 11) v = v.slice(0,11);
    v = v.replace(/(\d{3})(\d)/,'$1.$2')
         .replace(/(\d{3})\.(\d{3})(\d)/,'$1.$2.$3')
         .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/,'$1.$2.$3-$4');
    e.target.value = v;
  });

  const btnSim = document.getElementById('btn-simular');
  if (!btnSim) return;
  btnSim.addEventListener('click', () => {
    const cpf = cpfInput.value.replace(/\D/g,'');
    const cel = document.getElementById('sim-celular')?.value || '';
    if (cpf.length !== 11) { showToast('CPF inválido', 'error'); return; }
    window.location.href = `simulacao.html?cpf=${cpf}&tel=${encodeURIComponent(cel)}`;
  });
}

/* ===== NAV MOBILE ===== */
function initNavMobile() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('nav-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('open');
  });
}

/* ===== UTILITÁRIOS ===== */
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'});
}

function showToast(msg, type = 'default') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 3500);
}
