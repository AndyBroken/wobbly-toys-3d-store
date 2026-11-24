/*! © 2026 Andrey (github.com/AndyBroken). All rights reserved. Concept / demo project, see LICENSE. */
/* Wobbly Toys — full 3D cartoon toy store (concept demo).
   One fixed Three.js canvas draws every toy; each toy is anchored to a DOM "slot",
   so layout, scroll and clicks stay normal HTML. Static camera, all motion is squash & stretch. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const SHOT = new URLSearchParams(location.search).has('shot');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOVER = matchMedia('(hover: hover)').matches;
if (SHOT) document.documentElement.classList.add('shot');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;

/* =====================================================================
   MATERIALS — glossy plastic, velvet plush, soft rubber
   ===================================================================== */
const MC = {};
const plastic = c => MC['p' + c] || (MC['p' + c] = new THREE.MeshPhysicalMaterial({ color: c, roughness: .3, clearcoat: 1, clearcoatRoughness: .16 }));
const plush = c => MC['f' + c] || (MC['f' + c] = new THREE.MeshPhysicalMaterial({
  color: c, roughness: .82, sheen: 1, sheenRoughness: .4, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), .55) }));
const rubber = c => MC['r' + c] || (MC['r' + c] = new THREE.MeshPhysicalMaterial({ color: c, roughness: .26, clearcoat: .7, clearcoatRoughness: .22 }));
const GLOSS = new THREE.MeshPhysicalMaterial({ color: '#1E1730', roughness: .1, clearcoat: 1, clearcoatRoughness: .05 });
const SPEC = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const SPH = new THREE.SphereGeometry(1, 48, 32);
const SPH_LO = new THREE.SphereGeometry(1, 20, 14);

function mesh(geo, m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) {
  const o = new THREE.Mesh(geo, m); o.position.set(...p); o.scale.set(...s); o.rotation.set(...r); return o;
}
const arcGeo = (rad, tube) => new THREE.TorusGeometry(rad, tube, 12, 24, Math.PI);

function eye(g, x, y, z, s = .1) {
  g.add(mesh(SPH, GLOSS, [x, y, z], [s, s * 1.18, s * .6]));
  g.add(mesh(SPH_LO, SPEC, [x + s * .35, y + s * .45, z + s * .45], [s * .28, s * .28, s * .15]));
}
function eyes(g, type, y, z, dx, s = .1) {
  const lid = (x, up) => g.add(mesh(arcGeo(s, s * .3), GLOSS, [x, y + (up ? -s * .3 : s * .2), z + .02], [1, 1, 1], [0, 0, up ? 0 : Math.PI]));
  if (type === 'dot') { eye(g, -dx, y, z, s); eye(g, dx, y, z, s); }
  if (type === 'happy') { lid(-dx, true); lid(dx, true); }
  if (type === 'sleepy') { lid(-dx, false); lid(dx, false); }
  if (type === 'wink') { eye(g, -dx, y, z, s); lid(dx, true); }
}
const smile = (g, y, z, w = .12) => g.add(mesh(arcGeo(w, w * .24), GLOSS, [0, y, z], [1, 1, 1], [0, 0, Math.PI]));
const cheeks = (g, y, z, dx, c = '#FF9CC0') => [-1, 1].forEach(sx => g.add(mesh(SPH_LO, plush(c), [dx * sx, y, z], [.13, .085, .05])));

/* =====================================================================
   TOYS
   ===================================================================== */
function bear(c = '#C98B5A', eyeT = 'dot', acc = 'none', full = false) {
  const g = new THREE.Group(), head = new THREE.Group(); g.add(head);
  const fur = plush(c), cream = plush('#FFE6CF');
  head.add(mesh(SPH, fur, [0, 0, 0], [1, .93, .9]));
  for (const sx of [-1, 1]) {
    head.add(mesh(SPH, fur, [.7 * sx, .68, -.08], [.36, .36, .26]));
    head.add(mesh(SPH_LO, plush('#FFB3CC'), [.7 * sx, .68, .12], [.21, .21, .12]));
  }
  head.add(mesh(SPH, cream, [0, -.3, .62], [.42, .32, .32]));
  head.add(mesh(SPH, GLOSS, [0, -.16, .92], [.13, .095, .08]));
  smile(head, -.38, .9, .1);
  eyes(head, eyeT, .12, .83, .33, .1);
  cheeks(head, -.16, .74, .57);
  if (acc === 'bow') {
    const b = new THREE.Group(); b.position.set(.6, .95, .12); b.rotation.z = -.4;
    const cone = new THREE.ConeGeometry(.17, .34, 24);
    b.add(mesh(cone, plastic('#FF6FA8'), [-.17, 0, 0], [1, 1, .7], [0, 0, -Math.PI / 2]));
    b.add(mesh(cone, plastic('#FF6FA8'), [.17, 0, 0], [1, 1, .7], [0, 0, Math.PI / 2]));
    b.add(mesh(SPH_LO, plastic('#FF6FA8'), [0, 0, .02], [.1, .1, .1]));
    head.add(b);
  }
  if (acc === 'hat') {
    const h = new THREE.Group(); h.position.set(.06, 1.08, 0); h.rotation.z = -.16;
    h.add(mesh(new THREE.ConeGeometry(.36, .8, 32), plastic('#5ED6C4')));
    h.add(mesh(new THREE.TorusGeometry(.33, .05, 10, 32), plastic('#FFD45C'), [0, -.36, 0], [1, 1, 1], [Math.PI / 2, 0, 0]));
    h.add(mesh(SPH_LO, plush('#FFD45C'), [0, .44, 0], [.14, .14, .14]));
    head.add(h);
  }
  if (acc === 'glasses') {
    const ring = new THREE.TorusGeometry(.18, .035, 12, 32);
    for (const sx of [-1, 1]) head.add(mesh(ring, plastic('#5B8CFF'), [.33 * sx, .12, .88]));
    head.add(mesh(new THREE.CylinderGeometry(.03, .03, .26, 8), plastic('#5B8CFF'), [0, .14, .92], [1, 1, 1], [0, 0, Math.PI / 2]));
  }
  if (full) {
    head.position.y = .58;
    const body = new THREE.Group(); body.position.y = -.95; g.add(body);
    body.add(mesh(SPH, fur, [0, 0, 0], [.8, .84, .72]));
    body.add(mesh(SPH, cream, [0, -.06, .42], [.5, .55, .33]));
    for (const sx of [-1, 1]) {
      body.add(mesh(SPH, fur, [.74 * sx, .12, .16], [.25, .45, .25], [0, 0, .65 * sx]));
      body.add(mesh(SPH, fur, [.43 * sx, -.72, .28], [.31, .26, .37]));
      body.add(mesh(SPH_LO, plush('#FFB3CC'), [.43 * sx, -.74, .62], [.17, .15, .06]));
    }
    if (acc === 'scarf') {
      body.add(mesh(new THREE.TorusGeometry(.5, .14, 16, 40), plush('#FF6B7A'), [0, .63, 0], [1, 1, 1], [Math.PI / 2 - .15, 0, 0]));
      body.add(mesh(new RoundedBoxGeometry(.24, .55, .12, 3, .05), plush('#FF6B7A'), [.28, .3, .56], [1, 1, 1], [.1, 0, .2]));
    }
  } else if (acc === 'scarf') {
    head.add(mesh(new THREE.TorusGeometry(.6, .13, 16, 40), plush('#FF6B7A'), [0, -.8, 0], [1, 1, 1], [Math.PI / 2, 0, 0]));
  }
  return g;
}

function duck() {
  const g = new THREE.Group(), Y = rubber('#FFCF3F');
  g.add(mesh(SPH, Y, [0, -.38, -.05], [1.02, .64, .8]));
  g.add(mesh(SPH, Y, [0, .34, .12], [.56, .56, .54]));
  g.add(mesh(SPH, rubber('#FF8A3D'), [0, .22, .66], [.3, .11, .28]));
  g.add(mesh(new THREE.ConeGeometry(.24, .55, 24), Y, [0, -.06, -.82], [1, 1, 1], [-1.1, 0, 0]));
  for (const sx of [-1, 1]) g.add(mesh(SPH, rubber('#FFB21F'), [.88 * sx, -.32, .05], [.2, .35, .45], [0, 0, -.3 * sx]));
  eyes(g, 'dot', .44, .6, .2, .08);
  cheeks(g, .24, .58, .36);
  return g;
}

function ball() {
  const geo = new THREE.SphereGeometry(1, 64, 40);
  const cols = ['#5B8CFF', '#FFD45C', '#FFFFFF', '#FF6B7A', '#5ED6C4', '#FFFFFF'].map(c => new THREE.Color(c));
  const pos = geo.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getZ(i), pos.getX(i)) + Math.PI;
    const c = Math.abs(pos.getY(i)) > .94 ? cols[2] : cols[Math.floor(a / (Math.PI / 3)) % 6];
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: .25, clearcoat: 1, clearcoatRoughness: .1 });
  const g = new THREE.Group(); g.add(mesh(geo, m, [0, 0, 0], [1, 1, 1], [.5, .2, .35])); return g;
}

const LETTERS = {};
function letterMat(l, color) {
  const k = l + color; if (LETTERS[k]) return LETTERS[k];
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const x = cv.getContext('2d');
  x.font = '700 190px Fredoka, Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(0,0,0,.18)'; x.fillText(l, 132, 146);
  x.fillStyle = color; x.fillText(l, 128, 138);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (LETTERS[k] = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .35 }));
}
function block(l = 'A', c = '#6FD9C8', lc = '#FFFFFF') {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  inner.add(mesh(new RoundedBoxGeometry(1.4, 1.4, 1.4, 6, .3), plastic(c)));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), letterMat(l, lc)); face.position.z = .705; inner.add(face);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), letterMat('ABCDEFGHJK'[(l.charCodeAt(0) + 1) % 10], '#FF7EB0'));
  side.position.x = .705; side.rotation.y = Math.PI / 2; inner.add(side);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), letterMat('★', '#FFD45C'));
  top.position.y = .705; top.rotation.x = -Math.PI / 2; inner.add(top);
  inner.rotation.set(.12, -.42, 0);
  return g;
}

function rocket() {
  const g = new THREE.Group(), r = new THREE.Group(); g.add(r); r.rotation.z = -.35;
  r.add(mesh(new THREE.CylinderGeometry(.46, .5, 1.15, 40), plastic('#FFF6EC')));
  r.add(mesh(SPH, plastic('#FFF6EC'), [0, .57, 0], [.46, .12, .46]));
  r.add(mesh(new THREE.ConeGeometry(.46, .72, 40), plastic('#FF6B7A'), [0, .95, 0]));
  r.add(mesh(SPH, plastic('#7FB3FF'), [0, .14, .42], [.22, .22, .12]));
  r.add(mesh(new THREE.TorusGeometry(.22, .05, 12, 32), plastic('#C9D4E4'), [0, .14, .43]));
  for (const a of [0, 2.1, 4.2]) {
    const piv = new THREE.Group(); piv.rotation.y = a;
    piv.add(mesh(new RoundedBoxGeometry(.1, .55, .46, 3, .04), plastic('#FF6B7A'), [0, -.48, .55], [1, 1, 1], [-.35, 0, 0]));
    r.add(piv);
  }
  r.add(mesh(new THREE.CylinderGeometry(.3, .36, .22, 24), plastic('#B9C4D6'), [0, -.68, 0]));
  r.add(mesh(new THREE.ConeGeometry(.26, .5, 24), new THREE.MeshBasicMaterial({ color: '#FFB347' }), [0, -1.02, 0], [1, 1, 1], [Math.PI, 0, 0]));
  r.add(mesh(new THREE.ConeGeometry(.14, .3, 16), new THREE.MeshBasicMaterial({ color: '#FFF3A0' }), [0, -.92, 0], [1, 1, 1], [Math.PI, 0, 0]));
  return g;
}

function star() {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? .5 : 1;
    i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: .26, bevelEnabled: true, bevelThickness: .2, bevelSize: .16, bevelSegments: 8, curveSegments: 4 });
  geo.center();
  const g = new THREE.Group();
  g.add(mesh(geo, plush('#FFD45C')));
  eyes(g, 'sleepy', .08, .36, .2, .085);
  smile(g, -.12, .36, .08);
  cheeks(g, -.04, .34, .36);
  return g;
}

function octo(c = '#B49BFF') {
  const g = new THREE.Group(), P = plush(c);
  g.add(mesh(SPH, P, [0, .24, 0], [.88, .82, .8]));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + .3;
    g.add(mesh(SPH, P, [Math.cos(a) * .56, -.52, Math.sin(a) * .46], [.21, .42, .21], [Math.sin(a) * .5, 0, -Math.cos(a) * .5]));
  }
  for (const sx of [-1, 1]) {
    g.add(mesh(SPH, plastic('#FFFFFF'), [.3 * sx, .32, .66], [.2, .23, .12]));
    eye(g, .32 * sx, .3, .74, .09);
  }
  smile(g, .04, .78, .1); cheeks(g, .1, .72, .56);
  return g;
}

function robot() {
  const g = new THREE.Group();
  g.add(mesh(new RoundedBoxGeometry(1.5, 1.12, 1.1, 6, .3), plastic('#C7D3E3'), [0, .15, 0]));
  g.add(mesh(new RoundedBoxGeometry(1.1, .62, .12, 4, .06), GLOSS, [0, .18, .53]));
  const glow = new THREE.MeshBasicMaterial({ color: '#7FF5E4' });
  for (const sx of [-1, 1]) {
    g.add(mesh(SPH_LO, glow, [.25 * sx, .24, .6], [.1, .11, .04]));
    g.add(mesh(new THREE.CylinderGeometry(.13, .13, .22, 24), plastic('#FFD45C'), [.84 * sx, .15, 0], [1, 1, 1], [0, 0, Math.PI / 2]));
  }
  g.add(mesh(arcGeo(.13, .03), glow, [0, .08, .6], [1, 1, 1], [0, 0, Math.PI]));
  g.add(mesh(new THREE.CylinderGeometry(.04, .04, .36, 12), plastic('#9AA8BC'), [0, .86, 0]));
  g.add(mesh(SPH_LO, plastic('#FF6B7A'), [0, 1.07, 0], [.13, .13, .13]));
  g.add(mesh(new RoundedBoxGeometry(.92, .48, .82, 4, .16), plastic('#FF9A5C'), [0, -.62, 0]));
  return g;
}

function cartBox() {
  const g = new THREE.Group();
  g.add(mesh(new RoundedBoxGeometry(1.5, .95, 1.1, 6, .22), plastic('#FFD45C'), [0, 0, 0]));
  g.add(mesh(new RoundedBoxGeometry(1.26, .1, .86, 3, .04), plastic('#E39A1B'), [0, .45, 0]));
  g.add(mesh(new RoundedBoxGeometry(1.54, .2, 1.14, 4, .08), plastic('#FF7EB0'), [0, .08, 0]));
  g.add(mesh(SPH, plastic('#5B8CFF'), [-.32, .55, -.05], [.28, .28, .28]));
  g.add(mesh(SPH, plush('#C98B5A'), [.3, .58, 0], [.25, .23, .23]));
  for (const sx of [-1, 1]) g.add(mesh(SPH_LO, plush('#C98B5A'), [.3 + .17 * sx, .76, -.02], [.09, .09, .07]));
  return g;
}

/* fit any model into a unit-tall box, base at y=0, centered on x/z */
function normalize(g) {
  const box = new THREE.Box3().setFromObject(g), s = new THREE.Vector3(), c = new THREE.Vector3();
  box.getSize(s); box.getCenter(c);
  const k = 1 / Math.max(s.y, s.x * .85, s.z * .7);
  g.scale.multiplyScalar(k); g.position.set(-c.x * k, -box.min.y * k, -c.z * k);
  const w = new THREE.Group(); w.add(g); return w;
}

const MAKERS = {
  bear: () => bear(), duck, ball, block: () => block('A'), rocket, octo: () => octo(), robot, star, cart: cartBox,
  blockB: () => block('B', '#FF9EC4'), blockC: () => block('C', '#FFD45C', '#FF7EB0')
};

/* =====================================================================
   RENDERER — one fixed canvas, camera mapped so 1 world unit = 1 CSS px at z=0
   ===================================================================== */
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, alpha: true, preserveDrawingBuffer: SHOT });
} catch (e) { renderer = null; }

const toys = [];
let VW = 1, VH = 1, D = 1, mouse = { x: -1, y: -1 }, time = 0, cartToy = null, buddyToy = null;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(30, 1, 10, 10000);
const G = 3600;

const shadowTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const x = cv.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(70,40,110,.55)'); gr.addColorStop(.55, 'rgba(70,40,110,.2)'); gr.addColorStop(1, 'rgba(70,40,110,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
})();
const SHADOW_GEO = new THREE.PlaneGeometry(2, 2);
const PED_GEO = (() => {
  const pts = [], R = 1, h = 1, rr = .16;
  pts.push(new THREE.Vector2(0, 0));
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI / 2; pts.push(new THREE.Vector2(R - rr + Math.cos(a) * rr, rr + Math.sin(a) * rr)); }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push(new THREE.Vector2(R - rr + Math.cos(a) * rr, h - rr + Math.sin(a) * rr)); }
  pts.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(pts, 72);
})();

function resize() {
  if (!renderer) return;
  const c = renderer.domElement; VW = c.clientWidth; VH = c.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(VW, VH, false);
  D = (VH / 2) / Math.tan(THREE.MathUtils.degToRad(15));
  cam.aspect = VW / VH; cam.position.set(0, 0, D); cam.near = D * .2; cam.far = D * 3; cam.updateProjectionMatrix();
  key.position.set(-VW * .4, VH * .9, D * .9);
  rim.position.set(VW * .6, VH * .3, -D * .3);
}
let key, rim;
if (renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  scene.add(new THREE.HemisphereLight('#FFF4FA', '#D9C9FF', .7));
  key = new THREE.DirectionalLight('#FFF1E0', 1.7); scene.add(key);
  rim = new THREE.DirectionalLight('#E4D8FF', .9); scene.add(rim);
  resize();
  addEventListener('resize', resize);
}
addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

/* =====================================================================
   TOY — anchored to a DOM slot; hops with anticipation, stretch, squash
   ===================================================================== */
class Toy {
  constructor(slot, make, o = {}) {
    this.slot = slot; this.make = make; this.o = o;
    this.anchor = new THREE.Group(); scene.add(this.anchor);
    if (o.ped) { this.ped = new THREE.Mesh(PED_GEO, plastic(o.ped)); this.anchor.add(this.ped); }
    if (o.shadow !== false) {
      this.shadow = new THREE.Mesh(SHADOW_GEO, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
      this.shadow.rotation.x = -Math.PI / 2; this.anchor.add(this.shadow);
    }
    this.hopG = new THREE.Group(); this.anchor.add(this.hopG);
    this.sizeG = new THREE.Group(); this.hopG.add(this.sizeG);
    this.sqG = new THREE.Group(); this.sizeG.add(this.sqG);
    this.spin = new THREE.Group(); this.sqG.add(this.spin);
    this.flipG = new THREE.Group(); this.flipG.position.y = .5; this.spin.add(this.flipG);
    if (make) this.setModel(make());
    this.y = 0; this.vy = 0; this.sq = 0; this.sqv = 0; this.st = 0; this.crouch = 0;
    this.flip = 0; this.flipRate = 0; this.yaw = o.yaw || 0; this.userYaw = 0; this.yawV = 0;
    this.phase = rand(0, 6.3); this.idle = rand(2, 6); this.size = 100; this.px = 0; this.py = 0;
    this.entered = SHOT || RM || !!o.instant; this.wait = o.delay || 0; this.visible = false;
    toys.push(this);
    if (slot && make) {
      slot.addEventListener('pointerenter', () => { if (HOVER) this.hop(.45); });
      slot.addEventListener('click', () => { if (!o.noClick) this.hop(.95, true); });
    }
  }
  setModel(m) {
    if (this.model) this.flipG.remove(this.model);
    this.model = normalize(m); this.model.position.y -= .5; this.flipG.add(this.model);
  }
  hop(h = .5, flip = false) {          // h = jump height in toy-heights
    if (RM || !this.entered || this.y > 1 || this.crouch > 0) return;
    this.crouch = .1; this.pv = Math.sqrt(2 * G * this.size * h); this.pflip = flip;
  }
  squish(a = .3) { this.sq = Math.max(this.sq, a); this.sqv = 0; }
  update(dt) {
    const r = this.slot.getBoundingClientRect();
    this.visible = r.width > 0 && r.bottom > -250 && r.top < VH + 250;
    this.anchor.visible = this.visible && (this.entered || this.wait <= 0);
    if (!this.visible) return;
    // entrance: fall in from above once the slot scrolls into view
    if (!this.entered && r.top < VH * .92 && r.bottom > 0) {
      this.wait -= dt;
      if (this.wait <= 0) { this.entered = true; this.y = VH * .55 + rand(0, 120); this.vy = 0; this.anchor.visible = true; }
      else { this.anchor.visible = false; return; }
    } else if (!this.entered) { this.anchor.visible = false; return; }

    const o = this.o, pedH = o.ped ? r.height * (o.pedh || .12) : 0;
    const pr = r.width * .4 * (o.pedw || 1);
    // tilted pedestal: its front rim drops ~pr*0.32 below the anchor, so lift it to stay inside the slot
    const baseY = r.bottom - (o.ped && o.fitPed !== false ? pr * .34 + r.height * .03 : r.height * (o.ped ? .05 : .04));
    this.size = Math.min(r.height - pedH - r.height * .1, r.width * .92) * (o.scale || 1);
    this.px = r.left + r.width / 2; this.py = baseY - pedH - this.size * .5 - this.y;
    const wx = this.px - VW / 2, wy = VH / 2 - baseY;
    this.anchor.position.set(wx, wy, o.z || 0);
    this.anchor.rotation.x = .3 + Math.atan(wy / D);          // always seen a bit from above
    if (this.ped) this.ped.scale.set(pr, pedH, pr * .92);

    // --- hop physics ---
    if (this.crouch > 0) {
      this.crouch -= dt; this.sq = lerp(this.sq, .24, .35);
      if (this.crouch <= 0) { this.vy = this.pv; this.sq = -.14; this.sqv = 0; this.flipRate = this.pflip ? Math.PI * 2 / (2 * this.pv / G) : 0; this.flip = 0; }
    } else {
      this.sqv += (-380 * this.sq - 12 * this.sqv) * dt; this.sq += this.sqv * dt;
    }
    if (this.y > 0 || this.vy > 0) {
      this.vy -= G * dt; this.y += this.vy * dt;
      if (this.flipRate) this.flip += this.flipRate * dt;
      if (this.y <= 0) {
        const impact = -this.vy, ref = Math.sqrt(2 * G * this.size);
        this.y = 0; this.vy = 0; this.flip = 0; this.flipRate = 0;
        this.squish(clamp(.12 + .3 * impact / ref, 0, .42));
        if (impact > ref * .9) this.vy = impact * .22;          // little rebound
        if (this.ped) this.pedSq = .5;
        if (o.onLand) o.onLand(this);
      }
    }
    // stretch along the (vertical) velocity while airborne
    const ref = Math.sqrt(2 * G * Math.max(this.size, 1));
    this.st = lerp(this.st, this.y > 0 ? clamp(Math.abs(this.vy) / ref * .32, 0, .3) : 0, .35);
    const ky = clamp((1 - this.sq) * (1 + this.st), .5, 1.6), kx = 1 / Math.sqrt(ky);
    this.sqG.scale.set(kx, ky, kx);
    this.flipG.rotation.x = -this.flip;
    if (this.ped) { this.pedSq = (this.pedSq || 0) * .86; this.ped.scale.y = pedH * (1 - .08 * this.pedSq); }

    // personality: look toward the mouse, idle sway, user spin
    let look = Math.sin(time * .7 + this.phase) * .25;
    if (o.look && mouse.x >= 0) look = clamp((mouse.x - this.px) / VW, -.5, .5) * 1.4;
    if (!o.drag) this.userYaw *= .96; else { this.userYaw += this.yawV; this.yawV *= .93; }
    this.spin.rotation.y = this.yaw + look + this.userYaw;
    this.spin.rotation.z = Math.sin(time * 1.1 + this.phase) * .03;

    this.hopG.position.y = pedH + this.y;
    this.sizeG.scale.setScalar(this.size);
    if (this.shadow) {
      const lift = clamp(this.y / (this.size * 1.2), 0, 1), sp = this.size * .45 * (1 - .45 * lift) * (1 + Math.max(this.sq, 0) * .5);
      this.shadow.position.y = pedH + 1; this.shadow.scale.set(sp, sp * .9, 1);
      this.shadow.material.opacity = .9 * (1 - .65 * lift);
    }

    // behaviours
    if (this.y === 0 && this.crouch <= 0 && !RM && !SHOT) {
      if (o.bounce) { this.idle -= dt; if (this.idle <= 0 && Math.abs(this.sq) < .05) { this.hop(o.bounce, o.flipEvery && Math.random() < .25); this.idle = rand(.05, .35); } }
      else if (o.idle !== false) { this.idle -= dt; if (this.idle <= 0) { this.hop(rand(.15, .35)); this.idle = rand(3, 7); } }
    }
  }
}

/* =====================================================================
   FLYER — clone jumps from a product into the 3D cart: arc + stretch along velocity
   ===================================================================== */
const flyers = [];
function flyToCart(src, done) {
  if (!renderer || !cartToy || RM) { done(); return; }
  src.hop(.35);
  const root = new THREE.Group(), a = new THREE.Group(), s = new THREE.Group(), ai = new THREE.Group(), spin = new THREE.Group();
  root.add(a); a.add(s); s.add(ai); ai.add(spin);
  const m = normalize(src.make()); m.position.y -= .5; spin.add(m);
  scene.add(root);
  flyers.push({ root, a, s, ai, spin, t: -.1, p0: { x: src.px, y: src.py }, size0: src.size, done });
}
function updateFlyers(dt) {
  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i]; f.t += dt / .8;
    if (f.t < 0) { f.root.visible = false; continue; }
    f.root.visible = true;
    const u = clamp(f.t, 0, 1), t = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    const p0 = f.p0, p2 = { x: cartToy.px, y: cartToy.py }, p1 = { x: lerp(p0.x, p2.x, .45), y: Math.min(p0.y, p2.y) - 260 };
    const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x), dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const speed = Math.hypot(dx, dy) * (u < .5 ? 4 * u : 4 * (1 - u));
    const k = 1 + clamp(speed / 2600, 0, .6), ang = Math.atan2(-dy, dx);
    f.root.position.set(x - VW / 2, VH / 2 - y, 300);
    f.root.scale.setScalar(lerp(f.size0, cartToy.size * .55, t));
    f.a.rotation.z = ang; f.ai.rotation.z = -ang; f.s.scale.set(k, 1 / Math.sqrt(k), 1 / Math.sqrt(k));
    f.spin.rotation.set(u * Math.PI * 2, u * Math.PI, 0);
    if (u >= 1) { scene.remove(f.root); flyers.splice(i, 1); cartToy.squish(.42); cartToy.hop(.2); f.done(); }
  }
}

/* =====================================================================
   THUMBNAILS for the cart (real 3D renders)
   ===================================================================== */
const thumbCache = {};
let thumbR = null, thumbS = null, thumbC = null;
function thumb(key, make) {
  if (thumbCache[key]) return thumbCache[key];
  if (!renderer) return '';
  if (!thumbR) {
    thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    thumbR.setSize(160, 160); thumbR.toneMapping = THREE.ACESFilmicToneMapping; thumbR.toneMappingExposure = .9;
    thumbS = new THREE.Scene();
    thumbS.environment = new THREE.PMREMGenerator(thumbR).fromScene(new RoomEnvironment(thumbR), .04).texture;
    thumbS.add(new THREE.HemisphereLight('#FFF4FA', '#D9C9FF', .7));
    const l = new THREE.DirectionalLight('#FFF1E0', 1.7); l.position.set(-2, 4, 4); thumbS.add(l);
    thumbC = new THREE.PerspectiveCamera(30, 1, .1, 20); thumbC.position.set(0, .85, 2.7); thumbC.lookAt(0, .48, 0);
  }
  const m = normalize(make()); m.rotation.y = -.25; thumbS.add(m);
  thumbR.render(thumbS, thumbC);
  const url = thumbR.domElement.toDataURL('image/png');
  thumbS.remove(m);
  return (thumbCache[key] = url);
}

/* =====================================================================
   PAGE: title, reveals, jelly buttons
   ===================================================================== */
(() => {
  const h = $('#title'); const words = h.textContent.trim().split(' ');
  let i = 0;
  h.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${[...w].map(c =>
    `<span class="ch${w.toLowerCase().startsWith('boing') ? ' hl' : ''}" style="--i:${i++}">${c}</span>`).join('')}</span>`).join(' ');
  $$('.ch', h).forEach(ch => {
    ch.addEventListener('animationend', () => ch.style.animation = 'none');
    ch.addEventListener('mouseenter', () => { ch.style.animation = 'jelly .5s ease both'; });
  });
})();
document.addEventListener('click', e => {
  const b = e.target.closest('.btn,.chip,.swatch,.qty button,.icon-btn'); if (!b || RM) return;
  b.classList.remove('jelly'); void b.offsetWidth; b.classList.add('jelly');
  b.addEventListener('animationend', () => b.classList.remove('jelly'), { once: true });
});
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.pop').forEach(el => SHOT || RM ? el.classList.add('in') : io.observe(el));

/* =====================================================================
   HERO STAGE
   ===================================================================== */
const stage = $('#stage');
const HERO = [
  { kind: null, ped: '#CDBBFF', pedw: 1.12, pedh: .26, l: 3, t: 54, w: 94, h: 44, z: -80, idle: false, noClick: true, fitPed: false },
  { kind: 'rocket', l: 70, t: 8, w: 25, h: 52, z: -200, delay: .55 },
  { kind: 'block', l: 6, t: 30, w: 25, h: 38, z: -190, delay: .7 },
  { kind: 'bear', l: 27, t: 12, w: 46, h: 62, z: -40, delay: .25, look: true },
  { kind: 'duck', l: 10, t: 46, w: 28, h: 34, z: 120, delay: .9, look: true },
  { kind: 'octo', l: 40, t: 54, w: 23, h: 28, z: 190, delay: 1.05, look: true },
  { kind: 'ball', l: 64, t: 52, w: 22, h: 30, z: 150, delay: 1.2, bounce: .7 },
  { kind: 'star', l: 2, t: 0, w: 20, h: 22, z: 40, delay: 1.4, bounce: .45, flipEvery: true, shadow: false },
];
HERO.forEach(c => {
  const s = document.createElement('div'); s.className = 'slot';
  Object.assign(s.style, { left: c.l + '%', top: c.t + '%', width: c.w + '%', height: c.h + '%' });
  if (!c.kind) s.style.pointerEvents = 'none';
  stage.appendChild(s);
  if (renderer) new Toy(s, c.kind ? MAKERS[c.kind] : null, c);
});
if (renderer) cartToy = new Toy($('#cartSlot'), MAKERS.cart, { shadow: false, idle: false, instant: true, scale: .78, noClick: true });

/* =====================================================================
   SHOP
   ===================================================================== */
const PRODUCTS = [
  { id: 'bruno', name: 'Bruno the Bounce Bear', price: 24, age: '0-2', cat: 'Plush', bg: '#FFE1D0', ped: '#FFC6A8', make: () => bear(), desc: 'Extra-squishy plush with a squeaker belly.', badge: 'Bestseller' },
  { id: 'quack', name: 'Captain Quack', price: 9, age: '0-2', cat: 'Bath time', bg: '#FFF1BF', ped: '#9FD8FF', make: duck, desc: 'Floats, squirts and never sinks morale.' },
  { id: 'moon', name: 'Moonhop Rocket', price: 32, age: '3-5', cat: 'Pretend play', bg: '#DCE7FF', ped: '#B9CCFF', make: rocket, desc: 'Pull it back, let go, watch it zoom 20 ft.' },
  { id: 'blocks', name: 'Wobble Blocks, 12 pc', price: 28, age: '0-2', cat: 'Building', bg: '#D3F5EE', ped: '#A5E9DC', make: () => block('A'), desc: 'Soft-edge stacking blocks with big letters.' },
  { id: 'octo', name: 'Squishy Octo', price: 18, age: '3-5', cat: 'Sensory', bg: '#ECE3FF', ped: '#D2C2FF', make: () => octo(), desc: 'Slow-rise squish with 8 hug-ready arms.' },
  { id: 'bolt', name: 'Bolt the Coding Bot', price: 45, age: '6+', cat: 'STEM', bg: '#E3EBF5', ped: '#FFC7A3', make: robot, desc: 'Screen-free coding with arrow cards.', badge: 'New', bnew: true },
  { id: 'ball', name: 'Mega Boing Ball', price: 12, age: '3-5', cat: 'Outdoor', bg: '#DDE7FF', ped: '#FFE08A', make: ball, desc: 'Bounces higher than your ceiling. Probably.' },
  { id: 'twinkle', name: 'Twinkle Night Star', price: 26, age: '6+', cat: 'Bedtime', bg: '#FFF4CF', ped: '#C9B6FF', make: star, desc: 'Soft glow nightlight with 3 lullabies.' }
];
const AGE = { '0-2': 'Ages 0–2', '3-5': 'Ages 3–5', '6+': 'Ages 6+' };
const grid = $('#grid');
grid.innerHTML = PRODUCTS.map(p => `
  <article class="card pop" data-age="${p.age}" data-id="${p.id}">
    <div class="slot" style="--bg2:${p.bg}" title="Tap for a flip"></div>
    <div class="card-body">
      ${p.badge ? `<span class="badge${p.bnew ? ' new' : ''}">${p.badge}</span>` : ''}
      <span class="tag">${AGE[p.age]} · ${p.cat}</span>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="row"><b>$${p.price}</b><button class="btn btn-sm btn-yellow add">Add to bag</button></div>
    </div>
  </article>`).join('');
$$('.card', grid).forEach(el => { if (SHOT || RM) el.classList.add('in'); else io.observe(el); });
const productToy = {};
$$('.card', grid).forEach((card, i) => {
  const p = PRODUCTS[i];
  if (renderer) {
    const t = new Toy($('.slot', card), p.make, { ped: p.ped, pedh: .08, pedw: .9, delay: .15 + (i % 4) * .12, scale: .78 });
    productToy[p.id] = t;
    card.addEventListener('pointerenter', () => { if (HOVER) t.hop(.5); });
  }
});
$$('.filters .chip').forEach(ch => ch.addEventListener('click', () => {
  $$('.filters .chip').forEach(c => c.classList.toggle('on', c === ch));
  let d = 0;
  $$('.card', grid).forEach(card => {
    const show = ch.dataset.age === 'all' || card.dataset.age === ch.dataset.age;
    card.classList.toggle('hide', !show); card.classList.remove('enter');
    if (show) {
      card.style.setProperty('--d', d); void card.offsetWidth; card.classList.add('enter');
      const t = productToy[card.dataset.id]; if (t && !RM) { t.entered = false; t.wait = .1 + d * .08; t.y = 0; t.vy = 0; }
      d++;
    }
  });
}));

/* =====================================================================
   CART
   ===================================================================== */
const cart = [];
const cartBtn = $('#cartBtn'), countEl = $('#cartCount');
const money = n => '$' + n.toFixed(n % 1 ? 2 : 0);
function addToCart(item, srcToy) {
  const ex = cart.find(c => c.key === item.key);
  if (ex) ex.qty++; else cart.push({ ...item, qty: 1, fresh: true });
  const done = () => {
    countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
    const r = cartBtn.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, 16);
    renderCart(); toast(`${item.name} hopped into your bag!`);
  };
  if (srcToy) flyToCart(srcToy, done); else done();
}
function renderCart() {
  const n = cart.reduce((s, c) => s + c.qty, 0), sub = cart.reduce((s, c) => s + c.qty * c.price, 0);
  countEl.textContent = n; $('#subtotal').textContent = money(sub);
  const left = 50 - sub;
  $('#shipText').textContent = left > 0 ? `Add ${money(left)} more for free shipping` : 'Woohoo! Free shipping unlocked 🎉';
  $('#shipBar').style.width = clamp(sub / 50 * 100, 0, 100) + '%';
  const list = $('#cartList');
  if (!cart.length) { list.innerHTML = `<li class="cart-empty">Your bag is empty.<br>The toys are getting bored.</li>`; return; }
  list.innerHTML = cart.map((c, i) => `
    <li class="ci${c.fresh ? ' enter' : ''}">
      <img src="${c.img}" alt="">
      <div><div class="ci-name">${c.name}</div><div class="ci-price">${money(c.price)}${c.note ? ' · ' + c.note : ''}</div></div>
      <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Less">−</button><span>${c.qty}</span><button data-i="${i}" data-d="1" aria-label="More">+</button></div>
    </li>`).join('');
  cart.forEach(c => c.fresh = false);
}
$('#cartList').addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  const i = +b.dataset.i, c = cart[i]; c.qty += +b.dataset.d;
  if (c.qty <= 0) cart.splice(i, 1);
  renderCart();
  const q = $$('.qty span')[i]; if (q) q.style.animation = 'pop .45s ease both';
});
renderCart();
const drawer = $('#drawer'), overlay = $('#overlay');
const openCart = on => { drawer.classList.toggle('on', on); overlay.classList.toggle('on', on); drawer.setAttribute('aria-hidden', !on); };
cartBtn.addEventListener('click', () => { if (cartToy) cartToy.hop(.3); openCart(true); });
$('#closeCart').addEventListener('click', () => openCart(false));
overlay.addEventListener('click', () => openCart(false));
addEventListener('keydown', e => { if (e.key === 'Escape') openCart(false); });
$('#checkout').addEventListener('click', () => toast(cart.length ? 'Demo store: checkout is turned off here.' : 'Pop a toy in the bag first!'));
grid.addEventListener('click', e => {
  const btn = e.target.closest('.add'); if (!btn) return;
  const p = PRODUCTS.find(x => x.id === btn.closest('.card').dataset.id);
  addToCart({ key: p.id, name: p.name, price: p.price, img: thumb(p.id, p.make) }, productToy[p.id]);
});

const CC = ['#FF7EB0', '#FFD45C', '#5ED6C4', '#7FB3FF', '#B49BFF', '#FF9A5C'];
function confetti(x, y, n) {
  if (RM) return;
  const ps = [];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div'); el.className = 'confetti'; el.style.background = CC[i % CC.length];
    document.body.appendChild(el);
    const a = rand(-Math.PI * .95, -Math.PI * .05);
    ps.push({ el, x, y, vx: Math.cos(a) * rand(250, 620), vy: Math.sin(a) * rand(300, 720), life: 0 });
  }
  let t0 = performance.now();
  (function f(now) {
    const dt = Math.min((now - t0) / 1000, .04); t0 = now; let alive = 0;
    for (const p of ps) {
      p.life += dt; if (p.life > 1.1) { p.el.remove(); continue; }
      alive++; p.vy += 1500 * dt; p.vx *= .985; p.x += p.vx * dt; p.y += p.vy * dt;
      const s = 1 + clamp(Math.hypot(p.vx, p.vy) / 900, 0, .8), ang = Math.atan2(p.vy, p.vx) * 57.3 + 90;
      p.el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${ang}deg) scale(${1 / s},${s})`;
      p.el.style.opacity = 1 - Math.max(0, p.life - .8) / .3;
    }
    if (alive) requestAnimationFrame(f);
  })(t0);
}
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); }

/* =====================================================================
   BUILD-A-BUDDY (3D bear on a turntable)
   ===================================================================== */
const COLORS = [['Honey', '#C98B5A'], ['Bubblegum', '#FF9EC4'], ['Mint', '#7FE0CF'], ['Lilac', '#B49BFF'], ['Sunny', '#FFD45C'], ['Cocoa', '#8A5A3C']];
const FACES = [['dot', 'Curious'], ['happy', 'Giggly'], ['wink', 'Cheeky'], ['sleepy', 'Dreamy']];
const EXTRAS = [['none', 'None', 0], ['bow', 'Bow', 3], ['hat', 'Party hat', 4], ['scarf', 'Scarf', 4], ['glasses', 'Specs', 3]];
const st = { color: 0, face: 0, extra: 0, name: 'Biscuit' };
const BASE = 34;
const priceEl = $('#buddyPrice'), tag = $('#nameTag'), bslot = $('#buddySlot');
$('#colors').innerHTML = COLORS.map(([n, c], i) => `<button class="swatch${i ? '' : ' on'}" style="--c:${c}" data-i="${i}" aria-label="${n}" title="${n}"></button>`).join('');
$('#eyes').innerHTML = FACES.map(([, n], i) => `<button class="chip${i ? '' : ' on'}" data-i="${i}">${n}</button>`).join('');
$('#accs').innerHTML = EXTRAS.map(([, n, p], i) => `<button class="chip${i ? '' : ' on'}" data-i="${i}">${n}${p ? `<small>+$${p}</small>` : ''}</button>`).join('');
const buddyMake = () => { const c = COLORS[st.color][1], f = FACES[st.face][0], a = EXTRAS[st.extra][0]; return () => bear(c, f, a, true); };
const buddyPrice = () => BASE + EXTRAS[st.extra][2];
if (renderer) buddyToy = new Toy(bslot, buddyMake(), { ped: '#FFB3D1', pedh: .1, pedw: .78, scale: .98, drag: true, idle: false, noClick: true, yaw: -.3, delay: .2 });
function updateBuddy() {
  priceEl.textContent = '$' + buddyPrice();
  priceEl.style.animation = 'none'; void priceEl.offsetWidth; priceEl.style.animation = 'pop .5s ease both';
  if (buddyToy) { buddyToy.make = buddyMake(); buddyToy.setModel(buddyToy.make()); buddyToy.squish(.3); buddyToy.hop(.4); }
}
const wire = (id, k) => $(id).addEventListener('click', e => {
  const b = e.target.closest('[data-i]'); if (!b) return;
  st[k] = +b.dataset.i; $$('[data-i]', $(id)).forEach(x => x.classList.toggle('on', x === b)); updateBuddy();
});
wire('#colors', 'color'); wire('#eyes', 'face'); wire('#accs', 'extra');
$('#buddyName').addEventListener('input', e => {
  st.name = e.target.value.trim() || 'Buddy'; tag.textContent = st.name;
  tag.classList.remove('swing'); void tag.offsetWidth; tag.classList.add('swing');
});
let bdrag = null;
bslot.addEventListener('pointerdown', e => { bdrag = { x: e.clientX, moved: 0 }; bslot.setPointerCapture(e.pointerId); });
bslot.addEventListener('pointermove', e => {
  if (!bdrag || !buddyToy) return; const d = e.clientX - bdrag.x; bdrag.x = e.clientX; bdrag.moved += Math.abs(d);
  buddyToy.userYaw += d * .012; buddyToy.yawV = d * .006;
});
bslot.addEventListener('pointerup', () => { if (bdrag && bdrag.moved < 5 && buddyToy) buddyToy.hop(.6, true); bdrag = null; });
$('#buddyAdd').addEventListener('click', () => {
  const key = `buddy-${st.color}-${st.face}-${st.extra}-${st.name}`;
  addToCart({ key, name: `${st.name} (custom bear)`, price: buddyPrice(), img: thumb(key, buddyMake()), note: `${COLORS[st.color][0]}, ${FACES[st.face][1]}` }, buddyToy);
});

/* promise + club toys */
if (renderer) {
  $$('.p-slot').forEach((s, i) => new Toy(s, MAKERS[s.dataset.kind], { bounce: .5, delay: .1 + i * .15, scale: .85 }));
  const cs = $('.club-slot');
  const clubToy = new Toy(cs, () => octo('#FF9EC4'), { bounce: .55, flipEvery: true, look: true, delay: .2, noClick: true });
  cs.addEventListener('click', () => { clubToy.hop(1, true); const r = cs.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 40, 14); });
}

/* newsletter */
$('#clubForm').addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('#email'), msg = $('#formMsg');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim())) {
    inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad');
    msg.className = 'form-msg'; msg.textContent = 'Hmm, that email looks a bit wobbly. Try again?'; return;
  }
  inp.classList.remove('bad'); msg.className = 'form-msg'; void msg.offsetWidth; msg.classList.add('ok');
  msg.textContent = "You're in! (Demo: nothing was sent.)";
  const r = inp.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, 22); inp.value = '';
});

/* ---------- mobile menu ---------- */
{
  const header = $('.header'), burger = $('#burger');
  const setMenu = open => {
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  $('#mainNav').addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width:1001px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
}

/* =====================================================================
   LOOP
   ===================================================================== */
if (renderer) {
  if (SHOT) {   // cover: freeze one toy mid-air, stretched
    setTimeout(() => { const t = toys.find(x => x.o.kind === 'ball'); if (t) { t.y = t.size * .9; t.st = .25; } }, 0);
  }
  const header = $('.header');
  renderer.autoClear = false;
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now; time += dt;
    for (const t of toys) if (t.slot) t.update(dt);
    updateFlyers(dt);
    // pass 1: page toys, clipped below the sticky header so they slide under it
    const hb = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
    renderer.setScissorTest(true);
    renderer.setScissor(0, 0, VW, VH); renderer.clear();
    renderer.setScissor(0, 0, VW, VH - hb); renderer.render(scene, cam);
    // pass 2: header strip shows only the cart box and toys flying into it
    const vis = toys.map(t => t.anchor.visible);
    toys.forEach(t => { if (t !== cartToy) t.anchor.visible = false; });
    renderer.setScissor(0, VH - hb, VW, hb); renderer.render(scene, cam);
    toys.forEach((t, i) => { t.anchor.visible = vis[i]; });
    renderer.setScissorTest(false);
    requestAnimationFrame(loop);
  })(last);
}
