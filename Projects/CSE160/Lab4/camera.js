class Camera {
    constructor(cameraType) {
        this.near = 0.1;
        this.far = 1000;
        this.fov = 60;

        this.eye = new Vector3([0, 0, 5]);
        this.center = new Vector3([0, 0, 0]);
        this.up = new Vector3([0, 1, 0]);

        this.projMatrix = new Matrix4();
        if(cameraType == "perspective") {
            this.projMatrix.setPerspective(this.fov, canvas.width/canvas.height, this.near, this.far);
        }
        else if(cameraType == "orthographic") {
            this.projMatrix.setOrtho(-1, 1, -1, 1, this.near, this.far)
        }

        this.viewMatrix = new Matrix4();
        this.updateView();
    }

    moveForward(scale) {
        // Compute forward vector
        let forward = new Vector3(this.center.elements);
        forward.sub(this.eye);
        forward.normalize();
        forward.mul(scale);

        // Add forward vector to eye and center
        this.eye.add(forward);
        this.center.add(forward);

        this.updateView();
    }

    zoom(scale) {
        this.projMatrix.setPerspective(this.fov * scale, canvas.width/canvas.height, this.near, this.far);
    }

    pan(angle) {
        // Rotate center point around the up vector
        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(angle, this.up.elements[0],
                                   this.up.elements[1],
                                   this.up.elements[2]);

       // Compute forward vector
       let forward = new Vector3(this.center.elements);
       forward.sub(this.eye);

       // Rotate forward vector around up vector
       let forward_prime = rotMatrix.multiplyVector3(forward);
       this.center.set(forward_prime);

       this.updateView();
    }

    updateView() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0],
            this.eye.elements[1],
            this.eye.elements[2],
            this.center.elements[0],
            this.center.elements[1],
            this.center.elements[2],
            this.up.elements[0],
            this.up.elements[1],
            this.up.elements[2]
        );
    }
}
