/* ============================================================
   QUALICONSIG CMS - admin.js
   Gerencia login (Supabase), CRUD via API e UI do painel
   ============================================================ */

const API = window.QUALICONSIG_API || 'https://qualiconsig-api.fly.dev/api';
let _token = localStorage.getItem('qcms_token') || null;
let _currentContact = null;

/* ===========================
   AUTENTICAÇÃO
=========================== */
document.addEventListener('DOMContentLoaded', () => {
  if (_token) { showCMS(); loadAll(); }
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('btn-logout').addEventListener('click', doLogout);
  setupNav();
  initColorPickers();
});

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  const btnTxt= document.getElementById('login-btn-text');
  errEl.classList.remove('show');
  btnTxt.textContent = 'Entrando...';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      _token = data.token;
      localStorage.setItem('qcms_token', _token);
      document.getElementById('user-name').textContent  = data.user?.name  || email.split('@')[0];
      document.getElementById('user-email').textContent = data.user?.email || email;
      showCMS();
      loadAll();
    } else {
      errEl.textContent = data.error || 'E-mail ou senha inválidos.';
      errEl.classList.add('show');
    }
  } catch {
    errEl.textContent = 'Erro de conexão com a API.';
    errEl.classList.add('show');
  }
  btnTxt.textContent = 'Entrar';
}

function doLogout() {
  _token = null;
  localStorage.removeItem('qcms_token');
  document.getElementById('cms-app').classList.remove('visible');
  document.getElementById('login-page').style.display = 'flex';
}

function showCMS() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('cms-app').classList.add('visible');
}

/* ===========================
   NAVEGAÇÃO
=========================== */
const SECTION_TITLES = {
  dashboard: '<i class="fas fa-th-large"></i> Dashboard',
  banners:   '<i class="fas fa-images"></i> Banners / Slider',
  cards:     '<i class="fas fa-clone"></i> Cards Principais',
  why:       '<i class="fas fa-list-check"></i> Por que Qualiconsig',
  services:  '<i class="fas fa-th"></i> Outros Serviços',
  blog:      '<i class="fas fa-newspaper"></i> Blog',
  settings:  '<i class="fas fa-palette"></i> Cores e Identidade',
  texts:     '<i class="fas fa-font"></i> Textos e Rodapé',
  contacts:  '<i class="fas fa-envelope"></i> Contatos Recebidos',
  users:     '<i class="fas fa-users"></i> Usuários do CMS',
};

function setupNav() {
  document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });
}

function showSection(name) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === name));
  document.querySelectorAll('.cms-section').forEach(s => s.classList.toggle('active', s.id === `sec-${name}`));
  document.getElementById('section-title').innerHTML = SECTION_TITLES[name] || name;
}

/* ===========================
   LOAD ALL DATA
=========================== */
async function loadAll() {
  await Promise.all([
    loadDashboard(),
    loadBanners(),
    loadCards(),
    loadWhyItems(),
    loadServices(),
    loadPosts(),
    loadContacts(),
    loadUsers(),
    loadSettings(),
    loadTexts(),
  ]);
}

/* ===========================
   API HELPER
=========================== */
async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_token}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (res.status === 401) { doLogout(); return null; }
  return res.ok ? res.json() : null;
}

async function uploadFile(file, bucket) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('bucket', bucket);
  const res = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${_token}` },
    body: fd,
  });
  const data = await res.json();
  return data?.url || null;
}

/* ===========================
   DASHBOARD
=========================== */
async function loadDashboard() {
  const stats = await api('/dashboard/stats');
  if (stats) {
    document.getElementById('stat-banners').textContent  = stats.banners  ?? 0;
    document.getElementById('stat-posts').textContent    = stats.posts    ?? 0;
    document.getElementById('stat-contacts').textContent = stats.contacts ?? 0;
    document.getElementById('stat-users').textContent    = stats.users    ?? 0;
  }
  const contacts = await api('/contacts?limit=5');
  if (contacts) renderDashContacts(contacts);
}

function renderDashContacts(list) {
  const tbody = document.getElementById('dash-contacts-body');
  if (!list?.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#94a3b8">Nenhum contato ainda</td></tr>'; return; }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.phone || '—')}</td>
      <td>${fmtDate(c.created_at)}</td>
      <td><span class="badge ${c.read ? 'badge-success' : 'badge-blue'}">${c.read ? 'Lido' : 'Novo'}</span></td>
    </tr>
  `).join('');
}

/* ===========================
   BANNERS
=========================== */
let _banners = [];
async function loadBanners() {
  const data = await api('/banners');
  if (data) { _banners = data; renderBannersList(); }
}

function renderBannersList() {
  const ul = document.getElementById('banners-order-list');
  ul.innerHTML = _banners
    .sort((a,b) => a.order_position - b.order_position)
    .map((b, i) => `
      <li class="order-item" draggable="true" data-id="${b.id}" data-idx="${i}">
        <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
        <img class="order-thumb" src="${b.image_url || ''}" alt="${b.title}" onerror="this.style.opacity='0.2'">
        <div class="order-info">
          <strong>${esc(b.title)}</strong>
          <span>${esc(b.subtitle?.slice(0,50) || '')}...</span>
        </div>
        <div class="order-num">${i+1}</div>
        <span class="badge ${b.is_active ? 'badge-success' : 'badge-warning'}">${b.is_active ? 'Ativo' : 'Inativo'}</span>
        <button class="btn-icon" onclick="editBanner('${b.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" onclick="deleteBanner('${b.id}')"><i class="fas fa-trash"></i></button>
      </li>
    `).join('');
  initDragDrop(ul, _banners);
}

function openBannerModal(id = null) {
  const b = id ? _banners.find(x => x.id === id) : null;
  document.getElementById('banner-modal-title').textContent = b ? 'Editar Banner' : 'Novo Banner';
  document.getElementById('b-id').value        = b?.id || '';
  document.getElementById('b-title').value     = b?.title || '';
  document.getElementById('b-subtitle').value  = b?.subtitle || '';
  document.getElementById('b-cta-text').value  = b?.cta_text || 'Saiba Mais';
  document.getElementById('b-cta-url').value   = b?.cta_url || '#';
  document.getElementById('b-img-url').value   = b?.image_url || '';
  document.getElementById('b-img-position').value = b?.image_position || 'center center';
  const tog = document.getElementById('b-active');
  tog.className = 'toggle' + (b?.is_active !== false ? ' on' : '');
  // Resetar botões de posição
  document.querySelectorAll('.pos-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.pos === (b?.image_position || 'center center'));
  });
  // Atualizar preview
  updateBannerPreview();
  openModal('modal-banner');
}
function editBanner(id) { openBannerModal(id); }

async function saveBanner() {
  const id       = document.getElementById('b-id').value;
  const imgFile  = document.querySelector('#modal-banner input[type="file"]').files[0];
  let imgUrl     = document.getElementById('b-img-url').value;
  if (imgFile) { const uploaded = await uploadFile(imgFile, 'banners'); if (uploaded) imgUrl = uploaded; }
  const body = {
    title:          document.getElementById('b-title').value,
    subtitle:       document.getElementById('b-subtitle').value,
    cta_text:       document.getElementById('b-cta-text').value,
    cta_url:        document.getElementById('b-cta-url').value,
    image_url:      imgUrl,
    image_position: document.getElementById('b-img-position').value || 'center center',
    is_active:      document.getElementById('b-active').classList.contains('on'),
    order_position: id ? undefined : _banners.length,
  };
  const res = id ? await api(`/banners/${id}`, 'PUT', body) : await api('/banners', 'POST', body);
  if (res) { closeModal('modal-banner'); loadBanners(); toast('Banner salvo!', 'success'); }
  else toast('Erro ao salvar banner', 'error');
}

// Preview ao vivo do banner
function updateBannerPreview() {
  const url   = document.getElementById('b-img-url').value;
  const title = document.getElementById('b-title').value || 'Título do Banner';
  const sub   = document.getElementById('b-subtitle').value || 'Subtítulo do banner aparece aqui';
  const pos   = document.getElementById('b-img-position').value || 'center center';
  const bg    = document.getElementById('banner-preview-bg');
  if (bg) {
    bg.style.backgroundImage  = url ? `url('${url}')` : 'none';
    bg.style.backgroundPosition = pos;
  }
  const pt = document.getElementById('prev-title');
  const ps = document.getElementById('prev-subtitle');
  if (pt) pt.textContent = title;
  if (ps) ps.textContent = sub;
}

function bannerImageChanged(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    // Só atualiza o preview visual — NÃO preenche o campo URL com base64
    const bg = document.getElementById('banner-preview-bg');
    if (bg) bg.style.backgroundImage = `url('${e.target.result}')`;
  };
  reader.readAsDataURL(file);
}

function setPos(btn) {
  document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('b-img-position').value = btn.dataset.pos;
  updateBannerPreview();
}

async function deleteBanner(id) {
  if (!confirm('Excluir este banner?')) return;
  const res = await api(`/banners/${id}`, 'DELETE');
  if (res !== null) { loadBanners(); toast('Banner excluído', 'success'); }
}

async function saveBannerOrder() {
  const items = document.querySelectorAll('#banners-order-list .order-item');
  const order = Array.from(items).map((el, i) => ({ id: el.dataset.id, order_position: i }));
  const res = await api('/banners/reorder', 'PUT', { order });
  if (res) toast('Ordem salva!', 'success');
  else toast('Erro ao salvar ordem', 'error');
}

/* ===========================
   DRAG & DROP
=========================== */
function initDragDrop(list, arr) {
  let dragging = null;
  list.querySelectorAll('[draggable]').forEach(item => {
    item.addEventListener('dragstart', () => { dragging = item; item.classList.add('dragging'); });
    item.addEventListener('dragend',   () => { dragging = null; item.classList.remove('dragging'); });
    item.addEventListener('dragover',  e => { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', () => {
      item.classList.remove('drag-over');
      if (dragging && dragging !== item) list.insertBefore(dragging, item);
      // update números
      list.querySelectorAll('.order-num').forEach((el, i) => el.textContent = i + 1);
    });
  });
}

/* ===========================
   CARDS
=========================== */
let _cards = [];
async function loadCards() {
  const data = await api('/cards');
  if (data) { _cards = data; renderCards(); }
}
function renderCards() {
  const tbody = document.getElementById('cards-body');
  tbody.innerHTML = _cards.map(c => `
    <tr>
      <td><i class="${esc(c.icon_class || 'fas fa-star')}" style="font-size:22px;color:#136289"></i></td>
      <td><strong>${esc(c.title)}</strong></td>
      <td>${esc(c.link_text || 'Saiba Mais')}</td>
      <td>${esc(c.link_url || '—')}</td>
      <td><span class="badge badge-success">Ativo</span></td>
      <td style="display:flex;gap:6px">
        <button class="btn-icon" onclick="editCard('${c.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" onclick="deleteCard('${c.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}
function openCardModal(id = null) {
  const c = id ? _cards.find(x => x.id === id) : null;
  document.getElementById('card-modal-title').textContent = c ? 'Editar Card' : 'Novo Card';
  document.getElementById('c-id').value     = c?.id || '';
  document.getElementById('c-title').value  = c?.title || '';
  document.getElementById('c-icon').value   = c?.icon_class || 'fas fa-star';
  document.getElementById('c-desc').value   = c?.description || '';
  document.getElementById('c-btn-text').value = c?.link_text || 'Saiba Mais';
  document.getElementById('c-link').value   = c?.link_url || '#';
  openModal('modal-card');
}
function editCard(id) { openCardModal(id); }
async function saveCard() {
  const id = document.getElementById('c-id').value;
  const body = { title: document.getElementById('c-title').value, icon_class: document.getElementById('c-icon').value, description: document.getElementById('c-desc').value, link_text: document.getElementById('c-btn-text').value, link_url: document.getElementById('c-link').value };
  const res = id ? await api(`/cards/${id}`, 'PUT', body) : await api('/cards', 'POST', body);
  if (res) { closeModal('modal-card'); loadCards(); toast('Card salvo!', 'success'); }
}
async function deleteCard(id) {
  if (!confirm('Excluir este card?')) return;
  await api(`/cards/${id}`, 'DELETE'); loadCards(); toast('Card excluído');
}

/* ===========================
   WHY ITEMS
=========================== */
let _why = [];
async function loadWhyItems() {
  const data = await api('/why-items');
  if (data) { _why = data; renderWhy(); }
}
function renderWhy() {
  document.getElementById('why-body').innerHTML = _why.map(w => `
    <tr>
      <td><i class="${esc(w.icon_class || 'fas fa-check')}" style="font-size:20px;color:#136289"></i></td>
      <td><strong>${esc(w.title)}</strong></td>
      <td>${esc(w.description?.slice(0,70) || '')}...</td>
      <td style="display:flex;gap:6px">
        <button class="btn-icon" onclick="editWhyItem('${w.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" onclick="deleteWhyItem('${w.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}
function openWhyModal(id = null) {
  const w = id ? _why.find(x => x.id === id) : null;
  document.getElementById('w-id').value    = w?.id || '';
  document.getElementById('w-title').value = w?.title || '';
  document.getElementById('w-icon').value  = w?.icon_class || 'fas fa-check-circle';
  document.getElementById('w-desc').value  = w?.description || '';
  openModal('modal-why');
}
function editWhyItem(id) { openWhyModal(id); }
async function saveWhyItem() {
  const id = document.getElementById('w-id').value;
  const body = { title: document.getElementById('w-title').value, icon_class: document.getElementById('w-icon').value, description: document.getElementById('w-desc').value };
  const res = id ? await api(`/why-items/${id}`, 'PUT', body) : await api('/why-items', 'POST', body);
  if (res) { closeModal('modal-why'); loadWhyItems(); toast('Item salvo!', 'success'); }
}
async function deleteWhyItem(id) {
  if (!confirm('Excluir?')) return;
  await api(`/why-items/${id}`, 'DELETE'); loadWhyItems();
}

/* ===========================
   SERVIÇOS
=========================== */
let _services = [];
async function loadServices() {
  const data = await api('/services');
  if (data) { _services = data; renderServices(); }
}
function renderServices() {
  document.getElementById('services-body').innerHTML = _services.map(s => `
    <tr>
      <td><img class="table-img" src="${s.image_url||''}" onerror="this.style.opacity='0.1'"></td>
      <td><strong>${esc(s.name)}</strong></td>
      <td>${esc(s.link_url || '—')}</td>
      <td><span class="badge badge-success">Ativo</span></td>
      <td style="display:flex;gap:6px">
        <button class="btn-icon" onclick="editService('${s.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" onclick="deleteService('${s.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}
function openServiceModal(id = null) {
  const s = id ? _services.find(x => x.id === id) : null;
  document.getElementById('service-modal-title').textContent = s ? 'Editar Serviço' : 'Novo Serviço';
  document.getElementById('s-id').value      = s?.id || '';
  document.getElementById('s-name').value    = s?.name || '';
  document.getElementById('s-link').value    = s?.link_url || '';
  document.getElementById('s-img-url').value = s?.image_url || '';
  const prev = document.getElementById('s-img-preview');
  prev.style.display = s?.image_url ? 'block' : 'none';
  if (s?.image_url) prev.src = s.image_url;
  openModal('modal-service');
}
function editService(id) { openServiceModal(id); }
async function saveService() {
  const id = document.getElementById('s-id').value;
  const imgFile = document.querySelector('#modal-service input[type="file"]').files[0];
  let imgUrl = document.getElementById('s-img-url').value;
  if (imgFile) { const up = await uploadFile(imgFile, 'services'); if (up) imgUrl = up; }
  const body = { name: document.getElementById('s-name').value, link_url: document.getElementById('s-link').value, image_url: imgUrl };
  const res = id ? await api(`/services/${id}`, 'PUT', body) : await api('/services', 'POST', body);
  if (res) { closeModal('modal-service'); loadServices(); toast('Serviço salvo!', 'success'); }
}
async function deleteService(id) {
  if (!confirm('Excluir?')) return;
  await api(`/services/${id}`, 'DELETE'); loadServices();
}

/* ===========================
   BLOG
=========================== */
let _posts = [];
async function loadPosts() {
  const data = await api('/posts');
  if (data) { _posts = data; renderPosts(); }
}
function renderPosts() {
  document.getElementById('posts-body').innerHTML = _posts.map(p => `
    <tr>
      <td><img class="table-img" src="${p.image_url||''}" onerror="this.style.opacity='0.1'"></td>
      <td><strong>${esc(p.title)}</strong></td>
      <td><span class="badge badge-blue">${esc(p.category||'—')}</span></td>
      <td>${fmtDate(p.published_at)}</td>
      <td><span class="badge ${p.status==='published'?'badge-success':'badge-warning'}">${p.status==='published'?'Publicado':'Rascunho'}</span></td>
      <td style="display:flex;gap:6px">
        <button class="btn-icon" onclick="editPost('${p.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" onclick="deletePost('${p.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}
function openPostModal(id = null) {
  const p = id ? _posts.find(x => x.id === id) : null;
  document.getElementById('post-modal-title').textContent = p ? 'Editar Post' : 'Novo Post';
  document.getElementById('p-id').value       = p?.id || '';
  document.getElementById('p-title').value    = p?.title || '';
  document.getElementById('p-category').value = p?.category || 'Notícia';
  document.getElementById('p-excerpt').value  = p?.excerpt || '';
  document.getElementById('p-content').value  = p?.content || '';
  document.getElementById('p-status').value   = p?.status || 'published';
  document.getElementById('p-img-url').value  = p?.image_url || '';
  const dateInput = document.getElementById('p-date');
  dateInput.value = p?.published_at ? p.published_at.slice(0,10) : new Date().toISOString().slice(0,10);
  const prev = document.getElementById('p-img-preview');
  prev.style.display = p?.image_url ? 'block' : 'none';
  if (p?.image_url) prev.src = p.image_url;
  openModal('modal-post');
}
function editPost(id) { openPostModal(id); }
async function savePost() {
  const id = document.getElementById('p-id').value;
  const imgFile = document.querySelector('#modal-post input[type="file"]').files[0];
  let imgUrl = document.getElementById('p-img-url').value;
  if (imgFile) { const up = await uploadFile(imgFile, 'blog'); if (up) imgUrl = up; }
  const body = {
    title:        document.getElementById('p-title').value,
    category:     document.getElementById('p-category').value,
    excerpt:      document.getElementById('p-excerpt').value,
    content:      document.getElementById('p-content').value,
    status:       document.getElementById('p-status').value,
    image_url:    imgUrl,
    published_at: document.getElementById('p-date').value,
    slug:         slugify(document.getElementById('p-title').value),
  };
  const res = id ? await api(`/posts/${id}`, 'PUT', body) : await api('/posts', 'POST', body);
  if (res) { closeModal('modal-post'); loadPosts(); toast('Post salvo!', 'success'); }
}
async function deletePost(id) {
  if (!confirm('Excluir post?')) return;
  await api(`/posts/${id}`, 'DELETE'); loadPosts();
}

/* ===========================
   SETTINGS (CORES)
=========================== */
async function loadSettings() {
  const data = await api('/settings');
  if (!data) return;
  setColor('primary',   data.color_primary   || '#FFCB00');
  setColor('secondary', data.color_secondary || '#136289');
  setColor('dark',      data.color_dark      || '#001F64');
  if (data.logo_height) document.getElementById('logo-height').value = data.logo_height;
  if (data.logo_url) { const p = document.getElementById('logo-preview'); p.src = data.logo_url; p.style.display = 'block'; }
}
function setColor(name, hex) {
  document.getElementById(`color-${name}`).value     = hex;
  document.getElementById(`color-${name}-hex`).value = hex;
}
async function saveSettings() {
  const logoFile = document.querySelector('#logo-upload input[type="file"]').files[0];
  const simFile  = document.querySelector('#sim-upload input[type="file"]')?.files[0];
  const testFile = document.querySelector('#testimonial-upload input[type="file"]')?.files[0];
  let logoUrl = null, simUrl = null, testUrl = null;
  if (logoFile) logoUrl = await uploadFile(logoFile, 'logos');
  if (simFile)  simUrl  = await uploadFile(simFile,  'site');
  if (testFile) testUrl = await uploadFile(testFile, 'site');
  const body = {
    color_primary:   document.getElementById('color-primary-hex').value,
    color_secondary: document.getElementById('color-secondary-hex').value,
    color_dark:      document.getElementById('color-dark-hex').value,
    logo_height:     parseInt(document.getElementById('logo-height').value) || 44,
  };
  if (logoUrl) body.logo_url = logoUrl;
  if (simUrl)  body.simulator_image_url = simUrl;
  if (testUrl) body.testimonial_image_url = testUrl;
  const res = await api('/settings', 'PUT', body);
  if (res) toast('Configurações salvas! Atualize o site.', 'success');
  else toast('Erro ao salvar', 'error');
}
function initColorPickers() {
  ['primary','secondary','dark'].forEach(name => {
    const picker = document.getElementById(`color-${name}`);
    const hexIn  = document.getElementById(`color-${name}-hex`);
    if (!picker || !hexIn) return;
    picker.addEventListener('input', () => hexIn.value = picker.value);
    hexIn.addEventListener('input', () => { if (/^#[0-9A-Fa-f]{6}$/.test(hexIn.value)) picker.value = hexIn.value; });
  });
}

/* ===========================
   TEXTS
=========================== */
async function loadTexts() {
  const data = await api('/settings');
  if (!data) return;
  document.getElementById('txt-phone').value       = data.phone || '';
  document.getElementById('txt-email').value       = data.email || '';
  document.getElementById('txt-address').value     = data.address || '';
  document.getElementById('txt-cnpj').value        = data.cnpj || '';
  document.getElementById('txt-footer-desc').value = data.footer_desc || '';
}
async function saveTexts() {
  const body = {
    phone:       document.getElementById('txt-phone').value,
    email:       document.getElementById('txt-email').value,
    address:     document.getElementById('txt-address').value,
    cnpj:        document.getElementById('txt-cnpj').value,
    footer_desc: document.getElementById('txt-footer-desc').value,
  };
  const res = await api('/settings', 'PATCH', body);
  if (res) toast('Textos salvos!', 'success');
  else toast('Erro ao salvar', 'error');
}

/* ===========================
   CONTATOS
=========================== */
async function loadContacts() {
  const data = await api('/contacts');
  if (data) renderContactsTable(data);
}
function renderContactsTable(list) {
  const tbody = document.getElementById('contacts-body');
  if (!list?.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8">Nenhum contato recebido</td></tr>'; return; }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.phone || '—')}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.message || '—')}</td>
      <td>${fmtDate(c.created_at)}</td>
      <td><span class="badge ${c.read ? 'badge-success' : 'badge-blue'}">${c.read ? 'Lido' : 'Novo'}</span></td>
      <td>
        <button class="btn-icon" onclick="viewContact(${JSON.stringify(c).replace(/"/g,'&quot;')})"><i class="fas fa-eye"></i></button>
      </td>
    </tr>
  `).join('');
}
function viewContact(c) {
  _currentContact = c;
  document.getElementById('contact-detail-body').innerHTML = `
    <div class="contact-detail">
      <p><strong>Nome:</strong> ${esc(c.name)}</p>
      <p><strong>E-mail:</strong> ${esc(c.email)}</p>
      <p><strong>Telefone:</strong> ${esc(c.phone || '—')}</p>
      <p><strong>Data:</strong> ${fmtDate(c.created_at)}</p>
      <p><strong>Status:</strong> <span class="badge ${c.read ? 'badge-success' : 'badge-blue'}">${c.read ? 'Lido' : 'Novo'}</span></p>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e2e8f0">
      <p><strong>Mensagem:</strong></p>
      <p style="background:#f8fafc;border-radius:8px;padding:14px;margin-top:8px;line-height:1.6">${esc(c.message || '—')}</p>
    </div>
  `;
  openModal('modal-contact-detail');
}
async function markContactRead() {
  if (!_currentContact) return;
  await api(`/contacts/${_currentContact.id}`, 'PATCH', { read: true });
  closeModal('modal-contact-detail');
  loadContacts();
  toast('Marcado como lido', 'success');
}

/* ===========================
   USUÁRIOS
=========================== */
let _users = [];
async function loadUsers() {
  const data = await api('/users');
  if (data) { _users = data; renderUsers(); }
}
function renderUsers() {
  document.getElementById('users-body').innerHTML = _users.map(u => `
    <tr>
      <td><strong>${esc(u.name || u.email?.split('@')[0])}</strong></td>
      <td>${esc(u.email)}</td>
      <td><span class="badge ${u.role==='admin'?'badge-danger':u.role==='editor'?'badge-blue':'badge-warning'}">${u.role||'editor'}</span></td>
      <td><span class="badge badge-success">Ativo</span></td>
      <td style="display:flex;gap:6px">
        <button class="btn-icon" onclick="editUser('${u.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}
function openUserModal(id = null) {
  const u = id ? _users.find(x => x.id === id) : null;
  document.getElementById('user-modal-title').textContent = u ? 'Editar Usuário' : 'Novo Usuário';
  document.getElementById('u-id').value    = u?.id || '';
  document.getElementById('u-name').value  = u?.name || '';
  document.getElementById('u-email').value = u?.email || '';
  document.getElementById('u-pass').value  = '';
  document.getElementById('u-role').value  = u?.role || 'editor';
  openModal('modal-user');
}
function editUser(id) { openUserModal(id); }
async function saveUser() {
  const id = document.getElementById('u-id').value;
  const body = { name: document.getElementById('u-name').value, email: document.getElementById('u-email').value, role: document.getElementById('u-role').value };
  const pass = document.getElementById('u-pass').value;
  if (pass) { if (pass.length < 8) { toast('Senha mínima: 8 caracteres', 'error'); return; } body.password = pass; }
  const res = id ? await api(`/users/${id}`, 'PUT', body) : await api('/users', 'POST', body);
  if (res) { closeModal('modal-user'); loadUsers(); toast('Usuário salvo!', 'success'); }
  else toast('Erro ao salvar usuário', 'error');
}
async function deleteUser(id) {
  if (!confirm('Excluir este usuário?')) return;
  await api(`/users/${id}`, 'DELETE'); loadUsers();
}

/* ===========================
   UTILITÁRIOS
=========================== */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function previewImage(input, previewId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById(previewId);
    img.src = e.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function toast(msg, type = 'default') {
  let el = document.getElementById('cms-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cms-toast';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#001F64;color:white;padding:13px 20px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;transition:all 0.3s;transform:translateY(80px);opacity:0;border-left:4px solid #FFCB00;box-shadow:0 8px 30px rgba(0,0,0,0.2);max-width:320px';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.borderLeftColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#FFCB00';
  el.style.transform = 'translateY(0)';
  el.style.opacity   = '1';
  setTimeout(() => { el.style.transform = 'translateY(80px)'; el.style.opacity = '0'; }, 3000);
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
