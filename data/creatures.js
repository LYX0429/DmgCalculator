// 性格列表：boost/reduce 对应 "hp"|"atk"|"def"|"spatk"|"spdef"|"spd"
const NATURES = [
  { name: "孤僻", boost: "atk",   reduce: "spatk" },
  { name: "固执", boost: "atk",   reduce: "spdef" },
  { name: "顽皮", boost: "atk",   reduce: "def"   },
  { name: "勇敢", boost: "atk",   reduce: "spd"   },
  { name: "保守", boost: "def",   reduce: "atk"   },
  { name: "坦率", boost: "def",   reduce: "spatk" },
  { name: "悠闲", boost: "def",   reduce: "spd"   },
  { name: "内敛", boost: "spatk", reduce: "atk"   },
  { name: "温和", boost: "spatk", reduce: "def"   },
  { name: "冷静", boost: "spatk", reduce: "spd"   },
  { name: "慎重", boost: "spdef", reduce: "atk"   },
  { name: "温顺", boost: "spdef", reduce: "spatk" },
  { name: "自大", boost: "spdef", reduce: "spd"   },
  { name: "胆小", boost: "spd",   reduce: "atk"   },
  { name: "急躁", boost: "spd",   reduce: "def"   },
  { name: "爽朗", boost: "spd",   reduce: "spatk" },
  { name: "天真", boost: "spd",   reduce: "spdef" },
  { name: "开朗", boost: "hp",    reduce: "spd"   },
  { name: "淘气", boost: "def",   reduce: "spdef" },
];

// 属性克制表：攻击属性 → 被克制的防御属性列表（×2）
// 命中1个防御属性 ×2，命中2个防御属性 ×3（最高×3）
const TYPE_CHART = {
  "普通": [],
  "草":  ["水", "光", "地"],
  "火":  ["草", "冰", "虫", "机械"],
  "水":  ["火", "地", "机械"],
  "光":  ["幽", "恶"],
  "地":  ["火", "冰", "电", "毒"],
  "冰":  ["草", "地", "龙", "翼"],
  "龙":  ["龙"],
  "电":  ["水", "翼"],
  "毒":  ["草", "萌"],
  "虫":  ["草", "恶", "幻"],
  "武":  ["地", "冰", "恶", "普通", "机械"],
  "翼":  ["草", "武", "虫"],
  "萌":  ["龙", "武", "恶"],
  "幽":  ["光", "幻", "幽"],
  "恶":  ["毒", "萌", "幽"],
  "幻":  ["毒", "武"],
  "机械": ["地", "冰", "萌"],
};

// 属性抵抗表：攻击属性 → 能抵抗该属性的防御属性列表（×0.5）
// 命中1个防御属性 ×0.5，命中2个防御属性 ×0.25
const RESIST_CHART = {
  "普通": ["地", "幽", "机械"],
  "草":  ["火", "龙", "毒", "虫", "翼", "机械"],
  "火":  ["水", "地", "龙"],
  "水":  ["草", "冰", "龙"],
  "光":  ["草", "冰"],
  "地":  ["草", "武"],
  "冰":  ["火", "冰", "机械"],
  "龙":  ["机械"],
  "电":  ["草", "地", "龙", "电"],
  "毒":  ["地", "毒", "武", "幽"],
  "虫":  ["火", "毒", "武", "翼", "萌", "幽", "机械"],
  "武":  ["毒", "翼", "萌", "幽", "幻", "虫"],
  "翼":  ["地", "龙", "电", "机械"],
  "萌":  ["火", "毒", "机械"],
  "幽":  ["恶", "普通"],
  "恶":  ["光", "武", "恶"],
  "幻":  ["光", "幻", "机械"],
  "机械": ["火", "水", "电", "机械"],
};

// 精灵数据（种族值为占位数据，请根据游戏实际数值修改）
const CREATURES = [
  {
    id: "fire-wolf",
    name: "火焰狼",
    types: ["火"],
    baseStats: { hp: 75, atk: 100, spatk: 80, def: 65, spdef: 70, spd: 120 },
    ivs: { atk: 60, spd: 54 },
    nature: { name: "固执", boost: "atk", reduce: "spdef" },
    commonMoves: ["fire-claw", "fire-breath", "close-combat"]
  },
  {
    id: "water-turtle",
    name: "水甲龟",
    types: ["水"],
    baseStats: { hp: 85, atk: 75, spatk: 85, def: 110, spdef: 100, spd: 60 },
    ivs: { def: 60, spdef: 54, hp: 48 },
    nature: { name: "保守", boost: "def", reduce: "atk" },
    commonMoves: ["water-wave", "water-gun", "water-strike"]
  },
  {
    id: "grass-fairy",
    name: "草叶精",
    types: ["草", "萌"],
    baseStats: { hp: 80, atk: 70, spatk: 105, def: 75, spdef: 95, spd: 80 },
    ivs: { spatk: 60, spdef: 48 },
    nature: { name: "温和", boost: "spatk", reduce: "def" },
    commonMoves: ["solar-beam", "grass-knot", "leaf-blade"]
  },
  {
    id: "thunder-bird",
    name: "雷鸟",
    types: ["电", "翼"],
    baseStats: { hp: 65, atk: 80, spatk: 115, def: 60, spdef: 75, spd: 110 },
    ivs: { spatk: 60, spd: 60 },
    nature: { name: "冷静", boost: "spatk", reduce: "spd" },
    commonMoves: ["thunderbolt", "air-slash", "thunder-fang"]
  },
  {
    id: "ice-dragon",
    name: "冰霜龙",
    types: ["冰", "龙"],
    baseStats: { hp: 90, atk: 110, spatk: 95, def: 90, spdef: 85, spd: 75 },
    ivs: { atk: 60, hp: 54 },
    nature: { name: "固执", boost: "atk", reduce: "spdef" },
    commonMoves: ["dragon-claw", "ice-punch", "blizzard"]
  },
  {
    id: "ghost-shadow",
    name: "暗影幽灵",
    types: ["幽", "恶"],
    baseStats: { hp: 60, atk: 85, spatk: 125, def: 55, spdef: 80, spd: 115 },
    ivs: { spatk: 60, spd: 60, hp: 42 },
    nature: { name: "内敛", boost: "spatk", reduce: "atk" },
    commonMoves: ["shadow-ball", "dark-pulse", "shadow-claw"]
  },
  {
    id: "mech-golem",
    name: "机械魔像",
    types: ["机械"],
    baseStats: { hp: 100, atk: 120, spatk: 60, def: 130, spdef: 60, spd: 40 },
    ivs: { atk: 60, def: 54 },
    nature: { name: "顽皮", boost: "atk", reduce: "def" },
    commonMoves: ["gear-strike", "tech-blast", "earthquake"]
  },
  {
    id: "light-phoenix",
    name: "光辉凤凰",
    types: ["光", "翼"],
    baseStats: { hp: 80, atk: 75, spatk: 120, def: 70, spdef: 100, spd: 100 },
    ivs: { spatk: 60, spd: 48, spdef: 42 },
    nature: { name: "温和", boost: "spatk", reduce: "def" },
    commonMoves: ["solar-ray", "light-beam", "air-slash"]
  },
  {
    id: "poison-serpent",
    name: "毒蛇",
    types: ["毒"],
    baseStats: { hp: 70, atk: 90, spatk: 90, def: 70, spdef: 75, spd: 95 },
    ivs: { atk: 60, spatk: 48 },
    nature: { name: "孤僻", boost: "atk", reduce: "spatk" },
    commonMoves: ["poison-jab", "poison-blast", "crunch"]
  },
  {
    id: "psychic-fox",
    name: "幻术狐",
    types: ["幻"],
    baseStats: { hp: 65, atk: 60, spatk: 130, def: 60, spdef: 95, spd: 105 },
    ivs: { spatk: 60, spd: 54, spdef: 48 },
    nature: { name: "内敛", boost: "spatk", reduce: "atk" },
    commonMoves: ["psychic-blast", "psybeam", "shadow-ball"]
  },
];
