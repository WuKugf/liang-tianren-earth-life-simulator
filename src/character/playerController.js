// 第三人称控制器：WASD 移动、Shift 跑步、空格跳跃、鼠标/Q E 转视角、平滑跟随、碰撞与边界
import * as THREE from 'three';

const PLAYER_RADIUS = 0.32;

function shortestAngle(from, to) {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function createPlayerController({ character, camera, input, bounds }) {
  const group = character.group;
  const state = {
    yaw: Math.PI,
    camYaw: 0,
    camPitch: 0.30,
    camDist: 6.6,
    baseY: 0,
    vy: 0,
    grounded: true,
    stamina: 100,
    staminaMax: 100,
    speed: 0,
    moving: false,
    running: false,
    bounce: 0,
    bounceVel: 0,
  };

  let boundsBox = bounds || { minX: -150, maxX: 150, minZ: -150, maxZ: 150 };
  let colliders = [];
  let moveEnabled = true;
  let jumpEnabled = true;
  let speedBoost = false;
  let locked = false;
  let jumpEvent = false;
  let landEvent = false;

  const smoothMove = new THREE.Vector3();
  const desiredMove = new THREE.Vector3();
  const lookTarget = new THREE.Vector3(0, 1.15, 0);
  const cameraPos = new THREE.Vector3(0, 4, 10);
  const desiredCamera = new THREE.Vector3();
  const forwardVec = new THREE.Vector3();
  const rightVec = new THREE.Vector3();
  let cameraInitialized = false;

  group.rotation.y = state.yaw;

  function setBounds(b) {
    if (b) boundsBox = b;
  }

  function setColliders(list) {
    colliders = Array.isArray(list) ? list : [];
    // 过滤掉无效碰撞体
    colliders = colliders.filter((c) => c && (c.radius || (c.maxX !== undefined && c.minX !== undefined)));
  }

  function setMoveEnabled(v) {
    moveEnabled = !!v;
    locked = false;
  }

  function setJumpEnabled(v) {
    jumpEnabled = !!v;
  }

  function setLocked(v) {
    locked = !!v;
  }

  function setSpeedBoost(v) {
    speedBoost = !!v;
  }

  function setStamina(v) {
    state.stamina = Math.max(0, Math.min(state.staminaMax, v));
  }

  function getStaminaRatio() {
    return state.stamina / state.staminaMax;
  }

  function snapCamera() {
    const horiz = Math.cos(state.camPitch) * state.camDist;
    const height = 1.05 + Math.sin(state.camPitch) * state.camDist;
    cameraPos.set(
      group.position.x + Math.sin(state.camYaw) * horiz,
      state.baseY + height,
      group.position.z + Math.cos(state.camYaw) * horiz
    );
    lookTarget.set(group.position.x, state.baseY + 1.15, group.position.z);
    camera.position.copy(cameraPos);
    camera.lookAt(lookTarget);
    cameraInitialized = true;
  }

  function teleport(x, z, yawValue, camYawValue) {
    group.position.x = x;
    group.position.z = z;
    state.baseY = 0;
    group.position.y = 0;
    state.vy = 0;
    state.grounded = true;
    state.bounce = 0;
    state.bounceVel = 0;
    state.speed = 0;
    smoothMove.set(0, 0, 0);
    if (Number.isFinite(yawValue)) {
      state.yaw = yawValue;
      group.rotation.y = state.yaw;
    }
    if (Number.isFinite(camYawValue)) {
      state.camYaw = camYawValue;
    } else {
      state.camYaw = state.yaw + Math.PI;
    }
    snapCamera();
  }

  function faceTowards(x, z) {
    const dx = x - group.position.x;
    const dz = z - group.position.z;
    if (Math.abs(dx) + Math.abs(dz) < 0.0001) return;
    state.yaw = Math.atan2(dx, dz);
    group.rotation.y = state.yaw;
    state.camYaw = state.yaw + Math.PI;
  }

  function addBounceImpulse(velocity) {
    state.bounceVel = velocity;
  }

  function resolveCollisions(pos) {
    for (let i = 0; i < colliders.length; i += 1) {
      const c = colliders[i];
      if (c.radius) {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const minDist = (c.radius || 0) + PLAYER_RADIUS;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const push = minDist - dist;
          pos.x += (dx / dist) * push;
          pos.z += (dz / dist) * push;
        }
      } else if (c.minX !== undefined) {
        const minX = c.minX - PLAYER_RADIUS;
        const maxX = c.maxX + PLAYER_RADIUS;
        const minZ = c.minZ - PLAYER_RADIUS;
        const maxZ = c.maxZ + PLAYER_RADIUS;
        if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
          const left = pos.x - minX;
          const right = maxX - pos.x;
          const pushBack = pos.z - minZ;
          const pushFront = maxZ - pos.z;
          const minPen = Math.min(left, right, pushBack, pushFront);
          if (minPen === left) pos.x = minX;
          else if (minPen === right) pos.x = maxX;
          else if (minPen === pushBack) pos.z = minZ;
          else pos.z = maxZ;
        }
      }
    }
  }

  function update(dt) {
    // 视角输入
    const delta = input.takeLookDelta();
    if (!locked) {
      state.camYaw -= delta.x * 0.0046;
      state.camPitch += delta.y * 0.0032;
    }
    if (input.isDown('turnLeft')) state.camYaw += dt * 2.1;
    if (input.isDown('turnRight')) state.camYaw -= dt * 2.1;
    state.camPitch = Math.max(0.1, Math.min(0.92, state.camPitch));

    const wheel = input.takeWheel();
    if (wheel !== 0) {
      // 严格第三人称：最近也要保持 3.4 米，不会切进第一人称
      state.camDist = Math.max(3.4, Math.min(10.5, state.camDist + wheel * 0.55));
    }

    // 移动输入（相机相对）
    const active = moveEnabled && !locked;
    let ix = 0;
    let iz = 0;
    if (active) {
      if (input.isDown('forward')) iz += 1;
      if (input.isDown('backward')) iz -= 1;
      if (input.isDown('left')) ix -= 1;
      if (input.isDown('right')) ix += 1;
    }

    forwardVec.set(-Math.sin(state.camYaw), 0, -Math.cos(state.camYaw));
    rightVec.set(Math.cos(state.camYaw), 0, -Math.sin(state.camYaw));

    desiredMove.set(0, 0, 0);
    desiredMove.addScaledVector(forwardVec, iz);
    desiredMove.addScaledVector(rightVec, ix);

    const hasInput = desiredMove.lengthSq() > 0.0001;
    if (hasInput) desiredMove.normalize();

    const wantsRun = input.isDown('run') && state.stamina > 1;
    const baseSpeed = 2.9;
    const runSpeed = 5.4;
    let targetSpeed = wantsRun ? runSpeed : baseSpeed;
    if (speedBoost) targetSpeed *= 1.18;

    if (hasInput) {
      if (wantsRun) state.stamina = Math.max(0, state.stamina - 8.5 * dt);
      else state.stamina = Math.max(0, state.stamina - 1.2 * dt);
    } else {
      state.stamina = Math.min(state.staminaMax, state.stamina + 7 * dt);
    }
    if (!hasInput) targetSpeed = 0;

    const smoothing = 1 - Math.exp(-11 * dt);
    smoothMove.x += (desiredMove.x * targetSpeed - smoothMove.x) * smoothing;
    smoothMove.z += (desiredMove.z * targetSpeed - smoothMove.z) * smoothing;

    state.speed = Math.sqrt(smoothMove.x * smoothMove.x + smoothMove.z * smoothMove.z);
    state.moving = state.speed > 0.35;
    state.running = state.speed > 4.1;

    if (hasInput) {
      const targetYaw = Math.atan2(desiredMove.x, desiredMove.z);
      const k = 1 - Math.exp(-13 * dt);
      state.yaw += shortestAngle(state.yaw, targetYaw) * k;
      group.rotation.y = state.yaw;
    }

    // 位移
    group.position.x += smoothMove.x * dt;
    group.position.z += smoothMove.z * dt;

    // 跳跃
    if (jumpEnabled && !locked && input.consumePress('jump') && state.grounded) {
      state.vy = 6.2;
      state.grounded = false;
      jumpEvent = true;
    }
    if (!state.grounded) {
      state.vy -= 15.5 * dt;
      state.baseY += state.vy * dt;
      if (state.baseY <= 0) {
        state.baseY = 0;
        state.vy = 0;
        state.grounded = true;
        landEvent = true;
      }
    } else {
      state.baseY = 0;
    }

    // 碰撞 + 边界
    resolveCollisions(group.position);
    group.position.x = Math.max(boundsBox.minX + 0.4, Math.min(boundsBox.maxX - 0.4, group.position.x));
    group.position.z = Math.max(boundsBox.minZ + 0.4, Math.min(boundsBox.maxZ - 0.4, group.position.z));

    // 跳绳弹跳
    if (state.bounce > 0 || state.bounceVel > 0) {
      state.bounceVel -= 9 * dt;
      state.bounce += state.bounceVel * dt;
      if (state.bounce <= 0) {
        state.bounce = 0;
        state.bounceVel = 0;
      }
    }
    group.position.y = state.baseY + state.bounce;

    // 角色动画
    character.update(dt, {
      moving: state.moving,
      running: state.running,
      airborne: !state.grounded,
      speed: state.speed,
    });

    // 相机跟随
    const horiz = Math.cos(state.camPitch) * state.camDist;
    const height = 1.05 + Math.sin(state.camPitch) * state.camDist;
    desiredCamera.set(
      group.position.x + Math.sin(state.camYaw) * horiz,
      Math.max(0.5, state.baseY + height),
      group.position.z + Math.cos(state.camYaw) * horiz
    );

    if (!cameraInitialized) {
      cameraPos.copy(desiredCamera);
      lookTarget.set(group.position.x, state.baseY + 1.15, group.position.z);
      cameraInitialized = true;
    } else {
      const camK = 1 - Math.exp(-9 * dt);
      cameraPos.lerp(desiredCamera, camK);
      const lookK = 1 - Math.exp(-14 * dt);
      lookTarget.x += (group.position.x - lookTarget.x) * lookK;
      lookTarget.z += (group.position.z - lookTarget.z) * lookK;
      lookTarget.y += (state.baseY + 1.15 + state.bounce * 0.7 - lookTarget.y) * lookK;
    }

    camera.position.copy(cameraPos);
    camera.lookAt(lookTarget);
  }

  return {
    group,
    state,
    update,
    teleport,
    faceTowards,
    setBounds,
    setColliders,
    setMoveEnabled,
    setJumpEnabled,
    setLocked,
    setSpeedBoost,
    setStamina,
    getStaminaRatio,
    snapCamera,
    addBounceImpulse,
    consumeJump: () => {
      const v = jumpEvent;
      jumpEvent = false;
      return v;
    },
    consumeLand: () => {
      const v = landEvent;
      landEvent = false;
      return v;
    },
    getPosition: () => group.position,
  };
}
