// 衣橱：所有服装都用程序化颜色配置，切换时实时更新 3D 模型
export const OUTFITS = [
  {
    id: 'mint',
    name: '浅绿无袖',
    note: '照片同款 · 初始服装',
    shirt: 0xcfe3d5,
    trim: 0xffffff,
    pants: 0x47515f,
    pantsLength: 'short',
    sleeves: false,
    shoe: 0xf6f4ef,
    sole: 0xd9d4c8,
    logo: true,
    logoColor: 0x37503f,
  },
  {
    id: 'school',
    name: '金榜校服',
    note: '白衬衫 + 蓝长裤 + 红领巾',
    shirt: 0xf7f5ef,
    trim: 0x3d6ba6,
    pants: 0x2f4668,
    pantsLength: 'long',
    sleeves: true,
    sleeve: 0xf7f5ef,
    shoe: 0xf2f2ef,
    sole: 0xcfcabd,
    logo: false,
    necker: true,
  },
  {
    id: 'sport',
    name: '运动套装',
    note: '蓝白撞色 · 适合跑步',
    shirt: 0x4b7ec9,
    trim: 0xffffff,
    pants: 0x2b3d5c,
    pantsLength: 'long',
    sleeves: true,
    sleeve: 0x4b7ec9,
    shoe: 0xffffff,
    sole: 0xcfd6de,
    logo: false,
    stripes: true,
  },
  {
    id: 'basketball',
    name: '篮球战袍',
    note: '黄红配色 · 球场最亮',
    shirt: 0xf3b63e,
    trim: 0xd4463f,
    pants: 0xd4463f,
    pantsLength: 'short',
    sleeves: false,
    shoe: 0xf7f7f7,
    sole: 0xffd98a,
    logo: true,
    logoColor: 0xa8322b,
  },
  {
    id: 'soccer',
    name: '足球球衣',
    note: '红色条纹 · 绿茵奔跑',
    shirt: 0xd4463f,
    trim: 0xffffff,
    pants: 0xf2f2f2,
    pantsLength: 'short',
    sleeves: true,
    sleeve: 0xd4463f,
    shoe: 0xffffff,
    sole: 0x2f8f6e,
    logo: false,
    stripes: true,
  },
  {
    id: 'daily',
    name: '清爽日常',
    note: '浅蓝短袖 + 卡其短裤',
    shirt: 0x9fd3ea,
    trim: 0xffffff,
    pants: 0xb7a074,
    pantsLength: 'short',
    sleeves: true,
    sleeve: 0x9fd3ea,
    shoe: 0xf8f7f2,
    sole: 0xd6d0c1,
    logo: false,
  },
];

export function getOutfitById(id) {
  return OUTFITS.find((o) => o.id === id) || OUTFITS[0];
}

export function createWardrobe(character) {
  let current = OUTFITS[0];

  character.setStyle(current);

  function apply(id) {
    const outfit = getOutfitById(id);
    character.setStyle(outfit);
    current = outfit;
    return outfit;
  }

  return {
    outfits: OUTFITS,
    apply,
    getCurrent: () => current,
  };
}
