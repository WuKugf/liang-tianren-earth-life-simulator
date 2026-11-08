// 十字街夜市：以生活区 (-55, -20) 十字路口为中心的小镇夜市
// 摊位、招牌、灯笼、蒸汽、萤火虫、夜灯，全部程序化生成
import * as THREE from 'three';

const MARKET_CENTER = { x: -55, z: -20 };

const STALL_NAMES = [
  '阿婆糖水', '老梁烧烤', '十字街炒粉', '鲜果冰', '花甲粉',
  '炸串铺', '添任奶茶', '手打柠檬茶', '夜市关东煮', '螺蛳粉',
  '糯米饭', '炭烤生蚝',
];

function makeSignTexture(title, sub, bg, fg) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const c = canvas.getContext('2d');
  c.fillStyle = bg || '#2a211c';
  c.fillRect(0, 0, 512, 160);
  c.strokeStyle = 'rgba(255, 210, 140, 0.35)';
  c.lineWidth = 6;
  c.strokeRect(8, 8, 496, 144);
  c.fillStyle = fg || '#ffe6b8';
  c.textAlign = 'center';
  c.font = 'bold 56px "PingFang SC", "Microsoft YaHei", sans-serif';
  c.fillText(title, 256, 84);
  if (sub) {
    c.fillStyle = 'rgba(255, 230, 184, 0.6)';
    c.font = '22px "Arial", sans-serif';
    c.fillText(sub, 256, 124);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createNightMarket(ctx) {
  const { registerInteractable, registerCollider, time } = ctx;
  const group = new THREE.Group();
  group.name = 'cross-street-market';

  const M = {
    pave: new THREE.MeshLambertMaterial({ color: 0x8d8677 }),
    paveDark: new THREE.MeshLambertMaterial({ color: 0x7b7466 }),
    wood: new THREE.MeshLambertMaterial({ color: 0x6d4a33 }),
    woodDark: new THREE.MeshLambertMaterial({ color: 0x3f2c21 }),
    clothRed: new THREE.MeshLambertMaterial({ color: 0xb23a31 }),
    clothGold: new THREE.MeshLambertMaterial({ color: 0xd9a13c }),
    clothMint: new THREE.MeshLambertMaterial({ color: 0x4d8a72 }),
    clothBlue: new THREE.MeshLambertMaterial({ color: 0x3f5f86 }),
    metal: new THREE.MeshLambertMaterial({ color: 0x5a646d }),
    lantern: new THREE.MeshLambertMaterial({
      color: 0xd94b3a, emissive: 0xff6a3f, emissiveIntensity: 0.25,
    }),
    bulb: new THREE.MeshBasicMaterial({ color: 0xfff0c0 }),
    neonWarm: new THREE.MeshBasicMaterial({ color: 0xffb45e }),
    food: new THREE.MeshLambertMaterial({ color: 0xd98b4a }),
    foodGreen: new THREE.MeshLambertMaterial({ color: 0x86a85e }),
    sign: new THREE.MeshLambertMaterial({ color: 0x2a211c }),
  };

  function box(w, h, d, mat, x, y, z, rotY = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // ---------------- 地面：十字街铺装 --------------
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(15, 40), M.pave);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(MARKET_CENTER.x, 0.055, MARKET_CENTER.z);
  plaza.receiveShadow = true;
  group.add(plaza);
  const plazaRing = new THREE.Mesh(new THREE.RingGeometry(6.2, 6.6, 48), M.paveDark);
  plazaRing.rotation.x = -Math.PI / 2;
  plazaRing.position.set(MARKET_CENTER.x, 0.06, MARKET_CENTER.z);
  group.add(plazaRing);

  // 石板缝隙（细长条，提升地面细节）
  for (let i = 0; i < 6; i += 1) {
    box(30, 0.01, 0.12, M.paveDark, MARKET_CENTER.x, 0.062, MARKET_CENTER.z - 12 + i * 4.8, false);
    box(0.12, 0.01, 30, M.paveDark, MARKET_CENTER.x - 12 + i * 4.8, 0.062, MARKET_CENTER.z, false);
  }

  // ---------------- 牌坊 --------------
  const arch = new THREE.Group();
  arch.position.set(MARKET_CENTER.x + 24, 0, MARKET_CENTER.z);
  const postGeo = new THREE.CylinderGeometry(0.22, 0.26, 5, 10);
  [-4.6, 4.6].forEach((dz) => {
    const post = new THREE.Mesh(postGeo, M.woodDark);
    post.position.set(0, 2.5, dz);
    post.castShadow = true;
    arch.add(post);
    registerCollider({ x: MARKET_CENTER.x + 24, z: MARKET_CENTER.z + dz, radius: 0.32 });
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 10.2), M.woodDark);
  beam.position.set(0, 5.1, 0);
  beam.castShadow = true;
  arch.add(beam);
  const beam2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 8.6), M.wood);
  beam2.position.set(0, 4.62, 0);
  beam2.castShadow = true;
  arch.add(beam2);
  const archSignTex = makeSignTexture('十字街夜市', 'CROSS STREET NIGHT MARKET', '#211712', '#ffd88a');
  const archSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 1.75),
    new THREE.MeshBasicMaterial({ map: archSignTex })
  );
  archSign.position.set(0.3, 5.7, 0);
  archSign.rotation.y = Math.PI / 2;
  arch.add(archSign);
  group.add(arch);

  const marketPointLights = [];

  // ---------------- 摊位 --------------
  const stallNames = STALL_NAMES.slice();
  let nameIndex = 0;
  const lanterns = [];
  const stallSpots = [];
  const cloths = [M.clothRed, M.clothGold, M.clothMint, M.clothBlue];

  function makeStall(x, z, rotY, hot) {
    const s = new THREE.Group();
    s.position.set(x, 0, z);
    s.rotation.y = rotY;
    group.add(s);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.95, 0.9), M.wood);
    counter.position.set(0, 0.48, 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    s.add(counter);

    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 1.0), M.woodDark);
    counterTop.position.set(0, 0.98, 0);
    counterTop.castShadow = true;
    s.add(counterTop);

    // 支撑柱
    const postGeo2 = new THREE.BoxGeometry(0.09, 2.3, 0.09);
    [-1.25, 1.25].forEach((dx) => {
      [-0.42, 0.42].forEach((dz) => {
        const post = new THREE.Mesh(postGeo2, M.woodDark);
        post.position.set(dx, 1.15, dz);
        post.castShadow = true;
        s.add(post);
      });
    });

    // 顶棚
    const cloth = cloths[nameIndex % cloths.length];
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.07, 1.75), cloth);
    canopy.position.set(0, 2.32, 0);
    canopy.castShadow = true;
    s.add(canopy);
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.62, 0.06), cloth);
    awning.position.set(0, 2.02, 0.86);
    awning.castShadow = true;
    s.add(awning);

    // 招牌
    const name = stallNames[nameIndex % stallNames.length];
    nameIndex += 1;
    const signTex = makeSignTexture(name, hot ? '现炒现卖 · 热腾腾' : '十字街老味道', '#241a14', '#ffe3a8');
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.68),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    sign.position.set(0, 1.86, 0.885);
    s.add(sign);

    // 摊上的食物与器物
    for (let i = 0; i < 4; i += 1) {
      const item = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, i % 2 === 0 ? 0.18 : 0.12, 0.3),
        i % 2 === 0 ? M.food : M.foodGreen
      );
      item.position.set(-1.0 + i * 0.66, 1.03 + (i % 2 === 0 ? 0.09 : 0.06), 0.12);
      item.castShadow = true;
      s.add(item);
    }
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.24, 10), M.metal);
    pot.position.set(0.82, 1.1, -0.18);
    pot.castShadow = true;
    s.add(pot);

    // 灯笼
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0, 2.55, 0.58);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M.lantern);
    lantern.scale.set(1, 1.2, 1);
    lanternGroup.add(lantern);
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 0.26, 6), M.woodDark);
    tassel.position.y = -0.32;
    lanternGroup.add(tassel);
    s.add(lanternGroup);
    lanterns.push({ obj: lanternGroup, phase: Math.random() * Math.PI * 2 });

    // 碰撞体（按朝向近似）
    const halfW = Math.abs(Math.cos(rotY)) > 0.5 ? 1.45 : 0.95;
    const halfD = Math.abs(Math.cos(rotY)) > 0.5 ? 0.95 : 1.45;
    registerCollider({
      minX: x - halfW, maxX: x + halfW, minZ: z - halfD, maxZ: z + halfD,
    });

    return { name, x, z, hot, signTex };
  }

  // 北侧（面朝南，朝向道路）
  [-82, -70, -44, -32].forEach((x) => {
    stallSpots.push(makeStall(x, -13.2, Math.PI, true));
  });
  // 南侧（面朝北）
  [-76, -64, -46, -36].forEach((x) => {
    stallSpots.push(makeStall(x, -27.2, 0, false));
  });
  // 西侧（面朝东）
  [-63.5, -63.5].forEach((x, i) => {
    stallSpots.push(makeStall(x, -38 - i * 10, Math.PI / 2, false));
  });
  // 东侧（面朝西）
  [-46.5, -46.5].forEach((x, i) => {
    stallSpots.push(makeStall(x, -4 - i * 9, -Math.PI / 2, true));
  });

  // 夜市点光源（夜晚使用，数量克制）
  [[-70, -20], [-55, -20], [-40, -20], [-55, -6], [-55, -34]].forEach(([x, z]) => {
    const light = new THREE.PointLight(0xffb066, 0, 17, 2);
    light.position.set(x, 3.4, z);
    group.add(light);
    marketPointLights.push(light);
  });

  // ---------------- 灯笼串 --------------
  const bulbGeo = new THREE.SphereGeometry(0.11, 8, 8);
  const stringBulbs = [];
  const bulbPositions = [];
  for (let line = 0; line < 3; line += 1) {
    const zLine = -25.5 + line * 4.7;
    for (let i = 0; i < 14; i += 1) {
      const t = i / 13;
      const x = -88 + t * 46;
      const sag = Math.sin(t * Math.PI) * 0.7;
      bulbPositions.push([x, 4.1 - sag, zLine]);
    }
  }
  const bulbMesh = new THREE.InstancedMesh(bulbGeo, M.bulb, bulbPositions.length);
  const dummy = new THREE.Object3D();
  bulbPositions.forEach(([x, y, z], i) => {
    dummy.position.set(x, y, z);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    bulbMesh.setMatrixAt(i, dummy.matrix);
  });
  group.add(bulbMesh);

  // 串灯横杆
  box(46, 0.05, 0.05, M.woodDark, -65, 4.15, -25.5, false);
  box(46, 0.05, 0.05, M.woodDark, -65, 4.15, -20.8, false);
  box(46, 0.05, 0.05, M.woodDark, -65, 4.15, -16.1, false);

  // ---------------- 蒸汽粒子 --------------
  const STEAM_COUNT = 96;
  const steamGeo = new THREE.BufferGeometry();
  const steamPos = new Float32Array(STEAM_COUNT * 3);
  const steamSeed = [];
  for (let i = 0; i < STEAM_COUNT; i += 1) {
    const stall = stallSpots[i % stallSpots.length];
    const spread = (Math.random() - 0.5) * 1.4;
    steamSeed.push({
      x: stall.x + spread,
      z: stall.z + (Math.random() - 0.5) * 0.7,
      y: 1.1 + Math.random() * 1.6,
      speed: 0.25 + Math.random() * 0.5,
      phase: Math.random() * 6,
      hot: stall.hot,
    });
    steamPos[i * 3] = stall.x;
    steamPos[i * 3 + 1] = 1.1;
    steamPos[i * 3 + 2] = stall.z;
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steamMat = new THREE.PointsMaterial({
    color: 0xfff2dc, size: 0.32, transparent: true, opacity: 0.16,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const steam = new THREE.Points(steamGeo, steamMat);
  group.add(steam);

  // ---------------- 萤火虫 --------------
  const FLY_COUNT = 60;
  const flyGeo = new THREE.BufferGeometry();
  const flyPos = new Float32Array(FLY_COUNT * 3);
  const flySeed = [];
  for (let i = 0; i < FLY_COUNT; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 22;
    const x = MARKET_CENTER.x + Math.cos(a) * r;
    const z = MARKET_CENTER.z + Math.sin(a) * r;
    flySeed.push({ x, z, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5 });
    flyPos[i * 3] = x;
    flyPos[i * 3 + 1] = 1.2;
    flyPos[i * 3 + 2] = z;
  }
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyMat = new THREE.PointsMaterial({
    color: 0xffe08a, size: 0.16, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const fireflies = new THREE.Points(flyGeo, flyMat);
  group.add(fireflies);

  // ---------------- 交互点 --------------
  const interactables = [];
  stallSpots.slice(0, 6).forEach((stall, i) => {
    interactables.push({
      id: `market-snack-${i}`,
      label: `${stall.name} · 买一份尝尝`,
      action: 'snack',
      position: {
        x: stall.x,
        y: 0.1,
        z: stall.z + (Math.abs(stall.z + 20) > 5 ? (stall.z < -20 ? 1.4 : -1.4) : 1.4),
      },
      radius: 2.2,
      meta: { name: stall.name, scene: 'market' },
    });
  });
  interactables.push({
    id: 'market-wish',
    label: '许愿灯笼 · 许个愿',
    action: 'wish',
    position: { x: MARKET_CENTER.x, y: 0.1, z: MARKET_CENTER.z + 3.2 },
    radius: 2.6,
    meta: { scene: 'market' },
  });
  interactables.forEach((it) => registerInteractable(it));

  // ---------------- 夜间状态 --------------
  let nightApplied = null;
  function applyNight(isNight) {
    if (nightApplied === isNight) return;
    nightApplied = isNight;
    M.lantern.emissiveIntensity = isNight ? 1.9 : 0.28;
    marketPointLights.forEach((l) => { l.intensity = isNight ? 1.15 : 0; });
    bulbMesh.material = isNight ? M.neonWarm : M.bulb;
    if (isNight) M.neonWarm.color.setHex(0xffcf7a);
    else M.bulb.color.setHex(0xfff0c0);
  }

  let elapsed = 0;
  function update(dt) {
    elapsed += dt;
    const state = time ? time.getState() : null;
    const isNight = !!(state && state.isNight);
    applyNight(isNight);

    // 灯笼摇摆
    for (let i = 0; i < lanterns.length; i += 1) {
      const l = lanterns[i];
      l.obj.rotation.z = Math.sin(elapsed * 1.6 + l.phase) * 0.12;
      l.obj.rotation.x = Math.cos(elapsed * 1.1 + l.phase) * 0.08;
    }

    // 蒸汽上升
    const arr = steamGeo.attributes.position.array;
    for (let i = 0; i < STEAM_COUNT; i += 1) {
      const seed = steamSeed[i];
      seed.y += seed.speed * dt;
      if (seed.y > 3.2) seed.y = 1.05;
      arr[i * 3] = seed.x + Math.sin(elapsed * 1.4 + seed.phase) * 0.16;
      arr[i * 3 + 1] = seed.y;
      arr[i * 3 + 2] = seed.z;
    }
    steamGeo.attributes.position.needsUpdate = true;
    steamMat.opacity = isNight ? 0.22 : 0.13;

    // 萤火虫
    const farr = flyGeo.attributes.position.array;
    for (let i = 0; i < FLY_COUNT; i += 1) {
      const f = flySeed[i];
      farr[i * 3] = f.x + Math.sin(elapsed * f.speed + f.phase) * 1.7;
      farr[i * 3 + 1] = 1.15 + Math.sin(elapsed * f.speed * 1.7 + f.phase) * 0.7;
      farr[i * 3 + 2] = f.z + Math.cos(elapsed * f.speed * 0.9 + f.phase) * 1.7;
    }
    flyGeo.attributes.position.needsUpdate = true;
    flyMat.opacity = isNight ? 0.8 : 0;

    // 霓虹招牌轻微闪烁
    if (isNight) {
      const flick = 0.95 + Math.sin(elapsed * 11.3) * 0.04;
      M.neonWarm.color.setRGB(1 * flick, 0.79 * flick, 0.46 * flick);
    }
  }

  function dispose() {
    group.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    stallSpots.forEach((s) => { if (s.signTex) s.signTex.dispose(); });
    archSignTex.dispose();
  }

  return {
    group,
    update,
    interactables,
    dispose,
    isNight: () => !!nightApplied,
    bounds: { x: MARKET_CENTER.x, z: MARKET_CENTER.z },
  };
}
