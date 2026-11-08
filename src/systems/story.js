// 剧情模式：跟着添任的一天完成 7 个生活任务；普通模式自由探索
const STEPS = [
  {
    id: 'greet',
    title: '和街坊打个招呼',
    task: '镇上的居民都在散步，靠近 <b>NPC</b> 按 <b>E</b> 聊两句。',
    hint: '提示：王婶在十字街，小雨在广场。',
  },
  {
    id: 'jump',
    title: '去训练场热热身',
    task: '在运动训练场跳绳，累计完成 <b>10 个</b>。',
    hint: '提示：生活区东侧，黄色跳绳垫。',
  },
  {
    id: 'study',
    title: '认真学习一会儿',
    task: '去金榜小学的教室，或家里的书桌 <b>学习 1 小时</b>。',
    hint: '提示：按 2 去学校，按 3 回家。',
  },
  {
    id: 'basket',
    title: '投进两个球',
    task: '在篮球架完成投篮训练，累计命中 <b>2 球</b>。',
    hint: '提示：按住空格蓄力，松开出手。',
  },
  {
    id: 'market',
    title: '逛一逛十字街夜市',
    task: '傍晚去 <b>十字街</b>（生活区西边的十字路口），走进夜市的范围。',
    hint: '提示：沿主路一直往西走，看见牌坊就到了；按 T 可加速到傍晚。',
  },
  {
    id: 'tv',
    title: '回家看会儿电视',
    task: '回到奥园中央墅，在客厅茶几旁按 <b>E</b> 看电视。',
    hint: '提示：电视在沙发北面，靠近茶几就能互动。',
  },
  {
    id: 'sleep',
    title: '好好睡一觉',
    task: '回卧室睡觉，结束这一天。',
    hint: '提示：卧室在二楼，靠近床按 E。',
  },
];

const MARKET = { x: -55, z: -20 };

export function createStory({ hud, audio, initialStep = 0, initialMode = 'story', onChange } = {}) {
  let mode = initialMode === 'normal' ? 'normal' : 'story';
  let stepIndex = Math.max(0, Math.min(STEPS.length, Number(initialStep) || 0));
  let progress = 0;
  let marketVisited = false;
  let lastTaskText = '';

  function step() {
    return STEPS[stepIndex] || null;
  }

  function total() {
    return STEPS.length;
  }

  function updateCard() {
    if (!hud) return;
    if (mode !== 'story' || stepIndex >= STEPS.length) {
      hud.hideStory();
      return;
    }
    const s = step();
    hud.showStory({
      index: stepIndex,
      total: STEPS.length,
      title: s.title,
      task: s.task + (progress > 0 ? ` <b>（${progress}）</b>` : ''),
      hint: s.hint,
    });
    lastTaskText = s.task;
  }

  function advance(reason) {
    if (mode !== 'story') return;
    if (stepIndex >= STEPS.length) return;
    const done = step();
    stepIndex += 1;
    progress = 0;
    marketVisited = false;
    if (audio) audio.play('complete');
    if (hud) {
      hud.toast(`任务完成：${done.title}`, 'good');
      if (reason) hud.toast(reason, 'warm');
    }
    if (stepIndex >= STEPS.length) {
      if (hud) hud.toast('今天的故事完成了：添任安稳地睡去，明天见。', 'good');
      updateCard();
      if (onChange) onChange(getState());
      return;
    }
    updateCard();
    if (onChange) onChange(getState());
  }

  function notify(type, payload = {}) {
    if (mode !== 'story' || stepIndex >= STEPS.length) return;
    const current = step();
    if (!current) return;
    if (current.id === 'greet' && type === 'talk') {
      advance(`${payload.name || '街坊'}：「今天也要好好生活呀。」`);
      return;
    }
    if (current.id === 'jump' && type === 'jump') {
      progress += Number(payload.count) || 0;
      if (progress >= 10) advance('身体活动开了，一整天都有精神。');
      else updateCard();
      return;
    }
    if (current.id === 'study' && type === 'study') {
      advance('认真学习了一小时，专注力 +1。');
      return;
    }
    if (current.id === 'basket' && type === 'basket') {
      progress += Number(payload.makes) || 0;
      if (progress >= 2) advance('手感回来了，两个球稳稳落袋。');
      else updateCard();
      return;
    }
    if (current.id === 'tv' && type === 'tv') {
      advance('客厅里亮着电视的光，很安心。');
      return;
    }
    if (current.id === 'sleep' && type === 'sleep') {
      advance('今天过得很充实，晚安。');
      return;
    }
  }

  function update(dt, context = {}) {
    if (mode !== 'story' || stepIndex >= STEPS.length) return;
    const current = step();
    if (!current || current.id !== 'market') return;
    const scene = context.scene;
    const hour = context.hour || 0;
    const pos = context.position;
    if (!pos) return;
    const dx = pos.x - MARKET.x;
    const dz = pos.z - MARKET.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const evening = hour >= 17 || hour < 0.5;
    if (scene === 'world' && distance < 13 && evening) {
      if (!marketVisited) {
        marketVisited = true;
        // 再停留一小会儿才完成任务，避免一闪而过
        progress = 1;
        updateCard();
      }
      progress += dt;
      if (progress >= 4.0) {
        advance('十字街的灯亮起来了，烟火气扑面而来。');
      }
    }
  }

  function setMode(nextMode, { reset = false } = {}) {
    mode = nextMode === 'normal' ? 'normal' : 'story';
    if (reset) {
      stepIndex = 0;
      progress = 0;
      marketVisited = false;
    }
    updateCard();
    if (onChange) onChange(getState());
  }

  function restore(nextStep) {
    stepIndex = Math.max(0, Math.min(STEPS.length, Number(nextStep) || 0));
    progress = 0;
    marketVisited = false;
    updateCard();
  }

  function reset() {
    stepIndex = 0;
    progress = 0;
    marketVisited = false;
    updateCard();
  }

  function getState() {
    return { mode, step: stepIndex, total: STEPS.length, progress: Math.round(progress * 10) / 10 };
  }

  updateCard();

  return {
    notify,
    update,
    setMode,
    restore,
    reset,
    getState,
    isStory: () => mode === 'story',
    steps: STEPS,
  };
}
