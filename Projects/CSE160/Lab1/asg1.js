//created by Danielle Laganiere 4-5-21

//Shaders (DLSL)
var VSHADER=`
  precision mediump float;
  attribute vec3 a_Position;    // (x,y,z)
  uniform mat4 u_Model;       //4x4 matrix to scale

  void main() {
    gl_Position = u_Model * vec4(a_Position, 1.0);
  }
`;

//fragment shader (fragment = pixel)
var FSHADER=`
precision mediump float;
uniform vec3 u_Color;
  void main() {
    //change the color!!
    gl_FragColor = vec4(u_Color, 1.0);
  }
`;

//make them global!
var cylinder_points = [];
let cylinder_indices = [];
let endcaps_on = 0;

//find the number of points you need based off of n and end caps
function DrawCylinder(){
  //clear that ish
  gl.clear(gl.COLOR_BUFFER_BIT);

  //get the info from the html file
  let n = document.getElementById("n").value;
  let end_caps = document.getElementById("end_caps").value;
  //translation values
  let Tx = document.getElementById("Tx").value;
  let Ty = document.getElementById("Ty").value;
  let Tz = document.getElementById("Tz").value;
  let i;
  //scaling values
  let ScalingX = document.getElementById("ScalingX").value;
  let ScalingY = document.getElementById("ScalingY").value;
  let ScalingZ = document.getElementById("ScalingZ").value;
  //color values
  let red = document.getElementById("red").value;
  let green = document.getElementById("green").value;
  let blue = document.getElementById("blue").value;
  //rotating values
  let RotateX = document.getElementById("RotateX").value;
  let RotateY = document.getElementById("RotateY").value;
  let RotateZ = document.getElementById("RotateZ").value;
  let angle = document.getElementById("angle").value;

  cylinder_points = [0,0,0];   //reset list of cylinder points and add in center
  for (i=0; i<n; i++){
    //find the angles and positions of the things
    let angle = ((2*Math.PI) / n) * i;  //find n angles from 0-360
    let x = Math.cos(angle);
    let y = Math.sin(angle);

    //normalize so it has a radius of 1 in the x and y
    let m_sqrt = Math.sqrt(x*x + y*y);
    cylinder_points = cylinder_points.concat((x/m_sqrt), (y/m_sqrt), 0);
    cylinder_points = cylinder_points.concat((x/m_sqrt), (y/m_sqrt), 1);
  }
  //add in the center of the bottom
  cylinder_points = cylinder_points.concat(0, 0, 1);

  //pattern to make sure it is always counter clock wise:
  //1,2,3  &  3,2,4   add 2 and repeat for just TRIANGLES
  cylinder_indices = [];
  for(i = 0; i<(n-1); i++){
    //bottom left face triangle
    cylinder_indices.push(1+i*2);
    cylinder_indices.push(2+i*2);
    cylinder_indices.push(3+i*2);
    //left right face triangle
    cylinder_indices.push(3+i*2);
    cylinder_indices.push(2+i*2);
    cylinder_indices.push(4+i*2);
  }
  //hard code in the last side to connect the first and last points (could also use mod)
  //bottom left triangle
  cylinder_indices.push(n*2-1);
  cylinder_indices.push(n*2);
  cylinder_indices.push(1);
  //top right face triangle
  cylinder_indices.push(1);
  cylinder_indices.push(n*2);
  cylinder_indices.push(2);

  if (end_caps == 'yes'){
    endcaps_on = 1;
    //do the top end cap
    for (i=0; i<(n-1); i++){
      cylinder_indices.push(n*2+1);
      cylinder_indices.push(2+i*2);
      cylinder_indices.push(4+i*2);
    }
    //harcode in the last one (could also use mod)
    cylinder_indices.push(n*2+1);
    cylinder_indices.push(n*2);
    cylinder_indices.push(2);

    //do the bottom end cap
    for(i=0; i<(n-1); i++){
      //1,middle,3
      cylinder_indices.push(1+i*2);
      cylinder_indices.push(0);
      cylinder_indices.push(3+i*2);
    }
    //hardcode in the last once (could also use mod)
    cylinder_indices.push(n*2-1);
    cylinder_indices.push(0);
    cylinder_indices.push(1);
  }
  else{
    endcaps_on = 0;
  }

  //convert it to the right type
  let points = new Float32Array(cylinder_points);
  let lines = new Uint16Array(cylinder_indices);

  let indexBuffer = gl.createBuffer();
  if(!indexBuffer){
    console.log("Cannot create index buffer");
    return -1;
  }

  //add up the transformations!
  let modelMatrix = new Matrix4();
  modelMatrix.translate(Tx, Ty, Tz);
  modelMatrix.rotate(angle, RotateX, RotateY, RotateZ);
  modelMatrix.scale(ScalingX, ScalingY, ScalingZ);
  let u_Model = gl.getUniformLocation(gl.program, "u_Model");
  gl.uniformMatrix4fv(u_Model, false, modelMatrix.elements);

  //rotate it
  //let rotateMatrix = new Matrix4();
  //modelMatrix.setScale(RotateX, RotateY, RotateZ);
  //let u_Rotate = gl.getUniformLocation(gl.program, "u_Rotate");

  //send the triangle to the GPU (storing data in vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  console.log(points, lines);
  //telling the GPU that the vertexBugger contains index data
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lines, gl.STATIC_DRAW);

  //get u_Color from the fragment shader and set the color
  let u_Color = gl.getUniformLocation(gl.program, "u_Color");
  gl.uniform3f(u_Color, red, green, blue);

  gl.drawElements(gl.LINE_LOOP, lines.length, gl.UNSIGNED_SHORT, 0);
}


function main() {
  //get the canvas from the html file
  MyCanvas = document.getElementById("canvas1");
  gl = MyCanvas.getContext("webgl");
  if(gl == null) {
    console.log("Failed to get webgl context");
    return(-1);
  }
  //what color should it be?
  gl.clearColor(0.0, 0.0, 0.0, 0.0);  //(red, green, blue, transparency)
  gl.clear(gl.COLOR_BUFFER_BIT);

  if(!initShaders(gl, VSHADER, FSHADER)){
    console.log("failed to init shaders");
    return(-1);
  }

  //send it form the CPU mem to the GPU mem
  //creates empty array in the GPU
  let vertexBuffer = gl.createBuffer();
  if(!vertexBuffer){
    console.log("Cannot create buffer");
    return -1;
  }
  //telling the GPU that the vertexBugger contains vertex data
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  //telling GPU how how to read triangle array:
  //gl.program is compiled version of our shaders
  let a_Position = gl.getAttribLocation(gl.program, "a_Position");
  //position, size of vectors (vec2? vec3?), type, normalize?, useful later...
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);   //rect
  //finally, enable everything we just did
  gl.enableVertexAttribArray(a_Position);

}


function saveCoor() {
  let coor_filename = document.getElementById("coor_filename").value;
  let i;
  let print_points = (cylinder_points.length/3).toString();
  for(i=0; i<(cylinder_points.length/3); i++){
    print_points= print_points.concat("\n", (i+1).toString(), ",", (cylinder_points[i*3].toFixed(2)).toString(),
    ",", (cylinder_points[i*3+1].toFixed(2)).toString(), ",", (cylinder_points[i*3+2].toFixed(2)).toString());
  }
  var savedata = document.createElement('a');
  savedata.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(print_points));
  savedata.setAttribute('download', coor_filename);
  savedata.style.display = 'none';
  document.body.appendChild(savedata);
  savedata.click();
  document.body.removeChild(savedata);
}

function savePoly() {
  let poly_filename = document.getElementById("poly_filename").value;
  let i;
  let max_tri_count = cylinder_indices.length;
  let print_lines = (cylinder_indices.length/3).toString();

  if (endcaps_on == 1){
    //this is used for the naming convention of the triangles
    //if the max_tri_count is set to 1/2, it names the last ending cap triangles appropiately
    max_tri_count = cylinder_indices.length/2;
  }
  //sides
  for(i=0; i<(max_tri_count); i+=3){
    print_lines= print_lines.concat("\nside_tri", ((i/3)+1).toString(), " ", (cylinder_indices[i]+1).toString(),
    " ", (cylinder_indices[i+1]+1).toString(), " ", (cylinder_indices[i+2]+1).toString());
  }
  //endcaps
  for(i=(max_tri_count); i<(cylinder_indices.length); i+=3){
    print_lines= print_lines.concat("\nendcap_tri", (((i-(cylinder_indices.length/2))/3)+1).toString(),
    " ", (cylinder_indices[i]+1).toString(), " ", (cylinder_indices[i+1]+1).toString(), " ", (cylinder_indices[i+2]+1).toString());
  }

  var savedata = document.createElement('a');
  savedata.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(print_lines));
  savedata.setAttribute('download', poly_filename);
  savedata.style.display = 'none';
  document.body.appendChild(savedata);
  savedata.click();
  document.body.removeChild(savedata);
}
