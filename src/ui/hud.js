// HUD：顶部信息栏、场景切换、提示、Toast、状态卡、帮助面板
export function createHUD({ root, callbacks = {} }) {
  root.innerHTML = `
    <div class="hud-top">
      <div class="brand-card glass">
        <span class="brand-dot"></span>
        <div><b>梁添任的地球生活模拟器</b><small>玉林 · 玉东新区 <span class="mode-badge" data-mode>剧情模式</span></small></div>
      </div>
      <div class="clock-card glass">
        <div class="clock-main">
          <span class="hud-clock" data-clock>07:24</span>
          <span class="clock-phase" data-phase>清晨</span>
        </div>
        <span class="day-tag" data-day>第 1 天</span>
        <button class="chip-btn" data-speed title="切换时间流速（T）">时间 ×1</button>
      </div>
      <div class="top-actions">
        <button class="action-btn icon" data-audio title="开启 / 静音（M）">♪</button>
        <button class="action-btn" data-wardrobe>换装 <kbd>C</kbd></button>
        <button class="action-btn ghost" data-help>操作 <kbd>H</kbd></button>
      </div>
    </div>
    <div class="scene-tabs glass" data-scene-tabs></div>
    <div class="story-card hidden" data-story>
      <div class="story-head"><span data-story-kicker>今日任务</span><span data-story-count>1 / 7</span></div>
      <div class="story-title" data-story-title>和街坊打个招呼</div>
      <div class="story-task" data-story-task>靠近 NPC 按 E 聊两句。</div>
      <div class="story-hint" data-story-hint></div>
      <div class="story-progress" data-story-progress></div>
    </div>
    <div class="dialogue" data-dialogue>
      <div class="d-name" data-d-name>王婶</div>
      <div class="d-text" data-d-text>添任来啦？</div>
    </div>
    <div class="status-card glass">
      <div class="status-row"><span>体力</span><div class="bar"><i data-stamina></i></div></div>
      <div class="record-row">
        <span>跳绳最佳 <b data-rec-jump>0</b></span>
        <span>投篮最高 <b data-rec-basket>0</b></span>
      </div>
    </div>
    <div class="prompt-pill" data-prompt><kbd>E</kbd><span data-prompt-text></span></div>
    <div class="toasts" data-toasts></div>
    <div class="control-hint">
      <kbd>W A S D</kbd> 移动 · <kbd>Shift</kbd> 跑步 · <kbd>空格</kbd> 跳跃<br />
      拖动鼠标 / <kbd>Q</kbd><kbd>E</kbd> 转视角 · <kbd>E</kbd> 互动 · <kbd>T</kbd> 时间
    </div>
    <div class="loading-toast" data-loading><span class="spinner"></span><span data-loading-text>正在加载…</span></div>
    <div class="modal-mask" data-help-mask>
      <div class="panel">
        <div class="panel-head">
          <div><h2>操作指南</h2><p>在阳光里慢慢逛，遇到光点就按 E 互动</p></div>
          <button class="panel-close" data-help-close>×</button>
        </div>
        <ul class="help-list">
          <li><kbd>W A S D</kbd> 前后左右移动，相机跟随朝向</li>
          <li><kbd>Shift</kbd> 按住跑步，消耗体力；松开慢慢恢复</li>
          <li><kbd>空格</kbd> 跳跃；小游戏里用来蓄力 / 跟拍</li>
          <li><kbd>E</kbd> 靠近提示点时互动（其余时候与 <kbd>Q</kbd> 一起旋转视角）</li>
          <li><kbd>C</kbd> 打开衣橱换装，实时同步到 3D 模型</li>
          <li><kbd>T</kbd> 切换时间流速（×1 / ×2 / ×4 / ×8）</li>
          <li><kbd>1 / 2 / 3</kbd> 快速切换 生活区 / 金榜小学 / 奥园中央墅</li>
          <li><kbd>Esc</kbd> 关闭面板或结束小游戏</li>
        </ul>
        <div class="help-note">提示：跳绳、投篮的最佳成绩会自动记录；回家睡觉可以跳到第二天清晨。</div>
      </div>
    </div>
    <div class="game-layer" data-game-layer></div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const els = {
    clock: $('[data-clock]'),
    phase: $('[data-phase]'),
    day: $('[data-day]'),
    speed: $('[data-speed]'),
    tabs: $('[data-scene-tabs]'),
    stamina: $('[data-stamina]'),
    recJump: $('[data-rec-jump]'),
    recBasket: $('[data-rec-basket]'),
    prompt: $('[data-prompt]'),
    promptText: $('[data-prompt-text]'),
    toasts: $('[data-toasts]'),
    loading: $('[data-loading]'),
    loadingText: $('[data-loading-text]'),
    helpMask: $('[data-help-mask]'),
    gameLayer: $('[data-game-layer]'),
    mode: $('[data-mode]'),
    audio: $('[data-audio]'),
    story: $('[data-story]'),
    storyTitle: $('[data-story-title]'),
    storyTask: $('[data-story-task]'),
    storyHint: $('[data-story-hint]'),
    storyCount: $('[data-story-count]'),
    storyProgress: $('[data-story-progress]'),
    dialogue: $('[data-dialogue]'),
    dName: $('[data-d-name]'),
    dText: $('[data-d-text]'),
  };

  const SCENE_TABS = [
    { id: 'world', title: '阳光生活区' },
    { id: 'school', title: '金榜小学' },
    { id: 'home', title: '奥园中央墅' },
  ];

  let helpOpen = false;

  els.speed.addEventListener('click', () => callbacks.onSpeedToggle && callbacks.onSpeedToggle());
  $('[data-wardrobe]').addEventListener('click', () => callbacks.onWardrobe && callbacks.onWardrobe());
  $('[data-help]').addEventListener('click', () => toggleHelp(true));
  $('[data-help-close]').addEventListener('click', () => toggleHelp(false));
  els.helpMask.addEventListener('click', (e) => {
    if (e.target === els.helpMask) toggleHelp(false);
  });
  els.audio.addEventListener('click', () => {
    if (callbacks.onAudioToggle) callbacks.onAudioToggle();
  });
  els.dialogue.addEventListener('click', () => hideDialogue());

  function toast(msg, kind) {
    const el = document.createElement('div');
    el.className = `toast${kind ? ` ${kind}` : ''}`;
    el.textContent = msg;
    els.toasts.appendChild(el);
    while (els.toasts.children.length > 3) {
      els.toasts.firstChild.remove();
    }
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(() => el.remove(), 320);
    }, 2800);
  }

  function setClock(text, phase, day) {
    els.clock.textContent = text;
    els.phase.textContent = phase;
    els.day.textContent = `第 ${day} 天`;
  }

  function setSpeedLabel(mult) {
    els.speed.textContent = `时间 ×${mult}`;
  }

  function setStamina(ratio) {
    const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    els.stamina.style.width = `${pct}%`;
    els.stamina.classList.toggle('low', pct < 30);
  }

  function setPrompt(item) {
    if (item && item.label) {
      els.promptText.textContent = item.label;
      els.prompt.classList.add('show');
    } else {
      els.prompt.classList.remove('show');
    }
  }

  function setLoading(show, text) {
    if (text) els.loadingText.textContent = text;
    els.loading.classList.toggle('show', !!show);
  }

  function setScenes(activeId, readyMap) {
    els.tabs.innerHTML = '';
    SCENE_TABS.forEach((tab) => {
      const btn = document.createElement('button');
      const ready = readyMap ? readyMap[tab.id] : null;
      btn.className = `scene-tab${activeId === tab.id ? ' active' : ''}${ready === false ? ' pending' : ''}`;
      btn.innerHTML = `<span class="tab-dot"></span>${tab.title}${ready === false ? ' · 构建中' : ''}`;
      btn.addEventListener('click', () => {
        if (callbacks.onSceneSwitch) callbacks.onSceneSwitch(tab.id);
      });
      els.tabs.appendChild(btn);
    });
  }

  function setRecords(records) {
    if (records && records.jump) els.recJump.textContent = String(records.jump.bestCount || 0);
    if (records && records.basket) els.recBasket.textContent = String(records.basket.bestScore || 0);
  }

  function toggleHelp(open) {
    helpOpen = open;
    els.helpMask.classList.toggle('show', open);
  }

  function isModalOpen() {
    return helpOpen;
  }

  function closeAll() {
    toggleHelp(false);
  }

  let dialogueTimer = null;
  let storyProgressKey = '';

  function setMode(mode) {
    els.mode.textContent = mode === 'normal' ? '普通模式' : '剧情模式';
    els.mode.classList.toggle('normal', mode === 'normal');
  }

  function showStory(info) {
    if (!info) return;
    els.story.classList.remove('hidden');
    els.storyTitle.textContent = info.title || '今日任务';
    els.storyTask.innerHTML = info.task || '';
    els.storyHint.textContent = info.hint || '';
    els.storyCount.textContent = `${Math.min(info.index + 1, info.total)} / ${info.total}`;
    const key = `${info.index}|${info.total}`;
    if (key !== storyProgressKey) {
      storyProgressKey = key;
      els.storyProgress.innerHTML = '';
      for (let i = 0; i < info.total; i += 1) {
        const bar = document.createElement('i');
        if (i < info.index) bar.className = 'on';
        else if (i === info.index) bar.className = 'current';
        els.storyProgress.appendChild(bar);
      }
    }
  }

  function hideStory() {
    els.story.classList.add('hidden');
  }

  function showDialogue(name, text, duration = 4200) {
    els.dName.textContent = name || '街坊';
    els.dText.textContent = text || '';
    els.dialogue.classList.add('show');
    if (dialogueTimer) clearTimeout(dialogueTimer);
    dialogueTimer = setTimeout(() => hideDialogue(), duration);
  }

  function hideDialogue() {
    els.dialogue.classList.remove('show');
    if (dialogueTimer) {
      clearTimeout(dialogueTimer);
      dialogueTimer = null;
    }
  }

  function setAudioMuted(muted) {
    els.audio.textContent = muted ? '静' : '♪';
    els.audio.classList.toggle('muted', !!muted);
    els.audio.title = muted ? '已静音，点击开启声音（M）' : '声音已开启，点击静音（M）';
  }

  return {
    toast,
    setClock,
    setSpeedLabel,
    setStamina,
    setPrompt,
    setLoading,
    setScenes,
    setRecords,
    toggleHelp,
    isModalOpen,
    closeAll,
    setMode,
    showStory,
    hideStory,
    showDialogue,
    hideDialogue,
    setAudioMuted,
    gameLayer: els.gameLayer,
  };
}
