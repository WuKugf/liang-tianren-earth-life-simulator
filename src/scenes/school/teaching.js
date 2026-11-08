// 教学楼：外廊式，内廊靠中庭一侧，黄色栏杆；教室在南/北侧成排
import * as THREE from 'three';
import {
  T, CD, makeFrames, addLocalBox, addLocalGeo, addFacadeCollider,
  addWindowFacade, addCorridorFacade, addEndWall, addParapet, addRoofEquipment,
} from './facade.js';

export function buildTeaching(b, ctx) {
  const { batches, addCollider } = ctx;
  const { wall, glass, accent, slab, roof, plinth } = batches;
  const fr = makeFrames(b);
  const cs = b.corridorSide === 'south' ? 1 : -1; // 走廊所在一侧
  const corridorFr = cs === 1 ? fr.south : fr.north;
  const classFr = cs === 1 ? fr.north : fr.south;
  const totalH = b.floors * b.floorH;

  const corridorZ = b.z + cs * (b.d / 2 - CD / 2);
  const partitionZ = b.z + cs * (b.d / 2 - CD);
  const farZ = b.z - (cs * b.d) / 2;
  const classD = Math.abs(partitionZ - farZ);

  // ---------------- 外立面 ----------------
  addWindowFacade({ wall, glass, accent, plinth }, classFr, b.floors, b.floorH, { bayW: 3.4 });
  addFacadeCollider(addCollider, classFr, 0, b.w, T + 0.1, totalH);

  addCorridorFacade({ wall, rail: ctx.batches.rail, accent, plinth }, corridorFr, b.floors, b.floorH, addCollider, {
    bayW: 3.6, entryWidth: 9,
  });
  addEndWall({ wall, glass, accent }, fr.east, b.floors, b.floorH, addCollider);
  addEndWall({ wall, glass, accent }, fr.west, b.floors, b.floorH, addCollider);

  // ---------------- 楼板（楼梯间留洞） ----------------
  const xL = b.x - b.w / 2;
  const stairW = 5.6;
  const sx0 = b.x + b.w / 2 - stairW - 0.4;
  const classZCenter = (farZ + partitionZ) / 2;

  // 首层地面（略高于铺装，避免与室外地面共面闪烁）
  slab.box(b.w, 0.1, b.d, b.x, 0.06, b.z);
  for (let f = 1; f < b.floors; f++) {
    const yb = f * b.floorH - 0.28;
    // 主楼板（楼梯间以西）
    const mainW = sx0 - xL;
    slab.box(mainW, 0.28, b.d, xL + mainW / 2, yb, b.z);
    // 楼梯间东侧：仅教室区域有板
    slab.box(stairW + 0.4, 0.28, classD + 0.3, sx0 + (stairW + 0.4) / 2, yb, classZCenter);
  }
  // 屋面板
  roof.box(b.w + 0.2, 0.34, b.d + 0.2, b.x, totalH - 0.34, b.z);
  addParapet(batches.parapet, b, totalH, 0.85);
  addRoofEquipment(roof, b, totalH, b.floors);

  // ---------------- 走廊内侧隔墙 + 教室门 ----------------
  const roomCount = 4;
  const roomW = b.w / roomCount;
  const wallH = b.floorH;
  const doors = [];
  for (let f = 0; f < b.floors; f++) {
    const y0 = f * b.floorH;
    for (let i = 0; i < roomCount; i++) {
      const rxL = xL + i * roomW;
      const doorC = rxL + 1.55;
      const seg1 = [rxL, doorC - 0.6];
      const seg2 = [doorC + 0.6, rxL + roomW];
      [seg1, seg2].forEach(([a, c]) => {
        const len = c - a;
        if (len <= 0.05) return;
        wall.box(len, wallH, 0.24, (a + c) / 2, y0, partitionZ);
        addCollider((a + c) / 2, partitionZ, len, 0.32, wallH, y0);
      });
      // 门楣
      wall.box(1.2, wallH - 2.15, 0.24, doorC, y0 + 2.15, partitionZ);
      // 门框（暖黄）
      accent.box(0.12, 2.15, 0.3, doorC - 0.6, y0, partitionZ);
      accent.box(0.12, 2.15, 0.3, doorC + 0.6, y0, partitionZ);
      doors.push({ x: doorC, z: partitionZ, floor: f });
    }
    // 教室之间的隔墙
    for (let i = 1; i < roomCount; i++) {
      const wx = xL + i * roomW;
      wall.box(0.24, wallH, classD, wx, y0, classZCenter);
      addCollider(wx, classZCenter, 0.32, classD, wallH, y0);
    }
  }

  // ---------------- 楼梯（东端，仅造型） ----------------
  const steps = 18;
  const stepH = b.floorH / steps;
  const stepD = 0.3;
  for (let f = 0; f < b.floors - 1; f++) {
    for (let s = 0; s < steps; s++) {
      const x = sx0 + 0.45 + s * stepD;
      slab.box(stepD + 0.02, stepH * (s + 1), 2.4, x, f * b.floorH, corridorZ);
    }
    // 楼梯休息平台
    slab.box(1.2, 0.2, 2.4, sx0 + 0.2, (f + 1) * b.floorH - 0.2, corridorZ);
  }

  // ---------------- 走廊顶部灯带（夜间发光） ----------------
  const roomCenters = [];
  for (let i = 0; i < roomCount; i++) {
    roomCenters.push({
      index: i,
      x: xL + (i + 0.5) * roomW,
      z: classZCenter,
      w: roomW,
      d: classD,
      partitionZ,
      facing: cs, // 学生朝向
    });
  }

  return {
    building: b,
    floors: b.floors,
    floorH: b.floorH,
    rooms: roomCenters,
    doors,
    corridorZ,
    totalH,
    corridorSide: cs,
  };
}
