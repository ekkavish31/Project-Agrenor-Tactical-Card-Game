/* Builds assets/models/<name>.glb from tools/models/<name>-model.mjs.
   node tools/models/build-glb.mjs inn   (needs the npm package "three"; set THREE_DIR to its folder if it is not installed here) */
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const name = process.argv[2] || 'inn', dir = process.env.THREE_DIR ? path.resolve(process.env.THREE_DIR) : null;
const imp = p => import(dir ? pathToFileURL(path.join(dir, p)).href : p.replace(/^node_modules\//, '').replace(/\/build\/three\.module\.js$/, ''));
const THREE = await imp('node_modules/three/build/three.module.js');
const { GLTFExporter } = await import(dir ? pathToFileURL(path.join(dir, 'node_modules/three/examples/jsm/exporters/GLTFExporter.js')).href : 'three/examples/jsm/exporters/GLTFExporter.js');
/* GLTFExporter uses FileReader for binary output; Node has Blob but no FileReader */
globalThis.FileReader = class { readAsArrayBuffer(b) { b.arrayBuffer().then(r => { this.result = r; this.onloadend?.() }) } readAsDataURL(b) { b.arrayBuffer().then(r => { this.result = 'data:' + (b.type || 'application/octet-stream') + ';base64,' + Buffer.from(r).toString('base64'); this.onloadend?.() }) } };
const { [`build${name[0].toUpperCase()}${name.slice(1)}`]: build } = await import(pathToFileURL(path.resolve(`tools/models/${name}-model.mjs`)).href);
const scene = new THREE.Scene(); scene.add(build(THREE));
const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
mkdirSync('assets/models', { recursive: true }); writeFileSync(`assets/models/${name}.glb`, Buffer.from(glb));
let tris = 0; scene.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 });
console.log(`assets/models/${name}.glb`, (glb.byteLength / 1024).toFixed(0) + ' KB', Math.round(tris) + ' triangles');
