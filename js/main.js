// UI: tabs, modal, gallery load
document.addEventListener('DOMContentLoaded', () => {
  // hide intro
  setTimeout(()=>{ const i=document.getElementById('intro'); if(i) i.style.display='none'; }, 1200);

  // tabs
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.section;
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    });
  });

  // theme toggle (keeps simple)
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('light');
  });

  // modal
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const modalDesc = document.getElementById('modalDesc');
  document.getElementById('modalClose').addEventListener('click', ()=>{ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); });

  // load projects
  fetch('data/projects.json').then(r=>r.json()).then(data=>{
    const items = data.blender || [];
    const gallery = document.getElementById('gallery');
    const grid = document.getElementById('assetGrid');
    gallery.innerHTML=''; grid.innerHTML='';
    items.forEach(it=>{
      const g = document.createElement('div'); g.className='gallery-item';
      g.innerHTML = `<img src="${it.image}" alt="${escapeHtml(it.title)}"><h3>${escapeHtml(it.title)}</h3><p>${escapeHtml(it.description)}</p>`;
      g.addEventListener('click', ()=>openModal(it));
      gallery.appendChild(g);

      const a = document.createElement('div'); a.className='asset-item';
      a.innerHTML = `<img class="asset-thumb" src="${it.image}" alt="${escapeHtml(it.title)}"><div class="asset-title">${escapeHtml(it.title)}</div><div class="asset-tag">Blender</div>`;
      a.addEventListener('click', ()=>openModal(it));
      grid.appendChild(a);
    });

    // search
    const search = document.getElementById('search');
    if(search){
      search.addEventListener('input', ()=> {
        const q = search.value.trim().toLowerCase();
        grid.querySelectorAll('.asset-item').forEach(node=>{
          const t = node.querySelector('.asset-title').textContent.toLowerCase();
          node.style.display = t.includes(q) ? '' : 'none';
        });
      });
    }
  }).catch(e=>console.error('projects.json error',e));

  function openModal(it){
    modalImg.src = it.image;
    modalImg.alt = it.title;
    modalDesc.innerHTML = `<strong>${escapeHtml(it.title)}</strong><p>${escapeHtml(it.description)}</p>`;
    modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
});

// Three.js viewport with premium lighting and mouse-follow cube
(() => {
  const canvas = document.getElementById('viewportCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070708);

  const camera = new THREE.PerspectiveCamera(50,2,0.1,100);
  camera.position.set(2.6,1.8,3.2);
  camera.lookAt(0,0,0);

  // grid
  const grid = new THREE.GridHelper(14,28,0x2b2b2b,0x151515);
  grid.position.y = -0.62;
  scene.add(grid);

  // cube
  const geo = new THREE.BoxGeometry(1,1,1);
  const mat = new THREE.MeshPhysicalMaterial({ color:0xff8a00, roughness:0.28, metalness:0.05, clearcoat:0.12, clearcoatRoughness:0.05 });
  const cube = new THREE.Mesh(geo, mat);
  cube.castShadow = true; cube.receiveShadow = true;
  scene.add(cube);

  // ground shadow
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.ShadowMaterial({opacity:0.28}));
  ground.rotation.x = -Math.PI/2; ground.position.y = -0.62; ground.receiveShadow = true; scene.add(ground);

  // lights
  const key = new THREE.DirectionalLight(0xffffff,1.2); key.position.set(4,6,4); key.castShadow=true;
  key.shadow.mapSize.set(2048,2048); key.shadow.camera.near=0.5; key.shadow.camera.far=30; scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff,0.45); fill.position.set(-3,2,-3); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff,0.35); rim.position.set(-6,3,5); scene.add(rim);
  const hemi = new THREE.HemisphereLight(0xaaaaaa,0x080820,0.25); scene.add(hemi);

  // resize
  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if(canvas.width !== w || canvas.height !== h){
      renderer.setSize(w,h,false);
      camera.aspect = w/h; camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);

  // mouse follow
  let target = {x:0,y:0}, current = {x:0,y:0};
  const lerp = (a,b,t)=> a + (b-a)*t;
  function onMove(e){
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width;
    const y = (e.clientY - r.top)/r.height;
    const nx = (x - 0.5)*2, ny = (y - 0.5)*2;
    target.y = nx * 1.05; target.x = -ny * 0.75;
  }
  window.addEventListener('pointermove', onMove);

  // animate
  let last = performance.now();
  function anim(now){
    const dt = (now - last)/1000; last = now;
    resize();
    current.x = lerp(current.x, target.x, 0.09);
    current.y = lerp(current.y, target.y, 0.09);
    cube.rotation.x = current.x + Math.sin(now*0.0006)*0.01;
    cube.rotation.y = current.y + Math.cos(now*0.0008)*0.01;
    cube.position.y = Math.sin(now*0.0012)*0.02;

    // playhead feedback
    const ph = document.getElementById('playhead');
    if(ph){ const pct = (current.y + 1.2)/2.4; ph.style.transform = `translateX(${Math.max(0,Math.min(100,pct*100))}%)`; }

    renderer.render(scene,camera);
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);

  // keyboard focus
  const c = document.getElementById('viewportCanvas');
  c.addEventListener('keydown', e=>{
    const step = 0.08;
    if(e.key==='ArrowLeft') target.y -= step;
    if(e.key==='ArrowRight') target.y += step;
    if(e.key==='ArrowUp') target.x -= step;
    if(e.key==='ArrowDown') target.x += step;
  });
})();
