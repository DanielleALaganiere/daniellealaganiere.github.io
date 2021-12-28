// Shaders (GLSL)
let VSHADER=`
    precision mediump float;
    attribute vec3 a_Position;
    attribute vec3 a_Normal;

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_NormalMatrix;

    uniform vec3 u_Color;
    uniform vec3 u_lightColor;
    uniform vec3 u_lightDirection;

    varying vec4 v_Color;

    void main() {
        vec3 lightDir = normalize(u_lightDirection);

        // Transfoming the normal vector to handle object transormations
        vec3 normal = normalize(u_NormalMatrix * vec4(a_Normal, 1.0)).xyz;

        // Calculates the diffuse light (flat shading)
        float nDotL = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = u_lightColor * u_Color * nDotL;

        v_Color = vec4(diffuse, 1.0);

        gl_Position = u_ModelMatrix * vec4(a_Position, 1.0);
    }
`;

let FSHADER=`
    precision mediump float;
    uniform vec3 u_Color;
    varying vec4 v_Color;

    void main() {
        gl_FragColor = v_Color;
    }
`;

let modelMatrix = new Matrix4();
let normalMatrix = new Matrix4();

// Cubes in the world
let lightRotate = new Matrix4();
let lightDirection = new Vector3([0.0, 1.0, -1.0]);
let cubes = [];

// Uniform locations
let u_ModelMatrix = null;
let u_NormalMatrix = null;
let u_Color = null;
let u_lightColor = null;
let u_lightDirection = null;

function drawCube(cube) {
    // Update model matrix combining translate, rotate and scale from cube
    modelMatrix.setIdentity();

    // Apply rotations for this part of the animal
    modelMatrix.rotate(cube.rotate[0], 1, 0, 0);
    modelMatrix.rotate(cube.rotate[1], 0, 1, 0);
    modelMatrix.rotate(cube.rotate[2], 0, 0, 1);

    // Apply translation for this part of the animal
    modelMatrix.translate(cube.translate[0], cube.translate[1], cube.translate[2]);

    // Apply scaling for this part of the animal
    modelMatrix.scale(cube.scale[0], cube.scale[1], cube.scale[2]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Compute normal matrix N_mat = (M^-1).T
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Set u_Color variable from fragment shader
    gl.uniform3f(u_Color, cube.color[0], cube.color[1], cube.color[2]);

    // Send vertices and indices from cube to the shaders
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);

    // Draw cube
    let solid = document.getElementById("solid").value;
    if (solid == "flat_shading") {
      gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    else if (solid == "wireframe") {
      gl.drawElements(gl.LINE_LOOP, cube.indices.length, gl.UNSIGNED_SHORT, 0);
    }

}

function initBuffer(attibuteName, n) {
    let shaderBuffer = gl.createBuffer();
    if(!shaderBuffer) {
        console.log("Can't create buffer.")
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, shaderBuffer);

    let shaderAttribute = gl.getAttribLocation(gl.program, attibuteName);
    gl.vertexAttribPointer(shaderAttribute, n, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderAttribute);

    return shaderBuffer;
}

cubeAngle = 0.0;
function draw() {
    // Draw frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    lightDirection = new Vector3([0.0, 0.0, -4.0]);

    for(let cube of cubes) {
        drawCube(cube);
    }

    requestAnimationFrame(draw);
}

function addCube(color) {
    // Create a new cube
    let cube = new Cube(color);
    cubes.push(cube);

    let cubeOption = document.createElement("option");
    cubeOption.text = "Cube " + cubes.length;
    cubeOption.value = cubes.length - 1;

    return cube;
}

function addCylinder(color, endcaps) {
  //create a new cylinder
  let cylinder = new Cylinder(color, endcaps);
  cubes.push(cylinder);

  let cubeOption = document.createElement("option");
  cubeOption.text = "Cylinder " + cubes.length;
  cubeOption.value = cubes.length - 1;

  return cylinder;
}

function onRotationInputX(value) {
    // Rotate all of the cubes
    for (i=0;i<cubes.length;i++){
      let selectedCube = cubes[i];
      //rotate around the y axis
      selectedCube.setRotateX(value);
    }
}

function onRotationInputY(value) {
    // Rotate all of the cubes
    for (i=0;i<cubes.length;i++){
      let selectedCube = cubes[i];
      //rotate around the y axis
      selectedCube.setRotateY(value);
    }
}



function main() {
    // Retrieving the canvas tag from html document
    canvas = document.getElementById("canvas");

    // Get the rendering context for 2D drawing
    gl = canvas.getContext("webgl");
    if(!gl) {
        console.log("Failed to get webgl context");
        return -1;
    }

    // Clear screen to white
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compiling both shaders and sending them to the GPU
    if(!initShaders(gl, VSHADER, FSHADER)) {
        console.log("Failed to initialize shaders.");
        return -1;
    }

    // Retrieve uniforms from shaders
    u_Color = gl.getUniformLocation(gl.program, "u_Color");
    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    u_lightColor = gl.getUniformLocation(gl.program, "u_lightColor");
    u_lightDirection = gl.getUniformLocation(gl.program, "u_lightDirection");

    //adding new cubes to the screen:
    let back = addCube([0.7, 0.5, 0.4]);   //brown color
    back.setTranslate(0.0, 0.0, 0.02);
    back.setScale(0.6, 0.8, 0.02);

    let left_side = addCube([0.8, 0.6, 0.5]);
    left_side.setTranslate(0.58, 0.0, -0.2);
    left_side.setScale(0.02, 0.8, 0.2);

    let right_side = addCube([0.8, 0.6, 0.5]);
    right_side.setTranslate(-0.58, 0.0, -0.2);
    right_side.setScale(0.02, 0.8, 0.2);

    let top = addCube([0.8, 0.6, 0.5]);
    top.setTranslate(0, 0.78, -0.2);
    top.setScale(0.58, 0.02, 0.2);

    let bottom = addCube([0.8, 0.6, 0.5]);
    bottom.setTranslate(0, -0.78, -0.2);
    bottom.setScale(0.58, 0.02, 0.2);

    let back_left_foot = addCylinder([1.0, 1.0, 1.0], "yes");
    back_left_foot.setTranslate(-0.57, -0.83, -0.01);
    back_left_foot.setScale(0.03, 0.03, 0.03);

    let back_right_foot = addCylinder([1.0, 1.0, 1.0], "yes");
    back_right_foot.setTranslate(0.57, -0.83, -0.01);
    back_right_foot.setScale(0.03, 0.03, 0.03);

    let front_left_foot = addCylinder([1.0, 1.0, 1.0], "yes");
    front_left_foot.setTranslate(-0.57, -0.83, -0.37);
    front_left_foot.setScale(0.03, 0.03, 0.03);

    let front_right_foot = addCylinder([1.0, 1.0, 1.0], 'yes');
    front_right_foot.setTranslate(0.57, -0.83, -0.37);
    front_right_foot.setScale(0.03, 0.03, 0.03);

    let top_shelve = addCube([0.8, 0.6, 0.5]);    //shelves are a lighter brown
    top_shelve.setTranslate(0, 0.4, -0.18);
    top_shelve.setScale(0.58, 0.02, 0.18);

    let middle_shelve = addCube([0.8, 0.6, 0.5]);
    middle_shelve.setTranslate(0, 0.0, -0.18);
    middle_shelve.setScale(0.58, 0.02, 0.18);

    let bottom_shelve = addCube([0.8, 0.6, 0.5]);
    bottom_shelve.setTranslate(0, -0.4, -0.18);
    bottom_shelve.setScale(0.58, 0.02, 0.18);

    let top_book1 = addCube([0.0, 0.0, 0.2]);
    top_book1.setTranslate(-0.3, 0.44, -0.16);
    top_book1.setScale(0.18, 0.02, 0.16);

    let top_book2 = addCube([0.0, 0.0, 0.8]);
    top_book2.setTranslate(-0.3, 0.48, -0.15);
    top_book2.setScale(0.17, 0.025, 0.15);

    let top_book3 = addCube([0.4, 0.4, 0.9]);
    top_book3.setTranslate(-0.32, 0.526, -0.15);
    top_book3.setScale(0.16, 0.024, 0.15);

    let top_book4 = addCube([0.6, 0.6, 0.8]);
    top_book4.setTranslate(-0.30, 0.57, -0.14);
    top_book4.setScale(0.16, 0.022, 0.14);

    let top_book5 = addCube([0.0, 0.3, 0.0]);
    top_book5.setTranslate(0.2, 0.57, -0.15);
    top_book5.setScale(0.022, 0.15, 0.15);

    let top_book6 = addCube([0.0, 0.5, 0.2]);
    top_book6.setTranslate(0.25, 0.57, -0.16);
    top_book6.setScale(0.022, 0.16, 0.16);

    let top_book7 = addCube([0.0, 0.7, 0.5]);
    top_book7.setTranslate(0.30, 0.57, -0.15);
    top_book7.setScale(0.022, 0.17, 0.15);

    let top_book8 = addCube([0.1, 0.5, 0.4]);
    top_book8.setTranslate(0.35, 0.57, -0.14);
    top_book8.setScale(0.022, 0.17, 0.14);

    let top_book9 = addCube([0.2, 0.7, 0.5]);
    top_book9.setTranslate(0.40, 0.57, -0.15);
    top_book9.setScale(0.022, 0.15, 0.15);

    let top_book10 = addCube([0.0, 0.2, 0.1]);
    top_book10.setTranslate(0.045, 0.585, -0.15);
    top_book10.setScale(0.025, 0.15, 0.15);
    top_book10.setRotateZ(-8);


    let middle_book1 = addCube([0.7, 0.0, 0.0]);
    middle_book1.setTranslate(0, 0.16, -0.17);
    middle_book1.setScale(0.02, 0.16, 0.17);

    let middle_book2 = addCube([0.45, 0.0, 0.0]);
    middle_book2.setTranslate(0.06, 0.165, -0.15);
    middle_book2.setScale(0.03, 0.165, 0.15);

    let middle_book3 = addCube([0.3, 0.0, 0.0]);
    middle_book3.setTranslate(0.17, 0.14, -0.16);
    middle_book3.setScale(0.03, 0.145, 0.16);
    middle_book3.setRotateZ(10);

    let middle_book4 = addCube([0.0, 0.0, 0.0]);
    middle_book4.setTranslate(0.27, 0.09, -0.15);
    middle_book4.setScale(0.02, 0.16, 0.15);
    middle_book4.setRotateZ(20);

    let planter_body = addCylinder([0.88, 0.45, 0.35], "yes");
    planter_body.setTranslate(-0.2, -0.38, -0.2);
    planter_body.setScale(0.1, 0.12, 0.1);

    let planter_lip = addCylinder([0.88, 0.45, 0.35], "yes");
    planter_lip.setTranslate(-0.2, -0.28, -0.2);
    planter_lip.setScale(0.11, 0.05, 0.11);

    let dirt = addCylinder([0.40, 0.26, 0.13], "yes");
    dirt.setTranslate(-0.2, -0.249, -0.2);
    dirt.setScale(0.1, 0.02, 0.1);

    let plant = addCylinder([0.2, 1.0, 0.2], "yes");
    plant.setTranslate(-0.2, -0.249, -0.2);
    plant.setScale(0.02, 0.1, 0.02);

    let leaf1 = addCube([0.2, 1.0, 0.2]);
    leaf1.setTranslate(-0.17, -0.14, -0.2);
    leaf1.setScale(0.04, 0.04, 0.01);
    leaf1.setRotateZ(10);

    let leaf2 = addCube([0.2, 1.0, 0.2]);
    leaf2.setTranslate(-0.24, -0.14, -0.2);
    leaf2.setScale(0.04, 0.04, 0.01);
    leaf2.setRotateZ(-7);

    let trash_can = addCylinder([0.8, 0.8, 0.8], "no");
    trash_can.setTranslate(-0.6, -0.83, -0.65);
    trash_can.setScale(0.17, 0.35, 0.17);

    let trash_can_bottom = addCylinder([0.8, 0.8, 0.8], "yes");
    trash_can_bottom.setTranslate(-0.6, -0.83, -0.65);
    trash_can_bottom.setScale(0.17, 0.01, 0.17);

    //adding soda cans to the bottom shelf:
    //xcoord, zcoord
    add_soda_can((0.17), (-0.18));
    add_soda_can((0.17), (-0.3));
    add_soda_can((0.29), (-0.18));
    add_soda_can((0.29), (-0.3));
    add_soda_can((0.41), (-0.18));
    add_soda_can((0.41), (-0.3));

    vertexBuffer = initBuffer("a_Position", 3);
    normalBuffer = initBuffer("a_Normal", 3);

    indexBuffer = gl.createBuffer();
    if(!indexBuffer) {
        console.log("Can't create buffer.")
        return -1;
    }

    // Set light data
    gl.uniform3f(u_lightColor, 1.0, 1.0, 1.0);
    gl.uniform3fv(u_lightDirection, lightDirection.elements);

    draw();
}

function add_soda_can(xcoord, zcoord){
  let soda_can_top = addCylinder([0.8, 0.8, 0.8], "yes");
  soda_can_top.setTranslate(xcoord, -0.60, zcoord);
  soda_can_top.setScale(0.04, 0.01, 0.04);

  let soda_can_middle = addCylinder([0.1, 0.7, 0.7], "yes");
  soda_can_middle.setTranslate(xcoord, -0.75, zcoord);
  soda_can_middle.setScale(0.05, 0.15, 0.05);

  let soda_can_bottom = addCylinder([0.8, 0.8, 0.8], "yes");
  soda_can_bottom.setTranslate(xcoord, -0.75, zcoord);
  soda_can_bottom.setScale(0.04, -0.01, 0.04);
}
