const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Background with stars
const bgGeometry = new THREE.PlaneGeometry(500, 500);
const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x00001d });
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
bgMesh.position.set(0, 0, -21);
bgMesh.receiveShadow = true;
scene.add(bgMesh);

for (let i = 0; i < 20; i++) {
  let starGeometry = new THREE.CircleGeometry(0.15, 5);
  let starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  let starSphere = new THREE.Mesh(starGeometry, starMaterial);
  starSphere.position.set(
    Math.random() * 100 - 50,
    Math.random() * 80 - 40,
    -20
  );

  scene.add(starSphere);
}

// Globe
const texture = new THREE.TextureLoader().load(
  "https://raw.githubusercontent.com/PedroOndh/personal-projects-assets/main/globe/earth-texture.jpg"
);
const alphaTexture = new THREE.TextureLoader().load(
  "https://raw.githubusercontent.com/PedroOndh/personal-projects-assets/main/globe/earth-alpha-map.jpg"
);

const geometry = new THREE.SphereGeometry(15, 32, 16);

const material = new THREE.MeshPhysicalMaterial({
  color: 0x80c0a1,
  map: texture,
  roughness: 0.4,
  transmission: 0.5,
  thickness: 1,
  reflectivity: 0.7,
  iridescence: 0.7,
  transparent: true,
  side: THREE.DoubleSide,
  alphaMap: alphaTexture
});

const globe = new THREE.Mesh(geometry, material);
globe.name = "globe";
globe.castShadow = true;
globe.receiveShadow = true;
scene.add(globe);

// Clouds sphere
const cloudsTexture = new THREE.TextureLoader().load(
  "https://raw.githubusercontent.com/PedroOndh/personal-projects-assets/main/globe/clouds-texture.jpg"
);

const cloudsGeometry = new THREE.SphereGeometry(15.1, 32, 16);

const cloudsMaterial = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  opacity: 0.8,
  transparent: true,
  side: THREE.DoubleSide,
  alphaMap: cloudsTexture
});

const cloudsGlobe = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
cloudsGlobe.castShadow = true;
cloudsGlobe.receiveShadow = true;
scene.add(cloudsGlobe);

// Final conditions for scene
const light = new THREE.PointLight(0xffffff, 100000);
light.position.set(100, 100, 100);
scene.add(light);

camera.position.z = 30;

// Function to convert latitude and longitude to 3D vector
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}

// Add location icons
const locations = [
  { name: "Japan", lat: 35.6895, lon: 139.6917, projects: ["Project A", "Project B"] },
  { name: "USA", lat: 38.9072, lon: -77.0369, projects: ["Project C", "Project D"] },
  { name: "Dubai", lat: 25.276987, lon: 55.296249, projects: ["Project E", "Project F"] },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, projects: ["Project G", "Project H"] },
  { name: "United Kingdom", lat: 51.5074, lon: -0.1278, projects: ["Project I", "Project J"] }
];

const radius = 15; // Radius of the globe
const offset = 0.9; // Offset to place the icon closer to the surface

const iconTexture = new THREE.TextureLoader().load(
  "https://img.icons8.com/?size=100&id=7880&format=png&color=228BE6"
);

const sprites = [];

locations.forEach(location => {
  const position = latLonToVector3(location.lat, location.lon, radius);
  const adjustedPosition = position.clone().normalize().multiplyScalar(radius + offset);

  const iconMaterial = new THREE.SpriteMaterial({ map: iconTexture });
  const icon = new THREE.Sprite(iconMaterial);
  icon.scale.set(3, 3, 1); // Adjust the scale as needed
  icon.position.copy(adjustedPosition);

  // Rotate icon to point towards the center of the country
  icon.lookAt(position);
  icon.rotation.x += Math.PI / 2; // Adjust rotation to ensure tip points correctly

  icon.name = location.name;
  icon.userData = { projects: location.projects }; // Store projects in userData
  sprites.push(icon);

  globe.add(icon);
});

// Raycasting setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Mouse interaction variables
let isMouseDown = false;
let startX = 0;

function onMouseDown(event) {
  isMouseDown = true;
  startX = event.clientX;
}

function onMouseMove(event) {
  if (isMouseDown) {
    const deltaX = event.clientX - startX;
    globe.rotation.y += deltaX * 0.01;
    cloudsGlobe.rotation.y += deltaX * 0.01;
    startX = event.clientX;
  } else {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(sprites);

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      showTooltip(event, intersected.name, intersected.userData.projects);
    } else {
      hideTooltip();
    }
  }
}

function onMouseUp() {
  isMouseDown = false;
}

function onMouseOut() {
  isMouseDown = false;
}

document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('mouseup', onMouseUp, false);
document.addEventListener('mouseout', onMouseOut, false);

// Tooltip functions
function showTooltip(event, name, projects) {
  const tooltip = document.getElementById('tooltip');
  tooltip.style.display = 'block';
  tooltip.innerHTML = `<strong>${name}</strong><br>${projects.join('<br>')}`;
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY - 30}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById('tooltip');
  tooltip.style.display = 'none';
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  globe.rotation.y += 0.003; // Increased speed
  cloudsGlobe.rotation.y += 0.003; // Increased speed

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
  camera.aspect = window.innerWidth / window.innerHeight;
});

// Waiting a little before animating for thumbnail purposes
setTimeout(() => {
  animate();
}, 100);

// Counter animation logic
function animateValue(id, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    document.getElementById(id).innerText = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function startCounters() {
  animateValue("turnover-counter", 0, 500, 3000);
  animateValue("companies-counter", 0, 30, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const counterContainer = document.createElement('div');
  counterContainer.style.position = 'absolute';
  counterContainer.style.top = '50px';
  counterContainer.style.right = '50px';
  counterContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  counterContainer.style.color = 'white';
  counterContainer.style.padding = '20px';
  counterContainer.style.borderRadius = '10px';
  counterContainer.innerHTML = `
    <div>Turnover: $<span id="turnover-counter">0</span>M</div>
    <div>Companies: <span id="companies-counter">0</span></div>
  `;
  document.body.appendChild(counterContainer);

  startCounters();
});
