// 客厅电视：自绘 CanvasTexture 播放画面 + 频道切换 + 客厅补光 + 界面
import * as THREE from 'three';

const SCREEN_POS = { x: -6.5, y: 1.55, z: -15.02 };

const CHANNELS = [
  { id: 'news', name: '玉林晚间新闻', tint: 0x7fc0e8 },
  { id: 'cartoon', name: '添任的动画片', tint: 0xffb45e },
  { id: 'nature', name: '地球自然纪录', tint: 0x8fd6a0 },
  { id: 'music', name: '十字街音乐台', tint: 0xd58fff },
];

export function createTV({ scene, root, audio, onClose }) {
  let running = false;
  let channel = 0;
  let elapsed = 0;
  let drawTimer = 0;
  let screenMesh = null;
  let screenTex = null;
  let light = null;
  let mask = null;
  let canvas = null;
  let g = null;
  let refs = {};

  function drawNews() {
    const W = 640;
    const H = 360;
    g.fillStyle = '#0e1a2a';
    g.fillRect(0, 0, W, H);
    // 城市天际线
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1a3a5c');
    sky.addColorStop(0.6, '#2c5f8a');
    sky.addColorStop(1, '#0f1c2c');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H - 70);
    g.fillStyle = '#102337';
    for (let i = 0; i < 18; i += 1) {
      const bw = 22 + (i % 4) * 9;
      const bh = 40 + ((i * 37) % 90);
      g.fillRect(14 + i * 36, H - 70 - bh, bw, bh);
    }
    // 主播台
    g.fillStyle = '#1d2b3d';
    g.fillRect(0, H - 70, W, 70);
    g.fillStyle = '#2f8f6e';
    g.fillRect(0, H - 72, W, 4);
    // 主播
    g.fillStyle = '#f1c8a4';
    g.beginPath();
    g.arc(150, H - 96, 22, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#3b4c66';
    g.fillRect(124, H - 74, 52, 60);
    // 标题
    g.fillStyle = '#ffd98a';
    g.font = 'bold 30px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.fillText('玉林晚间新闻', 250, 86);
    g.fillStyle = 'rgba(255, 255, 255, 0.75)';
    g.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.fillText('十字街夜市今日开市 · 人流如织', 252, 118);
    // 副画面
    g.fillStyle = '#24405d';
    g.fillRect(250, 140, 330, 120);
    g.fillStyle = '#ffb45e';
    for (let i = 0; i < 6; i += 1) {
      g.fillRect(262 + i * 52, 200 - (i % 3) * 16, 36, 60 + (i % 3) * 16);
    }
    // 滚动字幕
    g.fillStyle = '#0a1420';
    g.fillRect(0, H - 26, W, 26);
    g.fillStyle = '#ffd98a';
    g.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
    const offset = (elapsed * 60) % 900;
    g.fillText('欢迎来到玉东新区 · 十字街夜市今晚灯火通明 · 金榜小学明日正常上课 · 奥园中央墅社区活动报名中', W - offset, H - 7);
    // 时钟
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.font = '13px monospace';
    g.fillText(new Date().toLocaleTimeString('zh-CN', { hour12: false }), 540, 30);
  }

  function drawCartoon() {
    const W = 640;
    const H = 360;
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#ffd9a0');
    sky.addColorStop(1, '#ffb1c1');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    // 太阳
    g.fillStyle = '#fff3c4';
    g.beginPath();
    g.arc(540, 80, 46, 0, Math.PI * 2);
    g.fill();
    // 草地
    g.fillStyle = '#86c26a';
    g.beginPath();
    g.ellipse(W / 2, H + 40, W * 0.9, 150, 0, 0, Math.PI * 2);
    g.fill();
    // 会跳的小人
    const bounce = Math.abs(Math.sin(elapsed * 2.6)) * 46;
    const cx = 220 + Math.sin(elapsed * 1.2) * 60;
    g.fillStyle = '#2f8f6e';
    g.beginPath();
    g.arc(cx, 220 - bounce, 34, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f1c8a4';
    g.beginPath();
    g.arc(cx, 174 - bounce, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1f1a19';
    g.beginPath();
    g.arc(cx, 168 - bounce, 27, Math.PI, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2b3033';
    g.fillRect(cx - 16, 172 - bounce, 13, 10);
    g.fillRect(cx + 3, 172 - bounce, 13, 10);
    // 小动物
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(440 + Math.sin(elapsed * 0.8) * 30, 260, 42, 30, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#4a3a33';
    for (let i = 0; i < 3; i += 1) {
      g.beginPath();
      g.arc(410 + i * 30 + Math.sin(elapsed * 0.8) * 30, 236, 8, 0, Math.PI * 2);
      g.fill();
    }
    // 字幕
    g.fillStyle = 'rgba(31, 49, 44, 0.75)';
    g.fillRect(40, 300, 560, 38);
    g.fillStyle = '#fffdf6';
    g.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.fillText('《添任的一天》· 今天也要开开心心', 66, 326);
  }

  function drawNature() {
    const W = 640;
    const H = 360;
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5fb5ef');
    sky.addColorStop(0.7, '#bfe7ff');
    sky.addColorStop(1, '#e8f6ff');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    // 远山
    g.fillStyle = '#7ba58c';
    g.beginPath();
    g.moveTo(0, 230);
    for (let x = 0; x <= W; x += 40) {
      g.lineTo(x, 230 - Math.sin(x * 0.011) * 46);
    }
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();
    g.fillStyle = '#4d8f57';
    g.beginPath();
    g.moveTo(0, 268);
    for (let x = 0; x <= W; x += 30) {
      g.lineTo(x, 268 - Math.sin(x * 0.02 + 1) * 26);
    }
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();
    // 飞鸟
    g.strokeStyle = 'rgba(31, 49, 44, 0.8)';
    g.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      const bx = 80 + i * 100 + Math.sin(elapsed * 0.7 + i) * 18;
      const by = 90 + i * 16 + Math.sin(elapsed * 1.4 + i) * 10;
      g.beginPath();
      g.arc(bx, by, 12, Math.PI * 0.15, Math.PI * 0.85);
      g.arc(bx + 24, by, 12, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    }
    // 云
    g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i += 1) {
      const cxo = (elapsed * 20 + i * 180) % (W + 200) - 100;
      g.beginPath();
      g.ellipse(cxo, 70 + i * 22, 46, 20, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(31, 49, 44, 0.7)';
    g.fillRect(40, 300, 560, 38);
    g.fillStyle = '#fffdf6';
    g.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.fillText('地球自然纪录 · 玉东的四季', 66, 326);
  }

  function drawMusic() {
    const W = 640;
    const H = 360;
    g.fillStyle = '#160f24';
    g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 320);
    glow.addColorStop(0, 'rgba(160, 90, 255, 0.35)');
    glow.addColorStop(1, 'rgba(20, 10, 30, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);
    // 均衡器
    for (let i = 0; i < 24; i += 1) {
      const h = 30 + Math.abs(Math.sin(elapsed * 3 + i * 0.7)) * 120;
      const x = 70 + i * 21;
      g.fillStyle = `hsl(${280 + i * 3}, 80%, ${45 + (i % 4) * 8}%)`;
      g.fillRect(x, H - 90 - h, 14, h);
    }
    g.fillStyle = '#ffd98a';
    g.font = 'bold 30px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.fillText('十字街音乐台', 60, 74);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.fillText('正在播放：夜市的风 · 民谣现场', 62, 108);
    // 音符
    g.font = '36px serif';
    g.fillStyle = 'rgba(255, 220, 160, 0.8)';
    for (let i = 0; i < 4; i += 1) {
      const nx = 100 + i * 130 + Math.sin(elapsed * 1.5 + i) * 24;
      const ny = 150 + Math.abs(Math.sin(elapsed * 2 + i)) * 40;
      g.fillText('♪', nx, ny);
    }
  }

  function draw() {
    if (!g) return;
    if (channel === 0) drawNews();
    else if (channel === 1) drawCartoon();
    else if (channel === 2) drawNature();
    else drawMusic();
    if (screenTex) screenTex.needsUpdate = true;
    if (canvas) canvas.__drawn = true;
  }

  function buildPanel() {
    mask = document.createElement('div');
    mask.className = 'tv-mask';
    mask.innerHTML = `
      <div class="tv-panel">
        <div class="tv-head">
          <div><b>客厅电视</b><small data-tv-show>${CHANNELS[channel].name}</small></div>
          <button class="tv-close">关闭</button>
        </div>
        <div class="tv-screen-wrap">
          <canvas id="tv-canvas" width="640" height="360"></canvas>
          <div class="tv-scan"></div>
        </div>
        <div class="tv-controls" data-tv-channels></div>
      </div>
    `;
    root.appendChild(mask);
    canvas = mask.querySelector('#tv-canvas');
    g = canvas.getContext('2d');
    refs.show = mask.querySelector('[data-tv-show]');
    refs.channels = mask.querySelector('[data-tv-channels]');
    refs.close = mask.querySelector('.tv-close');
    refs.close.addEventListener('click', () => close());
    mask.addEventListener('click', (e) => {
      if (e.target === mask) close();
    });
    CHANNELS.forEach((ch, i) => {
      const btn = document.createElement('button');
      btn.className = `tv-channel${i === channel ? ' active' : ''}`;
      btn.textContent = ch.name;
      btn.addEventListener('click', () => setChannel(i));
      refs.channels.appendChild(btn);
    });
    draw();
  }

  function buildScreen() {
    const canvasTex = document.createElement('canvas');
    canvasTex.width = 640;
    canvasTex.height = 360;
    // World screen uses same drawing canvas (offscreen) so the 3D TV shows content too
    screenTex = new THREE.CanvasTexture(canvasTex);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    const worldCtx = canvasTex.getContext('2d');
    const worldCanvas = canvasTex;
    // 把绘制逻辑输出到两块画布：简化做法为绘制到 DOM 画布后拷贝
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.06, 1.1),
      new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
    );
    mesh.position.set(SCREEN_POS.x, SCREEN_POS.y, SCREEN_POS.z);
    scene.add(mesh);
    screenMesh = mesh;
    // 用 DOM 画布的内容同步到纹理
    screenMesh.userData.sync = () => {
      if (!g || !screenTex) return;
      worldCtx.drawImage(canvas, 0, 0, 640, 360);
      screenTex.needsUpdate = true;
    };

    light = new THREE.PointLight(CHANNELS[channel].tint, 0.9, 6.5, 2);
    light.position.set(SCREEN_POS.x, SCREEN_POS.y - 0.1, SCREEN_POS.z + 0.9);
    scene.add(light);
  }

  function setChannel(index) {
    const next = Math.max(0, Math.min(CHANNELS.length - 1, index));
    if (next === channel) return;
    channel = next;
    if (audio) audio.play('ui');
    if (refs.show) refs.show.textContent = CHANNELS[channel].name;
    if (refs.channels) {
      Array.from(refs.channels.children).forEach((btn, i) => {
        btn.classList.toggle('active', i === channel);
      });
    }
    if (light) light.color.setHex(CHANNELS[channel].tint);
    elapsed = 0;
    draw();
    syncWorld();
  }

  function syncWorld() {
    if (screenMesh && screenMesh.userData.sync) screenMesh.userData.sync();
  }

  function open() {
    if (running) return true;
    running = true;
    channel = 0;
    elapsed = 0;
    drawTimer = 0;
    buildScreen();
    buildPanel();
    mask.classList.add('show');
    if (audio) audio.play('tvOn');
    draw();
    syncWorld();
    return true;
  }

  function close() {
    if (!running) return;
    running = false;
    if (audio) audio.play('tvOff');
    if (screenMesh) {
      scene.remove(screenMesh);
      screenMesh.geometry.dispose();
      screenMesh.material.dispose();
      if (screenTex) screenTex.dispose();
      screenMesh = null;
      screenTex = null;
    }
    if (light) {
      scene.remove(light);
      light = null;
    }
    if (mask) {
      mask.remove();
      mask = null;
      canvas = null;
      g = null;
      refs = {};
    }
    if (onClose) onClose();
  }

  function update(dt) {
    if (!running) return;
    elapsed += dt;
    drawTimer += dt;
    if (drawTimer >= 0.08) {
      drawTimer = 0;
      draw();
      syncWorld();
    }
    if (light) {
      light.intensity = 0.75 + Math.sin(elapsed * 5.2) * 0.18;
    }
  }

  function isOpen() {
    return running;
  }

  function dispose() {
    close();
  }

  return {
    open,
    close,
    update,
    setChannel,
    isOpen,
    dispose,
    channels: CHANNELS,
    position: SCREEN_POS,
  };
}
