// three.js setup

const width = 500;
const height = 500;

// Setup scene
const scene = new THREE.Scene();

//  We use an orthographic camera here instead of persepctive one for easy mapping
//  Bounded from 0 to width and 0 to height
// Near clipping plane of 0.1; far clipping plane of 1000
const camera = new THREE.PerspectiveCamera( 90, width/height, 0.1, 1000 ); 
camera.position.z = 1; 

var canvas = document.createElement( 'canvas' );
var context = canvas.getContext( 'webgl2' );

// Setting up the renderer
const renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context, antialias: true, alpha:true } );

renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( width, height );


// Attach the threejs animation to the div with id of threeContainer
const container = document.getElementById( 'threeContainer' );
container.appendChild( renderer.domElement );

var clock = new THREE.Clock();

const ambientLight =
  new THREE.AmbientLight(0xFFFFFF);

// set its position
ambientLight.position.x = 100;
ambientLight.position.y = 200;
ambientLight.position.z = 130;

// add to the scene
scene.add(ambientLight);
var waterGroup = new THREE.Group();
createWater(waterGroup);
waterGroup.children[0].position.set(2,2,2);
scene.add(waterGroup);
var time = 0.0;
// POSENET
// Adapted from code at https://github.com/tensorflow/tfjs-models/blob/master/posenet/demos/camera.js

// Check on the device that you are viewing it from
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}

// Load camera
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.getElementById('video');
  video.width = width;
  video.height = height;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: mobile ? undefined : width,
      height: mobile ? undefined : height,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

// Net will hold the posenet model

let net;

// Initialise trackers to attach to body parts recognised by posenet model


// Main animation loop
function render(video, net) {
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');

  // Flip the webcam image to get it right
  const flipHorizontal = true;

  canvas.width = width;
  canvas.height = height;

  async function detect() {


    // Scale the image. The smaller the faster
    const imageScaleFactor = 0.5;

    // Stride, the larger, the smaller the output, the faster
    const outputStride = 128;

    // Store all the poses
    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;

    const pose = await net.estimateSinglePose(video, 
                                              imageScaleFactor, 
                                              flipHorizontal, 
                                              outputStride);

    // Show a pose (i.e. a person) only if probability more than 0.1
    minPoseConfidence = 0.1;
    // Show a body part only if probability more than 0.3
    minPartConfidence = 0.3;
    //poses.push(pose);
    var group = new THREE.Group();
    var leftSide = [];
    var rightSide = [];
    
    for (point in pose.keypoints)
    {
      if(pose.keypoints[point].score>minPartConfidence)
      {
        //translate to ratio coordinates
        var posX = ((width/2)-pose.keypoints[point].position.x)/(width/2);
        var posY = ((height/2)-pose.keypoints[point].position.y)/(height/2);
        /*
        console.log(pose.keypoints[point].position.x);
        console.log(posX);
        console.log(pose.keypoints[point].position.y);
        console.log(posY);
        */
        var tempMesh = draw_square_point(posX, posY, 0x00FF00);
        if(pose.keypoints[point].part.includes("left"))
        {
          leftSide.push({
            key: pose.keypoints[point].part,
            position: {x:posX, y: posY}
          })

        }
        if(pose.keypoints[point].part.includes("right"))
        {
          rightSide.push({
            key: pose.keypoints[point].part,
            position: {x:posX, y: posY}
          })
          
        }
        group.add(tempMesh);
      }
    }
    scene.add(group);

    var delta = clock.getDelta();
    time += delta;
    animationHandler.updateTime(scene,time);
    var lightningGroup = new THREE.Group();
    
    var connectingPoints = generateConnectingPoints(leftSide, rightSide);
    
    for(var i=0; i<connectingPoints.length; i=i+2)
    {
      generateLightning(connectingPoints[i], connectingPoints[i+1], lightningGroup);

    }
    if(lightningGroup.children.length>0)
    {
      animationHandler.addAnimation(scene, lightningGroup,time, time + 0.4);
    }
    
    animationHandler.updateGroupTimes(time);
    
    
    waterGroup.children[0].material.uniforms.time.value = time;
    ctx.clearRect(0, 0, width, height);
    const showVideo = true;
    if (showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);
      // ctx.filter = 'blur(5px)';
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
    }
    
    
    renderer.render( scene, camera );
    scene.remove(group);
    requestAnimationFrame(detect);
    
    
    
    //composer.render(delta);
    
  }

  detect();

}


async function main() {
  // Load posenet
  const net = await posenet.load(
    );

  document.getElementById('main').style.display = 'block';
  let video;

  try {
    video = await loadVideo();
  } catch (e) {
    let info = document.getElementById('info');
    info.textContent = 'this browser does not support video capture,' +
        'or this device does not have a camera';
    info.style.display = 'block';
    throw e;
  }

  render(video, net);
}

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;


function draw_square_point(posX,posY, color)
{
  size = 0.01;
  var squareShape = new THREE.Shape();
  /*
  console.log("new point")
  console.log(posX);
  console.log(posY);
  */
  squareShape.moveTo( posX-size/2, posY-size/2 );
  squareShape.lineTo( posX-size/2, posY+size/2);
  squareShape.lineTo( posX+size/2, posY+size/2 );
  squareShape.lineTo( posX+size/2, posY-size/2 );
  //squareShape.lineTo( posX- size/2, posY- size/2 );
  var geometry = new THREE.ShapeGeometry( squareShape );
  var material = new THREE.MeshBasicMaterial( { color: color } );
  var mesh = new THREE.Mesh( geometry, material ) ;
  geometry.dispose();
  material.dispose();
  return mesh;
}



function draw_cylinder(pos1,pos2, radius, color)
{
  var cylinderTopRad = radius;
  var cylinderBotRad = radius;
  var cylinderLength = Math.sqrt((pos2.x-pos1.x)^2 + (pos2.y-pos1.y)^2);
  var cylinderRadialSeg =5;
  var cylinderHeightSeg = 5;
  var geometry = new THREE.CylinderGeometry(cylinderTopRad, cylinderBotRad, cylinderLength,cylinderRadialSeg,cylinderHeightSeg);
  var material = new THREE.MeshPhongMaterial({
          flatShading: THREE.SmoothShading,
          color: color,
          specular: 0x111111,
          shininess: 20,
          emissive: 0xd3ecf3,
          emissiveIntensity: 0.3,
          reflectivity: 0.8,
          combine: THREE.MixOperation,
      });
  var cylinderMesh = new THREE.Mesh( geometry, material )
  geometry.dispose();
  material.dispose();
  cylinderMesh.position.x = (pos1.x+pos2.x)/2;
  cylinderMesh.position.y = (pos1.y+pos2.y)/2;
  cylinderMesh.rotation.z = Math.PI/2+Math.atan((pos1.y-pos2.y)/(pos1.x-pos2.x));
  return cylinderMesh;
}

function generateConnectingPoints(leftDict, rightDict)
{
  var leftString = "left";
  var rightString = "right";
  var arr = [];
  var leftShoulder = false;
  var rightShoulder = false;
  var leftShoulderPos;
  var rightShoulderPos;
  for(num in leftDict)
    {
      var part = leftDict[num];
      
      if(part.key == (leftString+"Shoulder"))
      {
        //console.log(part.key);
        leftShoulder = true;
        leftShoulderPos = new THREE.Vector3(part.position.x, part.position.y, part.position.z);
        let nextPart = leftDict[parseInt(num)+1]
        if(nextPart&& nextPart.key == (leftString+"Elbow"))
        {
          var end = new THREE.Vector3(nextPart.position.x, nextPart.position.y, nextPart.position.z);
          var start = leftShoulderPos;
          console.log(part);
          arr.push(start);
          arr.push(end);
          if(start.x<end.x)
          {
            waterGroup.children[0].position.set(end.x, end.y, 0);
            waterGroup.children[0].lookAt(start);
            waterGroup.children[0].rotation.y = waterGroup.children[0].rotation.y - Math.PI/2;
            

          }
          else
          {
            waterGroup.children[0].position.set(start.x, start.y, 0);
            waterGroup.children[0].lookAt(end);
            waterGroup.children[0].rotation.y = waterGroup.children[0].rotation.y + Math.PI/2;
          }
          var scaleFactor = start.clone().sub(end).length();
          if(scaleFactor<0.3)
          {
            waterGroup.children[0].position.set(2,2,0);
          }
          waterGroup.children[0].scale.set(scaleFactor,scaleFactor,1);
        }

      }
      if(part.key == (leftString+"Elbow"))
      {
        let nextPart = leftDict[parseInt(num)+1]
        if(nextPart&& nextPart.key == (leftString+"Wrist"))
        {
          var end = new THREE.Vector3(nextPart.position.x, nextPart.position.y, nextPart.position.z);
          var start = new THREE.Vector3(part.position.x, part.position.y, part.position.z);
          arr.push(start);
          arr.push(end);
        }

      }
    }


  for(num in rightDict)
    {
      var part = rightDict[num];
      if(part.key == (rightString+"Shoulder"))
      {
        
        rightShoulder = true;
        rightShoulderPos = new THREE.Vector3(part.position.x, part.position.y, part.position.z);
        let nextPart = rightDict[parseInt(num)+1]
        if(nextPart&& nextPart.key == (rightString+"Elbow"))
        {
          var end = new THREE.Vector3(nextPart.position.x, nextPart.position.y, nextPart.position.z);
          var start = new THREE.Vector3(part.position.x, part.position.y, part.position.z);
          arr.push(start);
          arr.push(end);
        }

      }
      if(part.key == (rightString+"Elbow"))
      {
        let nextPart = rightDict[parseInt(num)+1]
        if(nextPart&& nextPart.key == (rightString+"Wrist"))
        {
          var end = new THREE.Vector3(nextPart.position.x, nextPart.position.y, nextPart.position.z);
          var start = new THREE.Vector3(part.position.x, part.position.y, part.position.z);
          arr.push(start);
          arr.push(end);
        }

      }
    }
  if(!leftShoulder)
  {
    waterGroup.children[0].position.set(2,2,0);
  }
  return arr;
}

function getCenter(mesh)
{
  mesh.geometry.computeBoundingSphere();
  return mesh.geometry.boundingSphere.center;
}

main();


