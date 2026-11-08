// 跳绳小游戏：自动跳绳计数 + 空格跟拍拿连击，60 秒挑战
import * as THREE from 'three';

const DURATION = 60;

export function createJumpRopeGame({ scene, character, controller, input, ui, audio, onFinish }) {
  let running = false;
  let finished = false;
  let ropeGroup = null;
  let rope = null;
  let card = null;

  const state = {
    count: 0,
    combo: 0,
    bestCombo: 0,
    timeLeft: DURATION,
    beatTimer: 0,
    beatInterval: 0.46,
    beatCount: 0,
    phaseAtPress: null,
    flashTimer: 0,
  };

  const refs = {};

  function buildUI() {
    card = document.createElement('div');
    card.className = 'minigame-card';
    card.innerHTML = `
      <div class="mg-head">
        <div class="mg-title">跳绳挑战<small>自动跳绳 · 按空格跟上节拍拿连击</small></div>
        <button class="mg-close" title="结束挑战">×</button>
      </div>
      <div class="mg-stats">
        <div class="mg-stat"><b data-count>0</b><span>个数</span></div>
        <div class="mg-stat"><b data-combo>0</b><span>连击</span></div>
        <div class="mg-stat"><b data-time>${DURATION}</b><span>剩余秒</span></div>
      </div>
      <div class="rhythm-track"><div class="beat-mark"></div><div class="pulse"></div></div>
      <div class="mg-bar"><i data-bar></i></div>
      <div class="mg-foot">按空格跟上节拍 · 连击越多跳得越快 · Esc 或 × 结束</div>
      <div class="mg-flash"></div>
    `;
    refs.count = card.querySelector('[data-count]');
    refs.combo = card.querySelector('[data-combo]');
    refs.time = card.querySelector('[data-time]');
    refs.bar = card.querySelector('[data-bar]');
    refs.pulse = card.querySelector('.pulse');
    refs.flash = card.querySelector('.mg-flash');
    card.querySelector('.mg-close').addEventListener('click', () => finish(false));
    ui.gameLayer.appendChild(card);
  }

  function buildRope() {
    ropeGroup = new THREE.Group();
    rope = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.014, 6, 40),
      new THREE.MeshBasicMaterial({ color: 0xff7a6b })
    );
    rope.castShadow = false;
    ropeGroup.add(rope);
    ropeGroup.position.copy(character.group.position);
    ropeGroup.position.y += 0.9;
    scene.add(ropeGroup);
  }

  function flash(text) {
    refs.flash.textContent = text;
    refs.flash.classList.add('show');
    state.flashTimer = 0.55;
  }

  function onBeat() {
    state.count += 1;
    state.beatCount += 1;
    // 越跳越快
    if (state.beatCount % 12 === 0) {
      state.beatInterval = Math.max(0.27, state.beatInterval - 0.018);
    }
    controller.addBounceImpulse(2.4);
    if (audio) audio.play('ropeTick');
    refs.count.textContent = String(state.count);
    refs.pulse.classList.remove('hit');
    void refs.pulse.offsetWidth; // 重置动画
    refs.pulse.classList.add('hit');
  }

  function updateUI() {
    refs.time.textContent = String(Math.max(0, Math.ceil(state.timeLeft)));
    const progress = (state.beatTimer / state.beatInterval) * 100;
    refs.bar.style.width = `${Math.min(100, progress)}%`;
  }

  function start() {
    if (running) return;
    running = true;
    finished = false;
    state.count = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.timeLeft = DURATION;
    state.beatTimer = 0;
    state.beatInterval = 0.46;
    state.beatCount = 0;
    buildUI();
    buildRope();
    controller.setMoveEnabled(false);
    controller.setJumpEnabled(false);
    input.clearPressed();
  }

  function update(dt) {
    if (!running || finished) return;

    state.timeLeft -= dt;
    state.beatTimer += dt;

    if (state.beatTimer >= state.beatInterval) {
      state.beatTimer -= state.beatInterval;
      onBeat();
    }

    // 跟拍判定：按下瞬间距离节拍越近越好
    if (input.consumePress('jump')) {
      const phase = Math.min(state.beatTimer, state.beatInterval - state.beatTimer);
      const windowSec = state.beatInterval * 0.32;
      if (phase <= windowSec) {
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        if (audio) audio.play('ropePerfect');
        if (state.combo > 0 && state.combo % 5 === 0) flash(`连击 x${state.combo}！`);
        refs.combo.textContent = String(state.combo);
      } else {
        if (state.combo >= 3) flash('断拍了，再来');
        state.combo = 0;
        refs.combo.textContent = '0';
      }
    }

    // 绳子跟着人转一圈对应一个节拍
    const progress = state.beatTimer / state.beatInterval;
    ropeGroup.position.copy(character.group.position);
    ropeGroup.position.y += 0.9 + Math.sin(progress * Math.PI) * 0.02;
    ropeGroup.rotation.y = character.group.rotation.y;
    rope.rotation.x = progress * Math.PI * 2;

    if (state.flashTimer > 0) {
      state.flashTimer -= dt;
      if (state.flashTimer <= 0) refs.flash.classList.remove('show');
    }

    updateUI();

    if (state.timeLeft <= 0) finish(true);
  }

  function finish(auto) {
    if (finished) return;
    finished = true;
    running = false;
    controller.setMoveEnabled(true);
    controller.setJumpEnabled(true);
    input.clearPressed();
    if (ropeGroup) {
      scene.remove(ropeGroup);
      rope.geometry.dispose();
      rope.material.dispose();
      ropeGroup = null;
    }
    const result = { count: state.count, bestCombo: state.bestCombo, auto };
    if (audio) audio.play('complete');
    if (card) {
      const layer = ui.gameLayer;
      card.remove();
      card = null;
      void layer;
    }
    if (onFinish) onFinish(result);
  }

  function isRunning() {
    return running;
  }

  return { start, update, finish, isRunning };
}
