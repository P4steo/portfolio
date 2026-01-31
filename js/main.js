// UI interactions & intro
document.addEventListener('DOMContentLoaded', () => {
  // hide intro after animation
  setTimeout(() => {
    const intro = document.getElementById('intro');
    if (intro) intro.style.display = 'none';
  }, 1400);

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

  // Load projects
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

// THREE.JS viewport with improved lighting and mouse-follow cube
(() => {
  const canvas = document.getElementById('cubeCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070708);

  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
  camera.position.set(2.6, 1.8, 3.2);
  camera.lookAt(0, 0, 0);

  // Grid + subtle ground
  const grid = new THREE.GridHelper(14, 28, 0x2b2b2b, 0x151515);
  grid.position.y = -0.62;
  scene.add(grid);

  // Axes (subtle)
  const axes = new THREE.AxesHelper(1.6);
  axes.material.depthTest = false;
  axes.renderOrder = 2;
  axes.visible = false; // hide by default for clean look
  scene.add(axes);

  // Cube (high-quality material)
  const geometry = new THREE.BoxGeometry(1,1,1);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xff8a00,
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.12,
    clearcoatRoughness: 0.05,
    reflectivity: 0.6
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);

  // Ground contact shadow (soft)
  const groundGeo = new THREE.PlaneGeometry(20,20);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.28 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -0.62;
  ground.receiveShadow = true;
  scene.add(ground);

  // Lighting: key + fill + rim + ambient for cinematic look
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(4, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.radius = 6;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(-3, 2, -3);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(-6, 3, 5);
  scene.add(rim);

  const hemi = new THREE.HemisphereLight(0xaaaaaa, 0x080820, 0.25);
  scene.add(hemi);

  // subtle environment reflection using a tiny generated cube map (procedural)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  // create a soft neutral env by using a small color cube texture
  const envColor = new THREE.Color(0x222222);
  scene.environment = null; // keep null but material reflectivity + lights give depth

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

  // Mouse-follow rotation
  let targetRot = { x: 0, y: 0 };
  let currentRot = { x: 0, y: 0 };
  const lerp = (a,b,t) => a + (b-a) * t;

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const nx = (x - 0.5) * 2;
    const ny = (y - 0.5) * 2;
    targetRot.y = nx * 1.05;
    targetRot.x = -ny * 0.75;
    idleTimer = 0;
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

    currentRot.x = lerp(currentRot.x, targetRot.x, 0.09);
    currentRot.y = lerp(currentRot.y, targetRot.y, 0.09);

    cube.rotation.x = currentRot.x + Math.sin(now * 0.0006) * 0.01;
    cube.rotation.y = currentRot.y + Math.cos(now * 0.0008) * 0.01;
    cube.position.y = Math.sin(now * 0.0012) * 0.02;

    // playhead feedback
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

  // keyboard accessibility
  const canvasEl = document.getElementById('cubeCanvas');
  canvasEl.addEventListener('keydown', (e) => {
    const step = 0.08;
    if (e.key === 'ArrowLeft') targetRot.y -= step;
    if (e.key === 'ArrowRight') targetRot.y += step;
    if (e.key === 'ArrowUp') targetRot.x -= step;
    if (e.key === 'ArrowDown') targetRot.x += step;
  });
})();
