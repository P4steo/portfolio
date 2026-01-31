// UI Interactions and Intro
document.addEventListener('DOMContentLoaded', () => {
  // Intro hide after animation
  setTimeout(() => {
    const intro = document.getElementById('intro');
    if (intro) intro.style.display = 'none';
  }, 1200);

  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const sections = document.querySelectorAll('.section');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const id = t.dataset.section;
    sections.forEach(s => s.classList.remove('section-active'));
    document.getElementById(id).classList.add('section-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  // Tools toggling
  const tools = document.querySelectorAll('.tool');
  tools.forEach(tool => tool.addEventListener('click', () => {
    tools.forEach(t => t.classList.remove('active'));
    tool.classList.add('active');
  }));
  document.getElementById('tool-select').classList.add('active');

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const body = document.body;
    if (body.classList.contains('theme-dark')) {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      themeToggle.setAttribute('aria-pressed', 'true');
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      themeToggle.setAttribute('aria-pressed', 'false');
    }
  });

  // Modal
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const modalMeta = document.getElementById('modalMeta');
  const modalClose = document.getElementById('modalClose');
  modalClose.addEventListener('click', () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); });

  // Load projects and wire gallery interactions
  fetch('data/projects.json')
    .then(r => r.json())
    .then(data => {
      populateGallery('projects-gallery', data.blender || []);
      populateAssetBrowser(data);
    })
    .catch(err => console.error('projects.json load error', err));

  function populateGallery(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(it => {
      const el = document.createElement('div');
      el.className = 'gallery-item';
      el.innerHTML = `<img src="${it.image}" alt="${escapeHtml(it.title)}"><h3>${escapeHtml(it.title)}</h3><p>${escapeHtml(it.description)}</p>`;
      el.addEventListener('click', () => openModal(it));
      container.appendChild(el);
    });
  }

  function populateAssetBrowser(data) {
    const grid = document.getElementById('asset-browser-grid');
    grid.innerHTML = '';
    const all = (data.blender || []).map(p => ({...p, type:'Blender'}));
    all.forEach(item => {
      const el = document.createElement('div');
      el.className = 'asset-item';
      el.innerHTML = `<img class="asset-thumb" src="${item.image}" alt="${escapeHtml(item.title)}"><div class="asset-title">${escapeHtml(item.title)}</div><div class="asset-tag">${item.type}</div>`;
      el.addEventListener('click', () => openModal(item));
      grid.appendChild(el);
    });

    // search
    const search = document.getElementById('searchAssets');
    if (search) {
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        grid.querySelectorAll('.asset-item').forEach(node => {
          const title = node.querySelector('.asset-title').textContent.toLowerCase();
          node.style.display = title.includes(q) ? '' : 'none';
        });
      });
    }
  }

  function openModal(item) {
    modalImg.src = item.image;
    modalImg.alt = item.title;
    modalMeta.innerHTML = `<strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p>`;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
});

// THREE.JS VIEWPORT with mouse-follow cube
(() => {
  const canvas = document.getElementById('cubeCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0f0f);

  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
  camera.position.set(2.6, 1.8, 3.2);
  camera.lookAt(0, 0, 0);

  // Grid and axes
  const grid = new THREE.GridHelper(12, 24, 0x444444, 0x222222);
  grid.position.y = -0.6;
  scene.add(grid);
  const axes = new THREE.AxesHelper(1.6);
  axes.material.depthTest = false;
  axes.renderOrder = 2;
  scene.add(axes);

  // Cube
  const geometry = new THREE.BoxGeometry(1,1,1);
  const material = new THREE.MeshStandardMaterial({ color: 0xFF9900, roughness: 0.35, metalness: 0.05 });
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);

  // Soft ground plane for subtle contact shadow
  const groundGeo = new THREE.PlaneGeometry(20,20);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.25 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -0.61;
  ground.receiveShadow = true;
  scene.add(ground);

  // Lights
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(4,6,4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 0.25);
  rim.position.set(-3,2,-4);
  scene.add(rim);

  const ambient = new THREE.AmbientLight(0x404040, 0.8);
  scene.add(ambient);

  // Resize handling
  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);

  // Mouse-follow rotation logic
  let targetRot = { x: 0, y: 0 };
  let currentRot = { x: 0, y: 0 };
  const lerp = (a,b,t) => a + (b-a) * t;

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const nx = (x - 0.5) * 2;
    const ny = (y - 0.5) * 2;
    targetRot.y = nx * 1.0;
    targetRot.x = -ny * 0.7;
  }
  window.addEventListener('pointermove', onPointerMove);

  // Idle drift
  let idleTimer = 0;
  function updateIdle(dt) {
    idleTimer += dt;
    if (idleTimer > 2.0) {
      targetRot.y += 0.0006 * dt * 60;
    }
  }
  window.addEventListener('scroll', () => { idleTimer = 0; });

  // Animation loop
  let last = performance.now();
  function animate(now) {
    const dt = (now - last) / 1000;
    last = now;
    resize();

    currentRot.x = lerp(currentRot.x, targetRot.x, 0.08);
    currentRot.y = lerp(currentRot.y, targetRot.y, 0.08);

    cube.rotation.x = currentRot.x + Math.sin(now * 0.0006) * 0.01;
    cube.rotation.y = currentRot.y + Math.cos(now * 0.0008) * 0.01;
    cube.position.y = Math.sin(now * 0.0012) * 0.02;

    const playhead = document.getElementById('playhead');
    if (playhead) {
      const pct = (currentRot.y + 1.2) / 2.4;
      playhead.style.transform = `translateX(${Math.max(0, Math.min(100, pct*100))}%)`;
    }

    updateIdle(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // Keyboard control for accessibility
  const canvasEl = document.getElementById('cubeCanvas');
  canvasEl.addEventListener('keydown', (e) => {
    const step = 0.08;
    if (e.key === 'ArrowLeft') targetRot.y -= step;
    if (e.key === 'ArrowRight') targetRot.y += step;
    if (e.key === 'ArrowUp') targetRot.x -= step;
    if (e.key === 'ArrowDown') targetRot.x += step;
  });
})();
