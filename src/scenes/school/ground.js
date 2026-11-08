// 场地：地基、广场、道路、绿化、围墙校门、路灯
import * as THREE from 'three';
import { Batch, buildInstanced, canvasTexture, grassTexture, plazaTexture, asphaltTexture } from './utils.js';
import { SITE, ROADS, LAWN_PATCHES, TREES, LAMPS } from '../../data/schoolLayout.js';

export function createGround(mats, addCollider) {
  const group = new THREE.Group();
  group.name = 'school-ground';

  // ---------------- 草地基底（保证任何位置都不会踩空） ----------------
  const grassMap = grassTexture();
  const grassMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: grassMap });
  const base = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), grassMat);
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, 0, 0);
  base.receiveShadow = true;
  group.add(base);

  // 校外草地（更大一圈，避免边界见到虚空）
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshLambertMaterial({ color: 0x7c9a63 }));
  outer.rotation.x = -Math.PI / 2;
  outer.position.set(0, -0.06, 0);
  group.add(outer);

  // ---------------- 绿化草坪（略高于地面，形成层次） ----------------
  const lawnBatch = new Batch();
  LAWN_PATCHES.forEach((p) => {
    lawnBatch.box(p.w, 0.08, p.d, p.x, 0, p.z);
  });
  const lawn = lawnBatch.build(new THREE.MeshLambertMaterial({ color: 0x74ab5b }));
  if (lawn) group.add(lawn);

  // ---------------- 铺装广场 ----------------
  const plazaMap = plazaTexture();
  const plazaMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: plazaMap });
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(SITE.plaza.w, SITE.plaza.d), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(SITE.plaza.x, 0.04, SITE.plaza.z);
  plaza.receiveShadow = true;
  group.add(plaza);

  // ---------------- 道路 / 步道 ----------------
  const roadBatch = new Batch();
  ROADS.forEach((r) => roadBatch.box(r.w, 0.06, r.d, r.x, 0.02, r.z));
  const roadMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: asphaltTexture() });
  const roads = roadBatch.build(roadMat);
  if (roads) group.add(roads);

  // 主轴：校门 → 广场 → 办公综合楼 的中央步行轴
  const axisBatch = new Batch();
  axisBatch.box(10, 0.03, 100, 2, 0.05, 60);
  const axis = axisBatch.build(new THREE.MeshLambertMaterial({ color: 0xd3cbb8 }));
  if (axis) group.add(axis);

  // ---------------- 行道树（实例化） ----------------
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 3.0, 6);
  trunkGeo.translate(0, 1.5, 0);
  const leafGeo = new THREE.IcosahedronGeometry(1.55, 0);
  leafGeo.translate(0, 4.0, 0);
  const leafGeo2 = new THREE.IcosahedronGeometry(1.1, 0);
  leafGeo2.translate(0, 5.3, 0);

  const trunkT = [];
  const leafT = [];
  const leafT2 = [];
  TREES.forEach((t, i) => {
    const ry = (i * 1.7) % Math.PI;
    trunkT.push({ x: t.x, z: t.z, s: t.s });
    leafT.push({ x: t.x, z: t.z, s: t.s, ry });
    leafT2.push({ x: t.x, z: t.z, s: t.s * 0.95, ry: ry + 0.6 });
  });
  const trunks = buildInstanced(trunkGeo, mats.trunk, trunkT, { castShadow: false });
  const leaves = buildInstanced(leafGeo, mats.leaf, leafT, { castShadow: false });
  const leaves2 = buildInstanced(leafGeo2, mats.leafLight, leafT2, { castShadow: false });
  [trunks, leaves, leaves2].forEach((m) => {
    if (m) group.add(m);
  });
  // 树干碰撞（细小，只给靠近主轴的树加，避免碰撞体过多）
  TREES.forEach((t) => {
    if (Math.abs(t.z) < 110 && t.x > -30 && t.x < 40) addCollider(t.x, t.z, 0.7, 0.7, 3.2);
  });

  // ---------------- 围墙与校门 ----------------
  const fenceBatch = new Batch();
  const H = 2.3;
  const wallSeg = (x1, z1, x2, z2) => {
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const w = Math.abs(x2 - x1) || 0.5;
    const d = Math.abs(z2 - z1) || 0.5;
    fenceBatch.box(w, H, d, cx, 0, cz);
  };
  // 南侧围墙（校门两侧留门洞）
  wallSeg(-148, 124, -10, 124);
  wallSeg(14, 124, 148, 124);
  // 北、东、西侧
  wallSeg(-148, -148, 148, -148);
  wallSeg(-148, -148, -148, 124);
  wallSeg(148, -148, 148, 124);
  // 压顶
  fenceBatch.box(296, 0.2, 0.7, 0, H, -148);
  fenceBatch.box(0.7, 0.2, 272, -148, H, -12);
  fenceBatch.box(0.7, 0.2, 272, 148, H, -12);
  const fence = fenceBatch.build(mats.fence, { castShadow: false });
  if (fence) group.add(fence);
  addCollider(0, -148, 296, 0.8, H);
  addCollider(-148, -12, 0.8, 272, H);
  addCollider(148, -12, 0.8, 272, H);
  addCollider(-79, 124, 138, 0.8, H);
  addCollider(81, 124, 134, 0.8, H);

  // 校门：双柱 + 横梁 + 校名牌 + 电动门
  const gate = new THREE.Group();
  const g = SITE.gate;
  const pillarGeo = new THREE.BoxGeometry(1.8, g.pillarH, 2.2);
  const capGeo = new THREE.BoxGeometry(2.2, 0.35, 2.6);
  [-1, 1].forEach((s) => {
    const p = new THREE.Mesh(pillarGeo, mats.gateStone);
    p.position.set(g.x + s * (g.w / 2), g.pillarH / 2, g.z);
    p.castShadow = true;
    p.receiveShadow = true;
    gate.add(p);
    const cap = new THREE.Mesh(capGeo, mats.plinth);
    cap.position.set(g.x + s * (g.w / 2), g.pillarH + 0.17, g.z);
    gate.add(cap);
    addCollider(g.x + s * (g.w / 2), g.z, 1.8, 2.2, g.pillarH);
  });

  // 校名牌（红底金字，用 Canvas 贴图）
  const signTex = canvasTexture(1024, 256, (c, w, h) => {
    c.fillStyle = '#b03a2e';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#f4d58d';
    c.lineWidth = 8;
    c.strokeRect(10, 10, w - 20, h - 20);
    c.fillStyle = '#fbe6a2';
    c.font = 'bold 118px "Microsoft YaHei", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('玉东新区金榜小学', w / 2, h / 2 + 4);
  });
  const signMat = new THREE.MeshLambertMaterial({ map: signTex });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(17, 2.3, 0.35), [mats.gateSign, mats.gateSign, mats.gateSign, mats.gateSign, signMat, mats.gateSign]);
  sign.position.set(g.x, g.pillarH - 1.5, g.z);
  sign.castShadow = true;
  gate.add(sign);
  // 横梁
  const beam = new THREE.Mesh(new THREE.BoxGeometry(g.w, 0.6, 1.0), mats.gateStone);
  beam.position.set(g.x, g.pillarH + 0.4, g.z);
  gate.add(beam);

  // 电动伸缩门（半开状态，留出通行口）
  const gateBarBatch = new Batch();
  for (let i = 0; i < 9; i++) {
    gateBarBatch.box(0.14, 1.6, 0.14, g.x - 11 + i * 0.9, 0.1, g.z - 0.6);
  }
  gateBarBatch.box(8.4, 0.12, 0.16, g.x - 7.4, 1.75, g.z - 0.6);
  const gateBar = gateBarBatch.build(mats.metal, { castShadow: false });
  if (gateBar) gate.add(gateBar);
  addCollider(g.x - 7.4, g.z - 0.6, 8.6, 0.5, 1.9);
  group.add(gate);

  // 校门内侧门卫室
  const guardBatch = new Batch();
  guardBatch.box(5, 3.2, 4, -15, 0, 116);
  const guard = guardBatch.build(mats.wall, { castShadow: true });
  if (guard) group.add(guard);
  const guardGlass = new Batch();
  guardGlass.add(orientPlane(4.0, 1.3, -15 + 0.06, 1.6, 116, Math.PI / 2));
  const gg = guardGlass.build(mats.glass);
  if (gg) group.add(gg);
  const guardRoof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.3, 4.8), mats.roof);
  guardRoof.position.set(-15, 3.35, 116);
  guardRoof.castShadow = true;
  group.add(guardRoof);
  addCollider(-15, 116, 5, 4, 3.4);

  // ---------------- 路灯（含夜间点光） ----------------
  const lampPoles = [];
  const lampHeads = [];
  const lights = [];
  LAMPS.forEach((l) => {
    lampPoles.push({ x: l.x, z: l.z });
    lampHeads.push({ x: l.x, z: l.z });
    const pl = new THREE.PointLight(0xffd9a0, 0, 22, 1.8);
    pl.position.set(l.x, 5.6, l.z);
    pl.castShadow = false;
    group.add(pl);
    lights.push(pl);
  });

  const poleGeo = new THREE.CylinderGeometry(0.09, 0.13, 5.4, 6);
  poleGeo.translate(0, 2.7, 0);
  const headGeo = new THREE.BoxGeometry(0.75, 0.22, 0.75);
  headGeo.translate(0, 5.5, 0);
  const poles = buildInstanced(poleGeo, mats.metalDark, lampPoles);
  const heads = buildInstanced(headGeo, mats.lampBulb, lampHeads);
  if (poles) group.add(poles);
  if (heads) group.add(heads);

  return {
    group,
    setNight(isNight) {
      lights.forEach((pl) => {
        pl.intensity = isNight ? 26 : 0;
      });
      mats.lampBulb.emissiveIntensity = isNight ? 1.6 : 0.15;
    },
  };
}

// 产生一个朝向 +X 的竖向玻璃面（用于门卫室）
function orientPlane(w, h, x, y, z, ry) {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.rotateY(ry);
  geo.translate(x, y, z);
  return geo;
}
