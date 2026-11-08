// 通用几何 / 材质 / 工具函数
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------
// 几何收集器：把大量小盒子合并成一个网格，显著降低 draw call
// ---------------------------------------------------------------------------
export class Batch {
  constructor() {
    this.geoms = [];
  }

  // 轴对齐（可选绕 Y 旋转）长方体
  box(w, h, d, x, y, z, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y + h / 2, z);
    this.geoms.push(g);
    return this;
  }

  // 已定位好的几何体
  add(geometry) {
    this.geoms.push(geometry);
    return this;
  }

  // 水平圆面 / 圆环等
  cylinder(rTop, rBottom, h, seg, x, y, z) {
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg);
    g.translate(x, y + h / 2, z);
    this.geoms.push(g);
    return this;
  }

  isEmpty() {
    return this.geoms.length === 0;
  }

  // 合并后构建网格
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

// 由四个空间点构成的斜面四边形（用于坡屋顶），自动朝外
export function quadGeometry(p0, p1, p2, p3, center) {
  const P = [p0, p1, p2, p3];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const n = cross(sub(P[1], P[0]), sub(P[2], P[0]));
  const c = [
    (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4,
    (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4,
    (P[0][2] + P[1][2] + P[2][2] + P[3][2]) / 4,
  ];
  const out = sub(c, center);
  const flip = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0;

  const idx = flip ? [0, 3, 2, 1] : [0, 1, 2, 3];
  const pos = new Float32Array(12);
  const uv = new Float32Array(8);
  const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
  idx.forEach((vi, i) => {
    pos[i * 3] = P[vi][0];
    pos[i * 3 + 1] = P[vi][1];
    pos[i * 3 + 2] = P[vi][2];
    uv[i * 2] = uvs[vi][0] * 4;
    uv[i * 2 + 1] = uvs[vi][1] * 4;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  // 使用索引，保证与 BoxGeometry 等索引几何体可合并
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

// 三点三角形（用于山墙 / 屋面收边），法线手动写入避免退化面
export function triGeometry(p0, p1, p2, center) {
  const g = quadGeometry(p0, p1, p2, p2, center);
  const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
  const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
  let nx = ay * bz - az * by;
  let ny = az * bx - ax * bz;
  let nz = ax * by - ay * bx;
  const cxq = (p0[0] + p1[0] + p2[0]) / 3 - center[0];
  const cyq = (p0[1] + p1[1] + p2[1]) / 3 - center[1];
  const czq = (p0[2] + p1[2] + p2[2]) / 3 - center[2];
  if (nx * cxq + ny * cyq + nz * czq < 0) {
    nx = -nx; ny = -ny; nz = -nz;
  }
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len; ny /= len; nz /= len;
  const normals = new Float32Array(12);
  for (let i = 0; i < 4; i++) {
    normals[i * 3] = nx;
    normals[i * 3 + 1] = ny;
    normals[i * 3 + 2] = nz;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return g;
}

// ---------------------------------------------------------------------------
// InstancedMesh 便捷构造
// ---------------------------------------------------------------------------
export function buildInstanced(geometry, material, transforms, { castShadow = false, receiveShadow = false } = {}) {
  if (!transforms.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  transforms.forEach((t, i) => {
    p.set(t.x || 0, t.y || 0, t.z || 0);
    e.set(t.rx || 0, t.ry || 0, t.rz || 0);
    q.setFromEuler(e);
    const sc = t.s === undefined ? 1 : t.s;
    s.set(t.sx === undefined ? sc : t.sx, t.sy === undefined ? sc : t.sy, t.sz === undefined ? sc : t.sz);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------
// 程序化贴图（不依赖任何外部图片资源）
// ---------------------------------------------------------------------------
export function canvasTexture(w, h, draw, { repeat = 1, aniso = 4 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  if (Array.isArray(repeat)) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}

// 塑胶跑道贴图：红色底 + 白色分道线
export function trackTexture() {
  return canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#b8483a';
    c.fillRect(0, 0, w, h);
    // 颗粒感
    for (let i = 0; i < 5000; i++) {
      const v = Math.random();
      c.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(60,20,15,0.10)';
      c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 2;
    for (let i = 0; i <= 6; i++) {
      const y = (h / 6) * i;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
  }, { repeat: [1, 1] });
}

// 足球场草坪贴图：条纹草地 + 白色场地线
export function pitchTexture() {
  return canvasTexture(1024, 512, (c, w, h) => {
    const stripes = 10;
    for (let i = 0; i < stripes; i++) {
      c.fillStyle = i % 2 === 0 ? '#3f8f45' : '#489c4d';
      c.fillRect((w / stripes) * i, 0, w / stripes + 1, h);
    }
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 4;
    const m = 26;
    c.strokeRect(m, m, w - m * 2, h - m * 2);
    c.beginPath();
    c.moveTo(w / 2, m);
    c.lineTo(w / 2, h - m);
    c.stroke();
    c.beginPath();
    c.arc(w / 2, h / 2, 58, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
    c.fillStyle = '#fff';
    c.fill();
    // 禁区
    c.strokeRect(m, h / 2 - 110, 110, 220);
    c.strokeRect(w - m - 110, h / 2 - 110, 110, 220);
    c.strokeRect(m, h / 2 - 58, 46, 116);
    c.strokeRect(w - m - 46, h / 2 - 58, 46, 116);
  });
}

// 篮球场硅 PU 贴图（蓝绿）
export function basketballTexture() {
  return canvasTexture(1024, 550, (c, w, h) => {
    c.fillStyle = '#2f7f86';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#2b8f7d';
    c.fillRect(0, 0, w, h * 0.5);
    // 场地
    c.strokeStyle = 'rgba(255,255,255,0.92)';
    c.lineWidth = 5;
    const m = 26;
    c.strokeRect(m, m, w - m * 2, h - m * 2);
    c.beginPath();
    c.moveTo(w / 2, m);
    c.lineTo(w / 2, h - m);
    c.stroke();
    c.beginPath();
    c.arc(w / 2, h / 2, 62, 0, Math.PI * 2);
    c.stroke();
    // 三分线（简化）
    c.beginPath();
    c.arc(m + 150, h / 2, 118, -Math.PI / 2, Math.PI / 2);
    c.stroke();
    c.beginPath();
    c.arc(w - m - 150, h / 2, 118, Math.PI / 2, -Math.PI / 2);
    c.stroke();
    // 禁区
    c.strokeRect(m, h / 2 - 85, 150, 170);
    c.strokeRect(w - m - 150, h / 2 - 85, 150, 170);
    // 底色斑驳
    for (let i = 0; i < 3000; i++) {
      c.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
      c.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  });
}

// 广场铺装贴图
export function plazaTexture() {
  return canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#d9d2c4';
    c.fillRect(0, 0, w, h);
    const cell = 64;
    for (let y = 0; y < h / cell; y++) {
      for (let x = 0; x < w / cell; x++) {
        const t = (x + y) % 2;
        c.fillStyle = t ? '#d3cbb9' : '#ded7c9';
        c.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
      }
    }
    c.strokeStyle = 'rgba(150,140,125,0.35)';
    c.lineWidth = 2;
    for (let i = 0; i <= w / cell; i++) {
      c.beginPath();
      c.moveTo(i * cell, 0);
      c.lineTo(i * cell, h);
      c.moveTo(0, i * cell);
      c.lineTo(w, i * cell);
      c.stroke();
    }
  }, { repeat: [8, 8] });
}

// 草地贴图
export function grassTexture() {
  return canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#6fa356';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      const g = Math.random();
      c.fillStyle = g > 0.66 ? 'rgba(120,170,90,0.55)' : g > 0.33 ? 'rgba(88,140,70,0.45)' : 'rgba(60,110,55,0.35)';
      const x = Math.random() * w;
      const y = Math.random() * h;
      c.fillRect(x, y, 2, 3);
    }
  }, { repeat: [26, 26] });
}

// 沥青 / 水泥路面
export function asphaltTexture() {
  return canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#9c9a94';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) {
      c.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, { repeat: [10, 10] });
}

// ---------------------------------------------------------------------------
// 碰撞体注册（兼容不同核心实现：同时给出常见字段别名）
// ---------------------------------------------------------------------------
export function makeColliderRegistrar(registerCollider) {
  return function addCollider(cx, cz, w, d, h = 4, y = 0) {
    if (typeof registerCollider !== 'function') return;
    const halfW = w / 2;
    const halfD = d / 2;
    registerCollider({
      type: 'box',
      x: cx, z: cz, y,
      w, d, h,
      width: w, depth: d, height: h,
      minX: cx - halfW, maxX: cx + halfW,
      minZ: cz - halfD, maxZ: cz + halfD,
      minY: y, maxY: y + h,
      center: { x: cx, y: y + h / 2, z: cz },
      size: { x: w, y: h, z: d },
    });
  };
}

// 在一条轴对齐线段上按间距布置立柱
export function linePoints(x1, z1, x2, z2, step) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(len / step));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    pts.push({ x: x1 + (dx * i) / n, z: z1 + (dz * i) / n });
  }
  return pts;
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
