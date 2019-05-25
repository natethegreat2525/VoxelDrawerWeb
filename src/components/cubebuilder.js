import * as THREE from 'three';

export function newBlockMesh(array, w, h, d, light) {
    let idx = gidx(w, h, d);
    let idx3 = gidx(3, 3, 3);
    if (!light) {
        light = new Array(w * h * d);
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                for (let k = 0; k < d; k++) {
                    light[idx(i, j, k)] = array[idx(i, j, k)] ? 0 : 1;
                }
            }
        }
    }
    let geom = new THREE.Geometry();
    for (let i = 1; i < w-1; i++) {
        for (let j = 1; j < h-1; j++) {
            for (let k = 1; k < d-1; k++) {
                if (array[idx(i, j, k)]) {
                    let localLight = [];
                    for (let a = -1; a < 2; a++) {
                        for (let b = -1; b < 2; b++) {
                            for (let c = -1; c < 2; c++) {
                                localLight.push(light[idx(i+a, j+b, k+c)]);
                            }
                        }
                    }
                    addCube(
                        geom,
                        new THREE.Vector3(i, j, k),
                        [!array[idx(i, j, k-1)], !array[idx(i, j, k+1)], !array[idx(i, j-1, k)], !array[idx(i, j+1, k)], !array[idx(i-1, j, k)], !array[idx(i+1, j, k)]],
                        localLight,
                        array[idx(i, j, k)],
                        idx3
                        );
                }
            }
        }
    }
    
    geom.computeFaceNormals();

    let material = new THREE.MeshBasicMaterial(
        {
            vertexColors: THREE.VertexColors,
        }
    );

    let obj = new THREE.Mesh(
        geom,
        material,
    );
    return obj;
}

export function gidx(w, h, d) {
    return (x, y, z) => (x + y*w + z*w*h);
}

export function addCube(geom, offs, faces, localLight, color, idx3) {
    const cubeFaceArr = [[0, 0], [1, 0], [1, 1], [0, 1]];
    let makeFace = (cb, axis, pairity) => {
        let base = geom.vertices.length;
        geom.vertices.push(...cubeFaceArr.map(cb));
        //crazy light logic
        let color0 = new THREE.Color(color);
        let color1 = new THREE.Color(color);
        let color2 = new THREE.Color(color);
        let color3 = new THREE.Color(color);
        let black = new THREE.Color('#000000');

        let totLight = new Array(4).fill(0);

        let i = 0;
        for (let a = 0; a < 2; a++) {
            for (let b = 0; b < 2; b++) {
                let sum = 0;
                for (let c = a; c < a+2; c++) {
                    for (let d = b; d < b+2; d++) {
                        let x = c;
                        let y = d;
                        let z = pairity+1;
                        if (pairity === -1) {
                            let tmp = x;
                            x = y;
                            y = tmp;
                        }
                        if (axis === 1) {
                            let tmp = x;
                            x = y;
                            y = z;
                            z = tmp;
                        }
                        if (axis === 0) {
                            let tmp = x;
                            x = z;
                            z = y;
                            y = tmp;
                        }
                       
                        sum += localLight[idx3(z, y, x)];
                    }
                }
                totLight[i] = 1-sum/4.0;
                i++;
            }
        }
        color0.lerp(black, totLight[0]);
        color1.lerp(black, totLight[2]);
        color2.lerp(black, totLight[3]);
        color3.lerp(black, totLight[1]);

        //end crazy light logic

        if (totLight[0] + totLight[3] < totLight[2] + totLight[1]) {
            geom.faces.push(new THREE.Face3(base, base+1, base+2), new THREE.Face3(base, base+2, base+3));
            geom.faces[geom.faces.length-1].vertexColors = [color0, color2, color3];
            geom.faces[geom.faces.length-2].vertexColors = [color0, color1, color2];
        } else {
            geom.faces.push(new THREE.Face3(base, base+1, base+3), new THREE.Face3(base+1, base+2, base+3));
            geom.faces[geom.faces.length-1].vertexColors = [color1, color2, color3];
            geom.faces[geom.faces.length-2].vertexColors = [color0, color1, color3];
        }
    };

    if (faces[0]) {
        makeFace(v => (new THREE.Vector3(v[1], v[0], 0)).add(offs), 2, -1);
    }
    if (faces[1]) {
        makeFace(v => (new THREE.Vector3(v[0], v[1], 1)).add(offs), 2, 1);
    }
    if (faces[2]) {
        makeFace(v => (new THREE.Vector3(v[0], 0, v[1])).add(offs), 1, -1);
    }
    if (faces[3]) {
        makeFace(v => (new THREE.Vector3(v[1], 1, v[0])).add(offs), 1, 1);
    }
    if (faces[4]) {
        makeFace(v => (new THREE.Vector3(0, v[1], v[0])).add(offs), 0, -1);
    }
    if (faces[5]) {
        makeFace(v => (new THREE.Vector3(1, v[0], v[1])).add(offs), 0, 1);
    }
}