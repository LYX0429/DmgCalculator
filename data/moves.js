const MOVES = [
  // 普通
  { id: "猛烈撞击",   name: "猛烈撞击",   power: 65,  category: "physical", type: "普通", icon: "assets/icons/moves/猛烈撞击.png" },
  { id: "星星撞击",   name: "星星撞击",   power: 90,  category: "special",  type: "普通", icon: "assets/icons/moves/星星撞击.png" },
  // 光
  { id: "闪光",       name: "闪光",       power: 60,  category: "special",  type: "光",   icon: "assets/icons/moves/闪光.png" },
  { id: "光球",       name: "光球",       power: 80,  category: "special",  type: "光",   icon: "assets/icons/moves/光球.png" },
  { id: "闪光冲击",   name: "闪光冲击",   power: 100, category: "physical", type: "光",   icon: "assets/icons/moves/闪光冲击.png" },
  { id: "光刃",       name: "光刃",       power: 120, category: "physical", type: "光",   icon: "assets/icons/moves/光刃.png" },
  { id: "折射",       name: "折射",       power: 50,  category: "special",  type: "光",   icon: "assets/icons/moves/折射.png",   note: "携带其他系别技能会产生不同效果" },
  { id: "折线冲击",   name: "折线冲击",   power: 80,  category: "physical", type: "光",   icon: "assets/icons/moves/折线冲击.png" },
  // 火
  { id: "火焰箭",     name: "火焰箭",     power: 80,  category: "physical", type: "火",   icon: "assets/icons/moves/火焰箭.png" },
  { id: "火焰冲锋",   name: "火焰冲锋",   power: 60,  category: "physical", type: "火",   icon: "assets/icons/moves/火焰冲锋.png" },
  { id: "炎打",       name: "炎打",       power: 95,  category: "special",  type: "火",   icon: "assets/icons/moves/炎打.png",   note: "自己获得物防-40%" },
  { id: "闪燃",       name: "闪燃",       power: 40,  category: "physical", type: "火",   icon: "assets/icons/moves/闪燃.png",   note: "应对状态：本次技能威力变为4倍" },
  // 水
  { id: "潮涌",       name: "潮涌",       power: 80,  category: "physical", type: "水",   icon: "assets/icons/moves/潮涌.png" },
  { id: "泡沫",       name: "泡沫",       power: 60,  category: "physical", type: "水",   icon: "assets/icons/moves/泡沫.png" },
  { id: "气泡",       name: "气泡",       power: 100, category: "special",  type: "水",   icon: "assets/icons/moves/气泡.png" },
  { id: "天洪",       name: "天洪",       power: 150, category: "special",  type: "水",   icon: "assets/icons/moves/天洪.png",   note: "应对状态：本技能能耗永久-6" },
  // 草
  { id: "棘突",       name: "棘突",       power: 100, category: "special",  type: "草",   icon: "assets/icons/moves/棘突.png" },
  { id: "花香",       name: "花香",       power: 60,  category: "special",  type: "草",   icon: "assets/icons/moves/花香.png" },
  { id: "抽枝",       name: "抽枝",       power: 90,  category: "physical", type: "草",   icon: "assets/icons/moves/抽枝.png",   note: "应对状态：自己回复50%生命和5能量" },
  { id: "藤绞",       name: "藤绞",       power: 80,  category: "physical", type: "草",   icon: "assets/icons/moves/藤绞.png",   note: "自己回复5能量" },
  // 电
  { id: "超导",       name: "超导",       power: 95,  category: "special",  type: "电",   icon: "assets/icons/moves/超导.png",   note: "迸发：本技能能耗-1" },
  { id: "球状闪电",   name: "球状闪电",   power: 60,  category: "physical", type: "电",   icon: "assets/icons/moves/球状闪电.png" },
  { id: "电弧",       name: "电弧",       power: 80,  category: "physical", type: "电",   icon: "assets/icons/moves/电弧.png",   note: "迸发：本次技能威力+40" },
  // 冰
  { id: "冰爪",       name: "冰爪",       power: 80,  category: "physical", type: "冰",   icon: "assets/icons/moves/冰爪.png" },
  { id: "冷风",       name: "冷风",       power: 60,  category: "special",  type: "冰",   icon: "assets/icons/moves/冷风.png",   note: "敌方获得魔防-50%" },
  { id: "寒风吹",     name: "寒风吹",     power: 70,  category: "special",  type: "冰",   icon: "assets/icons/moves/寒风吹.png", note: "敌方获得魔防-50%" },
  // 地
  { id: "热砂",       name: "热砂",       power: 80,  category: "special",  type: "地",   icon: "assets/icons/moves/热砂.png" },
  { id: "扬沙",       name: "扬沙",       power: 60,  category: "physical", type: "地",   icon: "assets/icons/moves/扬沙.png" },
  { id: "跺地",       name: "跺地",       power: 80,  category: "physical", type: "地",   icon: "assets/icons/moves/跺地.png" },
  // 幻
  { id: "念力膨胀",   name: "念力膨胀",   power: 80,  category: "physical", type: "幻",   icon: "assets/icons/moves/念力膨胀.png" },
  { id: "星云漩涡",   name: "星云漩涡",   power: 60,  category: "physical", type: "幻",   icon: "assets/icons/moves/星云漩涡.png" },
  { id: "坍缩",       name: "坍缩",       power: 85,  category: "special",  type: "幻",   icon: "assets/icons/moves/坍缩.png",   note: "若击败敌方，自己获得魔攻+70%" },
  // 龙
  { id: "升龙咆哮",   name: "升龙咆哮",   power: 200, category: "special",  type: "龙",   icon: "assets/icons/moves/升龙咆哮.png", note: "蓄力" },
  // 恶
  { id: "恶能量",     name: "恶能量",     power: 60,  category: "physical", type: "恶",   icon: "assets/icons/moves/恶能量.png" },
  // 武
  { id: "缠丝劲",     name: "缠丝劲",     power: 25,  category: "physical", type: "武",   icon: "assets/icons/moves/缠丝劲.png", note: "2连击" },
  // 翼
  { id: "鹰爪",       name: "鹰爪",       power: 60,  category: "physical", type: "翼",   icon: "assets/icons/moves/鹰爪.png" },
  // 萌
  { id: "魅惑",       name: "魅惑",       power: 60,  category: "special",  type: "萌",   icon: "assets/icons/moves/魅惑.png" },
  // 幽
  { id: "幻象",       name: "幻象",       power: 60,  category: "physical", type: "幽",   icon: "assets/icons/moves/幻象.png" },
  // 虫
  { id: "噬心",       name: "噬心",       power: 60,  category: "physical", type: "虫",   icon: "assets/icons/moves/噬心.png" },
  // 机械
  { id: "离子震荡",   name: "离子震荡",   power: 90,  category: "special",  type: "机械", icon: "assets/icons/moves/离子震荡.png", note: "本技能位于3号位时威力+40" },
  // 毒
  { id: "溃烂触碰",   name: "溃烂触碰",   power: 60,  category: "physical", type: "毒",   icon: "assets/icons/moves/溃烂触碰.png" },
];
