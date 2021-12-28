class Cylinder {
  //pattern to make sure it is always counter clock wise:
  //1,2,3  &  3,2,4   add 2 and repeat for just TRIANGLES

    constructor(color, endcaps) {

      let n = 10;
      var i;

      //coordinates:
      let cylinder_points = [0,0,0];  //bottom middle
      //main body coordinates
      for (i=0; i<n; i++){
        let angle = ((2*Math.PI) / n) * i;  //find n angles from 0-360
        let angle_next = ((2*Math.PI) / n) * (i+1);  //find n angles from 0-360
        let x = Math.cos(angle);
        let y = Math.sin(angle);
        let x_next = Math.cos(angle_next);
        let y_next = Math.sin(angle_next);
        //normalize so it has a radius of 1 in the x and y
        let m_sqrt = Math.sqrt(x*x + y*y);
        let m_sqrt_next = Math.sqrt(x_next*x_next + y_next*y_next);
        //switched y and z so it is facing up instead of out
        cylinder_points = cylinder_points.concat((x/m_sqrt), 0, (y/m_sqrt));
        cylinder_points = cylinder_points.concat((x/m_sqrt), 1, (y/m_sqrt));
        cylinder_points = cylinder_points.concat((x_next/m_sqrt_next), 0,(y_next/m_sqrt_next));
        cylinder_points = cylinder_points.concat((x_next/m_sqrt_next), 1, (y_next/m_sqrt_next));
      }
      //add in endcaps if necassary
      if (endcaps == "yes"){
        //add in the extra points to account for the top and bottom normals
        for (i=0; i<n; i++){
          let angle_ends = ((2*Math.PI) / n) * i;
          let x_ends = Math.cos(angle_ends);
          let y_ends = Math.sin(angle_ends);
          //normalize so it has a radius of 1 in the x and y
          let m_sqrt_ends = Math.sqrt(x_ends*x_ends + y_ends*y_ends);
          //switched y and z so it is facing up instead of out
          cylinder_points = cylinder_points.concat((x_ends/m_sqrt_ends), 0, (y_ends/m_sqrt_ends));
          cylinder_points = cylinder_points.concat((x_ends/m_sqrt_ends), 1, (y_ends/m_sqrt_ends));
        }
      }
      //add in the bottom middle
      cylinder_points = cylinder_points.concat(0, 1, 0);
      //save it to the class
      this.vertices = new Float32Array(cylinder_points);


      //calculating the normal
      let normals = [0,-1,0]; //normal of the top middle
      for (i=0; i<n;i++){
        //p1, p2, and p3 are 3 vectors on the plane
        let p1 = [cylinder_points[i*12+3], cylinder_points[i*12+4], cylinder_points[i*12+5]];
        let p2 = [cylinder_points[i*12+6], cylinder_points[i*12+7], cylinder_points[i*12+8]];
        let p3 = [cylinder_points[i*12+9], cylinder_points[i*12+10], cylinder_points[i*12+11]];
        //u = p2 - p1,  v = p3 - p1
        let u = [p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]];
        let v = [p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2]];
        //normal x = uy*vz - uz*vy
        //normal y = uz*vx - ux*vz
        //normal z = ux*vy - uy*vx
        let normx = u[1]*v[2] - u[2]*v[1];
        let normy = u[2]*v[0] - u[0]*v[2];
        let normz = u[0]*v[1] - u[1]*v[0];
        //then normalize the thing
        let sqrt = Math.sqrt(normx*normx + normy*normy + normz*normz);
        normx = normx/sqrt;
        normy = normy/sqrt;
        normz = normz/sqrt;
        //4 times! One of each coord of the side.
        normals = normals.concat(normx, normy, normz);
        normals = normals.concat(normx, normy, normz);
        normals = normals.concat(normx, normy, normz);
        normals = normals.concat(normx, normy, normz);
      }
      if(endcaps == "yes"){
        for (i=0; i<n;i++){
          normals = normals.concat(0, -1, 0);
          normals = normals.concat(0, 1, 0);
        }
      }
      normals = normals.concat(0, 1, 0);
      this.normals = new Float32Array(normals);//cylinder_points);


      // Indices of the vertices
      let cylinder_indices = [];
      for(i = 0; i<n; i++){
        //bottom left face triangle
        cylinder_indices.push(1+i*4);
        cylinder_indices.push(2+i*4);
        cylinder_indices.push(3+i*4);
        //left right face triangle
        cylinder_indices.push(3+i*4);
        cylinder_indices.push(4+i*4);
        cylinder_indices.push(2+i*4);
      }
      if(endcaps == "yes"){
        //do the top end cap
        for (i=0; i<(n-1); i++){
          cylinder_indices.push(i*2+1+4*n);
          cylinder_indices.push(i*2+3+4*n);
          cylinder_indices.push(0);
        }
        //hardcode the last one to reconnect to the front.
        cylinder_indices.push(6*n-1);
        cylinder_indices.push(4*n+1);
        cylinder_indices.push(0);

        //do the bottom end cap
        for(i=0; i<(n-1); i++){
          //1,middle,3
          cylinder_indices.push(2+i*2+4*n);
          cylinder_indices.push(4+i*2+4*n);
          cylinder_indices.push(1+6*n);
        }
        //hardcode the last one to reconnect to the front.
        cylinder_indices.push(6*n);
        cylinder_indices.push(4*n+2);
        cylinder_indices.push(1+6*n);
      }
      this.indices = new Uint16Array(cylinder_indices);


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
