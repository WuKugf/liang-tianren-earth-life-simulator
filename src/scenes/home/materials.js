// 家场景材质库：全部程序化生成，米白 + 浅木 + 暖黄
import * as THREE from 'three';
import { canvasTexture, seededRandom } from './utils.js';

function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

function grassTexture(repeat = [30, 30], seed = 7) {
  return canvasTexture(512, 512, (c, w, h) => {
    const rand = seededRandom(seed);
    c.fillStyle = '#81bb6f';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i += 1) {
      const x = rand() * w;
      const y = rand() * h;
      const g = 90 + Math.floor(rand() * 60);
      c.fillStyle = `rgba(${g},${140 + Math.floor(rand() * 40)},${g * 0.7},0.18)`;
      c.fillRect(x, y, 2 + rand() * 3, 1 + rand() * 2);
    }
    // 修剪草纹
    for (let i = 0; i < 8; i += 1) {
      c.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(50,100,45,0.05)';
      c.fillRect((w / 8) * i, 0, w / 8, h);
    }
  }, { repeat, aniso: 4 });
}

function pavingTexture(repeat = [2, 2], base = '#dacdb6', line = 'rgba(150,135,110,0.30)') {
  return canvasTexture(512, 512, (c, w, h) => {
    const rand = seededRandom(21);
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i += 1) {
      c.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(120,105,85,0.08)';
      c.fillRect(rand() * w, rand() * h, 3, 3);
    }
    c.strokeStyle = line;
    c.lineWidth = 2;
    for (let i = 0; i <= 4; i += 1) {
      const p = (w / 4) * i;
      c.beginPath(); c.moveTo(p, 0); c.lineTo(p, h); c.stroke();
      c.beginPath(); c.moveTo(0, p); c.lineTo(w, p); c.stroke();
    }
  }, { repeat, aniso: 4 });
}

function woodFloorTexture() {
  return canvasTexture(512, 512, (c, w, h) => {
    const rand = seededRandom(33);
    c.fillStyle = '#d9be98';
    c.fillRect(0, 0, w, h);
    const plank = h / 8;
    for (let i = 0; i < 8; i += 1) {
      c.fillStyle = i % 2 === 0 ? 'rgba(255,240,215,0.22)' : 'rgba(150,105,65,0.10)';
      c.fillRect(0, plank * i, w, plank);
      c.strokeStyle = 'rgba(120,82,50,0.28)';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, plank * i); c.lineTo(w, plank * i); c.stroke();
      // 木纹
      for (let k = 0; k < 12; k += 1) {
        const y = plank * i + rand() * plank;
        c.strokeStyle = `rgba(${120 + Math.floor(rand() * 40)},${85 + Math.floor(rand() * 30)},50,0.12)`;
        c.beginPath();
        c.moveTo(0, y);
        c.bezierCurveTo(w * 0.3, y + rand() * 5 - 2, w * 0.7, y + rand() * 5 - 2, w, y);
        c.stroke();
      }
    }
  }, { repeat: [4, 4], aniso: 4 });
}

function tileTexture() {
  return canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#f1e9da';
    c.fillRect(0, 0, w, h);
    const n = 4;
    const s = w / n;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        c.fillStyle = (i + j) % 2 === 0 ? 'rgba(255,255,255,0.20)' : 'rgba(200,180,150,0.10)';
        c.fillRect(i * s, j * s, s, s);
      }
    }
    c.strokeStyle = 'rgba(160,145,120,0.28)';
    c.lineWidth = 2;
    for (let i = 0; i <= n; i += 1) {
      c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke();
      c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke();
    }
  }, { repeat: [6, 6], aniso: 4 });
}

function rugTexture() {
  return canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#e6d5ba';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(180,150,110,0.55)';
    c.lineWidth = 12;
    c.strokeRect(18, 18, w - 36, h - 36);
    c.strokeStyle = 'rgba(200,170,130,0.45)';
    c.lineWidth = 6;
    c.strokeRect(42, 42, w - 84, h - 84);
    for (let i = 0; i < 8; i += 1) {
      c.fillStyle = 'rgba(190,160,120,0.18)';
      c.fillRect(60, 60 + i * 46, w - 120, 16);
    }
  }, { repeat: [1, 1] });
}

export function createMaterials(THREE_REF) {
  const T = THREE_REF || THREE;
  void T;
  const m = {};

  m.cream = lambert(0xf4eddf);       // 米白墙面
  m.creamWarm = lambert(0xefe2cc);
  m.creamCool = lambert(0xf8f4ea);
  m.trim = lambert(0xfdfbf4);        // 白色线脚 / 窗框
  m.stone = lambert(0xd8cbb4);       // 石材
  m.stoneDark = lambert(0xb8a98f);
  m.wood = lambert(0xc89863);        // 浅木
  m.woodLight = lambert(0xe0bd8c);
  m.woodDark = lambert(0x8a5f3e);
  m.roof = lambert(0xdad3c4);
  m.metal = lambert(0xa4aaad);
  m.metalDark = lambert(0x676d70);
  m.white = lambert(0xfaf8f1);
  m.soil = lambert(0x7a5c3f);
  m.fabricSofa = lambert(0xdfe7da);
  m.fabricSofaDark = lambert(0xc6d3c1);
  m.cushion = lambert(0xf3e7c8);
  m.bedSheet = lambert(0xf5efe2);
  m.blanket = lambert(0xc9ddca);
  m.pillow = lambert(0xfbf7ee);
  m.curtain = lambert(0xe9dcc4);
  m.tvFrame = lambert(0x3a3d40);
  m.tvScreen = new THREE.MeshLambertMaterial({ color: 0x1d2b33, emissive: 0x6fa9c8, emissiveIntensity: 0.25 });
  m.kitchen = lambert(0xece5d8);
  m.kitchenTop = lambert(0xc7bda9);
  m.fridge = lambert(0xf2f3ef);
  m.books = [
    lambert(0xb9564a), lambert(0x4d7a9b), lambert(0xc89b46),
    lambert(0x5c8a6a), lambert(0x8d6d9b), lambert(0xd07a55),
  ];

  m.glass = new THREE.MeshLambertMaterial({
    color: 0xd7eef7, transparent: true, opacity: 0.38,
    emissive: 0xffdba6, emissiveIntensity: 0.02, side: THREE.DoubleSide,
  });
  m.carGlass = new THREE.MeshLambertMaterial({
    color: 0x4b6b75, transparent: true, opacity: 0.62, side: THREE.DoubleSide,
  });

  m.lampGlow = new THREE.MeshLambertMaterial({
    color: 0xfff1cf, emissive: 0xffc873, emissiveIntensity: 0,
  });
  m.lampGlowWarm = new THREE.MeshLambertMaterial({
    color: 0xfff3d8, emissive: 0xffb35c, emissiveIntensity: 0,
  });
  m.water = new THREE.MeshLambertMaterial({
    color: 0x8fc6d8, emissive: 0x2c5a66, emissiveIntensity: 0.25, transparent: true, opacity: 0.9,
  });
  m.waterJet = new THREE.MeshLambertMaterial({
    color: 0xd6f1f7, transparent: true, opacity: 0.55, emissive: 0x9fd8e5, emissiveIntensity: 0.2,
  });

  m.lawnGround = new THREE.MeshLambertMaterial({ map: grassTexture([54, 54], 11) });
  m.lawnYard = new THREE.MeshLambertMaterial({ map: grassTexture([9, 9], 23) });
  m.paving = new THREE.MeshLambertMaterial({ map: pavingTexture([26, 2]) });
  m.pavingYard = new THREE.MeshLambertMaterial({ map: pavingTexture([3, 3], '#e0d4bf') });
  m.pavingLight = new THREE.MeshLambertMaterial({ map: pavingTexture([2, 2], '#eee5d5') });
  m.road = new THREE.MeshLambertMaterial({
    color: 0xb4b1a9,
    map: canvasTexture(256, 256, (c, w, h) => {
      const rand = seededRandom(15);
      c.fillStyle = '#b6b3aa';
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 2400; i += 1) {
        c.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(70,68,62,0.10)';
        c.fillRect(rand() * w, rand() * h, 2, 2);
      }
    }, { repeat: [40, 2] }),
  });
  m.floorWood = new THREE.MeshLambertMaterial({ map: woodFloorTexture() });
  m.floorTile = new THREE.MeshLambertMaterial({ map: tileTexture() });
  m.rug = new THREE.MeshLambertMaterial({ map: rugTexture() });

  m.trunk = lambert(0x8a6746);
  m.leaf = lambert(0x5f9f54);
  m.leafLight = lambert(0x77b466);
  m.leafDark = lambert(0x4b8144);
  m.hedge = lambert(0x5c9452);
  m.flower = [
    lambert(0xf0a7b6), lambert(0xf6d06a), lambert(0xf2f0e2), lambert(0xe8836c), lambert(0xb59ed6),
  ];
  m.carBody = new THREE.MeshLambertMaterial({ color: 0xe9eef0 });
  m.carDark = lambert(0x3c444a);
  m.carLight = lambert(0xfff2c4);
  m.accent = lambert(0xf0b45c);
  m.sign = new THREE.MeshLambertMaterial({ color: 0xfdfaf0 });

  return m;
}
