// NPC 人机系统：低多边形居民，沿路线散步、面向玩家挥手、可对话
import * as THREE from 'three';

const SKIN = 0xefc3a2;

const NPC_DEFS = [
  {
    id: 'wang-shen', name: '王婶', role: '糖水摊老板娘',
    shirt: 0xd98a5f, pants: 0x4a3f38, hair: 0x39302c, apron: true,
    start: { x: -66, z: -10 }, route: [[-66, -10], [-58, -12], [-62, -24], [-70, -22]],
    lines: [
      '添任来啦？今天的绿豆沙刚熬好，冰镇的。',
      '夜市一开，整条十字街就活过来了。',
      '读书要紧，也要记得按时吃饭呀。',
    ],
  },
  {
    id: 'a-zhe', name: '阿哲', role: '球场少年',
    shirt: 0x4b7ec9, pants: 0x2b3d5c, hair: 0x1f1a19, ball: true,
    start: { x: 52, z: 28 }, route: [[52, 28], [62, 27], [66, 18], [50, 18]],
    lines: [
      '来一局？我最近的后撤步可练成了。',
      '你投篮的时候手腕再压一点，稳。',
      '等会儿一起去夜市吃炒粉？',
    ],
  },
  {
    id: 'xiao-yu', name: '小雨', role: '同班同学',
    shirt: 0xf3c6d4, pants: 0x5a6d8a, hair: 0x2a211f, skirt: true, bag: true,
    start: { x: 8, z: 24 }, route: [[8, 24], [-4, 28], [-8, 16], [6, 12]],
    lines: [
      '你今天也来广场散步呀？喷泉边最凉快了。',
      '听说十字街新开了一家奶茶店。',
      '作业写完了吗——别装没听见。',
    ],
  },
  {
    id: 'chen-bo', name: '陈伯', role: '夜市长',
    shirt: 0xd6d2c4, pants: 0x3c4149, hair: 0xb9b4ac, hat: true,
    start: { x: -34, z: -20 }, route: [[-34, -20], [-44, -19], [-56, -20], [-45, -21]],
    lines: [
      '十字街的灯一亮，摊子就都出来了。',
      '慢慢逛，别急，夜市能开到半夜。',
      '这条街几十年了，越夜越热闹。',
    ],
  },
  {
    id: 'a-yi', name: '李阿姨', role: '炒粉摊主',
    shirt: 0xf0e5d0, pants: 0x4b3b30, hair: 0x2d2622, apron: true,
    start: { x: -40, z: -16 }, route: [[-40, -16], [-33, -16], [-35, -24], [-42, -24]],
    lines: [
      '炒粉要不要加辣？锅气正好。',
      '小心烫，拿着慢慢吃。',
      '夜市的烟火气，就在这一口锅里。',
    ],
  },
  {
    id: 'runner', name: '晨跑大哥', role: '长跑爱好者',
    shirt: 0x5cc39a, pants: 0x2f4668, hair: 0x201b18,
    start: { x: 24, z: -20 }, route: [[24, -20], [8, -20], [-30, -20], [-46, -20], [0, -20]],
    speed: 2.1,
    lines: [
      '一起跑两圈？匀速最重要。',
      '跑到十字街正好闻见炒粉香。',
      '坚持跑下去，体力会回来的。',
    ],
  },
];

function addMesh(parent, geo, mat, pos, cast = true) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildNpc(def) {
  const root = new THREE.Group();
  root.name = `npc-${def.id}`;
  root.position.set(def.start.x, 0, def.start.z);

  const skinMat = new THREE.MeshLambertMaterial({ color: SKIN });
  const shirtMat = new THREE.MeshLambertMaterial({ color: def.shirt });
  const pantsMat = new THREE.MeshLambertMaterial({ color: def.pants });
  const hairMat = new THREE.MeshLambertMaterial({ color: def.hair });
  const shoeMat = new THREE.MeshLambertMaterial({ color: 0x33363a });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x2c2a28 });
  const bagMat = new THREE.MeshLambertMaterial({ color: 0x7a4b3a });

  const hips = new THREE.Group();
  hips.position.y = 0.78;
  root.add(hips);
  addMesh(hips, new THREE.BoxGeometry(0.32, 0.16, 0.22), pantsMat, [0, -0.05, 0]);

  const torso = new THREE.Group();
  hips.add(torso);
  if (def.skirt) {
    addMesh(torso, new THREE.CylinderGeometry(0.28, 0.34, 0.5, 10), shirtMat, [0, 0.05, 0]);
  } else {
    addMesh(torso, new THREE.BoxGeometry(0.36, 0.52, 0.24), shirtMat, [0, 0.28, 0]);
  }
  if (def.apron) {
    addMesh(torso, new THREE.BoxGeometry(0.3, 0.42, 0.03), new THREE.MeshLambertMaterial({ color: 0xe8ddc8 }), [0, 0.18, 0.135], false);
  }
  if (def.bag) {
    addMesh(torso, new THREE.BoxGeometry(0.24, 0.28, 0.1), bagMat, [0, 0.24, -0.17]);
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.62, 0);
  torso.add(headGroup);
  addMesh(headGroup, new THREE.SphereGeometry(0.185, 18, 14), skinMat, [0, 0, 0]);
  addMesh(headGroup, new THREE.SphereGeometry(0.195, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat, [0, 0.01, -0.006]);
  if (def.hat) {
    addMesh(headGroup, new THREE.CylinderGeometry(0.19, 0.21, 0.1, 12), darkMat, [0, 0.17, 0]);
    addMesh(headGroup, new THREE.CylinderGeometry(0.29, 0.29, 0.02, 16), darkMat, [0, 0.12, 0]);
  }
  addMesh(headGroup, new THREE.SphereGeometry(0.018, 6, 6), darkMat, [0.06, 0.02, 0.168], false);
  addMesh(headGroup, new THREE.SphereGeometry(0.018, 6, 6), darkMat, [-0.06, 0.02, 0.168], false);
  const mouth = addMesh(headGroup, new THREE.BoxGeometry(0.06, 0.012, 0.01), new THREE.MeshLambertMaterial({ color: 0xb9655d }), [0, -0.075, 0.172], false);

  const armGeo = new THREE.BoxGeometry(0.082, 0.42, 0.092);
  const armL = new THREE.Group();
  armL.position.set(0.215, 0.5, 0);
  torso.add(armL);
  addMesh(armL, armGeo, shirtMat, [0, -0.2, 0]);
  addMesh(armL, new THREE.SphereGeometry(0.042, 8, 8), skinMat, [0, -0.43, 0]);
  const armR = new THREE.Group();
  armR.position.set(-0.215, 0.5, 0);
  torso.add(armR);
  addMesh(armR, armGeo, shirtMat, [0, -0.2, 0]);
  addMesh(armR, new THREE.SphereGeometry(0.042, 8, 8), skinMat, [0, -0.43, 0]);

  const legGeo = new THREE.BoxGeometry(0.14, 0.56, 0.15);
  const legL = new THREE.Group();
  legL.position.set(0.085, 0.72, 0);
  root.add(legL);
  addMesh(legL, legGeo, pantsMat, [0, -0.28, 0]);
  addMesh(legL, new THREE.BoxGeometry(0.15, 0.08, 0.24), shoeMat, [0, -0.58, 0.03]);
  const legR = new THREE.Group();
  legR.position.set(-0.085, 0.72, 0);
  root.add(legR);
  addMesh(legR, legGeo, pantsMat, [0, -0.28, 0]);
  addMesh(legR, new THREE.BoxGeometry(0.15, 0.08, 0.24), shoeMat, [0, -0.58, 0.03]);

  if (def.ball) {
    const ball = addMesh(root, new THREE.SphereGeometry(0.14, 14, 10), new THREE.MeshLambertMaterial({ color: 0xd97a2e }), [0.3, 0.35, 0.1]);
    ball.castShadow = true;
  }

  return { root, hips, torso, headGroup, armL, armR, legL, legR, mouth };
}

export function createNpcSystem({ registerInteractable } = {}) {
  const group = new THREE.Group();
  group.name = 'npc-system';
  const list = [];
  const interactables = [];

  NPC_DEFS.forEach((def) => {
    const model = buildNpc(def);
    group.add(model.root);
    const npc = {
      def,
      model,
      pos: { x: def.start.x, z: def.start.z },
      yaw: 0,
      routeIndex: 1 % def.route.length,
      wait: 0.6 + Math.random() * 1.4,
      walkPhase: Math.random() * Math.PI * 2,
      idleTime: Math.random() * 6,
      waving: 0,
      greetCooldown: 0,
      lineIndex: Math.floor(Math.random() * def.lines.length),
      speed: def.speed || 1.15,
    };
    // 把互动点位置绑定到 NPC 当前坐标
    npc.interactable = {
      id: `talk-${def.id}`,
      label: `和${def.name}聊两句`,
      action: 'talk',
      position: npc.pos,
      radius: 2.3,
      meta: { npc, name: def.name, role: def.role },
    };
    interactables.push(npc.interactable);
    if (registerInteractable) registerInteractable(npc.interactable);
    list.push(npc);
  });

  function nextLine(npc) {
    const lines = npc.def.lines;
    const line = lines[npc.lineIndex % lines.length];
    npc.lineIndex += 1;
    return line;
  }

  let greetCallback = null;
  function onGreet(fn) {
    greetCallback = fn;
  }

  function update(dt, playerPos) {
    for (let i = 0; i < list.length; i += 1) {
      const npc = list[i];
      const m = npc.model;
      npc.idleTime += dt;
      npc.greetCooldown = Math.max(0, npc.greetCooldown - dt);

      const dx = playerPos ? playerPos.x - npc.pos.x : 999;
      const dz = playerPos ? playerPos.z - npc.pos.z : 999;
      const distSq = dx * dx + dz * dz;
      const near = distSq < 10.5;

      if (near && npc.greetCooldown <= 0) {
        npc.greetCooldown = 14;
        npc.waving = 2.2;
        if (greetCallback) greetCallback(npc);
      }

      // 移动决策
      if (npc.waving > 0) {
        npc.waving -= dt;
      }

      if (!near && npc.waving <= 0) {
        const target = npc.def.route[npc.routeIndex];
        const tx = target[0] - npc.pos.x;
        const tz = target[1] - npc.pos.z;
        const dist = Math.sqrt(tx * tx + tz * tz);
        if (dist < 0.35) {
          npc.wait -= dt;
          if (npc.wait <= 0) {
            npc.routeIndex = (npc.routeIndex + 1) % npc.def.route.length;
            npc.wait = 0.7 + Math.random() * 1.8;
          }
        } else {
          const nx = tx / dist;
          const nz = tz / dist;
          npc.pos.x += nx * npc.speed * dt;
          npc.pos.z += nz * npc.speed * dt;
          const targetYaw = Math.atan2(nx, nz);
          const diff = Math.atan2(Math.sin(targetYaw - npc.yaw), Math.cos(targetYaw - npc.yaw));
          npc.yaw += diff * Math.min(1, dt * 7);
          npc.walkPhase += dt * 7.2;
        }
      } else if (near) {
        // 面向玩家并挥手
        const targetYaw = Math.atan2(dx, dz);
        const diff = Math.atan2(Math.sin(targetYaw - npc.yaw), Math.cos(targetYaw - npc.yaw));
        npc.yaw += diff * Math.min(1, dt * 8);
      }

      m.root.position.set(npc.pos.x, 0, npc.pos.z);
      m.root.rotation.y = npc.yaw;

      const movingNow = npc.waving <= 0 && !near;
      const swing = movingNow ? Math.sin(npc.walkPhase) * 0.5 : 0;
      const k = Math.min(1, dt * 10);
      m.legL.rotation.x += (swing - m.legL.rotation.x) * k;
      m.legR.rotation.x += (-swing - m.legR.rotation.x) * k;
      m.armL.rotation.x += (-swing * 0.8 - m.armL.rotation.x) * k;
      if (npc.waving > 0) {
        m.armR.rotation.x += (-2.4 - m.armR.rotation.x) * k;
        m.armR.rotation.z += (-0.55 + Math.sin(npcsTime * 9) * 0.3 - m.armR.rotation.z) * k;
      } else {
        m.armR.rotation.x += (swing * 0.8 - m.armR.rotation.x) * k;
        m.armR.rotation.z += (0.06 - m.armR.rotation.z) * k;
      }
      m.armL.rotation.z += (-0.06 - m.armL.rotation.z) * k;
      // 呼吸 / 走路起伏
      m.hips.position.y = 0.78 + (movingNow ? Math.abs(Math.sin(npc.walkPhase * 2)) * 0.02 : Math.sin(npc.idleTime * 1.5) * 0.005);
      m.headGroup.rotation.y = near ? Math.sin(npcsTime * 1.2) * 0.06 : Math.sin(npc.idleTime * 0.7) * 0.12;
    }
  }

  let npcsTime = 0;
  const baseUpdate = update;
  function tick(dt, playerPos) {
    npcsTime += dt;
    baseUpdate(dt, playerPos);
  }

  function getNpc(id) {
    return list.find((n) => n.def.id === id) || null;
  }

  function dispose() {
    group.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((mat) => mat.dispose());
        else if (obj.material) obj.material.dispose();
      }
    });
  }

  return {
    group,
    update: tick,
    interactables,
    getNpc,
    nextLine,
    onGreet,
    dispose,
  };
}
