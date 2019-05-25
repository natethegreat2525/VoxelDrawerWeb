import { Vector3 } from "three";
import * as builder from './cubebuilder';
import { WIDTH } from "./blockworld";
import { blockTypes, posMod } from "./blocktypes";

export class ChunkView {
    constructor(size) {
        this.size = size;
        this.offset = new Vector3(0, 0, 0);
        this.chunks = new Array(this.size.x * this.size.y * this.size.z);
    }

    rebuildDirty(cache, scene, limit) {
        let count = 0;
        limit = limit || Infinity;
        for (let i = 0; i < this.size.x; i++) {
            for (let j = 0; j < this.size.y; j++) {
                for (let k = 0; k < this.size.z; k++) {
                    let pos = new Vector3(i+this.offset.x, j+this.offset.y, k+this.offset.z);
                    let chunk = cache.getChunk(pos)
                    if (chunk && chunk.dirty) {
                        let idx = i+j*this.size.x+k*this.size.x*this.size.y;
                        if (this.chunks[idx]) {
                            scene.remove(this.chunks[idx]);
                            this.chunks[idx].geometry.dispose();
                            this.chunks[idx].material.dispose();
                        }
                        this.chunks[idx] = this.buildChunk(cache, pos);
                        this.chunks[idx].position.x = pos.x*WIDTH-1;
                        this.chunks[idx].position.y = pos.y*WIDTH-1;
                        this.chunks[idx].position.z = pos.z*WIDTH-1;
                        chunk.dirty = false;
                        scene.add(this.chunks[idx]);
                        count++;
                        if (count >= limit) {
                            return;
                        }
                    }
                }
            }
        }
    }

    fill(gen, chunkCache) {
        for (let x = 0; x < this.size.x; x++) {
            for (let y = 0; y < this.size.y; y++) {
                for (let z = 0; z < this.size.z; z++) {
                    chunkCache.addChunk(gen.getChunk(new Vector3(x+this.offset.x, y+this.offset.y, z+this.offset.z)));
                }
            }
        }
        for (let x = 0; x < this.size.x; x++) {
            for (let y = 0; y < this.size.y; y++) {
                for (let z = 0; z < this.size.z; z++) {
                    let pos = new Vector3(x + this.offset.x, y + this.offset.y, z + this.offset.z)
                    let chunk = chunkCache.getChunk(pos);
                    if (chunk) {
                        let idx = x + y*this.size.x + z * this.size.x * this.size.y;
                        this.chunks[idx] = this.buildChunk(chunkCache, pos);
                        this.chunks[idx].position.x = pos.x*WIDTH-1;
                        this.chunks[idx].position.y = pos.y*WIDTH-1;
                        this.chunks[idx].position.z = pos.z*WIDTH-1;
                    }
                }
            }
        }
    }

    addToScene(scene) {
        for (let x = 0; x < this.chunks.length; x++) {
            scene.add(this.chunks[x]);
        }
    }


    buildChunk(cache, pos) {
        let chunk = cache.getChunk(pos);
        if (chunk) {
            chunk.dirty = false;
        }
        let sp2 = WIDTH + 2;
        let extChunk = new Array(sp2*sp2*sp2);
        let light = new Array(sp2*sp2*sp2);
        let lowPos = pos.clone().multiplyScalar(WIDTH);
        for (let x = lowPos.x-1; x < lowPos.x+WIDTH+1; x++) {
            let rx = x - lowPos.x + 1;
            for (let y = lowPos.y-1; y < lowPos.y+WIDTH+1; y++) {
                let ry = y - lowPos.y + 1;
                for (let z = lowPos.z-1; z < lowPos.z+WIDTH+1; z++) {
                    let rz = z - lowPos.z + 1;
                    let val = 1
                    let cx = Math.floor(x / WIDTH);
                    let cy = Math.floor(y / WIDTH);
                    let cz = Math.floor(z / WIDTH);
                    let ch = cache.getChunk(new Vector3(cx, cy, cz));
                    if (ch) {
                        val = ch.data[posMod(x,WIDTH)+posMod(y,WIDTH)*WIDTH+posMod(z,WIDTH)*WIDTH*WIDTH];
                    }
                    let idx = rx+ry*sp2+rz*sp2*sp2;
                    extChunk[idx] = blockTypes[val];
                    if (val) {
                        light[idx] = 0;
                    } else {
                        if (y >= cache.getHeight(x, z)) {
                            light[idx] = 1;
                        } else {
                            light[idx] = 0.5;
                        }
                    }

                }
            }
        }
        /*
        let chunk = cache.getChunk(pos);
        for (let x = 0; x < WIDTH; x++) {
            for (let y = 0; y < WIDTH; y++) {
                for (let z = 0; z < WIDTH; z++) {
                    extChunk[x+1+(y+1)*sp2+(z+1)*sp2*sp2] = blockTypes[chunk.data[x+y*WIDTH+z*WIDTH*WIDTH]];
                }
            }
        }

        let chunkLeft = cache.getChunk(pos);
        if (chunkLeft) {
            for (let y = 0; y < WIDTH; y++) {
                for (let z = 0; z < WIDTH; z++) {
                    extChunk[(y+1)*sp2+(z+1)*sp2*sp2] = blockTypes[chunkLeft.data[WIDTH-1+y*WIDTH+z*WIDTH*WIDTH]];
                }
            }
        }

        let chunkRight = cache.getChunk(pos);
        if (chunkRight) {
            for (let y = 0; y < WIDTH; y++) {
                for (let z = 0; z < WIDTH; z++) {
                    extChunk[WIDTH+1+(y+1)*sp2+(z+1)*sp2*sp2] = blockTypes[chunkRight.data[y*WIDTH+z*WIDTH*WIDTH]];
                }
            }
        }

        let chunkUp = cache.getChunk(pos);
        if (chunkUp) {
            for (let x = 0; x < WIDTH; x++) {
                for (let z = 0; z < WIDTH; z++) {
                    extChunk[x+1+(z+1)*sp2*sp2] = blockTypes[chunkUp.data[x+(WIDTH-1)*WIDTH+z*WIDTH*WIDTH]];
                }
            }
        }

        let chunkDown = cache.getChunk(pos);
        if (chunkDown) {
            for (let x = 0; x < WIDTH; x++) {
                for (let z = 0; z < WIDTH; z++) {
                    extChunk[x+1+(WIDTH+1)*sp2+(z+1)*sp2*sp2] = blockTypes[chunkDown.data[x+z*WIDTH*WIDTH]];
                }
            }
        }

        let chunkFront = cache.getChunk(pos);
        if (chunkFront) {
            for (let x = 0; x < WIDTH; x++) {
                for (let y = 0; y < WIDTH; y++) {
                    extChunk[x+1+(y+1)*sp2] = blockTypes[chunkFront.data[x+(WIDTH-1)*WIDTH+z*WIDTH*WIDTH]];
                }
            }
        }

        */
        
        return builder.newBlockMesh(extChunk, WIDTH+2, WIDTH+2, WIDTH+2, light);
    }
}