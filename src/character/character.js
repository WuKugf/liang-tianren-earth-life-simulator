// 主角「梁添任」1:1 特征复刻：短发刘海 + 细框眼镜 + 浅绿无袖上衣 + 深色短裤 + 白球鞋 + 手表
// 保持关节层级与 home 场景的姿势接管逻辑兼容：
// root -> hips(y=.76) -> torso(y=0) -> head(y=.62) / armL·armR(y=.48)；root -> legL·legR(y=.70)
import * as THREE from 'three';

const SKIN = 0xf1c8a4;
const SKIN_SHADE = 0xe3b08b;
const SKIN_BLUSH = 0xefab97;
const HAIR = 0x1f1a19;
const GLASS_FRAME = 0x2b3033;
const SHIRT_MINT = 0xcfe3d5;

function addMesh(parent, geometry, material, position, castShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = castShadow;
  parent.add(mesh);
  return mesh;
}

function makeShirtPrint() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = '#33423a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 92px "Arial Black", "Helvetica", sans-serif';
  ctx.fillText('SIFOMS', 256, 140);
  ctx.fillStyle = '#4b5d53';
  ctx.font = '26px "Arial", sans-serif';
  ctx.fillText('Obrinothenba', 256, 186);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createCharacter() {
  const root = new THREE.Group();
  root.name = 'LiangTianren';

  // ---------------- 材质 ----------------
  const skinMat = new THREE.MeshLambertMaterial({ color: SKIN });
  const skinShadeMat = new THREE.MeshLambertMaterial({ color: SKIN_SHADE });
  const blushMat = new THREE.MeshLambertMaterial({ color: SKIN_BLUSH });
  const hairMat = new THREE.MeshLambertMaterial({ color: HAIR });
  const frameMat = new THREE.MeshLambertMaterial({ color: GLASS_FRAME });
  const lensMat = new THREE.MeshBasicMaterial({
    color: 0xe2f2ff, transparent: true, opacity: 0.16, depthWrite: false,
  });
  const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: 0xf7f4ee });
  const pupilMat = new THREE.MeshLambertMaterial({ color: 0x241d19 });
  const mouthMat = new THREE.MeshLambertMaterial({ color: 0xc4736b });

  const shirtMat = new THREE.MeshLambertMaterial({ color: SHIRT_MINT });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x3b4553 });
  const sleeveMat = new THREE.MeshLambertMaterial({ color: SHIRT_MINT });
  const shoeMat = new THREE.MeshLambertMaterial({ color: 0xf7f5f0 });
  const soleMat = new THREE.MeshLambertMaterial({ color: 0xd8d3c6 });
  const accentMat = new THREE.MeshLambertMaterial({ color: 0x7fc8a3 });
  const sockMat = new THREE.MeshLambertMaterial({ color: 0xf2f0e9 });
  const logoMat = new THREE.MeshLambertMaterial({ color: 0x37503f });
  const neckerMat = new THREE.MeshLambertMaterial({ color: 0xd4463f });
  const legMat = new THREE.MeshLambertMaterial({ color: SKIN });
  const watchBandMat = new THREE.MeshLambertMaterial({ color: 0xe9e7e0 });
  const watchFaceMat = new THREE.MeshLambertMaterial({
    color: 0x1b2836, emissive: 0x3d7fb8, emissiveIntensity: 0.35,
  });

  // ---------------- 躯干 ----------------
  const hips = new THREE.Group();
  hips.position.y = 0.76;
  root.add(hips);

  addMesh(hips, new THREE.BoxGeometry(0.325, 0.17, 0.235), pantsMat, [0, -0.06, 0]);

  const torso = new THREE.Group();
  torso.position.y = 0;
  hips.add(torso);

  const torsoGeo = new THREE.CylinderGeometry(0.205, 0.182, 0.5, 14, 1);
  const torsoMesh = addMesh(torso, torsoGeo, shirtMat, [0, 0.25, 0]);
  torsoMesh.scale.z = 0.74;

  // 白色圆领
  const collar = addMesh(torso, new THREE.TorusGeometry(0.082, 0.014, 6, 18), trimMat, [0, 0.505, 0]);
  collar.rotation.x = Math.PI / 2;

  // 胸前同款印字（照片 SIFOMS）
  const printTexture = makeShirtPrint();
  const printMat = new THREE.MeshLambertMaterial({
    map: printTexture, transparent: true, depthWrite: false,
  });
  const chestPrint = addMesh(torso, new THREE.PlaneGeometry(0.235, 0.118), printMat, [0, 0.315, 0.156], false);
  logoMat.color.setHex(0x37503f);
  const logoBar1 = addMesh(torso, new THREE.PlaneGeometry(0.135, 0.019), logoMat, [0, 0.335, 0.154], false);
  const logoBar2 = addMesh(torso, new THREE.PlaneGeometry(0.092, 0.012), logoMat, [0, 0.293, 0.154], false);
  logoBar1.visible = false;
  logoBar2.visible = false;

  // 运动服条纹（默认隐藏）
  const stripes = [];
  const stripeGeo = new THREE.BoxGeometry(0.05, 0.5, 0.008);
  const stripeL = addMesh(torso, stripeGeo, trimMat, [0.123, 0.25, 0.143], false);
  const stripeR = addMesh(torso, stripeGeo, trimMat, [-0.123, 0.25, 0.143], false);
  stripes.push(stripeL, stripeR);
  stripes.forEach((s) => { s.visible = false; });

  // 校服领巾（默认隐藏）
  const necker = addMesh(torso, new THREE.ConeGeometry(0.075, 0.14, 4), neckerMat, [0, 0.44, 0.128]);
  necker.rotation.x = Math.PI;
  necker.rotation.y = Math.PI / 4;
  necker.visible = false;

  // 脖子
  addMesh(hips, new THREE.CylinderGeometry(0.052, 0.058, 0.09, 8), skinMat, [0, 0.525, 0]);

  // ---------------- 头部 ----------------
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.62, 0);
  torso.add(headGroup);

  const head = addMesh(headGroup, new THREE.SphereGeometry(0.195, 26, 20), skinMat, [0, 0, 0]);
  head.scale.set(1, 1.03, 0.96);

  // 耳朵
  const earGeo = new THREE.SphereGeometry(0.036, 8, 8);
  const earL = addMesh(headGroup, earGeo, skinShadeMat, [0.188, -0.005, 0.0]);
  earL.scale.set(0.7, 1, 0.9);
  const earR = addMesh(headGroup, earGeo, skinShadeMat, [-0.188, -0.005, 0.0]);
  earR.scale.set(0.7, 1, 0.9);

  // 短发：头顶盖 + 后脑 + 齐刘海 + 鬓角
  const hairCap = addMesh(
    headGroup,
    new THREE.SphereGeometry(0.204, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat,
    [0, 0.008, -0.004]
  );
  hairCap.scale.set(1.01, 1.02, 0.98);

  const hairBack = addMesh(
    headGroup,
    new THREE.SphereGeometry(0.201, 22, 14, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.40),
    hairMat,
    [0, -0.012, -0.036]
  );
  hairBack.scale.set(1.0, 1.02, 0.94);

  const bangs = addMesh(headGroup, new THREE.BoxGeometry(0.345, 0.095, 0.12), hairMat, [0, 0.124, 0.126]);
  bangs.rotation.x = -0.18;

  const bangSideGeo = new THREE.BoxGeometry(0.11, 0.08, 0.09);
  const bangL = addMesh(headGroup, bangSideGeo, hairMat, [0.146, 0.108, 0.108]);
  bangL.rotation.z = 0.30;
  const bangR = addMesh(headGroup, bangSideGeo, hairMat, [-0.146, 0.108, 0.108]);
  bangR.rotation.z = -0.30;

  const sideburnGeo = new THREE.BoxGeometry(0.030, 0.105, 0.078);
  addMesh(headGroup, sideburnGeo, hairMat, [0.180, 0.012, 0.042]);
  addMesh(headGroup, sideburnGeo, hairMat, [-0.180, 0.012, 0.042]);

  // 眉毛
  const browGeo = new THREE.BoxGeometry(0.072, 0.014, 0.014);
  const browL = addMesh(headGroup, browGeo, hairMat, [0.073, 0.075, 0.176], false);
  browL.rotation.z = -0.05;
  const browR = addMesh(headGroup, browGeo, hairMat, [-0.073, 0.075, 0.176], false);
  browR.rotation.z = 0.05;

  // 眼睛（白眼球 + 瞳孔 + 高光），可眨眼
  const eyeWhiteGeo = new THREE.SphereGeometry(0.026, 10, 10);
  const eyeL = addMesh(headGroup, eyeWhiteGeo, eyeWhiteMat, [0.073, 0.016, 0.174], false);
  eyeL.scale.set(1, 1.05, 0.55);
  const eyeR = addMesh(headGroup, eyeWhiteGeo, eyeWhiteMat, [-0.073, 0.016, 0.174], false);
  eyeR.scale.set(1, 1.05, 0.55);

  const pupilGeo = new THREE.SphereGeometry(0.0135, 8, 8);
  const pupilL = addMesh(headGroup, pupilGeo, pupilMat, [0.073, 0.014, 0.186], false);
  pupilL.scale.set(1, 1.1, 0.5);
  const pupilR = addMesh(headGroup, pupilGeo, pupilMat, [-0.073, 0.014, 0.186], false);
  pupilR.scale.set(1, 1.1, 0.5);

  const glintGeo = new THREE.SphereGeometry(0.0042, 6, 6);
  addMesh(headGroup, glintGeo, trimMat, [0.0785, 0.023, 0.191], false);
  addMesh(headGroup, glintGeo, trimMat, [-0.0785, 0.023, 0.191], false);

  // 细框眼镜（照片同款）
  const frameGeo = new THREE.TorusGeometry(0.074, 0.0068, 6, 22);
  const frameL = addMesh(headGroup, frameGeo, frameMat, [0.075, 0.016, 0.194], false);
  const frameR = addMesh(headGroup, frameGeo, frameMat, [-0.075, 0.016, 0.194], false);
  frameL.scale.set(1.03, 0.84, 1);
  frameR.scale.set(1.03, 0.84, 1);

  addMesh(headGroup, new THREE.BoxGeometry(0.050, 0.008, 0.010), frameMat, [0, 0.016, 0.197], false);
  const templeGeo = new THREE.BoxGeometry(0.010, 0.009, 0.165);
  const templeL = addMesh(headGroup, templeGeo, frameMat, [0.156, 0.021, 0.106], false);
  const templeR = addMesh(headGroup, templeGeo, frameMat, [-0.156, 0.021, 0.106], false);
  templeL.rotation.y = 0.05;
  templeR.rotation.y = -0.05;

  const lensGeo = new THREE.CircleGeometry(0.067, 20);
  const lensL = addMesh(headGroup, lensGeo, lensMat, [0.075, 0.016, 0.193], false);
  lensL.scale.y = 0.84;
  const lensR = addMesh(headGroup, lensGeo, lensMat, [-0.075, 0.016, 0.193], false);
  lensR.scale.y = 0.84;

  // 鼻子、微笑、脸颊
  const nose = addMesh(headGroup, new THREE.SphereGeometry(0.022, 8, 8), skinShadeMat, [0, -0.036, 0.187], false);
  nose.scale.set(0.9, 1.1, 1.1);

  const smile = addMesh(
    headGroup,
    new THREE.TorusGeometry(0.046, 0.0055, 4, 14, Math.PI * 0.82),
    mouthMat,
    [0, -0.090, 0.181],
    false
  );
  smile.rotation.z = Math.PI;

  const cheekGeo = new THREE.SphereGeometry(0.030, 8, 8);
  const cheekL = addMesh(headGroup, cheekGeo, blushMat, [0.115, -0.045, 0.164], false);
  cheekL.scale.set(1.05, 0.6, 0.35);
  const cheekR = addMesh(headGroup, cheekGeo, blushMat, [-0.115, -0.045, 0.164], false);
  cheekR.scale.set(1.05, 0.6, 0.35);

  // ---------------- 手臂 ----------------
  const armL = new THREE.Group();
  armL.position.set(0.245, 0.48, 0);
  torso.add(armL);
  const armR = new THREE.Group();
  armR.position.set(-0.245, 0.48, 0);
  torso.add(armR);

  const armGeo = new THREE.BoxGeometry(0.092, 0.32, 0.102);
  addMesh(armL, armGeo, skinMat, [0, -0.16, 0]);
  addMesh(armR, armGeo, skinMat, [0, -0.16, 0]);

  const handGeo = new THREE.SphereGeometry(0.046, 8, 8);
  const handL = addMesh(armL, handGeo, skinMat, [0, -0.33, 0]);
  handL.scale.set(0.9, 1.1, 0.9);
  const handR = addMesh(armR, handGeo, skinMat, [0, -0.33, 0]);
  handR.scale.set(0.9, 1.1, 0.9);

  const sleeveGeo = new THREE.BoxGeometry(0.120, 0.165, 0.126);
  const sleeveL = addMesh(armL, sleeveGeo, sleeveMat, [0, -0.085, 0]);
  const sleeveR = addMesh(armR, sleeveGeo, sleeveMat, [0, -0.085, 0]);
  sleeveL.visible = false;
  sleeveR.visible = false;

  // 智能手表（照片同款）
  addMesh(armL, new THREE.BoxGeometry(0.108, 0.048, 0.116), watchBandMat, [0, -0.306, 0]);
  const watchFace = addMesh(armL, new THREE.BoxGeometry(0.058, 0.034, 0.012), watchFaceMat, [0, -0.306, 0.061], false);

  // ---------------- 腿 ----------------
  const legL = new THREE.Group();
  legL.position.set(0.088, 0.70, 0);
  root.add(legL);
  const legR = new THREE.Group();
  legR.position.set(-0.088, 0.70, 0);
  root.add(legR);

  const legGeo = new THREE.BoxGeometry(0.145, 0.60, 0.15);
  addMesh(legL, legGeo, legMat, [0, -0.30, 0]);
  addMesh(legR, legGeo, legMat, [0, -0.30, 0]);

  const shortsGeo = new THREE.BoxGeometry(0.19, 0.22, 0.185);
  const shortsL = addMesh(legL, shortsGeo, pantsMat, [0, -0.085, 0]);
  const shortsR = addMesh(legR, shortsGeo, pantsMat, [0, -0.085, 0]);

  // 白袜
  const sockGeo = new THREE.BoxGeometry(0.151, 0.11, 0.156);
  const sockL = addMesh(legL, sockGeo, sockMat, [0, -0.565, 0]);
  const sockR = addMesh(legR, sockGeo, sockMat, [0, -0.565, 0]);

  // 白球鞋 + 薄荷绿侧条
  const shoeGeo = new THREE.BoxGeometry(0.165, 0.09, 0.275);
  addMesh(legL, shoeGeo, shoeMat, [0, -0.660, 0.035]);
  addMesh(legR, shoeGeo, shoeMat, [0, -0.660, 0.035]);
  const soleGeo = new THREE.BoxGeometry(0.172, 0.028, 0.282);
  addMesh(legL, soleGeo, soleMat, [0, -0.706, 0.035]);
  addMesh(legR, soleGeo, soleMat, [0, -0.706, 0.035]);
  const accentGeo = new THREE.BoxGeometry(0.030, 0.040, 0.190);
  addMesh(legL, accentGeo, accentMat, [0.094, -0.664, 0.030]);
  addMesh(legR, accentGeo, accentMat, [-0.094, -0.664, 0.030]);

  root.traverse((obj) => {
    if (obj.isMesh) obj.castShadow = true;
  });

  // ---------------- 动画状态 ----------------
  let walkPhase = 0;
  let idleTime = 0;
  let bob = 0;
  let blinkTimer = 0;
  let nextBlink = 2.4 + Math.random() * 2;
  let gesture = null;
  let gestureTime = 0;

  function lerpTo(current, target, k) {
    return current + (target - current) * k;
  }

  function playGesture(name, duration = 1.6) {
    gesture = name;
    gestureTime = duration;
  }

  function update(dt, options = {}) {
    const moving = !!options.moving;
    const running = !!options.running;
    const airborne = !!options.airborne;
    const speed = options.speed || 0;
    idleTime += dt;

    if (moving && !airborne) {
      walkPhase += dt * (running ? 13.5 : 8.5) * Math.min(1.35, 0.65 + speed / 7);
    } else {
      walkPhase += dt * 1.2;
    }

    const amp = running ? 0.92 : 0.55;
    const swing = moving && !airborne ? Math.sin(walkPhase) * amp : 0;

    let legLTarget;
    let legRTarget;
    let armLTarget;
    let armRTarget;
    let armLZ = 0.075;
    let armRZ = -0.075;

    if (airborne) {
      legLTarget = -0.55;
      legRTarget = 0.42;
      armLTarget = -1.15;
      armRTarget = -1.0;
    } else {
      legLTarget = swing;
      legRTarget = -swing;
      armLTarget = -swing * 0.85;
      armRTarget = swing * 0.85;
    }

    if (gesture && gestureTime > 0) {
      gestureTime -= dt;
      const t = idleTime;
      if (gesture === 'wave') {
        armRTarget = -2.55;
        armRZ = -0.42 + Math.sin(t * 9) * 0.28;
      } else if (gesture === 'cheer') {
        armLTarget = -2.5;
        armRTarget = -2.5;
        armLZ = 0.5;
        armRZ = -0.5;
      } else if (gesture === 'stretch' || gesture === 'yawn') {
        armLTarget = -2.75;
        armRTarget = -2.75;
        armLZ = 0.62;
        armRZ = -0.62;
      } else if (gesture === 'listen') {
        armRTarget = -1.4;
        armRZ = -0.35;
      }
      if (gestureTime <= 0) gesture = null;
    }

    const k = Math.min(1, dt * (airborne ? 14 : 11));
    legL.rotation.x = lerpTo(legL.rotation.x, legLTarget, k);
    legR.rotation.x = lerpTo(legR.rotation.x, legRTarget, k);
    armL.rotation.x = lerpTo(armL.rotation.x, armLTarget, k);
    armR.rotation.x = lerpTo(armR.rotation.x, armRTarget, k);
    armL.rotation.z = lerpTo(armL.rotation.z, armLZ, k);
    armR.rotation.z = lerpTo(armR.rotation.z, armRZ, k);

    const targetBob = airborne
      ? 0
      : moving
        ? Math.abs(Math.sin(walkPhase * 2)) * (running ? 0.035 : 0.022)
        : Math.sin(idleTime * 1.7) * 0.006;
    bob += (targetBob - bob) * Math.min(1, dt * 10);
    hips.position.y = 0.76 + bob;

    torso.rotation.z = lerpTo(torso.rotation.z, moving && !airborne ? Math.sin(walkPhase) * 0.025 : 0, k);
    torso.rotation.y = lerpTo(torso.rotation.y, moving && !airborne ? Math.sin(walkPhase) * 0.03 : 0, k);

    headGroup.rotation.y = lerpTo(
      headGroup.rotation.y,
      moving ? Math.sin(walkPhase * 0.5) * 0.05 : Math.sin(idleTime * 0.6) * 0.06,
      k
    );
    headGroup.rotation.x = lerpTo(headGroup.rotation.x, airborne ? -0.08 : 0, k);

    // 眨眼
    blinkTimer -= dt;
    if (blinkTimer <= 0 && nextBlink > 0) {
      nextBlink = Math.max(0.02, nextBlink);
    }
    if (nextBlink !== null) {
      nextBlink -= dt;
      if (nextBlink <= 0) {
        blinkTimer = 0.13;
        nextBlink = 2.6 + Math.random() * 2.8;
      }
    }
    const eyeScale = blinkTimer > 0 ? 0.12 : 1;
    eyeL.scale.y = 1.05 * eyeScale;
    eyeR.scale.y = 1.05 * eyeScale;
    pupilL.scale.y = 1.1 * eyeScale;
    pupilR.scale.y = 1.1 * eyeScale;
  }

  // ---------------- 换装 ----------------
  let styleId = 'mint';
  function setStyle(style) {
    if (!style) return;
    styleId = style.id || styleId;
    shirtMat.color.setHex(style.shirt);
    sleeveMat.color.setHex(style.sleeve ?? style.shirt);
    trimMat.color.setHex(style.trim ?? 0xffffff);
    pantsMat.color.setHex(style.pants);
    shoeMat.color.setHex(style.shoe ?? 0xf7f5f0);
    soleMat.color.setHex(style.sole ?? 0xd8d3c6);
    accentMat.color.setHex(style.accent ?? 0x7fc8a3);

    const hasSleeves = !!style.sleeves;
    sleeveL.visible = hasSleeves;
    sleeveR.visible = hasSleeves;

    const longPants = style.pantsLength === 'long';
    shortsL.visible = !longPants;
    shortsR.visible = !longPants;
    sockL.visible = !longPants;
    sockR.visible = !longPants;
    legMat.color.setHex(longPants ? style.pants : SKIN);

    stripes.forEach((s) => { s.visible = !!style.stripes; });
    necker.visible = !!style.necker;
    const showPrint = style.print !== false;
    chestPrint.visible = showPrint;
    logoBar1.visible = !!style.logo && showPrint;
    logoBar2.visible = !!style.logo && showPrint;
    watchFace.visible = style.watch !== false;
  }

  function dispose() {
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    printTexture.dispose();
  }

  return {
    group: root,
    parts: { hips, torso, headGroup, armL, armR, legL, legR, torsoMesh },
    update,
    setStyle,
    playGesture,
    getStyleId: () => styleId,
    dispose,
  };
}
