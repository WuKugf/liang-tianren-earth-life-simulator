// 办公综合楼 + 体育馆
import * as THREE from 'three';
import {
  T, makeFrames, addLocalBox, addLocalGeo, addFacadeCollider,
  addWindowFacade, addEndWall, addParapet, addRoofEquipment,
} from './facade.js';
import { quadGeometry, triGeometry, canvasTexture } from './utils.js';

// ---------------------------------------------------------------------------
// 办公综合楼
// ---------------------------------------------------------------------------
export function buildAdmin(b, ctx) {
  const { batches, addCollider } = ctx;
  const { wall, glass, accent, slab, roof, plinth, parapet } = batches;
  const fr = makeFrames(b);
  const totalH = b.floors * b.floorH;
  const bays = Math.round(b.w / 3.4);

  addWindowFacade({ wall, glass, accent, plinth }, fr.south, b.floors, b.floorH, {
    bayW: 3.4, doorBays: [Math.floor(bays / 2) - 1, Math.floor(bays / 2), Math.floor(bays / 2) + 1],
  });
  addFacadeCollider(addCollider, fr.south, -b.w * 0.32, b.w * 0.36, T + 0.1, totalH);
  addFacadeCollider(addCollider, fr.south, b.w * 0.32, b.w * 0.36, T + 0.1, totalH);
  addWindowFacade({ wall, glass, accent, plinth }, fr.north, b.floors, b.floorH, { bayW: 3.4 });
  addFacadeCollider(addCollider, fr.north, 0, b.w, T + 0.1, totalH);
  addWindowFacade({ wall, glass, accent, plinth }, fr.east, b.floors, b.floorH, { bayW: 3.6 });
  addFacadeCollider(addCollider, fr.east, 0, b.d, T + 0.1, totalH);
  addWindowFacade({ wall, glass, accent, plinth }, fr.west, b.floors, b.floorH, { bayW: 3.6 });
  addFacadeCollider(addCollider, fr.west, 0, b.d, T + 0.1, totalH);

  // 楼板与屋面
  slab.box(b.w, 0.1, b.d, b.x, 0.06, b.z);
  for (let f = 1; f < b.floors; f++) slab.box(b.w, 0.3, b.d, b.x, f * b.floorH - 0.3, b.z);
  roof.box(b.w + 0.2, 0.36, b.d + 0.2, b.x, totalH - 0.36, b.z);
  addParapet(parapet, b, totalH, 1.0);
  addRoofEquipment(roof, b, totalH, 2);

  // 入口雨棚与台阶
  const pz = b.z + b.d / 2 + 3.0;
  const colGeo = new THREE.CylinderGeometry(0.42, 0.46, 7.2, 10);
  colGeo.translate(0, 3.6, 0);
  [-8.5, -3.0, 3.0, 8.5].forEach((dx) => {
    const g = colGeo.clone();
    g.translate(b.x + dx, 0.4, pz);
    wall.add(g);
    addCollider(b.x + dx, pz, 0.9, 0.9, 7.2, 0.4);
  });
  colGeo.dispose();
  plinth.box(22, 0.6, 6.4, b.x, 0.0, pz - 0.4);
  roof.box(22.5, 0.5, 6.8, b.x, 7.4, pz - 0.4);
  accent.box(22.8, 0.28, 7.0, b.x, 7.9, pz - 0.4);
  // 台阶
  for (let i = 0; i < 3; i++) {
    plinth.box(22 - i * 1.2, 0.18, 1.2, b.x, i * 0.18, pz + 3.2 + i * 1.2);
  }

  // 中央核心筒（电梯 / 楼梯）与门厅
  wall.box(12, totalH, 7, b.x, 0, b.z - b.d / 2 + 4.6);
  addCollider(b.x, b.z - b.d / 2 + 4.6, 12, 7, totalH);
  slab.box(26, 0.24, 8.5, b.x, 0.05, b.z + b.d / 2 - 5.5);
  // 门厅前台
  plinth.box(6.4, 1.1, 0.9, b.x, 0.1, b.z + 2.2);
  accent.box(6.5, 0.12, 1.0, b.x, 1.2, b.z + 2.2);

  // 屋顶钟楼
  roof.box(8, 5.4, 8, b.x, totalH, b.z - 2);
  const clockTex = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#f5f2e8';
    c.beginPath();
    c.arc(w / 2, h / 2, w / 2 - 8, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#3b4a58';
    c.lineWidth = 10;
    c.stroke();
    c.strokeStyle = '#3b4a58';
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(w / 2, h / 2);
    c.lineTo(w / 2, h * 0.22);
    c.moveTo(w / 2, h / 2);
    c.lineTo(w * 0.72, h * 0.56);
    c.stroke();
  });
  const clockMat = new THREE.MeshLambertMaterial({ map: clockTex });
  [0, 1].forEach((i) => {
    const face = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), clockMat);
    const front = i === 0;
    face.position.set(b.x, totalH + 3.0, b.z - 2 + (front ? 4.02 : -4.02));
    face.rotation.y = front ? 0 : Math.PI;
    ctx.group.add(face);
  });
  roof.box(9, 0.5, 9, b.x, totalH + 5.4, b.z - 2);
  plaque(b, ctx);

  return { building: b, kind: 'admin', totalH };
}

// 楼名竖牌（南北两面）
function plaque(b, ctx) {
  const tex = canvasTexture(128, 512, (c, w, h) => {
    c.fillStyle = '#b03a2e';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#fbe6a2';
    c.font = 'bold 72px "Microsoft YaHei", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const chars = b.name.split('');
    chars.forEach((ch, i) => c.fillText(ch, w / 2, 70 + i * 88));
  });
  const mat = new THREE.MeshLambertMaterial({ map: tex });
  [1, -1].forEach((s) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6.4), mat);
    m.position.set(b.x - 5.2, 7.5, b.z + s * (b.d / 2 + 0.16));
    m.rotation.y = s > 0 ? 0 : Math.PI;
    ctx.group.add(m);
  });
}

// ---------------------------------------------------------------------------
// 体育馆
// ---------------------------------------------------------------------------
export function buildGym(b, ctx) {
  const { batches, addCollider } = ctx;
  const { wall, glass, glassCurtain, accent, slab, roof, plinth, parapet } = batches;
  const fr = makeFrames(b);
  const totalH = b.floorH;
  const H = totalH;

  // 两侧山墙（实墙 + 高窗）
  addEndWall({ wall, glass, accent }, fr.east, 1, H, addCollider, {});
  addEndWall({ wall, glass, accent }, fr.west, 1, H, addCollider, {});

  // 南北玻璃幕墙（南侧中央留门洞）
  const makeCurtain = (frame, doorGap) => {
    const len = frame.len;
    const bays = Math.max(4, Math.round(len / 3.2));
    const w = len / bays;
    for (let i = 0; i < bays; i++) {
      const lx = -len / 2 + (i + 0.5) * w;
      const isDoor = doorGap && Math.abs(lx) < doorGap / 2;
      addLocalBox(wall, frame, w, 0.85, T + 0.05, lx, 0, -T / 2);
      addLocalBox(wall, frame, w, 0.7, T + 0.05, lx, H - 0.7, -T / 2);
      if (!isDoor) {
        addLocalGeo(glassCurtain, frame, new THREE.BoxGeometry(w - 0.16, H - 1.6, 0.12), lx, (H - 1.6) / 2 + 0.85, -0.4);
      }
      // 竖挺
      addLocalBox(accent, frame, 0.22, H - 1.5, 0.3, lx - w / 2, 0.85, -0.32);
    }
    addLocalBox(accent, frame, len, 0.22, 0.34, 0, H - 0.85, -0.32);
    addLocalBox(plinth, frame, len, 0.9, 0.42, 0, 0, 0.0);
    // 门洞两侧碰撞
    if (doorGap) {
      const seg = (len - doorGap) / 2;
      [-1, 1].forEach((s) => addFacadeCollider(addCollider, frame, s * (doorGap / 2 + seg / 2), seg, T + 0.15, H));
    } else {
      addFacadeCollider(addCollider, frame, 0, len, T + 0.15, H);
    }
  };
  makeCurtain(fr.south, 6.0);
  makeCurtain(fr.north, 0);

  // 地面：木地板场地
  const courtTex = canvasTexture(1024, 640, (c, w, h) => {
    c.fillStyle = '#c99b62';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) {
      c.fillStyle = Math.random() > 0.5 ? 'rgba(255,235,200,0.08)' : 'rgba(120,80,40,0.08)';
      c.fillRect(Math.random() * w, Math.random() * h, 30, 2);
    }
    c.strokeStyle = '#fdf6e8';
    c.lineWidth = 5;
    c.strokeRect(30, 30, w - 60, h - 60);
    c.beginPath();
    c.moveTo(w / 2, 30);
    c.lineTo(w / 2, h - 30);
    c.stroke();
    c.beginPath();
    c.arc(w / 2, h / 2, 62, 0, Math.PI * 2);
    c.stroke();
    c.strokeRect(30, h / 2 - 90, 130, 180);
    c.strokeRect(w - 160, h / 2 - 90, 130, 180);
  });
  const courtMat = new THREE.MeshLambertMaterial({ map: courtTex });
  const court = new THREE.Mesh(new THREE.PlaneGeometry(b.w - 4, b.d - 10), courtMat);
  court.rotation.x = -Math.PI / 2;
  court.position.set(b.x, 0.04, b.z);
  court.receiveShadow = true;
  ctx.group.add(court);

  // 看台（两侧阶梯）
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const h = 0.42 * (i + 1);
    plinth.box(b.w - 10, h, 0.9, b.x, 0, b.z + b.d / 2 - 1.2 - i * 0.9);
    plinth.box(b.w - 10, h, 0.9, b.x, 0, b.z - b.d / 2 + 1.2 + i * 0.9);
  }

  // 四坡屋顶
  const rise = 5.2;
  const cx = [b.x, totalH, b.z];
  const ctr = [b.x, totalH + 2, b.z];
  const x0 = b.x - b.w / 2 - 0.4;
  const x1 = b.x + b.w / 2 + 0.4;
  const z0 = b.z - b.d / 2 - 0.4;
  const z1 = b.z + b.d / 2 + 0.4;
  const ridgeLen = b.w * 0.42;
  const r1 = [b.x - ridgeLen, totalH + rise, b.z];
  const r2 = [b.x + ridgeLen, totalH + rise, b.z];
  const A = [x0, totalH, z0];
  const B = [x1, totalH, z0];
  const C = [x1, totalH, z1];
  const D = [x0, totalH, z1];
  roof.add(quadGeometry(A, B, r2, r1, ctr));
  roof.add(quadGeometry(D, r1, r2, C, ctr));
  roof.add(triGeometry(A, r1, D, ctr));
  roof.add(triGeometry(B, C, r2, ctr));
  // 屋脊
  accent.box(ridgeLen * 2 + 0.6, 0.36, 0.6, b.x, totalH + rise - 0.1, b.z);
  slab.box(b.w, 0.3, b.d, b.x, totalH - 0.3, b.z);

  // 体育馆标牌
  const signTex = canvasTexture(512, 160, (c, w, h) => {
    c.fillStyle = '#2b6d78';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#f6e7b6';
    c.font = 'bold 92px "Microsoft YaHei", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('体育馆', w / 2, h / 2 + 4);
  });
  const signMat = new THREE.MeshLambertMaterial({ map: signTex });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8), signMat);
  sign.position.set(b.x, H - 2.4, b.z + b.d / 2 + 0.3);
  ctx.group.add(sign);

  return { building: b, kind: 'gym', totalH };
}
