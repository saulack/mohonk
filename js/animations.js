var count = 0;
let prevPos;
let nodeOffswitch;
let currNode;
function trigger_animations(scene, objects, animating){
  scene.traverse((node) => {
    nodeOffswitch = ["Rock climbing", "cloud"];
    if ( node.selectable && !nodeOffswitch.includes(node.name) ) {
      setInterval( () => {
        bounce(node)
      }, 15000)
      node.on('mouseover', (ev) => {
        bounce(node);
      });

      var event;
      function checkMedia(x) {
          if (x.matches) { // If media query matches
              event = 'touchstart';
          } else {
            event = 'mousedown'
          }
      }

      var x = window.matchMedia("(max-width: 600px)")
      checkMedia(x) // Call listener function at run time
      x.addListener(checkMedia) // Attach listener function on state changes


        node.on(event, (ev) => {

        controls.alanDollyOff();
        currNode = node;
        animating = true;
        moveCamera(node);
        var titleBox = document.getElementById("objectTitleBox");
        var backButton = document.getElementById("backButton");
        var title = document.getElementById("objectTitle");
        var more = document.getElementById("more");
        title.innerHTML = node.name;
        more.innerHTML = "Find Out More"
        titleBox.hidden = false;
        backButton.hidden = false;


        //PRELOAD MODAL WITH INFORMATION
        var modalTitle = document.getElementById("modalTitle");
        modalTitle.innerHTML = node.name;


        var modalDescription = document.getElementById("modalDescription");
        modalDescription.innerHTML = node.description;

        let seasonNames = node.seasonNames;
        var modalSeason = document.getElementById("modalSeason");
        modalSeason.innerHTML = seasonNames;


        // jquery for loading backgrounds
        $('#modalFullscreen').css('background', 'url('+ node.photo +')');
        $('#modalFullscreen').css('background-size', 'cover');
        var video = document.getElementById("mainVideo")
        video.src = node.video;
      });
    }
  });
}


  function bounce(object){
    let obj = {
    x:object.scale.x,
    y:object.scale.y,
    z:object.scale.z
  }


  let cpy = JSON.parse(JSON.stringify(obj));

  if (!object.animating) {
    object.animating = true;
    new TWEEN.Tween( object.scale).to( {
      x: object.scale.x * 1.5,
      y: object.scale.y * 1.5,
      z: object.scale.z * 1.5}, 300)
      .easing( TWEEN.Easing.Cubic.Out).start();

    object.scale.set(object.scale.x * 1.5,object.scale.y * 1.5,object.scale.z * 1.5);

    new TWEEN.Tween( object.scale).to( {
      x: cpy.x,
      y: cpy.y,
      z: cpy.z}, 1500).delay(250)
      .easing( TWEEN.Easing.Elastic.Out).
      onComplete(function() {
        object.animating = false
      }).start();
  }
};


function resetTarget() {
    controls.target.x = 0;
    controls.target.y = 0;
    controls.target.z = 0;
};


function moveCamera(object){
  if (!animating) {
    prevPos = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
  }
  animating = true;

  new TWEEN.Tween( camera.position ).to( {
    x: object.cameraPosition.x,
    y: object.cameraPosition.y,
    z: object.cameraPosition.z}, 2400)
    .easing( TWEEN.Easing.Cubic.Out).start();

    if (controls.target !== 0) {
      resetTarget();
    }

  new TWEEN.Tween( controls.target).to( {
    x: object.position.x,
    y: object.position.y,
    z: object.position.z}, 2400)
    .easing( TWEEN.Easing.Cubic.Out).onUpdate( () => {
      controls.update();
    }).start();
}


function resetCamera() {
    if (controls.target !== 0) {
       controls.alanDollyOn();
    new TWEEN.Tween( controls.target).to( scene.position, 2100)
      .easing( TWEEN.Easing.Cubic.Out).onUpdate(() => {
          controls.update();
          let dropdown = document.getElementById('seasonCard');
          dropdown.hidden = false;
        }).start();
      // resetTarget();
  }

  new TWEEN.Tween( camera.position ).to( {
    x: prevPos.x,
    y: prevPos.y,
    z: prevPos.z}, 2100)
    .easing( TWEEN.Easing.Cubic.Out).onComplete(() => {
      controls.update();
      animating = false;
    }).start();

    var titleBox = document.getElementById("objectTitleBox");
    titleBox.hidden = true;
    var backButton = document.getElementById("backButton");
    backButton.hidden = true;
    var title = document.getElementById("objectTitle");
    title.innerHTML = "";
    var more = document.getElementById("more");
    more.innerHTML = "";

}
