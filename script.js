import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRobot } from "./robot.js";

window.studioBooted = true;
clearTimeout(window.studioBootTimer);

const $ = selector => document.querySelector(selector);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const componentPattern =
  /^(robot_(head|eye|neck)|chest_armor|torso_internal|waist|hip|(shoulder|upper_arm|forearm|hand|hip|thigh|knee|lower_leg|ankle|foot)_(left|right)|finger_(left|right)_(thumb|index|middle|ring|little))$/;

const descriptions = {
  robot_head: ["Cognitive Housing", "Protective cranial enclosure",
    "Protects perception hardware and onboard computation."],
  robot_eye: ["Optical Vision System", "Multi-spectrum optical unit",
    "Visual perception, depth estimation, and environmental mapping."],
  robot_neck: ["Stabilized Neck Assembly", "Multi-axis stabilizing joint",
    "Keeps the optical system steady while directing the head."],
  chest_armor: ["Protective Thoracic Shell", "Pearl composite armor",
    "Shields internal electronics while allowing service access."],
  torso_internal: ["Core Systems", "Compute, power, and thermal assembly",
    "Coordinates motion, distributes power, and transfers heat."],
  shoulder: ["Shoulder Actuator", "Multi-axis rotary assembly",
    "Positions the arm across a broad working envelope."],
  upper_arm: ["Upper Arm Link", "Structural actuator housing",
    "Transfers shoulder torque toward the elbow."],
  forearm: ["Forearm Assembly", "Drive and tendon enclosure",
    "Supports wrist motion and routes hand actuation."],
  hand: ["Dexterous Manipulator", "Tactile palm assembly",
    "Coordinates precision grasping and contact sensing."],
  finger: ["Articulated Digit", "Segmented precision finger",
    "Adapts the contact surface for delicate manipulation."],
  waist: ["Torso Coupling", "Rotary core interface",
    "Connects the upper body to the pelvic assembly."],
  hip: ["Pelvic Drive", "Load-bearing joint assembly",
    "Distributes body loads and coordinates leg positioning."],
  thigh: ["Upper Leg Link", "High-torque structural module",
    "Transfers hip motion and supports the knee."],
  knee: ["Knee Actuator", "Rotary drive and encoder",
    "Controls leg flexion and absorbs changing loads."],
  lower_leg: ["Lower Leg Assembly", "Support link and actuator housing",
    "Transfers loads between the knee and ankle."],
  ankle: ["Balance Interface", "Articulated ankle coupling",
    "Adjusts foot orientation for stable contact."],
  foot: ["Ground Contact System", "Compliant sole and support shell",
    "Provides a stable contact area and traction."]
};

function label(name) {
  return name.replace(/^robot_/, "").replaceAll("_", " ").toUpperCase();
}
function details(name) {
  if (descriptions[name]) return descriptions[name];
  const key = name.startsWith("finger_") ? "finger" : name.replace(/_(left|right)$/, "");
  return descriptions[key] || ["Robot Component", "Modular assembly", "Supports platform operation."];
}
function announce(text) { $("#announcement").textContent = text; }

function progress(value, text) {
  $("#loading-label").textContent = text;
  $("#progress").value = value;
  $("#percentage").textContent = `${Math.round(value)}%`;
}

async function main() {
  const canvas = $("#canvas");
  const viewport = $("#viewport");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101214);
  scene.fog = new THREE.Fog(0x101214, 7, 17);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.02, 40);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 0.3;
  controls.maxDistance = 8;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.target.set(0, 0.94, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xe4efe8, 0x25292b, 1.6));

  const key = new THREE.DirectionalLight(0xf2f3e9, 4);
  key.position.set(-3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -2;
  key.shadow.normalBias = 0.018;
  key.shadow.bias = -0.0001;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xb4ccd2, 3);
  rim.position.set(3, 3, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xc4f58a, 0.65);
  fill.position.set(-3, 1, -2);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({
      color: 0x15191a, metalness: 0.3, roughness: 0.4
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.009;
  floor.receiveShadow = true;
  scene.add(floor);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(0.79, 0.82, 0.022, 96),
    new THREE.MeshStandardMaterial({
      color: 0x22292a, metalness: 0.7, roughness: 0.3
    })
  );
  platform.position.y = -0.017;
  platform.receiveShadow = true;
  scene.add(platform);

  const perimeter = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.002, 6, 100),
    new THREE.MeshBasicMaterial({ color: 0x58634f })
  );
  perimeter.rotation.x = -Math.PI / 2;
  perimeter.position.y = -0.003;
  scene.add(perimeter);

  progress(8, "PREPARING MODEL");
  const asset = await loadRobot(renderer);
  const root = asset.root;
  scene.add(root);
  root.updateMatrixWorld(true);

  const records = [];
  const byObject = new Map();
  const byName = new Map();
  const meshEntries = [];
  const selectableMeshes = [];

  for (const node of asset.components) {
    const bounds = new THREE.Box3().setFromObject(node);
    if (bounds.isEmpty()) continue;

    const center = bounds.getCenter(new THREE.Vector3());
    const name = node.name;

    let x = center.x * 1.5;
    let y = (center.y - 0.95) * 0.6;
    let z = 0.08;

    if (name === "chest_armor") { z = 0.62; y = 0.15; }
    if (name === "torso_internal") { z = -0.24; y = 0.13; }
    if (name === "robot_eye") { z = 0.42; y = 0.67; }
    if (name === "robot_head") y = 0.62;
    if (name === "robot_neck") y = 0.38;
    if (name.startsWith("finger_")) {
      const index = ["thumb", "index", "middle", "ring", "little"]
        .indexOf(name.split("_").at(-1));
      x += (index - 2) * 0.065;
      y -= 0.12;
      z = 0.1 + index * 0.035;
    }

    const record = {
      node, name,
      rest: node.position.clone(),
      world: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      explode: new THREE.Vector3(x, y, z),
      inspect: new THREE.Vector3(
        Math.abs(center.x) > 0.2 ? Math.sign(center.x) * 0.1 : 0,
        0.035, 0.16
      ),
      depth: 0
    };
    let parent = node.parent;
    while (parent) { record.depth++; parent = parent.parent; }
    records.push(record);
    byObject.set(node, record);
    byName.set(name, record);
  }
  records.sort((a, b) => a.depth - b.depth);

  function owner(object) {
    let node = object;
    while (node) {
      if (byObject.has(node)) return byObject.get(node);
      node = node.parent;
    }
    return null;
  }

  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const original = Array.isArray(object.material) ? object.material : [object.material];
    const materials = original.map(material => material.clone());
    object.material = Array.isArray(object.material) ? materials : materials[0];

    const record = owner(object);
    if (record) selectableMeshes.push(object);

    materials.forEach(material => {
      meshEntries.push({
        material, record,
        color: material.color?.clone(),
        emissive: material.emissive?.clone(),
        intensity: material.emissiveIntensity ?? 0
      });
    });
  });

  for (const record of [...records].sort((a, b) => a.name.localeCompare(b.name))) {
    const option = document.createElement("option");
    option.value = record.name;
    option.textContent = label(record.name);
    $("#components").append(option);
  }

  let mode = "idle";
  let selected = null;
  let hovered = null;
  let exploded = false;
  let paused = reducedMotion;
  let time = 0;
  let cameraTween = null;
  let inspectionReturn = null;
  let currentAction = null;
  let interactionWeight = 1;

  const mixer = asset.clips.length ? new THREE.AnimationMixer(root) : null;
  const actions = new Map();
  if (mixer) {
    asset.clips.forEach(clip => actions.set(clip.name.toLowerCase(), mixer.clipAction(clip)));
  }

  function homePosition(isExploded = false) {
    const mobile = viewport.clientWidth < 760;
    const distance = isExploded ? (mobile ? 6.3 : 5.25) : (mobile ? 4.55 : 3.7);
    return new THREE.Vector3(distance * 0.3, 1.52, distance);
  }

  function fly(position, target) {
    cameraTween = {
      start: performance.now(), duration: reducedMotion ? 0 : 900,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      position: position.clone(), target: target.clone()
    };
  }

  function home() {
    fly(homePosition(exploded), new THREE.Vector3(0, exploded ? 0.95 : 0.94, 0));
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll("[data-mode]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    });
    const nextAction = actions.get(mode);
    if (nextAction && nextAction !== currentAction) {
      nextAction.reset().setEffectiveWeight(1).play();
      if (currentAction) {
        nextAction.crossFadeFrom(currentAction, reducedMotion ? 0 : 0.4, true);
      }
      currentAction = nextAction;
    }
    announce(`${mode} mode`);
  }

  document.querySelectorAll("[data-mode]").forEach(button => {
    if (!asset.animate && !actions.has(button.dataset.mode)) {
      button.disabled = true;
      button.title = `The GLB has no ${button.dataset.mode} animation clip.`;
    }
    button.addEventListener("click", () => {
      if (selected) closeInspection();
      if (exploded) toggleExploded(false);
      setMode(button.dataset.mode);
    });
  });
  setMode("idle");

  function updateMotionButton() {
    $("#motion").textContent = paused ? "RESUME MOTION" : "PAUSE MOTION";
    $("#motion").setAttribute("aria-pressed", String(paused));
  }
  updateMotionButton();

  function closeInspection(restoreCamera = true) {
    selected = null;
    $("#panel").hidden = true;
    $("#components").value = "";
    document.body.classList.remove("inspecting");
    if (restoreCamera && inspectionReturn) {
      fly(inspectionReturn.position, inspectionReturn.target);
    }
    inspectionReturn = null;
    announce("Robot reassembled");
  }

  function select(record) {
    if (!record) return;
    if (!selected) {
      inspectionReturn = {
        position: camera.position.clone(),
        target: controls.target.clone()
      };
    }

    if (exploded) toggleExploded(false, false);

    selected = record;
    hovered = null;
    $("#tooltip").hidden = true;
    $("#components").value = record.name;

    const [subtitle, component, functionText] = details(record.name);
    $("#part-number").textContent = String(records.indexOf(record) + 1).padStart(2, "0");
    $("#part-title").textContent = label(record.name);
    $("#part-subtitle").textContent = subtitle;
    $("#part-component").textContent = component;
    $("#part-function").textContent = functionText;
    $("#panel").hidden = false;
    document.body.classList.add("inspecting");

    // Temporarily evaluate the assembled pose, then restore offsets.
    const oldPositions = records.map(r => r.node.position.clone());
    records.forEach(r => r.node.position.copy(r.rest));
    root.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(record.node);
    const target = bounds.getCenter(new THREE.Vector3()).add(record.inspect);
    const size = bounds.getSize(new THREE.Vector3()).length();
    records.forEach((r, index) => r.node.position.copy(oldPositions[index]));
    root.updateMatrixWorld(true);

    const direction = camera.position.clone().sub(controls.target).normalize();
    if (direction.lengthSq() < 0.1) direction.set(0.3, 0.15, 1).normalize();

    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const fit = Math.max(
      size / (2 * Math.tan(halfFov)),
      size / (2 * Math.tan(halfFov) * camera.aspect)
    );
    const distance = Math.max(0.6, fit * 1.55);
    fly(target.clone().addScaledVector(direction, distance), target);
    announce(`${label(record.name)} selected. ${functionText}`);
  }

  function toggleExploded(value = !exploded, moveCamera = true) {
    exploded = value;
    if (selected) closeInspection(false);
    $("#explode").setAttribute("aria-pressed", String(exploded));
    $(".explode-label").textContent = exploded ? "REASSEMBLE" : "EXPLODED VIEW";
    if (moveCamera) home();
    announce(exploded ? "Exploded assembly view" : "Robot reassembled");
  }

  $("#explode").addEventListener("click", () => toggleExploded());
  $("#back").addEventListener("click", () => closeInspection());
  $("#components").addEventListener("change", event => {
    const record = byName.get(event.target.value);
    if (record) select(record);
    else closeInspection();
  });
  $("#motion").addEventListener("click", () => {
    paused = !paused;
    updateMotionButton();
  });
  $("#reset").addEventListener("click", () => {
    closeInspection(false);
    toggleExploded(false, false);
    setMode("idle");
    home();
  });
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeInspection(false);
      toggleExploded(false);
    }
  });

  controls.addEventListener("start", () => { cameraTween = null; });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerIds = new Set();
  let down = null;
  let hoverEvent = null;
  let moved = false;

  function hit(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      (event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    const result = raycaster.intersectObjects(selectableMeshes, false)[0];
    return result ? owner(result.object) : null;
  }

  canvas.addEventListener("pointerdown", event => {
    pointerIds.add(event.pointerId);
    if (pointerIds.size > 1) moved = true;
    else {
      down = { x: event.clientX, y: event.clientY };
      moved = false;
    }
  });
  canvas.addEventListener("pointermove", event => {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) moved = true;
    if (event.pointerType === "mouse" && !event.buttons) hoverEvent = event;
  });

  window.addEventListener("pointerup", event => {
    const canSelect = pointerIds.has(event.pointerId) && pointerIds.size === 1 &&
      !moved && down && event.target === canvas;
    pointerIds.delete(event.pointerId);
    if (canSelect) {
      const record = hit(event);
      if (record) select(record);
    }
    if (!pointerIds.size) down = null;
  });

  window.addEventListener("pointercancel", event => {
    pointerIds.delete(event.pointerId);
    moved = true;
    down = null;
  });
  canvas.addEventListener("pointerleave", () => {
    hovered = null;
    hoverEvent = null;
    $("#tooltip").hidden = true;
    canvas.style.cursor = "grab";
  });

  function resize() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  resize();
  camera.position.copy(homePosition());
  controls.update();

  const zero = new THREE.Vector3();
  const accent = new THREE.Color(0x93c85a);
  const tempColor = new THREE.Color();
  const localPosition = new THREE.Vector3();
  const clock = new THREE.Clock();
  let visibilityPaused = document.hidden;
  document.addEventListener("visibilitychange", () => {
    visibilityPaused = document.hidden;
    clock.getDelta();
  });

  function tick() {
    const delta = Math.min(clock.getDelta(), 0.05);
    if (visibilityPaused) return;

    const motionDelta = paused ? 0 : delta;
    time += motionDelta;
    interactionWeight = THREE.MathUtils.damp(
      interactionWeight, selected || exploded ? 0 : 1, 10, delta
    );

    // Always remove inspection offsets before evaluating the base assembly.
    records.forEach(record => record.node.position.copy(record.rest));

    if (asset.animate) {
      asset.animate(time, mode, interactionWeight, delta);
    } else if (mixer) {
      mixer.update(motionDelta * interactionWeight);
    }

    root.updateMatrixWorld(true);
    records.forEach(record => record.node.getWorldPosition(record.world));

    // Apply world-space offsets in parent-first order. This also supports
    // nested named component groups without accumulating parent offsets.
    for (const record of records) {
      const targetOffset = exploded ? record.explode :
        selected === record ? record.inspect : zero;
      record.offset.lerp(targetOffset, reducedMotion ? 1 : 1 - Math.exp(-7 * delta));

      localPosition.copy(record.world).add(record.offset);
      record.node.parent.worldToLocal(localPosition);
      record.node.position.copy(localPosition);
      record.node.updateWorldMatrix(false, true);
    }

    if (hoverEvent) {
      hovered = hit(hoverEvent);
      const tooltip = $("#tooltip");
      tooltip.hidden = !hovered;
      if (hovered) {
        tooltip.textContent = label(hovered.name);
        tooltip.style.left = `${Math.max(8, Math.min(innerWidth - 220, hoverEvent.clientX + 15))}px`;
        tooltip.style.top = `${Math.min(innerHeight - 45, hoverEvent.clientY + 15)}px`;
      }
      canvas.style.cursor = hovered ? "pointer" : "grab";
      hoverEvent = null;
    }

    for (const entry of meshEntries) {
      const active = entry.record && (entry.record === selected || entry.record === hovered);
      const dim = selected && entry.record !== selected ? 0.24 : 1;

      if (entry.color) {
        tempColor.copy(entry.color).multiplyScalar(dim);
        entry.material.color.lerp(tempColor, 1 - Math.exp(-12 * delta));
      }
      if (entry.emissive) {
        tempColor.copy(active ? accent : entry.emissive);
        entry.material.emissive.lerp(tempColor, 1 - Math.exp(-12 * delta));
        entry.material.emissiveIntensity = THREE.MathUtils.damp(
          entry.material.emissiveIntensity,
          active ? 0.38 : entry.intensity * dim, 12, delta
        );
      }
    }

    if (cameraTween) {
      const tween = cameraTween;
      const fraction = tween.duration === 0
      ? 1
      : Math.min(1, (performance.now() - tween.start) / tween.duration);

    const eased = fraction < 0.5
      ? 4 * fraction ** 3
      : 1 - ((-2 * fraction + 2) ** 3) / 2;

      camera.position.lerpVectors(tween.fromPosition, tween.position, eased);
      controls.target.lerpVectors(tween.fromTarget, tween.target, eased);
      if (fraction === 1) cameraTween = null;
    }

    controls.update();
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(tick);
  progress(100, "STUDIO READY");
  $("#source").textContent = asset.procedural
    ? "PROCEDURAL CONCEPT / LIVE 3D"
    : "GLB ASSET / LIVE 3D";
  $("#render-status").textContent = `${records.length} SELECTABLE MODULES`;
  setTimeout(() => {
    $("#loading").classList.add("done");
    setTimeout(() => { $("#loading").hidden = true; }, 550);
  }, reducedMotion ? 0 : 250);

  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    $("#loading").hidden = false;
    $("#loading").classList.remove("done");
    $("#loading-label").textContent = "Graphics context lost. Reload the page to restart the studio.";
  });
}

async function loadRobot(renderer) {
  const base = "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/";
  const draco = new DRACOLoader().setDecoderPath(`${base}draco/`);
  const ktx2 = new KTX2Loader().setTranscoderPath(`${base}basis/`).detectSupport(renderer);
  const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2);

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15000);

  try {
    const url = new URL("./assets/models/robot.glb", import.meta.url);
    const response = await fetch(url, { signal: abort.signal });
    if (!response.ok) throw new Error(`Model request returned ${response.status}`);

    const total = Number(response.headers.get("content-length")) || 0;
    let buffer;

    if (response.body) {
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (total) {
          progress(8 + Math.min(received / total, 1) *  seventy(), "DOWNLOADING ROBOT");
        } else {
          $("#progress").removeAttribute("value");
          $("#percentage").textContent = `${(received / 1048576).toFixed(1)} MB`;
          $("#loading-label").textContent = "DOWNLOADING ROBOT — SIZE UNKNOWN";
        }
      }
      buffer = await new Blob(chunks).arrayBuffer();
    } else {
      buffer = await response.arrayBuffer();
    }

    clearTimeout(timeout);
    progress(82, "DECODING ROBOT");
    const gltf = await loader.parseAsync(buffer, new URL("./", url).href);
    const root = new THREE.Group();
    root.name = "model_normalization";
    root.add(gltf.scene);

    let bounds = new THREE.Box3().setFromObject(root);
    const height = bounds.max.y - bounds.min.y;
    if (!Number.isFinite(height) || height < 0.001) throw new Error("Model has no measurable geometry");

    gltf.scene.scale.multiplyScalar(1.82 / height);
    root.updateMatrixWorld(true);
    bounds = new THREE.Box3().setFromObject(root);
    const center = bounds.getCenter(new THREE.Vector3());
    root.position.set(-center.x, -bounds.min.y, -center.z);
    root.updateMatrixWorld(true);

    const components = [];
    const names = new Set();
    root.traverse(node => {
      if (!componentPattern.test(node.name)) return;
      if (names.has(node.name)) throw new Error(`Duplicate component: ${node.name}`);
      names.add(node.name);
      components.push(node);
    });

    if (!components.length) throw new Error("GLB contains no recognized component names");

    progress(94, "REGISTERING COMPONENTS");
    return { root, components, clips: gltf.animations, procedural: false };
  } catch (error) {
    console.info("Using procedural robot:", error.message);
    progress(90, "BUILDING PROCEDURAL CONCEPT");
    const robot = buildRobot();
    return { ...robot, procedural: true };
  } finally {
    clearTimeout(timeout);
    draco.dispose();
    ktx2.dispose();
  }
}

// Downloading occupies 70 percentage points of overall startup progress.
function seventy() { return 70; }

main().catch(error => {
  console.error(error);
  $("#loading").hidden = false;
  $("#loading").classList.remove("done");
  $("#loading-label").textContent =
    "Unable to initialize the 3D studio. Check WebGL support and the browser console.";
  $("#percentage").textContent = "STARTUP ERROR";
});
