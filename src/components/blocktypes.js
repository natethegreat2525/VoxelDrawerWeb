import * as THREE from "three";

export let blockTypes = [null, new THREE.Color(0x666666)];

export function posMod(val, m) {
    let v = val % m;
    if (v < 0) {
        v += m;
    }
    return v;
}