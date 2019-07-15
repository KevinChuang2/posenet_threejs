var length = 0.5;
var curveLengthScalar = 7;
var curveSizeScalar = 0.1;
var curveRadius = 0.03;
function CustomSinCurve( scale ) {

	THREE.Curve.call( this );

	this.scale = ( scale === undefined ) ? 1 : scale;

}

CustomSinCurve.prototype = Object.create( THREE.Curve.prototype );
CustomSinCurve.prototype.constructor = CustomSinCurve;

CustomSinCurve.prototype.getPoint = function ( t ) {

	var tx = curveSizeScalar* Math.sin( curveLengthScalar* Math.PI * t );
	var ty = length*t
	var tz = curveSizeScalar* Math.cos(curveLengthScalar*Math.PI*t);

	return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );

};

function createWater(group)
{
  var path = new CustomSinCurve( 2 );
  var geometry = new THREE.TubeGeometry( path, 50, curveRadius, 30, false );
  
  var waterMaterial = new THREE.ShaderMaterial( {
		uniforms: {
			shallowColor: {value: new THREE.Vector4(0.1, 0.92, 0.999, 0.725)},
			deepColor: {value: new THREE.Vector3(0.086, 0.407, 1, 0.749)},
			textureWater: { type: "t", value: new THREE.TextureLoader().load( "images/water.jpg" ) },
			time: {value: 0},
			rotationSpeed: {value: 4.0},
			lightPos: {value: new THREE.Vector3(0,0,1)},
			lightColor: {value: new THREE.Vector4(.7,1,1,1)}

		},
		vertexShader: document.getElementById( 'vs-water' ).textContent.trim(),
		fragmentShader: document.getElementById( 'fs-water' ).textContent.trim(),
	} );
	/*
  var foamMaterial = new THREE.ShaderMaterial( {
		uniforms: {
			time: {value: 0},
			lightPos: {value: new THREE.Vector3(0,0,1)},
			lightColor: {value: new THREE.Vector4(1,1,1,1)}

		},
		vertexShader: document.getElementById( 'vs-foam' ).textContent.trim(),
		fragmentShader: document.getElementById( 'fs-foam' ).textContent.trim(),
	} );
	*/
  //var waterToonMaterial = new THREE.MeshToonMaterial({color:0x28C3D9 });
  var mesh = new THREE.Mesh( geometry, waterMaterial );

  var geo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
  var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
  var wireframe = new THREE.LineSegments( geo, mat );
  
  /*TORUS FOAMS
  var subdivisions = 8;
  for (var i=0; i<1; i+=1/subdivisions)
  {
    var posVec = path.getPoint(i);
    var tangentVec = path.getTangent(i);
    var temp = (posVec.clone().normalize().sub(tangentVec.clone().normalize())).normalize();
    console.log(temp);
    
    var torusGeo = new THREE.TorusGeometry( curveRadius+0.005, 0.02, 20,20 );
    var torusMesh = new THREE.Mesh(torusGeo, foamMaterial);
    torusMesh.position.set(posVec.x,posVec.y,posVec.z);
    torusMesh.lookAt(tangentVec);

    mesh.add(torusMesh);
  }
  */

  
 
  group.add(mesh);
  //group.add( wireframe );
}

