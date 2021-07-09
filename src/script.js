import "./style.css";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Mesh } from "three";

let camera,
  scene,
  renderer,
  sizes,
  controls,
  imageScroll,
  positionImageScroll,
  clock,
  time,
  delta;

const canvas = document.querySelector("canvas.webgl");

sizes = {
  width: canvas.clientWidth,
  height: canvas.clientHeight,
};

let speed = 0;
let positionRaf = 0;
let rounded = 0;
let block = document.getElementById("block");
window.addEventListener("wheel", (e) => {
  speed += e.deltaY * 0.0003;
});

raf();

init();
render();

function init() {
  //renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas: canvas,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(sizes.width, sizes.height);

  //tone mapping
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding;

  //scene
  scene = new THREE.Scene();

  //camera
  camera = new THREE.PerspectiveCamera(
    25,
    sizes.width / sizes.height,
    0.25,
    100
  );

  //hdr
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .setPath("textures/equirectangular/")
    .load("studio_small_03_1k.hdr", function (texture) {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;

      scene.environment = envMap;

      texture.dispose();
      pmremGenerator.dispose();

      render();

      pivotGroup();
    });

  //controls

  controls = new OrbitControls(camera, canvas);
  controls.addEventListener("change", render); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, 0);
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;

  controls.update();

  requestAnimationFrame(animate);

  //clock
  clock = new THREE.Clock();

  window.addEventListener("mousemove", cameraMove(window));

  function cameraMove(e) {
    let x = window.clientX;
    let positionMouse = x / window.innerWidth;
    camera.rotation.y = positionMouse;
    console.log(positionMouse);
  }
}

//functions

function onWindowResize() {
  sizes = {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  };

  renderer.setSize(sizes.width, sizes.height);

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  render();
}

function animate() {
  // controls.update();

  onWindowResize();

  // camera.rotation.y = Math.PI * 2;

  time = clock.getElapsedTime();
  delta = clock.getDelta();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function render() {
  renderer.render(scene, camera);
}

function raf() {
  positionRaf += speed;
  speed *= 0.8;

  rounded = Math.round(positionRaf);

  let diff = rounded - positionRaf;

  positionRaf += Math.sign(diff) * Math.pow(Math.abs(diff), 0.6) * 0.05;

  window.requestAnimationFrame(raf);
}

function pivotGroup() {
  let items = document.querySelectorAll(".imageplanes");

  items.forEach((item, i) => {
    let geometry = new THREE.PlaneGeometry(3, 1);
    let imageTexture = new THREE.TextureLoader().load(`${item.src}`);
    let material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    material.map = imageTexture;
    let imagePivot = new THREE.Mesh(geometry, material);
    imagePivot.scale.set(1, 1, 1);
    imagePivot.position.z = -3;
    imagePivot.position.y = 0.3;
    let imageGroup = new THREE.Group();
    imageGroup.add(imagePivot);
    imageGroup.rotation.y = ((2 * Math.PI) / items.length) * (i + 1);
    scene.add(imageGroup);
  });
}
