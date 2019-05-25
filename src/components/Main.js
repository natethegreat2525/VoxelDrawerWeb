import * as THREE from 'three';
import { ChunkView } from './blockview';
import { ChunkCache, WIDTH } from './blockworld';
import { Vector3 } from 'three';
import { Empty } from './terraingen';
import { blockTypes } from './blocktypes';


let glCanvas = null;
let glCtx = null;
let glWidth = 0;
let glHeight = 0;
let renderer = null;
let running = false;
let scene = null;
let camera = null;
let view = null;
let cache = null;
let width = 10;
let depth = 10;
let height = 10;
let yAng = 0;
let xAng = Math.PI / 8;
let mouseX = 0;
let mouseY = 0;
let cube = null;
let lastRay = null;
let selectedBlock = 1;
let zoom = 20;
let previewCube = null;
let midStart = null;

export function initGraphics(canvas, gl, w, h) {
    console.log('init');

    glCanvas = canvas;
    glCtx = gl;
    glWidth = w;
    glHeight = h;
    renderer = new THREE.WebGLRenderer({canvas: glCanvas});

    renderer.setClearColor(0xbedfff);
    
    if (running) {
        camera.children[0].aspect = glWidth/glHeight;
        camera.children[0].updateProjectionMatrix();
        return;
    }

    let isDown = false;
    let moved = false;

    canvas.oncontextmenu = (e) => {
        if (!moved) {
            if (lastRay) {
                let pos = new Vector3(lastRay.blockPosition.x, lastRay.blockPosition.y, lastRay.blockPosition.z)
                if (pos.x >= 1 && pos.x < 1+width && pos.y >= 2 && pos.y < 2+height && pos.z >= 1 && pos.z < 1+depth) {
                    cache.setBlockValue(new Vector3(pos.x, pos.y, pos.z), 0, true);
                }
            }
        }
        e.preventDefault();
    }

    canvas.addEventListener('mousemove', (evt) => {
        if (isDown && !midStart) {
            yAng -= evt.movementX * 0.005;
            xAng += evt.movementY * 0.005;
            if (Math.abs(evt.movementX) > 1 || Math.abs(evt.movementY) > 1) {
                moved = true;
            }
        }
        mouseX = evt.offsetX;
        mouseY = evt.offsetY;
    });

    canvas.addEventListener('mousedown', e => {
        if (e.button === 1) {
            midStart = lastRay;
        }
        isDown = true;
        moved = false;
    });

    canvas.addEventListener('mouseup', (e) => {
        isDown = false;
        if (!moved && e.button === 0) {
            if (lastRay) {
                let pos = new Vector3(lastRay.blockPosition.x, lastRay.blockPosition.y, lastRay.blockPosition.z).add(lastRay.normal);
                if (pos.x >= 1 && pos.x < 1+width && pos.y >= 2 && pos.y < 2+height && pos.z >= 1 && pos.z < 1+depth) {
                    cache.setBlockValue(new Vector3(pos.x, pos.y, pos.z), selectedBlock, true);
                }
            }
        }
        if (e.button === 1 && midStart && lastRay) {
            let pos1 = new Vector3(midStart.blockPosition.x, midStart.blockPosition.y, midStart.blockPosition.z);
            let pos2 = new Vector3(lastRay.blockPosition.x, lastRay.blockPosition.y, lastRay.blockPosition.z);
            if (pos1.x >= 1 && pos1.x < 1+width && pos1.y >= 2 && pos1.y < 2+height && pos1.z >= 1 && pos1.z < 1+depth) {
                if (pos2.x >= 1 && pos2.x < 1+width && pos2.y >= 2 && pos2.y < 2+height && pos2.z >= 1 && pos2.z < 1+depth) {
                    let lowX = Math.min(pos1.x, pos2.x);
                    let lowY = Math.min(pos1.y, pos2.y);
                    let lowZ = Math.min(pos1.z, pos2.z);
                    let highX = Math.max(pos1.x, pos2.x);
                    let highY = Math.max(pos1.y, pos2.y);
                    let highZ = Math.max(pos1.z, pos2.z);
                    pos1.x = lowX;
                    pos1.y = lowY;
                    pos1.z = lowZ;
                    pos2.x = highX;
                    pos2.y = highY;
                    pos2.z = highZ;
                    for (let x = pos1.x; x <= pos2.x; x++) {
                        for (let y = pos1.y; y <= pos2.y; y++) {
                            for (let z = pos1.z; z <= pos2.z; z++) {
                                cache.setBlockValue(new Vector3(x, y, z), selectedBlock, true);
                            }
                        }
                    }
                }
            }
        }
        midStart = null;
    });

    canvas.addEventListener('wheel', e => {
        if (e.deltaY > 0) {
            zoom *= 1.05;
        }
        if (e.deltaY < 0) {
            zoom *= .95;
        }
    });

    running = true;
    let cameraReal = new THREE.PerspectiveCamera(50, glWidth/glHeight, 0.1, 300);
    camera = new THREE.Object3D();
    camera.add(cameraReal);
    camera.position.set(0, 0, 10);

    scene = new THREE.Scene();
    scene.add(camera);

    let sun = new THREE.DirectionalLight(0xffffff, 1);
    scene.add(sun);
    let ambient = new THREE.AmbientLight(0xffffff, .5);
    scene.add(ambient);

    cube = new THREE.SphereGeometry();
    cube.scale(0.1, 0.1, 0.1);
    let m = new THREE.MeshBasicMaterial({color: 0xff0000});
    cube = new THREE.Mesh(cube, m);
    scene.add(cube);

    previewCube = new THREE.BoxGeometry(1, 1, 1);
    m = new THREE.MeshBasicMaterial({color: 0x9999ff, transparent: true, opacity: 0.3});
    previewCube = new THREE.Mesh(previewCube, m);
    scene.add(previewCube);

    view = new ChunkView(new THREE.Vector3(3, 3, 3));
    cache = new ChunkCache();
    view.offset = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < depth; j++) {
            cache.setBlockValue(new Vector3(1+i, 1, 1+j), 1, true);
        }
    }
    requestAnimationFrame(update);
}

export function addColor(color) {
    blockTypes.push(new THREE.Color(color.r/255, color.g/255, color.b/255));
}

export function selectColor(idx) {
    selectedBlock = idx + 2;
}


let oldTime = 0
function update(now) {
    let delta = (now - oldTime) / 1000.0;
    oldTime = now;
    let center = new Vector3((2+width) / 2, 1, (2+depth) / 2);
    let offs = new Vector3(Math.sin(yAng)*Math.cos(xAng)*zoom, Math.sin(xAng)*zoom, Math.cos(yAng)*Math.cos(xAng)*zoom);
    let pos = center.add(offs);
    camera.position.set(pos.x, pos.y, pos.z);

    camera.rotation.y = yAng;
    camera.children[0].rotation.x = -xAng;

    let scVec = new Vector3((mouseX / glWidth) * 2 - 1, (-mouseY / glHeight) * 2 + 1, 0.5);
    scVec = scVec.clone().unproject(camera.children[0]);
    let camDir = scVec.sub(camera.position);
    let ray = cache.rayCast(camera.position, camDir, 50);
    if (ray) {
        cube.position.set(ray.position.x, ray.position.y, ray.position.z);
        previewCube.position.set(ray.blockPosition.x + ray.normal.x + .5, ray.blockPosition.y + ray.normal.y+.5, ray.blockPosition.z + ray.normal.z+.5);
    } else {
        cube.position.set(1000, 1000, 1000);
        previewCube.position.set(1000, 1000, 1000);
    }
    lastRay = ray;

    view.rebuildDirty(cache, scene, 0);
    view.newlyLoaded = false;
    renderer.render(scene, camera.children[0]);
    requestAnimationFrame(update);
}

export function getState() {
    let state = {w: width, h: height, d: depth};
    state.v = new Array(width * height * depth);
    let idx = 0;
    for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                state.v[idx] = cache.getBlockValue({x: x+1, y: y+2, z: z+1});
                idx++;
            }
        }
    }
    state.c = [];
    for (let i = 2; i < blockTypes.length; i++) {
        state.c.push({r: blockTypes[i].r, g: blockTypes[i].g, b: blockTypes[i].b});
    }
    return state;
}

export function loadState(state) {
    resize(state.w, state.h, state.d);

    let idx = 0
    for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                cache.setBlockValue({x: x+1, y: y+2, z: z+1}, state.v[idx], true);
                idx++;
            }
        }
    }

    for (let i = 0; i < state.c.length; i++) {
        blockTypes[i+2] = new THREE.Color(state.c[i].r, state.c[i].g, state.c[i].b);
    }
}

export function resize(w, h, d) {
    for (let x = 0; x < width; x++) {
        for (let y = -1; y < height; y++) {
            for (let z = 0; z < depth; z++) {
                if (x >= w || y >=h || z >=d) {
                    cache.setBlockValue({x: x+1, y: y+2, z: z+1}, 0, true);
                }
            }
        }
    }
    width = w;
    height = h;
    depth = d;
    for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
            cache.setBlockValue({x: x+1, y: 1, z: z+1}, 1, true);
        }
    }
}