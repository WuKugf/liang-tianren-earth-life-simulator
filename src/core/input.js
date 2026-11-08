// 输入系统：键盘、鼠标拖动视角、滚轮缩放、按键一次性消费
const BINDINGS = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
  jump: ['Space'],
  turnLeft: ['KeyQ'],
  turnRight: ['KeyE'],
};

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function createInput(domElement) {
  const down = new Set();
  const pressed = new Set();
  const look = { x: 0, y: 0 };
  let wheel = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let enabled = true;
  let pointerId = null;

  function onKeyDown(e) {
    if (isTypingTarget(e.target)) return;
    if (e.code === 'Space' || e.code.startsWith('Arrow')) {
      e.preventDefault();
    }
    if (!down.has(e.code)) {
      pressed.add(e.code);
    }
    down.add(e.code);
  }

  function onKeyUp(e) {
    down.delete(e.code);
  }

  function onBlur() {
    down.clear();
    pressed.clear();
    dragging = false;
    pointerId = null;
  }

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragging = true;
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    if (domElement.setPointerCapture) {
      try { domElement.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }

  function onPointerMove(e) {
    if (!dragging || (pointerId !== null && e.pointerId !== pointerId)) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    look.x += dx;
    look.y += dy;
  }

  function onPointerUp(e) {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
  }

  function onWheel(e) {
    wheel += Math.sign(e.deltaY);
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  domElement.addEventListener('wheel', onWheel, { passive: true });
  domElement.addEventListener('contextmenu', onContextMenu);

  function isDown(action) {
    if (!enabled) return false;
    const codes = BINDINGS[action];
    if (!codes) return false;
    for (let i = 0; i < codes.length; i += 1) {
      if (down.has(codes[i])) return true;
    }
    return false;
  }

  function isCodeDown(code) {
    return enabled && down.has(code);
  }

  function consumePress(action) {
    const codes = BINDINGS[action];
    if (!codes) return false;
    for (let i = 0; i < codes.length; i += 1) {
      if (pressed.has(codes[i])) {
        pressed.delete(codes[i]);
        return true;
      }
    }
    return false;
  }

  function consumeRawPress(code) {
    if (pressed.has(code)) {
      pressed.delete(code);
      return true;
    }
    return false;
  }

  function takeLookDelta() {
    const d = { x: look.x, y: look.y };
    look.x = 0;
    look.y = 0;
    return d;
  }

  function takeWheel() {
    const w = wheel;
    wheel = 0;
    return w;
  }

  function clearPressed() {
    pressed.clear();
  }

  function setEnabled(value) {
    enabled = value;
    if (!value) {
      down.clear();
      pressed.clear();
    }
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    domElement.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    domElement.removeEventListener('wheel', onWheel);
    domElement.removeEventListener('contextmenu', onContextMenu);
  }

  return {
    isDown,
    isCodeDown,
    consumePress,
    consumeRawPress,
    takeLookDelta,
    takeWheel,
    clearPressed,
    setEnabled,
    isDragging: () => dragging,
    dispose,
  };
}
