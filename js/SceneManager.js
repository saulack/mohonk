var camera,
    scene,
    renderer,
    controls,
    interaction,
    terrains,
    allSeasons,
    spring,
    summer,
    fall,
    winter,
    attractions,
    opening,
    winterSnow,
    fallFog,
    summerSun,
    intro,
    interrupted,
    composer;

var current_season = 0;
var objects = [];
var animating = false;
intro = false;
interrupted = false;

var modelPlacementMode = false;
var globalModel;


init();

async function init(){




  //Load correct season by current month (loads not current but upcoming season)
  function seasonActualizer() {
    let date = new Date
    let month = (date.getMonth() + 1) % 12;
    const summer = [6, 7, 8];
    const fall = [9, 10, 11];
    const winter = [12, 1, 2];
    const spring = [3, 4, 5];

    if (summer.includes(month)) {
      return 3;
    } else if (fall.includes(month)) {
      return 4;
    } else if (winter.includes(month)) {
      return 1;
    } else if (spring.includes(month)){
      return 2;
    } else {
      return 1
    }
  }

  //terrain files from json for season changer
  await loadJSON('json/terrains.json',(response) => {
    terrains = JSON.parse(response);
  });
  await loadJSON('json/spring.json',(response) => {
    spring = JSON.parse(response);
  });
  await loadJSON('json/summer.json',(response) => {
    summer = JSON.parse(response);
  });
  await loadJSON('json/fall.json',(response) => {
    fall = JSON.parse(response);
  });
  await loadJSON('json/winter.json',(response) => {
    winter = JSON.parse(response);
  });
  await loadJSON('json/allSeasons.json',async (response) => {
    allSeasons = JSON.parse(response);
    seasonChanger(seasonActualizer()); //Load inital season after parsing json
  });

    //create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x59b5f7);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.receiveShadow = true;
    camera.castShadow = true;

    //Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

  // Object Interaction
  interaction = new THREE.Interaction(renderer, scene, camera);
  interaction.on;

  //Orbit Controls
  controls = new THREE.OrbitControls( camera );
  controls.update();

  // Lighting
  var light = new THREE.DirectionalLight( 0xffffff, 1, 100);
  light.position.set(-30,60,45);
  light.intensity = 0.4;
  light.castShadow = true;
  scene.add(light);
  light.shadow.mapSize.width = 4096;
  light.shadow.mapSize.height = 4096;
  light.shadow.camera.near = 60;
  light.shadow.camera.right = 25;
  light.shadow.camera.left = -25;
  light.shadow.camera.top = 25;
  light.shadow.camera.bottom = -25;
  light.shadow.camera.far = 115;
  light.shadow.bias = - 0.01;

  var ambient = new THREE.AmbientLight(0xfffffff);
  ambient.intensity = 0.6;
  scene.add(ambient);


  //Have loading screen update on Loading Manager
  THREE.DefaultLoadingManager.onLoad = function ( ) {
    document.getElementById('loadingScreen').style.animation = "fadeOut 1s";
    document.getElementById('loadingScreen').style.opacity = 0;
    if (modelPlacementMode) {
      document.getElementById('modelPlacementscreen').hidden = false;
    }
    startIntro();
    console.log( 'Loading Complete!');
    trigger_animations(scene,objects,animating);
  };

  THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    var percent = Math.round((itemsLoaded/itemsTotal)*100);
    document.getElementById('loadingText').innerHTML = "Loading " + percent + "%";
  };
  update();

}

// Refresh scene and switch to selected Season
async function seasonChanger(season){
    document.getElementById('loadingScreen').style.opacity = 1;
    // Select Model for Placement
    if (modelPlacementMode) {
       testGlb(winter.ski);
    }

    for (var key in allSeasons){
      await loadGlb(allSeasons[key], true);
    }

    if (season == 0) { //TESTING SEASON
      current_season = 0;

    } else if (season == 1 && terrains) { //SPRING
       current_season = 1;
       winterSnow = false;
       fallFog = false;
       summerSun = false;
      refresh();
      await loadGlb(terrains.springTerrain,false);
      for (var key in spring){
        loadGlb(spring[key], true);
      }
    } else if(season == 2 && terrains) { //SUMMER
       current_season = 2;
       winterSnow = false;
       fallFog = false;
       summerSun = true;
      refresh();
      await loadGlb(terrains.summerTerrain, false);
      for (var key in summer){
        await loadGlb(summer[key], true);
      }
    } else if (season == 3 && terrains) { //FALL
       current_season = 3;
       winterSnow = false;
       summerSun = false
       fallFog = true;
      refresh();
      await loadGlb(terrains.fallTerrain, false);
      for (var key in fall){
        loadGlb(fall[key], true);
      }
    } else if (season == 4 && terrains) { //WINTER
       current_season = 4;
       winterSnow = true
       fallFog = true;
       removedParticles = false;
       summerSun = false;
      refresh();
      await loadGlb(terrains.winterTerrain, false);
      for (var key in winter){
        await loadGlb(winter[key], true);
      }
    }
}

function refresh(){
  animating = false
  for (var i = 0; i < objects.length; i++) {
    scene.remove(objects[i]);
  }
  objects = [];
}

//Json Loader for loading object descriptions and properties
async function loadJSON(path,callback) {
   var xobj = new XMLHttpRequest();
       xobj.overrideMimeType("application/json");
   xobj.open('GET', path, true);
   xobj.onreadystatechange = function () {
         if (xobj.readyState == 4 && xobj.status == "200") {
           callback(xobj.responseText);
         }
   };
   xobj.send(null);
}

// Render gltf model from object
function loadGlb(object,selectable) {
    loader.load(
      object.path,
      function ( gltf ) {
        gltf.scene.traverse(function(node){
          node.castShadow = true;
          node.receiveShadow = true;
        });
        gltf.scene.name = object.name;
        gltf.scene.description = object.description;
        gltf.scene.seasonNames = object.seasonNames;

        gltf.scene.scale.x = object.scale.x;
        gltf.scene.scale.y = object.scale.y;
        gltf.scene.scale.z = object.scale.z;

        gltf.scene.position.x = object.position.x;
        gltf.scene.position.y = object.position.y;
        gltf.scene.position.z = object.position.z;

        gltf.scene.rotation.x = object.rotation.x;
        gltf.scene.rotation.y = object.rotation.y;
        gltf.scene.rotation.z = object.rotation.z;

        gltf.scene.cameraPosition = {"x":0,"y":0,"z":0}
        gltf.scene.cameraPosition.x = object.cameraPosition.x;
        gltf.scene.cameraPosition.y = object.cameraPosition.y;
        gltf.scene.cameraPosition.z = object.cameraPosition.z;

        gltf.scene.photo = object.photo;
        gltf.scene.video = object.video;


        if (selectable) {
          gltf.scene.selectable = true;
        }

        objects.push(gltf.scene);
        scene.add( gltf.scene );

      }
    );
}

async function testGlb(object) {
    loader.load(

      object.path,

      function ( gltf ) {
        gltf.scene.traverse(function(node){
          node.castShadow = true;
          node.receiveShadow = true;
        });

        gltf.scene.scale.x = object.scale.x;
        gltf.scene.scale.y = object.scale.y;
        gltf.scene.scale.z = object.scale.z;

        gltf.scene.position.x = 0;
        gltf.scene.position.y = 0;
        gltf.scene.position.z = 0;

        globalModel = gltf.scene;
        scene.add(globalModel);


      }
    );
}

//intro sequence
function startIntro(){
  intro = true;
  controls.enabled = false;
  if (document.getElementById('click')) {
    document.getElementById("click").style.animation = "fadeInOut 2s";
    document.getElementById("zoom").style.animation = "fadeInOut 2s 2s";
    document.getElementById("rotate").style.animation = "fadeInOut 2s 4s";
    document.getElementById("tutorialOne").style.animation = "fadeOut 1s 5s forwards";
    //Switch to Season text
    document.getElementById("tutorialTwo").style.animation = "fadeIn 1s 6s forwards";
    //Fade in Season dropdown
    document.getElementById("topbar").style.animation = "fadeIn 1s 7s forwards";
    document.getElementById("tutorialScreen").style.animation = "fadeOut 1s 10s forwards";

    // comment in context for skipping tutorial with click
    // document.addEventListener('click', () => {

      // interrupted = true;

    // })

    setTimeout(() => {
      intro = false;
      endIntro();
      controls.enabled = true;
      controls.update();
            // if (!interrupted) {
      // } else {
        // document.removeEventListener('click', () => {})
        // interrupted = false;
      // }
    }, 9000)
  } else {
      intro = false;
  }
};

// NOTE:  to exit tutorial with click: remove hide function call inside the
// endIntro function, and add the code below to the end of line 47 in index.html
// inside the div tag of id tutorialScreen
// onclick="hide()"
function hide() {
   let elem = document.getElementById('tutorialScreen');
    elem.parentNode.removeChild(elem);

};

function endIntro(){
  animating = true;
    intro = true;

  let introTween1 = new TWEEN.Tween(camera.position).to({x:-12, y:10, z: -17}, 3000).easing(TWEEN.Easing.Quadratic.Out);
  let introTween2 = new TWEEN.Tween(camera.position).to({x:-34.7, y:27.2, z:40.6},3000).easing(TWEEN.Easing.Quadratic.Out);
  let introTween3 = new TWEEN.Tween(camera.position).to({x:17.4, y:13.9, z:21.2},3000).easing(TWEEN.Easing.Quadratic.Out);
  let introTween4 = new TWEEN.Tween(camera.position).to({
    x:25.782090662513703,
    y:11.134940132457546,
    z:-12.473035288834451}, 3000).easing(TWEEN.Easing.Quadratic.Out);

  introTween1.chain(introTween2);
  introTween2.chain(introTween3);
  introTween3.chain(introTween4);
  introTween4.chain().onComplete(() => {
  // controls.autoRotateSpeed = 15;
  // controls.autoRotate = true;


  // setTimeout( () => {
  //   controls.autoRotate = false;
  // }, 6000 )

    animating = false;
      intro = false;
  });
    introTween1.start();
    hide();
  }


//scaling
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


function update() {
  if (globalModel) {
    globalModel.position.copy(controls.target);
    globalModel.position.y = camera.position.y - 2;
    globalModel.position.z = camera.position.z - 2;
  }

  if (modelPlacementMode) {
    document.getElementById("modelX").innerHTML = controls.target.x;
    document.getElementById("modelY").innerHTML = camera.position.y - 2;
    document.getElementById("modelZ").innerHTML = controls.target.z;

    document.getElementById("cameraX").innerHTML = camera.position.x;
    document.getElementById("cameraY").innerHTML = camera.position.y;
    document.getElementById("cameraZ").innerHTML = camera.position.z;
    camera.position.set( 0, 5, 9);
  }

//Camera Rotation Path and event listeners
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(26.83, 7.48, -12.98),
  new THREE.Vector3(29.05, 6.58, -3.56),
  new THREE.Vector3(18.43, 6.88, 5.31),
  new THREE.Vector3(-8.92, 8.43, 30.84),
  new THREE.Vector3(-19.20, 6.65, 34.4),
  new THREE.Vector3(-29.09, 1.76, 9.75 ),
  new THREE.Vector3(-24.86, 2.48, 1.46),
  new THREE.Vector3(-11.66, 5.54, -13.10)
 ])

curve.closed = true;

curve.getPoint(0, camera.position);
camera.lookAt(scene.position);

let mouseX;
let mouseXOnMouseDown = 0;
let currPoint = 0;
let currPointOnMouseDown = 0;
let windowHalfX = window.innerWidth / 2
let rotateOnMouseDown;
let targetRotation = 0;

document.addEventListener('mousedown', onDocumentMouseDown, true);

function onDocumentMouseDown(event) {
   //event.preventDefault();
   //event.stopPropagation();
  window.addEventListener('touchmove', onDocumentTouchMove, true)
  window.addEventListener('mousemove', onDocumentMouseMove, true);
  window.addEventListener('mouseup', removeListeners, true);
  rotateOnMouseDown = targetRotation;
  mouseXOnMouseDown = event.clientX;
  currPointOnMouseDown = currPoint;
}

function onDocumentTouchMove( event ) {
  if ( event.touches.length == 1 ) {
     //event.preventDefault();
    mouseX = event.touches[0].clientX - windowHalfX;
    targetRotation = rotateOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.05;
    currPoint = (targetRotation - rotateOnMouseDown) * 0.05;
  }
}
function onDocumentMouseMove(event) {
   //event.preventDefault();
   //event.stopPropagation();
  let deltaMouseX = event.clientX - mouseXOnMouseDown;
  currPoint = THREE.Math.euclideanModulo(currPointOnMouseDown + deltaMouseX * 0.0005, 1);
}

function removeListeners() {
  window.removeEventListener('mousemove', onDocumentMouseMove, true);
  window.removeEventListener('mouseup', removeListeners, true);
}


// make snow  and leaf particles
    /*
class Particle {
  constructor(particleCount, color, size, name, boolean, leafType) {
    this.color = color;
    this.size = size;
    this.name = name;
    this.particleCount = particleCount;
    this.removed = false;
    if (boolean) {
      this.texture =  new THREE.TextureLoader().load( `assets/img/${leafType}` ),
      this.pMaterial = new THREE.PointsMaterial({
        map: this.texture,
        color: this.color,
        size: this.size,
        side: THREE.DoubleSide,
        transparent: true
      });
    } else {
      this.texture = new THREE.TextureLoader().load( 'assets/img/snowFlake.png' );
      this.pMaterial = new THREE.PointsMaterial({
        map: this.texture,
        size: this.size,
        color: this.color,
        blending: THREE.AdditiveBlending,
        transparent: true
      });
    }
  this.particles = new THREE.Geometry;
}


  renderParticles() {
    for (let i = 0; i < this.particleCount; i++) {
        let pX = Math.random()*1000 - 500;
        let pY = Math.random()* window.innerHeight;
        let pZ = Math.random()* 1000 - 700;
        this.particle = new THREE.Vector3(pX, pY, pZ);
        this.particle.velocity = {};
        this.particle.velocity.y = -1;
        this.particles.vertices.push(this.particle);
    }
    this.particleSystem = new THREE.Points(this.particles, this.pMaterial);
    this.particleSystem.position.y = 200;
    scene.add(this.particleSystem);
  }

/*
  simulateSnow(){
    let pCount = this.particleCount;
    while (pCount--) {
      let flake = this.particles.vertices[pCount];
      if (flake < -300) {
        flake.y = 200;
        this.particle.velocity.y = -2;
      }
      this.particle.velocity.y -= Math.random() * .005;
      flake.y += this.particle.velocity.y;
    }
    this.particles.verticesNeedUpdate = true;
  }

  removeParticleSystem() {
    let points = scene.children
    for (let i = 0; i < points.length; i++) {
      if (points[i].type === "Points") {
       points.splice(i,1);

     }
   }
   this.removed = true;
 }

  update() {
    this.renderParticles();
    this.simulateSnow();
  }
};*/


const createSun = () => {
  let geometry = new THREE.SphereGeometry( 3, 8, 8);
  let material = new THREE.MeshToonMaterial( {color: 0xe1ec16, reflectivity: 1});
  let sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(30, 15, 0);
  return sphere;
};

/*
const snow = new Particle(2000, 0xffffff, 2, "snow", false);
const leafYellow = new Particle(50, 0xe38e1c, 5, "leaf", true, 'leaf7.png' );
const leafRed = new Particle(75, 0xe38e1c, 5, "leaf", true, 'leaf.png' );
*/
const sun = createSun();
let dropdown = document.getElementById('seasonDropdown');

function render(){
  requestAnimationFrame( render );
  if (intro) {
    dropdown.hidden = true;
    controls.update();
    TWEEN.update();
    camera.lookAt(new THREE.Vector3(0,0,0));
  } else {
    dropdown.hidden = false;
    controls.enabled = true;
    controls.update();
    TWEEN.update();
    if (winterSnow) {
      //snow.removeParticleSystem();
      //leafYellow.removeParticleSystem();
      //leafRed.removeParticleSystem();
      scene.remove( sun );
      //snow.update();
    } else if (fallFog) {
      //leafYellow.removeParticleSystem();
      //leafRed.removeParticleSystem();
      //snow.removeParticleSystem();
      scene.remove( sun );
      //leafYellow.update();
      //leafRed.update();
    } else if (summerSun)  {
      //snow.removeParticleSystem();
      scene.add( sun );
    } else {
      scene.remove( sun );
      //snow.removeParticleSystem();
      //scene.fog = false;
    }

    // let seasonsDropdown = document.getElementById('seasonCard');
    if (!animating) {
      // controls.enabled = true;
      controls.update();
    } else {
      dropdown.hidden = true;
       controls.update();

    }
  }
    renderer.render( scene, camera );
  };

render();
};
