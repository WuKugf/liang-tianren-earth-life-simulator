// 换装面板：网格卡片，切换后实时反映到 3D 模型
function toCss(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

export function createWardrobePanel({ root, wardrobe, onApply }) {
  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <div><h2>添任的衣橱</h2><p>选一套喜欢的衣服，立刻穿到身上</p></div>
        <button class="panel-close">×</button>
      </div>
      <div class="outfit-grid"></div>
    </div>
  `;
  root.appendChild(mask);

  const grid = mask.querySelector('.outfit-grid');
  let open = false;

  function sync() {
    const currentId = wardrobe.getCurrent().id;
    grid.querySelectorAll('.outfit-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.id === currentId);
    });
  }

  wardrobe.outfits.forEach((outfit) => {
    const card = document.createElement('button');
    card.className = 'outfit-card';
    card.dataset.id = outfit.id;
    card.innerHTML = `
      <div class="outfit-preview" style="--preview-shirt:${toCss(outfit.shirt)};--preview-pants:${toCss(outfit.pants)}"></div>
      <strong>${outfit.name}</strong>
      <span>${outfit.note}</span>
    `;
    card.addEventListener('click', () => {
      wardrobe.apply(outfit.id);
      sync();
      if (onApply) onApply(outfit);
    });
    grid.appendChild(card);
  });

  mask.querySelector('.panel-close').addEventListener('click', closePanel);
  mask.addEventListener('click', (e) => {
    if (e.target === mask) closePanel();
  });

  function openPanel() {
    open = true;
    sync();
    mask.classList.add('show');
  }

  function closePanel() {
    open = false;
    mask.classList.remove('show');
  }

  function toggle() {
    if (open) closePanel();
    else openPanel();
  }

  return {
    open: openPanel,
    close: closePanel,
    toggle,
    isOpen: () => open,
    sync,
  };
}
