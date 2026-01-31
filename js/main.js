// TAB SWITCHING
const buttons = document.querySelectorAll('.tabs button');
const sections = document.querySelectorAll('.section');

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        sections.forEach(sec => sec.style.display = 'none');
        document.getElementById(btn.dataset.section).style.display = 'block';

        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// LOAD PROJECTS
fetch("data/projects.json")
    .then(res => res.json())
    .then(data => {
        loadProjects("blender-projects", data.blender);
        loadProjects("ue5-projects", data.ue5);
    });

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

// THREE.JS VIEWPORT
const canvas = document.getElementById("cubeCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1A1A1A);

const camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
camera.position.z = 3;

// GRID
const grid = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
scene.add(grid);

// CUBE
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0xFF9900 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// LIGHT
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// ANIMATION
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.003;
    cube.rotation.y += 0.004;
    renderer.render(scene, camera);
}
animate();

// SCROLL INTERACTION
window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    cube.rotation.y += scrollY * 0.0002;
    cube.rotation.x += scrollY * 0.0001;
});
