/* ============================================================
   QUALICONSIG CMS - admin.js v2
   Conexão direta com Supabase + controles visuais completos
   ============================================================ */

const SUPABASE_URL  = 'https://unvnqtrylofckskjuupn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudm5xdHJ5bG9mY2tza2p1dXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzAyMDgsImV4cCI6MjA5MDIwNjIwOH0.KY_9uDFguoYDf9HLTFxkgsmIZMuN20sZJoSPTCisJ3w';
let _sbToken = localStorage.getItem('qcms_sb_token') || null;
let _currentContact = null;

/* ===== SUPABASE HELPERS ===== */
async function sbGet(table, params='') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers:{'apikey':SUPABASE_ANON,'Authorization':`Bearer ${_sbToken||SUPABASE_ANON}`}
  });
  if(!res.ok) return null;
  return res.json();
}
async function sbPost(table,body) {
  const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:'POST',headers:{'apikey':SUPABASE_ANON,'Authorization':`Bearer ${_sbToken||SUPABASE_ANON}`,'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(body)});
  if(!res.ok) return null;
  const d=await res.json(); return Array.isArray(d)?d[0]:d;
}
async function sbPatch(table,id,body) {
  const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,{method:'PATCH',headers:{'apikey':SUPABASE_ANON,'Authorization':`Bearer ${_sbToken||SUPABASE_ANON}`,'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(body)});
  if(!res.ok) return null;
  const d=await res.json(); return Array.isArray(d)?d[0]:d;
}
async function sbDelete(table,id) {
  const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,{method:'DELETE',headers:{'apikey':SUPABASE_ANON,'Authorization':`Bearer ${_sbToken||SUPABASE_ANON}`}});
  return res.ok;
}
async function sbUpload(file,bucket) {
  const ext=file.name.split('.').pop();
  const path=`${bucket}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res=await fetch(`${SUPABASE_URL}/storage/v1/object/qualiconsig/${path}`,{method:'POST',headers:{'apikey':SUPABASE_ANON,'Authorization':`Bearer ${_sbToken||SUPABASE_ANON}`,'Content-Type':file.type},body:file});
  if(!res.ok) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/qualiconsig/${path}`;
}

/* ===== LOGIN ===== */
document.addEventListener('DOMContentLoaded',()=>{
  if(_sbToken){verifyToken();}
  document.getElementById('btn-login').addEventListener('click',doLogin);
  document.getElementById('login-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  document.getElementById('btn-logout').addEventListener('click',doLogout);
  setupNav();
  initColorPickers();
});
async function verifyToken() {
  const res=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{'apikey':SUPABASE_ANON,'Authorization':`Bearer ${_sbToken}`}});
  if(res.ok){showCMS();loadAll();}
  else{_sbToken=null;localStorage.removeItem('qcms_sb_token');}
}
async function doLogin() {
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  const errEl=document.getElementById('login-error');
  const btnTxt=document.getElementById('login-btn-text');
  errEl.classList.remove('show'); btnTxt.textContent='Entrando...';
  try {
    const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{'apikey':SUPABASE_ANON,'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
    const data=await res.json();
    if(res.ok&&data.access_token){
      _sbToken=data.access_token;
      localStorage.setItem('qcms_sb_token',_sbToken);
      document.getElementById('user-name').textContent=data.user?.user_metadata?.name||email.split('@')[0];
      document.getElementById('user-email').textContent=email;
      showCMS(); loadAll();
    } else { errEl.textContent='E-mail ou senha inválidos.'; errEl.classList.add('show'); }
  } catch { errEl.textContent='Erro de conexão.'; errEl.classList.add('show'); }
  btnTxt.textContent='Entrar';
}
function doLogout() { _sbToken=null; localStorage.removeItem('qcms_sb_token'); document.getElementById('cms-app').classList.remove('visible'); document.getElementById('login-page').style.display='flex'; }
function showCMS() { document.getElementById('login-page').style.display='none'; document.getElementById('cms-app').classList.add('visible'); }

/* ===== NAVEGAÇÃO ===== */
const SECTION_TITLES={
  dashboard:'<i class="fas fa-th-large"></i> Dashboard',
  banners:'<i class="fas fa-images"></i> Banners / Slider',
  cards:'<i class="fas fa-clone"></i> Cards Principais',
  why:'<i class="fas fa-list-check"></i> Por que Qualiconsig',
  services:'<i class="fas fa-th"></i> Outros Serviços',
  blog:'<i class="fas fa-newspaper"></i> Blog',
  settings:'<i class="fas fa-palette"></i> Cores e Identidade',
  cms_appearance:'<i class="fas fa-sliders-h"></i> Aparência do Painel',
  texts:'<i class="fas fa-font"></i> Textos e Rodapé',
  contacts:'<i class="fas fa-envelope"></i> Contatos Recebidos',
  users:'<i class="fas fa-users"></i> Usuários do CMS',
};
function setupNav() { document.querySelectorAll('.nav-item[data-section]').forEach(btn=>btn.addEventListener('click',()=>showSection(btn.dataset.section))); }
function showSection(name) {
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.section===name));
  document.querySelectorAll('.cms-section').forEach(s=>s.classList.toggle('active',s.id===`sec-${name}`));
  document.getElementById('section-title').innerHTML=SECTION_TITLES[name]||name;
}

/* ===== LOAD ALL ===== */
async function loadAll() { await Promise.all([loadDashboard(),loadBanners(),loadCards(),loadWhyItems(),loadServices(),loadPosts(),loadContacts(),loadUsers(),loadSettings(),loadTexts()]); }

/* ===== DASHBOARD ===== */
async function loadDashboard() {
  const [b,p,c,u]=await Promise.all([sbGet('banners','?is_active=eq.true&select=id'),sbGet('posts','?status=eq.published&select=id'),sbGet('contacts','?select=id'),sbGet('cms_users','?is_active=eq.true&select=id')]);
  document.getElementById('stat-banners').textContent=b?.length??0;
  document.getElementById('stat-posts').textContent=p?.length??0;
  document.getElementById('stat-contacts').textContent=c?.length??0;
  document.getElementById('stat-users').textContent=u?.length??0;
  const contacts=await sbGet('contacts','?order=created_at.desc&limit=5&select=*');
  if(contacts) renderDashContacts(contacts);
}
function renderDashContacts(list) {
  const tbody=document.getElementById('dash-contacts-body');
  if(!list?.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:#94a3b8">Nenhum contato ainda</td></tr>';return;}
  tbody.innerHTML=list.map(c=>`<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.email)}</td><td>${esc(c.phone||'—')}</td><td>${fmtDate(c.created_at)}</td><td><span class="badge ${c.read?'badge-success':'badge-blue'}">${c.read?'Lido':'Novo'}</span></td></tr>`).join('');
}

/* ===== BANNERS ===== */
let _banners=[];
async function loadBanners() { const data=await sbGet('banners','?order=order_position.asc&select=*'); if(data){_banners=data;renderBannersList();} }
function renderBannersList() {
  const ul=document.getElementById('banners-order-list');
  ul.innerHTML=_banners.map((b,i)=>`
    <li class="order-item" draggable="true" data-id="${b.id}" data-idx="${i}">
      <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
      <img class="order-thumb" src="${b.image_url||''}" onerror="this.style.opacity='0.2'">
      <div class="order-info"><strong>${esc(b.title)}</strong><span>${esc(b.subtitle?.slice(0,50)||'')}...</span></div>
      <div class="order-num">${i+1}</div>
      <span class="badge ${b.is_active?'badge-success':'badge-warning'}">${b.is_active?'Ativo':'Inativo'}</span>
      <button class="btn-icon" onclick="editBanner('${b.id}')"><i class="fas fa-edit"></i></button>
      <button class="btn-icon danger" onclick="deleteBanner('${b.id}')"><i class="fas fa-trash"></i></button>
    </li>`).join('');
  initDragDrop(ul);
}
function openBannerModal(id=null) {
  const b=id?_banners.find(x=>x.id===id):null;
  document.getElementById('banner-modal-title').textContent=b?'Editar Banner':'Novo Banner';
  document.getElementById('b-id').value=b?.id||'';
  document.getElementById('b-title').value=b?.title||'';
  document.getElementById('b-subtitle').value=b?.subtitle||'';
  document.getElementById('b-cta-text').value=b?.cta_text||'Saiba Mais';
  document.getElementById('b-cta-url').value=b?.cta_url||'#';
  document.getElementById('b-img-url').value=b?.image_url||'';
  document.getElementById('b-img-position').value=b?.image_position||'center center';
  document.getElementById('b-img-zoom').value=b?.image_zoom||100;
  document.getElementById('b-img-zoom-val').textContent=(b?.image_zoom||100)+'%';
  document.getElementById('b-title-size').value=b?.title_size||44;
  document.getElementById('b-title-color').value=b?.title_color||'#ffffff';
  document.getElementById('b-title-color-hex').value=b?.title_color||'#ffffff';
  document.getElementById('b-subtitle-size').value=b?.subtitle_size||15;
  document.getElementById('b-subtitle-color').value=b?.subtitle_color||'#ffffff';
  document.getElementById('b-subtitle-color-hex').value=b?.subtitle_color||'#ffffff';
  document.getElementById('b-active').className='toggle'+(b?.is_active!==false?' on':'');
  document.querySelectorAll('.pos-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.pos===(b?.image_position||'center center')));
  updateBannerPreview();
  openModal('modal-banner');
}
function editBanner(id){openBannerModal(id);}
async function saveBanner() {
  const id=document.getElementById('b-id').value;
  const imgFile=document.querySelector('#modal-banner input[type="file"]').files[0];
  let imgUrl=document.getElementById('b-img-url').value;
  if(imgFile){const up=await sbUpload(imgFile,'banners');if(up)imgUrl=up;}
  const body={
    title:document.getElementById('b-title').value,
    subtitle:document.getElementById('b-subtitle').value,
    cta_text:document.getElementById('b-cta-text').value,
    cta_url:document.getElementById('b-cta-url').value,
    image_url:imgUrl,
    image_position:document.getElementById('b-img-position').value||'center center',
    image_zoom:parseInt(document.getElementById('b-img-zoom').value)||100,
    title_size:parseInt(document.getElementById('b-title-size').value)||44,
    title_color:document.getElementById('b-title-color-hex').value||'#ffffff',
    subtitle_size:parseInt(document.getElementById('b-subtitle-size').value)||15,
    subtitle_color:document.getElementById('b-subtitle-color-hex').value||'#ffffff',
    is_active:document.getElementById('b-active').classList.contains('on'),
  };
  if(!id) body.order_position=_banners.length;
  const res=id?await sbPatch('banners',id,body):await sbPost('banners',body);
  if(res){closeModal('modal-banner');loadBanners();toast('Banner salvo!','success');}
  else toast('Erro ao salvar banner','error');
}
async function deleteBanner(id){if(!confirm('Excluir?'))return;await sbDelete('banners',id);loadBanners();toast('Banner excluído');}
async function saveBannerOrder() {
  const items=document.querySelectorAll('#banners-order-list .order-item');
  await Promise.all(Array.from(items).map((el,i)=>sbPatch('banners',el.dataset.id,{order_position:i})));
  toast('Ordem salva!','success');
}
function updateBannerPreview() {
  const url=document.getElementById('b-img-url').value;
  const pos=document.getElementById('b-img-position').value||'center center';
  const zoom=document.getElementById('b-img-zoom')?.value||100;
  const titleSize=document.getElementById('b-title-size')?.value||44;
  const titleColor=document.getElementById('b-title-color-hex')?.value||'#ffffff';
  const subSize=document.getElementById('b-subtitle-size')?.value||15;
  const subColor=document.getElementById('b-subtitle-color-hex')?.value||'#ffffff';
  const bg=document.getElementById('banner-preview-bg');
  if(bg){bg.style.backgroundImage=url?`url('${url}')`:'none';bg.style.backgroundPosition=pos;bg.style.backgroundSize=`${zoom}%`;}
  const pt=document.getElementById('prev-title');
  const ps=document.getElementById('prev-subtitle');
  if(pt){pt.textContent=document.getElementById('b-title').value||'Título do Banner';pt.style.fontSize=Math.round(titleSize*0.4)+'px';pt.style.color=titleColor;}
  if(ps){ps.textContent=document.getElementById('b-subtitle').value||'Subtítulo...';ps.style.fontSize=Math.round(subSize*0.4)+'px';ps.style.color=subColor;}
}
function bannerImageChanged(input) {
  const file=input.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{const bg=document.getElementById('banner-preview-bg');if(bg)bg.style.backgroundImage=`url('${e.target.result}')`;};
  reader.readAsDataURL(file);
}
function setPos(btn) { document.querySelectorAll('.pos-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); document.getElementById('b-img-position').value=btn.dataset.pos; updateBannerPreview(); }

/* ===== DRAG & DROP ===== */
function initDragDrop(list) {
  let dragging=null;
  list.querySelectorAll('[draggable]').forEach(item=>{
    item.addEventListener('dragstart',()=>{dragging=item;item.classList.add('dragging');});
    item.addEventListener('dragend',()=>{dragging=null;item.classList.remove('dragging');});
    item.addEventListener('dragover',e=>{e.preventDefault();item.classList.add('drag-over');});
    item.addEventListener('dragleave',()=>item.classList.remove('drag-over'));
    item.addEventListener('drop',()=>{item.classList.remove('drag-over');if(dragging&&dragging!==item)list.insertBefore(dragging,item);list.querySelectorAll('.order-num').forEach((el,i)=>el.textContent=i+1);});
  });
}

/* ===== CARDS ===== */
let _cards=[];
async function loadCards(){const data=await sbGet('cards','?order=order_position.asc&select=*');if(data){_cards=data;renderCards();}}
function renderCards(){document.getElementById('cards-body').innerHTML=_cards.map(c=>`<tr><td><i class="${esc(c.icon_class||'fas fa-star')}" style="font-size:22px;color:#136289"></i></td><td><strong>${esc(c.title)}</strong></td><td>${esc(c.link_text||'Saiba Mais')}</td><td>${esc(c.link_url||'—')}</td><td><span class="badge badge-success">Ativo</span></td><td style="display:flex;gap:6px"><button class="btn-icon" onclick="editCard('${c.id}')"><i class="fas fa-edit"></i></button><button class="btn-icon danger" onclick="deleteCard('${c.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');}
function openCardModal(id=null){const c=id?_cards.find(x=>x.id===id):null;document.getElementById('card-modal-title').textContent=c?'Editar Card':'Novo Card';document.getElementById('c-id').value=c?.id||'';document.getElementById('c-title').value=c?.title||'';document.getElementById('c-icon').value=c?.icon_class||'fas fa-star';document.getElementById('c-desc').value=c?.description||'';document.getElementById('c-btn-text').value=c?.link_text||'Saiba Mais';document.getElementById('c-link').value=c?.link_url||'#';openModal('modal-card');}
function editCard(id){openCardModal(id);}
async function saveCard(){const id=document.getElementById('c-id').value;const body={title:document.getElementById('c-title').value,icon_class:document.getElementById('c-icon').value,description:document.getElementById('c-desc').value,link_text:document.getElementById('c-btn-text').value,link_url:document.getElementById('c-link').value};const res=id?await sbPatch('cards',id,body):await sbPost('cards',body);if(res){closeModal('modal-card');loadCards();toast('Card salvo!','success');}}
async function deleteCard(id){if(!confirm('Excluir?'))return;await sbDelete('cards',id);loadCards();}

/* ===== WHY ITEMS ===== */
let _why=[];
async function loadWhyItems(){const data=await sbGet('why_items','?order=order_position.asc&select=*');if(data){_why=data;renderWhy();}}
function renderWhy(){document.getElementById('why-body').innerHTML=_why.map(w=>`<tr><td><i class="${esc(w.icon_class||'fas fa-check')}" style="font-size:20px;color:#136289"></i></td><td><strong>${esc(w.title)}</strong></td><td>${esc(w.description?.slice(0,70)||'')}...</td><td style="display:flex;gap:6px"><button class="btn-icon" onclick="editWhyItem('${w.id}')"><i class="fas fa-edit"></i></button><button class="btn-icon danger" onclick="deleteWhyItem('${w.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');}
function openWhyModal(id=null){const w=id?_why.find(x=>x.id===id):null;document.getElementById('w-id').value=w?.id||'';document.getElementById('w-title').value=w?.title||'';document.getElementById('w-icon').value=w?.icon_class||'fas fa-check-circle';document.getElementById('w-desc').value=w?.description||'';openModal('modal-why');}
function editWhyItem(id){openWhyModal(id);}
async function saveWhyItem(){const id=document.getElementById('w-id').value;const body={title:document.getElementById('w-title').value,icon_class:document.getElementById('w-icon').value,description:document.getElementById('w-desc').value};const res=id?await sbPatch('why_items',id,body):await sbPost('why_items',body);if(res){closeModal('modal-why');loadWhyItems();toast('Item salvo!','success');}}
async function deleteWhyItem(id){if(!confirm('Excluir?'))return;await sbDelete('why_items',id);loadWhyItems();}

/* ===== SERVICES ===== */
let _services=[];
async function loadServices(){const data=await sbGet('services','?order=order_position.asc&select=*');if(data){_services=data;renderServices();}}
function renderServices(){document.getElementById('services-body').innerHTML=_services.map(s=>`<tr><td><img class="table-img" src="${s.image_url||''}" style="object-fit:cover;object-position:${s.image_position||'center'}" onerror="this.style.opacity='0.1'"></td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.link_url||'—')}</td><td><span class="badge badge-success">Ativo</span></td><td style="display:flex;gap:6px"><button class="btn-icon" onclick="editService('${s.id}')"><i class="fas fa-edit"></i></button><button class="btn-icon danger" onclick="deleteService('${s.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');}
function openServiceModal(id=null){
  const s=id?_services.find(x=>x.id===id):null;
  document.getElementById('service-modal-title').textContent=s?'Editar Serviço':'Novo Serviço';
  document.getElementById('s-id').value=s?.id||'';
  document.getElementById('s-name').value=s?.name||'';
  document.getElementById('s-link').value=s?.link_url||'';
  document.getElementById('s-img-url').value=s?.image_url||'';
  document.getElementById('s-img-position').value=s?.image_position||'center center';
  document.getElementById('s-img-zoom').value=s?.image_zoom||100;
  document.getElementById('s-img-zoom-val').textContent=(s?.image_zoom||100)+'%';
  const prev=document.getElementById('s-img-preview');
  if(s?.image_url){prev.src=s.image_url;prev.style.display='block';prev.style.objectPosition=s.image_position||'center';prev.style.transform=`scale(${(s.image_zoom||100)/100})`;}
  else prev.style.display='none';
  openModal('modal-service');
}
function editService(id){openServiceModal(id);}
async function saveService(){
  const id=document.getElementById('s-id').value;
  const imgFile=document.querySelector('#modal-service input[type="file"]').files[0];
  let imgUrl=document.getElementById('s-img-url').value;
  if(imgFile){const up=await sbUpload(imgFile,'services');if(up)imgUrl=up;}
  const body={name:document.getElementById('s-name').value,link_url:document.getElementById('s-link').value,image_url:imgUrl,image_position:document.getElementById('s-img-position').value||'center center',image_zoom:parseInt(document.getElementById('s-img-zoom').value)||100};
  const res=id?await sbPatch('services',id,body):await sbPost('services',body);
  if(res){closeModal('modal-service');loadServices();toast('Serviço salvo!','success');}
}
async function deleteService(id){if(!confirm('Excluir?'))return;await sbDelete('services',id);loadServices();}

/* ===== POSTS ===== */
let _posts=[];
async function loadPosts(){const data=await sbGet('posts','?order=published_at.desc&select=*');if(data){_posts=data;renderPosts();}}
function renderPosts(){document.getElementById('posts-body').innerHTML=_posts.map(p=>`<tr><td><img class="table-img" src="${p.image_url||''}" onerror="this.style.opacity='0.1'"></td><td><strong>${esc(p.title)}</strong></td><td><span class="badge badge-blue">${esc(p.category||'—')}</span></td><td>${fmtDate(p.published_at)}</td><td><span class="badge ${p.status==='published'?'badge-success':'badge-warning'}">${p.status==='published'?'Publicado':'Rascunho'}</span></td><td style="display:flex;gap:6px"><button class="btn-icon" onclick="editPost('${p.id}')"><i class="fas fa-edit"></i></button><button class="btn-icon danger" onclick="deletePost('${p.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');}
function openPostModal(id=null){const p=id?_posts.find(x=>x.id===id):null;document.getElementById('post-modal-title').textContent=p?'Editar Post':'Novo Post';document.getElementById('p-id').value=p?.id||'';document.getElementById('p-title').value=p?.title||'';document.getElementById('p-category').value=p?.category||'Notícia';document.getElementById('p-excerpt').value=p?.excerpt||'';document.getElementById('p-content').value=p?.content||'';document.getElementById('p-status').value=p?.status||'published';document.getElementById('p-img-url').value=p?.image_url||'';document.getElementById('p-date').value=p?.published_at?p.published_at.slice(0,10):new Date().toISOString().slice(0,10);const prev=document.getElementById('p-img-preview');prev.style.display=p?.image_url?'block':'none';if(p?.image_url)prev.src=p.image_url;openModal('modal-post');}
function editPost(id){openPostModal(id);}
async function savePost(){const id=document.getElementById('p-id').value;const imgFile=document.querySelector('#modal-post input[type="file"]').files[0];let imgUrl=document.getElementById('p-img-url').value;if(imgFile){const up=await sbUpload(imgFile,'blog');if(up)imgUrl=up;}const title=document.getElementById('p-title').value;const body={title,category:document.getElementById('p-category').value,excerpt:document.getElementById('p-excerpt').value,content:document.getElementById('p-content').value,status:document.getElementById('p-status').value,image_url:imgUrl,published_at:document.getElementById('p-date').value,slug:slugify(title)};const res=id?await sbPatch('posts',id,body):await sbPost('posts',body);if(res){closeModal('modal-post');loadPosts();toast('Post salvo!','success');}}
async function deletePost(id){if(!confirm('Excluir post?'))return;await sbDelete('posts',id);loadPosts();}

/* ===== SETTINGS — SITE ===== */
async function loadSettings() {
  const data=await sbGet('site_settings','?id=eq.1&select=*');
  if(!data?.[0]) return;
  const s=data[0];
  setColor('primary',s.color_primary||'#FFCB00');
  setColor('secondary',s.color_secondary||'#136289');
  setColor('dark',s.color_dark||'#001F64');
  if(s.logo_height) document.getElementById('logo-height').value=s.logo_height;
  if(s.logo_url){const p=document.getElementById('logo-preview');if(p){p.src=s.logo_url;p.style.display='block';}}
  // Aplica configurações do CMS
  applyCmsAppearance(s);
  // Carrega campos de aparência do CMS
  if(s.cms_logo_url){const cl=document.getElementById('cms-logo-preview');if(cl){cl.src=s.cms_logo_url;cl.style.display='block';}}
  if(s.cms_logo_height) document.getElementById('cms-logo-height').value=s.cms_logo_height;
  if(s.cms_sidebar_color){document.getElementById('cms-sidebar-color').value=s.cms_sidebar_color;document.getElementById('cms-sidebar-color-hex').value=s.cms_sidebar_color;}
  if(s.cms_accent_color){document.getElementById('cms-accent-color').value=s.cms_accent_color;document.getElementById('cms-accent-color-hex').value=s.cms_accent_color;}
  if(s.cms_font) document.getElementById('cms-font-select').value=s.cms_font;
}

function applyCmsAppearance(s) {
  const root=document.documentElement;
  if(s.cms_sidebar_color) root.style.setProperty('--primary',s.cms_sidebar_color);
  if(s.cms_accent_color)  root.style.setProperty('--accent', s.cms_accent_color);
  if(s.cms_font) { document.body.style.fontFamily=`'${s.cms_font}', sans-serif`; }
  if(s.cms_logo_url) {
    document.querySelectorAll('#cms-logo-img').forEach(img=>{img.src=s.cms_logo_url;if(s.cms_logo_height)img.style.height=s.cms_logo_height+'px';});
  }
  if(s.logo_url) {
    document.querySelectorAll('#login-logo-img').forEach(img=>{img.src=s.logo_url;});
  }
}

function setColor(name,hex){document.getElementById(`color-${name}`).value=hex;document.getElementById(`color-${name}-hex`).value=hex;}

async function saveSettings() {
  const logoFile=document.querySelector('#logo-upload input[type="file"]').files[0];
  const simFile=document.querySelector('#sim-upload input[type="file"]')?.files[0];
  const testFile=document.querySelector('#testimonial-upload input[type="file"]')?.files[0];
  let logoUrl=null,simUrl=null,testUrl=null;
  if(logoFile) logoUrl=await sbUpload(logoFile,'logos');
  if(simFile)  simUrl =await sbUpload(simFile,'site');
  if(testFile) testUrl=await sbUpload(testFile,'site');
  const body={
    color_primary:document.getElementById('color-primary-hex').value,
    color_secondary:document.getElementById('color-secondary-hex').value,
    color_dark:document.getElementById('color-dark-hex').value,
    logo_height:parseInt(document.getElementById('logo-height').value)||44,
  };
  if(logoUrl) body.logo_url=logoUrl;
  if(simUrl)  body.simulator_image_url=simUrl;
  if(testUrl) body.testimonial_image_url=testUrl;
  const res=await sbPatch('site_settings',1,body);
  if(res) toast('Configurações salvas!','success');
  else toast('Erro ao salvar','error');
}

/* ===== SETTINGS — APARÊNCIA DO CMS ===== */
async function saveCmsAppearance() {
  const cmsLogoFile=document.querySelector('#cms-logo-upload input[type="file"]')?.files[0];
  let cmsLogoUrl=null;
  if(cmsLogoFile) cmsLogoUrl=await sbUpload(cmsLogoFile,'logos');
  const body={
    cms_sidebar_color:document.getElementById('cms-sidebar-color-hex').value,
    cms_accent_color:document.getElementById('cms-accent-color-hex').value,
    cms_logo_height:parseInt(document.getElementById('cms-logo-height').value)||38,
    cms_font:document.getElementById('cms-font-select').value,
  };
  if(cmsLogoUrl) body.cms_logo_url=cmsLogoUrl;
  const res=await sbPatch('site_settings',1,body);
  if(res){applyCmsAppearance({...body,cms_logo_url:cmsLogoUrl||(await sbGet('site_settings','?id=eq.1&select=cms_logo_url'))?.[0]?.cms_logo_url});toast('Aparência do painel salva!','success');}
  else toast('Erro ao salvar','error');
}

function initColorPickers() {
  ['primary','secondary','dark','cms-sidebar','cms-accent','b-title','b-subtitle'].forEach(name=>{
    const picker=document.getElementById(`color-${name}`)|| document.getElementById(`${name}-color`);
    const hexIn =document.getElementById(`color-${name}-hex`)|| document.getElementById(`${name}-color-hex`);
    if(!picker||!hexIn) return;
    picker.addEventListener('input',()=>{hexIn.value=picker.value;if(name.startsWith('b-'))updateBannerPreview();});
    hexIn.addEventListener('input',()=>{if(/^#[0-9A-Fa-f]{6}$/.test(hexIn.value)){picker.value=hexIn.value;if(name.startsWith('b-'))updateBannerPreview();}});
  });
}

/* ===== TEXTS ===== */
async function loadTexts(){const data=await sbGet('site_settings','?id=eq.1&select=*');if(!data?.[0])return;const s=data[0];document.getElementById('txt-phone').value=s.phone||'';document.getElementById('txt-email').value=s.email||'';document.getElementById('txt-address').value=s.address||'';document.getElementById('txt-cnpj').value=s.cnpj||'';document.getElementById('txt-footer-desc').value=s.footer_desc||'';}
async function saveTexts(){const body={phone:document.getElementById('txt-phone').value,email:document.getElementById('txt-email').value,address:document.getElementById('txt-address').value,cnpj:document.getElementById('txt-cnpj').value,footer_desc:document.getElementById('txt-footer-desc').value};const res=await sbPatch('site_settings',1,body);if(res)toast('Textos salvos!','success');else toast('Erro ao salvar','error');}

/* ===== CONTACTS ===== */
async function loadContacts(){const data=await sbGet('contacts','?order=created_at.desc&select=*');if(data)renderContactsTable(data);}
function renderContactsTable(list){const tbody=document.getElementById('contacts-body');if(!list?.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8">Nenhum contato recebido</td></tr>';return;}tbody.innerHTML=list.map(c=>`<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.email)}</td><td>${esc(c.phone||'—')}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.message||'—')}</td><td>${fmtDate(c.created_at)}</td><td><span class="badge ${c.read?'badge-success':'badge-blue'}">${c.read?'Lido':'Novo'}</span></td><td><button class="btn-icon" onclick="viewContact(${JSON.stringify(c).replace(/"/g,'&quot;')})"><i class="fas fa-eye"></i></button></td></tr>`).join('');}
function viewContact(c){_currentContact=c;document.getElementById('contact-detail-body').innerHTML=`<div class="contact-detail"><p><strong>Nome:</strong> ${esc(c.name)}</p><p><strong>E-mail:</strong> ${esc(c.email)}</p><p><strong>Telefone:</strong> ${esc(c.phone||'—')}</p><p><strong>Data:</strong> ${fmtDate(c.created_at)}</p><p><strong>Status:</strong> <span class="badge ${c.read?'badge-success':'badge-blue'}">${c.read?'Lido':'Novo'}</span></p><hr style="margin:16px 0;border:none;border-top:1px solid #e2e8f0"><p><strong>Mensagem:</strong></p><p style="background:#f8fafc;border-radius:8px;padding:14px;margin-top:8px;line-height:1.6">${esc(c.message||'—')}</p></div>`;openModal('modal-contact-detail');}
async function markContactRead(){if(!_currentContact)return;await sbPatch('contacts',_currentContact.id,{read:true});closeModal('modal-contact-detail');loadContacts();toast('Marcado como lido','success');}

/* ===== USERS ===== */
let _users=[];
async function loadUsers(){const data=await sbGet('cms_users','?select=id,name,email,role,is_active,created_at&order=created_at.asc');if(data){_users=data;renderUsers();}}
function renderUsers(){document.getElementById('users-body').innerHTML=_users.map(u=>`<tr><td><strong>${esc(u.name||u.email?.split('@')[0])}</strong></td><td>${esc(u.email)}</td><td><span class="badge ${u.role==='admin'?'badge-danger':u.role==='editor'?'badge-blue':'badge-warning'}">${u.role||'editor'}</span></td><td><span class="badge badge-success">Ativo</span></td><td style="display:flex;gap:6px"><button class="btn-icon" onclick="editUser('${u.id}')"><i class="fas fa-edit"></i></button><button class="btn-icon danger" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');}
function openUserModal(id=null){const u=id?_users.find(x=>x.id===id):null;document.getElementById('user-modal-title').textContent=u?'Editar Usuário':'Novo Usuário';document.getElementById('u-id').value=u?.id||'';document.getElementById('u-name').value=u?.name||'';document.getElementById('u-email').value=u?.email||'';document.getElementById('u-pass').value='';document.getElementById('u-role').value=u?.role||'editor';openModal('modal-user');}
function editUser(id){openUserModal(id);}
async function saveUser(){const id=document.getElementById('u-id').value;const body={name:document.getElementById('u-name').value,email:document.getElementById('u-email').value,role:document.getElementById('u-role').value};const pass=document.getElementById('u-pass').value;if(pass){if(pass.length<8){toast('Senha mínima: 8 caracteres','error');return;}body.password=pass;}const res=id?await sbPatch('cms_users',id,body):await sbPost('cms_users',body);if(res){closeModal('modal-user');loadUsers();toast('Usuário salvo!','success');}else toast('Erro ao salvar usuário','error');}
async function deleteUser(id){if(!confirm('Excluir este usuário?'))return;await sbPatch('cms_users',id,{is_active:false});loadUsers();}

/* ===== UTILITÁRIOS ===== */
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function previewImage(input,previewId){const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{const img=document.getElementById(previewId);if(img){img.src=e.target.result;img.style.display='block';}};reader.readAsDataURL(file);}
function toast(msg,type='default'){let el=document.getElementById('cms-toast');if(!el){el=document.createElement('div');el.id='cms-toast';el.style.cssText='position:fixed;bottom:24px;right:24px;background:#001F64;color:white;padding:13px 20px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;transition:all 0.3s;transform:translateY(80px);opacity:0;border-left:4px solid #FFCB00;box-shadow:0 8px 30px rgba(0,0,0,0.2);max-width:320px';document.body.appendChild(el);}el.textContent=msg;el.style.borderLeftColor=type==='success'?'#22c55e':type==='error'?'#ef4444':'#FFCB00';el.style.transform='translateY(0)';el.style.opacity='1';setTimeout(()=>{el.style.transform='translateY(80px)';el.style.opacity='0';},3000);}
function fmtDate(str){if(!str)return'—';return new Date(str).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});}
function esc(str){if(!str)return'';return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function slugify(str){return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
