import { Chunk } from "./blockworld";


export class Empty {
    constructor(width) {
        this.width = width;
    }

    getChunk(pos) {
        let chunk = new Chunk(pos);
        let w2 = this.width * this.width;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.width; y++) {
                for (let z = 0; z < this.width; z++) {
                    chunk.data[x + y * this.width + z * w2] = 0;
                }
            }
        }
        return chunk;
    }
}
