// 校园共享材质库（材质复用，全部为低开销 Lambert，便于集显 60fps）
import * as THREE from 'three';

export function createMaterials() {
  const M = {
    // 建筑主体：白墙 + 暖黄色竖向装饰条
    wall: new THREE.MeshLambertMaterial({ color: 0xf2efe6 }),
    wallSide: new THREE.MeshLambertMaterial({ color: 0xe4dfd2 }),
    accent: new THREE.MeshLambertMaterial({ color: 0xe8b455 }),
    accentDeep: new THREE.MeshLambertMaterial({ color: 0xd99b33 }),
    roof: new THREE.MeshLambertMaterial({ color: 0xb9b5aa }),
    parapet: new THREE.MeshLambertMaterial({ color: 0xeae6da }),
    plinth: new THREE.MeshLambertMaterial({ color: 0xbdb6a6 }),

    // 玻璃（夜晚窗户发光）
    glass: new THREE.MeshLambertMaterial({
      color: 0x9dc6d8,
      emissive: 0xffcf7a,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.72,
    }),
    glassCurtain: new THREE.MeshLambertMaterial({
      color: 0x8fb8cc,
      emissive: 0xffd489,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.62,
    }),

    // 连廊 / 栏杆 / 金属
    canopy: new THREE.MeshLambertMaterial({ color: 0xe7e3d7 }),
    rail: new THREE.MeshLambertMaterial({ color: 0xe8b455 }),
    railDark: new THREE.MeshLambertMaterial({ color: 0xb08a3c }),
    metal: new THREE.MeshLambertMaterial({ color: 0x9aa0a3 }),
    metalDark: new THREE.MeshLambertMaterial({ color: 0x5d6467 }),

    // 地面
    grass: new THREE.MeshLambertMaterial({ color: 0x6fa356 }),
    plaza: new THREE.MeshLambertMaterial({ color: 0xd9d2c4 }),
    path: new THREE.MeshLambertMaterial({ color: 0xc4bfb1 }),
    asphalt: new THREE.MeshLambertMaterial({ color: 0x9c9a94 }),
    trackRed: new THREE.MeshLambertMaterial({ color: 0xb8483a }),
    pitch: new THREE.MeshLambertMaterial({ color: 0x3f8f45 }),
    courtBlue: new THREE.MeshLambertMaterial({ color: 0x2f7f86 }),
    whiteLine: new THREE.MeshLambertMaterial({ color: 0xf2f2ee }),

    // 树木
    trunk: new THREE.MeshLambertMaterial({ color: 0x7a5a3c }),
    leaf: new THREE.MeshLambertMaterial({ color: 0x4f8f47 }),
    leafLight: new THREE.MeshLambertMaterial({ color: 0x62a457 }),

    // 室内
    floor: new THREE.MeshLambertMaterial({ color: 0xd7cdb8 }),
    floorTile: new THREE.MeshLambertMaterial({ color: 0xe6e1d3 }),
    ceiling: new THREE.MeshLambertMaterial({ color: 0xf6f4ee }),
    partition: new THREE.MeshLambertMaterial({ color: 0xefece2 }),
    deskTop: new THREE.MeshLambertMaterial({ color: 0xd6b382 }),
    deskLeg: new THREE.MeshLambertMaterial({ color: 0x8d8f92 }),
    board: new THREE.MeshLambertMaterial({ color: 0x2f5d3f }),
    boardFrame: new THREE.MeshLambertMaterial({ color: 0xcfae74 }),
    podium: new THREE.MeshLambertMaterial({ color: 0xb98b56 }),
    flagRed: new THREE.MeshLambertMaterial({ color: 0xd23b32, side: THREE.DoubleSide }),
    flagYellow: new THREE.MeshLambertMaterial({ color: 0xf2c934 }),
    banner: new THREE.MeshLambertMaterial({ color: 0xc0392b, side: THREE.DoubleSide }),
    // 教室 / 连廊灯具（夜晚自发光）
    lampPanel: new THREE.MeshLambertMaterial({
      color: 0xf3f2ea,
      emissive: 0xfff0c8,
      emissiveIntensity: 0,
    }),
    lampBulb: new THREE.MeshLambertMaterial({
      color: 0xf6f2e2,
      emissive: 0xffe6a8,
      emissiveIntensity: 0.2,
    }),

    // 器材
    hoop: new THREE.MeshLambertMaterial({ color: 0xd9532f }),
    backboard: new THREE.MeshLambertMaterial({ color: 0xf7f7f2, side: THREE.DoubleSide }),
    goalPost: new THREE.MeshLambertMaterial({ color: 0xf3f3ee }),
    net: new THREE.MeshLambertMaterial({ color: 0xf0f0ea, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),

    // 校门
    gateStone: new THREE.MeshLambertMaterial({ color: 0xd8d0bd }),
    gateSign: new THREE.MeshLambertMaterial({ color: 0xb03a2e }),
    fence: new THREE.MeshLambertMaterial({ color: 0xdcd8cc }),
  };

  // 记录需要在夜间切换发光的材质
  M.__nightGlow = [M.glass, M.glassCurtain, M.lampPanel];

  return M;
}
