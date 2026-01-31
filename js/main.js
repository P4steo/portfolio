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

// THREE.JS CUBE
const canvas = document.getElementById("cubeCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
camera.position.z = 3;

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0xE87D0D });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// AUTO ROTATION
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.003;
    cube.rotation.y += 0.004;
    renderer.render(scene, camera);
}
animate();

// SCROLL ROTATION
window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    cube.rotation.y += scrollY * 0.0002;
    cube.rotation.x += scrollY * 0.0001;
});
