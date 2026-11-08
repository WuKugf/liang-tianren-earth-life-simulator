// 交互系统：靠近交互点显示提示，按 E 触发动作
export function createInteraction({ playerGroup, onPromptChange }) {
  let list = [];
  let current = null;
  let suppressUntil = 0;

  function setInteractables(items) {
    list = Array.isArray(items) ? items.filter(Boolean) : [];
    current = null;
    if (onPromptChange) onPromptChange(null);
  }

  function update() {
    const px = playerGroup.position.x;
    const pz = playerGroup.position.z;
    let best = null;
    let bestDist = Infinity;
    const now = performance.now();
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      if (!item || !item.position) continue;
      const dx = px - item.position.x;
      const dz = pz - item.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const radius = item.radius || 1.6;
      if (dist <= radius && dist < bestDist) {
        best = item;
        bestDist = dist;
      }
    }
    if (now < suppressUntil) best = null;
    if (best !== current) {
      current = best;
      if (onPromptChange) onPromptChange(current);
    }
    return current;
  }

  function getCurrent() {
    return current;
  }

  function suppress(ms = 600) {
    suppressUntil = performance.now() + ms;
    current = null;
    if (onPromptChange) onPromptChange(null);
  }

  function reset() {
    current = null;
    suppressUntil = 0;
  }

  return {
    update,
    getCurrent,
    setInteractables,
    suppress,
    reset,
  };
}
