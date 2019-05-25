import { LinkedList } from './engine/linkedlist';
import * as THREE from 'three';
import { posMod } from './blocktypes';
import { Vector3 } from 'three';

export class ChunkCache {
    constructor(capacity) {
        this.capacity = capacity || 2000;
        this.cache = new LinkedList();
        this.map = {};
        this.heightMap = {};
    }

    addChunk(chunk) {
        let str = this.coordToString(chunk.pos);
        if (this.map[str]) {
            this.map[str].value = chunk;
            this.getChunk(chunk.pos);
            this.updateHeightsForChunk(chunk);
            return;
        }
        this.cache.unshift(chunk);
        this.updateHeightsForChunk(chunk);
        this.map[this.coordToString(chunk.pos)] = this.cache.peekFirst(true);
        if (this.cache.len > this.capacity) {
            delete this.map[this.coordToString(this.cache.pop().pos)];
        }
    }

    updateHeightsForChunk(chunk) {
        let heightChunk = this.heightMap[chunk.pos.x + ',' + chunk.pos.z];
        if (!heightChunk) {
            heightChunk = new Uint16Array(WIDTH*WIDTH);
            this.heightMap[chunk.pos.x + ',' + chunk.pos.z] = heightChunk;
        }

        for (let i = 0; i < WIDTH; i++) {
            for (let j = 0; j < WIDTH; j++) {
                for (let k = 0; k < WIDTH; k++) {
                    if (chunk.data[i + j*WIDTH + k*WIDTH*WIDTH]) {
                        heightChunk[i + k*WIDTH] = Math.max(heightChunk[i + k*WIDTH], j + chunk.pos.y * WIDTH);
                    }
                }
            }
        }
    }

    getHeight(x, z) {
        let v = new THREE.Vector3(
            posMod(Math.floor(x), WIDTH),
            0,
            posMod(Math.floor(z), WIDTH),
        );

        let cv = {
            x: Math.floor(x/WIDTH),
            z: Math.floor(z/WIDTH),
        };

        let heightMap = this.heightMap[cv.x + ',' + cv.z];
        if (!heightMap) {
            return;
        }

        return heightMap[v.x + v.z * WIDTH];
    }

    getBlockValue(coords) {
        let v = new THREE.Vector3(
            posMod(Math.floor(coords.x), WIDTH),
            posMod(Math.floor(coords.y), WIDTH),
            posMod(Math.floor(coords.z), WIDTH),
        );

        let cv = {
            x: Math.floor(coords.x/WIDTH),
            y: Math.floor(coords.y/WIDTH),
            z: Math.floor(coords.z/WIDTH),
        };

        let chunk = this.getChunk(cv);
        if (!chunk) {
            return;
        }

        return chunk.data[v.x + v.y * WIDTH + v.z * WIDTH * WIDTH];
    }

    setBlockValue(coords, value, addOptChunk) {
        let v = new THREE.Vector3(
            posMod(Math.floor(coords.x), WIDTH),
            posMod(Math.floor(coords.y), WIDTH),
            posMod(Math.floor(coords.z), WIDTH),
        );

        let cv = {
            x: Math.floor(coords.x/WIDTH),
            y: Math.floor(coords.y/WIDTH),
            z: Math.floor(coords.z/WIDTH),
        };

        let chunk = this.getChunk(cv);
        if (!chunk) {
            if (!addOptChunk) {
                return;
            }
            chunk = new Chunk(new THREE.Vector3(cv.x, cv.y, cv.z));
            this.addChunk(chunk);
        }
        let idx = v.x + v.y * WIDTH + v.z * WIDTH * WIDTH;
        let heightChunk = this.heightMap[cv.x + ',' + cv.z];
        if (!chunk.data[idx] && value) {
            heightChunk[v.x + v.z*WIDTH] = Math.max(heightChunk[v.x + v.z*WIDTH], coords.y);
        }
        if (chunk.data[idx] && !value && coords.y === heightChunk[v.x + v.z*WIDTH]) {
            for (let i = coords.y-1; i >= 0; i--) {
                heightChunk[v.x + v.z*WIDTH] = i;
                if (this.getBlockValue(new THREE.Vector3(coords.x, i, coords.z))) {
                    break;
                }
            }
        }
        chunk.data[idx] = value;
        chunk.dirty = true;
        if (v.x === 0) {
            let co = this.getChunk({x: cv.x-1, y: cv.y, z: cv.z});
            if (co) {
                co.dirty = true;
            }
        }
        if (v.y === 0) {
            let co = this.getChunk({x: cv.x, y: cv.y-1, z: cv.z});
            if (co) {
                co.dirty = true;
            }
        }
        if (v.z === 0) {
            let co = this.getChunk({x: cv.x, y: cv.y, z: cv.z-1});
            if (co) {
                co.dirty = true;
            }
        }
        if (v.x === WIDTH-1) {
            let co = this.getChunk({x: cv.x+1, y: cv.y, z: cv.z});
            if (co) {
                co.dirty = true;
            }
        }
        if (v.y === WIDTH-1) {
            let co = this.getChunk({x: cv.x, y: cv.y+1, z: cv.z});
            if (co) {
                co.dirty = true;
            }
        }
        if (v.z === WIDTH-1) {
            let co = this.getChunk({x: cv.x, y: cv.y, z: cv.z+1});
            if (co) {
                co.dirty = true;
            }
        }
    }

    rayCastOld(pos, dir, stepDist, steps) {
        let cur = new THREE.Vector3(pos.x, pos.y, pos.z);
        let stepDir = dir.clone().normalize().multiplyScalar(stepDist);
        for (let i = 0; i <= steps; i++) {
            let whole = new THREE.Vector3(Math.floor(cur.x), Math.floor(cur.y), Math.floor(cur.z));
            let val = this.getBlockValue(whole);
            if (val) {
                return {position: cur, blockPosition: whole, value: val};
            }
            cur = cur.add(stepDir);
        }
    }

    rayCast(pos, dir, maxDist) {
        let curBlock = {
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            z: Math.floor(pos.z),
        }
        let dirBlock = {
            x: dir.x > 0 ? 1 : -1,
            y: dir.y > 0 ? 1 : -1,
            z: dir.z > 0 ? 1 : -1,
        }
        let curPos = pos.clone();
        let getTimeX, getTimeY, getTimeZ;
        if (dir.x > 0) {
            getTimeX = () => dir.x === 0 ? Infinity : (curBlock.x+1 - curPos.x) / dir.x;
        } else {
            getTimeX = () => dir.x === 0 ? Infinity : (curBlock.x - curPos.x) / dir.x;
        }
        if (dir.y > 0) {
            getTimeY = () => dir.y === 0 ? Infinity : (curBlock.y+1 - curPos.y) / dir.y;
        } else {
            getTimeY = () => dir.y === 0 ? Infinity : (curBlock.y - curPos.y) / dir.y;
        }
        if (dir.z > 0) {
            getTimeZ = () => dir.z === 0 ? Infinity : (curBlock.z+1 - curPos.z) / dir.z;
        } else {
            getTimeZ = () => dir.z === 0 ? Infinity : (curBlock.z - curPos.z) / dir.z;
        }
        let incPos = (time) => {
            curPos.x += dir.x*time;
            curPos.y += dir.y*time;
            curPos.z += dir.z*time;            
        }
        let normal = new THREE.Vector3();
        for (let i = 0; i < maxDist*3; i++) {
            //check current block
            let val = this.getBlockValue(curBlock);
            if (val) {
                if (curPos.distanceTo(pos) <= maxDist) {
                    return {position: curPos, blockPosition: curBlock, value: val, normal: normal};
                }
                return null;
            }

            //move forward
            let tx = getTimeX();
            let ty = getTimeY();
            let tz = getTimeZ();
            if (tx < ty && tx < tz) {
                incPos(tx);
                curBlock.x += dirBlock.x;
                normal = new THREE.Vector3(-dirBlock.x, 0, 0);
            } else if (ty < tz) {
                incPos(ty);
                curBlock.y += dirBlock.y;
                normal = new THREE.Vector3(0, -dirBlock.y, 0);
            } else {
                incPos(tz);
                curBlock.z += dirBlock.z;
                normal = new THREE.Vector3(0, 0, -dirBlock.z);
            }
        }
        return null;
    }

    getChunk(coords) {
        let str = this.coordToString(coords);
        let node = this.map[str];
        if (node) {
            this.cache.remove(node);
            this.cache.unshift(node.value);
            let newNode = this.cache.peekFirst(true);
            this.map[str] = newNode;
            return newNode.value;
        }
        return null;
    }

    coordToString(p) {
        return p.x + ',' + p.y + ',' + p.z;
    }
}

export const WIDTH = 16;

export class Chunk {

    constructor(pos) {
        this.pos = pos;
        this.dirty = true;
        this.data = new Uint16Array(WIDTH*WIDTH*WIDTH);
    }
}

export class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}