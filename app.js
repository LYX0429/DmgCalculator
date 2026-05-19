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
  '龙': 'assets/icons/type-long.png',
  '幽': 'assets/icons/type-you.png',
  '草': 'assets/icons/type-cao.png',
  '翼': 'assets/icons/type-yi.png',
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

function getActiveCreature(side) {
  return CREATURES[side === 'attacker' ? attackerFormIdx : defenderFormIdx];
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

// 各技能的特效 toggle 定义
// apply({ basePower, atkStats, defStats }) → 额外威力加值
const MOVE_EFFECTS = {
  "电弧": [{ name: "迸发",   apply: () => 40 }],
  "偷袭": [{ name: "应对状态", apply: ({ basePower }) => basePower * 2 }],
  "当头棒喝": [{ name: "当头棒喝", apply: () => 100 }],
  "筛管奔流": [{ name: "生命>80%", apply: () => 75 }],
  "魔能爆": [{ type: "stepper", name: "当前能量", min: 0, max: 10, defaultValue: 10,
    apply: (val) => [40, 70, 90, 110, 135, 155, 165, 180, 190, 200, 210][val] }],
  "闪击": [{ name: "速度差", auto: true, apply: ({ basePower, atkStats, defStats }) => {
    const diff = atkStats.spd - defStats.spd;
    const total = diff < 0    ? 60
                : diff <= 14  ? 100
                : diff <= 29  ? 130
                : diff <= 44  ? 140
                : diff <= 59  ? 150
                : diff <= 74  ? 160
                : diff <= 89  ? 170
                : diff <= 104 ? 180
                : diff <= 119 ? 190
                : diff <= 134 ? 194
                : 200;
    return total - basePower;
  }}],
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
  const group = getFormGroup(creature);
  const arrowLeft  = group.length > 1 ? `<button class="form-arrow" data-side="${side}" data-dir="-1"><span class="arrow-icon">&#8249;</span><span class="arrow-text">上一个形态</span></button>` : '';
  const arrowRight = group.length > 1 ? `<button class="form-arrow" data-side="${side}" data-dir="1"><span class="arrow-icon">&#8250;</span><span class="arrow-text">下一个形态</span></button>` : '';
  const imgHtml = creature.image
    ? `<div class="creature-img-wrap${group.length > 1 ? ' has-forms' : ''}">${arrowLeft}<img class="creature-img" src="${creature.image}" alt="${creature.name}">${arrowRight}</div>`
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
    `<p class="stat-label">${creature.name}　${typeTagsHtml}</p>` +
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

function onFormArrow(side, dir) {
  const group = getFormGroup(getActiveCreature(side));
  const cur  = group.findIndex(({ i }) => i === (side === 'attacker' ? attackerFormIdx : defenderFormIdx));
  const next = (cur + dir + group.length) % group.length;
  const nextIdx = group[next].i;
  if (side === 'attacker') attackerFormIdx = nextIdx;
  else defenderFormIdx = nextIdx;
  const nextCreature = CREATURES[nextIdx];
  loadCreatureDefaults(side, nextCreature);
  renderStatGrid(side, nextCreature);
  renderPresetButtons(side, nextCreature);
  if (side === 'attacker') { abilityActive = false; populateMoves(nextCreature); }
  onCalculate();
}

function onAttackerChange() {
  const idx = +document.getElementById('attacker-select').value;
  attackerFormIdx = idx;
  const creature = CREATURES[idx];
  abilityActive = false;
  loadCreatureDefaults('attacker', creature);
  renderStatGrid('attacker', creature);
  renderPresetButtons('attacker', creature);
  populateMoves(creature);
  onCalculate();
}

function onDefenderChange() {
  const idx = +document.getElementById('defender-select').value;
  defenderFormIdx = idx;
  const creature = CREATURES[idx];
  loadCreatureDefaults('defender', creature);
  renderStatGrid('defender', creature);
  renderPresetButtons('defender', creature);
  onCalculate();
}

const TYPE_ORDER = ['普通','光','火','水','草','电','冰','地','幻','龙','恶','武','翼','萌','幽','虫','机械','毒'];

function populateMoves(creature) {
  const sel = document.getElementById('move-select');
  const commonIds = creature.commonMoves || [];

  // 常用技能快捷栏
  const grid = document.getElementById('common-moves');
  grid.innerHTML = commonIds.map(id => {
    const m = MOVES.find(m => m.id === id);
    if (!m) return '';
    const iconHtml = m.icon ? `<img src="${m.icon}" alt="">` : '';
    return `<button class="common-move-btn" data-id="${m.id}">${iconHtml}<span>${m.name}</span></button>`;
  }).join('');
  grid.querySelectorAll('.common-move-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sel.value = btn.dataset.id;
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
    if (e.type === 'stepper') moveStepperValues[e.name] = e.defaultValue;
    else activeMoveEffects[e.name] = !!e.auto;
  });

  const iconHtml = move.icon ? `<img class="move-info-icon" src="${move.icon}" alt="">` : '';
  const noteHtml = move.note ? `<span class="move-note">${move.note}</span>` : '';
  const catLabel  = move.category === 'physical' ? '物理' : '魔法';
  const manualEffects  = effects.filter(e => !e.auto && e.type !== 'stepper');
  const stepperEffects = effects.filter(e => e.type === 'stepper');
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

  document.getElementById('move-info-bar').innerHTML = `
    ${iconHtml}
    <div class="move-info-text">
      <span class="move-info-name">${move.name}</span>
      <span class="move-info-stats">威力 ${move.power} · ${catLabel} · ${move.type}属性</span>
      ${noteHtml}
    </div>
    ${togglesHtml}`;

  // 同步高亮常用技能栏
  document.querySelectorAll('.common-move-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.id === move.id));
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

function renderPowerBreakdown(move, extraPower, activeEffectDetails, atkBuff, stabMult, typeMult, abilityMult = 1) {
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

  const powerGroup = '<span class="pw-paren">(</span>'
    + powerItems.join('<span class="pw-sep">+</span>')
    + '<span class="pw-paren">)</span>';
  const multGroup = multItems.length
    ? '<span class="pw-sep">×</span>' + multItems.join('<span class="pw-sep">×</span>')
    : '';
  const chain  = powerGroup + multGroup;
  const result = `<span class="pw-result">= 显示威力 <b>${displayPower}</b></span>`;

  document.getElementById('power-panel').hidden = false;
  document.getElementById('power-breakdown').innerHTML = chain + result;
}

function onCalculate() {
  const creature   = getActiveCreature('attacker');
  const attacker   = { ...creature, ivs: attackerIVs, nature: attackerNature };
  const enemy      = getActiveCreature('defender');
  const move       = MOVES.find(m => m.id === document.getElementById('move-select').value);
  const extraPower = parseFloat(document.getElementById('extra-power').value) || 0;
  const atkBuff    = parseFloat(document.getElementById('atk-buff').value)    || 0;
  const defBuff    = parseFloat(document.getElementById('def-buff').value)    || 0;
  if (!move) return;

  const atkStats  = calcAllStats(attacker);
  const defStatId = move.category === 'physical' ? 'def' : 'spdef';

  // 当前敌方配置结算
  const defStats = calcAllStats({ ...enemy, ivs: defenderIVs, nature: defenderNature });

  // 应用特性效果（若激活）
  let abilityCtx = {
    atkBuff, defBuff,
    typeMult: calcTypeMultiplier(move.type, enemy.types),
    stabMult: calcStabMultiplier(move.type, attacker.types),
    atkStat:  move.category === 'physical' ? atkStats.atk : atkStats.spatk,
    defStat:  defStats[defStatId],
    abilityMult: 1,
    atkStats, defStats, move,
  };
  const abilityEffects = CREATURE_ABILITY_EFFECTS[creature.name] || [];
  abilityEffects.forEach(e => {
    if (e.auto || abilityActive) {
      abilityCtx = { ...abilityCtx, ...e.apply(abilityCtx) };
    }
  });
  const { atkBuff: calcAtkBuff, defBuff: calcDefBuff, typeMult, stabMult, atkStat, abilityMult } = abilityCtx;

  // 累加激活的特效威力加成
  const effectCtx = { basePower: move.power, atkStats, defStats };
  const activeEffectDetails = getMoveEffects(move.name)
    .filter(e => e.type === 'stepper' || activeMoveEffects[e.name])
    .map(e => {
      if (e.type === 'stepper') {
        const val = moveStepperValues[e.name] ?? e.defaultValue;
        return { name: e.name, bonus: e.apply(val), stepperVal: val };
      }
      return { name: e.name, bonus: Math.round(e.apply(effectCtx)) };
    });
  const effectBonus = activeEffectDetails.reduce((s, e) => s + e.bonus, 0);
  const totalExtra  = extraPower + effectBonus;
  renderPowerBreakdown(move, extraPower, activeEffectDetails, calcAtkBuff, stabMult, typeMult, abilityMult);

  const currentDmg = calcDamage(atkStat, defStats[defStatId], move.power, totalExtra, calcAtkBuff, calcDefBuff, typeMult, stabMult, abilityMult);
  const currentPct = defStats.hp > 0 ? (currentDmg / defStats.hp * 100).toFixed(1) : '∞';

  // 9种假设区间
  const scenarios = runCalculation({ attacker, enemy, move, extraPower: totalExtra, atkBuff: calcAtkBuff, defBuff: calcDefBuff, abilityMult });

  renderResultBars({ dmg: currentDmg, pct: currentPct }, scenarios);
  document.getElementById('result-panel').hidden = false;
}

function renderResultBars(current, scenarios) {
  const currentPct = Math.min(parseFloat(current.pct), 100);
  document.getElementById('result-current').innerHTML = `
    <div class="bar-row bar-row--current">
      <div class="bar-label">当前配置</div>
      <div class="bar-track"><div class="bar-fill bar-fill--current" style="width:${currentPct}%"></div></div>
      <div class="bar-value">${current.dmg} <span class="bar-pct">(${current.pct}%)</span></div>
    </div>`;

  document.getElementById('result-bars').innerHTML = scenarios.map(r => {
    const barPct = Math.min(parseFloat(r.pct), 100);
    return `
      <div class="bar-row ${r.isAbsolute ? 'bar-row--absolute' : ''}">
        <div class="bar-label">${r.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${barPct}%"></div></div>
        <div class="bar-value">${r.dmg} <span class="bar-pct">(${r.pct}%)</span></div>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const attackerSel = document.getElementById('attacker-select');
  const defenderSel = document.getElementById('defender-select');

  CREATURES.forEach((c, i) => {
    if (c.form === 'regional') return;
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

  // 形态切换箭头（事件委托到两个 stat 容器）
  ['attacker-stats', 'defender-stats'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      const btn = e.target.closest('.form-arrow');
      if (btn) onFormArrow(btn.dataset.side, +btn.dataset.dir);
    });
  });
  document.getElementById('move-select').addEventListener('change', onMoveChange);
  ['extra-power', 'atk-buff', 'def-buff'].forEach(id =>
    document.getElementById(id).addEventListener('input', onCalculate));

  // 特效 toggle / stepper 事件委托（按钮由 onMoveChange 动态注入）
  document.getElementById('move-info-bar').addEventListener('click', e => {
    const toggleBtn = e.target.closest('.effect-toggle');
    if (toggleBtn) { onEffectToggle(toggleBtn); return; }
    const stepperBtn = e.target.closest('.stepper-btn');
    if (stepperBtn) onStepperClick(stepperBtn);
  });

  onAttackerChange();
  onDefenderChange();
});
