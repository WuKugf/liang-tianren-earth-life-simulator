// 主入口：引擎、时间、角色、场景、交互、小游戏、电视、剧情、音频、存档的总装
import * as THREE from 'three';
import { createEngine } from './core/engine.js';
import { createTimeSystem } from './core/timeSystem.js';
import { createInput } from './core/input.js';
import { createSceneManager } from './core/sceneManager.js';
import { createInteraction } from './core/interaction.js';
import { createAudio } from './core/audio.js';
import { createCharacter } from './character/character.js';
import { createWardrobe } from './character/wardrobe.js';
import { createPlayerController } from './character/playerController.js';
import { createJumpRopeGame } from './systems/jumpRope.js';
import { createBasketballGame } from './systems/basketball.js';
import { createTV } from './systems/tv.js';
import { createStory } from './systems/story.js';
import { loadSave, createAutoSaver } from './systems/save.js';
import { createHUD } from './ui/hud.js';
import { createWardrobePanel } from './ui/wardrobePanel.js';

const MARKET = new THREE.Vector3(-55, 0, -20);

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');
const startScreen = document.getElementById('start-screen');
const startStatus = document.querySelector('[data-start-status]');
const modeButtons = Array.from(document.querySelectorAll('[data-mode]'));
const helpButton = document.querySelector('[data-menu="help"]');
const helpLayer = document.querySelector('[data-ss-help]');
const helpClose = document.querySelector('.ss-help-close');

const save = loadSave();
const audio = createAudio();

const engine = createEngine(canvas);
const time = createTimeSystem({ hour: save.hour, day: save.day });
const input = createInput(canvas);
const character = createCharacter();
engine.scene.add(character.group);
const wardrobe = createWardrobe(character);
wardrobe.apply(save.outfit);

const controller = createPlayerController({
  character,
  camera: engine.camera,
  input,
  bounds: { minX: -150, maxX: 150, minZ: -150, maxZ: 150 },
});
controller.snapCamera();

let activeGame = null;
let jogMode = false;
let initialSceneLoad = true;
let records = save.records;
let started = false;
let footAccumulator = 0;
let elapsedTotal = 0;

const hud = createHUD({
  root: uiRoot,
  callbacks: {
    onSpeedToggle: () => {
      const speed = time.cycleSpeed();
      hud.setSpeedLabel(speed);
      audio.play('ui');
      hud.toast(`时间流速 ×${speed}`);
    },
    onWardrobe: () => {
      if (activeGame) return;
      hud.closeAll();
      wardrobePanel.toggle();
      audio.play('ui');
    },
    onSceneSwitch: (id) => switchScene(id),
    onAudioToggle: () => toggleAudio(),
  },
});
hud.setMode(save.mode);
hud.setAudioMuted(audio.isMuted());

const wardrobePanel = createWardrobePanel({
  root: uiRoot,
  wardrobe,
  onApply: () => {
    autoSaver.markDirty();
    audio.play('ui');
    hud.toast(`换上了「${wardrobe.getCurrent().name}」`);
  },
});

const interaction = createInteraction({
  playerGroup: character.group,
  onPromptChange: (item) => {
    if (activeGame || !started) return;
    hud.setPrompt(item);
  },
});

const tv = createTV({
  scene: engine.scene,
  root: uiRoot,
  audio,
  onClose: () => hud.setPrompt(null),
});

const story = createStory({
  hud,
  audio,
  initialMode: save.mode,
  initialStep: save.storyStep,
  onChange: () => autoSaver.markDirty(),
});

const tvInteractable = {
  id: 'home-tv',
  label: '看电视 · 打开客厅电视',
  action: 'watchTV',
  position: { x: -6.5, y: 0, z: -12.2 },
  radius: 3.0,
  meta: { scene: 'home' },
};

const manager = createSceneManager({
  scene: engine.scene,
  time,
  player: character.group,
  ui: hud,
  onSceneChanged: (info) => {
    const meta = info.meta;
    controller.setBounds(meta.bounds);
    if (initialSceneLoad) {
      initialSceneLoad = false;
      if (info.id === 'world' && save.position) {
        controller.teleport(save.position.x, save.position.z, save.position.yaw);
      } else {
        controller.teleport(meta.spawn.x, meta.spawn.z, meta.spawn.yaw);
      }
    } else {
      controller.teleport(meta.spawn.x, meta.spawn.z, meta.spawn.yaw);
    }
    tv.close();
    jogMode = false;
    controller.setSpeedBoost(false);
    autoSaver.markDirty();
  },
  onInteractables: (list) => {
    const info = manager.getInfo();
    const extra = info && info.id === 'home' ? [tvInteractable] : [];
    interaction.setInteractables(list.concat(extra));
  },
  onColliders: (list) => controller.setColliders(list),
});

function switchScene(id) {
  if (activeGame) return;
  hud.closeAll();
  wardrobePanel.close();
  tv.close();
  audio.play('door');
  manager.switchTo(id);
}

// ---------- 小游戏 ----------
function startJumpRope() {
  if (activeGame) return;
  hud.closeAll();
  wardrobePanel.close();
  tv.close();
  const game = createJumpRopeGame({
    scene: engine.scene,
    character,
    controller,
    input,
    ui: hud,
    audio,
    onFinish: (res) => {
      activeGame = null;
      interaction.suppress(700);
      const newBest = res.count > records.jump.bestCount;
      records.jump.bestCount = Math.max(records.jump.bestCount, res.count);
      records.jump.bestCombo = Math.max(records.jump.bestCombo, res.bestCombo);
      hud.setRecords(records);
      autoSaver.markDirty();
      story.notify('jump', { count: res.count });
      hud.toast(
        newBest
          ? `跳绳 ${res.count} 个，刷新纪录！连击最高 x${res.bestCombo}`
          : `跳绳 ${res.count} 个，连击最高 x${res.bestCombo}`,
        newBest ? 'good' : undefined
      );
    },
  });
  activeGame = game;
  hud.setPrompt(null);
  game.start();
}

function startBasketball(rim) {
  if (activeGame) return;
  hud.closeAll();
  wardrobePanel.close();
  tv.close();
  const target = rim ? { position: rim } : null;
  const game = createBasketballGame({
    scene: engine.scene,
    character,
    controller,
    input,
    ui: hud,
    audio,
    onFinish: (res) => {
      activeGame = null;
      interaction.suppress(700);
      const newBest = res.score > records.basket.bestScore;
      records.basket.bestScore = Math.max(records.basket.bestScore, res.score);
      records.basket.bestShots = Math.max(records.basket.bestShots, res.shots);
      hud.setRecords(records);
      autoSaver.markDirty();
      story.notify('basket', { makes: res.makes });
      hud.toast(
        newBest
          ? `本轮投篮得 ${res.score} 分，新纪录！`
          : `本轮投篮得 ${res.score} 分（${res.makes}/${res.shots}）`,
        newBest ? 'good' : undefined
      );
    },
  });
  activeGame = game;
  hud.setPrompt(null);
  game.start(target);
}

// ---------- 交互动作 ----------
function handleAction(item) {
  switch (item.action) {
    case 'jumpRope':
      startJumpRope();
      break;
    case 'basketball':
      startBasketball(item.meta && item.meta.rim);
      break;
    case 'run':
      jogMode = !jogMode;
      controller.setSpeedBoost(jogMode);
      audio.play('ui');
      hud.toast(jogMode ? '晨跑开始！速度提升，按住 Shift 冲刺' : '晨跑结束，喘口气');
      break;
    case 'rest':
      controller.setStamina(100);
      time.addHours(0.5);
      audio.play('ui');
      hud.toast('在长椅上歇了一会儿，体力回满了');
      autoSaver.markDirty();
      break;
    case 'sunbathe':
      time.addHours(0.75);
      hud.toast('晒了会儿太阳，暖洋洋的');
      autoSaver.markDirty();
      break;
    case 'sleep':
      story.notify('sleep');
      time.skipToNextMorning(6.5);
      controller.setStamina(100);
      autoSaver.markDirty();
      hud.toast('睡了个好觉，新的一天开始了', 'good');
      break;
    case 'study':
      time.addHours(1);
      story.notify('study');
      hud.toast('认真学习了一会儿，专注力 +1');
      autoSaver.markDirty();
      break;
    case 'watchTV':
      if (manager.getInfo().id !== 'home') {
        hud.toast('回家再打开电视吧');
        break;
      }
      hud.closeAll();
      hud.setPrompt(null);
      tv.open();
      story.notify('tv');
      autoSaver.markDirty();
      break;
    case 'talk': {
      const npc = item.meta && item.meta.npc;
      if (!npc) break;
      const lines = npc.def.lines;
      const line = lines[npc.lineIndex % lines.length];
      npc.lineIndex += 1;
      hud.showDialogue(item.meta.name, line, 4600);
      audio.play('dialog');
      character.playGesture('wave', 1.6);
      story.notify('talk', { name: item.meta.name });
      break;
    }
    case 'snack': {
      const name = (item.meta && item.meta.name) || '夜市小吃';
      time.addHours(0.2);
      controller.setStamina(Math.min(100, controller.state.stamina + 12));
      audio.play('coin');
      character.playGesture('cheer', 1.2);
      hud.showDialogue('十字街夜市', `${name}到手，热腾腾的，趁热吃。`, 3200);
      hud.toast(`在「${name}」吃了一顿，体力恢复`, 'good');
      autoSaver.markDirty();
      break;
    }
    case 'wish':
      audio.play('coin');
      character.playGesture('stretch', 1.4);
      hud.showDialogue('许愿灯笼', '把愿望留在十字街的灯影里，风会替你带话。', 3800);
      break;
    case 'soccer':
      hud.toast('足球训练即将开放，先去投篮或跳绳热热身吧');
      break;
    default:
      hud.toast('这里安安静静，什么也没发生');
  }
}

function toggleAudio() {
  if (!audio.isUnlocked()) {
    audio.unlock();
    audio.startBgm();
  }
  const muted = audio.toggleMuted();
  hud.setAudioMuted(muted);
  hud.toast(muted ? '已静音' : '声音已开启');
}

// ---------- 存档 ----------
const autoSaver = createAutoSaver(() => ({
  hour: time.getHour(),
  day: time.getDay(),
  scene: manager.getInfo().id || 'world',
  position: {
    x: character.group.position.x,
    z: character.group.position.z,
    yaw: controller.state.yaw,
  },
  outfit: wardrobe.getCurrent().id,
  mode: story.getState().mode,
  storyStep: story.getState().step,
  records,
}), { intervalMs: 6000 });

window.addEventListener('beforeunload', () => autoSaver.flush());

// ---------- 全局按键 ----------
window.addEventListener('keydown', (e) => {
  if (e.repeat || !started) return;
  switch (e.code) {
    case 'KeyC':
      if (!activeGame) {
        hud.closeAll();
        wardrobePanel.toggle();
        audio.play('ui');
      }
      break;
    case 'KeyH':
      if (!activeGame) hud.toggleHelp(!hud.isModalOpen());
      break;
    case 'KeyT': {
      const speed = time.cycleSpeed();
      hud.setSpeedLabel(speed);
      audio.play('ui');
      break;
    }
    case 'KeyM':
      toggleAudio();
      break;
    case 'KeyE': {
      if (activeGame || hud.isModalOpen() || wardrobePanel.isOpen() || tv.isOpen()) break;
      const item = interaction.getCurrent();
      if (item) handleAction(item);
      break;
    }
    case 'Escape':
      if (tv.isOpen()) tv.close();
      else if (activeGame) activeGame.finish();
      else {
        wardrobePanel.close();
        hud.closeAll();
      }
      break;
    case 'Digit1':
      switchScene('world');
      break;
    case 'Digit2':
      switchScene('school');
      break;
    case 'Digit3':
      switchScene('home');
      break;
    default:
      break;
  }
});

// NPC 挥手打招呼时播放轻音效
window.addEventListener('npc-greet', () => {
  audio.play('wave');
});

// ---------- 开场电影镜头 ----------
const cine = {
  time: 0,
  target: new THREE.Vector3(0, 1.7, 18),
  angle: 0.35,
};

function updateCinematic(dt) {
  cine.time += dt;
  const radius = 13.5 + Math.sin(cine.time * 0.12) * 2.2;
  const angle = cine.angle + cine.time * 0.085;
  engine.camera.position.set(
    cine.target.x + Math.sin(angle) * radius,
    5.4 + Math.sin(cine.time * 0.18) * 0.5,
    cine.target.z + Math.cos(angle) * radius
  );
  engine.camera.lookAt(cine.target.x, 1.65, cine.target.z);
}

// ---------- 主循环 ----------
let last = performance.now();
let moodTick = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0.0001, (now - last) / 1000));
  last = now;
  elapsedTotal += dt;

  if (started) {
    time.update(dt);
    controller.update(dt);
    if (controller.consumeJump()) audio.play('jump');
    if (controller.consumeLand()) audio.play('land');

    // 脚步声
    if (controller.state.moving && controller.state.grounded) {
      footAccumulator += dt * (controller.state.running ? 4.3 : 2.5);
      if (footAccumulator >= 1) {
        footAccumulator = 0;
        audio.play('footstep');
      }
    } else {
      footAccumulator = 0;
    }
  } else {
    updateCinematic(dt);
    character.update(dt, { moving: false });
  }

  manager.update(dt);
  if (started) {
    interaction.update();
    story.update(dt, {
      scene: manager.getInfo().id,
      hour: time.getHour(),
      position: character.group.position,
    });
  }
  if (activeGame) activeGame.update(dt);
  tv.update(dt);
  audio.update(dt);

  const state = time.getState();
  // 音频氛围：昼夜 + 十字街夜市
  moodTick += dt;
  if (moodTick > 0.5) {
    moodTick = 0;
    const inMarket = manager.getInfo().id === 'world'
      && Math.hypot(character.group.position.x - MARKET.x, character.group.position.z - MARKET.z) < 24;
    audio.setMood({ night: state.isNight, market: inMarket });
  }

  engine.applyTime(state, character.group.position);
  hud.setClock(time.formatClock(), state.phase, state.day);
  hud.setStamina(controller.getStaminaRatio());

  engine.render();
}

// ---------- 启动 ----------
function setStartStatus(text) {
  if (startStatus) startStatus.textContent = text;
}

function bindStartScreen() {
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => startGame(btn.dataset.mode || 'story'));
    btn.addEventListener('pointerenter', () => {
      if (audio.isUnlocked()) audio.play('hover');
    });
  });
  if (helpButton) {
    helpButton.addEventListener('click', () => {
      audio.play('ui');
      if (helpLayer) helpLayer.classList.add('show');
    });
  }
  if (helpClose) {
    helpClose.addEventListener('click', () => {
      audio.play('ui');
      if (helpLayer) helpLayer.classList.remove('show');
    });
  }
  if (helpLayer) {
    helpLayer.addEventListener('click', (e) => {
      if (e.target === helpLayer) helpLayer.classList.remove('show');
    });
  }
  // 首次交互解锁 WebAudio（浏览器要求用户手势）
  const unlockOnce = () => {
    if (!audio.isUnlocked()) {
      audio.unlock();
      audio.startBgm();
      hud.setAudioMuted(false);
    }
    startScreen && startScreen.removeEventListener('pointerdown', unlockOnce);
  };
  startScreen && startScreen.addEventListener('pointerdown', unlockOnce);
}

async function startGame(mode) {
  if (started) return;
  started = true;
  audio.unlock();
  audio.startBgm();
  hud.setAudioMuted(audio.isMuted());
  hud.setMode(mode);
  audio.play('ui');

  if (startScreen) {
    startScreen.classList.add('hide');
    setTimeout(() => {
      if (startScreen && startScreen.parentNode) startScreen.parentNode.removeChild(startScreen);
    }, 900);
  }

  if (mode === 'story') {
    story.setMode('story');
    const done = (save.storyStep || 0) >= story.steps.length;
    story.restore(done ? 0 : (save.storyStep || 0));
    time.setHour(7.2, { day: save.day });
    if (manager.getInfo().id !== 'world') {
      await manager.switchTo('world', { silent: false });
    }
    controller.teleport(0, 12, Math.PI);
    hud.toast('剧情模式：跟着左侧任务卡，走完添任的一天', 'good');
    hud.toast('先去广场和街坊打个招呼吧', 'warm');
  } else {
    story.setMode('normal');
    time.setHour(save.hour, { day: save.day });
    if (save.scene && save.scene !== 'world') {
      await manager.switchTo(save.scene, { silent: false });
    }
    controller.teleport(save.position.x, save.position.z, save.position.yaw);
    hud.toast('普通模式：自由自在地逛吧', 'good');
    hud.toast('按 1 / 2 / 3 可以切换生活区、学校、家', 'warm');
  }
  controller.snapCamera();
  input.clearPressed();
  autoSaver.markDirty();
}

async function boot() {
  bindStartScreen();
  try {
    // 启动页背后的黄昏场景（固定 18:00，先加载生活区）
    time.setHour(18.0);
    await manager.switchTo('world', { silent: true });
    hud.setRecords(records);
    hud.setSpeedLabel(time.getSpeed());
    requestAnimationFrame(frame);
    setStartStatus('准备好了 · 选择你的模式开始');
    if (startScreen) startScreen.classList.add('ready');
    modeButtons.forEach((btn) => { btn.disabled = false; });
    if (helpButton) helpButton.disabled = false;
  } catch (err) {
    console.error('[启动] 初始化失败', err);
    setStartStatus('初始化出错了，请刷新重试');
  }
}

boot();

// 调试句柄：便于并行会话联调与自动化测试
window.__game = {
  manager,
  controller,
  interaction,
  time,
  hud,
  wardrobe,
  audio,
  tv,
  story,
  switchScene,
  startGame,
  get started() { return started; },
};
