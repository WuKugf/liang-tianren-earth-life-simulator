// 时间系统：清晨 → 上午 → 中午 → 下午 → 傍晚 → 夜晚，连续推进并按关键帧插值
import * as THREE from 'three';

const KEYFRAMES = [
  {
    h: 0, sky: 0x0a1128, bottom: 0x16224a, fog: 0x101b33, fogDensity: 0.0125,
    ambient: 0x39486f, ambientI: 0.30, sun: 0x7488c8, sunI: 0.23, hemiGround: 0x1a2436,
    star: 1, glow: 0.10, exposure: 0.80, sunGlow: 0x7f96ff,
  },
  {
    h: 4.4, sky: 0x1d2f60, bottom: 0x605c86, fog: 0x3b4266, fogDensity: 0.0115,
    ambient: 0x596798, ambientI: 0.42, sun: 0x9aa8e0, sunI: 0.30, hemiGround: 0x27314a,
    star: 0.55, glow: 0.20, exposure: 0.86, sunGlow: 0xffb08a,
  },
  {
    h: 6.1, sky: 0x6d92c9, bottom: 0xf6b78a, fog: 0xdcb6a4, fogDensity: 0.0095,
    ambient: 0x9aa9c9, ambientI: 0.55, sun: 0xffb27c, sunI: 0.70, hemiGround: 0x6b6250,
    star: 0, glow: 1.15, exposure: 0.96, sunGlow: 0xffb078,
  },
  {
    h: 7.6, sky: 0x7ec2ef, bottom: 0xcfeaff, fog: 0xd2e8f6, fogDensity: 0.0065,
    ambient: 0xd8eaff, ambientI: 0.72, sun: 0xfff0cc, sunI: 1.12, hemiGround: 0x6f7b52,
    star: 0, glow: 0.75, exposure: 1.02, sunGlow: 0xfff0cc,
  },
  {
    h: 12, sky: 0x5fb5ef, bottom: 0xd9f1ff, fog: 0xd9eeff, fogDensity: 0.0050,
    ambient: 0xeaf3ff, ambientI: 0.85, sun: 0xfffaf0, sunI: 1.35, hemiGround: 0x77875a,
    star: 0, glow: 1.25, exposure: 1.05, sunGlow: 0xfffaf0,
  },
  {
    h: 15.4, sky: 0x74b4e7, bottom: 0xe8f2f9, fog: 0xdeeaf2, fogDensity: 0.0058,
    ambient: 0xffe9cc, ambientI: 0.78, sun: 0xffefd2, sunI: 1.15, hemiGround: 0x7d7f55,
    star: 0, glow: 0.85, exposure: 1.02, sunGlow: 0xfff0d0,
  },
  {
    h: 18.2, sky: 0x7c7fb2, bottom: 0xff9c5d, fog: 0xe6a785, fogDensity: 0.0075,
    ambient: 0xffcda4, ambientI: 0.66, sun: 0xff8a4a, sunI: 0.86, hemiGround: 0x7a6250,
    star: 0, glow: 2.2, exposure: 0.99, sunGlow: 0xff8a4a,
  },
  {
    h: 19.4, sky: 0x2c3a6c, bottom: 0x9a5d72, fog: 0x4c4166, fogDensity: 0.0105,
    ambient: 0x6e6f9d, ambientI: 0.50, sun: 0xc46a7c, sunI: 0.38, hemiGround: 0x3a3552,
    star: 0.35, glow: 0.90, exposure: 0.90, sunGlow: 0xff7f7a,
  },
  {
    h: 21, sky: 0x0a1128, bottom: 0x152049, fog: 0x0f1a33, fogDensity: 0.0125,
    ambient: 0x39486f, ambientI: 0.30, sun: 0x7488c8, sunI: 0.23, hemiGround: 0x1a2436,
    star: 0.95, glow: 0.15, exposure: 0.80, sunGlow: 0x7f96ff,
  },
  {
    h: 24, sky: 0x0a1128, bottom: 0x16224a, fog: 0x101b33, fogDensity: 0.0125,
    ambient: 0x39486f, ambientI: 0.30, sun: 0x7488c8, sunI: 0.23, hemiGround: 0x1a2436,
    star: 1, glow: 0.10, exposure: 0.80, sunGlow: 0x7f96ff,
  },
];

export const PHASES = [
  { id: 'night', label: '夜晚', from: 19, to: 24 },
  { id: 'dawn', label: '清晨', from: 5, to: 7 },
  { id: 'morning', label: '上午', from: 7, to: 11 },
  { id: 'noon', label: '中午', from: 11, to: 13 },
  { id: 'afternoon', label: '下午', from: 13, to: 17 },
  { id: 'dusk', label: '傍晚', from: 17, to: 19 },
  { id: 'night2', label: '夜晚', from: 0, to: 5 },
];

export const SPEED_STEPS = [1, 2, 4, 8];

export function phaseLabel(hour) {
  if (hour < 5) return '夜晚';
  if (hour < 7) return '清晨';
  if (hour < 11) return '上午';
  if (hour < 13) return '中午';
  if (hour < 17) return '下午';
  if (hour < 19) return '傍晚';
  return '夜晚';
}

function phaseId(hour) {
  if (hour < 5) return 'night';
  if (hour < 7) return 'dawn';
  if (hour < 11) return 'morning';
  if (hour < 13) return 'noon';
  if (hour < 17) return 'afternoon';
  if (hour < 19) return 'dusk';
  return 'night';
}

function ease(t) {
  // 平滑插值，让天色过渡更自然
  return t * t * (3 - 2 * t);
}

export function createTimeSystem(options = {}) {
  let hour = clampHour(Number.isFinite(options.hour) ? options.hour : 7.4);
  let day = Number.isFinite(options.day) ? Math.max(1, options.day) : 1;
  let speedIndex = 0;
  let baseMinutesPerSecond = 2; // ×1 时：每真实秒 2 分钟（一天约 12 分钟）

  const state = {
    hour,
    phase: phaseLabel(hour),
    isNight: isNightHour(hour),
    day,
    sunColor: new THREE.Color(),
    ambientColor: new THREE.Color(),
    skyColor: new THREE.Color(),
    skyBottomColor: new THREE.Color(),
    fogColor: new THREE.Color(),
    fogDensity: 0.006,
    sunIntensity: 1,
    ambientIntensity: 0.8,
    hemiGroundColor: new THREE.Color(),
    starAlpha: 0,
    glowStrength: 1,
    sunGlowColor: new THREE.Color(),
    exposure: 1,
    sunDirection: new THREE.Vector3(0.4, 0.7, 0.3),
  };

  const tmpColor = new THREE.Color();

  function isNightHour(h) {
    return h >= 19 || h < 5;
  }

  function clampHour(h) {
    let v = h % 24;
    if (v < 0) v += 24;
    return v;
  }

  function lerpColor(target, a, b, t) {
    target.setHex(a);
    tmpColor.setHex(b);
    target.lerp(tmpColor, t);
  }

  function findSegment(h) {
    for (let i = 0; i < KEYFRAMES.length - 1; i += 1) {
      const a = KEYFRAMES[i];
      const b = KEYFRAMES[i + 1];
      if (h >= a.h && h <= b.h) {
        return { a, b, t: ease((h - a.h) / (b.h - a.h || 1)) };
      }
    }
    return { a: KEYFRAMES[KEYFRAMES.length - 1], b: KEYFRAMES[KEYFRAMES.length - 1], t: 0 };
  }

  function refresh() {
    const h = clampHour(hour);
    const seg = findSegment(h);
    const t = seg.t;
    const a = seg.a;
    const b = seg.b;

    lerpColor(state.skyColor, a.sky, b.sky, t);
    lerpColor(state.skyBottomColor, a.bottom, b.bottom, t);
    lerpColor(state.fogColor, a.fog, b.fog, t);
    lerpColor(state.ambientColor, a.ambient, b.ambient, t);
    lerpColor(state.sunColor, a.sun, b.sun, t);
    lerpColor(state.hemiGroundColor, a.hemiGround, b.hemiGround, t);
    lerpColor(state.sunGlowColor, a.sunGlow, b.sunGlow, t);

    state.fogDensity = lerp(a.fogDensity, b.fogDensity, t);
    state.ambientIntensity = lerp(a.ambientI, b.ambientI, t);
    state.sunIntensity = lerp(a.sunI, b.sunI, t);
    state.starAlpha = lerp(a.star, b.star, t);
    state.glowStrength = lerp(a.glow, b.glow, t);
    state.exposure = lerp(a.exposure, b.exposure, t);

    // 太阳方向：6 点东升、12 点最高、18 点西落；夜里用月光方向
    const dayT = ((h - 6) / 12) * Math.PI;
    const elevation = Math.sin(dayT);
    if (elevation > 0.015) {
      state.sunDirection.set(Math.cos(dayT), elevation, -0.32).normalize();
    } else {
      state.sunDirection.set(0.38, 0.66, 0.22).normalize();
    }

    state.hour = h;
    state.phase = phaseLabel(h);
    state.isNight = isNightHour(h);
    state.day = day;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function update(dt) {
    const deltaHours = (dt * baseMinutesPerSecond * SPEED_STEPS[speedIndex]) / 60;
    if (deltaHours <= 0) {
      refresh();
      return;
    }
    hour = clampHour(hour + deltaHours);
    if (hour < 0.001 && deltaHours > 0) {
      // 跨过午夜
    }
    const prev = state.hour;
    if (prev > hour) day += 1;
    refresh();
  }

  function setHour(h, opts = {}) {
    hour = clampHour(h);
    if (opts.day && Number.isFinite(opts.day)) day = Math.max(1, opts.day);
    refresh();
  }

  function addHours(h) {
    hour = clampHour(hour + h);
    refresh();
  }

  function skipToNextMorning(targetHour = 6.5) {
    day += 1;
    hour = clampHour(targetHour);
    refresh();
  }

  function setSpeedIndex(index) {
    speedIndex = Math.max(0, Math.min(SPEED_STEPS.length - 1, index));
  }

  function cycleSpeed() {
    speedIndex = (speedIndex + 1) % SPEED_STEPS.length;
    return SPEED_STEPS[speedIndex];
  }

  function getSpeed() {
    return SPEED_STEPS[speedIndex];
  }

  function formatClock() {
    const h = clampHour(hour);
    const hours = Math.floor(h);
    const minutes = Math.floor((h - hours) * 60);
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function getDay() {
    return day;
  }

  refresh();

  return {
    update,
    getState: () => state,
    setHour,
    addHours,
    skipToNextMorning,
    setSpeedIndex,
    cycleSpeed,
    getSpeed,
    formatClock,
    getDay,
    getHour: () => hour,
    phaseId: () => phaseId(hour),
  };
}
