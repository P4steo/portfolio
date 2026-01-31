// TAB SWITCHING + SECTION ANIM
const buttons = document.querySelectorAll('.tabs button');
const sections = document.querySelectorAll('.section');

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.section;

        sections.forEach(sec => {
            sec.classList.remove('section-active');
        });
        document.getElementById(targetId).classList.add('section-active');

        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// THEME TOGGLE
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    const body = document.body;
    if (body.classList.contains('theme-dark')) {
        body.classList.remove('theme-dark');
        body.classList.add('theme-light');
    } else {
        body.classList.remove('theme-light');
        body.classList.add('theme-dark');
    }
});

// LOAD PROJECTS FROM JSON
fetch("data/projects.json")
    .then(res => res.json())
    .then(data => {
        loadProjects("blender-projects", data.blender);
        loadProjects("ue5-projects", data.ue5);
        loadAssetBrowser(data);
    })
    .catch(err => console.error("Błąd ładowania projects.json:", err));

function loadProjects(containerId, projects) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    projects.forEach(p => {
        const item = document.createElement("div");
        item.className = "gallery-item";

        item.innerHTML = `
            <img src="${p.image}" alt="${p.title}">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
        `;

        container.appendChild(item);
    });
}

function loadAssetBrowser(data) {
    const container = document.getElementById("asset-browser-grid");
    container.innerHTML = "";

    const all = [
        ...(data.blender || []).map(p => ({ ...p, type: "Blender" })),
        ...(data.ue5 || []).map(p => ({ ...p, type: "UE5" }))
    ];

    all.forEach(p => {
        const item = document.createElement("div");
        item.className = "asset-item";

        item.innerHTML = `
            <img class="asset-thumb" src="${p.image}" alt="${p.title}">
            <div class="asset-title">${p.title}</div>
            <div class="asset-tag">${p.type}</div>
        `;

        container.appendChild(item);
    });
}

// THREE.JS VIEWPORT
const canvas = document.getElementById("cubeCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);

function resizeRenderer() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1A1A1A);

const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
camera.position.set(2.5, 2.5, 3.5);
camera.lookAt(0, 0, 0);

// GRID + AXES
const grid = new THREE.GridHelper(10, 20, 0x555555, 0x333333);
grid.position.y = -0.5;
scene.add(grid);

const axes = new THREE.AxesHelper(1.5);
scene.add(axes);

// CUBE
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    color: 0xFF9900,
    roughness: 0.35,
    metalness: 0.1
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// LIGHTS
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(-3, 2, -4);
scene.add(fillLight);

const ambient = new THREE.AmbientLight(0x404040);
scene.add(ambient);

// ANIMATION
let autoRot = { x: 0.003, y: 0.004 };

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += autoRot.x;
    cube.rotation.y += autoRot.y;
    resizeRenderer();
    renderer.render(scene, camera);
}
animate();

// SCROLL INTERACTION
window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    cube.rotation.y += scrollY * 0.00015;
    cube.rotation.x += scrollY * 0.00008;
});

// RESIZE HANDLER
window.addEventListener("resize", resizeRenderer);
resizeRenderer();
