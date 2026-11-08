// 梁宅外观：院子、矮墙院门、车位与小车、门廊、两层立面、露台、后院小花园
import * as THREE from 'three';
import { Batch, buildWall, addWindow, signTexture, disposeObject } from './utils.js';
import { HOME_LAYOUT as L, HOME_LABELS } from '../../data/homeLayout.js';

export function createVilla(mats, addCollider, T = THREE) {
  const group = new THREE.Group();
  group.name = 'home-villa';
  const H = L.house;
  const Y = L.yard;
  const wallT = H.wall;
  const wallH = H.height;
  const floor2 = H.floor2;

  // ---------------- 院子地面 ----------------
  // 顶面略低于室内地坪，避免草地盖住一楼地砖（草坪仍铺满整个院子范围）
  const yardLawn = new THREE.Mesh(new THREE.BoxGeometry(Y.maxX - Y.minX, 0.1, Y.maxZ - Y.minZ), mats.lawnYard);
  yardLawn.position.set((Y.minX + Y.maxX) / 2, -0.07, (Y.minZ + Y.maxZ) / 2);
  yardLawn.receiveShadow = true;
  group.add(yardLawn);

  const pathBatch = new Batch();
  // 院门 → 入户门
  pathBatch.box(2.8, 0.1, 11.6, 0, 0.08, 2.2);
  // 入户门前的门廊铺装
  pathBatch.box(7.2, 0.1, 3.2, 0, 0.1, -4.6);
  // 车道
  pathBatch.box(8, 0.1, 10, 10.5, 0.08, -0.6);
  // 后院石板路
  for (let i = 0; i < 6; i += 1) {
    pathBatch.box(2.0, 0.08, 1.4, 0.6 + (i % 2) * 0.5, 0.04, -25.2 - i * 1.8);
  }
  // 后院休闲平台
  pathBatch.box(5.6, 0.08, 4.6, 9, 0.04, -32);
  pathBatch.box(4.6, 0.08, 4.2, -8, 0.04, -35);
  const pathMesh = pathBatch.build(mats.pavingYard, { receiveShadow: true });
  if (pathMesh) group.add(pathMesh);

  // 停车位标线
  const parkLines = new Batch();
  parkLines.box(0.08, 0.02, 8.8, 6.7, 0.13, -0.6);
  parkLines.box(0.08, 0.02, 8.8, 14.3, 0.13, -0.6);
  const lineMesh = parkLines.build(mats.trim, { receiveShadow: false });
  if (lineMesh) group.add(lineMesh);

  // ---------------- 院子矮墙与院门 ----------------
  const fenceBatch = new Batch();
  const fenceH = 1.05;
  const fenceT = 0.28;
  const gateW = Y.gate.width;
  // 前
  buildWall(fenceBatch, addCollider, {
    axis: 'x', fixed: Y.maxZ, from: Y.minX, to: -gateW / 2, thickness: fenceT, height: fenceH,
  });
  buildWall(fenceBatch, addCollider, {
    axis: 'x', fixed: Y.maxZ, from: gateW / 2, to: Y.maxX, thickness: fenceT, height: fenceH,
  });
  // 两侧与后侧
  buildWall(fenceBatch, addCollider, {
    axis: 'z', fixed: Y.minX, from: Y.minZ, to: Y.maxZ, thickness: fenceT, height: fenceH,
  });
  buildWall(fenceBatch, addCollider, {
    axis: 'z', fixed: Y.maxX, from: Y.minZ, to: Y.maxZ, thickness: fenceT, height: fenceH,
  });
  buildWall(fenceBatch, addCollider, {
    axis: 'x', fixed: Y.minZ, from: Y.minX, to: Y.maxX, thickness: fenceT, height: fenceH,
  });
  // 压顶
  fenceBatch.box(Y.maxX - Y.minX, 0.09, fenceT + 0.14, 0, fenceH, Y.maxZ);
  fenceBatch.box(Y.maxX - Y.minX, 0.09, fenceT + 0.14, 0, fenceH, Y.minZ);
  fenceBatch.box(fenceT + 0.14, 0.09, Y.maxZ - Y.minZ, Y.minX, fenceH, (Y.minZ + Y.maxZ) / 2);
  fenceBatch.box(fenceT + 0.14, 0.09, Y.maxZ - Y.minZ, Y.maxX, fenceH, (Y.minZ + Y.maxZ) / 2);
  // 院门门柱
  [-gateW / 2 - 0.2, gateW / 2 + 0.2].forEach((x) => {
    fenceBatch.box(0.5, 1.75, 0.5, x, 0.02, Y.maxZ);
    fenceBatch.box(0.64, 0.12, 0.64, x, 1.77, Y.maxZ);
    addCollider(x, Y.maxZ, 0.6, 0.6, 1.9);
  });
  const fenceMesh = fenceBatch.build(mats.stone, { castShadow: true, receiveShadow: true });
  if (fenceMesh) group.add(fenceMesh);

  // 院门门扇（向内打开，靠墙停靠）
  const gateMat = mats.woodDark;
  [1, -1].forEach((sgn) => {
    const pivot = new THREE.Group();
    pivot.position.set(sgn * (gateW / 2 + 0.18), 0, Y.maxZ);
    pivot.rotation.y = sgn * -1.85;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(gateW / 2 - 0.1, 1.55, 0.07), gateMat);
    leaf.position.set(sgn * -(gateW / 2 - 0.1) / 2, 0.8, 0);
    leaf.castShadow = true;
    pivot.add(leaf);
    group.add(pivot);
  });

  // 院门门牌
  const yardSignTex = signTexture(HOME_LABELS.house, `${HOME_LABELS.houseNo} · 中央墅`, {
    bg: '#fbf6ea', accent: '#c89863', width: 512, height: 256,
  });
  const yardSign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.66), new THREE.MeshBasicMaterial({ map: yardSignTex }));
  yardSign.position.set(0, 1.36, Y.maxZ + 0.15);
  group.add(yardSign);

  // ---------------- 院子绿化 ----------------
  const bedBatch = new Batch();
  const bedFlowerBatches = [new Batch(), new Batch(), new Batch()];
  [[-17, 5.6, 5, 1.7], [-12, 5.6, 4, 1.7], [7.5, 5.6, 4, 1.7], [13.5, 5.6, 5, 1.7]].forEach(([x, z, w, d]) => {
    bedBatch.box(w, 0.4, d, x, 0.02, z);
  });
  [[-17, 5.6, 5], [-12, 5.6, 4], [7.5, 5.6, 4], [13.5, 5.6, 5]].forEach(([x, z, w], i) => {
    const batch = bedFlowerBatches[i % 3];
    for (let k = 0; k < 10; k += 1) {
      batch.sphere(0.1 + Math.random() * 0.07, x + (Math.random() - 0.5) * (w - 0.6), 0.5 + Math.random() * 0.1, z + (Math.random() - 0.5) * 1.1, 7, 6);
    }
  });
  const bedMesh = bedBatch.build(mats.soil, { receiveShadow: true });
  if (bedMesh) group.add(bedMesh);
  bedFlowerBatches.forEach((b, i) => {
    const mesh = b.build(mats.flower[i], { receiveShadow: false });
    if (mesh) group.add(mesh);
    // 花坛碰撞（统一由一个花坛盒负责）
  });
  addCollider(-17, 5.6, 5, 1.7, 0.5);
  addCollider(-12, 5.6, 4, 1.7, 0.5);
  addCollider(7.5, 5.6, 4, 1.7, 0.5);
  addCollider(13.5, 5.6, 5, 1.7, 0.5);

  // 院子里的树
  const treePositions = [[-16, 2.0], [-17.5, -12], [17, -14], [-15.5, -37], [15.5, -37.5]];
  const trunkBatch = new Batch();
  const leafBatches = [new Batch(), new Batch()];
  treePositions.forEach(([x, z], i) => {
    const scale = 0.9 + (i % 3) * 0.12;
    trunkBatch.cylinder(0.13 * scale, 0.2 * scale, 2.3 * scale, 7, x, 0.02, z);
    const lb = leafBatches[i % 2];
    lb.sphere(1.15 * scale, x, 2.55 * scale, z, 9, 7);
    lb.sphere(0.8 * scale, x + 0.5 * scale, 3.15 * scale, z - 0.3 * scale, 8, 6);
    lb.sphere(0.75 * scale, x - 0.5 * scale, 2.9 * scale, z + 0.4 * scale, 8, 6);
    addCollider(x, z, 0.5, 0.5, 3);
  });
  const trunkMesh = trunkBatch.build(mats.trunk, { castShadow: true });
  if (trunkMesh) group.add(trunkMesh);
  leafBatches.forEach((b, i) => {
    const mesh = b.build(i === 0 ? mats.leaf : mats.leafLight, { castShadow: true, receiveShadow: true });
    if (mesh) group.add(mesh);
  });

  // 后院花架
  const trellisBatch = new Batch();
  const trellisFlower = new Batch();
  [-10.5, -5.5].forEach((x) => {
    trellisBatch.box(0.16, 2.6, 0.16, x, 0.02, -35.2);
    trellisBatch.box(0.16, 2.6, 0.16, x, 0.02, -38.8);
    trellisBatch.box(0.16, 0.16, 3.9, x, 2.55, -37);
    trellisBatch.box(1.1, 0.12, 0.12, x, 2.9, -35.2);
    addCollider(x, -35.2, 0.4, 0.4, 2.7);
    addCollider(x, -38.8, 0.4, 0.4, 2.7);
  });
  for (let i = 0; i < 4; i += 1) {
    trellisBatch.box(0.1, 1.9, 0.1, -10.5 + (i + 1) * 0.95, 0.02, -37);
  }
  for (let i = 0; i < 14; i += 1) {
    trellisFlower.sphere(0.12 + Math.random() * 0.08, -8 + (Math.random() - 0.5) * 4.4, 2.4 + Math.random() * 0.7, -37 + (Math.random() - 0.5) * 3.4, 6, 5);
  }
  const trellisMesh = trellisBatch.build(mats.woodDark, { castShadow: true });
  if (trellisMesh) group.add(trellisMesh);
  const trellisFlowerMesh = trellisFlower.build(mats.flower[1], {});
  if (trellisFlowerMesh) group.add(trellisFlowerMesh);

  // 后院小球门
  const goal = new Batch();
  goal.box(0.12, 2.0, 0.12, -10.5, 0.02, -39.6);
  goal.box(0.12, 2.0, 0.12, -4.5, 0.02, -39.6);
  goal.box(6.2, 0.12, 0.12, -7.5, 2.0, -39.6);
  const goalMesh = goal.build(mats.trim, { castShadow: true });
  if (goalMesh) group.add(goalMesh);
  addCollider(-10.5, -39.6, 0.35, 0.35, 2.1);
  addCollider(-4.5, -39.6, 0.35, 0.35, 2.1);

  // 后院躺椅
  const lounge = new Batch();
  lounge.box(2.0, 0.14, 0.9, 9, 0.4, -31.5);
  lounge.box(0.14, 1.0, 0.9, 9.9, 0.5, -31.5);
  for (const [ox, oz] of [[-0.8, -0.35], [-0.8, 0.35], [0.7, -0.35], [0.7, 0.35]]) {
    lounge.box(0.1, 0.4, 0.1, 9 + ox, 0.02, -31.5 + oz);
  }
  const loungeMesh = lounge.build(mats.woodLight, { castShadow: true });
  if (loungeMesh) group.add(loungeMesh);
  addCollider(9, -31.5, 2.2, 1.2, 0.8);

  // ---------------- 车位与小车 ----------------
  group.add(createCar(mats, addCollider));

  // ---------------- 别墅主体 ----------------
  const houseGroup = new THREE.Group();
  houseGroup.name = 'villa-house';
  const wallBatch = new Batch();
  const trimBatch = new Batch();
  const glassBatch = new Batch();
  const woodBatch = new Batch();
  const roofBatch = new Batch();

  // 南立面
  const southHoles = [
    { a0: -1.2, a1: 1.2, y0: 0, y1: 2.35 },
    { a0: -9.6, a1: -5.0, y0: 1.0, y1: 2.4 },
    { a0: 4.6, a1: 9.6, y0: 1.0, y1: 2.4 },
    { a0: -9.6, a1: -5.0, y0: 4.1, y1: 5.5 },
    { a0: 4.6, a1: 9.6, y0: 4.1, y1: 5.5 },
  ];
  buildWall(wallBatch, addCollider, {
    axis: 'x', fixed: H.maxZ, from: H.minX, to: H.maxX, thickness: wallT, height: wallH, holes: southHoles,
  });
  southHoles.filter((h) => h.y0 > 0.5).forEach((h) => {
    addWindow(trimBatch, glassBatch, { axis: 'x', fixed: H.maxZ, a0: h.a0, a1: h.a1, y0: h.y0, y1: h.y1, offset: -0.01 });
  });

  // 北立面
  const northHoles = [
    { a0: -1.0, a1: 1.0, y0: 0, y1: 2.25 },
    { a0: 4.0, a1: 9.0, y0: 1.0, y1: 2.4 },
    { a0: -8.0, a1: -3.0, y0: 4.1, y1: 5.4 },
    { a0: 5.0, a1: 8.5, y0: 4.1, y1: 5.4 },
  ];
  buildWall(wallBatch, addCollider, {
    axis: 'x', fixed: H.minZ, from: H.minX, to: H.maxX, thickness: wallT, height: wallH, holes: northHoles,
  });
  northHoles.filter((h) => h.y0 > 0.5).forEach((h) => {
    addWindow(trimBatch, glassBatch, { axis: 'x', fixed: H.minZ, a0: h.a0, a1: h.a1, y0: h.y0, y1: h.y1, offset: 0.01 });
  });

  // 东立面
  const eastHoles = [
    { a0: -14.5, a1: -10.0, y0: 1.0, y1: 2.4 },
    { a0: -14.5, a1: -10.0, y0: 4.1, y1: 5.4 },
    { a0: -20.5, a1: -17.0, y0: 4.1, y1: 5.2 },
  ];
  buildWall(wallBatch, addCollider, {
    axis: 'z', fixed: H.maxX, from: H.minZ, to: H.maxZ, thickness: wallT, height: wallH, holes: eastHoles,
  });
  eastHoles.forEach((h) => {
    addWindow(trimBatch, glassBatch, { axis: 'z', fixed: H.maxX, a0: h.a0, a1: h.a1, y0: h.y0, y1: h.y1, offset: -0.01 });
  });

  // 西立面
  const westHoles = [
    { a0: -14.5, a1: -10.0, y0: 1.0, y1: 2.4 },
    { a0: -14.5, a1: -10.0, y0: 4.1, y1: 5.4 },
  ];
  buildWall(wallBatch, addCollider, {
    axis: 'z', fixed: H.minX, from: H.minZ, to: H.maxZ, thickness: wallT, height: wallH, holes: westHoles,
  });
  westHoles.forEach((h) => {
    addWindow(trimBatch, glassBatch, { axis: 'z', fixed: H.minX, a0: h.a0, a1: h.a1, y0: h.y0, y1: h.y1, offset: 0.01 });
  });

  // 石材基座
  trimBatch.box(H.maxX - H.minX + 0.2, 0.55, 0.16, 0, 0.02, H.maxZ + 0.07);
  trimBatch.box(H.maxX - H.minX + 0.2, 0.55, 0.16, 0, 0.02, H.minZ - 0.07);
  trimBatch.box(0.16, 0.55, H.maxZ - H.minZ, H.minX - 0.07, 0.02, (H.minZ + H.maxZ) / 2);
  trimBatch.box(0.16, 0.55, H.maxZ - H.minZ, H.maxX + 0.07, 0.02, (H.minZ + H.maxZ) / 2);
  // 层间线脚
  trimBatch.box(H.maxX - H.minX + 0.16, 0.14, 0.1, 0, floor2 - 0.08, H.maxZ + 0.05);
  trimBatch.box(H.maxX - H.minX + 0.16, 0.14, 0.1, 0, floor2 - 0.08, H.minZ - 0.05);
  trimBatch.box(0.1, 0.14, H.maxZ - H.minZ, H.minX - 0.05, floor2 - 0.08, (H.minZ + H.maxZ) / 2);
  trimBatch.box(0.1, 0.14, H.maxZ - H.minZ, H.maxX + 0.05, floor2 - 0.08, (H.minZ + H.maxZ) / 2);
  // 檐口
  trimBatch.box(H.maxX - H.minX + 0.5, 0.18, 0.3, 0, wallH - 0.05, H.maxZ);
  trimBatch.box(H.maxX - H.minX + 0.5, 0.18, 0.3, 0, wallH - 0.05, H.minZ);
  trimBatch.box(0.3, 0.18, H.maxZ - H.minZ + 0.5, H.minX, wallH - 0.05, (H.minZ + H.maxZ) / 2);
  trimBatch.box(0.3, 0.18, H.maxZ - H.minZ + 0.5, H.maxX, wallH - 0.05, (H.minZ + H.maxZ) / 2);

  // 入户门框与门槛
  trimBatch.box(0.1, 2.45, 0.36, -1.26, 0.02, H.maxZ);
  trimBatch.box(0.1, 2.45, 0.36, 1.26, 0.02, H.maxZ);
  trimBatch.box(2.62, 0.1, 0.36, 0, 2.32, H.maxZ);
  trimBatch.box(2.0, 0.16, 0.5, 0, 0.02, -5.8);
  // 后门框
  trimBatch.box(0.1, 2.35, 0.36, -1.06, 0.02, H.minZ);
  trimBatch.box(0.1, 2.35, 0.36, 1.06, 0.02, H.minZ);
  trimBatch.box(2.2, 0.1, 0.36, 0, 2.22, H.minZ);

  // 入户门（向内半开）
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1.18, 0, H.maxZ - 0.15);
  doorPivot.rotation.y = -1.9;
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.28, 0.07), mats.woodDark);
  doorLeaf.position.set(0.58, 1.15, 0);
  doorLeaf.castShadow = true;
  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9), mats.carGlass);
  doorGlass.position.set(0.58, 1.65, 0.04);
  doorPivot.add(doorLeaf, doorGlass);
  houseGroup.add(doorPivot);

  // 木格栅装饰（二层入户门上方）
  woodBatch.box(2.6, 1.3, 0.06, 0, 4.0, H.maxZ + 0.08);
  for (let x = -1.2; x <= 1.2; x += 0.4) {
    woodBatch.box(0.06, 1.3, 0.08, x, 4.0, H.maxZ + 0.14);
  }

  // 屋顶
  roofBatch.box(H.maxX - H.minX + 0.7, 0.34, H.maxZ - H.minZ + 0.7, 0, wallH, (H.minZ + H.maxZ) / 2);
  roofBatch.box(H.maxX - H.minX + 0.7, 0.5, 0.2, 0, wallH + 0.34, H.maxZ + 0.25);
  roofBatch.box(H.maxX - H.minX + 0.7, 0.5, 0.2, 0, wallH + 0.34, H.minZ - 0.25);
  roofBatch.box(0.2, 0.5, H.maxZ - H.minZ + 0.7, H.minX - 0.25, wallH + 0.34, (H.minZ + H.maxZ) / 2);
  roofBatch.box(0.2, 0.5, H.maxZ - H.minZ + 0.7, H.maxX + 0.25, wallH + 0.34, (H.minZ + H.maxZ) / 2);

  // 二层露台
  const balcony = new THREE.Group();
  balcony.name = 'balcony';
  const balSlab = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.18, 3.0), mats.trim);
  balSlab.position.set(-5.3, floor2 - 0.09, H.maxZ + 1.5);
  balSlab.castShadow = true;
  balSlab.receiveShadow = true;
  balcony.add(balSlab);
  const balRail = new Batch();
  for (let x = -11.85; x <= 1.35; x += 1.1) {
    balRail.box(0.07, 1.0, 0.07, x, floor2 + 0.02, H.maxZ + 2.92);
    balRail.box(0.07, 1.0, 0.07, x, floor2 + 0.02, H.maxZ + 0.1);
  }
  for (let z = H.maxZ + 0.1; z <= H.maxZ + 2.92; z += 1.05) {
    balRail.box(0.07, 1.0, 0.07, -11.85, floor2 + 0.02, z);
    balRail.box(0.07, 1.0, 0.07, 1.35, floor2 + 0.02, z);
  }
  balRail.box(13.3, 0.08, 0.12, -5.25, floor2 + 1.0, H.maxZ + 2.92);
  balRail.box(13.3, 0.08, 0.12, -5.25, floor2 + 1.0, H.maxZ + 0.1);
  balRail.box(0.12, 0.08, 2.9, -11.85, floor2 + 1.0, H.maxZ + 1.5);
  balRail.box(0.12, 0.08, 2.9, 1.35, floor2 + 1.0, H.maxZ + 1.5);
  const balRailMesh = balRail.build(mats.trim, { castShadow: true });
  if (balRailMesh) balcony.add(balRailMesh);
  // 露台花箱与遮阳
  const balPlant = new Batch();
  balPlant.box(1.4, 0.45, 0.5, -9.6, floor2 + 0.02, H.maxZ + 2.6);
  balPlant.box(1.4, 0.45, 0.5, -1.5, floor2 + 0.02, H.maxZ + 2.6);
  const balPlantMesh = balPlant.build(mats.wood, { castShadow: true });
  if (balPlantMesh) balcony.add(balPlantMesh);
  const balFlower = new Batch();
  for (let i = 0; i < 8; i += 1) {
    balFlower.sphere(0.1 + Math.random() * 0.06, -9.6 + (Math.random() - 0.5) * 1.1, floor2 + 0.5, H.maxZ + 2.6 + (Math.random() - 0.5) * 0.35, 6, 5);
  }
  const balFlowerMesh = balFlower.build(mats.flower[2], {});
  if (balFlowerMesh) balcony.add(balFlowerMesh);
  // 遮阳伞
  const parasol = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), mats.metal);
  pole.position.set(-7.6, floor2 + 1.2, H.maxZ + 1.9);
  parasol.add(pole);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.45, 8), mats.flower[3]);
  canopy.position.set(-7.6, floor2 + 2.4, H.maxZ + 1.9);
  parasol.add(canopy);
  balcony.add(parasol);
  houseGroup.add(balcony);

  // 门廊雨棚 + 立柱 + 壁灯
  const porch = new Batch();
  porch.box(7.4, 0.2, 3.2, 0, 2.9, -4.7);
  porch.cylinder(0.16, 0.18, 2.9, 8, -3.0, 0.02, -3.5);
  porch.cylinder(0.16, 0.18, 2.9, 8, 3.0, 0.02, -3.5);
  const porchMesh = porch.build(mats.cream, { castShadow: true, receiveShadow: true });
  if (porchMesh) houseGroup.add(porchMesh);
  addCollider(-3.0, -3.5, 0.5, 0.5, 2.9);
  addCollider(3.0, -3.5, 0.5, 0.5, 2.9);

  const porchLampBatch = new Batch();
  porchLampBatch.box(0.3, 0.36, 0.22, 1.85, 2.15, H.maxZ + 0.12);
  const porchLampMesh = porchLampBatch.build(mats.lampGlow, {});
  if (porchLampMesh) houseGroup.add(porchLampMesh);
  const porchPointLight = new THREE.PointLight(0xffd39a, 0, 12, 1.6);
  porchPointLight.position.set(1.85, 2.3, H.maxZ + 0.5);
  houseGroup.add(porchPointLight);

  // 门牌
  const plaqueTex = signTexture(HOME_LABELS.house, HOME_LABELS.houseNo, {
    bg: '#fbf6ea', accent: '#c89863', width: 512, height: 300,
  });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.56), new THREE.MeshBasicMaterial({ map: plaqueTex }));
  plaque.position.set(2.5, 1.55, H.maxZ + 0.02);
  houseGroup.add(plaque);

  // 合并主体网格
  const wallMesh = wallBatch.build(mats.cream, { castShadow: true, receiveShadow: true });
  const trimMesh = trimBatch.build(mats.trim, { castShadow: true, receiveShadow: true });
  const glassMesh = glassBatch.build(mats.glass, { castShadow: false });
  const woodMesh = woodBatch.build(mats.wood, { castShadow: true, receiveShadow: true });
  const roofMesh = roofBatch.build(mats.roof, { castShadow: true, receiveShadow: true });
  [wallMesh, trimMesh, glassMesh, woodMesh, roofMesh].forEach((mesh) => {
    if (mesh) houseGroup.add(mesh);
  });
  group.add(houseGroup);

  return { group, porchPointLight, dispose: () => disposeObject(group) };
}

// ---------------------------------------------------------------------------
// 简约家用小车
// ---------------------------------------------------------------------------
function createCar(mats, addCollider) {
  const g = new THREE.Group();
  g.name = 'family-car';
  const cx = 10.5;
  const cz = -0.6;

  const body = new Batch();
  body.box(1.86, 0.62, 4.1, cx, 0.4, cz);
  body.box(1.7, 0.5, 2.1, cx, 1.0, cz - 0.15);
  body.box(1.9, 0.16, 1.0, cx, 0.24, cz + 1.5);
  body.box(1.9, 0.16, 1.0, cx, 0.24, cz - 1.6);
  const bodyMesh = body.build(mats.carBody, { castShadow: true, receiveShadow: true });
  if (bodyMesh) g.add(bodyMesh);

  const glass = new Batch();
  glass.box(1.56, 0.36, 0.06, cx, 1.12, cz - 1.17);
  glass.box(1.56, 0.36, 0.06, cx, 1.12, cz + 0.87);
  glass.box(0.06, 0.34, 1.9, cx - 0.8, 1.12, cz - 0.15);
  glass.box(0.06, 0.34, 1.9, cx + 0.8, 1.12, cz - 0.15);
  const glassMesh = glass.build(mats.carGlass, {});
  if (glassMesh) g.add(glassMesh);

  const detail = new Batch();
  detail.box(1.5, 0.12, 0.1, cx, 0.72, cz + 2.06);
  detail.box(1.5, 0.12, 0.1, cx, 0.72, cz - 2.06);
  detail.box(0.34, 0.14, 0.08, cx - 0.55, 0.72, cz + 2.04);
  detail.box(0.34, 0.14, 0.08, cx + 0.55, 0.72, cz + 2.04);
  const detailMesh = detail.build(mats.carLight, {});
  if (detailMesh) g.add(detailMesh);

  const wheelBatch = new Batch();
  [[-0.86, 1.35], [0.86, 1.35], [-0.86, -1.35], [0.86, -1.35]].forEach(([ox, oz]) => {
    const wg = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 12);
    wg.rotateZ(Math.PI / 2);
    wg.translate(cx + ox, 0.36, cz + oz);
    wheelBatch.add(wg);
  });
  const wheelMesh = wheelBatch.build(mats.carDark, { castShadow: true });
  if (wheelMesh) g.add(wheelMesh);

  addCollider(cx, cz, 2.05, 4.3, 1.5);
  return g;
}
