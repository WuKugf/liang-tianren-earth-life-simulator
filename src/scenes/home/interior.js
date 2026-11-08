// 梁宅室内：一楼客厅 / 厨房餐厅 / 楼梯厅，二楼卧室 / 书房 / 走廊
import * as THREE from 'three';
import { Batch, buildWall, disposeObject } from './utils.js';
import { HOME_LAYOUT as L } from '../../data/homeLayout.js';

export function createInterior(mats, addCollider, T = THREE) {
  const group = new THREE.Group();
  group.name = 'home-interior';
  const H = L.house;
  const Y2 = H.floor2;
  const inX0 = H.minX + H.wall;
  const inX1 = H.maxX - H.wall;
  const inZ0 = H.minZ + H.wall;
  const inZ1 = H.maxZ - H.wall;
  const midX = 3; // 客厅/餐厨、卧室/书房分界
  const midZ = -15.5; // 前厅与楼梯厅分界
  const floorTopY = 0;

  // 家具碰撞体带楼层标记：核心控制器只按 XZ 判定，由场景 update 按当前楼层启停
  const addFurn1 = (cx, cz, w, d, h) => addCollider(cx, cz, w, d, h, 0, 1);
  const addFurn2 = (cx, cz, w, d, h) => addCollider(cx, cz, w, d, h, H.floor2, 2);

  // ---------------- 地面与二层楼板 ----------------
  const floorBatch = new Batch();
  floorBatch.box(inX1 - inX0, 0.06, inZ1 - inZ0, (inX0 + inX1) / 2, floorTopY - 0.06, (inZ0 + inZ1) / 2);
  const floor1Mesh = floorBatch.build(mats.floorTile, { receiveShadow: true });
  if (floor1Mesh) group.add(floor1Mesh);

  const slabBatch = new Batch();
  // 二层：楼梯厅西侧
  slabBatch.box(7.4 - inX0, 0.26, midZ - inZ0, (inX0 + 7.4) / 2, Y2 - 0.26, (inZ0 + midZ) / 2);
  // 楼梯井北侧窄条
  slabBatch.box(inX1 - 7.4, 0.26, -22 - inZ0, (7.4 + inX1) / 2, Y2 - 0.26, (inZ0 - 22) / 2);
  // 二层前部（卧室 + 书房）
  slabBatch.box(inX1 - inX0, 0.26, midZ - inZ1, (inX0 + inX1) / 2, Y2 - 0.26, (midZ + inZ1) / 2);
  const slabMesh = slabBatch.build(mats.floorWood, { receiveShadow: true });
  if (slabMesh) group.add(slabMesh);

  // 二层顶棚
  const ceilingBatch = new Batch();
  ceilingBatch.box(inX1 - inX0 + 0.2, 0.12, inZ1 - inZ0 + 0.2, (inX0 + inX1) / 2, H.height - 0.16, (inZ0 + inZ1) / 2);
  const ceilingMesh = ceilingBatch.build(mats.white, { receiveShadow: false });
  if (ceilingMesh) group.add(ceilingMesh);

  // ---------------- 内墙 ----------------
  const wallBatch = new Batch();
  // 客厅/餐厨与卧室/书房之间的通高隔墙（门洞 0~5.6m，两层共用）
  buildWall(wallBatch, addCollider, {
    axis: 'z', fixed: midX, from: midZ, to: inZ1, thickness: 0.24, height: H.height,
    holes: [{ a0: -12.2, a1: -10.2, y0: 0, y1: 5.6 }],
  });
  // 前后场分界墙（三个通高门洞：卧室、书房、楼梯口）
  buildWall(wallBatch, addCollider, {
    axis: 'x', fixed: midZ, from: inX0, to: inX1, thickness: 0.24, height: H.height,
    holes: [
      { a0: -2.0, a1: 0.0, y0: 0, y1: 5.6 },
      { a0: 3.5, a1: 5.5, y0: 0, y1: 5.6 },
      { a0: L.stairs.minX, a1: L.stairs.maxX, y0: 0, y1: 5.6 },
    ],
  });
  const innerWallMesh = wallBatch.build(mats.creamCool, { castShadow: true, receiveShadow: true });
  if (innerWallMesh) group.add(innerWallMesh);

  // 门洞白色门套
  const casing = new Batch();
  casing.box(0.1, 2.35, 0.3, -2.05, 0, midZ);
  casing.box(0.1, 2.35, 0.3, 0.05, 0, midZ);
  casing.box(2.2, 0.1, 0.3, -1.0, 2.32, midZ);
  casing.box(0.1, 2.35, 0.3, 3.45, 0, midZ);
  casing.box(0.1, 2.35, 0.3, 5.55, 0, midZ);
  casing.box(2.2, 0.1, 0.3, 4.5, 2.32, midZ);
  casing.box(0.3, 2.35, 0.1, midX, 0, -12.25);
  casing.box(0.3, 2.35, 0.1, midX, 0, -10.15);
  casing.box(0.3, 0.1, 2.2, midX, 2.32, -11.2);
  // 二层同样位置的门套（楼梯口不再加门套）
  casing.box(0.1, 2.35, 0.3, -2.05, Y2, midZ);
  casing.box(0.1, 2.35, 0.3, 0.05, Y2, midZ);
  casing.box(2.2, 0.1, 0.3, -1.0, Y2 + 2.32, midZ);
  casing.box(0.1, 2.35, 0.3, 3.45, Y2, midZ);
  casing.box(0.1, 2.35, 0.3, 5.55, Y2, midZ);
  casing.box(2.2, 0.1, 0.3, 4.5, Y2 + 2.32, midZ);
  casing.box(0.3, 2.35, 0.1, midX, Y2, -12.25);
  casing.box(0.3, 2.35, 0.1, midX, Y2, -10.15);
  casing.box(0.3, 0.1, 2.2, midX, Y2 + 2.32, -11.2);
  const casingMesh = casing.build(mats.trim, { castShadow: true });
  if (casingMesh) group.add(casingMesh);

  // ---------------- 楼梯 ----------------
  const stair = L.stairs;
  const steps = stair.steps;
  const stairW = stair.maxX - stair.minX;
  const run = (stair.maxZ - stair.minZ);
  const stepD = run / steps;
  const stepBatch = new Batch();
  for (let i = 0; i < steps; i += 1) {
    const top = (i + 1) * stair.rise;
    const z = stair.minZ + (i + 0.5) * stepD;
    stepBatch.box(stairW, top, stepD, (stair.minX + stair.maxX) / 2, 0.02, z);
  }
  const stepMesh = stepBatch.build(mats.wood, { castShadow: true, receiveShadow: true });
  if (stepMesh) group.add(stepMesh);

  // 楼梯西侧扶手
  const railBatch = new Batch();
  for (let i = 3; i <= steps; i += 3) {
    const top = i * stair.rise;
    const z = stair.minZ + i * stepD;
    railBatch.box(0.09, 0.95, 0.09, stair.minX + 0.06, top, z);
  }
  const railMesh = railBatch.build(mats.trim, { castShadow: true });
  if (railMesh) group.add(railMesh);
  const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 7.4), mats.woodDark);
  handrail.position.set(stair.minX + 0.06, 2.3, -18.7);
  handrail.rotation.x = -Math.atan2(3.2, run);
  handrail.castShadow = true;
  group.add(handrail);
  addCollider(stair.minX + 0.06, (stair.minZ + stair.maxZ) / 2, 0.22, run, 4);

  // ---------------- 一楼客厅 ----------------
  const sofa = new Batch();
  // 沙发靠南、面向北面的电视
  sofa.box(2.7, 0.42, 1.05, -6.5, 0.02, -9.5);
  sofa.box(2.7, 0.72, 0.22, -6.5, 0.44, -8.95);
  sofa.box(0.22, 0.6, 1.0, -7.82, 0.44, -9.5);
  sofa.box(0.22, 0.6, 1.0, -5.18, 0.44, -9.5);
  sofa.box(2.3, 0.2, 0.95, -6.5, 0.44, -9.55);
  // 靠垫
  sofa.box(0.55, 0.42, 0.16, -7.2, 0.6, -9.35);
  sofa.box(0.55, 0.42, 0.16, -5.8, 0.6, -9.35);
  const sofaMesh = sofa.build(mats.fabricSofa, { castShadow: true, receiveShadow: true });
  if (sofaMesh) group.add(sofaMesh);
  addFurn1(-6.5, -9.45, 2.75, 1.15, 1.1);

  const cushions = new Batch();
  cushions.box(0.5, 0.45, 0.14, -7.1, 0.58, -9.3);
  cushions.box(0.5, 0.45, 0.14, -5.9, 0.58, -9.3);
  // 单椅
  cushions.box(0.9, 0.38, 0.9, -9.9, 0.02, -12.6);
  cushions.box(0.9, 0.7, 0.18, -9.9, 0.4, -12.2);
  const cushionMesh = cushions.build(mats.cushion, { castShadow: true });
  if (cushionMesh) group.add(cushionMesh);
  addFurn1(-9.9, -12.6, 1.0, 1.0, 0.9);

  // 地毯
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.2), mats.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-6.5, 0.02, -11.5);
  rug.receiveShadow = true;
  group.add(rug);

  // 茶几
  const coffee = new Batch();
  coffee.box(1.7, 0.42, 0.9, -6.5, 0.02, -11.5);
  coffee.box(1.55, 0.08, 0.75, -6.5, 0.3, -11.5);
  coffee.cylinder(0.16, 0.18, 0.12, 10, -6.5, 0.42, -11.5);
  const coffeeMesh = coffee.build(mats.wood, { castShadow: true, receiveShadow: true });
  if (coffeeMesh) group.add(coffeeMesh);
  addFurn1(-6.5, -11.5, 1.8, 1.0, 0.6);

  // 电视柜与电视
  const tvSet = new Batch();
  tvSet.box(3.0, 0.45, 0.5, -6.5, 0.02, -15.2);
  tvSet.box(0.06, 0.35, 0.06, -6.5, 0.47, -15.2);
  const tvSetMesh = tvSet.build(mats.woodLight, { castShadow: true, receiveShadow: true });
  if (tvSetMesh) group.add(tvSetMesh);
  addFurn1(-6.5, -15.2, 3.1, 0.6, 0.7);
  const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.24, 0.08), mats.tvFrame);
  tvFrame.position.set(-6.5, 1.55, -15.14);
  group.add(tvFrame);
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.02, 1.08), mats.tvScreen);
  tvScreen.position.set(-6.5, 1.55, -15.09);
  group.add(tvScreen);

  // 客厅绿植
  const plant = new Batch();
  plant.cylinder(0.2, 0.26, 0.42, 10, -10.8, 0.02, -7.3);
  const plantMesh = plant.build(mats.woodDark, { castShadow: true });
  if (plantMesh) group.add(plantMesh);
  const leaves = new Batch();
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    leaves.sphere(0.28 + (i % 2) * 0.08, -10.8 + Math.cos(a) * 0.28, 0.75 + (i % 3) * 0.18, -7.3 + Math.sin(a) * 0.28, 6, 5);
  }
  const leavesMesh = leaves.build(mats.leafDark, { castShadow: true });
  if (leavesMesh) group.add(leavesMesh);
  addFurn1(-10.8, -7.3, 0.6, 0.6, 1.2);

  // ---------------- 厨房 / 餐厅 ----------------
  const cabinet = new Batch();
  cabinet.box(0.68, 0.88, 7.3, 11.25, 0.02, -11.6);
  cabinet.box(0.75, 0.08, 7.4, 11.25, 0.9, -11.6);
  // 上柜
  cabinet.box(0.42, 0.7, 3.4, 11.3, 1.9, -13.7);
  cabinet.box(0.42, 0.7, 2.4, 11.3, 1.9, -8.6);
  // 冰箱
  cabinet.box(0.82, 1.95, 0.78, 10.95, 0.02, -15.0);
  cabinet.box(0.06, 0.5, 0.06, 10.5, 1.4, -14.85);
  const cabMesh = cabinet.build(mats.kitchen, { castShadow: true, receiveShadow: true });
  if (cabMesh) group.add(cabMesh);
  addFurn1(11.25, -11.6, 0.85, 7.4, 0.95);
  addFurn1(10.95, -15.0, 0.9, 0.86, 2.0);

  const counterTop = new Batch();
  counterTop.box(0.75, 0.05, 7.45, 11.25, 0.92, -11.6);
  // 水槽
  counterTop.box(0.55, 0.06, 0.9, 11.2, 0.88, -10.2);
  counterTop.cylinder(0.03, 0.03, 0.4, 8, 11.5, 0.92, -10.2);
  counterTop.cylinder(0.025, 0.025, 0.35, 8, 11.42, 1.2, -10.2);
  // 灶台
  counterTop.box(0.6, 0.04, 0.9, 11.2, 0.95, -13.4);
  counterTop.cylinder(0.15, 0.15, 0.03, 12, 11.2, 0.97, -13.6);
  counterTop.cylinder(0.15, 0.15, 0.03, 12, 11.2, 0.97, -13.2);
  const topMesh = counterTop.build(mats.kitchenTop, { castShadow: true });
  if (topMesh) group.add(topMesh);

  // 餐桌
  const table = new Batch();
  table.box(2.1, 0.72, 1.0, 6.2, 0.02, -11.4);
  table.box(2.2, 0.08, 1.1, 6.2, 0.72, -11.4);
  const tableMesh = table.build(mats.wood, { castShadow: true, receiveShadow: true });
  if (tableMesh) group.add(tableMesh);
  addFurn1(6.2, -11.4, 2.25, 1.15, 0.85);

  const chairs = new Batch();
  [[5.55, -10.5], [6.85, -10.5], [5.55, -12.3], [6.85, -12.3]].forEach(([x, z]) => {
    chairs.box(0.46, 0.45, 0.46, x, 0.02, z);
    chairs.box(0.46, 0.55, 0.08, x, 0.45, z + (z < -11.4 ? -0.19 : 0.19));
  });
  const chairMesh = chairs.build(mats.woodLight, { castShadow: true });
  if (chairMesh) group.add(chairMesh);
  addFurn1(6.2, -10.5, 2.1, 0.5, 0.6);
  addFurn1(6.2, -12.3, 2.1, 0.5, 0.6);

  // 餐桌上方吊灯
  const pendants = new Batch();
  pendants.cylinder(0.02, 0.02, 0.55, 6, 6.2, 2.4, -11.4);
  pendants.cylinder(0.36, 0.2, 0.28, 12, 6.2, 2.12, -11.4);
  const pendantMesh = pendants.build(mats.lampGlowWarm, {});
  if (pendantMesh) group.add(pendantMesh);

  // 客厅吊灯
  const livingLamp = new Batch();
  livingLamp.cylinder(0.02, 0.02, 0.5, 6, -6.5, 2.45, -10.6);
  livingLamp.cylinder(0.42, 0.24, 0.3, 12, -6.5, 2.15, -10.6);
  const livingLampMesh = livingLamp.build(mats.lampGlowWarm, {});
  if (livingLampMesh) group.add(livingLampMesh);

  // ---------------- 楼梯厅 / 玄关 ----------------
  const hall = new Batch();
  hall.box(0.55, 0.85, 1.5, -11.25, 0.02, -19.5); // 玄关矮柜
  hall.box(0.6, 0.75, 1.6, -11.25, 0.02, -22.2);
  const hallMesh = hall.build(mats.woodLight, { castShadow: true, receiveShadow: true });
  if (hallMesh) group.add(hallMesh);
  addFurn1(-11.25, -19.5, 0.65, 1.6, 0.9);
  addFurn1(-11.25, -22.2, 0.7, 1.7, 0.8);

  // ---------------- 二楼卧室 ----------------
  const bed = new Batch();
  bed.box(2.1, 0.32, 2.3, -8, Y2 + 0.02, -13.4);          // 床架
  bed.box(2.0, 0.24, 2.2, -8, Y2 + 0.34, -13.4);          // 床垫
  bed.box(2.3, 1.1, 0.14, -8, Y2 + 0.02, -14.52);         // 床头板
  bed.box(2.0, 0.18, 1.1, -8, Y2 + 0.5, -12.6);           // 被子
  const bedMesh = bed.build(mats.bedSheet, { castShadow: true, receiveShadow: true });
  if (bedMesh) group.add(bedMesh);
  addFurn2(-8, -13.4, 2.45, 2.5, 1.2);

  const bedding = new Batch();
  bedding.box(0.8, 0.16, 0.5, -8.55, Y2 + 0.56, -14.15);
  bedding.box(0.8, 0.16, 0.5, -7.45, Y2 + 0.56, -14.15);
  bedding.box(2.0, 0.1, 1.05, -8, Y2 + 0.5, -12.62);
  const beddingMesh = bedding.build(mats.blanket, { castShadow: true });
  if (beddingMesh) group.add(beddingMesh);
  const pillows = new Batch();
  pillows.box(0.78, 0.22, 0.5, -8.55, Y2 + 0.68, -14.1);
  pillows.box(0.78, 0.22, 0.5, -7.45, Y2 + 0.68, -14.1);
  const pillowMesh = pillows.build(mats.pillow, { castShadow: true });
  if (pillowMesh) group.add(pillowMesh);

  // 床头柜 + 床头灯
  const nightstand = new Batch();
  nightstand.box(0.55, 0.5, 0.55, -6.4, Y2 + 0.02, -14.4);
  nightstand.box(0.55, 0.5, 0.55, -9.6, Y2 + 0.02, -14.4);
  const nightstandMesh = nightstand.build(mats.woodLight, { castShadow: true, receiveShadow: true });
  if (nightstandMesh) group.add(nightstandMesh);
  const bedLamps = new Batch();
  bedLamps.cylinder(0.03, 0.03, 0.28, 6, -6.4, Y2 + 0.52, -14.4);
  bedLamps.cylinder(0.18, 0.12, 0.2, 10, -6.4, Y2 + 0.72, -14.4);
  const bedLampsMesh = bedLamps.build(mats.lampGlowWarm, {});
  if (bedLampsMesh) group.add(bedLampsMesh);
  addFurn2(-6.4, -14.4, 0.65, 0.65, 0.6);
  addFurn2(-9.6, -14.4, 0.65, 0.65, 0.6);

  // 衣柜
  const wardrobe = new Batch();
  wardrobe.box(0.65, 2.2, 1.7, -11.2, Y2 + 0.02, -8.6);
  wardrobe.box(0.05, 0.35, 0.05, -10.85, Y2 + 1.35, -8.6);
  const wardrobeMesh = wardrobe.build(mats.wood, { castShadow: true, receiveShadow: true });
  if (wardrobeMesh) group.add(wardrobeMesh);
  addFurn2(-11.2, -8.6, 0.75, 1.8, 2.3);

  // 卧室地毯
  const bedRug = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), mats.rug);
  bedRug.rotation.x = -Math.PI / 2;
  bedRug.position.set(-8, Y2 + 0.01, -10.6);
  bedRug.receiveShadow = true;
  group.add(bedRug);

  // 梳妆台
  const dresser = new Batch();
  dresser.box(0.55, 0.8, 1.2, -11.25, Y2 + 0.02, -12.6);
  dresser.box(0.7, 0.08, 1.35, -11.22, Y2 + 1.4, -12.6);
  const dresserMesh = dresser.build(mats.woodLight, { castShadow: true });
  if (dresserMesh) group.add(dresserMesh);
  addFurn2(-11.25, -12.6, 0.7, 1.3, 1.5);

  // 卧室吊灯（床头上方）
  const bedPendant = new Batch();
  bedPendant.cylinder(0.02, 0.02, 0.6, 6, -7.8, H.height - 0.8, -11.4);
  bedPendant.cylinder(0.4, 0.22, 0.28, 12, -7.8, H.height - 1.06, -11.4);
  const bedPendantMesh = bedPendant.build(mats.lampGlowWarm, {});
  if (bedPendantMesh) group.add(bedPendantMesh);

  // ---------------- 二楼书房 ----------------
  const desk = new Batch();
  desk.box(0.8, 0.75, 2.0, 11.15, Y2 + 0.02, -11.2);
  desk.box(0.9, 0.06, 2.1, 11.12, Y2 + 0.75, -11.2);
  const deskMesh = desk.build(mats.woodLight, { castShadow: true, receiveShadow: true });
  if (deskMesh) group.add(deskMesh);
  addFurn2(11.15, -11.2, 0.95, 2.2, 0.85);

  const chair = new Batch();
  chair.box(0.5, 0.5, 0.5, 9.75, Y2 + 0.02, -11.2);
  chair.box(0.5, 0.6, 0.1, 9.75, Y2 + 0.5, -10.95);
  const studyChairMesh = chair.build(mats.fabricSofaDark, { castShadow: true });
  if (studyChairMesh) group.add(studyChairMesh);
  addFurn2(9.75, -11.2, 0.6, 0.6, 0.8);

  // 台灯
  const deskLamp = new Batch();
  deskLamp.cylinder(0.15, 0.18, 0.04, 10, 11.1, Y2 + 0.82, -12.0);
  deskLamp.cylinder(0.025, 0.025, 0.36, 6, 11.1, Y2 + 0.86, -12.0);
  deskLamp.cylinder(0.14, 0.09, 0.16, 10, 11.1, Y2 + 1.2, -12.0);
  const deskLampMesh = deskLamp.build(mats.lampGlowWarm, {});
  if (deskLampMesh) group.add(deskLampMesh);

  // 书架
  const shelf = new Batch();
  shelf.box(2.6, 2.0, 0.36, 6.4, Y2 + 0.02, -15.28);
  for (let i = 1; i <= 4; i += 1) {
    shelf.box(2.5, 0.06, 0.32, 6.4, Y2 + i * 0.4, -15.28);
  }
  const shelfMesh = shelf.build(mats.wood, { castShadow: true, receiveShadow: true });
  if (shelfMesh) group.add(shelfMesh);
  addFurn2(6.4, -15.28, 2.7, 0.45, 2.1);
  const bookColors = mats.books;
  const bookBatches = bookColors.map(() => new Batch());
  const bookCount = 26;
  for (let i = 0; i < bookCount; i += 1) {
    const bx = 5.3 + (i % 13) * 0.19;
    const shelfIndex = Math.floor(i / 13);
    const by = Y2 + 0.46 + shelfIndex * 0.8;
    bookBatches[i % bookBatches.length].box(0.12, 0.26 + (i % 3) * 0.05, 0.22, bx, by, -15.25);
  }
  bookBatches.forEach((b, i) => {
    const mesh = b.build(bookColors[i], { castShadow: true });
    if (mesh) group.add(mesh);
  });

  // 书房窗边绿植
  const studyPlant = new Batch();
  studyPlant.cylinder(0.16, 0.2, 0.36, 10, 11.2, Y2 + 0.02, -7.4);
  const studyPlantMesh = studyPlant.build(mats.woodDark, { castShadow: true });
  if (studyPlantMesh) group.add(studyPlantMesh);
  const studyLeaves = new Batch();
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    studyLeaves.sphere(0.22 + (i % 2) * 0.06, 11.2 + Math.cos(a) * 0.22, Y2 + 0.62 + (i % 3) * 0.14, -7.4 + Math.sin(a) * 0.22, 6, 5);
  }
  const studyLeavesMesh = studyLeaves.build(mats.leaf, { castShadow: true });
  if (studyLeavesMesh) group.add(studyLeavesMesh);

  // ---------------- 灯光 ----------------
  const points = [];
  function addLight(x, y, z, color = 0xffd7a0, intensity = 0, distance = 13) {
    const light = new THREE.PointLight(color, intensity, distance, 1.7);
    light.position.set(x, y, z);
    group.add(light);
    points.push(light);
    return light;
  }
  addLight(-6.5, 2.4, -10.6);        // 客厅
  addLight(6.2, 2.35, -11.4);        // 餐厨
  addLight(-7.8, 5.55, -11.4, 0xffd7a0, 0, 12); // 卧室
  addLight(9.4, 5.5, -11.2, 0xffe2b4, 0, 12);   // 书房

  return {
    group,
    pointLights: points,
    dispose: () => disposeObject(group),
  };
}
