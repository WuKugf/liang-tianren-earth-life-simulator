// 投篮小游戏：移动到合适位置，按住空格蓄力、松开投篮，命中空心入网计分
import * as THREE from 'three';

const GRAVITY = 9.8;

export function createBasketballGame({ scene, character, controller, input, ui, audio, onFinish }) {
  let running = false;
  let finished = false;
  let card = null;
  let ball = null;
  let ballSeams = [];
  let rimTarget = new THREE.Vector3(0, 3.05, 0);
  let state = 'idle'; // idle | charge | flight | settle
  let power = 0;
  let powerDir = 1;
  let powerWasDown = false;
  let flightVel = new THREE.Vector3();
  let flightTime = 0;
  let score = 0;
  let shots = 0;
  let makes = 0;
  let settleTimer = 0;
  let flashTimer = 0;

  const refs = {};

  function buildUI(ideal) {
    card = document.createElement('div');
    card.className = 'minigame-card';
    card.innerHTML = `
      <div class="mg-head">
        <div class="mg-title">投篮训练<small>按住空格蓄力，松开出手，瞄向篮筐</small></div>
        <button class="mg-close" title="结束训练">×</button>
      </div>
      <div class="mg-stats">
        <div class="mg-stat"><b data-score>0</b><span>得分</span></div>
        <div class="mg-stat"><b data-shots>0</b><span>出手</span></div>
        <div class="mg-stat"><b data-rate>—</b><span>命中率</span></div>
      </div>
      <div class="mg-bar">
        <i data-power-bar></i>
        <div class="mg-zone" style="left:${(ideal - 0.09) * 100}%;width:${0.18 * 100}%"></div>
      </div>
      <div class="power-big">力量 <b data-power-text>0%</b> · 落在黄区最容易进</div>
      <div class="mg-foot">靠近篮筐投篮更准 · Esc 或 × 结束</div>
      <div class="mg-flash"></div>
    `;
    refs.score = card.querySelector('[data-score]');
    refs.shots = card.querySelector('[data-shots]');
    refs.rate = card.querySelector('[data-rate]');
    refs.powerBar = card.querySelector('[data-power-bar]');
    refs.powerText = card.querySelector('[data-power-text]');
    refs.flash = card.querySelector('.mg-flash');
    card.querySelector('.mg-close').addEventListener('click', () => finish());
    ui.gameLayer.appendChild(card);
  }

  function buildBall() {
    ball = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 18, 14),
      new THREE.MeshLambertMaterial({ color: 0xd97a2e })
    );
    sphere.castShadow = true;
    ball.add(sphere);
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x4a2c14 });
    const seam1 = new THREE.Mesh(new THREE.TorusGeometry(0.131, 0.004, 5, 24), seamMat);
    const seam2 = new THREE.Mesh(new THREE.TorusGeometry(0.131, 0.004, 5, 24), seamMat);
    seam2.rotation.y = Math.PI / 2;
    ball.add(seam1);
    ball.add(seam2);
    ballSeams = [seam1, seam2];
    ball.visible = false;
    scene.add(ball);
  }

  function flash(text, good) {
    refs.flash.textContent = text;
    refs.flash.style.color = good ? 'var(--mint-deep)' : 'var(--sun-deep)';
    refs.flash.classList.add('show');
    flashTimer = 0.7;
  }

  function idealPowerFor(dist) {
    return Math.max(0.42, Math.min(0.88, 0.4 + dist * 0.048));
  }

  function handPosition(out) {
    const yaw = character.group.rotation.y;
    out.copy(character.group.position);
    out.x += Math.sin(yaw) * 0.34;
    out.z += Math.cos(yaw) * 0.34;
    out.y += 1.28;
    return out;
  }

  const tmpVec = new THREE.Vector3();

  function start(target) {
    if (running) return;
    running = true;
    finished = false;
    state = 'idle';
    power = 0;
    score = 0;
    shots = 0;
    makes = 0;
    if (target && target.position) rimTarget.copy(target.position);
    const dist = character.group.position.distanceTo(rimTarget);
    buildUI(idealPowerFor(dist));
    if (!ball) buildBall();
    ball.visible = true;
    controller.setJumpEnabled(false);
    controller.faceTowards(rimTarget.x, rimTarget.z);
    input.clearPressed();
    handPosition(tmpVec);
    ball.position.copy(tmpVec);
  }

  function shoot() {
    shots += 1;
    refs.shots.textContent = String(shots);
    const dist = character.group.position.distanceTo(rimTarget);
    const ideal = idealPowerFor(dist);
    const startPos = handPosition(new THREE.Vector3());
    // 力量偏差 → 落点前后偏移
    const error = power - ideal;
    const aim = new THREE.Vector3(rimTarget.x, rimTarget.y, rimTarget.z);
    const dir = new THREE.Vector3().subVectors(rimTarget, startPos);
    dir.y = 0;
    if (dir.lengthSq() > 0.0001) dir.normalize();
    aim.addScaledVector(dir, error * 3.4);
    aim.y += error * 0.9;
    const T = 1.06;
    flightVel.set(
      (aim.x - startPos.x) / T,
      (aim.y - startPos.y + 0.5 * GRAVITY * T * T) / T,
      (aim.z - startPos.z) / T
    );
    ball.position.copy(startPos);
    state = 'flight';
    flightTime = 0;
    if (audio) audio.play('ballShoot');
    refs.powerBar.style.width = '0%';
    refs.powerText.textContent = '0%';
  }

  function judgeShot() {
    const dx = ball.position.x - rimTarget.x;
    const dz = ball.position.z - rimTarget.z;
    const horiz = Math.sqrt(dx * dx + dz * dz);
    if (flightVel.y < 0 && Math.abs(ball.position.y - rimTarget.y) < 0.34 && horiz < 0.27) {
      makes += 1;
      score += 2;
      refs.score.textContent = String(score);
      if (audio) audio.play('swish');
      flash('空心入网！+2', true);
      state = 'settle';
      settleTimer = 1.1;
    }
  }

  function update(dt) {
    if (!running || finished) return;

    const spaceDown = input.isDown('jump');

    if (state === 'idle' || state === 'charge') {
      // 球跟着手走
      handPosition(tmpVec);
      ball.position.copy(tmpVec);
      ball.rotation.x += dt * 2;

      if (spaceDown) {
        state = 'charge';
        power += powerDir * dt * 1.15;
        if (power >= 1) { power = 1; powerDir = -1; }
        if (power <= 0) { power = 0; powerDir = 1; }
        refs.powerBar.style.width = `${Math.round(power * 100)}%`;
        refs.powerText.textContent = `${Math.round(power * 100)}%`;
      } else if (powerWasDown && !spaceDown) {
        // 松开出手
        shoot();
        state = 'flight';
      }
    } else if (state === 'flight') {
      flightTime += dt;
      flightVel.y -= GRAVITY * dt;
      ball.position.addScaledVector(flightVel, dt);
      ball.rotation.x += dt * 9;
      ball.rotation.y += dt * 3;

      judgeShot();

      if (state === 'flight' && ball.position.y <= 0.12 && flightVel.y < 0) {
        // 落地反弹一次后判定
        if (Math.abs(flightVel.y) > 1.2 && audio) audio.play('ballBounce');
        ball.position.y = 0.12;
        flightVel.y = -flightVel.y * 0.42;
        flightVel.x *= 0.55;
        flightVel.z *= 0.55;
        if (Math.abs(flightVel.y) < 1.2) {
          flash('弹筐而出', false);
          state = 'settle';
          settleTimer = 0.9;
        }
      }
      if (state === 'flight' && flightTime > 2.6) {
        flash('差一点点', false);
        state = 'settle';
        settleTimer = 0.6;
      }
    } else if (state === 'settle') {
      flightVel.y -= GRAVITY * dt;
      ball.position.addScaledVector(flightVel, dt);
      if (ball.position.y <= 0.12) {
        ball.position.y = 0.12;
        flightVel.y = -flightVel.y * 0.35;
        flightVel.x *= 0.5;
        flightVel.z *= 0.5;
      }
      settleTimer -= dt;
      if (settleTimer <= 0) {
        state = 'idle';
        power = 0;
        powerDir = 1;
      }
    }

    powerWasDown = spaceDown;

    if (flashTimer > 0) {
      flashTimer -= dt;
      if (flashTimer <= 0) refs.flash.classList.remove('show');
    }

    if (shots > 0) {
      refs.rate.textContent = `${Math.round((makes / shots) * 100)}%`;
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    running = false;
    controller.setJumpEnabled(true);
    input.clearPressed();
    if (ball) {
      scene.remove(ball);
      ball.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry.dispose();
          obj.material.dispose();
        }
      });
      ball = null;
      ballSeams = [];
    }
    const result = { score, shots, makes };
    if (card) {
      card.remove();
      card = null;
    }
    if (onFinish) onFinish(result);
  }

  function isRunning() {
    return running;
  }

  return { start, update, finish, isRunning };
}
