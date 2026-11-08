// 玉东新区金榜小学 · 场景模块入口
// 契约：export meta / createScene(ctx)
import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { makeColliderRegistrar, disposeObject } from './utils.js';
import { createGround } from './ground.js';
import { createBuildings } from './buildings.js';
import { createCorridors } from './corridors.js';
import { createSports } from './sports.js';
import { createIndoor } from './indoor.js';
import { SITE, INTERACTABLES } from '../../data/schoolLayout.js';

export const meta = {
  id: 'school',
  title: '玉东新区金榜小学',
  spawn: { x: SITE.spawn.x, z: SITE.spawn.z, yaw: SITE.spawn.yaw },
  bounds: SITE.bounds,
};

export function createScene(ctx) {
  const T = ctx.THREE || THREE;
  const group = new T.Group();
  group.name = 'school';

  const mats = createMaterials();
  const addCollider = makeColliderRegistrar(ctx.registerCollider);

  // ---------------- 场地 ----------------
  const ground = createGround(mats, addCollider);
  group.add(ground.group);

  // ---------------- 建筑 ----------------
  const buildingGroup = new T.Group();
  buildingGroup.name = 'school-buildings';
  const entries = createBuildings(mats, addCollider, buildingGroup);
  group.add(buildingGroup);

  // ---------------- 风雨连廊 ----------------
  group.add(createCorridors(mats, addCollider).group);

  // ---------------- 运动场地 ----------------
  group.add(createSports(mats, addCollider).group);

  // ---------------- 室内 ----------------
  group.add(createIndoor(mats, entries, addCollider).group);

  // ---------------- 广场中央：旗杆 + 绿化 + 坐凳 ----------------
  group.add(createPlazaDetail(mats, addCollider));

  // 交互点位：由返回值交给核心世界统一分发（避免与 registerInteractable 重复注册）
  const interactables = INTERACTABLES.map((it) => ({
    id: it.id,
    label: it.label,
    position: { x: it.x, y: it.y, z: it.z },
    radius: it.radius,
    action: it.action,
    meta: it.meta || {},
  }));

  // ---------------- 夜间照明 ----------------
  let lastPhase = '';
  let glow = 0;
  let glowTarget = 0.02;

  function readState() {
    try {
      if (ctx.time && typeof ctx.time.getState === 'function') return ctx.time.getState();
    } catch (e) {
      /* 忽略时间系统异常，保持白天外观 */
    }
    return null;
  }

  // 兼容核心时间系统：phase 可能是英文 id，也可能是中文标签
  const PHASE_ALIAS = {
    夜晚: 'night', 深夜: 'night', 清晨: 'dawn', 黎明: 'dawn',
    上午: 'morning', 早上: 'morning', 中午: 'noon', 正午: 'noon',
    下午: 'afternoon', 傍晚: 'dusk', 黄昏: 'dusk',
  };

  function normalizePhase(state) {
    if (!state) return 'morning';
    if (state.isNight === true) return 'night';
    const raw = String(state.phase || '').trim();
    if (PHASE_ALIAS[raw]) return PHASE_ALIAS[raw];
    if (raw) return raw;
    return 'morning';
  }

  // 返回目标发光强度比例
  function applyPhase(phase) {
    const isNight = phase === 'night';
    ground.setNight(isNight);
    if (isNight) return 1;
    if (phase === 'dusk') return 0.55;
    if (phase === 'dawn') return 0.22;
    return 0.02;
  }

  function update(dt) {
    const phase = normalizePhase(readState());
    if (phase !== lastPhase) {
      lastPhase = phase;
      glowTarget = applyPhase(phase);
    }
    glow += (glowTarget - glow) * Math.min(1, dt * 1.8);
    mats.glass.emissiveIntensity = glow * 1.15;
    mats.glassCurtain.emissiveIntensity = glow * 1.0;
    mats.lampPanel.emissiveIntensity = glow * 1.6;
  }

  // 首帧同步
  lastPhase = normalizePhase(readState());
  glowTarget = applyPhase(lastPhase);
  glow = 0;

  function dispose() {
    disposeObject(group);
    if (group.parent) group.parent.remove(group);
    group.clear();
  }

  return { group, update, interactables, dispose };
}

// ---------------------------------------------------------------------------
// 广场细节：旗杆、花坛、坐凳
// ---------------------------------------------------------------------------
function createPlazaDetail(mats) {
  const g = new THREE.Group();
  g.name = 'school-plaza-detail';
  const px = -16;
  const pz = 78;

  // 圆形花坛
  const plotMat = new THREE.MeshLambertMaterial({ color: 0xb9b0a0 });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.55, 20), plotMat);
  ring.position.set(px, 0.28, pz);
  ring.receiveShadow = true;
  g.add(ring);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.5, 20), new THREE.MeshLambertMaterial({ color: 0x4f8f47 }));
  soil.position.set(px, 0.58, pz);
  g.add(soil);

  // 旗杆
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 15, 10), mats.metal);
  pole.position.set(px, 8, pz);
  pole.castShadow = true;
  g.add(pole);

  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), mats.flagRed);
  flag.position.set(px + 1.32, 14.0, pz);
  g.add(flag);

  // 坐凳
  const benchMat = mats.podium;
  [[8, 88], [-8, 68], [14, 68]].forEach(([bx, bz]) => {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.5), benchMat);
    bench.position.set(bx, 0.45, bz);
    bench.castShadow = true;
    g.add(bench);
    [-1, 1].forEach((s) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.42), mats.metalDark);
      leg.position.set(bx + s * 1.0, 0.22, bz);
      g.add(leg);
    });
  });

  return g;
}
