import * as THREE from "three";
import { Euler } from "three";
import { Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import React, { useState, useEffect } from "react";
import "./App.css";

//variables globales para mostrar elementos en la react app
let score = 0;
let isCollision = false;

function doThreeJS() {
  //se hace visible el div gameover
  function showCollisionText() {
    const collisionText = document.getElementById("gameover");
    if (collisionText) {
      collisionText.style.display = "block";
    }
  }

  // actualizar el maxscore si el score actual es mayor
  function updateScore(newScore: number) {
    // sacamos de local storage el maxscore
    const maxscore = localStorage.getItem("maxscore");

    // checar si existe o es menor que el score
    if (!maxscore || newScore > parseInt(maxscore)) {
      localStorage.setItem("maxscore", newScore.toString());
    }
  }
  //escena
  const scene = new THREE.Scene();

  //camara
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // AudioListener para la camara
  const listener = new THREE.AudioListener();
  camera.add(listener);

  // create a global audio source
  const sound = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  const audioLoader = new THREE.AudioLoader();

  audioLoader.load("Audios/Hm.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
    sound.play();
  });

  //Color fondo
  scene.background = new THREE.Color(0.25, 0.6, 0.95);

  //Luz ambiental
  const ambientLight = new THREE.AmbientLight(0xe0e0e0, 1);
  scene.add(ambientLight);
  const renderer = new THREE.WebGLRenderer();
  renderer.toneMapping = THREE.ACESFilmicToneMapping; //opciones aestethic
  renderer.outputColorSpace = THREE.SRGBColorSpace; //opciones aestethic
  renderer.setPixelRatio(window.devicePixelRatio); //opciones aestethic
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // niebla
  const fogColor = new THREE.Color(0xffffff); // color
  const fogDensity = 0.01; // densidad
  const fog = new THREE.FogExp2(fogColor, fogDensity);
  scene.fog = fog;

  //objeto steve
  const stevegltfloader = new GLTFLoader();
  let steve: THREE.Object3D<THREE.Object3DEventMap>;
  const steveSpeed = 1; // velocidad de movimiento
  let loaded = false;
  const steveBoundingBox = new THREE.Box3();

  stevegltfloader.load(
    // resource URL
    "Models/Steve/scene.gltf",
    // called when the resource is loaded
    function (gltf) {
      //succes

      steve = gltf.scene;
      scene.add(steve);
      loaded = true;
      steve.position.set(0, 0, -50); // posicion
      steve.scale.set(0.25, 0.25, 0.25); // escala
      const rotation = new Euler(-Math.PI / 6, Math.PI, 0); //rotacion
      steve.setRotationFromEuler(rotation);
    },
    // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // called when loading has errors
    function (_error) {
      console.log("An error happened");
    }
  );

  //objeto cubo
  const cubogltfloader = new GLTFLoader();
  let cubo: THREE.Object3D<THREE.Object3DEventMap>;

  cubogltfloader.load(
    // resource URL
    "Models/Cubo/scene.gltf",
    // called when the resource is loaded
    function (gltf) {
      //succes

      cubo = gltf.scene;
      scene.add(cubo);
      cubo.position.set(0, 0, -100); // posicion
      cubo.scale.set(100, 100, 100); // escala
      const rotation = new Euler(Math.PI / 5, Math.PI / 4, 0); //rotacion
      cubo.setRotationFromEuler(rotation);
    },
    // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // called when loading has errors
    function (_error) {
      console.log("An error happened");
    }
  );

  //objeto Aldeano

  // arreglos para los objetos de aldeano creado y sus boundingboxes
  const aldeanoObjects: THREE.Group<THREE.Object3DEventMap>[] = [];
  const aldeanoBoundingBoxes: any[] = [];

  function spawnAldeano(area: number) {
    const aldeanogltfloader = new GLTFLoader();

    aldeanogltfloader.load(
      // Resource URL
      "Models/Aldeano/scene.gltf",
      // Called when the resource is loaded
      function (gltf) {
        const aldeano = gltf.scene;
        scene.add(aldeano);

        // posicion random de X y Y
        aldeano.position.set(
          Math.random() * area - area / 2, // X
          Math.random() * area - area / 2, // Y
          -300 // Z
        );

        aldeano.scale.set(5, 5, 5); // escala
        const rotation = new Euler(Math.PI / 3, Math.PI, 0); //rotacion
        aldeano.setRotationFromEuler(rotation);

        // aldeano entra a la lista
        aldeanoObjects.push(aldeano);

        // boundingbox se crea y entra a la lista
        const aldeanoBoundingBox = new THREE.Box3().setFromObject(aldeano);
        aldeanoBoundingBoxes.push(aldeanoBoundingBox);
      },
      // Called when loading is in progress
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      // Called when loading has errors
      function (_error) {
        console.log("An error happened");
      }
    );
  }

  // funcion para mover los aldeanos en z
  function transformAldeanoPosition(
    aldeanoObjects: string | any[],
    aldeanoBoundingBoxes: any[],
    timestamp: number
  ) {
    for (let i = 0; i < aldeanoObjects.length; i++) {
      const aldeano = aldeanoObjects[i];
      const aldeanoBoundingBox = aldeanoBoundingBoxes[i];

      if (aldeano) {
        // tiempo delta como constante para la velocidad
        const zIncrement = timestamp * 100;
        aldeano.position.z += zIncrement;

        // cuando la posicion de z esta en un rango entre 20 y 21 se elimina de la escena y agregamos un punto
        if (aldeano.position.z > 20 && aldeano.position.z < 21) {
          scene.remove(aldeanoBoundingBox);
          scene.remove(aldeano);
          score += 1;
          audioLoader.load("Audios/Xp.mp3", function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.5);
            sound.play();
          });
          updateScore(score);
        } else {
          // se actualiza la posicion de la boundingbox junto al aldeano
          aldeanoBoundingBox.copy(new THREE.Box3().setFromObject(aldeano));
        }
      }
    }
  }

  // reloj
  const clock = new THREE.Clock();

  //area de spawn de aldeano
  let area = 200;

  //bucle del juego
  function animate() {
    requestAnimationFrame(animate);

    // actualizar el score actual
    const scoreDisplay = document.getElementById("score-display");
    if (scoreDisplay) {
      scoreDisplay.textContent = `Score: ${score}`;
    }

    // tiempo delta
    const deltaTime = clock.getDelta();

    if (!isCollision) {
      spawnAldeano(area);
      transformAldeanoPosition(aldeanoObjects, aldeanoBoundingBoxes, deltaTime);

      // movimiento
      movementDirection.set(0, 0, 0);
      if (activeKeys.has("ArrowUp") || activeKeys.has("w")) {
        movementDirection.y += 1;
      }
      if (activeKeys.has("ArrowDown") || activeKeys.has("s")) {
        movementDirection.y -= 1;
      }
      if (activeKeys.has("ArrowLeft") || activeKeys.has("a")) {
        movementDirection.x -= 1;
      }
      if (activeKeys.has("ArrowRight") || activeKeys.has("d")) {
        movementDirection.x += 1;
      }

      // normalizar el movimiento y ajustar la velocidad
      movementDirection.normalize();
      movementDirection.multiplyScalar(steveSpeed);

      if (loaded) {
        steve.position.add(movementDirection);

        // la bounding box sigue a steve
        steveBoundingBox.setFromObject(steve);

        // checar colision con algun aldeano disponible
        for (let i = 0; i < aldeanoBoundingBoxes.length; i++) {
          const aldeanoBoundingBox = aldeanoBoundingBoxes[i];
          if (steveBoundingBox.intersectsBox(aldeanoBoundingBox)) {
            isCollision = true;
            break;
          }
        }
      }
    }

    //fin del juego
    if (isCollision) {
      audioLoader.load("Audios/Gameover.mp3", function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.5);
        sound.play();
      });
      showCollisionText();
      steve.rotateZ(0.1);
    }
    renderer.render(scene, camera);

    //se reduce el area hasta 100 de la zona spawn
    if (area > 100) area -= deltaTime * 2;
  }

  // vector de movimiento de steve
  const movementDirection = new Vector3(0, 0, 0);

  // manear las teclas activas
  const activeKeys = new Set();

  // detectar teclas presionadas
  window.addEventListener("keydown", (event) => {
    const key = event.key;
    if (
      key === "ArrowUp" ||
      key === "w" ||
      key === "ArrowDown" ||
      key === "s" ||
      key === "ArrowLeft" ||
      key === "a" ||
      key === "ArrowRight" ||
      key === "d"
    ) {
      activeKeys.add(key);
      event.preventDefault(); // prevenir scroll usando las flechas
    }
  });

  window.addEventListener("keyup", (event) => {
    const key = event.key;
    if (
      key === "ArrowUp" ||
      key === "w" ||
      key === "ArrowDown" ||
      key === "s" ||
      key === "ArrowLeft" ||
      key === "a" ||
      key === "ArrowRight" ||
      key === "d"
    ) {
      activeKeys.delete(key);
    }
  });

  window.addEventListener("resize", onWindowResize, false);

  function onWindowResize() {
    //funcion para redimensionar ventana si el usuario le anda moviendo
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate(); //Iniciamos el loop
}

const App = () => {
  const [showApp, setShowApp] = useState(false);
  const [timer, setTimer] = useState(3);
  const handleRestart = () => {
    window.location.reload(); // actualizar pagina f5
  };

  // cuenta regresiva de 3 segundos
  useEffect(() => {
    let countdown = timer;
    const interval = setInterval(() => {
      countdown--;
      setTimer(countdown);
    }, 1000);

    if (countdown === 0) {
      clearInterval(interval);
      setShowApp(true);
    }

    return () => clearInterval(interval);
  }, [timer]);

  return (
    <div>
      {showApp ? (
        <>
          <p id="score-display">Score: {score}</p>
          <p id="max">Max Score: {localStorage.getItem("maxscore") || "0"}</p>
          <div id="gameover" style={{ display: "none" } as React.CSSProperties}>
            <p id="game">Game over!</p>
            <button onClick={handleRestart}>reiniciar</button>
          </div>
          {doThreeJS()}
        </>
      ) : (
        <p id="loading">Loading... {timer} seconds</p>
      )}
    </div>
  );
};

export default App;
