// data/buffs.js
// 属性增强类特性的 Buff 定义（abilityMult / defAbilityMult 类不在此列）
// perStack 字段：atkPct/spatkPct/defPct/spdefPct/spdPct（百分比，0.5=+50%）
//                atkFlat/spatkFlat/defFlat/spdefFlat/spdFlat（数值加成）
//                powerFlat（技能威力数值加成）
// getTotalEffects(stacks) 用于非线性效果（取代 perStack）
// 注：无 side 限制，精灵无论在攻方还是防方都会应用自身特性

const ABILITY_BUFF_DEFS = {
  // ── Toggle 类 ────────────────────────────────────────────────────────────
  "音速犬": [{
    name: "专注力",
    effectKey: "专注力",
    icon: "assets/icons/buffs/专注力.png",
    type: "toggle",
    maxStacks: 1,
    defaultStacks: 1,
    perStack: { atkPct: 1.0 },
  }],
  "古卷执政官": [{
    name: "图书守卫者",
    effectKey: "图书守卫者",
    icon: "assets/icons/buffs/图书守卫者.png",
    type: "toggle",
    maxStacks: 1,
    defaultStacks: 0,
    perStack: { atkPct: 0.5, spatkPct: 0.5 },
  }],
  "卷胡巨獭": [{
    name: "保守派",
    effectKey: "保守派",
    icon: "assets/icons/buffs/保守派.png",
    type: "toggle",
    maxStacks: 1,
    defaultStacks: 0,
    perStack: { defPct: 0.8, spdefPct: 0.8 },
  }],

  // ── Stepper 类 ───────────────────────────────────────────────────────────
  "风暴战犬": [{
    name: "全神贯注",
    effectKey: "行动次数",
    icon: "assets/icons/buffs/全神贯注.png",
    type: "stepper",
    maxStacks: 5,
    defaultStacks: 0,
    // 入场时获得物攻+100%，每次行动后-20%；stacks=行动次数
    getTotalEffects: (stacks) => ({
      atkPct: Math.max(0, 1.0 - 0.2 * stacks),
    }),
  }],
  "恶魔狼": [{
    name: "悲悯",
    effectKey: "力竭精灵数",
    icon: "assets/icons/buffs/悲悯.png",
    type: "stepper",
    maxStacks: 5,
    defaultStacks: 0,
    perStack: { atkPct: 0.3, spatkPct: 0.3 },
  }],
  "恶魔狼王": [{
    name: "悼亡",
    effectKey: "力竭精灵数",
    icon: "assets/icons/buffs/悼亡.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.3, spatkPct: 0.3 },
  }],
  "乌拉塔（极昼的样子）": [{
    name: "恶魔的晚宴",
    effectKey: "已击败次数",
    icon: "assets/icons/buffs/恶魔的晚宴.png",
    type: "stepper",
    maxStacks: 5,
    defaultStacks: 0,
    perStack: { atkPct: 0.5, spatkPct: 0.5 },
  }],
  "乌拉塔（极夜的样子）": [{
    name: "恶魔的晚宴",
    effectKey: "已击败次数",
    icon: "assets/icons/buffs/恶魔的晚宴.png",
    type: "stepper",
    maxStacks: 5,
    defaultStacks: 0,
    perStack: { atkPct: 0.5, spatkPct: 0.5 },
  }],
  "爵士鹿": [{
    name: "蓄电池",
    effectKey: "入场次数",
    icon: "assets/icons/buffs/蓄电池.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.3, spatkPct: 0.3 },
  }],
  "波普鹿": [{
    name: "超级电池",
    effectKey: "入场次数",
    icon: "assets/icons/buffs/超级电池.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.4, spatkPct: 0.4 },
  }],
  "绅士鸡": [{
    name: "指挥家",
    effectKey: "应对次数",
    icon: "assets/icons/buffs/指挥家.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.3, spatkPct: 0.3 },
  }],
  "武者鸡": [{
    name: "斗技",
    effectKey: "应对次数",
    icon: "assets/icons/buffs/斗技.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { powerFlat: 30 },
  }],
  "窃光蚊": [{
    name: "血型吸引",
    effectKey: "敌方系别数",
    icon: "assets/icons/buffs/血型吸引.png",
    type: "stepper",
    maxStacks: 18,
    defaultStacks: 0,
    perStack: { powerFlat: 10 },
  }],
  "蹦床松鼠": [{
    name: "囤积",
    effectKey: "当前能量",
    icon: "assets/icons/buffs/囤积.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 10,
    perStack: { defPct: 0.1, spdefPct: 0.1 },
  }],

  // ── 新增 Toggle 类 ───────────────────────────────────────────────────────
  // 原文：队伍存在虫系精灵，自己获得双攻+50%
  "巨噬针鼹": [{
    name: "壮胆",
    effectKey: "壮胆",
    icon: "assets/icons/buffs/壮胆.png",
    type: "toggle",
    maxStacks: 1,
    defaultStacks: 0,
    perStack: { atkPct: 0.5, spatkPct: 0.5 },
  }],

  // 原文：天气为雨天或水系环境时，获得双攻+100%
  "卷毛鸭": [{
    name: "得寸进尺",
    effectKey: "得寸进尺",
    icon: "assets/icons/buffs/得寸进尺.png",
    type: "toggle",
    maxStacks: 1,
    defaultStacks: 0,
    perStack: { atkPct: 1.0, spatkPct: 1.0 },
  }],

  // 原文：周末双攻+40%，其他时间双防+40% → 拆成两个独立 toggle
  "上岸蛙": [
    {
      name: "张弛有度（攻）",
      effectKey: "张弛有度攻",
      icon: "assets/icons/buffs/张弛有度.png",
      type: "toggle",
      maxStacks: 1,
      defaultStacks: 0,
      perStack: { atkPct: 0.4, spatkPct: 0.4 },
    },
    {
      name: "张弛有度（防）",
      effectKey: "张弛有度防",
      icon: "assets/icons/buffs/张弛有度.png",
      type: "toggle",
      maxStacks: 1,
      defaultStacks: 0,
      perStack: { defPct: 0.4, spdefPct: 0.4 },
    },
  ],

  // 原文：携带的攻击技能获得迸发：威力+40（被动全程生效，默认开启）
  "星光狮（星光能量的样子）": [{
    name: "电流刺激",
    effectKey: "电流刺激",
    icon: "assets/icons/buffs/电流刺激.png",
    type: "toggle",
    maxStacks: 1,
    defaultStacks: 1,
    perStack: { powerFlat: 40 },
  }],
  "星光狮（月光能量的样子）": [{
    name: "电流刺激",
    effectKey: "电流刺激",
    icon: "assets/icons/buffs/电流刺激.png",
    type: "toggle",
    maxStacks: 1,
    defaultStacks: 1,
    perStack: { powerFlat: 40 },
  }],

  // ── 新增 Stepper 类 ──────────────────────────────────────────────────────
  // 原文：造成克制伤害后，获得攻防速+20%（用户确认：双攻双防速度）
  "迪莫": [{
    name: "最好的伙伴",
    effectKey: "克制次数",
    icon: "assets/icons/buffs/最好的伙伴.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.2, spatkPct: 0.2, defPct: 0.2, spdefPct: 0.2, spdPct: 0.2 },
  }],

  // 原文：使用火系技能后，获得双攻+20%
  "火神": [{
    name: "助燃",
    effectKey: "火系技能次数",
    icon: "assets/icons/buffs/助燃.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.2, spatkPct: 0.2 },
  }],

  // 原文：使用火系技能后，获得双攻+30%
  "烈火战神": [{
    name: "爆燃",
    effectKey: "火系技能次数",
    icon: "assets/icons/buffs/爆燃.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.3, spatkPct: 0.3 },
  }],

  // 原文：使用能耗为3的技能时，获得攻防+20%（用户确认：双攻双防）
  "梦想三三": [{
    name: "鼓气",
    effectKey: "3耗能技能次数",
    icon: "assets/icons/buffs/鼓气.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.2, spatkPct: 0.2, defPct: 0.2, spdefPct: 0.2 },
  }],

  // 原文：使用能耗为3的技能时，获得攻防永久+20%（用户确认：双攻双防）
  "奇梦咪": [{
    name: "三鼓作气",
    effectKey: "3耗能技能次数",
    icon: "assets/icons/buffs/三鼓作气.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.2, spatkPct: 0.2, defPct: 0.2, spdefPct: 0.2 },
  }],

  // 原文：每有1只其他虫系精灵，入场时获得攻防速+15%（用户确认：双攻双防速度）
  "女王蜂": [{
    name: "虫群鼓舞",
    effectKey: "虫系精灵数",
    icon: "assets/icons/buffs/虫群鼓舞.png",
    type: "stepper",
    maxStacks: 5,
    defaultStacks: 0,
    perStack: { atkPct: 0.15, spatkPct: 0.15, defPct: 0.15, spdefPct: 0.15, spdPct: 0.15 },
  }],
  "花魁蜂后": [{
    name: "虫群突袭",
    effectKey: "虫系精灵数",
    icon: "assets/icons/buffs/虫群突袭.png",
    type: "stepper",
    maxStacks: 5,
    defaultStacks: 0,
    perStack: { atkPct: 0.15, spatkPct: 0.15, defPct: 0.15, spdefPct: 0.15, spdPct: 0.15 },
  }],

  // 原文：每使用1次火系技能，全技能威力+10
  "烈火守护": [{
    name: "蒸汽膨胀",
    effectKey: "火系技能次数",
    icon: "assets/icons/buffs/蒸汽膨胀.png",
    type: "stepper",
    maxStacks: 20,
    defaultStacks: 0,
    perStack: { powerFlat: 10 },
  }],

  // 原文：每次敌方聚能或换人，获得魔攻+20%
  "夜枭": [{
    name: "搜刮",
    effectKey: "触发次数",
    icon: "assets/icons/buffs/搜刮.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { spatkPct: 0.2 },
  }],

  // 原文：若技能在系别/类型/能耗上每有1项匹配，获得物攻和物防永久+20%
  "巨鼓象": [{
    name: "合拍",
    effectKey: "匹配次数",
    icon: "assets/icons/buffs/合拍.png",
    type: "stepper",
    maxStacks: 10,
    defaultStacks: 0,
    perStack: { atkPct: 0.2, defPct: 0.2 },
  }],
};

// ── 通用 Buff 定义（所有精灵共享，用于技能强化面板）────────────────────────
// minStacks 支持负值（减益方向），每层 10% 或 10点
const GENERIC_BUFF_DEFS = [
  { name: "物攻增强", effectKey: "物攻增强",
    icon: "assets/icons/buffs/物攻增强.png",
    type: "stepper", minStacks: -50, maxStacks: 50, defaultStacks: 0,
    perStack: { atkPct: 0.1 } },
  { name: "魔攻增强", effectKey: "魔攻增强",
    icon: "assets/icons/buffs/魔攻增强.png",
    type: "stepper", minStacks: -50, maxStacks: 50, defaultStacks: 0,
    perStack: { spatkPct: 0.1 } },
  { name: "物防增强", effectKey: "物防增强",
    icon: "assets/icons/buffs/物防增强.png",
    type: "stepper", minStacks: -50, maxStacks: 50, defaultStacks: 0,
    perStack: { defPct: 0.1 } },
  { name: "魔防增强", effectKey: "魔防增强",
    icon: "assets/icons/buffs/魔防增强.png",
    type: "stepper", minStacks: -50, maxStacks: 50, defaultStacks: 0,
    perStack: { spdefPct: 0.1 } },
  { name: "速度增强", effectKey: "速度增强",
    icon: "assets/icons/buffs/速度增强.png",
    type: "stepper", minStacks: -50, maxStacks: 50, defaultStacks: 0,
    perStack: { spdFlat: 10 } },
];
