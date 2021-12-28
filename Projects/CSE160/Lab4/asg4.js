// Shaders (GLSL)
// https://en.wikipedia.org/wiki/Phong_reflection_model
let VSHADER=`
    precision mediump float;
    attribute vec3 a_Position;
    attribute vec3 a_Normal;

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_NormalMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjMatrix;

    uniform vec3 u_Color;
    uniform vec3 u_ambientColor;
    uniform vec3 u_diffuseColor1;
    uniform vec3 u_diffuseColor2;
    uniform vec3 u_specularColor;
    uniform float u_specularAlpha;

    uniform vec3 u_eyePosition;
    uniform vec3 u_lightPosition;
    uniform vec3 u_lightDirection;

    varying vec4 v_Color;

    vec3 calcAmbient() {
        return u_ambientColor * u_Color;
    }

    vec3 calcDiffuse(vec3 l, vec3 n, vec3 lColor) {
        float nDotL = max(dot(l, n), 0.0);
        return lColor * u_Color * nDotL;
    }

    vec3 calcSpecular(vec3 r, vec3 v) {
        float rDotV = max(dot(r, v), 0.0);
        float rDotVPowAlpha = pow(rDotV, u_specularAlpha);
        return u_specularColor * u_Color * rDotVPowAlpha;
    }

    void main() {
        // Mapping obj coord system to world coord system
        vec4 worldPos = u_ModelMatrix * vec4(a_Position, 1.0);

        vec3 n = normalize(u_NormalMatrix * vec4(a_Normal, 0.0)).xyz; // Normal

        vec3 l1 = normalize(u_lightPosition - worldPos.xyz); // Light direction 1
        vec3 l2 = normalize(u_lightDirection); // Light direction 2

        vec3 v = normalize(u_eyePosition - worldPos.xyz);   // View direction

        vec3 r1 = reflect(l1, n); // Reflected light direction
        vec3 r2 = reflect(l2, n); // Reflected light direction

        // Smooth shading (Goraud)
        vec3 ambient = calcAmbient();

        vec3 diffuse1 = calcDiffuse(l1, n, u_diffuseColor1);
        vec3 diffuse2 = calcDiffuse(l2, n, u_diffuseColor2);

        vec3 specular1 = calcSpecular(r1, v);
        vec3 specular2 = calcSpecular(r2, v);

        v_Color = vec4(ambient + (diffuse1 + diffuse2) + (specular1 + specular2), 1.0);

        gl_Position = u_ProjMatrix * u_ViewMatrix * worldPos;
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

let lightPosition = new Vector3([10.0, 0.0, 0]);
let lightDirection = new Vector3([1.0, 1.0, 0.0]);
let lightRotation = new Matrix4().setRotate(1, 0,0,1);

let truckPosition = new Vector3([-4, 0, 4]);

let models = [];

// Uniform locations
let u_ModelMatrix = null;
let u_NormalMatrix = null;
let u_ViewMatrix = null;
let u_ProjMatrix = null;

let u_Color = null;
let u_ambientColor = null;
let u_diffuseColor1 = null;
let u_diffuseColor2 = null;
let u_specularColor = null;
let u_specularAlpha = null;

let u_lightPosition = null;
let u_eyePosition = null;

function drawModel(model) {
    // Update model matrix combining translate, rotate and scale from cube
    modelMatrix.setIdentity();

    // Apply translation for this part of the animal
    modelMatrix.translate(model.translate[0], model.translate[1], model.translate[2]);

    // Apply rotations for this part of the animal
    modelMatrix.rotate(model.rotate[0], 1, 0, 0);
    modelMatrix.rotate(model.rotate[1], 0, 1, 0);
    modelMatrix.rotate(model.rotate[2], 0, 0, 1);

    // Apply scaling for this part of the animal
    modelMatrix.scale(model.scale[0], model.scale[1], model.scale[2]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Compute normal matrix N_mat = (M^-1).T
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Set u_Color variable from fragment shader
    gl.uniform3f(u_Color, model.color[0], model.color[1], model.color[2]);

    // Send vertices and indices from model to the shaders
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);

    // Draw model
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}

function onCubeCreation() {
    let cube2 = new Cube([0.0, 0.0, 1.0]);
    models.push(cube2);

    let newOption = document.createElement("option");
    newOption.text = "Cube " + models.length;
    newOption.value = models.length;
    let cubeSelect = document.getElementById('cubeSelect');
    cubeSelect.add(newOption);
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

function resetLightPosition(amount){
  lightPosition.elements[0] = 10*Math.cos(amount/100);
  lightPosition.elements[1] = -10*Math.sin(amount/100);
  lightPosition.elements[2] = 0;

}

function onRotationInput(value) {
    // Get the selected cube
    let selector = document.getElementById("cubeSelect");
    let selectedCube = models[selector.value];

    selectedCube.setRotate(0.0, value, 0.0);
}

function draw() {
    // Draw frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Rotate point light
    //makes it do it automatically
    //lightPosition = lightRotation.multiplyVector3(lightPosition);
    gl.uniform3fv(u_lightPosition, lightPosition.elements);
    pointLightSphere.setTranslate(-lightPosition.elements[0],
                                  -lightPosition.elements[1],
                                  -lightPosition.elements[2]);

    let xcoord = truckPosition.elements[0];
    let zcoord = truckPosition.elements[2];
    wheel1.setTranslate(xcoord+1,-0.6,zcoord);
    wheel2.setTranslate(xcoord+1,-0.6,zcoord+1);
    wheel3.setTranslate(xcoord-1,-0.6,zcoord);
    wheel4.setTranslate(xcoord-1,-0.6,zcoord+1);

    truckbed.setTranslate(xcoord+0.3,-0.55,zcoord+0.6);
    truckbody.setTranslate(xcoord-.25,.2,zcoord+0.6);
    truckhead.setTranslate(xcoord+1.45,0,zcoord+0.6);
    truckbumper.setTranslate(xcoord+1.9,-.3,zcoord+0.6);

    carwindow1.setTranslate(xcoord+1.5,0.22,zcoord-0.1);
    carwindow2.setTranslate(xcoord+1.5,0.22,zcoord+1.3);
    frontwindow.setTranslate(xcoord+1.85,0.1,zcoord+0.6);
    licenseplate.setTranslate(xcoord+2.2,-0.3,zcoord+0.6);

    // Update eye position in the shader
    gl.uniform3fv(u_eyePosition, camera.eye.elements);

    // Update View matrix in the shader
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

    // Update Projection matrix in the shader
    gl.uniformMatrix4fv(u_ProjMatrix, false, camera.projMatrix.elements);

    for(let m of models) {
        drawModel(m);
    }

    requestAnimationFrame(draw);
}

function addModel(color, shapeType) {
    let model = null;
    switch (shapeType) {
        case "cube":
            model = new Cube(color);
            break;
        case "sphere":
            model = new Sphere(color, 13);
            break;

        case "cylinder_no_endcaps_up":
            model = new Cylinder(color, "no", "up");
            break;

        case "cylinder_endcaps_up":
            model = new Cylinder(color, "yes", "up");
            break;

        case "cylinder_no_endcaps_side":
            model = new Cylinder(color, "no", "side");
            break;

        case "cylinder_endcaps_side":
            model = new Cylinder(color, "yes", "side");
            break;
    }

    if(model) {
        models.push(model);

        // Add an option in the selector
        let selector = document.getElementById("cubeSelect");
        let cubeOption = document.createElement("option");
        cubeOption.text = shapeType + " " + models.length;
        cubeOption.value = models.length - 1;
        selector.add(cubeOption);

        // Activate the cube we just created
        selector.value = cubeOption.value;
    }

    return model;
}

function onZoomInput(value) {
    console.log(1.0 + value/15);
    camera.zoom(1.0 + value/15);
}

function resetTruckPosition(Xvalue) {

    console.log(Xvalue);
    truckPosition.elements[0] = (Xvalue/100);
}

window.addEventListener("keydown", function(event) {
    let speed = 1.0;

    switch (event.key) {
        case "w":
            console.log("forward");
            camera.moveForward(speed);
            break;
        case "a":
            console.log("pan left");
            camera.pan(5);
            break;
        case "s":
            console.log("back");
            camera.moveForward(-speed);
            break;
        case "d":
            console.log("pan right");
            camera.pan(-5);
            break;
    }
});

window.addEventListener("mousemove", function(event) {
    // console.log(event.movementX, event.movementY);
})

function main() {
    // Retrieving the canvas tag from html document
    canvas = document.getElementById("canvas");

    // Get the rendering context for 2D drawing (vs WebGL)
    gl = canvas.getContext("webgl");
    if(!gl) {
        console.log("Failed to get webgl context");
        return -1;
    }

    // Clear screen
    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compiling both shaders and sending them to the GPU
    if(!initShaders(gl, VSHADER, FSHADER)) {
        console.log("Failed to initialize shaders.");
        return -1;
    }

    // Retrieve uniforms from shaders
    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
    u_ProjMatrix = gl.getUniformLocation(gl.program, "u_ProjMatrix");

    u_Color = gl.getUniformLocation(gl.program, "u_Color");
    u_ambientColor = gl.getUniformLocation(gl.program, "u_ambientColor");
    u_diffuseColor1 = gl.getUniformLocation(gl.program, "u_diffuseColor1");
    u_diffuseColor2 = gl.getUniformLocation(gl.program, "u_diffuseColor2");
    u_specularColor = gl.getUniformLocation(gl.program, "u_specularColor");
    u_specularAlpha = gl.getUniformLocation(gl.program, "u_specularAlpha");

    u_lightPosition = gl.getUniformLocation(gl.program, "u_lightPosition");
    u_lightDirection = gl.getUniformLocation(gl.program, "u_lightDirection");


    //~~~~~~~~~~~~~~~~Adding in world objects~~~~~~~~~~~~~~~~

    let floor = addModel([0.5,0.5,0.5], "cube");
    floor.setScale(8.0,0.1,8.0);
    floor.setTranslate(0,-1,0);
    let grass = addModel([0.3,1,0], "cube");
    grass.setScale(7,0.01,4.5);
    grass.setTranslate(0, -.9 ,-2.5);
    let pond = addModel([0,0,1], "cylinder_endcaps_up");
    pond.setScale(3.5,0.02,1.4);
    pond.setTranslate(0, -.9 ,-4);

    let road = addModel([0.3,0.3,0.3], "cube");
    road.setScale(8.0,0.01,1.3);
    road.setTranslate(0,-0.9,4.65);
    var i;
    for (i=0; i<5; i++){
      let crosswalk = addModel([1,1,1], "cube");
      crosswalk.setScale(1,0.01,0.1);
      crosswalk.setTranslate(0,-0.89,3.7+0.5*i);
    }

    building(-4.5,0,Math.floor(Math.random()*5)+3)
    building(0,0,Math.floor(Math.random()*5)+3);
    building(4.5,0,Math.floor(Math.random()*5)+3);
    //by the buildings
    bench(0,2);
    bench(3.7,2);
    bench(5.3,2);
    //by the pond
    bench(-5,-6);
    bench(0,-6);
    bench(5,-6);

    duck(2, -5);
    duck(3, -4);
    duck(-2, -3);
    duck(-1,-2);

    truck(truckPosition[0],truckPosition[2]);



    pointLightSphere = new Sphere([1.0, 1.0, 0], 10);
    pointLightSphere.setScale(0.3, 0.3, 0.3);
    pointLightSphere.setTranslate(lightPosition.elements[0],
                                  lightPosition.elements[1],
                                  lightPosition.elements[2]);
    models.push(pointLightSphere);

    vertexBuffer = initBuffer("a_Position", 3);
    normalBuffer = initBuffer("a_Normal", 3);

    indexBuffer = gl.createBuffer();
    if(!indexBuffer) {
        console.log("Can't create buffer.")
        return -1;
    }

    // Set light data
    gl.uniform3f(u_ambientColor, 0.2, 0.2, 0.2);
    gl.uniform3f(u_diffuseColor1, 0.4, 0.3, 0.0);
    gl.uniform3f(u_diffuseColor2, 0.8, 0.8, 0.8);
    gl.uniform3f(u_specularColor, 1.0, 1.0, 1.0);

    gl.uniform1f(u_specularAlpha, 15.0);
    gl.uniform3fv(u_lightPosition, lightPosition.elements);
    gl.uniform3fv(u_lightDirection, lightDirection.elements);

    // Set camera data
    camera = new Camera("perspective");

    draw();
}

function building(xcoord,zcoord, height){
  let building = addModel([0.7,0.7,0.7], "cube");
  building.setScale(1.5,height*0.5+0.3,1.5);
  building.setTranslate(xcoord,height*0.5-0.7,zcoord)
  let roof = addModel([0.7,0.7,0.7],"cube");
  roof.setScale(1.6,0.1,1.6);
  roof.setTranslate(xcoord,height-0.4,zcoord)
  let base = addModel([0.7,0.7,0.7],"cube");
  base.setScale(1.6,0.1,1.6);
  base.setTranslate(xcoord,-0.8,zcoord)

  windows(xcoord,zcoord,"front",height);
  windows(xcoord,zcoord,"right",height);
  windows(xcoord,zcoord,"back",height);
  windows(xcoord,zcoord,"left",height);

}

function windows(x, z, direction, amount){
  //setting the direction and position
  if ((direction == "front") || (direction =="back")){
    var xScale = 0.32;
    var zScale = 0.02;
    var xTranslate = [-1,0,1];
    if (direction == "front"){
      var zTranslate = [1.5,1.5,1.5];
    }
    else{
      var zTranslate = [-1.5,-1.5,-1.5];
    }
  }
  else{
    var xScale = 0.02;
    var zScale = 0.32;
    var zTranslate = [-1,0,1];
    if (direction == "right"){
      var xTranslate = [1.5,1.5,1.5];
    }
    else{
      var xTranslate = [-1.5,-1.5,-1.5];
    }
  }

  var i;
  for(i=0; i<amount; i++){
    let window1 = addModel([1,1,.2], "cube");
    window1.setScale(xScale,0.32,zScale);
    window1.setTranslate(xTranslate[0]+x,i,zTranslate[0]+z);
    let window2 = addModel([1,1,.2], "cube");
    window2.setScale(xScale,0.32,zScale);
    window2.setTranslate(xTranslate[1]+x,i,zTranslate[1]+z);
    let window3 = addModel([1,1,.2], "cube");
    window3.setScale(xScale,0.32,zScale);
    window3.setTranslate(xTranslate[2]+x,i,zTranslate[2]+z);
    }
}

function bench(xcoord, zcoord){
    let benchbase = addModel([1,0.7,0.5],"cube");
    benchbase.setScale(0.6,0.02,.2);
    benchbase.setTranslate(xcoord,-0.55,zcoord);
    let benchback = addModel([1,0.7,0.5],"cube");
    benchback.setScale(0.6,0.15,0.02);
    benchback.setTranslate(xcoord,-0.25,zcoord-0.2)

    var i;
    for (i=1; i<3; i++){
      let benchsideback = addModel([1,0.6,0.5],"cube");
      benchsideback.setScale(0.02,0.47,.04);
      benchsideback.setTranslate(xcoord-0.6*(Math.pow(-1,i)),-0.53,zcoord-0.2);
      let benchsidefront = addModel([1,0.7,0.5],"cube");
      benchsidefront.setScale(0.02,0.6,.04);
      benchsidefront.setTranslate(xcoord-0.6*(Math.pow(-1,i)),-1,zcoord+0.2);
      let benchsidetop = addModel([1,0.7,0.5],"cube");
      benchsidetop.setScale(0.04,0.02,.25);
      benchsidetop.setTranslate(xcoord-0.6*(Math.pow(-1,i)),-0.4,zcoord+0.05);
    }
}

function duck(xcoord, zcoord){
  let duckbody = addModel([1,1,1], "sphere");
  duckbody.setScale(0.12,0.18,0.12);
  duckbody.setTranslate(xcoord,-.4,zcoord);
  duckbody.setRotate(45, 0,1,0);
  let duckneck = addModel([1,1,1],"cylinder_endcaps_up");
  duckneck.setScale(0.05,.09,0.05);
  duckneck.setTranslate(xcoord,-0.3, zcoord+0.1);
  let duckhead = addModel([1,1,1], "sphere");
  duckhead.setScale(0.08,0.1,0.08);
  duckhead.setTranslate(xcoord,-0.14,zcoord+0.13);
  duckhead.setRotate(45, 0,1,0);
  let beak = addModel([1,0.5,0], "sphere");
  beak.setScale(0.04,0.02,0.1);
  beak.setTranslate(xcoord,-0.14,zcoord+0.16);
  for(i=0;i<2;i++){
    let duckleg = addModel([1,0.5,0], "cylinder_endcaps_up");
    duckleg.setScale(0.02,.2,0.02);
    duckleg.setTranslate(xcoord+0.09*Math.pow(-1,i),-0.6, zcoord);
    let duckfoot = addModel([1,0.5,0],"cube");
    duckfoot.setScale(0.05,0.01,0.05);
    duckfoot.setTranslate(xcoord+0.09*Math.pow(-1,i),-.6,zcoord+0.02);
    duckfoot.setRotate(-10, 0,0,1);
    let duckeye = addModel([0,0,0], "sphere");
    duckeye.setScale(0.015,0.015,0.015);
    duckeye.setTranslate(xcoord+0.075*Math.pow(-1,i),-0.14,zcoord+0.16);
  }
}

function truck(xcoord, zcoord){
  wheel1 = new Cylinder([0.1,0.1,0.1], "yes", "side");
  wheel1.setScale(0.25,0.25,0.2);
  wheel1.setTranslate(xcoord+1,-0.6,zcoord);
  models.push(wheel1);
  wheel2 = new Cylinder([0.1,0.1,0.1], "yes", "side");
  wheel2.setScale(0.25,0.25,0.2);
  wheel2.setTranslate(xcoord+1,-0.6,zcoord+1);
  models.push(wheel2);
  wheel3 = new Cylinder([0.1,0.1,0.1], "yes", "side");
  wheel3.setScale(0.25,0.25,0.2);
  wheel3.setTranslate(xcoord-1,-0.6,zcoord);
  models.push(wheel3);
  wheel4 = new Cylinder([0.1,0.1,0.1], "yes", "side");
  wheel4.setScale(0.25,0.25,0.2);
  wheel4.setTranslate(xcoord-1,-0.6,zcoord+1);
  models.push(wheel4);

  truckbed = new Cube([0.9,0.9,0.9]);
  truckbed.setScale(1.95,.05,.7);
  truckbed.setTranslate(xcoord+0.3,-0.55,zcoord+0.6);
  models.push(truckbed);
  truckbody = new Cube([Math.random(),Math.random(),Math.random()]);
  truckbody.setScale(1.3,.8,.65);
  truckbody.setTranslate(xcoord-.25,.2,zcoord+0.6);
  models.push(truckbody);
  truckhead = new Cube([0.9,0.9,0.9]);
  truckhead.setScale(0.4,0.5,0.67);
  truckhead.setTranslate(xcoord+1.45,0,zcoord+0.6);
  models.push(truckhead);
  truckbumper = new Cube([0.9,0.9,0.9]);
  truckbumper.setScale(0.3,0.3,0.67);
  truckbumper.setTranslate(xcoord+1.9,-.3,zcoord+0.6);
  models.push(truckbumper);

  carwindow1 = new Cube([0.1,0.1,0.1]);
  carwindow1.setScale(0.2,0.15,0.01);
  carwindow1.setTranslate(xcoord+1.5,0.22,zcoord-0.1);
  models.push(carwindow1);
  carwindow2 = new Cube([0.1,0.1,0.1]);
  carwindow2.setScale(0.2,0.15,0.01);
  carwindow2.setTranslate(xcoord+1.5,0.22,zcoord+1.3);
  models.push(carwindow2);
  frontwindow = new Cube([0.1,0.1,0.1]);
  frontwindow.setScale(0.01,0.3,0.6);
  frontwindow.setTranslate(xcoord+1.85,0.1,zcoord+0.6);
  models.push(frontwindow);

  licenseplate = new Cube([0.1,0.1,0.1]);
  licenseplate.setScale(0.01,0.1,0.2);
  licenseplate.setTranslate(xcoord+2.2,-0.3,zcoord+0.6);
  models.push(licenseplate);
}
