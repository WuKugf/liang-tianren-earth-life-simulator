// 建筑群装配：把各立面构件按材质合并成少量网格
import * as THREE from 'three';
import { Batch, canvasTexture } from './utils.js';
import { BUILDINGS } from '../../data/schoolLayout.js';
import { buildTeaching } from './teaching.js';
import { buildAdmin, buildGym } from './special.js';
import { localToWorld, makeFrames } from './facade.js';

export function createBuildings(mats, addCollider, group) {
  const batches = {
    wall: new Batch(),
    glass: new Batch(),
    glassCurtain: new Batch(),
    accent: new Batch(),
    rail: new Batch(),
    slab: new Batch(),
    roof: new Batch(),
    plinth: new Batch(),
    parapet: new Batch(),
    canopy: new Batch(),
  };

  const ctx = { batches, addCollider, group, mats };
  const entries = [];

  BUILDINGS.forEach((b) => {
    if (b.kind === 'teaching') {
      entries.push(buildTeaching(b, ctx));
    } else if (b.kind === 'admin') {
      entries.push(buildAdmin(b, ctx));
    } else if (b.kind === 'gym') {
      entries.push(buildGym(b, ctx));
    }
  });

  // 楼名标牌（教学楼：入口上方）
  BUILDINGS.filter((b) => b.kind === 'teaching').forEach((b) => {
    const fr = makeFrames(b);
    const cs = b.corridorSide === 'south' ? 1 : -1;
    const face = cs === 1 ? fr.south : fr.north;
    const p = localToWorld(face, 0, 0.35);
    const tex = canvasTexture(512, 128, (c, w, h) => {
      c.fillStyle = '#b03a2e';
      c.fillRect(0, 0, w, h);
      c.strokeStyle = '#f4d58d';
      c.lineWidth = 5;
      c.strokeRect(6, 6, w - 12, h - 12);
      c.fillStyle = '#fbe6a2';
      c.font = 'bold 68px "Microsoft YaHei", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(b.name, w / 2, h / 2 + 3);
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshLambertMaterial({ map: tex }));
    mesh.position.set(p.x, 3.9, p.z);
    mesh.rotation.y = face.ry;
    group.add(mesh);
  });

  const materialMap = [
    ['wall', mats.wall, true],
    ['glass', mats.glass, false],
    ['glassCurtain', mats.glassCurtain, false],
    ['accent', mats.accent, true],
    ['rail', mats.rail, true],
    ['slab', mats.floor, true],
    ['roof', mats.roof, true],
    ['plinth', mats.plinth, true],
    ['parapet', mats.parapet, true],
    ['canopy', mats.canopy, true],
  ];

  materialMap.forEach(([key, mat, cast]) => {
    const mesh = batches[key].build(mat, { castShadow: cast, receiveShadow: true });
    if (mesh) {
      mesh.name = `school-${key}`;
      group.add(mesh);
    }
  });

  return entries;
}
