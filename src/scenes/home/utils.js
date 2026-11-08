// 家场景通用工具：几何合并、程序化贴图、碰撞注册
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// 几何批处理：把大量小盒体合并为一个网格，控制 draw call
export class Batch {
  constructor() {
    this.geoms = [];
  }

  // y 为盒体底面高度
  box(w, h, d, x, y, z, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y + h / 2, z);
    this.geoms.push(g);
    return this;
  }

  // y 为盒体中心高度
  boxCenter(w, h, d, x, y, z, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    this.geoms.push(g);
    return this;
  }

  // 圆柱，y 为底面高度
  cylinder(rTop, rBottom, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) {
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg);
    if (rx) g.rotateX(rx);
    if (ry) g.rotateY(ry);
    if (rz) g.rotateZ(rz);
    g.translate(x, y + h / 2, z);
    this.geoms.push(g);
    return this;
  }

  // 球体（低多边形），用于树冠 / 花球
  sphere(r, x, y, z, wSeg = 8, hSeg = 6) {
    const g = new THREE.SphereGeometry(r, wSeg, hSeg);
    g.translate(x, y, z);
    this.geoms.push(g);
    return this;
  }

  add(geometry) {
    this.geoms.push(geometry);
    return this;
  }

  isEmpty() {
    return this.geoms.length === 0;
  }

  build(material, { castShadow = false, receiveShadow = true } = {}) {
    if (this.isEmpty()) return null;
    const merged = mergeGeometries(this.geoms, false);
    this.geoms.forEach((g) => g.dispose());
    this.geoms.length = 0;
    if (!merged) return null;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    return mesh;
  }
}

// 程序化 Canvas 贴图（不加载任何外部图片）
export function canvasTexture(w, h, draw, { repeat = 1, aniso = 4 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  draw(c, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  if (Array.isArray(repeat)) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}

// 文字标牌贴图（门牌 / 小区大门）
export function signTexture(text, sub, {
  bg = '#fffdf5', accent = '#3f8f68', color = '#26352f', width = 512, height = 256,
} = {}) {
  return canvasTexture(width, height, (c, w, h) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = accent;
    c.fillRect(0, 0, w, 12);
    c.fillRect(0, h - 12, w, 12);
    c.fillStyle = color;
    c.textAlign = 'center';
    c.font = `bold ${Math.round(h * 0.26)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    c.fillText(text, w / 2, h * 0.48);
    if (sub) {
      c.fillStyle = 'rgba(38,53,47,0.62)';
      c.font = `${Math.round(h * 0.12)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      c.fillText(sub, w / 2, h * 0.72);
    }
  }, { repeat: [1, 1] });
}

// 碰撞体注册：兼容核心世界的 AABB 结构（其按 XZ 判定）
// floor：1 / 2 表示该碰撞体只属于某一层（家具等），核心控制器只按 XZ 判定，
// 由场景每帧根据玩家所在层动态开关，避免一层家具挡住另一层的行走。
export function makeColliderRegistrar(registerCollider) {
  const items = [];
  function addCollider(cx, cz, w, d, h = 4, y = 0, floor = 0) {
    const halfW = w / 2;
    const halfD = d / 2;
    const baseMinX = cx - halfW;
    const baseMaxX = cx + halfW;
    const collider = {
      type: 'box',
      x: cx,
      y,
      z: cz,
      w,
      d,
      h,
      width: w,
      depth: d,
      height: h,
      floor,
      minX: baseMinX,
      maxX: baseMaxX,
      minZ: cz - halfD,
      maxZ: cz + halfD,
      minY: y,
      maxY: y + h,
      baseMinX,
      baseMaxX,
      center: { x: cx, y: y + h / 2, z: cz },
      size: { x: w, y: h, z: d },
    };
    items.push(collider);
    if (typeof registerCollider === 'function') registerCollider(collider);
    return collider;
  }
  addCollider.items = items;
  return addCollider;
}

// 按楼层启停带 floor 标记的碰撞体（核心控制器持有的是同一批对象引用）
export function setFloorColliders(colliders, floor) {
  colliders.forEach((c) => {
    if (!c.floor) return;
    const active = c.floor === floor;
    c.minX = active ? c.baseMinX : 100000;
    c.maxX = active ? c.baseMaxX : 100000.5;
  });
}

/**
 * 带门窗洞口的墙体生成器。
 * axis 'x'：墙体沿 X 方向延伸（fixed 为 Z）；axis 'z'：沿 Z 延伸（fixed 为 X）。
 * holes: [{ a0, a1, y0, y1 }]，a 为沿墙方向区间，y 为高度区间。
 * 只有贴近地面的洞口才会被登记为碰撞缺口（门窗洞仍阻挡人物）。
 */
export function buildWall(batch, addCollider, {
  axis,
  fixed,
  from,
  to,
  thickness = 0.3,
  height = 6.4,
  baseY = 0,
  holes = [],
  collider = true,
}) {
  const a0 = Math.min(from, to);
  const a1 = Math.max(from, to);
  const breaks = [a0, a1];
  holes.forEach((h) => {
    if (h.a0 > a0 && h.a0 < a1) breaks.push(h.a0);
    if (h.a1 > a0 && h.a1 < a1) breaks.push(h.a1);
  });
  const sorted = Array.from(new Set(breaks.map((v) => Math.round(v * 1000) / 1000))).sort((x, y) => x - y);

  const top = baseY + height;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const s = sorted[i];
    const e = sorted[i + 1];
    const len = e - s;
    if (len <= 0.001) continue;
    const mid = (s + e) / 2;
    const active = holes.filter((h) => h.a0 <= s + 0.0005 && h.a1 >= e - 0.0005);
    // 计算本列的实体高度区间
    const solid = [[baseY, top]];
    active.forEach((h) => {
      const ys = Math.max(baseY, h.y0);
      const ye = Math.min(top, h.y1);
      if (ye <= ys) return;
      for (let k = solid.length - 1; k >= 0; k -= 1) {
        const seg = solid[k];
        if (ys >= seg[1] || ye <= seg[0]) continue;
        const parts = [];
        if (ys > seg[0]) parts.push([seg[0], ys]);
        if (ye < seg[1]) parts.push([ye, seg[1]]);
        solid.splice(k, 1, ...parts);
      }
    });
    solid.forEach(([ys, ye]) => {
      const h = ye - ys;
      if (h <= 0.02) return;
      if (axis === 'x') batch.box(len, h, thickness, mid, ys, fixed);
      else batch.box(thickness, h, len, fixed, ys, mid);
    });
  }

  if (collider && addCollider) {
    // 只把“从地面通到人可穿行高度”的洞口视为缺口
    const doorHoles = holes
      .filter((h) => h.y0 <= baseY + 0.15 && h.y1 >= baseY + 1.4)
      .map((h) => [Math.max(a0, h.a0), Math.min(a1, h.a1)])
      .filter(([s, e]) => e - s > 0.05)
      .sort((x, y) => x[0] - y[0]);
    const segs = [];
    let cursor = a0;
    doorHoles.forEach(([s, e]) => {
      if (s > cursor) segs.push([cursor, s]);
      cursor = Math.max(cursor, e);
    });
    if (cursor < a1) segs.push([cursor, a1]);
    segs.forEach(([s, e]) => {
      const len = e - s;
      if (len <= 0.05) return;
      const mid = (s + e) / 2;
      if (axis === 'x') addCollider(mid, fixed, len, thickness, height, baseY);
      else addCollider(fixed, mid, thickness, len, height, baseY);
    });
  }
}

// 生成窗框 + 玻璃（贴在墙体洞口上）
export function addWindow(batchFrame, batchGlass, {
  axis,
  fixed,
  a0,
  a1,
  y0,
  y1,
  frameSize = 0.07,
  offset = 0,
}) {
  const w = a1 - a0;
  const h = y1 - y0;
  const midA = (a0 + a1) / 2;
  const midY = (y0 + y1) / 2;
  const t = 0.06;
  if (axis === 'x') {
    const z = fixed + offset;
    batchGlass.add(planeAxisX(w - frameSize * 2, h - frameSize * 2, midA, midY, z));
    batchFrame.box(w, frameSize, t, midA, y0 - frameSize / 2, z);
    batchFrame.box(w, frameSize, t, midA, y1 + frameSize / 2, z);
    batchFrame.box(frameSize, h + frameSize * 2, t, a0 - frameSize / 2, y0, z);
    batchFrame.box(frameSize, h + frameSize * 2, t, a1 + frameSize / 2, y0, z);
    batchFrame.box(frameSize, h, t, midA, y0, z);
  } else {
    const x = fixed + offset;
    batchGlass.add(planeAxisZ(w - frameSize * 2, h - frameSize * 2, x, midY, midA));
    batchFrame.box(t, frameSize, w, x, y0 - frameSize / 2, midA);
    batchFrame.box(t, frameSize, w, x, y1 + frameSize / 2, midA);
    batchFrame.box(t, h + frameSize * 2, frameSize, x, y0, a0 - frameSize / 2);
    batchFrame.box(t, h + frameSize * 2, frameSize, x, y0, a1 + frameSize / 2);
    batchFrame.box(t, h, frameSize, x, y0, midA);
  }
}

function planeAxisX(w, h, x, y, z) {
  const g = new THREE.PlaneGeometry(w, h);
  g.translate(x, y, z);
  return g;
}

function planeAxisZ(w, h, x, y, z) {
  const g = new THREE.PlaneGeometry(w, h);
  g.rotateY(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

// 圆形/环形铺装
export function ringGeometry(inner, outer, seg = 48) {
  return new THREE.RingGeometry(inner, outer, seg);
}

export function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
    if (o.isInstancedMesh && o.dispose) o.dispose();
  });
}

// 常用数学
export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function seededRandom(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
