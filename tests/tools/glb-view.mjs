// Render a GLB from several angles in headless Chromium for inspection.
// Usage: node tests/tools/glb-view.mjs <file.glb> <out.png>
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const [,, glbPath, out] = process.argv;
const root = resolve('node_modules/three');
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  try {
    if (url === '/model.glb') { res.setHeader('Content-Type', 'model/gltf-binary'); return res.end(readFileSync(glbPath)); }
    if (url === '/') { res.setHeader('Content-Type', 'text/html'); return res.end(page); }
    const f = resolve(root, '.' + url);
    statSync(f); res.setHeader('Content-Type', url.endsWith('.wasm') ? 'application/wasm' : 'text/javascript'); res.end(readFileSync(f));
  } catch { res.statusCode = 404; res.end(); }
}).listen(0);
const port = server.address().port;
const page = `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#f5f5f7}</style><canvas id=c width=1600 height=400></canvas>
<script type="importmap">{"imports":{"three":"/build/three.module.js","three/addons/":"/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const r = new THREE.WebGLRenderer({canvas: c, antialias: true}); r.setSize(1600, 400, false);
r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf5f5f7);
scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-3, 6, 4); scene.add(sun, new THREE.AmbientLight(0xffffff, 0.4));
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.loadAsync('/model.glb');
const m = gltf.scene; const box = new THREE.Box3().setFromObject(m); const size = box.getSize(new THREE.Vector3()); const ctr = box.getCenter(new THREE.Vector3());
m.position.sub(ctr); scene.add(m);
let tris = 0, mats = new Set(); m.traverse(o => { if (o.isMesh) { tris += o.geometry.index ? o.geometry.index.count/3 : o.geometry.attributes.position.count/3; mats.add(o.material.name); } });
window.__info = { size: size.toArray().map(v=>+v.toFixed(2)), tris: Math.round(tris), materials: mats.size };
const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100); const d = Math.max(size.x, size.y, size.z) * 2.1;
const views = [[0.6, 0.45], [2.2, 0.45], [3.8, 0.45], [0.6, 1.2]];
views.forEach(([az, el], i) => { cam.position.set(Math.sin(az)*Math.cos(el)*d, Math.sin(el)*d, Math.cos(az)*Math.cos(el)*d); cam.lookAt(0,0,0); cam.updateProjectionMatrix(); r.setViewport(i*400, 0, 400, 400); r.setScissor(i*400, 0, 400, 400); r.setScissorTest(true); r.render(scene, cam); });
window.__done = true;
</script>`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await browser.newPage({ viewport: { width: 1600, height: 400 } });
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto(`http://localhost:${port}/`);
await p.waitForFunction(() => window.__done, null, { timeout: 120000 });
await p.screenshot({ path: out });
console.log(basename(glbPath), JSON.stringify(await p.evaluate(() => window.__info)), 'bytes', statSync(glbPath).size);
await browser.close(); server.close();
