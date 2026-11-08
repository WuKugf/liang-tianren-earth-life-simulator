// 立面生成：窗墙、开敞内廊（黄色栏杆）、女儿墙等
import * as THREE from 'three';

export const T = 0.3;       // 外墙厚
export const CD = 2.8;      // 内廊进深

// 四个立面描述：cx/cz 为立面中心点，len 为长度，ry 为法线朝向的旋转角
export function makeFrames(b) {
  return {
    south: { cx: b.x, cz: b.z + b.d / 2, len: b.w, ry: 0 },
    north: { cx: b.x, cz: b.z - b.d / 2, len: b.w, ry: Math.PI },
    east: { cx: b.x + b.w / 2, cz: b.z, len: b.d, ry: Math.PI / 2 },
    west: { cx: b.x - b.w / 2, cz: b.z, len: b.d, ry: -Math.PI / 2 },
  };
}

export function localToWorld(fr, lx, lz) {
  const c = Math.cos(fr.ry);
  const s = Math.sin(fr.ry);
  return { x: fr.cx + lx * c + lz * s, z: fr.cz - lx * s + lz * c };
}

export function facadeAlongX(fr) {
  return Math.abs(Math.sin(fr.ry)) < 0.5;
}

// 本地坐标盒体：lx 沿立面方向，yBottom 为底标高，lz 为法线方向（正值朝外）
export function addLocalBox(batch, fr, w, h, d, lx, yBottom, lz) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(lx, yBottom + h / 2, lz);
  g.rotateY(fr.ry);
  g.translate(fr.cx, 0, fr.cz);
  batch.add(g);
}

// 已带原点几何体：yCenter 为中心高度
export function addLocalGeo(batch, fr, geo, lx, yCenter, lz) {
  geo.translate(lx, yCenter, lz);
  geo.rotateY(fr.ry);
  geo.translate(fr.cx, 0, fr.cz);
  batch.add(geo);
}

export function addFacadeCollider(addCollider, fr, lx, length, thick, height, y = 0) {
  const p = localToWorld(fr, lx, 0);
  if (facadeAlongX(fr)) addCollider(p.x, p.z, length, thick, height, y);
  else addCollider(p.x, p.z, thick, length, height, y);
}

// ---------------------------------------------------------------------------
// 窗墙立面（教室侧 / 行政楼）
// ---------------------------------------------------------------------------
export function addWindowFacade(batches, fr, floors, floorH, opts = {}) {
  const { wall, glass, accent, plinth } = batches;
  const len = fr.len;
  const bayW = opts.bayW || 3.4;
  const bays = Math.max(2, Math.round(len / bayW));
  const w = len / bays;
  const sill = opts.sill === undefined ? 0.95 : opts.sill;
  const head = opts.head === undefined ? 2.55 : opts.head;
  const totalH = floors * floorH;
  const doorBays = opts.doorBays || [];

  for (let f = 0; f < floors; f++) {
    const y0 = f * floorH;
    for (let i = 0; i < bays; i++) {
      const lx = -len / 2 + (i + 0.5) * w;
      if (f === 0 && doorBays.includes(i)) {
        // 门洞：只保留门楣与上方玻璃
        addLocalBox(wall, fr, w, 0.12, T, lx, y0, -T / 2);
        addLocalBox(wall, fr, w, floorH - 2.75, T, lx, y0 + 2.75, -T / 2);
        addLocalGeo(glass, fr, new THREE.BoxGeometry(w - 0.5, 0.75, 0.1), lx, y0 + 1.95, -0.42);
        continue;
      }
      // 窗下墙 / 窗上墙
      addLocalBox(wall, fr, w, sill, T, lx, y0, -T / 2);
      addLocalBox(wall, fr, w, Math.max(0.3, floorH - head), T, lx, y0 + head, -T / 2);
      // 玻璃
      addLocalGeo(glass, fr, new THREE.BoxGeometry(w - 0.6, head - sill, 0.1), lx, y0 + (sill + head) / 2, -0.45);
    }
    // 楼层窗台线（浅色）
    if (f > 0) addLocalBox(plinth, fr, len, 0.16, 0.16, 0, y0 - 0.05, 0.04);
  }

  // 竖向壁柱
  for (let i = 0; i <= bays; i++) {
    const lx = -len / 2 + i * w;
    addLocalBox(wall, fr, 0.55, totalH, T + 0.14, lx, 0, -T / 2 + 0.0);
  }
  // 暖黄色竖向装饰条
  for (let i = 0; i <= bays; i += 2) {
    const lx = -len / 2 + i * w;
    addLocalBox(accent, fr, 0.4, totalH, 0.26, lx, 0, 0.09);
  }
  // 立面两端壁柱
  addLocalBox(wall, fr, 0.9, totalH, T + 0.3, -len / 2 + 0.1, 0, -T / 2);
  addLocalBox(wall, fr, 0.9, totalH, T + 0.3, len / 2 - 0.1, 0, -T / 2);
}

// ---------------------------------------------------------------------------
// 开敞内廊立面：柱子 + 黄色栏杆，首层中央留出入口
// ---------------------------------------------------------------------------
export function addCorridorFacade(batches, fr, floors, floorH, addCollider, opts = {}) {
  const { wall, rail, accent } = batches;
  const len = fr.len;
  const bayW = opts.bayW || 3.6;
  const bays = Math.max(2, Math.round(len / bayW));
  const w = len / bays;
  const totalH = floors * floorH;
  const entryW = opts.entryWidth === undefined ? 9 : opts.entryWidth;

  for (let i = 0; i <= bays; i++) {
    const lx = -len / 2 + i * w;
    addLocalBox(wall, fr, 0.55, totalH, 0.65, lx, 0, -0.32);
    addFacadeCollider(addCollider, fr, lx, 0.6, 0.6, totalH);
  }

  for (let f = 0; f < floors; f++) {
    const y0 = f * floorH;
    if (f === 0) {
      const segLen = (len - entryW) / 2;
      if (segLen > 0.8) {
        [-1, 1].forEach((sign) => {
          const lx = sign * (entryW / 2 + segLen / 2);
          addLocalBox(rail, fr, segLen, 0.95, 0.12, lx, y0 + 0.12, -0.2);
          addLocalBox(rail, fr, segLen, 0.09, 0.24, lx, y0 + 1.07, -0.2);
          addFacadeCollider(addCollider, fr, lx, segLen, 0.25, 1.2);
        });
      }
    } else {
      addLocalBox(rail, fr, len - 1.2, 1.0, 0.12, 0, y0 + 0.32, -0.2);
      addLocalBox(rail, fr, len - 1.2, 0.09, 0.26, 0, y0 + 1.32, -0.2);
    }
    // 楼板挑檐
    addLocalBox(wall, fr, len, 0.3, 0.55, 0, y0 - 0.3, 0.02);
  }

  // 入口门廊：两根小柱 + 门楣 + 台阶
  addLocalBox(accent, fr, entryW + 1.0, 0.45, 0.55, 0, totalH - 1.4, 0.0);
  addLocalBox(wall, fr, entryW + 2.0, 0.35, 2.2, 0, 3.05, -0.6);
  addLocalGeo(accent, fr, new THREE.BoxGeometry(entryW + 2.2, 0.5, 2.4), 0, 3.35, -0.6);
  // 台阶（两级）
  addLocalBox(batches.plinth, fr, entryW + 2.0, 0.14, 1.8, 0, -0.12, 0.9);
  addLocalBox(batches.plinth, fr, entryW + 3.0, 0.14, 1.2, 0, -0.26, 1.7);
}

// ---------------------------------------------------------------------------
// 实心端墙（山墙）+ 少量小窗
// ---------------------------------------------------------------------------
export function addEndWall(batches, fr, floors, floorH, addCollider, opts = {}) {
  const { wall, glass, accent } = batches;
  const len = fr.len;
  const totalH = floors * floorH;
  addLocalBox(wall, fr, len, totalH, T, 0, 0, -T / 2);
  // 山墙小窗
  for (let f = 0; f < floors; f++) {
    const y0 = f * floorH;
    addLocalGeo(glass, fr, new THREE.BoxGeometry(1.5, 1.3, 0.1), -len / 2 + 2.2, y0 + 2.1, 0.02);
    addLocalGeo(glass, fr, new THREE.BoxGeometry(1.5, 1.3, 0.1), len / 2 - 2.2, y0 + 2.1, 0.02);
  }
  // 竖向黄色装饰条
  addLocalBox(accent, fr, 0.45, totalH, 0.24, 0, 0, 0.06);
  addLocalBox(accent, fr, 0.35, totalH, 0.2, -len / 2 + 3.6, 0, 0.06);
  addLocalBox(accent, fr, 0.35, totalH, 0.2, len / 2 - 3.6, 0, 0.06);
  addFacadeCollider(addCollider, fr, 0, len, T + 0.1, totalH);
}

// ---------------------------------------------------------------------------
// 女儿墙
// ---------------------------------------------------------------------------
export function addParapet(batch, b, totalH, h = 0.9) {
  const t = 0.36;
  // 四条边
  batch.box(b.w, h, t, b.x, totalH, b.z - b.d / 2 + t / 2);
  batch.box(b.w, h, t, b.x, totalH, b.z + b.d / 2 - t / 2);
  batch.box(t, h, b.d - t * 2, b.x - b.w / 2 + t / 2, totalH, b.z);
  batch.box(t, h, b.d - t * 2, b.x + b.w / 2 - t / 2, totalH, b.z);
}

// 屋面设备（空调外机 / 楼梯间）
export function addRoofEquipment(batch, b, totalH, seed = 0) {
  const items = [
    { dx: -b.w * 0.28, dz: -b.d * 0.22, w: 3.2, h: 1.2, d: 2.2 },
    { dx: b.w * 0.05, dz: b.d * 0.1, w: 2.4, h: 1.0, d: 2.0 },
    { dx: b.w * 0.3, dz: -b.d * 0.1, w: 2.8, h: 0.9, d: 1.8 },
  ];
  items.forEach((it, i) => {
    if ((i + seed) % 3 === 2) return;
    batch.box(it.w, it.h, it.d, b.x + it.dx, totalH + 0.05, b.z + it.dz);
  });
  // 屋顶楼梯间
  batch.box(4.2, 2.8, 3.4, b.x + b.w * 0.3, totalH + 0.05, b.z + b.d * 0.28);
}
