// 风雨连廊：11 条，贯通全部楼栋；柱廊 + 顶棚 + 铺装
import * as THREE from 'three';
import { Batch, linePoints } from './utils.js';
import { CORRIDORS } from '../../data/schoolLayout.js';

// 楼栋入口与主连廊之间的短接驳廊（不改变 11 条主连廊的设定）
const CONNECTORS = [
  { x1: -126, z1: 8, x2: -126, z2: 10.5, w: 4.2 },
  { x1: -84, z1: 8, x2: -84, z2: 10.5, w: 4.2 },
  { x1: -42, z1: 8, x2: -42, z2: 10.5, w: 4.2 },
  { x1: -126, z1: -36, x2: -126, z2: -38.5, w: 4.2 },
  { x1: -84, z1: -36, x2: -84, z2: -38.5, w: 4.2 },
  { x1: -42, z1: -36, x2: -42, z2: -38.5, w: 4.2 },
];

export function createCorridors(mats, addCollider) {
  const group = new THREE.Group();
  group.name = 'school-corridors';

  const floorB = new Batch();
  const roofB = new Batch();
  const colB = new Batch();
  const beamB = new Batch();
  const railB = new Batch();

  const CANOPY_H = 3.25;

  const build = (c, index) => {
    const dx = c.x2 - c.x1;
    const dz = c.z2 - c.z1;
    const alongX = Math.abs(dx) > Math.abs(dz);
    const len = Math.abs(alongX ? dx : dz);
    const cx = (c.x1 + c.x2) / 2;
    const cz = (c.z1 + c.z2) / 2;
    const w = c.w;

    // 铺装
    if (alongX) floorB.box(len + w, 0.09, w, cx, 0.0, cz);
    else floorB.box(w, 0.09, len + w, cx, 0.0, cz);

    // 顶棚 + 檐口
    if (alongX) {
      roofB.box(len + w + 0.4, 0.16, w + 0.7, cx, CANOPY_H, cz);
      roofB.box(len + w + 0.4, 0.12, w + 0.95, cx, CANOPY_H, cz);
      // 边梁
      beamB.box(len, 0.22, 0.2, cx, CANOPY_H - 0.22, cz - w / 2 + 0.1);
      beamB.box(len, 0.22, 0.2, cx, CANOPY_H - 0.22, cz + w / 2 - 0.1);
    } else {
      roofB.box(w + 0.7, 0.16, len + w + 0.4, cx, CANOPY_H, cz);
      roofB.box(w + 0.95, 0.12, len + w + 0.4, cx, CANOPY_H, cz);
      beamB.box(0.2, 0.22, len, cx - w / 2 + 0.1, CANOPY_H - 0.22, cz);
      beamB.box(0.2, 0.22, len, cx + w / 2 - 0.1, CANOPY_H - 0.22, cz);
    }

    // 柱子（两侧，间距 6m）
    const pts = linePoints(c.x1, c.z1, c.x2, c.z2, 6);
    pts.forEach((p, i) => {
      if (i === 0 || i === pts.length - 1) return;
      [-1, 1].forEach((s) => {
        const px = alongX ? p.x : p.x + s * (w / 2 - 0.25);
        const pz = alongX ? p.z + s * (w / 2 - 0.25) : p.z;
        colB.box(0.28, CANOPY_H, 0.28, px, 0, pz);
        addCollider(px, pz, 0.34, 0.34, CANOPY_H);
      });
    });

    // 廊下黄色扶手（仅沿长边，低矮，不阻挡通行）
    if (index % 2 === 0) {
      const railH = 0.55;
      if (alongX) {
        railB.box(len, railH, 0.08, cx, 0.09, cz - w / 2 + 0.12);
        railB.box(len, railH, 0.08, cx, 0.09, cz + w / 2 - 0.12);
      } else {
        railB.box(0.08, railH, len, cx - w / 2 + 0.12, 0.09, cz);
        railB.box(0.08, railH, len, cx + w / 2 - 0.12, 0.09, cz);
      }
    }
  };

  CORRIDORS.forEach((c, i) => build(c, i));
  CONNECTORS.forEach((c, i) => build(c, i + 99));

  const floorMesh = floorB.build(mats.path, { castShadow: false });
  if (floorMesh) group.add(floorMesh);
  const roofMesh = roofB.build(mats.canopy, { castShadow: true });
  if (roofMesh) group.add(roofMesh);
  const colMesh = colB.build(mats.wall, { castShadow: true });
  if (colMesh) group.add(colMesh);
  const beamMesh = beamB.build(mats.accentDeep, { castShadow: false });
  if (beamMesh) group.add(beamMesh);
  const railMesh = railB.build(mats.rail, { castShadow: false });
  if (railMesh) group.add(railMesh);

  return { group };
}
