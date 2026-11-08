// 小区环境：地面、路网、围墙与大门、中心花园、路灯、行道树、邻里别墅
import * as THREE from 'three';
import { Batch, seededRandom, signTexture, disposeObject } from './utils.js';
import { HOME_LAYOUT as L, HOME_LABELS } from '../../data/homeLayout.js';

export function createNeighborhood(mats, addCollider, T = THREE) {
  const group = new THREE.Group();
  group.name = 'home-neighborhood';
  const lampPointLights = [];
  const fountainJets = [];
  const rand = seededRandom(2024);

  // ---------------- 地面 ----------------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(232, 232), mats.lawnGround);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  group.add(ground);

  // ---------------- 路网 ----------------
  const roadBatch = new Batch();
  const walkBatch = new Batch();
  const privateWalkBatch = new Batch();
  const linerBatch = new Batch();

  roadBatch.box(L.roads.main.maxX - L.roads.main.minX, 0.1, L.roads.main.maxZ - L.roads.main.minZ,
    (L.roads.main.minX + L.roads.main.maxX) / 2, 0.02, (L.roads.main.minZ + L.roads.main.maxZ) / 2);
  roadBatch.box(L.roads.north.maxX - L.roads.north.minX, 0.1, L.roads.north.maxZ - L.roads.north.minZ,
    (L.roads.north.minX + L.roads.north.maxX) / 2, 0.02, (L.roads.north.minZ + L.roads.north.maxZ) / 2);
  roadBatch.box(L.roads.westLink.width, 0.1, L.roads.westLink.maxZ - L.roads.westLink.minZ,
    L.roads.westLink.x, 0.02, (L.roads.westLink.minZ + L.roads.westLink.maxZ) / 2);
  roadBatch.box(L.roads.eastLink.width, 0.1, L.roads.eastLink.maxZ - L.roads.eastLink.minZ,
    L.roads.eastLink.x, 0.02, (L.roads.eastLink.minZ + L.roads.eastLink.maxZ) / 2);
  // 大门外的引道
  roadBatch.box(9, 0.1, 8, 108.5, 0.02, 24);

  // 人行道（主干道两侧）
  walkBatch.box(L.roads.main.maxX - L.roads.main.minX, 0.12, 2, 0, 0.07, 19);
  walkBatch.box(L.roads.main.maxX - L.roads.main.minX, 0.12, 2, 0, 0.07, 29);
  // 支路人行道
  walkBatch.box(1.8, 0.12, L.roads.westLink.maxZ - L.roads.westLink.minZ, -55.5, 0.07, -24);
  walkBatch.box(1.8, 0.12, L.roads.eastLink.maxZ - L.roads.eastLink.minZ, 65.5, 0.07, -24);
  // 花园主步道
  walkBatch.box(4, 0.12, L.roads.gardenPath.maxZ - L.roads.gardenPath.minZ, 50, 0.07, -2.5);
  // 私家车道（院门 → 主干道）
  privateWalkBatch.box(7, 0.1, 12, 0, 0.05, 14);

  const roadMesh = roadBatch.build(mats.road, { receiveShadow: true });
  const walkMesh = walkBatch.build(mats.pavingLight, { receiveShadow: true });
  const privateWalkMesh = privateWalkBatch.build(mats.pavingYard, { receiveShadow: true });
  if (roadMesh) group.add(roadMesh);
  if (walkMesh) group.add(walkMesh);
  if (privateWalkMesh) group.add(privateWalkMesh);

  // 路缘石
  linerBatch.box(L.roads.main.maxX - L.roads.main.minX, 0.16, 0.18, 0, 0.1, 20.1);
  linerBatch.box(L.roads.main.maxX - L.roads.main.minX, 0.16, 0.18, 0, 0.1, 27.9);
  linerBatch.box(0.18, 0.16, L.roads.westLink.maxZ - L.roads.westLink.minZ, -55.9, 0.1, -24);
  linerBatch.box(0.18, 0.16, L.roads.eastLink.maxZ - L.roads.eastLink.minZ, 65.9, 0.1, -24);
  const linerMesh = linerBatch.build(mats.stone, { receiveShadow: true });
  if (linerMesh) group.add(linerMesh);

  // ---------------- 小区围墙 ----------------
  const wallBatch = new Batch();
  const W = L.compound.wall;
  const wallH = 2.2;
  const gateZ = L.compound.entrance.z;
  const gapHalf = L.compound.entrance.gap / 2;
  // 南、北、西
  wallBatch.box(W * 2, wallH, 0.35, 0, 0.02, W);
  wallBatch.box(W * 2, wallH, 0.35, 0, 0.02, -W);
  wallBatch.box(0.35, wallH, W * 2, -W, 0.02, 0);
  // 东侧留门
  wallBatch.box(0.35, wallH, W + gateZ - gapHalf, W, 0.02, (gateZ - gapHalf - W) / 2);
  wallBatch.box(0.35, wallH, W - gateZ - gapHalf, W, 0.02, (gateZ + gapHalf + W) / 2);
  // 墙顶压条
  wallBatch.box(W * 2 + 0.3, 0.12, 0.5, 0, wallH, W);
  wallBatch.box(W * 2 + 0.3, 0.12, 0.5, 0, wallH, -W);
  wallBatch.box(0.5, 0.12, W * 2 + 0.3, -W, wallH, 0);
  wallBatch.box(0.5, 0.12, W + gateZ - gapHalf, W, wallH, (gateZ - gapHalf - W) / 2);
  wallBatch.box(0.5, 0.12, W - gateZ - gapHalf, W, wallH, (gateZ + gapHalf + W) / 2);
  const wallMesh = wallBatch.build(mats.stone, { castShadow: true, receiveShadow: true });
  if (wallMesh) group.add(wallMesh);

  addCollider(0, W, W * 2 + 0.4, 0.5, wallH);
  addCollider(0, -W, W * 2 + 0.4, 0.5, wallH);
  addCollider(-W, 0, 0.5, W * 2, wallH);
  addCollider(W, (gateZ - gapHalf - W) / 2, 0.5, W + gateZ - gapHalf, wallH);
  addCollider(W, (gateZ + gapHalf + W) / 2, 0.5, W - gateZ - gapHalf, wallH);

  // ---------------- 小区大门 ----------------
  const gateGroup = new THREE.Group();
  gateGroup.name = 'compound-gate';
  const gatePillar = new Batch();
  [gateZ - gapHalf, gateZ + gapHalf].forEach((z) => {
    gatePillar.box(1.1, 4.4, 1.1, W, 0.02, z);
    gatePillar.box(1.4, 0.22, 1.4, W, 4.42, z);
    gatePillar.box(0.9, 0.35, 0.9, W, 4.64, z);
  });
  gatePillar.box(0.6, 0.75, gapHalf * 2 + 2.2, W, 4.75, gateZ);
  const gatePillarMesh = gatePillar.build(mats.cream, { castShadow: true, receiveShadow: true });
  if (gatePillarMesh) gateGroup.add(gatePillarMesh);

  const gateSignTex = signTexture(HOME_LABELS.compound, 'AOYUAN PLAZA · CENTRAL VILLA', {
    bg: '#fdf9ee', accent: '#4f8f6b', width: 1024, height: 256,
  });
  const gateSignMat = new THREE.MeshBasicMaterial({ map: gateSignTex, side: THREE.DoubleSide });
  const gateSign = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.0), gateSignMat);
  gateSign.rotation.y = -Math.PI / 2;
  gateSign.position.set(W - 0.32, 4.75, gateZ);
  gateGroup.add(gateSign);

  // 门岗
  const booth = new Batch();
  const bz = 15.2;
  booth.box(3.2, 2.7, 2.8, W - 4.2, 0.02, bz);
  booth.box(3.5, 0.16, 3.1, W - 4.2, 2.72, bz);
  booth.box(1.0, 1.1, 0.12, W - 4.2, 0.9, bz - 1.36);
  booth.box(0.12, 1.3, 0.9, W - 5.8, 0.8, bz);
  const boothMesh = booth.build(mats.creamWarm, { castShadow: true, receiveShadow: true });
  if (boothMesh) gateGroup.add(boothMesh);
  const boothGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), mats.carGlass);
  boothGlass.position.set(W - 4.2, 1.45, bz - 1.43);
  boothGlass.rotation.y = Math.PI;
  gateGroup.add(boothGlass);
  addCollider(W - 4.2, bz, 3.3, 2.9, 2.8);

  // 出口方向提示（指向金榜小学）
  const dirTex = signTexture('金榜小学 →', 'SCHOOL', { bg: '#f4faf4', accent: '#4f8f6b', width: 512, height: 200 });
  const dirSign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.35), new THREE.MeshBasicMaterial({ map: dirTex }));
  dirSign.rotation.y = -Math.PI / 2;
  dirSign.position.set(109.4, 2.7, 24);
  gateGroup.add(dirSign);
  const dirPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 8), mats.metalDark);
  dirPole.position.set(109.4, 1.3, 21.8);
  gateGroup.add(dirPole);
  group.add(gateGroup);

  // ---------------- 中心花园 ----------------
  const garden = createGarden(mats, addCollider);
  group.add(garden.group);
  fountainJets.push(...garden.jets);

  // ---------------- 路灯 ----------------
  const lampPole = new Batch();
  const lampHead = new Batch();
  const lampCap = new Batch();
  const lampSpots = [
    [-88, 18.4], [-64, 18.4], [-38, 18.4], [-14, 18.4], [14, 18.4], [38, 18.4], [64, 18.4], [88, 18.4],
    [-72, 30.4], [-44, 30.4], [-16, 30.4], [16, 30.4], [44, 30.4], [72, 30.4],
    [-64, -30], [-64, -54], [70, -30], [70, -54],
    [50, -26], [-24, 62], [24, 62],
  ];
  lampSpots.forEach(([x, z]) => {
    lampPole.cylinder(0.07, 0.09, 4.0, 8, x, 0.02, z);
    lampPole.cylinder(0.18, 0.22, 0.3, 8, x, 0.02, z);
    lampHead.box(0.46, 0.5, 0.46, x, 4.0, z);
    lampCap.box(0.56, 0.08, 0.56, x, 4.5, z);
    addCollider(x, z, 0.5, 0.5, 4.4);
  });
  const lampPoleMesh = lampPole.build(mats.metalDark, { castShadow: true });
  const lampHeadMesh = lampHead.build(mats.lampGlow, { castShadow: false });
  const lampCapMesh = lampCap.build(mats.metalDark, { castShadow: true });
  if (lampPoleMesh) group.add(lampPoleMesh);
  if (lampHeadMesh) group.add(lampHeadMesh);
  if (lampCapMesh) group.add(lampCapMesh);

  // 重点位置的真实点光源（其余路灯只用自发光灯罩，控制灯光数量）
  [
    [-14, 18.4], [16, 18.4], [-38, 18.4],
    [50, -26], [-24, 62],
  ].forEach(([x, z]) => {
    const light = new THREE.PointLight(0xffc178, 0, 22, 1.7);
    light.position.set(x, 3.95, z);
    group.add(light);
    lampPointLights.push(light);
  });

  // ---------------- 行道树与绿化 ----------------
  const treeSpots = [];
  for (let x = -96; x <= 96; x += 16) {
    if (Math.abs(x) < 8) continue;
    if (x > 44 && x < 56) continue;
    treeSpots.push([x, 15.5, 1.0]);
  }
  for (let x = -88; x <= 88; x += 18) {
    if (x > 44 && x < 56) continue;
    treeSpots.push([x, 32.2, 0.9]);
  }
  for (let x = -88; x <= 88; x += 18) {
    treeSpots.push([x, -64.5, 1.05]);
  }
  for (let x = -40; x <= 40; x += 20) {
    if (x > -22 && x < 22) continue;
    treeSpots.push([x, -50, 1.15]);
  }
  [[-26, 2], [-27, -18], [26, -16], [26, -34], [-64, 34], [70, 34], [88, 10], [-90, 6]].forEach(([x, z]) => {
    treeSpots.push([x, z, 1.1]);
  });

  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 2.6, 7);
  trunkGeo.translate(0, 1.3, 0);
  const canopyGeo = new THREE.IcosahedronGeometry(1.55, 1);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, mats.trunk, treeSpots.length);
  const canopyMesh = new THREE.InstancedMesh(canopyGeo, mats.leaf, treeSpots.length);
  const canopyMesh2 = new THREE.InstancedMesh(canopyGeo, mats.leafLight, treeSpots.length);
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  treeSpots.forEach(([x, z, sc], i) => {
    const jitter = rand() * 0.5;
    e.set(0, rand() * Math.PI * 2, 0);
    q.setFromEuler(e);
    p.set(x, 0.02, z);
    s.set(sc, sc * (0.95 + jitter * 0.3), sc);
    mtx.compose(p, q, s);
    trunkMesh.setMatrixAt(i, mtx);

    p.set(x + (rand() - 0.5) * 0.5, 2.5 + sc * 0.4, z + (rand() - 0.5) * 0.5);
    s.set(sc * (1 + rand() * 0.25), sc * (1 + rand() * 0.2), sc * (1 + rand() * 0.25));
    mtx.compose(p, q, s);
    canopyMesh.setMatrixAt(i, mtx);

    p.set(x + (rand() - 0.5) * 1.1, 3.15 + sc * 0.35, z + (rand() - 0.5) * 1.1);
    s.set(sc * (0.55 + rand() * 0.25), sc * (0.5 + rand() * 0.2), sc * (0.55 + rand() * 0.25));
    mtx.compose(p, q, s);
    canopyMesh2.setMatrixAt(i, mtx);

    addCollider(x, z, 0.55 * sc, 0.55 * sc, 3);
  });
  trunkMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.instanceMatrix.needsUpdate = true;
  canopyMesh2.instanceMatrix.needsUpdate = true;
  trunkMesh.castShadow = true;
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;
  trunkMesh.frustumCulled = false;
  canopyMesh.frustumCulled = false;
  canopyMesh2.frustumCulled = false;
  group.add(trunkMesh, canopyMesh, canopyMesh2);

  // 围墙内绿篱
  const hedgeBatch = new Batch();
  for (let z = -98; z <= 98; z += 8) {
    if (Math.abs(z - 24) < 7) continue;
    hedgeBatch.box(1.1, 1.1, 3.2, -101.5, 0.02, z);
  }
  for (let x = -98; x <= 98; x += 9) {
    hedgeBatch.box(3.6, 1.0, 1.1, x, 0.02, -101.5);
  }
  const hedgeMesh = hedgeBatch.build(mats.hedge, { castShadow: true, receiveShadow: true });
  if (hedgeMesh) group.add(hedgeMesh);

  // ---------------- 邻里别墅 ----------------
  group.add(createNeighborVillas(mats, addCollider));

  // ---------------- 动画 ----------------
  let t = 0;
  function update(dt) {
    t += dt;
    fountainJets.forEach((jet, i) => {
      jet.scale.y = 0.78 + Math.sin(t * 2.4 + i * 1.3) * 0.18;
      jet.position.y = jet.userData.baseY;
    });
  }

  const pointLights = lampPointLights;
  return { group, update, pointLights, dispose: () => disposeObject(group) };
}

// ---------------------------------------------------------------------------
// 中心花园：水景、喷泉、环形步道、花坛、长椅、凉亭
// ---------------------------------------------------------------------------
function createGarden(mats, addCollider) {
  const g = new THREE.Group();
  g.name = 'central-garden';
  const G = L.garden;
  const lx = G.cx;
  const lz = G.cz;

  const pathBatch = new Batch();
  // 环湖步道
  const ring = new THREE.Mesh(new THREE.RingGeometry(G.ringRadius, G.ringRadius + 2.4, 56), mats.pavingLight);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(lx, 0.14, lz);
  ring.receiveShadow = true;
  g.add(ring);

  // 四条放射小径
  const radial = new Batch();
  radial.box(2.2, 0.12, 9, lx, 0.1, lz + G.ringRadius + 4.5);
  radial.box(2.2, 0.12, 9, lx, 0.1, lz - G.ringRadius - 4.5);
  radial.box(9, 0.12, 2.2, lx + G.ringRadius + 4.5, 0.1, lz);
  radial.box(9, 0.12, 2.2, lx - G.ringRadius - 4.5, 0.1, lz);
  const radialMesh = radial.build(mats.pavingLight, { receiveShadow: true });
  if (radialMesh) g.add(radialMesh);

  // 水池
  const pondRim = new THREE.Mesh(new THREE.CylinderGeometry(G.pondRadius + 0.7, G.pondRadius + 0.9, 0.42, 48), mats.stone);
  pondRim.position.set(lx, 0.21, lz);
  pondRim.castShadow = true;
  pondRim.receiveShadow = true;
  g.add(pondRim);
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(G.pondRadius, G.pondRadius, 0.16, 48), mats.water);
  pond.position.set(lx, 0.3, lz);
  g.add(pond);
  addCollider(lx, lz, G.pondRadius * 2 + 1.2, G.pondRadius * 2 + 1.2, 0.5);

  // 喷泉
  const fountain = new Batch();
  fountain.cylinder(1.5, 1.7, 0.5, 16, lx, 0.36, lz);
  fountain.cylinder(0.55, 0.75, 1.0, 12, lx, 0.86, lz);
  fountain.cylinder(2.2, 1.9, 0.16, 16, lx, 1.86, lz);
  fountain.cylinder(0.32, 0.42, 0.7, 10, lx, 1.98, lz);
  const fountainMesh = fountain.build(mats.stone, { castShadow: true, receiveShadow: true });
  if (fountainMesh) g.add(fountainMesh);

  const jets = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 1.2, 6), mats.waterJet);
    jet.position.set(lx + Math.cos(a) * 1.25, 2.0, lz + Math.sin(a) * 1.25);
    jet.rotation.z = Math.cos(a) * 0.22;
    jet.rotation.x = -Math.sin(a) * 0.22;
    jet.userData.baseY = 2.0;
    g.add(jet);
    jets.push(jet);
  }
  const centerJet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 2.0, 8), mats.waterJet);
  centerJet.position.set(lx, 2.6, lz);
  centerJet.userData.baseY = 2.6;
  g.add(centerJet);
  jets.push(centerJet);

  // 长椅（四个方向）
  const benchBatch = new Batch();
  const benchAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  benchAngles.forEach((a) => {
    const bx = lx + Math.cos(a) * (G.ringRadius + 1.2);
    const bz = lz + Math.sin(a) * (G.ringRadius + 1.2);
    const ry = -a + Math.PI / 2;
    benchBatch.box(2.4, 0.12, 0.6, bx, 0.5, bz, ry);
    benchBatch.box(2.4, 0.55, 0.12, bx - Math.cos(a) * 0.28, 0.55, bz - Math.sin(a) * 0.28, ry);
    for (const sgn of [-1, 1]) {
      const ox = Math.cos(a + Math.PI / 2) * 0.95 * sgn;
      const oz = Math.sin(a + Math.PI / 2) * 0.95 * sgn;
      benchBatch.box(0.12, 0.5, 0.5, bx + ox, 0.02, bz + oz, ry);
    }
    addCollider(bx, bz, 2.2, 2.2, 0.7);
  });
  const benchMesh = benchBatch.build(mats.wood, { castShadow: true, receiveShadow: true });
  if (benchMesh) g.add(benchMesh);

  // 花坛（四组）与花球
  const soilBox = new Batch();
  const flowerColors = [mats.flower[0], mats.flower[1], mats.flower[2], mats.flower[3]];
  const bedSpots = [];
  for (let i = 0; i < 4; i += 1) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const fx = lx + Math.cos(a) * (G.ringRadius + 2.2);
    const fz = lz + Math.sin(a) * (G.ringRadius + 2.2);
    soilBox.box(4.2, 0.45, 2.2, fx, 0.02, fz, -a);
    bedSpots.push([fx, fz]);
    addCollider(fx, fz, 4.4, 2.4, 0.55);
  }
  const soilBaseMesh = soilBox.build(mats.soil, { receiveShadow: true });
  if (soilBaseMesh) g.add(soilBaseMesh);

  // 彩色花球分批合并（每个花坛同一花色，视觉更干净）
  flowerColors.forEach((mat, ci) => {
    const fb = new Batch();
    const [fx, fz] = bedSpots[ci];
    for (let k = 0; k < 12; k += 1) {
      const ox = (Math.random() - 0.5) * 3.4;
      const oz = (Math.random() - 0.5) * 1.5;
      fb.sphere(0.11 + Math.random() * 0.08, fx + ox, 0.6 + Math.random() * 0.16, fz + oz, 7, 6);
    }
    const mesh = fb.build(mat, { receiveShadow: false });
    if (mesh) g.add(mesh);
  });

  // 凉亭
  const pav = new Batch();
  const px = lx;
  const pz = lz - (G.ringRadius + 8);
  [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]].forEach(([ox, oz]) => {
    pav.cylinder(0.14, 0.16, 3.0, 8, px + ox, 0.02, pz + oz);
  });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 1.3, 4), mats.woodDark);
  roof.position.set(px, 3.66, pz);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  pav.box(5.1, 0.22, 5.1, px, 3.0, pz);
  const pavMesh = pav.build(mats.wood, { castShadow: true });
  if (pavMesh) g.add(pavMesh);
  addCollider(px, pz, 5.2, 5.2, 0.5);
  void pathBatch;

  return { group: g, jets };
}

// ---------------------------------------------------------------------------
// 邻里别墅（简化外观，营造小区氛围）
// ---------------------------------------------------------------------------
function createNeighborVillas(mats, addCollider) {
  const g = new THREE.Group();
  g.name = 'neighbor-villas';
  const body = new Batch();
  const roof = new Batch();
  const glass = new Batch();
  const wood = new Batch();
  const hedge = new Batch();

  const villas = [
    { x: -45, z: -52, w: 18, d: 14, h: 5.4 },
    { x: -82, z: -38, w: 20, d: 14, h: 6.0 },
    { x: 90, z: -45, w: 18, d: 14, h: 5.4 },
    { x: -78, z: 58, w: 18, d: 14, h: 5.4 },
    { x: 45, z: 58, w: 18, d: 14, h: 6.0 },
    { x: 86, z: -5, w: 16, d: 13, h: 5.4 },
  ];

  villas.forEach(({ x, z, w, d, h }) => {
    body.box(w, h, d, x, 0.02, z);
    roof.box(w + 0.8, 0.28, d + 0.8, x, h, z);
    // 二层小露台
    body.box(w * 0.42, 0.2, 2.2, x + w * 0.24, h - 2.4, z + d / 2 + 1.0);
    // 窗户
    for (const sx of [-0.28, 0.28]) {
      glass.box(w * 0.22, 1.5, 0.08, x + w * sx, 1.1, z + d / 2 + 0.02);
      glass.box(w * 0.22, 1.3, 0.08, x + w * sx, h - 2.1, z + d / 2 + 0.02);
    }
    // 门
    wood.box(1.7, 2.3, 0.12, x, 0.02, z + d / 2 + 0.04);
    // 院墙绿篱
    hedge.box(w + 2, 0.9, 0.8, x, 0.02, z + d / 2 + 5.4);
    hedge.box(w + 2, 0.9, 0.8, x, 0.02, z - d / 2 - 4.4);
    hedge.box(0.8, 0.9, d + 9.8, x - w / 2 - 1.0, 0.02, z);
    hedge.box(0.8, 0.9, d + 9.8, x + w / 2 + 1.0, 0.02, z);
    addCollider(x, z, w + 0.4, d + 0.4, h);
  });

  const bodyMesh = body.build(mats.creamWarm, { castShadow: true, receiveShadow: true });
  const roofMesh = roof.build(mats.roof, { castShadow: true, receiveShadow: true });
  const glassMesh = glass.build(mats.glass, { castShadow: false });
  const woodMesh = wood.build(mats.woodDark, { castShadow: true });
  const hedgeMesh = hedge.build(mats.hedge, { castShadow: true, receiveShadow: true });
  [bodyMesh, roofMesh, glassMesh, woodMesh, hedgeMesh].forEach((mesh) => {
    if (mesh) g.add(mesh);
  });
  return g;
}
