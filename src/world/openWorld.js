// 阳光生活区：草地、道路、广场、建筑、树木路灯，以及一块运动训练场
import * as THREE from 'three';
import { createNightMarket } from './nightMarket.js';
import { createNpcSystem } from './npcs.js';

export const meta = {
  id: 'world',
  title: '阳光生活区',
  spawn: { x: 0, z: 12, yaw: Math.PI },
  bounds: { minX: -150, maxX: 150, minZ: -150, maxZ: 150 },
};

function makeTextSign(title, sub) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffdf6';
  ctx.fillRect(0, 0, 640, 320);
  ctx.fillStyle = '#2f8f6e';
  ctx.fillRect(0, 0, 640, 18);
  ctx.fillStyle = '#1f312c';
  ctx.font = 'bold 64px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 320, 138);
  ctx.fillStyle = '#526a62';
  ctx.font = '34px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(sub, 320, 214);
  ctx.fillStyle = '#ffc75b';
  ctx.beginPath();
  ctx.arc(70, 76, 26, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createScene(ctx) {
  const { registerInteractable, registerCollider } = ctx;
  const group = new THREE.Group();
  group.name = 'open-world';

  const M = {
    grass: new THREE.MeshLambertMaterial({ color: 0x84bf6a }),
    grassDark: new THREE.MeshLambertMaterial({ color: 0x76ad5f }),
    road: new THREE.MeshLambertMaterial({ color: 0x535a63 }),
    sidewalk: new THREE.MeshLambertMaterial({ color: 0xcfc7b6 }),
    line: new THREE.MeshLambertMaterial({ color: 0xf3ecd8 }),
    plaza: new THREE.MeshLambertMaterial({ color: 0xe6dcc4 }),
    trunk: new THREE.MeshLambertMaterial({ color: 0x7a5232 }),
    canopyA: new THREE.MeshLambertMaterial({ color: 0x4d8f57 }),
    canopyB: new THREE.MeshLambertMaterial({ color: 0x5da464 }),
    lampPole: new THREE.MeshLambertMaterial({ color: 0x59636e }),
    lampHead: new THREE.MeshLambertMaterial({ color: 0xfff2c9, emissive: 0xffc75b, emissiveIntensity: 0.05 }),
    building: new THREE.MeshLambertMaterial({ color: 0xefe9de }),
    buildingB: new THREE.MeshLambertMaterial({ color: 0xdfe6ec }),
    roof: new THREE.MeshLambertMaterial({ color: 0x8a6f5c }),
    window: new THREE.MeshLambertMaterial({ color: 0x2b3a4a, emissive: 0xffd98a, emissiveIntensity: 0.06 }),
    bench: new THREE.MeshLambertMaterial({ color: 0x9a6b48 }),
    court: new THREE.MeshLambertMaterial({ color: 0x2f8f80 }),
    courtLine: new THREE.MeshLambertMaterial({ color: 0xf5f2e8 }),
    mat: new THREE.MeshLambertMaterial({ color: 0xffd166 }),
    matRing: new THREE.MeshLambertMaterial({ color: 0xe0a83e }),
    metal: new THREE.MeshLambertMaterial({ color: 0x8a939e }),
    board: new THREE.MeshLambertMaterial({ color: 0xf4f2ea }),
    rim: new THREE.MeshLambertMaterial({ color: 0xd95d39 }),
    net: new THREE.MeshBasicMaterial({ color: 0xf8f6ee, wireframe: true, transparent: true, opacity: 0.75 }),
    water: new THREE.MeshLambertMaterial({ color: 0x6ec9dd, emissive: 0x3f96b0, emissiveIntensity: 0.12 }),
    stone: new THREE.MeshLambertMaterial({ color: 0xb8b2a2 }),
    flag: new THREE.MeshLambertMaterial({ color: 0xf0a23c }),
    signPost: new THREE.MeshLambertMaterial({ color: 0x5cc39a }),
  };

  function box(w, h, d, mat, x, y, z, cast = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function plane(w, h, mat, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // ---------- 地面 ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), M.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // 草地色块
  const patchGeo = new THREE.CircleGeometry(7, 24);
  const patches = [
    [-30, -2, 1.4], [26, -6, 1.1], [-14, 34, 1.0], [10, 44, 1.3], [-52, 22, 1.2], [70, -30, 1.4],
  ];
  patches.forEach(([x, z, s]) => {
    const p = new THREE.Mesh(patchGeo, M.grassDark);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, 0.008, z);
    p.scale.set(s, s * 0.8, 1);
    p.receiveShadow = true;
    group.add(p);
  });

  // ---------- 道路 ----------
  plane(240, 9, M.road, 0, 0.02, -20); // 主路（东西向）
  plane(8, 200, M.road, -55, 0.02, 40); // 支路（南北向）
  plane(240, 2.3, M.sidewalk, 0, 0.045, -13.6);
  plane(240, 2.3, M.sidewalk, 0, 0.045, -26.4);

  // 车道虚线
  const dashGeo = new THREE.BoxGeometry(1.6, 0.02, 0.18);
  const dashCount = 46;
  const dashes = new THREE.InstancedMesh(dashGeo, M.line, dashCount + 22);
  const dummy = new THREE.Object3D();
  let dashIndex = 0;
  for (let x = -112; x <= 112; x += 5) {
    dummy.position.set(x, 0.035, -20);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    dashes.setMatrixAt(dashIndex++, dummy.matrix);
  }
  for (let z = -56; z <= 134; z += 8.6) {
    dummy.position.set(-55, 0.035, z);
    dummy.rotation.set(0, Math.PI / 2, 0);
    dummy.updateMatrix();
    dashes.setMatrixAt(dashIndex++, dummy.matrix);
  }
  dashes.count = dashIndex;
  dashes.receiveShadow = true;
  group.add(dashes);

  // ---------- 广场 ----------
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(9.6, 48), M.plaza);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.04, 18);
  plaza.receiveShadow = true;
  group.add(plaza);

  // 喷泉
  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.95, 0.42, 20), M.stone);
  fountainBase.position.set(0, 0.21, 18);
  fountainBase.castShadow = true;
  fountainBase.receiveShadow = true;
  group.add(fountainBase);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.1, 20), M.water);
  water.position.set(0, 0.44, 18);
  group.add(water);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.9, 10), M.stone);
  spire.position.set(0, 0.8, 18);
  spire.castShadow = true;
  group.add(spire);
  registerCollider({ x: 0, z: 18, radius: 2.1 });

  // ---------- 树木（实例化）----------
  const treeSpots = [
    [-18, 2], [-24, 26], [-10, 36], [16, 36], [24, 10], [-34, -2], [-44, 12],
    [34, -2], [86, 12], [90, 34], [78, 40], [-70, -6], [-70, 60], [40, 52],
    [-16, 60], [30, 62], [66, -14], [86, -24], [-30, -36], [14, -38], [-40, -44],
  ];
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.9, 7);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, M.trunk, treeSpots.length);
  const canopyGeo = new THREE.IcosahedronGeometry(1.25, 0);
  const canopyMeshA = new THREE.InstancedMesh(canopyGeo, M.canopyA, treeSpots.length);
  const canopyMeshB = new THREE.InstancedMesh(canopyGeo, M.canopyB, treeSpots.length);
  treeSpots.forEach(([x, z], i) => {
    const s = 0.85 + ((i * 37) % 10) / 22;
    dummy.position.set(x, 0.95 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, i * 0.7, 0);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 2.15 * s, z);
    dummy.updateMatrix();
    canopyMeshA.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x + 0.35 * s, 2.75 * s, z - 0.2 * s);
    dummy.scale.set(s * 0.72, s * 0.72, s * 0.72);
    dummy.updateMatrix();
    canopyMeshB.setMatrixAt(i, dummy.matrix);
    dummy.scale.set(1, 1, 1);
    registerCollider({ x, z, radius: 0.42 * s });
  });
  trunkMesh.castShadow = true;
  canopyMeshA.castShadow = true;
  canopyMeshB.castShadow = true;
  group.add(trunkMesh, canopyMeshA, canopyMeshB);

  // ---------- 路灯 ----------
  const lampSpots = [
    [-30, -14.8], [-10, -14.8], [10, -14.8], [30, -14.8], [50, -14.8], [70, -14.8], [90, -14.8],
    [-30, -25.2], [-10, -25.2], [10, -25.2], [30, -25.2], [50, -25.2], [70, -25.2],
    [-8.6, 14], [8.6, 14], [-8.6, 22.5], [8.6, 22.5],
    [40, 10], [66, 12], [40, 36], [66, 36],
  ];
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.1, 3.1, 7);
  const poleMesh = new THREE.InstancedMesh(poleGeo, M.lampPole, lampSpots.length);
  const headGeo = new THREE.BoxGeometry(0.34, 0.16, 0.34);
  const headMesh = new THREE.InstancedMesh(headGeo, M.lampHead, lampSpots.length);
  lampSpots.forEach(([x, z], i) => {
    dummy.position.set(x, 1.55, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 3.14, z);
    dummy.updateMatrix();
    headMesh.setMatrixAt(i, dummy.matrix);
    registerCollider({ x, z, radius: 0.22 });
  });
  poleMesh.castShadow = true;
  group.add(poleMesh, headMesh);

  // 夜晚补光的点光源（数量克制，保证性能）
  const pointLights = [];
  [[0, 3.0, 18], [54, 3.0, 24], [0, 3.0, -18]].forEach(([x, y, z]) => {
    const light = new THREE.PointLight(0xffc98a, 0, 26, 2);
    light.position.set(x, y, z);
    group.add(light);
    pointLights.push(light);
  });

  // ---------- 长椅 ----------
  function makeBench(x, z, rotY) {
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.09, 0.5), M.bench);
    seat.position.y = 0.48;
    seat.castShadow = true;
    bench.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 0.07), M.bench);
    back.position.set(0, 0.78, -0.22);
    back.castShadow = true;
    bench.add(back);
    const legGeo = new THREE.BoxGeometry(0.09, 0.48, 0.42);
    [-0.7, 0.7].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, M.metal);
      leg.position.set(lx, 0.24, 0);
      leg.castShadow = true;
      bench.add(leg);
    });
    bench.position.set(x, 0, z);
    bench.rotation.y = rotY;
    group.add(bench);
    registerCollider({ x, z, radius: 1.0 });
  }
  makeBench(5, 22.6, Math.PI * 0.85);
  makeBench(-5.2, 13.4, -Math.PI * 0.15);
  makeBench(3.5, 8.2, Math.PI * 1.5);

  // ---------- 建筑 ----------
  const buildings = [
    { x: -26, z: 50, w: 24, h: 13, d: 12, mat: M.building },
    { x: 18, z: 52, w: 20, h: 11, d: 11, mat: M.buildingB },
    { x: -44, z: 34, w: 12, h: 7, d: 8, mat: M.building },
  ];
  const windowGeo = new THREE.BoxGeometry(1.1, 1.3, 0.08);
  const windows = [];
  buildings.forEach((b) => {
    box(b.w, b.h, b.d, b.mat, b.x, b.h / 2, b.z);
    box(b.w + 0.8, 0.5, b.d + 0.8, M.roof, b.x, b.h + 0.25, b.z);
    registerCollider({ minX: b.x - b.w / 2, maxX: b.x + b.w / 2, minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2 });
    const cols = Math.max(2, Math.floor(b.w / 3));
    const rows = Math.max(1, Math.floor(b.h / 3));
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        windows.push({
          x: b.x - b.w / 2 + (c + 0.5) * (b.w / cols),
          y: 1.8 + r * 2.6,
          z: b.z - b.d / 2 - 0.05,
        });
      }
    }
  });
  const windowMesh = new THREE.InstancedMesh(windowGeo, M.window, windows.length);
  windows.forEach((w, i) => {
    dummy.position.set(w.x, w.y, w.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    windowMesh.setMatrixAt(i, dummy.matrix);
  });
  group.add(windowMesh);

  // ---------- 花丛 ----------
  const flowerGeo = new THREE.IcosahedronGeometry(0.07, 0);
  const flowerMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const flowerCount = 70;
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  const flowerColors = [0xff8fa3, 0xffd166, 0xffffff, 0xc39bff, 0xffb26b];
  const color = new THREE.Color();
  for (let i = 0; i < flowerCount; i += 1) {
    const angle = (i * 2.399963) % (Math.PI * 2);
    const radius = 11 + ((i * 17) % 14);
    const x = Math.cos(angle) * radius + ((i % 5) - 2) * 2.4;
    const z = 18 + Math.sin(angle) * radius * 0.8;
    if (Math.abs(x) < 11 && Math.abs(z - 18) < 11) {
      dummy.position.set(x + 14, 0.12, z + 10);
    } else {
      dummy.position.set(x, 0.12, z);
    }
    dummy.rotation.set(0, i, 0);
    dummy.scale.set(1, 0.9 + (i % 3) * 0.15, 1);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    flowers.setColorAt(i, color.setHex(flowerColors[i % flowerColors.length]));
  }
  dummy.scale.set(1, 1, 1);
  group.add(flowers);

  // ---------- 运动训练场 ----------
  plane(34, 28, M.sidewalk, 56, 0.03, 24); // 场地基层
  plane(26, 14, M.court, 58, 0.07, 22); // 硅PU 球场

  // 球场白线
  box(26, 0.015, 0.12, M.courtLine, 58, 0.085, 15.05, false);
  box(26, 0.015, 0.12, M.courtLine, 58, 0.085, 28.95, false);
  box(0.12, 0.015, 14, M.courtLine, 45.05, 0.085, 22, false);
  box(0.12, 0.015, 14, M.courtLine, 70.95, 0.085, 22, false);
  box(0.1, 0.015, 14, M.courtLine, 58, 0.085, 22, false);
  box(4.8, 0.015, 0.1, M.courtLine, 68, 0.085, 19.6, false);
  box(4.8, 0.015, 0.1, M.courtLine, 68, 0.085, 24.4, false);
  box(0.1, 0.015, 4.8, M.courtLine, 65.6, 0.085, 22, false);

  const freeThrow = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.82, 32), M.courtLine);
  freeThrow.rotation.x = -Math.PI / 2;
  freeThrow.position.set(65.6, 0.085, 22);
  group.add(freeThrow);

  // 篮球架（篮板、篮筐、网）
  const hoop = new THREE.Group();
  const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.6, 10), M.metal);
  pole2.position.set(71.4, 1.8, 22);
  pole2.castShadow = true;
  hoop.add(pole2);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), M.metal);
  arm.position.set(70.95, 3.62, 22);
  hoop.add(arm);
  const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.06, 1.8), M.board);
  backboard.position.set(70.42, 3.5, 22);
  backboard.castShadow = true;
  hoop.add(backboard);
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.62), M.rim);
  boardFrame.position.set(70.38, 3.28, 22);
  hoop.add(boardFrame);
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.02, 8, 22), M.rim);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.set(69.98, 3.05, 22);
  hoop.add(rimMesh);
  const netMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.15, 0.42, 10, 3, true), M.net);
  netMesh.position.set(69.98, 2.82, 22);
  hoop.add(netMesh);
  group.add(hoop);
  registerCollider({ x: 71.4, z: 22, radius: 0.3 });

  // 跳绳垫
  const ropeMat = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), M.mat);
  ropeMat.rotation.x = -Math.PI / 2;
  ropeMat.position.set(47, 0.075, 31);
  ropeMat.receiveShadow = true;
  group.add(ropeMat);
  const ropeRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.62, 40), M.matRing);
  ropeRing.rotation.x = -Math.PI / 2;
  ropeRing.position.set(47, 0.082, 31);
  group.add(ropeRing);

  // 慢跑起点旗
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 8), M.metal);
  flagPole.position.set(36, 1.1, 13);
  flagPole.castShadow = true;
  group.add(flagPole);
  const flag = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 4), M.flag);
  flag.rotation.z = -Math.PI / 2;
  flag.position.set(36.4, 1.95, 13);
  group.add(flag);
  registerCollider({ x: 36, z: 13, radius: 0.16 });

  // ---------- 指示牌 ----------
  const signTex = makeTextSign('阳光生活区', '前方右转 · 运动训练场');
  const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: signTex }));
  signBoard.position.set(3.6, 1.75, 5.6);
  signBoard.rotation.y = Math.PI * 0.92;
  group.add(signBoard);
  [-1.4, 1.4].forEach((dx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.8, 8), M.signPost);
    post.position.set(3.6 + dx, 0.9, 5.75);
    post.castShadow = true;
    group.add(post);
  });

  // ---------- 交互点 ----------
  const interactables = [
    { id: 'jump-rope', label: '跳绳垫 · 开始跳绳', position: { x: 47, y: 0.1, z: 31 }, radius: 2.6, action: 'jumpRope' },
    {
      id: 'basketball', label: '篮球架 · 投篮训练', position: { x: 65, y: 0.1, z: 22 }, radius: 2.8, action: 'basketball',
      meta: { rim: { x: 69.98, y: 3.05, z: 22 } },
    },
    { id: 'run', label: '慢跑起点 · 开始晨跑', position: { x: 36, y: 0.1, z: 13 }, radius: 2.4, action: 'run' },
    { id: 'bench', label: '长椅 · 坐下休息', position: { x: 5, y: 0.1, z: 22.6 }, radius: 2.0, action: 'rest' },
    { id: 'sunbath', label: '草坪 · 晒太阳', position: { x: -14, y: 0.1, z: 26 }, radius: 2.4, action: 'sunbathe' },
  ];
  interactables.forEach((it) => registerInteractable(it));

  // ---------- 十字街夜市 + NPC ----------
  const market = createNightMarket({
    registerInteractable,
    registerCollider,
    time: ctx.time,
  });
  group.add(market.group);

  const npcs = createNpcSystem({ registerInteractable });
  group.add(npcs.group);
  npcs.onGreet((npc) => {
    window.dispatchEvent(new CustomEvent('npc-greet', {
      detail: { id: npc.def.id, name: npc.def.name },
    }));
  });

  // ---------- 夜晚状态 ----------
  let nightApplied = null;
  function applyNight(isNight) {
    if (nightApplied === isNight) return;
    nightApplied = isNight;
    M.lampHead.emissiveIntensity = isNight ? 1.5 : 0.05;
    M.window.emissiveIntensity = isNight ? 0.95 : 0.06;
    pointLights.forEach((l) => { l.intensity = isNight ? 0.9 : 0; });
  }

  let waterPhase = 0;
  function update(dt) {
    waterPhase += dt;
    water.scale.setScalar(1 + Math.sin(waterPhase * 1.8) * 0.02);
    flag.rotation.y = Math.sin(waterPhase * 1.4) * 0.18;
    market.update(dt, waterPhase);
    npcs.update(dt, ctx.player ? ctx.player.position : null);
    const state = ctx.time.getState();
    applyNight(state.isNight);
  }

  function dispose() {
    market.dispose();
    npcs.dispose();
    group.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else if (obj.material) obj.material.dispose();
      }
    });
    signTex.dispose();
  }

  return { group, update, interactables, dispose };
}
