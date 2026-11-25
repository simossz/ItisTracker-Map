import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const stage = document.getElementById('stage');
const loading = document.getElementById('loading');
const detail = document.getElementById('detail');
const roomList = document.getElementById('room-list');
const themeToggle = document.getElementById('theme-toggle');

let scene, camera, renderer, controls;
let rooms = [];
let selected = null;
let dark = false;

const COLORS = {
  light: { bg: 0xEDE8DE, floor: 0xE4DED2, platform: 0xF6F3ED, desk: 0xB08A63, chair: 0x7C6A57 },
  dark: { bg: 0x17171C, floor: 0x1E1E26, platform: 0x2A2A33, desk: 0x8A6B4E, chair: 0x5A4E42 },
};

const deskGeo = new THREE.BoxGeometry(0.42, 0.06, 0.30);
const chairGeo = new THREE.BoxGeometry(0.30, 0.06, 0.26);
const platformGeo = new THREE.BoxGeometry(5, 0.22, 4);
const boardGeo = new THREE.BoxGeometry(2.4, 0.9, 0.08);
const highlightGeo = new THREE.BoxGeometry(5.3, 0.06, 4.3);

function pseudo(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function makeLabel(text, sub) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = dark ? '#F1EDE4' : '#161626';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, 88);
  ctx.fillStyle = dark ? '#E08B63' : '#B5552F';
  ctx.font = '32px Verdana, sans-serif';
  ctx.fillText(sub, canvas.width / 2, 134);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(3.0, 0.95, 1);
  return sprite;
}

function buildRoom(room, index) {
  const group = new THREE.Group();
  const col = index % 3;
  const row = Math.floor(index / 3);
  group.position.set((col - 1) * 6, 0, (row - 0.5) * 6);
  group.rotation.y = (pseudo(index) - 0.5) * 0.02;

  const palette = dark ? COLORS.dark : COLORS.light;

  const platformMat = new THREE.MeshStandardMaterial({ color: palette.platform, roughness: 0.9 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = 0;
  platform.receiveShadow = true;
  platform.userData.roomIndex = index;
  group.add(platform);

  const highlight = new THREE.Mesh(
    highlightGeo,
    new THREE.MeshBasicMaterial({ color: 0xB5552F, transparent: true, opacity: 0.55 })
  );
  highlight.position.y = -0.08;
  highlight.visible = false;
  group.add(highlight);

  const board = new THREE.Mesh(boardGeo, new THREE.MeshStandardMaterial({ color: 0x2E4738, roughness: 1 }));
  board.position.set(0, 0.58, -1.86);
  group.add(board);

  const count = room.students;
  const cols = Math.ceil(Math.sqrt(count * 1.5));
  const rows = Math.ceil(count / cols);
  const deskMat = new THREE.MeshStandardMaterial({ color: palette.desk, roughness: 0.8 });
  const chairMat = new THREE.MeshStandardMaterial({ color: palette.chair, roughness: 0.9 });

  for (let d = 0; d < count; d++) {
    const c = d % cols;
    const r = Math.floor(d / cols);
    const x = (c - (cols - 1) / 2) * 0.66;
    const z = (r - (rows - 1) / 2) * 0.72 + 0.15;
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(x, 0.18 + pseudo(d + index * 31) * 0.01, z);
    desk.rotation.y = (pseudo(d * 3 + index) - 0.5) * 0.06;
    desk.castShadow = true;
    group.add(desk);

    const chair = new THREE.Mesh(chairGeo, chairMat);
    chair.position.set(x, 0.14, z + 0.32);
    group.add(chair);
  }

  const label = makeLabel(room.class, `${room.code} · ${count} banchi`);
  label.position.set(0, 2.1, 0);
  group.add(label);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(5.02, 0.05, 0.10),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(room.accent) })
  );
  stripe.position.set(0, 0.13, 1.96);
  group.add(stripe);

  scene.add(group);
  rooms.push({ data: room, group, platform, highlight, label });
}

function renderDetail(index) {
  const room = rooms[index];
  if (!room) return;
  detail.innerHTML = `
    <p class="detail-class">Classe selezionata</p>
    <p class="detail-code">${room.data.class}</p>
    <div class="detail-stats">
      <div><b>${room.data.students}</b><span>banchi</span></div>
      <div><b>${room.data.code}</b><span>aula</span></div>
    </div>
    <p class="detail-sample">${room.data.floor} · <strong>${room.data.sample}</strong></p>
  `;
  roomList.querySelectorAll('button').forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === index));
  });
}

function select(index) {
  selected = index;
  rooms.forEach((r, i) => { r.highlight.visible = i === index; });
  renderDetail(index);
}

function applyTheme(nextDark) {
  dark = nextDark;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeToggle.textContent = dark ? 'Tema chiaro' : 'Tema scuro';
  themeToggle.setAttribute('aria-pressed', String(dark));
  const palette = dark ? COLORS.dark : COLORS.light;
  scene.background = new THREE.Color(palette.bg);
  scene.traverse((obj) => {
    if (obj.isMesh && obj.userData.isFloor) obj.material.color.setHex(palette.floor);
  });
  rooms.forEach((r, i) => {
    r.platform.material.color.setHex(palette.platform);
    const newLabel = makeLabel(r.data.class, `${r.data.code} · ${r.data.students} banchi`);
    newLabel.position.copy(r.label.position);
    r.group.remove(r.label);
    r.label.material.map.dispose();
    r.label.material.dispose();
    r.group.add(newLabel);
    r.label = newLabel;
  });
}

function init(data) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.light.bg);

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(11, 14, 15);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  loading.remove();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minDistance = 8;
  controls.maxDistance = 30;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.35));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(9, 16, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 30),
    new THREE.MeshStandardMaterial({ color: COLORS.light.floor, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.2;
  floor.receiveShadow = true;
  floor.userData.isFloor = true;
  scene.add(floor);

  data.rooms.forEach(buildRoom);

  data.rooms.forEach((room, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-button';
    button.textContent = `${room.class} · ${room.code}`;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => select(i));
    roomList.appendChild(button);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(rooms.map((r) => r.platform));
    if (hits.length) select(hits[0].object.userData.roomIndex);
  });

  themeToggle.addEventListener('click', () => applyTheme(!dark));

  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (!reduceMotion && selected !== null) {
      rooms[selected].label.position.y = 2.1 + Math.sin(Date.now() / 600) * 0.04;
    }
    renderer.render(scene, camera);
  }
  animate();
}

fetch('data/rooms.json')
  .then((response) => response.json())
  .then(init)
  .catch((error) => {
    loading.textContent = 'Dati non disponibili.';
    console.error(error);
  });
