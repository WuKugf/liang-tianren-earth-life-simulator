// 程序化音频：浏览器 WebAudio 实时合成，不依赖任何外部音频文件
// 背景音乐（白天 / 夜晚）、环境声（鸟鸣 / 虫鸣 / 夜市人声）、以及逐个音效
export function createAudio() {
  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let ambBus = null;
  let noiseBuffer = null;

  let unlocked = false;
  let muted = false;
  let musicOn = false;
  let musicTimer = 0;
  let musicStep = 0;
  let ambTimer = 0;
  let ambStep = 0;
  let mood = { night: false, market: false };

  const DAY_LEAD = [523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880.0, 783.99, 659.25, 523.25, 587.33, 659.25];
  const NIGHT_LEAD = [392.0, 440.0, 523.25, 440.0, 349.03, 523.25, 587.33, 523.25, 440.0, 392.0, 349.03, 440.0];
  const PAD_DAY = [261.63, 329.63, 392.0, 329.63];
  const PAD_NIGHT = [220.0, 261.63, 329.63, 261.63];

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (err) {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.16;
    musicBus.connect(master);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.55;
    sfxBus.connect(master);

    ambBus = ctx.createGain();
    ambBus.gain.value = 0.3;
    ambBus.connect(master);

    // 预生成一段白噪声，用于脚步、风声、球鞋摩擦等
    const len = Math.floor(ctx.sampleRate * 1.2);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function tone(opts) {
    if (!ctx || !unlocked) return;
    const { freq = 440, dur = 0.2, type = 'sine', vol = 0.35, slide = 0, delay = 0, bus = sfxBus } = opts || {};
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(bus || sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
  }

  function noise(opts) {
    if (!ctx || !unlocked || !noiseBuffer) return;
    const { dur = 0.25, vol = 0.2, f1 = 900, f2 = 300, q = 1, delay = 0, bus = sfxBus } = opts || {};
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(40, f1), t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(bus || sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  const SFX = {
    ui: () => tone({ freq: 660, dur: 0.06, type: 'triangle', vol: 0.22 }),
    hover: () => tone({ freq: 880, dur: 0.04, type: 'sine', vol: 0.12 }),
    footstep: () => noise({ dur: 0.11, vol: 0.1, f1: 320, f2: 90, q: 0.8 }),
    jump: () => {
      tone({ freq: 420, dur: 0.18, type: 'sine', vol: 0.2, slide: 220 });
      noise({ dur: 0.14, vol: 0.08, f1: 500, f2: 200 });
    },
    land: () => noise({ dur: 0.18, vol: 0.16, f1: 260, f2: 70 }),
    ropeTick: () => {
      tone({ freq: 520, dur: 0.07, type: 'square', vol: 0.16 });
      tone({ freq: 780, dur: 0.05, type: 'square', vol: 0.08, delay: 0.02 });
    },
    ropePerfect: () => {
      tone({ freq: 660, dur: 0.16, type: 'triangle', vol: 0.24 });
      tone({ freq: 990, dur: 0.2, type: 'triangle', vol: 0.18, delay: 0.05 });
    },
    ballShoot: () => noise({ dur: 0.2, vol: 0.18, f1: 280, f2: 880, q: 0.6 }),
    ballBounce: () => tone({ freq: 190, dur: 0.1, type: 'sine', vol: 0.2, slide: -60 }),
    swish: () => {
      noise({ dur: 0.22, vol: 0.12, f1: 1400, f2: 500, q: 2 });
      tone({ freq: 880, dur: 0.1, type: 'sine', vol: 0.2, delay: 0.1 });
      tone({ freq: 1320, dur: 0.14, type: 'sine', vol: 0.16, delay: 0.2 });
    },
    tvOn: () => {
      noise({ dur: 0.3, vol: 0.16, f1: 1200, f2: 400, q: 1.4 });
      tone({ freq: 440, dur: 0.4, type: 'sawtooth', vol: 0.06, slide: -80 });
    },
    tvOff: () => tone({ freq: 320, dur: 0.24, type: 'sawtooth', vol: 0.12, slide: -200 }),
    dialog: () => tone({ freq: 520, dur: 0.05, type: 'triangle', vol: 0.16 }),
    wave: () => tone({ freq: 760, dur: 0.12, type: 'sine', vol: 0.16, slide: 120 }),
    coin: () => {
      tone({ freq: 980, dur: 0.1, type: 'triangle', vol: 0.2 });
      tone({ freq: 1320, dur: 0.14, type: 'triangle', vol: 0.16, delay: 0.06 });
    },
    complete: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone({ freq: f, dur: 0.26, type: 'triangle', vol: 0.22, delay: i * 0.13 });
      });
    },
    whoosh: () => noise({ dur: 0.3, vol: 0.16, f1: 200, f2: 900, q: 0.5 }),
    door: () => {
      tone({ freq: 220, dur: 0.22, type: 'square', vol: 0.1, slide: 60 });
      noise({ dur: 0.2, vol: 0.1, f1: 340, f2: 120 });
    },
  };

  function play(name) {
    if (!unlocked || muted) return;
    const fn = SFX[name];
    if (fn) fn();
  }

  function pluck(freq, delay, vol, type) {
    tone({ freq, dur: 0.36, type: type || 'triangle', vol, delay, bus: musicBus });
  }

  function bgmStep() {
    const night = mood.night;
    const lead = night ? NIGHT_LEAD : DAY_LEAD;
    const pad = night ? PAD_NIGHT : PAD_DAY;
    musicStep = (musicStep + 1) % lead.length;
    const note = lead[musicStep];
    pluck(note, 0, 0.6, 'triangle');
    pluck(note * 0.5, 0.02, 0.22, 'sine');
    if (musicStep % 2 === 0) {
      const chord = pad[(musicStep / 2) % pad.length];
      pluck(chord, 0.12, 0.18, 'sine');
      pluck(chord * 1.25, 0.2, 0.12, 'sine');
    }
    if (mood.market && musicStep % 4 === 1) {
      pluck(note * 1.5, 0.22, 0.2, 'sine');
    }
  }

  function ambience() {
    ambStep = (ambStep + 1) % 8;
    if (mood.market) {
      // 夜市：锅铲、吆喝、轻快的铃铛
      noise({ dur: 0.5, vol: 0.06, f1: 620 + Math.random() * 260, f2: 360, q: 0.7, bus: ambBus });
      if (ambStep % 3 === 0) tone({ freq: 880, dur: 0.18, type: 'sine', vol: 0.09, bus: ambBus });
      if (ambStep % 4 === 2) tone({ freq: 660, dur: 0.24, type: 'triangle', vol: 0.08, bus: ambBus, delay: 0.18 });
      return;
    }
    if (mood.night) {
      // 虫鸣
      tone({ freq: 3200 + Math.random() * 900, dur: 0.05, type: 'square', vol: 0.05, bus: ambBus });
      tone({ freq: 2900 + Math.random() * 700, dur: 0.05, type: 'square', vol: 0.04, bus: ambBus, delay: 0.16 });
    } else {
      // 白天鸟鸣 / 微风
      if (ambStep % 2 === 0) {
        tone({ freq: 1500 + Math.random() * 700, dur: 0.14, type: 'sine', vol: 0.07, bus: ambBus, slide: 420 });
        tone({ freq: 1900 + Math.random() * 700, dur: 0.1, type: 'sine', vol: 0.05, bus: ambBus, delay: 0.14, slide: 300 });
      }
      noise({ dur: 0.8, vol: 0.05, f1: 240, f2: 160, q: 0.4, bus: ambBus });
    }
  }

  function unlock() {
    const c = ensure();
    if (!c) return false;
    if (c.state === 'suspended') c.resume();
    unlocked = true;
    musicOn = true;
    musicTimer = 0;
    ambTimer = 1;
    return true;
  }

  function update(dt) {
    if (!unlocked || muted || !ctx) return;
    if (musicOn) {
      musicTimer -= dt;
      if (musicTimer <= 0) {
        bgmStep();
        musicTimer = mood.night ? 1.45 : 1.2;
      }
    }
    ambTimer -= dt;
    if (ambTimer <= 0) {
      ambience();
      ambTimer = mood.market ? 1.1 + Math.random() * 1.4 : 2.0 + Math.random() * 2.4;
    }
  }

  function setMood(next) {
    mood = { night: !!next.night, market: !!next.market };
  }

  function setMuted(value) {
    muted = !!value;
    if (master) {
      const target = muted ? 0 : 0.9;
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.2);
      } catch (err) {
        master.gain.value = target;
      }
    }
    return muted;
  }

  function toggleMuted() {
    return setMuted(!muted);
  }

  function startBgm() {
    musicOn = true;
    musicTimer = 0;
  }

  function stopBgm() {
    musicOn = false;
  }

  function dispose() {
    stopBgm();
    if (ctx) {
      try { ctx.close(); } catch (err) { /* ignore */ }
    }
    ctx = null;
    unlocked = false;
  }

  return {
    unlock,
    update,
    play,
    setMood,
    setMuted,
    toggleMuted,
    startBgm,
    stopBgm,
    isMuted: () => muted,
    isUnlocked: () => unlocked,
    dispose,
  };
}
