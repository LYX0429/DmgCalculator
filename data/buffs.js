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
};
