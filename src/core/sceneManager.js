// 场景管理器：动态加载场景模块，缺失时展示「场景构建中」占位而不崩溃
import * as THREE from 'three';

export const SCENE_DEFS = {
  world: {
    id: 'world',
    title: '阳光生活区',
    defaultMeta: {
      id: 'world',
      title: '阳光生活区',
      spawn: { x: 0, z: 12, yaw: Math.PI },
      bounds: { minX: -150, maxX: 150, minZ: -150, maxZ: 150 },
    },
  },
  school: {
    id: 'school',
    title: '玉东新区金榜小学',
    defaultMeta: {
      id: 'school',
      title: '玉东新区金榜小学',
      spawn: { x: 0, z: 0, yaw: 0 },
      bounds: { minX: -150, maxX: 150, minZ: -150, maxZ: 150 },
    },
  },
  home: {
    id: 'home',
    title: '奥园中央墅',
    defaultMeta: {
      id: 'home',
      title: '奥园中央墅',
      spawn: { x: 0, z: 0, yaw: 0 },
      bounds: { minX: -80, maxX: 80, minZ: -80, maxZ: 80 },
    },
  },
};

const LOADERS = {
  world: () => import('../world/openWorld.js'),
  school: () => import(`../scenes/school/index.js?v=${Date.now()}`),
  home: () => import(`../scenes/home/index.js?v=${Date.now()}`),
};

function makeCanvasSign(text, sub) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffdf6';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#2f8f6e';
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillStyle = '#1f312c';
  ctx.font = 'bold 58px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 116);
  ctx.fillStyle = '#526a62';
  ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(sub, 256, 176);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function buildPlaceholder(def) {
  const group = new THREE.Group();
  group.name = 'placeholder-scene';

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(34, 48),
    new THREE.MeshLambertMaterial({ color: 0xeceadf })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(16.5, 17, 64),
    new THREE.MeshBasicMaterial({ color: 0xf3c94e, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.012;
  group.add(ring);

  const signTex = makeCanvasSign(def.title, '场景构建中 · 敬请期待');
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 3.6),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: false })
  );
  sign.position.set(0, 2.6, -6.2);
  sign.rotation.y = Math.PI;
  group.add(sign);

  const poleMat = new THREE.MeshLambertMaterial({ color: 0x5cc39a });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.4, 8), poleMat);
  pole.position.set(-3.2, 1.2, -6.2);
  pole.castShadow = true;
  group.add(pole);
  const pole2 = pole.clone();
  pole2.position.x = 3.2;
  group.add(pole2);

  const coneMat = new THREE.MeshLambertMaterial({ color: 0xf0a23c });
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.7, 8), coneMat);
    cone.position.set(Math.cos(angle) * 11, 0.35, Math.sin(angle) * 11);
    cone.castShadow = true;
    group.add(cone);
  }

  const clock = new THREE.Clock();

  function update() {
    const t = clock.getElapsedTime();
    ring.scale.setScalar(1 + Math.sin(t * 1.2) * 0.015);
  }

  function dispose() {
    group.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    signTex.dispose();
  }

  return { group, update, interactables: [], dispose };
}

export function createSceneManager(options) {
  const {
    scene, time, player, ui,
    onSceneChanged, onInteractables, onColliders,
  } = options;

  let currentId = null;
  let currentGroup = null;
  let currentModule = null;
  let currentMeta = null;
  let currentReady = false;
  let currentTitle = '';
  let interactables = [];
  let colliders = [];
  let loadToken = 0;
  let elapsed = 0;
  const readyMap = { world: null, school: null, home: null };

  const ctx = {
    THREE,
    scene,
    time,
    player,
    registerInteractable(item) {
      if (item) interactables.push(item);
      return item;
    },
    registerCollider(item) {
      if (item) colliders.push(item);
      return item;
    },
  };

  function notifyUI() {
    if (ui && ui.setScenes) {
      ui.setScenes(currentId, readyMap, currentTitle, currentReady);
    }
  }

  function disposeCurrent() {
    if (currentModule) {
      try {
        if (typeof currentModule.dispose === 'function') currentModule.dispose();
      } catch (err) {
        console.warn('[场景] dispose 失败', err);
      }
    }
    if (currentGroup) {
      scene.remove(currentGroup);
      currentGroup.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
    }
    currentGroup = null;
    currentModule = null;
    currentMeta = null;
    interactables = [];
    colliders = [];
    if (onInteractables) onInteractables([]);
    if (onColliders) onColliders([]);
  }

  async function switchTo(id, opts = {}) {
    if (!SCENE_DEFS[id]) return null;
    if (currentId === id && !opts.force) return currentMeta;

    const token = ++loadToken;
    const def = SCENE_DEFS[id];
    const showLoading = !opts.silent;
    if (ui && ui.setLoading && showLoading) ui.setLoading(true, `正在加载「${def.title}」…`);

    disposeCurrent();
    currentId = id;
    currentTitle = def.title;
    notifyUI();

    let module = null;
    let ready = true;
    try {
      module = await LOADERS[id]();
    } catch (err) {
      ready = false;
      module = null;
      console.info(`[场景] ${def.title} 尚未就绪（场景构建中）`, err && err.message ? err.message : err);
    }

    if (token !== loadToken) return null; // 已有更新的切换请求

    if (module && typeof module.createScene === 'function') {
      try {
        const result = await Promise.resolve(module.createScene(ctx));
        if (token !== loadToken) return null;
        if (result && result.group) {
          currentGroup = result.group;
          if (!currentGroup.parent) scene.add(currentGroup);
        } else {
          currentGroup = new THREE.Group();
          scene.add(currentGroup);
        }
        currentModule = result || {};
        if (Array.isArray(result && result.interactables)) {
          interactables = interactables.concat(result.interactables);
        }
        currentMeta = mergeMeta(def, module.meta);
        currentReady = true;
      } catch (err) {
        console.error('[场景] 创建失败，切换为占位场景', err);
        ready = false;
        currentReady = false;
        buildPlaceholderFor(def);
      }
    } else {
      currentReady = false;
      buildPlaceholderFor(def);
    }

    readyMap[id] = currentReady;

    if (token !== loadToken) return null;

    if (ui && ui.setLoading) ui.setLoading(false);
    notifyUI();

    if (ui && ui.toast && currentReady) {
      ui.toast(`已进入「${def.title}」`, 'good');
    } else if (ui && ui.toast && !opts.silent) {
      ui.toast(`「${def.title}」正在构建中，先留在阳光生活区吧`, 'warm');
    }

    if (onInteractables) onInteractables(interactables);
    if (onColliders) onColliders(colliders);
    if (onSceneChanged) {
      onSceneChanged({
        id,
        meta: currentMeta,
        ready: currentReady,
        placeholder: !currentReady,
        title: def.title,
        savedSpawn: opts.savedSpawn || null,
      });
    }

    return currentMeta;
  }

  function buildPlaceholderFor(def) {
    const ph = buildPlaceholder(def);
    currentGroup = ph.group;
    scene.add(currentGroup);
    currentModule = ph;
    currentMeta = mergeMeta(def, null);
    // 占位场景把可行走范围收窄，避免走到虚空
    currentMeta.bounds = { minX: -30, maxX: 30, minZ: -30, maxZ: 30 };
  }

  function mergeMeta(def, moduleMeta) {
    const base = JSON.parse(JSON.stringify(def.defaultMeta));
    if (!moduleMeta) return base;
    return {
      ...base,
      ...moduleMeta,
      spawn: { ...base.spawn, ...(moduleMeta.spawn || {}) },
      bounds: { ...base.bounds, ...(moduleMeta.bounds || {}) },
    };
  }

  function update(dt) {
    elapsed += dt;
    if (currentModule && typeof currentModule.update === 'function') {
      try {
        currentModule.update(dt, elapsed);
      } catch (err) {
        console.error('[场景] update 出错', err);
      }
    }
  }

  function getInfo() {
    return {
      id: currentId,
      meta: currentMeta,
      ready: currentReady,
      title: currentTitle,
      interactables,
      colliders,
      elapsed,
    };
  }

  function dispose() {
    disposeCurrent();
  }

  return {
    switchTo,
    update,
    getInfo,
    dispose,
    readyMap,
  };
}
