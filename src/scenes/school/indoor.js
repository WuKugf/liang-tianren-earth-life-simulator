// 室内：标准化教室（课桌椅、黑板、讲台、国旗、标语）、走廊与门厅照明
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Batch, buildInstanced, canvasTexture } from './utils.js';

// 共享标语贴图（全部教室复用同一材质，省显存）
function makeBannerMaterial() {
  const tex = canvasTexture(1024, 160, (c, w, h) => {
    c.fillStyle = '#b8352c';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#f2d18a';
    c.lineWidth = 6;
    c.strokeRect(8, 8, w - 16, h - 16);
    c.fillStyle = '#fdf0c8';
    c.font = 'bold 84px "Microsoft YaHei", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('好好学习  天天向上', w / 2, h / 2 + 4);
  });
  return new THREE.MeshLambertMaterial({ map: tex });
}

// 课桌 + 椅子合并为一个几何体（朝向 +Z，学生坐 -Z 侧面向 +Z）
function makeDeskGeometry() {
  const parts = [];
  const push = (g) => parts.push(g);
  const box = (w, h, d, x, y, z) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    push(g);
  };
  // 桌面
  box(1.12, 0.05, 0.45, 0, 0.75, 0);
  // 桌腿
  [[-0.48, -0.17], [0.48, -0.17], [-0.48, 0.17], [0.48, 0.17]].forEach(([x, z]) => box(0.05, 0.73, 0.05, x, 0.365, z));
  // 桌斗
  box(1.05, 0.12, 0.34, 0, 0.6, 0);
  // 椅子：座面 + 靠背 + 腿
  box(0.42, 0.05, 0.4, 0, 0.44, -0.72);
  box(0.42, 0.42, 0.05, 0, 0.66, -0.9);
  [[-0.17, -0.56], [0.17, -0.56], [-0.17, -0.88], [0.17, -0.88]].forEach(([x, z]) => box(0.04, 0.44, 0.04, x, 0.22, z));
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged;
}

export function createIndoor(mats, entries, addCollider) {
  const group = new THREE.Group();
  group.name = 'school-indoor';

  const bannerMat = makeBannerMaterial();
  const deskGeo = makeDeskGeometry();

  const deskTransforms = [];
  const lightTransforms = [];
  const board = new Batch();
  const podium = new Batch();
  const flagPole = new Batch();
  const flagBatch = new Batch();

  entries.filter((e) => e.kind === undefined && e.rooms).forEach((e) => {
    const { rooms, floors, floorH, corridorSide } = e;
    const cs = corridorSide;

    for (let f = 0; f < floors; f++) {
      const y0 = f * floorH;
      rooms.forEach((room) => {
        const ry = cs === 1 ? 0 : Math.PI;
        // ---------- 课桌椅 ----------
        const boardZ = room.partitionZ - cs * 0.18;
        const rows = 6;
        const cols = 4;
        const startZ = boardZ - cs * 3.1;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const dx = (c - (cols - 1) / 2) * 1.85;
            const dz = r * 1.35;
            deskTransforms.push({
              x: room.x + dx,
              y: y0 + 0.02,
              z: startZ - cs * dz,
              ry,
            });
          }
        }

        // ---------- 黑板 ----------
        const bw = 4.6;
        board.box(bw, 1.2, 0.09, room.x, y0 + 1.35, boardZ - cs * 0.02);
        board.box(bw + 0.3, 0.1, 0.16, room.x, y0 + 1.22, boardZ - cs * 0.06);
        // 黑板边框
        board.box(bw + 0.28, 0.12, 0.12, room.x, y0 + 2.57, boardZ - cs * 0.02);
        board.box(0.14, 1.32, 0.12, room.x - bw / 2 - 0.07, y0 + 1.3, boardZ - cs * 0.02);
        board.box(0.14, 1.32, 0.12, room.x + bw / 2 + 0.07, y0 + 1.3, boardZ - cs * 0.02);

        // ---------- 讲台 ----------
        podium.box(1.5, 0.78, 0.62, room.x - 1.3, y0, boardZ - cs * 1.15);
        podium.box(1.62, 0.06, 0.72, room.x - 1.3, y0 + 0.78, boardZ - cs * 1.15);

        // ---------- 国旗 ----------
        const fx = room.x + bw / 2 + 1.0;
        const fz = boardZ - cs * 0.25;
        flagPole.cylinder(0.035, 0.035, 2.1, 6, fx, y0 + 1.5, fz);
        // 旗面：红色旗 + 黄色小星条
        const flagGeo = new THREE.PlaneGeometry(0.72, 0.48);
        flagGeo.translate(0.39, 0, 0);
        flagGeo.rotateY(cs === 1 ? 0 : Math.PI);
        flagGeo.translate(fx, y0 + 3.2, fz);
        flagBatch.add(flagGeo);

        // ---------- 天花板灯具 ----------
        for (let i = 0; i < 4; i++) {
          lightTransforms.push({
            x: room.x - 2.6 + (i % 2) * 5.2,
            y: y0 + floorH - 0.42,
            z: room.z - 2.6 + Math.floor(i / 2) * 5.2,
            ry: 0,
          });
        }
      });

      // ---------- 走廊灯 ----------
      const b = e.building;
      for (let i = 0; i < 6; i++) {
        const lx = b.x - b.w / 2 + 3.2 + i * ((b.w - 6.4) / 5);
        lightTransforms.push({ x: lx, y: y0 + floorH - 0.4, z: e.corridorZ, ry: 0 });
      }
    }
  });

  // ---------- 生成网格 ----------
  const deskMesh = buildInstanced(deskGeo, mats.deskTop, deskTransforms, { castShadow: false, receiveShadow: true });
  if (deskMesh) group.add(deskMesh);

  const boardMesh = board.build(mats.board, { castShadow: false });
  if (boardMesh) group.add(boardMesh);

  const podiumMesh = podium.build(mats.podium, { castShadow: false });
  if (podiumMesh) group.add(podiumMesh);

  const flagMesh = flagPole.build(mats.metalDark, { castShadow: false });
  if (flagMesh) group.add(flagMesh);

  const flagMesh2 = flagBatch.build(mats.flagRed, { castShadow: false });
  if (flagMesh2) group.add(flagMesh2);

  // 标语：全部教室共用一个贴图材质，合并为单网格
  const bannerPlanes = new Batch();
  entries.filter((e) => e.rooms).forEach((e) => {
    const { rooms, floors, floorH, corridorSide } = e;
    for (let f = 0; f < floors; f++) {
      rooms.forEach((room) => {
        const g = new THREE.PlaneGeometry(5.4, 0.68);
        if (corridorSide === 1) {
          g.translate(room.x, f * floorH + 2.92, room.partitionZ - 0.12);
        } else {
          g.rotateY(Math.PI);
          g.translate(room.x, f * floorH + 2.92, room.partitionZ + 0.12);
        }
        bannerPlanes.add(g);
      });
    }
  });
  const bannerMesh = bannerPlanes.build(bannerMat, { castShadow: false });
  if (bannerMesh) group.add(bannerMesh);

  // 灯具（自发光，夜间点亮）
  const lightGeo = new THREE.BoxGeometry(1.2, 0.09, 0.32);
  const lightMesh = buildInstanced(lightGeo, mats.lampPanel, lightTransforms);
  if (lightMesh) group.add(lightMesh);

  return { group };
}
