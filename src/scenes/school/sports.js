// 运动区：环形塑胶跑道、足球场、硅PU篮球场、排球场、看台
import * as THREE from 'three';
import { Batch, canvasTexture, pitchTexture, basketballTexture } from './utils.js';
import { SPORTS } from '../../data/schoolLayout.js';

// 圆角矩形轮廓（沿 X 方向为直道）
function roundedRect(w, d, r) {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hd = d / 2;
  s.moveTo(-hw + r, -hd);
  s.lineTo(hw - r, -hd);
  s.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
  s.lineTo(hw, hd - r);
  s.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
  s.lineTo(-hw + r, hd);
  s.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-hw, -hd + r);
  s.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  return s;
}

function flat(geo, y) {
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y, 0);
  return geo;
}

export function createSports(mats, addCollider) {
  const group = new THREE.Group();
  group.name = 'school-sports';

  const t = SPORTS.track;
  const outerR = t.radius + t.lanes * t.laneW;
  const outerW = t.straight + outerR * 2;
  const outerD = outerR * 2;
  const innerW = t.straight + t.radius * 2;
  const innerD = t.radius * 2;

  // ---------------- 跑道面 ----------------
  const ringShape = roundedRect(outerW, outerD, outerR);
  ringShape.holes.push(roundedRect(innerW, innerD, t.radius));
  const ringGeo = flat(new THREE.ShapeGeometry(ringShape, 18), 0.045);
  ringGeo.translate(t.cx, 0, t.cz);
  const trackMesh = new THREE.Mesh(ringGeo, mats.trackRed);
  trackMesh.receiveShadow = true;
  group.add(trackMesh);

  // ---------------- 分道线 ----------------
  const lineBatch = new Batch();
  for (let i = 0; i <= t.lanes; i++) {
    const r = t.radius + i * t.laneW;
    const w = t.straight + r * 2;
    const d = r * 2;
    const shape = roundedRect(w + 0.07, d + 0.07, r + 0.035);
    shape.holes.push(roundedRect(w - 0.07, d - 0.07, Math.max(1, r - 0.035)));
    const g = flat(new THREE.ShapeGeometry(shape, 18), 0.055);
    g.translate(t.cx, 0, t.cz);
    lineBatch.add(g);
  }
  // 起终点线
  lineBatch.box(0.12, 0.02, outerD, t.cx - t.straight / 2, 0.056, t.cz);
  const lines = lineBatch.build(mats.whiteLine, { castShadow: false });
  if (lines) group.add(lines);

  // ---------------- 足球场 ----------------
  const f = SPORTS.football;
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(f.w, f.d),
    new THREE.MeshLambertMaterial({ map: pitchTexture() }),
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.set(f.x, 0.06, f.z);
  pitch.receiveShadow = true;
  group.add(pitch);

  // 球门
  const goalBatch = new Batch();
  const goalW = 7.32;
  const goalH = 2.44;
  [-1, 1].forEach((s) => {
    const gx = f.x + s * (f.w / 2 - 0.4);
    goalBatch.cylinder(0.08, 0.08, goalH, 8, gx, 0.06, f.z - goalW / 2);
    goalBatch.cylinder(0.08, 0.08, goalH, 8, gx, 0.06, f.z + goalW / 2);
    goalBatch.box(0.12, 0.12, goalW, gx, 0.06 + goalH, f.z);
    addCollider(gx, f.z - goalW / 2, 0.3, 0.3, goalH);
    addCollider(gx, f.z + goalW / 2, 0.3, 0.3, goalH);
  });
  const goals = goalBatch.build(mats.goalPost, { castShadow: true });
  if (goals) group.add(goals);

  // 球网（半透明）
  const netMat = new THREE.MeshLambertMaterial({
    color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
  });
  [-1, 1].forEach((s) => {
    const gx = f.x + s * (f.w / 2 - 0.4);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalH), netMat);
    net.position.set(gx + s * -0.6, goalH / 2 + 0.06, f.z);
    net.rotation.y = Math.PI / 2;
    group.add(net);
  });

  // ---------------- 篮球场 ----------------
  const bbTex = basketballTexture();
  SPORTS.basketball.forEach((c, idx) => {
    const court = new THREE.Mesh(
      new THREE.PlaneGeometry(c.w, c.d),
      new THREE.MeshLambertMaterial({ map: bbTex }),
    );
    court.rotation.x = -Math.PI / 2;
    court.position.set(c.x, 0.05, c.z);
    court.receiveShadow = true;
    group.add(court);

    // 场地边框
    const border = new Batch();
    border.box(c.w + 0.5, 0.03, 0.25, c.x, 0.045, c.z - c.d / 2 - 0.12);
    border.box(c.w + 0.5, 0.03, 0.25, c.x, 0.045, c.z + c.d / 2 + 0.12);
    const bg = border.build(mats.courtBlue, { castShadow: false });
    if (bg) group.add(bg);

    // 篮板 + 篮筐 + 立柱
    const hoop = new Batch();
    [-1, 1].forEach((s) => {
      const hx = c.x + s * (c.w / 2 + 0.9);
      hoop.cylinder(0.11, 0.13, 3.2, 8, hx, 0, c.z);
      hoop.box(1.8, 1.05, 0.08, hx - s * 0.85, 2.55, c.z);
      hoop.box(0.5, 0.5, 0.1, hx - s * 0.85, 2.55, c.z);
      addCollider(hx, c.z, 0.32, 0.32, 3.2);
    });
    const hoops = hoop.build(mats.backboard, { castShadow: true });
    if (hoops) group.add(hoops);

    // 篮圈（红色）
    const rimBatch = new Batch();
    [-1, 1].forEach((s) => {
      const hx = c.x + s * (c.w / 2 + 0.9) - s * 1.35;
      const rim = new THREE.TorusGeometry(0.23, 0.028, 6, 16);
      rim.rotateX(Math.PI / 2);
      rim.translate(hx, 3.05, c.z);
      rimBatch.add(rim);
    });
    const rims = rimBatch.build(mats.hoop, { castShadow: false });
    if (rims) group.add(rims);
  });

  // ---------------- 排球场 ----------------
  SPORTS.ballcourts.forEach((c) => {
    const tex = canvasTexture(512, 300, (ctx2, w, h) => {
      ctx2.fillStyle = '#2e7d6f';
      ctx2.fillRect(0, 0, w, h);
      ctx2.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx2.lineWidth = 6;
      ctx2.strokeRect(24, 24, w - 48, h - 48);
      ctx2.beginPath();
      ctx2.moveTo(w / 2, 24);
      ctx2.lineTo(w / 2, h - 24);
      ctx2.stroke();
    });
    const court = new THREE.Mesh(new THREE.PlaneGeometry(c.w, c.d), new THREE.MeshLambertMaterial({ map: tex }));
    court.rotation.x = -Math.PI / 2;
    court.position.set(c.x, 0.05, c.z);
    court.receiveShadow = true;
    group.add(court);

    const netB = new Batch();
    netB.cylinder(0.09, 0.09, 2.5, 8, c.x - c.d / 2, 0, c.z);
    netB.cylinder(0.09, 0.09, 2.5, 8, c.x + c.d / 2, 0, c.z);
    const posts = netB.build(mats.metalDark, { castShadow: true });
    if (posts) group.add(posts);
    const volleyNet = new THREE.Mesh(new THREE.PlaneGeometry(c.d, 1.0), netMat);
    volleyNet.position.set(c.x, 2.1, c.z);
    volleyNet.rotation.y = Math.PI / 2;
    group.add(volleyNet);
  });

  // ---------------- 操场看台 ----------------
  const stand = new Batch();
  const sx = 14;
  for (let i = 0; i < 5; i++) {
    stand.box(1.3, 0.45 * (i + 1), 26, sx - i * 1.3, 0, t.cz);
  }
  const stands = stand.build(mats.plinth, { castShadow: true });
  if (stands) group.add(stands);
  // 看台顶棚
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 27), mats.canopy);
  canopy.position.set(sx - 3.2, 4.6, t.cz);
  canopy.rotation.z = 0.08;
  canopy.castShadow = true;
  group.add(canopy);
  for (let i = 0; i < 4; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.6, 8), mats.metal);
    col.position.set(sx - 6.6, 2.3, t.cz - 12 + i * 8);
    group.add(col);
  }
  addCollider(sx - 2.6, t.cz, 7, 26, 4.8);

  // ---------------- 场地外围护网（跑道外侧矮栏） ----------------
  const fenceB = new Batch();
  const fenceH = 1.2;
  fenceB.box(0.1, fenceH, outerD, t.cx + outerW / 2 + 2.2, 0.05, t.cz);
  fenceB.box(0.1, fenceH, outerD, t.cx - outerW / 2 - 2.2, 0.05, t.cz);
  const sportFence = fenceB.build(mats.metal, { castShadow: false });
  if (sportFence) group.add(sportFence);

  return { group };
}
