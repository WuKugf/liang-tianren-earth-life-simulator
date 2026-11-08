// 梁添任的家 —— 奥园广场 · 中央墅 场景主模块
// 模块契约：export const meta；export function createScene(ctx) -> { group, update, interactables, dispose }
import * as THREE from 'three';
import { HOME_LAYOUT as L } from '../../data/homeLayout.js';
import { createMaterials } from './materials.js';
import { makeColliderRegistrar, setFloorColliders, clamp } from './utils.js';
import { createNeighborhood } from './neighborhood.js';
import { createVilla } from './villa.js';
import { createInterior } from './interior.js';

export const meta = {
  id: 'home',
  title: '奥园中央墅 · 家',
  spawn: { x: 0, z: 0.5, yaw: Math.PI },
  bounds: { minX: -110, maxX: 110, minZ: -110, maxZ: 110 },
};

const PHASE_ALIAS = {
  dawn: 'dawn', 黎明: 'dawn', 清晨: 'dawn', 拂晓: 'dawn',
  morning: 'morning', 早晨: 'morning', 上午: 'morning',
  noon: 'noon', 中午: 'noon', 正午: 'noon',
  afternoon: 'afternoon', 下午: 'afternoon',
  dusk: 'dusk', 黄昏: 'dusk', 傍晚: 'dusk', 日落: 'dusk',
  night: 'night', 夜晚: 'night', 夜间: 'night', 深夜: 'night', 凌晨: 'night',
};

function normalizePhase(state) {
  if (state && PHASE_ALIAS[state.phase]) return PHASE_ALIAS[state.phase];
  const hour = state && typeof state.hour === 'number' ? state.hour : 12;
  if (hour < 5) return 'night';
  if (hour < 7) return 'dawn';
  if (hour < 10) return 'morning';
  if (hour < 13) return 'noon';
  if (hour < 17) return 'afternoon';
  if (hour < 19.5) return 'dusk';
  return 'night';
}

const TARGETS = {
  dawn: { interior: 0.62, street: 0.22, window: 0.28, bulbWarm: 0.85 },
  morning: { interior: 0.36, street: 0.0, window: 0.12, bulbWarm: 0.45 },
  noon: { interior: 0.0, street: 0.0, window: 0.02, bulbWarm: 0.0 },
  afternoon: { interior: 0.0, street: 0.0, window: 0.02, bulbWarm: 0.0 },
  dusk: { interior: 0.6, street: 0.55, window: 0.55, bulbWarm: 0.9 },
  night: { interior: 1.0, street: 1.0, window: 1.0, bulbWarm: 1.35 },
};

export function createScene(ctx = {}) {
  const THREE_REF = ctx.THREE || THREE;
  const root = new THREE_REF.Group();
  root.name = 'scene-home';

  const mats = createMaterials(THREE_REF);
  const registerCollider = typeof ctx.registerCollider === 'function' ? ctx.registerCollider : () => {};
  const addCollider = makeColliderRegistrar(registerCollider);

  const neighborhood = createNeighborhood(mats, addCollider, THREE_REF);
  const villa = createVilla(mats, addCollider, THREE_REF);
  const interior = createInterior(mats, addCollider, THREE_REF);

  root.add(neighborhood.group, villa.group, interior.group);
  if (ctx.scene && typeof ctx.scene.add === 'function') ctx.scene.add(root);

  // ---------------- 交互点 ----------------
  const interactables = L.interactables.map((item) => ({
    id: item.id,
    label: item.label,
    action: item.action,
    position: { ...item.position },
    radius: item.radius,
    meta: { ...item.meta, scene: 'home' },
  }));
  // 与校园场景保持一致：只通过返回值交给加载器，避免重复注册

  // ---------------- 楼层系统 ----------------
  // 核心角色控制器只处理 XZ 碰撞与跳跃，本模块在每帧根据位置接管“层高”，
  // 让内部楼梯与二楼室内可行走；院子/一楼地面保持 0，不会影响正常跳跃。
  // 场景管理器传入的 player 是角色 Group；核心 main.js 通过 window.__game 暴露 controller，
  // 这里优先使用带 state 的控制器（预览页传入的柱对象同样带 state）。
  function resolvePlayer(player) {
    if (player && player.state && player.group) return player;
    const game = typeof window !== 'undefined' ? window.__game : null;
    const controller = game && game.controller;
    if (controller && controller.state && (!player || controller.group === player)) return controller;
    return null;
  }

  const S = L.stairs;
  const H = L.house;
  const FLOOR2 = H.floor2;
  let prevInStair = false;
  const floorState = { floor: 0 };

  // 上楼时覆盖主角四肢姿势：核心在 grounded=false 时会一直用跳跃姿势
  let poseParts = null;
  let poseWalkPhase = 0;
  let poseIdleTime = 0;
  function fixUpperPose(player, st, dt, active) {
    if (!active) return;
    const root = player.group;
    if (!poseParts) {
      // 角色层级：root -> hips(y=0.76) / legL,legR(y=0.70)；hips -> torso -> head(y=0.62), armL,armR(y=0.48)
      const isTorso = (c) => c.isGroup && Math.abs(c.position.y) < 0.1 && c.children.length > 3;
      const hips = root.children.find((c) => c.isGroup && c.children.some(isTorso));
      const torso = hips && hips.children.find(isTorso);
      const legs = root.children.filter((c) => c.isGroup && !c.children.some(isTorso) && Math.abs(c.position.y - 0.7) < 0.03);
      const arms = torso ? torso.children.filter((c) => c.isGroup && Math.abs(c.position.y - 0.48) < 0.06) : [];
      if (!hips || !torso || legs.length < 2 || arms.length < 2) return;
      legs.sort((a, b) => b.position.x - a.position.x);
      arms.sort((a, b) => b.position.x - a.position.x);
      const head = torso.children.find((c) => c.isGroup && Math.abs(c.position.y - 0.62) < 0.05);
      poseParts = { hips, torso, head, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1] };
    }
    const p = poseParts;
    const moving = !!st.moving;
    const running = !!st.running;
    const speed = st.speed || 0;
    poseIdleTime += dt;
    if (moving) poseWalkPhase += dt * (running ? 13.5 : 8.5) * Math.min(1.35, 0.65 + speed / 7);
    else poseWalkPhase += dt * 1.2;
    const swing = moving ? Math.sin(poseWalkPhase) * (running ? 0.92 : 0.55) : 0;
    p.legL.rotation.x = swing;
    p.legR.rotation.x = -swing;
    p.armL.rotation.x = -swing * 0.85;
    p.armR.rotation.x = swing * 0.85;
    p.armL.rotation.z = 0.075 + (moving ? 0 : 0.02);
    p.armR.rotation.z = -0.075 - (moving ? 0 : 0.02);
    p.hips.position.y = 0.76 + (moving
      ? Math.abs(Math.sin(poseWalkPhase * 2)) * (running ? 0.035 : 0.022)
      : Math.sin(poseIdleTime * 1.7) * 0.006);
    p.torso.rotation.z = moving ? Math.sin(poseWalkPhase) * 0.025 : 0;
    p.torso.rotation.y = moving ? Math.sin(poseWalkPhase) * 0.03 : 0;
    if (p.head) {
      p.head.rotation.x = 0;
      p.head.rotation.y = moving ? Math.sin(poseWalkPhase * 0.5) * 0.05 : Math.sin(poseIdleTime * 0.6) * 0.06;
    }
  }

  function applyFloor(playerRef, dt = 0) {
    const player = resolvePlayer(playerRef);
    if (!player || !player.group || !player.state) return;
    const g = player.group;
    const st = player.state;
    if (g.position.y > 100 || g.position.y < -100) return; // 异常位置不接管

    const x = g.position.x;
    const z = g.position.z;
    const curY = typeof st.baseY === 'number' ? st.baseY : 0;
    const inStairZone = x >= S.minX - 0.05 && x <= S.maxX + 0.05 && z >= S.minZ - 0.05 && z <= S.maxZ + 0.05;
    const inStat = x >= S.minX - 0.05 && x <= S.maxX + 0.05 && z > S.minZ + 1.2 && z < S.maxZ - 1.2;
    const inHouse = x > H.minX + 0.15 && x < H.maxX - 0.15 && z > H.minZ + 0.15 && z < H.maxZ - 0.15;

    let target = 0;
    let floor = 0;
    let pushed = false;

    if (inStairZone) {
      // 0 = 楼梯底（北端 -22），1 = 楼梯顶（南端 -15.5）
      const t = clamp((z - S.minZ) / (S.maxZ - S.minZ), 0, 1);
      target = FLOOR2 * t;
      floor = target > 1.6 ? 2 : 1;
      // 二楼玩家不能从楼梯井北端跌入
      if (!prevInStair && curY > 2.0 && z < S.minZ + 1.0) {
        g.position.z = S.minZ - 1.0;
        target = FLOOR2;
        floor = 2;
        pushed = true;
      } else if (!prevInStair && curY < 1.0 && z > S.maxZ - 1.25) {
        // 一楼玩家不能从楼梯顶端穿入楼梯结构
        g.position.z = S.maxZ + 0.55;
        target = 0;
        floor = 1;
        pushed = true;
      }
    } else if (inHouse) {
      const upstairs = curY > 1.55;
      target = upstairs ? FLOOR2 : 0;
      floor = upstairs ? 2 : 1;
    }

    floorState.floor = floor;
    // 家具碰撞体按层启停（墙体/楼梯等结构性碰撞体保持常开）
    setFloorColliders(addCollider.items, floor);

    if (!pushed && inStat) floorState.onStair = true;
    else floorState.onStair = inStairZone;

    // 上层需要用 grounded=false 维持层高（核心每帧会把 baseY 归零），
    // 此时角色动画会进入“空中姿势”，这里用正常行走姿势覆盖，避免主角看起来像悬浮。
    fixUpperPose(player, st, dt, target > 0.1 && st.grounded === false);

    if (target === 0) {
      if (st.grounded === false && curY > 0.06) {
        // 跳跃 / 下落中：交给核心物理
        prevInStair = inStairZone;
        return;
      }
      st.grounded = true;
      st.vy = 0;
      st.baseY = 0;
      g.position.y = typeof st.bounce === 'number' ? st.bounce : 0;
    } else {
      st.grounded = false;
      st.vy = 0;
      st.baseY = target;
      g.position.y = target;
    }
    prevInStair = inStairZone;
  }

  // ---------------- 时间联动 ----------------
  const mix = { interior: 0, street: 0, window: 0, bulbWarm: 0 };
  const streetBase = 2.1;
  const interiorBase = 2.3;
  let lastPhase = '';

  function readTimeState() {
    try {
      if (ctx.time && typeof ctx.time.getState === 'function') return ctx.time.getState();
    } catch (e) {
      // 忽略时间系统异常，按白天处理
    }
    return { hour: 12, phase: 'noon', isNight: false };
  }

  function updateLighting(dt) {
    const state = readTimeState() || {};
    const phase = normalizePhase(state);
    lastPhase = phase;
    const target = TARGETS[phase] || TARGETS.noon;
    const k = 1 - Math.exp(-Math.max(0, dt) * 4.5);
    mix.interior += (target.interior - mix.interior) * k;
    mix.street += (target.street - mix.street) * k;
    mix.window += (target.window - mix.window) * k;
    mix.bulbWarm += (target.bulbWarm - mix.bulbWarm) * k;

    interior.pointLights.forEach((light) => {
      light.intensity = interiorBase * mix.interior;
      light.visible = mix.interior > 0.01;
    });
    if (villa.porchPointLight) {
      villa.porchPointLight.intensity = 1.15 * Math.max(mix.interior, mix.street * 0.9);
      villa.porchPointLight.visible = mix.interior > 0.01 || mix.street > 0.01;
    }
    neighborhood.pointLights.forEach((light) => {
      light.intensity = streetBase * mix.street;
      light.visible = mix.street > 0.01;
    });

    mats.lampGlow.emissiveIntensity = 1.7 * mix.street;
    mats.lampGlowWarm.emissiveIntensity = 1.35 * mix.bulbWarm;
    mats.glass.emissiveIntensity = 0.05 + 0.95 * mix.window;
    mats.tvScreen.emissiveIntensity = 0.22 + 0.38 * mix.window;
    // 自发光灯具在白天仍然可见灯罩轮廓，但几乎不发光
    mats.lampGlow.emissive.setHex(0xffc873);
    mats.lampGlowWarm.emissive.setHex(0xffb35c);
  }

  // ---------------- 主更新 --------------
  let elapsed = 0;
  let controllerChecked = false;
  function update(dt = 0) {
    elapsed += dt;
    if (!controllerChecked) {
      controllerChecked = true;
      if (resolvePlayer(ctx.player)) console.info('[home] 楼层接管已接入角色控制器');
      else console.warn('[home] 未找到角色控制器状态，二楼楼层接管不可用');
    }
    applyFloor(ctx.player, dt);
    neighborhood.update(dt, elapsed);
    updateLighting(dt);
  }

  // 首帧对齐
  updateLighting(0.02);

  // 暴露少量调试信息，方便核心世界与预览页查看
  const sceneApi = {
    group: root,
    update,
    interactables,
    dispose,
    debug: {
      layout: L,
      floorState,
      getPhase: () => lastPhase,
    },
  };

  function dispose() {
    if (ctx.scene && typeof ctx.scene.remove === 'function') ctx.scene.remove(root);
    neighborhood.dispose();
    villa.dispose();
    interior.dispose();
    Object.keys(mats).forEach((key) => {
      const value = mats[key];
      const list = Array.isArray(value) ? value : [value];
      list.forEach((mat) => {
        if (!mat) return;
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
    });
    root.clear();
  }

  return sceneApi;
}
