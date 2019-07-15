
function draw_explosion(pos1,pos2, radius)
{
  var cylinderTopRad = radius;
  var cylinderBotRad = radius;
  var cylinderLength = Math.sqrt((pos2.x-pos1.x)^2 + (pos2.y-pos1.y)^2);
  var cylinderRadialSeg =5;
  var cylinderHeightSeg = 5;
  var shaderMaterial = new THREE.ShaderMaterial( {
      uniforms: {
          time: { value: 1.0 },
          centerX: {value: 0.0},
          centerY: {value: 0.0},
          centerZ: {value: 0.0},
          sizeX: {value: cylinderTopRad},
          sizeY: {value:cylinderLength}
      },
      blending: THREE.AdditiveBlending,
      vertexShader: document.getElementById( 'vs' ).textContent.trim(),
      fragmentShader: document.getElementById( 'fs' ).textContent.trim(),
      transparent: true
  } );
  var particleCylinder  = new THREE.CylinderBufferGeometry(cylinderTopRad, cylinderBotRad, cylinderLength,cylinderRadialSeg,cylinderHeightSeg); 
  var particleSystem = new THREE.Points(
      particleCylinder,
      shaderMaterial);
  particleCylinder.dispose();
  shaderMaterial.dispose();
  var particleSystemCenter = getCenter(particleSystem);
  particleSystem.material.uniforms.centerX = particleSystemCenter.x;
  particleSystem.material.uniforms.centerY = particleSystemCenter.y;
  particleSystem.material.uniforms.centerZ = particleSystemCenter.z;
  particleSystem.position.x = (pos1.x+pos2.x)/2;
  particleSystem.position.y = (pos1.y+pos2.y)/2;
  particleSystem.rotation.z = Math.PI/2+Math.atan((pos1.y-pos2.y)/(pos1.x-pos2.x));
  return particleSystem;
}

function draw_connecting_points(sideDict,sideString,color, group)
{
  for(num in sideDict)
    {
      let part = sideDict[num];
      if(part.key == (sideString+"Shoulder"))
      {
        let nextPart = sideDict[parseInt(num)+1]
        if(nextPart&& nextPart.key == (sideString+"Elbow"))
        {
           var cylinderMesh = draw_cylinder(part.position, nextPart.position, 0.05, color)
           var explosionMesh = draw_explosion(part.position, nextPart.position, 0.05);
           group.add(cylinderMesh);
           group.add(explosionMesh);
           return explosionMesh;

        }

      }
    }
}