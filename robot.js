import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const boxCache = new Map();
const sphere = new THREE.SphereGeometry(1, 24, 16);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 24);

export function buildRobot() {
  const root = new THREE.Group();
  root.name = "vesper_robot";

  const joints = {};
  const components = [];

  const materials = {
    pearl: new THREE.MeshPhysicalMaterial({
      color: 0xe6e9e4,
      metalness: 0.28,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.15
    }),
    graphite: new THREE.MeshStandardMaterial({
      color: 0x20272a, metalness: 0.8, roughness: 0.32
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0x9aa8ad, metalness: 0.95, roughness: 0.2
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x090d0f, metalness: 0.05, roughness: 0.7
    }),
    light: new THREE.MeshStandardMaterial({
      color: 0xc4f58a, emissive: 0x9ddd58, emissiveIntensity: 1.3,
      metalness: 0.2, roughness: 0.18
    }),
    lens: new THREE.MeshPhysicalMaterial({
      color: 0x132f30, metalness: 0.55, roughness: 0.08,
      clearcoat: 1, emissive: 0x153b30, emissiveIntensity: 0.35
    })
  };

  function joint(name, parent, x, y, z = 0) {
    const group = new THREE.Group();
    group.name = `joint_${name}`;
    group.position.set(x, y, z);
    parent.add(group);
    joints[name] = group;
    return group;
  }

  function part(name, parent, x = 0, y = 0, z = 0) {
    const group = new THREE.Group();
    group.name = name;
    group.userData.component = true;
    group.position.set(x, y, z);
    parent.add(group);
    components.push(group);
    return group;
  }

  function mesh(parent, geometry, material, position, scale, rotation) {
    const object = new THREE.Mesh(geometry, materials[material]);
    if (position) object.position.set(...position);
    if (scale) object.scale.set(...scale);
    if (rotation) object.rotation.set(...rotation);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function box(parent, material, size, position = [0, 0, 0], radius = 0.025) {
    const key = [...size, radius].join(",");
    if (!boxCache.has(key)) {
      boxCache.set(key, new RoundedBoxGeometry(...size, 3, radius));
    }
    return mesh(parent, boxCache.get(key), material, position);
  }

  function ball(parent, material, size, position = [0, 0, 0]) {
    return mesh(parent, sphere, material, position, size);
  }

  function rod(parent, material, radius, length, position, rotation = [0, 0, 0]) {
    return mesh(parent, cylinder, material, position, [radius, length, radius], rotation);
  }

  function ring(parent, material, radius, tube, position, rotation = [0, 0, 0]) {
    return mesh(
      parent, new THREE.TorusGeometry(radius, tube, 8, 32),
      material, position, null, rotation
    );
  }

  function bolts(parent, points) {
    points.forEach(p => rod(parent, "chrome", 0.009, 0.008, p, [Math.PI / 2, 0, 0]));
  }

  const body = joint("body", root, 0, 1.02);
  const waist = part("waist", body);
  rod(waist, "graphite", 0.13, 0.16, [0, 0, 0]);
  for (let i = 0; i < 5; i++) {
    ring(waist, "chrome", 0.115, 0.009, [0, -0.06 + i * 0.029, 0], [Math.PI / 2, 0, 0]);
  }

  const torso = part("torso_internal", body, 0, 0.22);
  box(torso, "graphite", [0.29, 0.36, 0.19]);
  rod(torso, "chrome", 0.034, 0.33, [0, 0, -0.09]);
  for (const sign of [-1, 1]) {
    rod(torso, "chrome", 0.018, 0.31, [sign * 0.095, 0, 0.06], [0, 0, sign * -0.13]);
    rod(torso, "graphite", 0.032, 0.13, [sign * 0.095, -0.04, 0.06]);
    for (let i = 0; i < 6; i++) {
      box(torso, "chrome", [0.09, 0.016, 0.14], [sign * 0.12, -0.115 + i * 0.043, 0]);
    }
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.12, 0.16, -0.08),
      new THREE.Vector3(sign * 0.18, 0.02, -0.11),
      new THREE.Vector3(sign * 0.08, -0.16, -0.07)
    ]);
    mesh(torso, new THREE.TubeGeometry(curve, 16, 0.013, 6, false), "rubber");
  }

  const chest = part("chest_armor", body, 0, 0.25, 0.085);
  box(chest, "pearl", [0.39, 0.28, 0.15], [0, 0, 0], 0.055);
  box(chest, "graphite", [0.16, 0.018, 0.01], [0, 0.055, 0.08], 0.004);
  box(chest, "light", [0.065, 0.006, 0.008], [0, 0.055, 0.087], 0.002);
  bolts(chest, [[-0.15, -0.085, 0.076], [0.15, -0.085, 0.076]]);
  box(chest, "pearl", [0.28, 0.11, 0.1], [0, -0.18, -0.018], 0.025);

  const neck = part("robot_neck", body, 0, 0.465);
  rod(neck, "graphite", 0.054, 0.13, [0, 0, 0]);
  for (let i = 0; i < 4; i++) {
    ring(neck, "chrome", 0.053, 0.006, [0, -0.04 + i * 0.026, 0], [Math.PI / 2, 0, 0]);
  }
  for (const sign of [-1, 1]) {
    rod(neck, "chrome", 0.012, 0.12, [sign * 0.065, 0, 0.025], [0, 0, -sign * 0.25]);
  }

  const headJoint = joint("head", body, 0, 0.55);
  const head = part("robot_head", headJoint, 0, 0.085);
  box(head, "pearl", [0.255, 0.265, 0.235], [0, 0, 0], 0.075);
  box(head, "graphite", [0.211, 0.128, 0.07], [0, 0.014, 0.108], 0.035);
  box(head, "graphite", [0.08, 0.015, 0.02], [0, -0.09, 0.116], 0.004);

  for (const sign of [-1, 1]) {
    rod(head, "chrome", 0.048, 0.016, [sign * 0.126, -0.015, 0], [0, 0, Math.PI / 2]);
    for (let i = 0; i < 3; i++) {
      box(head, "graphite", [0.06, 0.008, 0.015], [sign * 0.07, 0.05 + i * 0.019, -0.115], 0.002);
    }
  }

  const eyeJoint = joint("eye", headJoint, 0, 0.102, 0.151);
  const eye = part("robot_eye", eyeJoint);
  rod(eye, "graphite", 0.066, 0.025, [0, 0, 0], [Math.PI / 2, 0, 0]);
  ring(eye, "chrome", 0.057, 0.006, [0, 0, 0.016]);
  ring(eye, "light", 0.045, 0.003, [0, 0, 0.023]);
  ball(eye, "lens", [0.04, 0.04, 0.015], [0, 0, 0.024]);
  ball(eye, "light", [0.008, 0.008, 0.003], [-0.01, 0.01, 0.039]);

  const hip = part("hip", body, 0, -0.115);
  box(hip, "graphite", [0.3, 0.13, 0.2]);
  box(hip, "pearl", [0.2, 0.1, 0.06], [0, -0.015, 0.11]);

  for (const [side, sign] of [["left", 1], ["right", -1]]) {
    const shoulderJoint = joint(`shoulder_${side}`, body, sign * 0.27, 0.335);
    const shoulder = part(`shoulder_${side}`, shoulderJoint);
    ball(shoulder, "graphite", [0.105, 0.105, 0.105]);
    ball(shoulder, "pearl", [0.12, 0.095, 0.11], [sign * 0.02, 0.035, 0]);
    rod(shoulder, "chrome", 0.065, 0.015, [sign * 0.105, 0, 0], [0, 0, Math.PI / 2]);

    const upper = part(`upper_arm_${side}`, shoulderJoint, sign * 0.025, -0.15);
    rod(upper, "graphite", 0.055, 0.24, [0, 0, 0]);
    box(upper, "pearl", [0.115, 0.19, 0.115], [0, 0, 0.025], 0.032);
    rod(upper, "chrome", 0.012, 0.2, [sign * 0.063, 0, -0.02]);

    const elbow = joint(`elbow_${side}`, shoulderJoint, sign * 0.025, -0.3);
    const forearm = part(`forearm_${side}`, elbow, 0, -0.115);
    rod(forearm, "chrome", 0.058, 0.13, [0, 0.115, 0], [0, 0, Math.PI / 2]);
    box(forearm, "graphite", [0.075, 0.24, 0.075]);
    box(forearm, "pearl", [0.105, 0.19, 0.12], [0, -0.01, 0.01], 0.035);
    box(forearm, "graphite", [0.012, 0.105, 0.012], [0, -0.008, 0.075], 0.003);
    rod(forearm, "chrome", 0.014, 0.22, [sign * 0.051, 0, -0.032]);

    const wrist = joint(`wrist_${side}`, elbow, 0, -0.265);
    const hand = part(`hand_${side}`, wrist, 0, -0.047);
    rod(hand, "chrome", 0.035, 0.036, [0, 0.05, 0]);
    box(hand, "graphite", [0.095, 0.1, 0.055]);
    box(hand, "pearl", [0.091, 0.073, 0.025], [0, 0.003, 0.033], 0.014);

    const fingerNames = ["index", "middle", "ring", "little"];
    fingerNames.forEach((finger, index) => {
      const fingerJoint = joint(
        `finger_${side}_${finger}`, wrist, -0.035 + index * 0.023, -0.102, 0
      );
      const fingerPart = part(`finger_${side}_${finger}`, fingerJoint);
      const length = index === 3 ? 0.073 : index === 1 ? 0.098 : 0.089;
      for (let segment = 0; segment < 3; segment++) {
        const y = -(segment + 0.5) * length / 3;
        box(fingerPart, "pearl", [0.018, length / 3 - 0.004, 0.024], [0, y, 0], 0.005);
        rod(fingerPart, "chrome", 0.009, 0.02, [0, -segment * length / 3, 0], [0, 0, Math.PI / 2]);
      }
    });

    const thumbJoint = joint(`finger_${side}_thumb`, wrist, -sign * 0.06, -0.04, 0);
    thumbJoint.rotation.z = -sign * 0.55;
    const thumb = part(`finger_${side}_thumb`, thumbJoint);
    box(thumb, "pearl", [0.024, 0.037, 0.027], [0, -0.019, 0], 0.007);
    ball(thumb, "chrome", [0.012, 0.012, 0.012], [0, -0.042, 0]);
    box(thumb, "pearl", [0.022, 0.032, 0.025], [0, -0.059, 0], 0.007);

    const hipJoint = joint(`hip_${side}`, body, sign * 0.115, -0.175);
    const hipPart = part(`hip_${side}`, hipJoint);
    ball(hipPart, "chrome", [0.083, 0.083, 0.083]);
    ring(hipPart, "graphite", 0.075, 0.016, [sign * 0.025, 0, 0], [0, Math.PI / 2, 0]);

    const thigh = part(`thigh_${side}`, hipJoint, 0, -0.16);
    box(thigh, "graphite", [0.095, 0.28, 0.11]);
    box(thigh, "pearl", [0.15, 0.27, 0.15], [0, 0, 0.017], 0.044);
    rod(thigh, "chrome", 0.015, 0.25, [sign * 0.078, 0, -0.04]);

    const kneeJoint = joint(`knee_${side}`, hipJoint, 0, -0.34);
    const knee = part(`knee_${side}`, kneeJoint);
    rod(knee, "chrome", 0.067, 0.135, [0, 0, 0], [0, 0, Math.PI / 2]);
    box(knee, "pearl", [0.115, 0.105, 0.055], [0, 0, 0.065], 0.025);

    const shin = part(`lower_leg_${side}`, kneeJoint, 0, -0.16);
    box(shin, "graphite", [0.075, 0.27, 0.09]);
    box(shin, "pearl", [0.12, 0.265, 0.125], [0, 0, 0.026], 0.034);
    for (const x of [-0.044, 0.044]) {
      rod(shin, "chrome", 0.01, 0.26, [x, 0, -0.045]);
    }

    const ankleJoint = joint(`ankle_${side}`, kneeJoint, 0, -0.31);
    const ankle = part(`ankle_${side}`, ankleJoint);
    ball(ankle, "chrome", [0.043, 0.043, 0.043]);

    const foot = part(`foot_${side}`, ankleJoint, 0, -0.035, 0.055);
    box(foot, "graphite", [0.135, 0.045, 0.235], [0, -0.017, 0], 0.019);
    box(foot, "pearl", [0.125, 0.06, 0.215], [0, 0.012, 0], 0.025);
    box(foot, "rubber", [0.13, 0.016, 0.22], [0, -0.045, 0], 0.006);
    for (let i = 0; i < 3; i++) {
      box(foot, "graphite", [0.1, 0.004, 0.005], [0, 0.043, 0.045 + i * 0.017], 0.001);
    }
  }

  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  root.position.y -= bounds.min.y;

  Object.values(joints).forEach(j => {
    j.userData.restPosition = j.position.clone();
    j.userData.restRotation = j.rotation.clone();
  });

  function animate(time, mode, weight, delta) {
    const smoothing = 1 - Math.exp(-10 * delta);

    for (const [name, j] of Object.entries(joints)) {
      const rest = j.userData.restRotation;
      const target = rest.clone();

      if (name === "head") {
        target.y += Math.sin(time * 0.55) * 0.18 * weight;
        target.x += Math.sin(time * 0.4) * 0.035 * weight;
      }
      if (name === "eye") target.y += Math.sin(time * 1.1) * 0.09 * weight;
      if (name.startsWith("finger_")) {
        target.x += (0.12 + Math.sin(time * 1.7 + name.length) * 0.08) * weight;
      }

      const sidePhase = name.endsWith("left") ? 0 : Math.PI;
      const stride = Math.sin(time * 3.4 + sidePhase);

      if (mode === "walk") {
        if (name.startsWith("hip_")) target.x += stride * 0.36 * weight;
        if (name.startsWith("knee_")) target.x += Math.max(0, -stride) * 0.65 * weight;
        if (name.startsWith("ankle_")) target.x -= stride * 0.12 * weight;
        if (name.startsWith("shoulder_")) target.x -= stride * 0.28 * weight;
        if (name.startsWith("elbow_")) target.x -= 0.16 * weight;
      }

      if (mode === "wave") {
        if (name === "shoulder_right") target.z -= 2.25 * weight;
        if (name === "elbow_right") target.z -= (0.25 + Math.sin(time * 4) * 0.3) * weight;
        if (name === "wrist_right") target.z += Math.sin(time * 4) * 0.13 * weight;
      }

      if (mode === "inspect") {
        if (name === "shoulder_left") target.x -= 0.8 * weight;
        if (name === "elbow_left") target.x -= 0.85 * weight;
        if (name === "head") {
          target.x += 0.28 * weight;
          target.y += 0.22 * weight;
        }
      }

      j.rotation.x = THREE.MathUtils.lerp(j.rotation.x, target.x, smoothing);
      j.rotation.y = THREE.MathUtils.lerp(j.rotation.y, target.y, smoothing);
      j.rotation.z = THREE.MathUtils.lerp(j.rotation.z, target.z, smoothing);
    }

    body.position.y = body.userData.restPosition.y +
      Math.sin(time * 1.5) * 0.004 * weight;
  }

  return { root, components, animate, clips: [] };
}
