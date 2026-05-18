const MOVES = [
  // 普通
  { id: "normal-strike",   name: "普通冲击",   power: 40,  category: "physical", type: "普通" },
  { id: "normal-blast",    name: "能量冲击",   power: 80,  category: "special",  type: "普通" },
  // 火
  { id: "fire-spark",      name: "火花",       power: 40,  category: "special",  type: "火" },
  { id: "fire-breath",     name: "喷火",       power: 90,  category: "special",  type: "火" },
  { id: "fire-blast",      name: "火焰冲击",   power: 110, category: "special",  type: "火" },
  { id: "fire-claw",       name: "火焰爪",     power: 75,  category: "physical", type: "火" },
  // 水
  { id: "water-gun",       name: "水枪",       power: 40,  category: "special",  type: "水" },
  { id: "water-wave",      name: "水波",       power: 90,  category: "special",  type: "水" },
  { id: "water-strike",    name: "水流冲击",   power: 75,  category: "physical", type: "水" },
  // 草
  { id: "leaf-blade",      name: "飞叶",       power: 45,  category: "physical", type: "草" },
  { id: "solar-beam",      name: "太阳光束",   power: 120, category: "special",  type: "草" },
  { id: "grass-knot",      name: "草结",       power: 80,  category: "special",  type: "草" },
  // 电
  { id: "thunder-shock",   name: "电击",       power: 40,  category: "special",  type: "电" },
  { id: "thunderbolt",     name: "雷电",       power: 90,  category: "special",  type: "电" },
  { id: "thunder-fang",    name: "雷电牙",     power: 75,  category: "physical", type: "电" },
  // 冰
  { id: "ice-beam",        name: "冰冻光线",   power: 90,  category: "special",  type: "冰" },
  { id: "blizzard",        name: "暴风雪",     power: 110, category: "special",  type: "冰" },
  { id: "ice-punch",       name: "冰拳",       power: 75,  category: "physical", type: "冰" },
  // 地
  { id: "earthquake",      name: "地震",       power: 100, category: "physical", type: "地" },
  { id: "mud-bomb",        name: "泥巴炸弹",   power: 65,  category: "special",  type: "地" },
  // 翼
  { id: "air-slash",       name: "空气刀",     power: 75,  category: "special",  type: "翼" },
  { id: "wing-attack",     name: "翼击",       power: 60,  category: "physical", type: "翼" },
  // 武
  { id: "close-combat",    name: "近身战",     power: 120, category: "physical", type: "武" },
  { id: "power-fist",      name: "力量拳",     power: 80,  category: "physical", type: "武" },
  // 毒
  { id: "poison-blast",    name: "毒液炸弹",   power: 80,  category: "special",  type: "毒" },
  { id: "poison-jab",      name: "毒刺",       power: 80,  category: "physical", type: "毒" },
  // 虫
  { id: "bug-bite",        name: "啃咬",       power: 60,  category: "physical", type: "虫" },
  { id: "signal-beam",     name: "信号光束",   power: 75,  category: "special",  type: "虫" },
  // 幽
  { id: "shadow-ball",     name: "影子球",     power: 80,  category: "special",  type: "幽" },
  { id: "shadow-claw",     name: "暗影爪",     power: 70,  category: "physical", type: "幽" },
  // 龙
  { id: "dragon-claw",     name: "龙爪",       power: 80,  category: "physical", type: "龙" },
  { id: "dragon-pulse",    name: "龙之波动",   power: 85,  category: "special",  type: "龙" },
  // 恶
  { id: "dark-pulse",      name: "暗黑波动",   power: 80,  category: "special",  type: "恶" },
  { id: "crunch",          name: "咬碎",       power: 80,  category: "physical", type: "恶" },
  // 光
  { id: "light-beam",      name: "光束",       power: 90,  category: "special",  type: "光" },
  { id: "solar-ray",       name: "圣光射线",   power: 110, category: "special",  type: "光" },
  // 机械
  { id: "gear-strike",     name: "齿轮冲击",   power: 80,  category: "physical", type: "机械" },
  { id: "tech-blast",      name: "科技爆炸",   power: 100, category: "special",  type: "机械" },
  // 萌
  { id: "cute-charm",      name: "可爱魅力",   power: 50,  category: "special",  type: "萌" },
  { id: "play-rough",      name: "玩耍",       power: 90,  category: "physical", type: "萌" },
  // 幻
  { id: "psybeam",         name: "幻觉光线",   power: 65,  category: "special",  type: "幻" },
  { id: "psychic-blast",   name: "精神冲击",   power: 90,  category: "special",  type: "幻" },
];
