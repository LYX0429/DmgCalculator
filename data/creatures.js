// 性格列表：boost/reduce 对应 "hp"|"atk"|"def"|"spatk"|"spdef"|"spd"
const NATURES = [
  { name: "逞强", boost: "atk",   reduce: "hp"    },
  { name: "固执", boost: "atk",   reduce: "spatk" },
  { name: "大胆", boost: "atk",   reduce: "def"   },
  { name: "调皮", boost: "atk",   reduce: "spdef" },
  { name: "勇敢", boost: "atk",   reduce: "spd"   },
  { name: "坦率", boost: "def",   reduce: "hp"    },
  { name: "稳重", boost: "def",   reduce: "atk"   },
  { name: "天真", boost: "def",   reduce: "spatk" },
  { name: "懒散", boost: "def",   reduce: "spdef" },
  { name: "悠闲", boost: "def",   reduce: "spd"   },
  { name: "理性", boost: "spatk", reduce: "hp"    },
  { name: "聪明", boost: "spatk", reduce: "atk"   },
  { name: "专注", boost: "spatk", reduce: "def"   },
  { name: "偏执", boost: "spatk", reduce: "spdef" },
  { name: "冷静", boost: "spatk", reduce: "spd"   },
  { name: "焦虑", boost: "spdef", reduce: "hp"    },
  { name: "警惕", boost: "spdef", reduce: "atk"   },
  { name: "害羞", boost: "spdef", reduce: "spatk" },
  { name: "温顺", boost: "spdef", reduce: "def"   },
  { name: "慎重", boost: "spdef", reduce: "spd"   },
  { name: "热情", boost: "spd",   reduce: "hp"    },
  { name: "胆小", boost: "spd",   reduce: "atk"   },
  { name: "开朗", boost: "spd",   reduce: "spatk" },
  { name: "急躁", boost: "spd",   reduce: "def"   },
  { name: "莽撞", boost: "spd",   reduce: "spdef" },
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

// 精灵数据
const CREATURES = [
  {
    id: "di-mo",
    no: "001",
    name: "迪莫",
    types: ["光"],
    image: "assets/creatures/迪莫.png",
    baseStats: { hp: 120, atk: 80, spatk: 80, def: 105, spdef: 105, spd: 92 },
    ivs: { atk: 60, spatk: 60, spd: 60 },
    nature: { name: "莽撞", boost: "spd", reduce: "spdef" },
    commonMoves: ["折射", "棘突", "潮涌", "火焰箭", "超导", "热砂", "光刃"]
  },
];
