// 存档系统：localStorage 记录时间、位置、服装、运动成绩
const SAVE_KEY = 'liangtianren-earth-life-simulator-v1';

const DEFAULT_DATA = {
  hour: 7.4,
  day: 1,
  scene: 'world',
  position: { x: 0, z: 12, yaw: Math.PI },
  outfit: 'mint',
  mode: 'story',
  storyStep: 0,
  records: {
    jump: { bestCount: 0, bestCombo: 0 },
    basket: { bestScore: 0, bestShots: 0 },
  },
  updatedAt: 0,
};

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return cloneDefault();
    const data = JSON.parse(raw);
    return {
      ...cloneDefault(),
      ...data,
      position: { ...cloneDefault().position, ...(data.position || {}) },
      records: {
        ...cloneDefault().records,
        ...(data.records || {}),
        jump: { ...cloneDefault().records.jump, ...((data.records || {}).jump || {}) },
        basket: { ...cloneDefault().records.basket, ...((data.records || {}).basket || {}) },
      },
    };
  } catch (err) {
    console.warn('[存档] 读取失败，使用初始存档', err);
    return cloneDefault();
  }
}

export function saveGame(data) {
  try {
    data.updatedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('[存档] 写入失败', err);
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn('[存档] 清除失败', err);
  }
}

export function createAutoSaver(getData, { intervalMs = 6000 } = {}) {
  let timer = null;
  let dirty = false;

  function markDirty() {
    dirty = true;
  }

  function start() {
    if (timer) return;
    timer = setInterval(() => {
      if (!dirty) return;
      dirty = false;
      saveGame(getData());
    }, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function flush() {
    dirty = false;
    return saveGame(getData());
  }

  start();

  return { markDirty, stop, flush };
}
