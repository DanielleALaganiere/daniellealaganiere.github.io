class Cube {
    //    v0----- v1
    //   /|      /|
    //  v6------v5|
    //  | |     | |
    //  | |v2---|-|v3
    //  |/      |/
    //  v7------v4
    constructor(color) {
        this.vertices = new Float32Array([   // Coordinates
             1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
             1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
             1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
            -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
            -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
             1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
          ]);

          this.normals = new Float32Array([    // Normal
           0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
           1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
           0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
          -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
           0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
           0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
         ]);

          // Indices of the vertices
          this.indices = new Uint16Array([
             0, 1, 2,   0, 2, 3,    // front
             4, 5, 6,   4, 6, 7,    // right
             8, 9,10,   8,10,11,    // up
            12,13,14,  12,14,15,    // left
            16,17,18,  16,18,19,    // down
            20,21,22,  20,22,23     // back
         ]);

        this.color = color;

        this.translate   = [0.0, 0.0, 0.0];
        this.rotate      = [0.0, 0.0, 0.0];
        this.scale       = [1.0, 1.0, 1.0];
    }

    setScale(x, y, z) {
        this.scale[0] = x;
        this.scale[1] = y;
        this.scale[2] = z;
    }

    setRotateX(x) {
        this.rotate[0] = x;
    }
    setRotateY(y) {
        this.rotate[1] = y;
    }
    setRotateZ(z) {
        this.rotate[2] = z;
    }

    setTranslate(x, y, z) {
        this.translate[0] = x;
        this.translate[1] = y;
        this.translate[2] = z;
    }
}
