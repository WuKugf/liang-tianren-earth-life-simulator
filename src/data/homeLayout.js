// 奥园广场 · 中央墅 —— 梁添任的家：小区与别墅统一布局数据
// 坐标系：X 向东、Z 向南（+Z 为院子/小区入口方向），Y 向上，单位 1 = 1 米

export const HOME_LAYOUT = {
  bounds: { minX: -110, maxX: 110, minZ: -110, maxZ: 110 },
  spawn: { x: 0, z: 0, yaw: 0 },

  // 小区
  compound: {
    wall: 104, // 围墙位置（±）
    entrance: { x: 104, z: 24, gap: 7 }, // 东侧小区大门，朝向金榜小学
  },

  roads: {
    // 东西向主干道（家门前）
    main: { minX: -105, maxX: 105, minZ: 20, maxZ: 28 },
    // 北侧环路
    north: { minX: -95, maxX: 95, minZ: -76, maxZ: -68 },
    // 连接环路的支路
    westLink: { x: -60, width: 8, minZ: -68, maxZ: 20 },
    eastLink: { x: 70, width: 8, minZ: -68, maxZ: 20 },
    // 私家车道：院门 → 主干道
    driveway: { minX: -3.5, maxX: 3.5, minZ: 8, maxZ: 20 },
    // 中心花园步道
    gardenPath: { minX: 48, maxX: 52, minZ: -25, maxZ: 20 },
  },

  // 小区中心花园（水景 / 花坛 / 步道 / 长椅）
  garden: {
    cx: 50,
    cz: -45,
    pondRadius: 9,
    ringRadius: 13,
    minX: 20,
    maxX: 80,
    minZ: -66,
    maxZ: -25,
  },

  // 梁添任家的地块
  yard: {
    minX: -22,
    maxX: 22,
    minZ: -42,
    maxZ: 8,
    gate: { x: 0, z: 8, width: 5.2 },
  },

  // 别墅主体（两层，楼板面 3.2m）
  house: {
    minX: -12,
    maxX: 12,
    minZ: -24,
    maxZ: -6,
    height: 6.4,
    floor2: 3.2,
    wall: 0.3,
  },

  // 室内楼梯：自北（一层楼梯厅）向南上到二层
  stairs: {
    minX: 7.4,
    maxX: 11.4,
    minZ: -22,
    maxZ: -15.5,
    steps: 16,
    rise: 0.2,
  },

  // 交互点位（position.y 仅作提示锚点，核心按 XZ 判定距离）
  interactables: [
    {
      id: 'home-bed',
      label: '睡觉 / 起床',
      action: 'sleep',
      position: { x: -8, y: 3.2, z: -11.6 },
      radius: 2.4,
      meta: { untilHour: 6.8, scene: 'home', place: 'bedroom' },
    },
    {
      id: 'home-desk',
      label: '学习',
      action: 'study',
      position: { x: 9.2, y: 3.2, z: -11 },
      radius: 2.2,
      meta: { place: 'study' },
    },
    {
      id: 'home-sofa',
      label: '休息',
      action: 'rest',
      position: { x: -9.4, y: 0, z: -10.2 },
      radius: 2.3,
      meta: { place: 'living' },
    },
    {
      id: 'home-jumprope',
      label: '跳绳',
      action: 'jumpRope',
      position: { x: 0, y: 0, z: -31 },
      radius: 2.7,
      meta: { place: 'backyard' },
    },
    {
      id: 'home-soccer',
      label: '踢球',
      action: 'soccer',
      position: { x: -8, y: 0, z: -34.5 },
      radius: 2.7,
      meta: { place: 'backyard' },
    },
    {
      id: 'home-sunbathe',
      label: '晒太阳',
      action: 'sunbathe',
      position: { x: 9, y: 0, z: -32 },
      radius: 2.7,
      meta: { place: 'backyard' },
    },
  ],
};

export const HOME_LABELS = {
  compound: '奥园广场 · 中央墅',
  house: '梁宅',
  houseNo: '8号',
};
