// main.js — poprawiona, stabilna wersja
(function () {
  'use strict';

  // Helper: escape HTML
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // DOM ready (defer scripts used)
  window.addEventListener('load', () => {
    // Intro hide
    setTimeout(() => {
      const intro = document.getElementById('intro');
      if (intro) intro.style.display = 'none';
    }, 1200);

    // Tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.dataset.section;
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Theme toggle with localStorage
    (function themeInit() {
      const THEME_KEY = 'bp_theme_v2';
      const body = document.body;
      const toggle = document.getElementById('themeToggle');
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light') body.classList.add('theme-light');
      if (toggle) toggle.setAttribute('aria-pressed', body.classList.contains('theme-light') ? 'true' : 'false');
      function flashAccent() {
        const el = document.createElement('div');
        el.style.position = 'fixed'; el.style.inset = '0'; el.style.pointerEvents = 'none';
        el.style.background = body.classList.contains('theme-light') ? 'linear-gradient(180deg, rgba(0,110,106,0.06), transparent)' : 'linear-gradient(180deg, rgba(0,179,166,0.06), transparent)';
        el.style.opacity = '0'; el.style.transition = 'opacity 420ms ease';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.style.opacity = '1');
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 420); }, 420);
      }
      if (toggle) {
        toggle.addEventListener('click', () => {
          const isLight = body.classList.toggle('theme-light');
          localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
          toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
          flashAccent();
        });
      }
      window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 't' && document.activeElement.tagName !== 'INPUT') { if (toggle) toggle.click(); } });
    })();

    // Modal
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modalImg');
    const modalDesc = document.getElementById('modalDesc');
    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); });

    // Load projects.json
    fetch('data/projects.json', { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error('projects.json not found or network error');
        return r.json();
      })
      .then(data => {
        const items = Array.isArray(data.blender) ? data.blender : [];
        const gallery = document.getElementById('gallery');
        const grid = document.getElementById('assetGrid');
        if (gallery) gallery.innerHTML = '';
        if (grid) grid.innerHTML = '';

        items.forEach(it => {
          const g = document.createElement('div'); g.className = 'gallery-item';
          g.innerHTML = `<img loading="lazy" src="${escapeHtml(it.image)}" alt="${escapeHtml(it.title)}"><h3>${escapeHtml(it.title)}</h3><p>${escapeHtml(it.description)}</p>`;
          g.addEventListener('click', () => openModal(it));
          if (gallery) gallery.appendChild(g);

          const a = document.createElement('div'); a.className = 'asset-item';
          a.innerHTML = `<img class="asset-thumb" loading="lazy" src="${escapeHtml(it.image)}" alt="${escapeHtml(it.title)}"><div class="asset-title">${escapeHtml(it.title)}</div><div class="asset-tag">Blender</div>`;
          a.addEventListener('click', () => openModal(it));
          if (grid) grid.appendChild(a);
        });

        const search = document.getElementById('search');
        if (search && grid) {
          search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            grid.querySelectorAll('.asset-item').forEach(node => {
              const t = node.querySelector('.asset-title').textContent.toLowerCase();
              node.style.display = t.includes(q) ? '' : 'none';
            });
          });
        }
      })
      .catch(err => {
        console.error('projects.json load error:', err);
        const gallery = document.getElementById('gallery');
        if (gallery) gallery.innerHTML = '<p style="color: #f88">Brak projektów do wyświetlenia — sprawdź data/projects.json</p>';
      });

    function openModal(it) {
      if (!modal || !modalImg || !modalDesc) return;
      modalImg.src = it.image;
      modalImg.alt = it.title;
      modalDesc.innerHTML = `<strong>${escapeHtml(it.title)}</strong><p>${escapeHtml(it.description)}</p>`;
      modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false');
    }
  }); // end load

  // Three.js viewport (separate scope)
  (function threeViewport() {
    const canvas = document.getElementById('viewportCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071826);

    const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
    camera.position.set(2.6, 1.8, 3.2);
    camera.lookAt(0, 0, 0);

    // Grid
    const grid = new THREE.GridHelper(14, 28, 0x2b2b2b, 0x151515);
    grid.position.y = -0.62;
    scene.add(grid);

    // Cube
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xC9A34A, roughness: 0.28, metalness: 0.12, clearcoat: 0.12, clearcoatRoughness: 0.05 });
    const cube = new THREE.Mesh(geo, mat);
    cube.castShadow = true; cube.receiveShadow = true;
    scene.add(cube);

    // Ground shadow
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.28 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; ground.receiveShadow = true; scene.add(ground);

    // Lights
    const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(4, 6, 4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 0.5; key.shadow.camera.far = 30; scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.45); fill.position.set(-3, 2, -3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(-6, 3, 5); scene.add(rim);
    const hemi = new THREE.HemisphereLight(0xaaaaaa, 0x080820, 0.25); scene.add(hemi);

    // Resize
    function resize() {
      const w = canvas.clientWidth | 0;
      const h = canvas.clientHeight | 0;
      if (canvas.width !== w || canvas.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }
    window.addEventListener('resize', resize);

    // Mouse follow
    let target = { x: 0, y: 0 }, current = { x: 0, y: 0 };
    const lerp = (a, b, t) => a + (b - a) * t;
    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const nx = (x - 0.5) * 2, ny = (y - 0.5) * 2;
      target.y = nx * 1.05; target.x = -ny * 0.75;
    }
    window.addEventListener('pointermove', onMove);

    // Animate
    let last = performance.now();
    function anim(now) {
      const dt = (now - last) / 1000; last = now;
      resize();
      current.x = lerp(current.x, target.x, 0.09);
      current.y = lerp(current.y, target.y, 0.09);
      cube.rotation.x = current.x + Math.sin(now * 0.0006) * 0.01;
      cube.rotation.y = current.y + Math.cos(now * 0.0008) * 0.01;
      cube.position.y = Math.sin(now * 0.0012) * 0.02;

      const ph = document.getElementById('playhead');
      if (ph) {
        const pct = (current.y + 1.2) / 2.4;
        ph.style.transform = `translateX(${Math.max(0, Math.min(100, pct * 100))}%)`;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);

    // Keyboard focus
    const c = canvas;
    c.addEventListener('keydown', e => {
      const step = 0.08;
      if (e.key === 'ArrowLeft') target.y -= step;
      if (e.key === 'ArrowRight') target.y += step;
      if (e.key === 'ArrowUp') target.x -= step;
      if (e.key === 'ArrowDown') target.x += step;
    });
  })();

})(); // end main IIFE
