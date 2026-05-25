const STAT_NAMES = { hp: 'HP', atk: '物攻', def: '物防', spatk: '魔攻', spdef: '魔防', spd: '速度' };
const STAT_IDS         = ['hp', 'atk', 'spatk', 'def', 'spdef', 'spd'];

const STAT_ICONS = {
  hp:    'assets/icons/stat-hp.png',
  atk:   'assets/icons/stat-atk.png',
  def:   'assets/icons/stat-def.png',
  spatk: 'assets/icons/stat-spatk.png',
  spdef: 'assets/icons/stat-spdef.png',
  spd:   'assets/icons/stat-spd.png',
};

const TYPE_ICONS = {
  '普通': 'assets/icons/type-putong.png',
  '光': 'assets/icons/type-guang.png',
  '火': 'assets/icons/type-huo.png',
  '冰': 'assets/icons/type-bing.png',
  '水': 'assets/icons/type-shui.png',
  '毒': 'assets/icons/type-du.png',
  '恶': 'assets/icons/type-e.png',
  '机械': 'assets/icons/type-jixie.png',
  '龙': 'assets/icons/type-long.png',
  '幽': 'assets/icons/type-you.png',
  '草': 'assets/icons/type-cao.png',
  '翼': 'assets/icons/type-yi.png',
  '地': 'assets/icons/type-di.png',
  '武': 'assets/icons/type-wu.png',
  '虫': 'assets/icons/type-chong.png',
  '萌': 'assets/icons/type-meng.png',
  '电': 'assets/icons/type-dian.png',
  '幻': 'assets/icons/type-huan.png',
};

const TYPE_COLORS = {
  '普通': '#a8a878', '草': '#78c850', '火': '#f08030', '水': '#6890f0',
  '光': '#c8a820', '地': '#e0c068', '冰': '#98d8d8', '龙': '#7038f8',
  '电': '#f8d030', '毒': '#a040a0', '虫': '#a8b820', '武': '#c03028',
  '翼': '#a890f0', '萌': '#ee99ac', '幽': '#705898', '恶': '#705848',
  '幻': '#f85888', '机械': '#b8b8d0',
};

function typeTag(typeName) {
  if (TYPE_ICONS[typeName]) {
    return `<img class="type-icon" src="${TYPE_ICONS[typeName]}" alt="${typeName}" title="${typeName}">`;
  }
  const color = TYPE_COLORS[typeName] || '#888';
  return `<span class="type-badge" style="background:${color}">${typeName}</span>`;
}

// 双方可交互状态
let attackerNature = { boost: null, reduce: null };
let attackerIVs    = {};
let defenderNature = { boost: null, reduce: null };
let defenderIVs    = {};

// 技能特效 toggle 状态：{ effectName: boolean }
let activeMoveEffects = {};

// 技能步进器状态：{ effectName: number }
let moveStepperValues = {};

// 特性 toggle 状态（切换我方精灵时重置）
let abilityActive = false;

// 当前显示的形态索引（CREATURES 数组下标，可被箭头切换）
let attackerFormIdx = 0;
let defenderFormIdx = 0;

// 首领形态覆盖状态
let attackerBossActive = false;
let defenderBossActive = false;

// 会话级常用技能 / 常见敌人（切换精灵时重置，不写回 CREATURES）
// attacker 侧：实际渲染显示；defender 侧：仅在 swap 时携带数据
let currentCommonMoves    = [];
let currentCommonEnemies  = [];
let defenderCommonMoves   = [];
let defenderCommonEnemies = [];
let enemyLocked = false;

function nextSaveId() {
  const n = (parseInt(localStorage.getItem('roco-save-counter') || '0')) + 1;
  localStorage.setItem('roco-save-counter', String(n));
  return n;
}

function getActiveCreature(side) {
  const base = CREATURES[side === 'attacker' ? attackerFormIdx : defenderFormIdx];
  const bossActive = side === 'attacker' ? attackerBossActive : defenderBossActive;
  if (bossActive) {
    const boss = CREATURES.find(c => c.id === base.bossId);
    if (boss) return { ...base, name: boss.name, types: boss.types, baseStats: boss.baseStats, ability: boss.ability, image: boss.image };
  }
  return base;
}

// 返回同编号的 base+regional 形态列表 [{c, i}, ...]
function getFormGroup(creature) {
  return CREATURES
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.no === creature.no && (c.form === 'base' || c.form === 'regional'));
}

// 各精灵特性效果定义
// apply(ctx) → 返回覆盖计算参数的对象，ctx 包含 { atkBuff, defBuff, typeMult, stabMult, atkStats, defStats, move }
// 可覆盖任意字段：atkBuff / defBuff / typeMult / stabMult / atkStat / defStat
const CREATURE_ABILITY_EFFECTS = {
  "音速犬": [{ name: "专注力", apply: ({ atkBuff }) => ({ atkBuff: atkBuff + 1.0 }) }],
  "岚鸟（本来的样子）": [{ name: "顺风", auto: true, apply: ({ atkStats, defStats, abilityMult }) => atkStats.spd > defStats.spd ? { abilityMult: abilityMult * 1.5 } : {} }],
  "岚鸟（春天的样子）": [{ name: "顺风", auto: true, apply: ({ atkStats, defStats, abilityMult }) => atkStats.spd > defStats.spd ? { abilityMult: abilityMult * 1.5 } : {} }],
};

// 各技能的特效定义
// type 规范：
//   (无 type)       — toggle，手动激活，apply({basePower,atkStats,defStats}) → 额外威力加值
//   auto: true      — 自动生效的 toggle
//   type:"stepper"  — 步进器，apply(val) → 额外威力加值
//   type:"hits"     — 固定连击数，value: N（始终生效，无需状态）
//   type:"toggle_hits" — 条件连击，base/toggled，由 activeMoveEffects 控制
//   type:"stepper_hits" — 步进器控制连击数，apply(val) → hitCount
const MOVE_EFFECTS = {
  // ── 已实现 ──────────────────────────────────────────────────────────────
  "电弧": [{ name: "迸发", apply: () => 40 }],
  "超级糖果": [{ name: "萌化", apply: () => 60 }],
  "偷袭": [{ name: "应对状态", apply: ({ basePower }) => basePower * 2 }],
  "当头棒喝": [{ name: "当头棒喝", apply: () => 100 }],
  "筛管奔流": [{ name: "生命>80%", apply: () => 75 }],
  "魔能爆": [{ type: "stepper", name: "当前能量", min: 0, max: 10, defaultValue: 10,
    apply: (val) => [45, 70, 90, 110, 135, 155, 165, 180, 190, 200, 210][val] }],
  "鸣沙陷阱": [{ name: "物防差", auto: true, apply: ({ basePower, atkStats, defStats }) => {
    const diff = atkStats.def - defStats.def;
    const total = diff < 0    ? 60
                : diff <= 28  ? 100
                : diff <= 58  ? 130
                : diff <= 88  ? 140
                : diff <= 118 ? 150
                : diff <= 148 ? 160
                : diff <= 178 ? 170
                : diff <= 208 ? 180
                : diff <= 238 ? 190
                : diff <= 270 ? 194
                : 200;
    return total - basePower;
  }}],
  "闪击": [{ name: "速度差", auto: true, apply: ({ basePower, atkStats, defStats }) => {
    const diff = atkStats.spd - defStats.spd;
    const total = diff < 0    ? 60
                : diff <= 28  ? 100
                : diff <= 58  ? 130
                : diff <= 88  ? 140
                : diff <= 118 ? 150
                : diff <= 148 ? 160
                : diff <= 178 ? 170
                : diff <= 208 ? 180
                : diff <= 238 ? 190
                : diff <= 270 ? 194
                : 200;
    return total - basePower;
  }}],

  // ── A. Toggle 类 ────────────────────────────────────────────────────────
  "突袭":     [{ name: "应对状态",     apply: ({ basePower }) => basePower * 2  }], // ×3
  "爆冲":     [{ name: "应对状态",     apply: ({ basePower }) => basePower * 4  }], // ×5
  "无影脚":   [{ name: "应对状态",     apply: ({ basePower }) => basePower      }], // ×2
  "技巧打击": [{ name: "应对状态",     apply: ({ basePower }) => basePower * 9  }], // ×10
  "铁疾藜":   [{ name: "应对状态",     apply: ({ basePower }) => basePower      }], // ×2
  "背袭":     [{ name: "敌方能量=0",   apply: ({ basePower }) => basePower * 19 }], // ×20
  "破罐破摔": [{ name: "有减益",         apply: () => 60  }],
  "触底强击": [{ name: "能量耗尽",       apply: () => 120 }],
  "见招拆招": [{ name: "上回合用状态技", apply: () => 55  }],
  "气势一击": [{ name: "上回合应对成功", apply: () => 180 }],
  "极寒领域": [{ name: "敌方有冻结",     apply: () => 60  }],
  "天旋地转": [{ name: "迸发",           apply: () => 30  }],
  "色散":     [{ name: "混血精灵",       apply: ({ basePower }) => basePower * 0.5 }],
  "穿膛":     [{ name: "敌方能量≤2",     apply: ({ basePower }) => basePower * 4 }],  // ×5
  "闪燃":     [{ name: "应对状态",       apply: ({ basePower }) => basePower * 3  }], // ×4
  "炙热波动": [{ name: "应对状态",       apply: ({ basePower }) => basePower      }], // ×2
  "滚雪球":   [{ name: "应对状态",       apply: ({ basePower }) => basePower      }], // ×2
  "暗突袭":   [{ name: "应对状态",       apply: ({ basePower }) => basePower      }], // ×2
  "回旋踢":   [{ name: "敌方换精灵",     apply: ({ basePower }) => basePower      }], // ×2
  "扇风":     [{ name: "先手",           apply: ({ basePower }) => basePower * 0.5}], // +50%
  "龙卷风":   [{ name: "应对状态",       apply: ({ basePower }) => basePower * 0.5}], // ×1.5
  "虫击":     [{ name: "应对状态",       apply: ({ basePower }) => basePower      }], // ×2
  "草虫冲击": [{ name: "敌方换精灵",     apply: () => 50 }],
  "地陷":     [{ name: "应对状态",       apply: ({ basePower }) => basePower      }], // ×2
  // 机械位置加成（视作条件威力加成）
  "离子震荡": [{ name: "3号位",          apply: () => 40 }],
  "械斗":     [{ name: "1号位",          apply: () => 60 }],
  "磁暴":     [{ name: "1或3号位",       apply: () => 30 }],
  "钢铁洪流": [{ name: "1号位",          apply: () => 90 }],

  // ── B. Stepper 类 ───────────────────────────────────────────────────────
  "坟场搏击": [{ type: "stepper", name: "敌方能量",   min: 0, max: 10,  defaultValue: 0,
    apply: val => -18 * val }],    // 180×(1-0.1×energy)
  "碎冰冰":   [{ type: "stepper", name: "冻结层数",   min: 0, max: 20,  defaultValue: 0,
    apply: val => val * 20 }],
  "天体吸积": [{ type: "stepper", name: "印记层数",   min: 0, max: 20,  defaultValue: 0,
    apply: val => val * 20 }],
  "鸩毒":     [{ type: "stepper", name: "中毒层数",   min: 0, max: 20,  defaultValue: 0,
    apply: val => val * 10 }],
  "牵连":     [{ type: "stepper", name: "力竭精灵数", min: 0, max: 5,   defaultValue: 0,
    apply: val => val * 30 }],
  "垂死反击": [{ type: "stepper", name: "已损失HP%",  min: 0, max: 100, defaultValue: 0,
    apply: val => val }],    // 每失去5%生命+5；stepper值=已损失%
  "彗星":     [{ type: "stepper", name: "当前HP%",    min: 0, max: 100, defaultValue: 100,
    apply: val => -2 * (100 - val) }],  // 每失去5%威力-10
  "冰锋横扫": [{ type: "stepper", name: "敌方总能耗", min: 0, max: 40,  defaultValue: 10,
    apply: val => val * 10 }],  // power=0，stepper直接提供威力
  "逆袭":     [{ type: "stepper", name: "额外能耗",   min: 0, max: 10,  defaultValue: 0,
    apply: val => val * 50 }],  // 能耗每+1，威力+50
  "燃尽":     [{ type: "stepper", name: "敌方已损失HP%", min: 0, max: 100, defaultValue: 0,
    apply: val => -val }],      // 每失去5%威力-5
  "过曝":     [{ type: "stepper", name: "已使用其他系别数", min: 0, max: 17, defaultValue: 0,
    apply: val => val * 30 }],  // 每系别永久+30
  "绵里藏针": [{ type: "stepper", name: "已叠加回合", min: 0, max: 20,  defaultValue: 0,
    apply: val => val * 20 }],  // 每回合未攻击+20
  "齿轮扭矩": [{ type: "stepper", name: "已变化回合", min: 0, max: 20,  defaultValue: 0,
    apply: val => val * 20 }],  // 每次位置变化+20
  "涌泉":     [{ type: "stepper", name: "能耗已减少量", min: 0, max: 10, defaultValue: 0,
    apply: val => val * 10 }],  // 能耗每-1，威力+10

  // ── D. 连击类 ───────────────────────────────────────────────────────────
  "乱打":     [{ type: "hits", value: 5 }],
  "旋转突击": [{ type: "hits", value: 3 }],
  "能量炮":   [{ type: "hits", value: 2 }],
  "种皮爆裂": [{ type: "hits", value: 2 }],
  "水花四溅": [{ type: "hits", value: 4 }],
  "光之矛":   [{ type: "hits", value: 3 }],
  "流火":     [{ type: "hits", value: 3 }],
  "打雪仗":   [{ type: "hits", value: 2 }],
  "午夜噪音": [{ type: "hits", value: 5 }],
  "虫刺":     [{ type: "hits", value: 3 }],
  "缠丝劲":   [{ type: "hits", value: 2 }],
  "啄击":     [{ type: "hits", value: 2 }],
  "黑手":     [{ type: "hits", value: 2 }],
  "叠势":     [{ type: "hits", value: 2 }],
  "虫群过境": [{ type: "hits", value: 2 }],
  "撒娇":     [{ type: "hits", value: 3 },
               { type: "stepper", name: "已叠加次数", min: 0, max: 20, defaultValue: 0,
                 apply: val => val * 20 }],
  "引雷":       [{ type: "hits", value: 2 }, { name: "迸发", apply: () => 20 }],
  "传感器":     [{ type: "hits", value: 2 }],
  "易燃物质":   [{ type: "hits", value: 2 }],
  "闪击折返":   [{ type: "hits", value: 2 }],
  "双响炮":     [{ type: "hits", value: 2 }],
  "刺藤":       [{ type: "hits", value: 2 }],
  "连续毒针":   [{ type: "hits", value: 2 }],
  "针状物":     [{ type: "hits", value: 3 }],
  // 条件连击
  "追打":   [{ type: "toggle_hits", name: "应对状态", base: 1, toggled: 3 }],
  "反击拳": [{ type: "toggle_hits", name: "后手攻击", base: 2, toggled: 3 }],
  "散手":   [{ type: "toggle_hits", name: "应对状态", base: 2, toggled: 6 }],
  "撕咬":   [{ type: "toggle_hits", name: "生命<50%", base: 3, toggled: 5 }],
  "埋伏":   [{ type: "toggle_hits", name: "敌方换精灵", base: 3, toggled: 6 }],
  "灵光":       [{ type: "toggle_hits", name: "敌方换精灵", base: 3, toggled: 6 }],
  "疾风刺":     [{ type: "toggle_hits", name: "先手",     base: 1, toggled: 3 }],
  "连续爪击":   [{ type: "toggle_hits", name: "应对状态", base: 2, toggled: 4 }],
  // 步进器连击
  "孢子爆散": [{ type: "stepper_hits", name: "当前连击数", min: 1, max: 15, defaultValue: 1,
    apply: val => val }],
  "月光合奏": [{ type: "stepper_hits", name: "萌化层数", min: 0, max: 20, defaultValue: 0,
    apply: val => 1 + val }],
  "虫鸣":     [{ type: "stepper_hits", name: "队伍虫鸣数", min: 1, max: 4, defaultValue: 1,
    apply: val => val }],
  "趁火打劫": [{ type: "stepper_hits", name: "连击数", min: 2, max: 12, defaultValue: 2,
    apply: val => val }],
  "多维击打": [{ type: "stepper_hits", name: "星陨印记数", min: 0, max: 20, defaultValue: 0,
    apply: val => 1 + val }],

  // ── E. 永久累积类 ────────────────────────────────────────────────────────
  "水波术":   [{ type: "stepper", name: "已叠加回合",     min: 0, max: 20, defaultValue: 0, apply: val => val * 20 }],
  "迫近攻击": [{ type: "stepper", name: "已叠加次数",     min: 0, max: 10, defaultValue: 0, apply: val => val * 45 }],
  "能量刃":   [{ type: "stepper", name: "已叠加次数",     min: 0, max: 10, defaultValue: 0, apply: val => val * 90 }],
  "吹火":     [{ type: "stepper", name: "已叠加次数",     min: 0, max: 20, defaultValue: 0, apply: val => val * 20 }],
  "落雷":     [{ type: "stepper", name: "入场次数",       min: 0, max: 10, defaultValue: 0, apply: val => val * 40 }],
  "微型斥候": [{ type: "stepper", name: "抵抗次数",       min: 0, max: 10, defaultValue: 0, apply: val => val * 20 }],
  "光能聚集": [{ type: "stepper", name: "其他草系次数",   min: 0, max: 10, defaultValue: 0, apply: val => val * 60 }],
  "山火":     [{ type: "stepper", name: "其他火系次数",   min: 0, max: 6,  defaultValue: 0,
    apply: val => 15 * (Math.pow(2, val) - 1) }],  // 每次使用后威力翻倍

  // ── F. 击败后永久提升类 ─────────────────────────────────────────────────
  "流星火雨": [{ type: "stepper", name: "已击败次数", min: 0, max: 10, defaultValue: 0,
    apply: val => val * 75 }],
  "阳火增辉": [{ type: "stepper", name: "已击败次数", min: 0, max: 10, defaultValue: 0,
    apply: val => 75 * (Math.pow(2, val) - 1) }],  // 每次击败后威力翻倍
};

function getMoveEffects(moveName) {
  return MOVE_EFFECTS[moveName] || [];
}

function loadCreatureDefaults(side, creature) {
  const nature = creature.nature
    ? { boost: creature.nature.boost, reduce: creature.nature.reduce }
    : { boost: null, reduce: null };
  const ivs = creature.ivs ? { ...creature.ivs } : {};
  if (side === 'attacker') { attackerNature = nature; attackerIVs = ivs; }
  else                     { defenderNature = nature; defenderIVs = ivs; }
}

function renderStatGrid(side, creature) {
  const nature = side === 'attacker' ? attackerNature : defenderNature;
  const ivs    = side === 'attacker' ? attackerIVs    : defenderIVs;
  const stats  = calcAllStats({ ...creature, ivs, nature });
  const container = document.getElementById(side === 'attacker' ? 'attacker-stats' : 'defender-stats');

  const typeTagsHtml = creature.types.map(typeTag).join('');
  const baseCreature = CREATURES[side === 'attacker' ? attackerFormIdx : defenderFormIdx];
  const group = getFormGroup(creature);
  const arrowLeft  = group.length > 1 ? `<button class="form-arrow" data-side="${side}" data-dir="-1"><span class="arrow-icon">&#8249;</span><span class="arrow-text">上一个形态</span></button>` : '';
  const arrowRight = group.length > 1 ? `<button class="form-arrow" data-side="${side}" data-dir="1"><span class="arrow-icon">&#8250;</span><span class="arrow-text">下一个形态</span></button>` : '';
  const bossForm = CREATURES.find(c => c.id === baseCreature.bossId);
  const bossActive = side === 'attacker' ? attackerBossActive : defenderBossActive;
  const bossBtnHtml = bossForm ? `<button class="boss-btn${bossActive ? ' active' : ''}" data-side="${side}">首领</button>` : '';
  const imgHtml = creature.image
    ? `<div class="creature-img-area"><div class="creature-img-wrap${group.length > 1 ? ' has-forms' : ''}">${arrowLeft}<img class="creature-img" src="${creature.image}" alt="${creature.name}">${arrowRight}</div></div>`
    : '';
  const natureName = (NATURES.find(n => n.boost === nature.boost && n.reduce === nature.reduce) || {}).name || '—';
  const boostLabel  = nature.boost  ? STAT_NAMES[nature.boost]  : '—';
  const reduceLabel = nature.reduce ? STAT_NAMES[nature.reduce] : '—';
  const natureHtml = `<p class="nature-label"><span class="nature-name">${natureName}</span><span class="nature-detail">+${boostLabel} / -${reduceLabel}</span></p>`;

  const ab = creature.ability;
  const abilityHtml = ab
    ? `<div class="ability-block">
        <img class="ability-icon" src="${ab.icon}" alt="${ab.name}">
        <div class="ability-info">
          <span class="ability-name">${ab.name}</span>
          <span class="ability-desc">${ab.desc}</span>
        </div>
       </div>`
    : '';

  container.innerHTML =
    `<div class="stat-label"><span class="stat-label-types">${typeTagsHtml}</span><span class="stat-label-name">${creature.name}</span>${bossBtnHtml}</div>` +
    imgHtml +
    abilityHtml +
    natureHtml +
    STAT_IDS.map(id => {
      const isBoost  = nature.boost  === id;
      const isReduce = nature.reduce === id;
      const hasIV    = !!ivs[id];
      const modClass = isBoost ? 'stat--boost' : isReduce ? 'stat--reduce' : hasIV ? 'stat--iv' : '';
      const icon     = STAT_ICONS[id] ? `<img class="stat-icon" src="${STAT_ICONS[id]}" alt="">` : '';
      return `
        <div class="stat-row stat-row--interactive">
          <div class="nature-btns">
            <button class="nature-btn nature-btn--plus  ${isBoost  ? 'active' : ''}" data-side="${side}" data-stat="${id}" data-type="boost">＋</button>
            <button class="nature-btn nature-btn--minus ${isReduce ? 'active' : ''}" data-side="${side}" data-stat="${id}" data-type="reduce">－</button>
          </div>
          <span class="stat-name ${modClass}">${icon}${STAT_NAMES[id]}</span>
          <span class="stat-base">${creature.baseStats[id]}</span>
          <span class="stat-value ${modClass}">${stats[id]}</span>
          <button class="iv-btn ${hasIV ? 'active' : ''}" data-side="${side}" data-stat="${id}">个</button>
        </div>`;
    }).join('');

  container.querySelectorAll('.nature-btn').forEach(btn => btn.addEventListener('click', onNatureClick));
  container.querySelectorAll('.iv-btn').forEach(btn => btn.addEventListener('click', onIVToggle));
}

function onNatureClick(e) {
  const side   = e.currentTarget.dataset.side;
  const statId = e.currentTarget.dataset.stat;
  const type   = e.currentTarget.dataset.type;
  const nature = side === 'attacker' ? attackerNature : defenderNature;

  if (type === 'boost') {
    nature.boost = nature.boost === statId ? null : statId;
    if (nature.boost === statId && nature.reduce === statId) nature.reduce = null;
  } else {
    nature.reduce = nature.reduce === statId ? null : statId;
    if (nature.reduce === statId && nature.boost === statId) nature.boost = null;
  }

  const creature = getActiveCreature(side);
  renderStatGrid(side, creature);
  if (side === 'attacker') renderPresetButtons(side, creature);
  onCalculate();
}

function onIVToggle(e) {
  const side   = e.currentTarget.dataset.side;
  const statId = e.currentTarget.dataset.stat;
  const ivs    = side === 'attacker' ? attackerIVs : defenderIVs;

  if (ivs[statId]) {
    delete ivs[statId];
  } else if (Object.keys(ivs).length < 3) {
    ivs[statId] = 60;
  }

  const creature = getActiveCreature(side);
  renderStatGrid(side, creature);
  renderPresetButtons(side, creature);
  onCalculate();
}

const PRESETS = [
  { label: '纯肉',     boost: 'hp',    ivs: ['hp', 'def', 'spdef'] },
  { label: '物攻',     boost: 'atk',   ivs: ['hp', 'def', 'atk']   },
  { label: '魔攻',     boost: 'spatk', ivs: ['hp', 'def', 'spatk'] },
  { label: '高速物攻', boost: 'spd',   ivs: ['hp', 'atk', 'spd']   },
  { label: '高速魔攻', boost: 'spd',   ivs: ['hp', 'spatk', 'spd'] },
  { label: '高速状态', boost: 'spd',   ivs: ['hp', 'def', 'spd']   },
];

function getPresetReduce(creature, boost, ivStatIds) {
  const atkInIv   = ivStatIds.includes('atk');
  const spatkInIv = ivStatIds.includes('spatk');
  if (atkInIv && !spatkInIv)  return 'spatk';
  if (spatkInIv && !atkInIv)  return 'atk';
  // neither or both in ivs: pick the lower base stat, default atk
  const a = creature.baseStats.atk, s = creature.baseStats.spatk;
  return s < a ? 'spatk' : 'atk';
}

function renderPresetButtons(side, creature) {
  const nature = side === 'attacker' ? attackerNature : defenderNature;
  const ivs    = side === 'attacker' ? attackerIVs    : defenderIVs;
  const container = document.getElementById(side === 'attacker' ? 'attacker-presets' : 'defender-presets');
  container.innerHTML = PRESETS.map((p, i) => {
    const reduce = getPresetReduce(creature, p.boost, p.ivs);
    const isActive = nature.boost === p.boost &&
                     nature.reduce === reduce &&
                     p.ivs.every(id => !!ivs[id]) &&
                     Object.keys(ivs).length === p.ivs.length;
    return `<button class="preset-btn ${isActive ? 'active' : ''}" data-side="${side}" data-preset="${i}">${p.label}</button>`;
  }).join('');
  container.querySelectorAll('.preset-btn').forEach(btn => btn.addEventListener('click', onPresetClick));
}

function onPresetClick(e) {
  const side    = e.currentTarget.dataset.side;
  const creature = getActiveCreature(side);
  const p = PRESETS[+e.currentTarget.dataset.preset];
  const reduce = getPresetReduce(creature, p.boost, p.ivs);
  const newIvs = Object.fromEntries(p.ivs.map(id => [id, 60]));
  if (side === 'attacker') { attackerNature = { boost: p.boost, reduce }; attackerIVs = newIvs; }
  else                     { defenderNature = { boost: p.boost, reduce }; defenderIVs = newIvs; }
  renderStatGrid(side, creature);
  renderPresetButtons(side, creature);
  onCalculate();
}

function onBossToggle(side) {
  if (side === 'attacker') attackerBossActive = !attackerBossActive;
  else defenderBossActive = !defenderBossActive;
  const creature = getActiveCreature(side);
  renderStatGrid(side, creature);
  if (side === 'attacker') { abilityActive = false; populateMoves(creature); renderCommonEnemies(); }
  onCalculate();
}

function onFormArrow(side, dir) {
  if (side === 'attacker') attackerBossActive = false;
  else defenderBossActive = false;
  const group = getFormGroup(getActiveCreature(side));
  const cur  = group.findIndex(({ i }) => i === (side === 'attacker' ? attackerFormIdx : defenderFormIdx));
  const next = (cur + dir + group.length) % group.length;
  const nextIdx = group[next].i;
  if (side === 'attacker') attackerFormIdx = nextIdx;
  else defenderFormIdx = nextIdx;
  const nextCreature = CREATURES[nextIdx];
  loadCreatureDefaults(side, nextCreature);
  if (side === 'attacker') {
    abilityActive = false;
    applyAttackerCreature(nextCreature);
    renderAttackerDefaultBtns();
    renderSavedCreatures();
    populateMoves(nextCreature);
    renderCommonEnemies();
  } else {
    defenderCommonMoves   = [...(nextCreature.commonMoves || [])];
    defenderCommonEnemies = [];
  }
  renderStatGrid(side, nextCreature);
  renderPresetButtons(side, nextCreature);
  searchCtrl[side]?.syncDisplay();
  onCalculate();
}

function onAttackerChange() {
  const idx = +document.getElementById('attacker-select').value;
  attackerFormIdx = idx;
  attackerBossActive = false;
  const creature = CREATURES[idx];
  abilityActive = false;
  applyAttackerCreature(creature);
  renderStatGrid('attacker', creature);
  renderPresetButtons('attacker', creature);
  renderAttackerDefaultBtns();
  renderSavedCreatures();
  populateMoves(creature);
  renderCommonEnemies();
  searchCtrl.attacker?.syncDisplay();
  onCalculate();
}

function onDefenderChange() {
  const idx = +document.getElementById('defender-select').value;
  defenderFormIdx = idx;
  defenderBossActive = false;
  const creature = CREATURES[idx];
  defenderCommonMoves   = [...(creature.commonMoves || [])];
  defenderCommonEnemies = [];
  loadCreatureDefaults('defender', creature);
  renderStatGrid('defender', creature);
  renderPresetButtons('defender', creature);
  searchCtrl.defender?.syncDisplay();
  onCalculate();
}

const TYPE_ORDER = ['普通','光','火','水','草','电','冰','地','幻','龙','恶','武','翼','萌','幽','虫','机械','毒'];

function populateMoves(creature) {
  const sel = document.getElementById('move-select');

  // 常用技能快捷栏（读会话级状态）
  const grid = document.getElementById('common-moves');
  grid.innerHTML = currentCommonMoves.map(id => {
    const m = MOVES.find(m => m.id === id);
    if (!m) return '';
    const iconHtml = m.icon ? `<img src="${m.icon}" alt="">` : '';
    return `<div class="common-move-wrap" draggable="true" data-id="${m.id}">
      <button class="common-move-btn" data-id="${m.id}">${iconHtml}<span>${m.name}</span></button>
      <button class="common-move-remove" data-id="${m.id}" title="移除">−</button>
    </div>`;
  }).join('');

  let dragSrcId = null;
  grid.querySelectorAll('.common-move-wrap').forEach(wrap => {
    wrap.addEventListener('dragstart', e => {
      dragSrcId = wrap.dataset.id;
      wrap.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    wrap.addEventListener('dragend', () => {
      wrap.classList.remove('dragging');
      grid.querySelectorAll('.common-move-wrap').forEach(w => w.classList.remove('drag-over'));
    });
    wrap.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      grid.querySelectorAll('.common-move-wrap').forEach(w => w.classList.remove('drag-over'));
      wrap.classList.add('drag-over');
    });
    wrap.addEventListener('drop', e => {
      e.preventDefault();
      const dropId = wrap.dataset.id;
      if (!dragSrcId || dragSrcId === dropId) return;
      const srcIdx  = currentCommonMoves.indexOf(dragSrcId);
      const dropIdx = currentCommonMoves.indexOf(dropId);
      currentCommonMoves.splice(srcIdx, 1);
      currentCommonMoves.splice(dropIdx, 0, dragSrcId);
      populateMoves(CREATURES[attackerFormIdx]);
    });
  });

  grid.querySelectorAll('.common-move-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sel.value = btn.dataset.id;
      onMoveChange();
    });
  });
  grid.querySelectorAll('.common-move-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      currentCommonMoves = currentCommonMoves.filter(m => m !== id);
      populateMoves(CREATURES[attackerFormIdx]);
      onMoveChange();
    });
  });

  // 下拉框按属性分组，只显示该精灵会的攻击技能（physical / special）
  const learnableSet = new Set(creature.learnableMoves || []);
  sel.innerHTML = '';
  for (const type of TYPE_ORDER) {
    const group = MOVES.filter(m =>
      m.type === type &&
      (m.category === 'physical' || m.category === 'special') &&
      learnableSet.has(m.id)
    );
    if (!group.length) continue;
    const grp = document.createElement('optgroup');
    grp.label = type;
    group.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name}（${m.power} · ${m.category === 'physical' ? '物理' : '魔法'}）`;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  }

  // 默认选常用技能第一个（存在且在下拉列表中），否则选下拉第一项
  const firstCommon = currentCommonMoves.find(id => sel.querySelector(`option[value="${id}"]`));
  if (firstCommon) sel.value = firstCommon;
  else if (sel.options.length) sel.value = sel.options[0].value;

  onMoveChange();
}

function onMoveChange() {
  const move = MOVES.find(m => m.id === document.getElementById('move-select').value);
  if (!move) return;

  // 切换技能时重置特效状态（auto 效果始终激活）
  const effects = getMoveEffects(move.name);
  activeMoveEffects = {};
  moveStepperValues = {};
  effects.forEach(e => {
    if (e.type === 'stepper' || e.type === 'stepper_hits') moveStepperValues[e.name] = e.defaultValue;
    else if (e.type !== 'hits') activeMoveEffects[e.name] = !!e.auto;
    // type:'hits' 固定连击，无需状态
  });

  const iconHtml = move.icon ? `<img class="move-info-icon" src="${move.icon}" alt="">` : '';
  const noteHtml = move.note ? `<span class="move-note">${move.note}</span>` : '';
  const catLabel  = move.category === 'physical' ? '物理' : '魔法';
  const manualEffects  = effects.filter(e => !e.auto && e.type !== 'stepper' && e.type !== 'stepper_hits' && e.type !== 'hits');
  const stepperEffects = effects.filter(e => e.type === 'stepper' || e.type === 'stepper_hits');
  const creature = CREATURES[document.getElementById('attacker-select').value];
  const abilityEffects = CREATURE_ABILITY_EFFECTS[getActiveCreature('attacker').name];
  const hasManualAbility = abilityEffects?.some(e => !e.auto);
  const abilityBtnHtml = hasManualAbility
    ? `<button class="effect-toggle effect-toggle--ability${abilityActive ? ' active' : ''}" id="ability-toggle">${getActiveCreature('attacker').ability?.name ?? '特性'}</button>`
    : '';
  const stepperHtml = stepperEffects.map(e => {
    const val = moveStepperValues[e.name] ?? e.defaultValue;
    return `<div class="energy-stepper">
      <span class="stepper-label">${e.name}</span>
      <button class="stepper-btn" data-stepper="${e.name}" data-dir="-1">−</button>
      <span class="stepper-val" id="stepper-val-${e.name}">${val}</span>
      <button class="stepper-btn" data-stepper="${e.name}" data-dir="1">+</button>
    </div>`;
  }).join('');
  const allToggleBtns = manualEffects.map(e =>
    `<button class="effect-toggle" data-effect="${e.name}">${e.name}</button>`
  ).join('') + abilityBtnHtml;
  const togglesContent = stepperHtml + allToggleBtns;
  const togglesHtml = togglesContent
    ? `<div class="move-effect-toggles">${togglesContent}</div>`
    : '';

  const attacker = getActiveCreature('attacker');
  const alreadyCommon = currentCommonMoves.includes(move.id);
  const addBtnHtml = alreadyCommon ? '' : `<button class="add-common-btn" id="add-common-btn" data-move-id="${move.id}">添加到常用技能</button>`;

  document.getElementById('move-info-bar').innerHTML = `
    ${iconHtml}
    <div class="move-info-text">
      <span class="move-info-name">${move.name}</span>
      <span class="move-info-stats">威力 ${move.power} · ${catLabel} · ${move.type}属性</span>
      ${noteHtml}
    </div>
    ${togglesHtml}
    ${addBtnHtml}`;

  // 同步高亮常用技能栏
  document.querySelectorAll('.common-move-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.id === move.id));
  onCalculate();
}

function onAddCommonMove(moveId) {
  if (currentCommonMoves.includes(moveId)) return;
  currentCommonMoves.push(moveId);
  populateMoves(CREATURES[attackerFormIdx]);
  onMoveChange();  // 刷新"添加"按钮可见性
}

// ── 精灵默认配置覆盖（按图鉴编号 no 存储）──────────────────────────────
const DEFAULTS_KEY = 'roco-creature-defaults';

function getCreatureDefault(no) {
  try { return (JSON.parse(localStorage.getItem(DEFAULTS_KEY)) || {})[no] || null; }
  catch { return null; }
}

function saveCreatureDefault() {
  const creature = CREATURES[attackerFormIdx];
  const all = JSON.parse(localStorage.getItem(DEFAULTS_KEY) || '{}');
  all[creature.no] = {
    ivs:          { ...attackerIVs },
    nature:       { ...attackerNature },
    commonMoves:  [...currentCommonMoves],
    commonEnemies: [...currentCommonEnemies],
  };
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(all));
  renderAttackerDefaultBtns();
}

function resetCreatureDefault() {
  const creature = CREATURES[attackerFormIdx];
  const all = JSON.parse(localStorage.getItem(DEFAULTS_KEY) || '{}');
  delete all[creature.no];
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(all));
  renderAttackerDefaultBtns();
}

function renderAttackerDefaultBtns() {
  const creature   = CREATURES[attackerFormIdx];
  const hasDefault = !!getCreatureDefault(creature.no);
  const container  = document.getElementById('attacker-default-btns');
  if (!container) return;
  container.innerHTML =
    `<button class="default-save-btn">保存为默认</button>` +
    (hasDefault ? `<button class="default-reset-btn">重置默认</button>` : '');
  container.querySelector('.default-save-btn').addEventListener('click', saveCreatureDefault);
  if (hasDefault) container.querySelector('.default-reset-btn').addEventListener('click', resetCreatureDefault);
}

// 加载精灵时优先应用已保存的默认覆盖
function applyAttackerCreature(creature) {
  const def = getCreatureDefault(creature.no);
  if (def) {
    attackerIVs          = { ...def.ivs };
    attackerNature       = { ...def.nature };
    currentCommonMoves   = [...(def.commonMoves   || [])];
    if (!enemyLocked) currentCommonEnemies = [...(def.commonEnemies || [])];
  } else {
    loadCreatureDefaults('attacker', creature);
    currentCommonMoves   = [...(creature.commonMoves || [])];
    if (!enemyLocked) currentCommonEnemies = [];
  }
}

// ── 已保存精灵 ────────────────────────────────────────────────────────
const SAVED_KEY = 'roco-saved-creatures';

function getSavedCreatures() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; }
  catch { return []; }
}

function saveCurrentCreature() {
  const creature = CREATURES[attackerFormIdx];
  const entry = {
    saveKey:       nextSaveId(),
    id:            creature.id,
    name:          creature.name,
    image:         creature.image || '',
    ivs:           { ...attackerIVs },
    nature:        { ...attackerNature },
    commonMoves:   [...currentCommonMoves],
    commonEnemies: [...currentCommonEnemies],
  };
  const list = getSavedCreatures();
  list.push(entry);
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  renderSavedCreatures();
}

function renderSavedCreatures() {
  const list = getSavedCreatures();
  const grid = document.getElementById('saved-creatures');
  const currentAttackerId = CREATURES[attackerFormIdx].id;
  grid.innerHTML = list.map((e, i) => {
    const isSame = e.id === currentAttackerId;
    const overwriteBtn = isSame
      ? `<button class="saved-overlay-btn saved-overlay-btn--overwrite" data-action="overwrite" data-idx="${i}">覆盖</button>`
      : '';
    return `
    <div class="saved-creature-card" data-idx="${i}" draggable="true">
      <button class="saved-creature-remove" data-idx="${i}" title="移除">−</button>
      ${e.image ? `<img src="${e.image}" alt="${e.name}">` : ''}
      <span class="saved-creature-name">${e.name}</span>
      <div class="saved-creature-overlay" data-idx="${i}">
        <button class="saved-overlay-btn" data-action="attacker" data-idx="${i}">应用</button>
        <button class="saved-overlay-btn" data-action="rename" data-idx="${i}">重命名</button>
        ${overwriteBtn}
      </div>
    </div>`;
  }).join('');

  let dragSrcIdx = null;
  grid.querySelectorAll('.saved-creature-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      dragSrcIdx = +card.dataset.idx;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      grid.querySelectorAll('.saved-creature-card').forEach(c => c.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      grid.querySelectorAll('.saved-creature-card').forEach(c => c.classList.remove('drag-over'));
      card.classList.add('drag-over');
    });
    card.addEventListener('drop', e => {
      e.preventDefault();
      const dropIdx = +card.dataset.idx;
      if (dragSrcIdx === null || dragSrcIdx === dropIdx) return;
      const list = getSavedCreatures();
      const [moved] = list.splice(dragSrcIdx, 1);
      list.splice(dropIdx, 0, moved);
      localStorage.setItem(SAVED_KEY, JSON.stringify(list));
      renderSavedCreatures();
    });
  });

  grid.querySelectorAll('.saved-creature-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.saved-creature-card.pinned').forEach(c => c.classList.remove('pinned'));
      const idx = +btn.dataset.idx;
      const list = getSavedCreatures();
      list.splice(idx, 1);
      localStorage.setItem(SAVED_KEY, JSON.stringify(list));
      renderSavedCreatures();
    });
  });

  grid.querySelectorAll('.saved-overlay-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = +btn.dataset.idx;
      const list = getSavedCreatures();
      const entry = list[idx];
      // 清除其他 pinned（重命名按钮自己会重新 pin）
      if (btn.dataset.action !== 'rename') {
        document.querySelectorAll('.saved-creature-card.pinned').forEach(c => c.classList.remove('pinned'));
      }
      if (btn.dataset.action === 'rename') {
        // 先清除所有其他 pinned
        document.querySelectorAll('.saved-creature-card.pinned').forEach(c => c.classList.remove('pinned'));
        const card = btn.closest('.saved-creature-card');
        card.classList.add('pinned');
        const overlay = btn.closest('.saved-creature-overlay');
        overlay.innerHTML = `
          <input class="saved-rename-input" type="text" value="${entry.name}" placeholder="新名称">
          <button class="saved-overlay-btn saved-rename-confirm" data-idx="${idx}">确认</button>
        `;
        const input = overlay.querySelector('.saved-rename-input');
        input.focus();
        input.select();
        const confirm = overlay.querySelector('.saved-rename-confirm');
        const doRename = () => {
          const newName = input.value.trim();
          if (!newName) return;
          list[idx].name = newName;
          localStorage.setItem(SAVED_KEY, JSON.stringify(list));
          renderSavedCreatures();
        };
        confirm.addEventListener('click', doRename);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') doRename(); });
      } else if (btn.dataset.action === 'overwrite') {
        // 用当前我方数据覆盖该存档位，保留名称和位置
        const creature = CREATURES[attackerFormIdx];
        list[idx] = {
          ...list[idx],
          id:           creature.id,
          image:        creature.image || '',
          ivs:          { ...attackerIVs },
          nature:       { ...attackerNature },
          commonMoves:  [...currentCommonMoves],
          commonEnemies: [...currentCommonEnemies],
        };
        localStorage.setItem(SAVED_KEY, JSON.stringify(list));
        renderSavedCreatures();
      } else {
        applySavedCreature(entry, btn.dataset.action);
      }
    });
  });
}

/**
 * 核心伤害计算，所有场景共用。
 * @param {object} attacker  - 含 ivs/nature 的攻方精灵对象
 * @param {object} defCreature - 守方精灵数据（来自 CREATURES）
 * @param {object} defIvs    - 守方个体值
 * @param {object} defNature - 守方性格
 * @param {object} move      - 技能对象
 * @param {number} extraPower
 * @param {number} atkBuff   - 已除以10的小数（0.1 = 10%）
 * @param {number} defBuff
 * @returns {{ dmg, pct, defStats, atkStats, totalExtra,
 *             activeEffectDetails, calcAtkBuff, calcDefBuff,
 *             typeMult, stabMult, atkStat, abilityMult }}
 */
function computeDamage({ attacker, defCreature, defIvs, defNature, move, extraPower, atkBuff, defBuff }) {
  const atkStats  = calcAllStats(attacker);
  const defStats  = calcAllStats({ ...defCreature, ivs: defIvs || {}, nature: defNature || { boost: null, reduce: null } });
  const defStatId = move.category === 'physical' ? 'def' : 'spdef';

  let abilityCtx = {
    atkBuff, defBuff,
    typeMult:    calcTypeMultiplier(move.type, defCreature.types),
    stabMult:    calcStabMultiplier(move.type, attacker.types),
    atkStat:     move.category === 'physical' ? atkStats.atk : atkStats.spatk,
    defStat:     defStats[defStatId],
    abilityMult: 1,
    atkStats, defStats, move,
  };
  (CREATURE_ABILITY_EFFECTS[attacker.name] || []).forEach(e => {
    if (e.auto || abilityActive) abilityCtx = { ...abilityCtx, ...e.apply(abilityCtx) };
  });

  const effectCtx = { basePower: move.power, atkStats, defStats };

  // 计算连击数
  let totalHits = 1;
  getMoveEffects(move.name).forEach(e => {
    if (e.type === 'hits') totalHits = e.value;
    else if (e.type === 'toggle_hits') totalHits = activeMoveEffects[e.name] ? e.toggled : e.base;
    else if (e.type === 'stepper_hits') totalHits = e.apply(moveStepperValues[e.name] ?? e.defaultValue);
  });

  // 只收集威力加成效果（排除 hits 类型）
  const activeEffectDetails = getMoveEffects(move.name)
    .filter(e => e.type !== 'hits' && e.type !== 'toggle_hits' && e.type !== 'stepper_hits' &&
                 (e.type === 'stepper' || activeMoveEffects[e.name]))
    .map(e => {
      if (e.type === 'stepper') {
        const val = moveStepperValues[e.name] ?? e.defaultValue;
        return { name: e.name, bonus: e.apply(val), stepperVal: val };
      }
      return { name: e.name, bonus: Math.round(e.apply(effectCtx)) };
    });
  const effectBonus = activeEffectDetails.reduce((s, e) => s + e.bonus, 0);
  const totalExtra  = extraPower + effectBonus;

  const { atkBuff: calcAtkBuff, defBuff: calcDefBuff, typeMult, stabMult, atkStat, abilityMult } = abilityCtx;
  const dmg = calcDamage(atkStat, defStats[defStatId], move.power, totalExtra, calcAtkBuff, calcDefBuff, typeMult, stabMult, abilityMult) * totalHits;
  const pct = defStats.hp > 0 ? (dmg / defStats.hp * 100).toFixed(1) : '∞';

  return { dmg, pct, defStats, atkStats, totalExtra, activeEffectDetails, calcAtkBuff, calcDefBuff, typeMult, stabMult, atkStat, abilityMult, totalHits };
}

function calcEnemyDamage(enemyEntry) {
  const move = MOVES.find(m => m.id === document.getElementById('move-select').value);
  if (!move) return null;
  const defCreature = CREATURES.find(c => c.id === enemyEntry.id);
  if (!defCreature) return null;
  const attacker   = { ...getActiveCreature('attacker'), ivs: attackerIVs, nature: attackerNature };
  const extraPower = parseFloat(document.getElementById('extra-power').value) || 0;
  const atkBuff    = (parseFloat(document.getElementById('atk-buff').value) || 0) / 10;
  const defBuff    = (parseFloat(document.getElementById('def-buff').value) || 0) / 10;
  const { dmg, pct } = computeDamage({ attacker, defCreature, defIvs: enemyEntry.ivs, defNature: enemyEntry.nature, move, extraPower, atkBuff, defBuff });
  return { dmg, pct };
}

function updateEnemyDamageDisplay() {
  document.querySelectorAll('.common-enemy-card').forEach(card => {
    const entry = currentCommonEnemies[+card.dataset.idx];
    if (!entry) return;
    const result = calcEnemyDamage(entry);
    const barFill = card.querySelector('.enemy-bar-fill');
    const dmgText = card.querySelector('.enemy-dmg-value');
    if (!barFill || !dmgText) return;
    if (!result) { dmgText.textContent = '—'; barFill.style.width = '0%'; return; }
    const rawPct = parseFloat(result.pct);
    barFill.style.width = Math.min(rawPct, 100) + '%';
    barFill.className = 'enemy-bar-fill ' + barColorClass(rawPct);
    dmgText.innerHTML = `${result.dmg} <span class="bar-pct">(${result.pct}%)</span>`;
  });
}

function saveCurrentEnemy() {
  const defender = getActiveCreature('defender');
  const entry = {
    saveKey: nextSaveId(),
    id:      defender.id,
    name:    defender.name.replace(/（[^）]*）$/, ''),
    image:   defender.image || '',
    ivs:     { ...defenderIVs },
    nature:  { ...defenderNature },
  };
  currentCommonEnemies.push(entry);
  renderCommonEnemies();
}

function renderCommonEnemies() {
  const grid = document.getElementById('common-enemies');
  grid.innerHTML = currentCommonEnemies.map((e, i) => `
    <div class="common-enemy-card" data-idx="${i}" draggable="true">
      <button class="common-enemy-remove" data-idx="${i}" title="删除">−</button>
      ${e.image ? `<img src="${e.image}" alt="${e.name}">` : ''}
      <span class="saved-creature-name">${e.name}</span>
      <div class="enemy-bar-track"><div class="enemy-bar-fill" style="width:0%"></div></div>
      <div class="enemy-dmg-value">—</div>
    </div>
  `).join('');

  let dragSrcIdx = null;
  grid.querySelectorAll('.common-enemy-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      dragSrcIdx = +card.dataset.idx;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      grid.querySelectorAll('.common-enemy-card').forEach(c => c.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      grid.querySelectorAll('.common-enemy-card').forEach(c => c.classList.remove('drag-over'));
      card.classList.add('drag-over');
    });
    card.addEventListener('drop', e => {
      e.preventDefault();
      const dropIdx = +card.dataset.idx;
      if (dragSrcIdx === null || dragSrcIdx === dropIdx) return;
      const [moved] = currentCommonEnemies.splice(dragSrcIdx, 1);
      currentCommonEnemies.splice(dropIdx, 0, moved);
      renderCommonEnemies();
    });

    card.addEventListener('click', e => {
      if (e.target.closest('.common-enemy-remove')) return;
      const idx = +card.dataset.idx;
      const entry = currentCommonEnemies[idx];
      if (!entry) return;
      const creatureIdx = CREATURES.findIndex(c => c.id === entry.id);
      if (creatureIdx < 0) return;
      defenderFormIdx = creatureIdx;
      loadCreatureDefaults('defender', CREATURES[creatureIdx]);
      defenderIVs    = { ...entry.ivs };
      defenderNature = { ...entry.nature };
      const creature = getActiveCreature('defender');
      renderStatGrid('defender', creature);
      renderPresetButtons('defender', creature);
      searchCtrl.defender?.syncDisplay();
      onCalculate();
    });
  });

  grid.querySelectorAll('.common-enemy-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = +btn.dataset.idx;
      currentCommonEnemies.splice(idx, 1);
      renderCommonEnemies();
    });
  });

  updateEnemyDamageDisplay();
}

function applySavedCreature(entry, side) {
  const creatureIdx = CREATURES.findIndex(c => c.id === entry.id);
  if (creatureIdx < 0) return;
  if (side === 'attacker') {
    attackerFormIdx    = creatureIdx;
    attackerBossActive = false;
    attackerIVs        = { ...entry.ivs };
    attackerNature     = { ...entry.nature };
    // 会话级状态从存档恢复，不写回 CREATURES
    currentCommonMoves   = [...(entry.commonMoves   || [])];
    if (!enemyLocked) currentCommonEnemies = [...(entry.commonEnemies || [])];
    abilityActive = false;
    const creature = getActiveCreature('attacker');
    renderStatGrid('attacker', creature);
    renderPresetButtons('attacker', creature);
    renderAttackerDefaultBtns();
    renderSavedCreatures();
    populateMoves(creature);
    renderCommonEnemies();
    searchCtrl.attacker?.syncDisplay();
  } else {
    defenderFormIdx       = creatureIdx;
    defenderBossActive    = false;
    defenderIVs           = { ...entry.ivs };
    defenderNature        = { ...entry.nature };
    defenderCommonMoves   = [...(entry.commonMoves   || [])];
    defenderCommonEnemies = [...(entry.commonEnemies || [])];
    const creature = getActiveCreature('defender');
    renderStatGrid('defender', creature);
    renderPresetButtons('defender', creature);
    searchCtrl.defender?.syncDisplay();
  }
  onCalculate();
}

function onEffectToggle(btn) {
  if (btn.id === 'ability-toggle') {
    abilityActive = !abilityActive;
    btn.classList.toggle('active', abilityActive);
    onCalculate();
    return;
  }
  const name = btn.dataset.effect;
  activeMoveEffects[name] = !activeMoveEffects[name];
  btn.classList.toggle('active', activeMoveEffects[name]);
  onCalculate();
}

function onStepperClick(btn) {
  const name = btn.dataset.stepper;
  const move = MOVES.find(m => m.id === document.getElementById('move-select').value);
  const effect = getMoveEffects(move?.name || '').find(e => e.name === name);
  if (!effect) return;
  const current = moveStepperValues[name] ?? effect.defaultValue;
  moveStepperValues[name] = Math.max(effect.min, Math.min(effect.max, current + +btn.dataset.dir));
  const valEl = document.getElementById(`stepper-val-${name}`);
  if (valEl) valEl.textContent = moveStepperValues[name];
  onCalculate();
}

function renderPowerBreakdown(move, extraPower, activeEffectDetails, atkBuff, stabMult, typeMult, abilityMult = 1, totalHits = 1) {
  const effectBonus  = activeEffectDetails.reduce((s, e) => s + e.bonus, 0);
  const rawPower     = move.power + extraPower + effectBonus;
  const displayPower = Math.round(rawPower * (1 + atkBuff) * stabMult * typeMult * abilityMult);

  const powerItems = [];
  const multItems  = [];

  const stepperDetail = activeEffectDetails.find(e => e.stepperVal !== undefined);
  if (stepperDetail && move.power === 0) {
    powerItems.push(`<span class="pw-chip pw-chip--bonus">${stepperDetail.name} ${stepperDetail.stepperVal} <b>${stepperDetail.bonus}</b></span>`);
  } else {
    powerItems.push(`<span class="pw-chip pw-chip--base">基础威力 <b>${move.power}</b></span>`);
    if (stepperDetail) {
      powerItems.push(`<span class="pw-chip pw-chip--bonus">${stepperDetail.name}${stepperDetail.stepperVal} <b>+${stepperDetail.bonus}</b></span>`);
    }
  }

  activeEffectDetails.filter(e => e.stepperVal === undefined).forEach(e => {
    const sign = e.bonus >= 0 ? '+' : '';
    powerItems.push(`<span class="pw-chip pw-chip--bonus">${e.name} <b>${sign}${e.bonus}</b></span>`);
  });

  if (extraPower !== 0)
    powerItems.push(`<span class="pw-chip pw-chip--bonus">额外加成 <b>+${extraPower}</b></span>`);

  if (atkBuff !== 0) {
    const sign = atkBuff > 0 ? '+' : '';
    multItems.push(`<span class="pw-chip pw-chip--buff">攻击${sign}${Math.round(atkBuff * 100)}% <b>×${(1 + atkBuff).toFixed(2)}</b></span>`);
  }
  if (stabMult > 1)
    multItems.push(`<span class="pw-chip pw-chip--stab">本系加成 <b>×${stabMult}</b></span>`);
  if (typeMult > 1)
    multItems.push(`<span class="pw-chip pw-chip--super">属性克制 <b>×${typeMult}</b></span>`);
  if (typeMult < 1)
    multItems.push(`<span class="pw-chip pw-chip--resist">属性抵抗 <b>×${typeMult}</b></span>`);
  if (abilityMult !== 1)
    multItems.push(`<span class="pw-chip pw-chip--stab">特性 <b>×${abilityMult}</b></span>`);
  if (totalHits > 1)
    multItems.push(`<span class="pw-chip pw-chip--stab">连击 <b>×${totalHits}</b></span>`);

  const powerGroup = '<span class="pw-paren">(</span>'
    + powerItems.join('<span class="pw-sep">+</span>')
    + '<span class="pw-paren">)</span>';
  const multGroup = multItems.length
    ? '<span class="pw-sep">×</span>' + multItems.join('<span class="pw-sep">×</span>')
    : '';
  const chain  = powerGroup + multGroup;
  const result = totalHits > 1
    ? `<span class="pw-result">= 单次 <b>${displayPower}</b> ×${totalHits}连击 = <b>${displayPower * totalHits}</b></span>`
    : `<span class="pw-result">= 显示威力 <b>${displayPower}</b></span>`;

  document.getElementById('power-breakdown').innerHTML = chain + result;
}

function onCalculate() {
  const attacker   = { ...getActiveCreature('attacker'), ivs: attackerIVs, nature: attackerNature };
  const enemy      = getActiveCreature('defender');
  const move       = MOVES.find(m => m.id === document.getElementById('move-select').value);
  const extraPower = parseFloat(document.getElementById('extra-power').value) || 0;
  const atkBuff    = (parseFloat(document.getElementById('atk-buff').value) || 0) / 10;
  const defBuff    = (parseFloat(document.getElementById('def-buff').value) || 0) / 10;
  if (!move) return;

  const { dmg: currentDmg, pct: currentPct, defStats, totalExtra,
          activeEffectDetails, calcAtkBuff, calcDefBuff, typeMult, stabMult, abilityMult, totalHits }
    = computeDamage({ attacker, defCreature: enemy, defIvs: defenderIVs, defNature: defenderNature, move, extraPower, atkBuff, defBuff });

  renderPowerBreakdown(move, extraPower, activeEffectDetails, calcAtkBuff, stabMult, typeMult, abilityMult, totalHits);

  const scenarios = runCalculation({ attacker, enemy, move, extraPower: totalExtra, atkBuff: calcAtkBuff, defBuff: calcDefBuff, abilityMult, totalHits });

  renderResultBars({ dmg: currentDmg, pct: currentPct }, scenarios);
  document.getElementById('result-panel').hidden = false;
  updateEnemyDamageDisplay();
}

function barColorClass(pct) {
  const n = parseFloat(pct);
  return n >= 100 ? 'bar--red' : n >= 50 ? 'bar--yellow' : '';
}

function renderResultBars(current, scenarios) {
  const currentRaw = parseFloat(current.pct);
  const currentPct = Math.min(currentRaw, 100);
  document.getElementById('result-current').innerHTML = `
    <div class="bar-row bar-row--current">
      <div class="bar-label">当前配置</div>
      <div class="bar-track"><div class="bar-fill bar-fill--current ${barColorClass(currentRaw)}" style="width:${currentPct}%"></div></div>
      <div class="bar-value">${current.dmg} <span class="bar-pct">(${current.pct}%)</span></div>
    </div>`;

  document.getElementById('result-bars').innerHTML = scenarios.map(r => {
    const barPct = Math.min(parseFloat(r.pct), 100);
    return `
      <div class="bar-row ${r.isAbsolute ? 'bar-row--absolute' : ''}">
        <div class="bar-label">${r.label}</div>
        <div class="bar-track"><div class="bar-fill ${barColorClass(r.pct)}" style="width:${barPct}%"></div></div>
        <div class="bar-value">${r.dmg} <span class="bar-pct">(${r.pct}%)</span></div>
      </div>`;
  }).join('');
}

// 精灵搜索下拉控制器
const searchCtrl = {};

function setupCreatureSearch(side) {
  const input = document.getElementById(`${side}-search-input`);
  const list  = document.getElementById(`${side}-search-list`);

  const allItems = CREATURES
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.form !== 'regional' && c.form !== 'boss')
    .map(({ c, i }) => {
      const displayName = c.name.replace(/（[^）]*）$/, '');
      const label = c.no ? `${c.no} ${displayName}` : displayName;
      return { idx: i, label, key: label.toLowerCase() };
    });

  function showList(filter) {
    const q = (filter || '').trim().toLowerCase();
    const filtered = q ? allItems.filter(it => it.key.includes(q)) : allItems;
    if (!filtered.length) { list.hidden = true; return; }
    list.innerHTML = filtered.map(it =>
      `<div class="csearch-item" data-idx="${it.idx}">${it.label}</div>`
    ).join('');
    list.hidden = false;
  }

  function pick(idx) {
    const item = allItems.find(it => it.idx === idx);
    if (!item) return;
    input.value = '';
    list.hidden = true;
    input.blur();
    document.getElementById(`${side}-select`).value = idx;
    if (side === 'attacker') onAttackerChange();
    else onDefenderChange();
  }

  function syncDisplay() {
    input.value = '';
  }

  input.addEventListener('focus', () => showList(input.value));
  input.addEventListener('input', () => showList(input.value));
  input.addEventListener('blur',  () => { list.hidden = true; });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { list.hidden = true; input.blur(); return; }
    if (e.key === 'Enter') {
      const first = list.querySelector('.csearch-item');
      if (first) pick(+first.dataset.idx);
    }
  });
  list.addEventListener('mousedown', e => {
    const item = e.target.closest('.csearch-item');
    if (item) { e.preventDefault(); pick(+item.dataset.idx); }
  });

  return { pick, syncDisplay };
}

function onSwap() {
  // swap select values
  const attackerSel = document.getElementById('attacker-select');
  const defenderSel = document.getElementById('defender-select');
  const tmpVal = attackerSel.value;
  attackerSel.value = defenderSel.value;
  defenderSel.value = tmpVal;

  // swap form indices and boss state
  [attackerFormIdx, defenderFormIdx] = [defenderFormIdx, attackerFormIdx];
  [attackerBossActive, defenderBossActive] = [defenderBossActive, attackerBossActive];

  // swap natures and ivs (travel with creature)
  [attackerNature, defenderNature] = [defenderNature, attackerNature];
  [attackerIVs, defenderIVs] = [defenderIVs, attackerIVs];

  // reset ability and move effects
  abilityActive = false;
  activeMoveEffects = {};
  moveStepperValues = {};

  const newAttacker = getActiveCreature('attacker');
  const newDefender = getActiveCreature('defender');
  // 常用技能和常见敌人随精灵一起交换
  [currentCommonMoves,   defenderCommonMoves  ] = [defenderCommonMoves,   currentCommonMoves  ];
  if (!enemyLocked) [currentCommonEnemies, defenderCommonEnemies] = [defenderCommonEnemies, currentCommonEnemies];
  renderStatGrid('attacker', newAttacker);
  renderPresetButtons('attacker', newAttacker);
  renderStatGrid('defender', newDefender);
  renderPresetButtons('defender', newDefender);
  populateMoves(newAttacker);
  renderCommonEnemies();
  renderAttackerDefaultBtns();
  renderSavedCreatures();
  searchCtrl.attacker?.syncDisplay();
  searchCtrl.defender?.syncDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
  const attackerSel = document.getElementById('attacker-select');
  const defenderSel = document.getElementById('defender-select');

  CREATURES.forEach((c, i) => {
    if (c.form === 'regional' || c.form === 'boss') return;
    const displayName = c.name.replace(/（[^）]*）$/, '');
    const mkOpt = () => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = c.no ? `${c.no} ${displayName}` : displayName;
      return o;
    };
    attackerSel.appendChild(mkOpt());
    defenderSel.appendChild(mkOpt());
  });

  attackerSel.addEventListener('change', onAttackerChange);
  defenderSel.addEventListener('change', onDefenderChange);

  searchCtrl.attacker = setupCreatureSearch('attacker');
  searchCtrl.defender = setupCreatureSearch('defender');

  // 形态切换箭头 + 首领按钮（事件委托到两个 stat 容器）
  ['attacker-stats', 'defender-stats'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      const formBtn = e.target.closest('.form-arrow');
      if (formBtn) { onFormArrow(formBtn.dataset.side, +formBtn.dataset.dir); return; }
      const bossBtn = e.target.closest('.boss-btn');
      if (bossBtn) onBossToggle(bossBtn.dataset.side);
    });
  });
  document.getElementById('swap-btn').addEventListener('click', onSwap);
  document.getElementById('move-select').addEventListener('change', onMoveChange);
  ['extra-power', 'atk-buff', 'def-buff'].forEach(id =>
    document.getElementById(id).addEventListener('input', onCalculate));

  // 特效 toggle / stepper 事件委托（按钮由 onMoveChange 动态注入）
  document.getElementById('move-info-bar').addEventListener('click', e => {
    const addBtn = e.target.closest('.add-common-btn');
    if (addBtn) { onAddCommonMove(addBtn.dataset.moveId); return; }
    const toggleBtn = e.target.closest('.effect-toggle');
    if (toggleBtn) { onEffectToggle(toggleBtn); return; }
    const stepperBtn = e.target.closest('.stepper-btn');
    if (stepperBtn) onStepperClick(stepperBtn);
  });

  document.getElementById('save-creature-btn').addEventListener('click', saveCurrentCreature);
  document.getElementById('save-enemy-btn').addEventListener('click', saveCurrentEnemy);
  document.getElementById('lock-enemy-btn').addEventListener('click', () => {
    enemyLocked = !enemyLocked;
    const btn = document.getElementById('lock-enemy-btn');
    btn.classList.toggle('active', enemyLocked);
    btn.textContent = enemyLocked ? '🔒 已锁定' : '锁定敌方阵容';
  });
  renderSavedCreatures();

  onAttackerChange();
  onDefenderChange();
});
