const STAT_NAMES = { hp: 'HP', atk: '物攻', def: '物防', spatk: '魔攻', spdef: '魔防', spd: '速度' };
const STAT_IDS   = ['hp', 'atk', 'def', 'spatk', 'spdef', 'spd'];

const STAT_ICONS = {
  hp:    'assets/icons/stat-hp.png',
  atk:   'assets/icons/stat-atk.png',
  def:   'assets/icons/stat-def.png',
  spatk: 'assets/icons/stat-spatk.png',
  spdef: 'assets/icons/stat-spdef.png',
  spd:   'assets/icons/stat-spd.png',
};

const TYPE_ICONS = {
  '光': 'assets/icons/type-guang.png',
  '火': 'assets/icons/type-huo.png',
  '冰': 'assets/icons/type-bing.png',
  '水': 'assets/icons/type-shui.png',
  '毒': 'assets/icons/type-du.png',
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
  const imgHtml = creature.image
    ? `<div class="creature-img-wrap"><img class="creature-img" src="${creature.image}" alt="${creature.name}"></div>`
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

  const creature = CREATURES[document.getElementById(side === 'attacker' ? 'attacker-select' : 'defender-select').value];
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

  const creature = CREATURES[document.getElementById(side === 'attacker' ? 'attacker-select' : 'defender-select').value];
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
  const creature = CREATURES[document.getElementById(side === 'attacker' ? 'attacker-select' : 'defender-select').value];
  const p = PRESETS[+e.currentTarget.dataset.preset];
  const reduce = getPresetReduce(creature, p.boost, p.ivs);
  const newIvs = Object.fromEntries(p.ivs.map(id => [id, 60]));
  if (side === 'attacker') { attackerNature = { boost: p.boost, reduce }; attackerIVs = newIvs; }
  else                     { defenderNature = { boost: p.boost, reduce }; defenderIVs = newIvs; }
  renderStatGrid(side, creature);
  renderPresetButtons(side, creature);
  onCalculate();
}

function onAttackerChange() {
  const creature = CREATURES[document.getElementById('attacker-select').value];
  loadCreatureDefaults('attacker', creature);
  renderStatGrid('attacker', creature);
  renderPresetButtons('attacker', creature);
  populateMoves(creature);
  onCalculate();
}

function onDefenderChange() {
  const creature = CREATURES[document.getElementById('defender-select').value];
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

  const iconHtml = move.icon ? `<img class="move-info-icon" src="${move.icon}" alt="">` : '';
  const noteHtml = move.note ? `<span class="move-note">${move.note}</span>` : '';
  const catLabel  = move.category === 'physical' ? '物理' : '魔法';
  document.getElementById('move-info-bar').innerHTML = `
    ${iconHtml}
    <div class="move-info-text">
      <span class="move-info-name">${move.name}</span>
      <span class="move-info-stats">威力 ${move.power} · ${catLabel} · ${move.type}属性</span>
      ${noteHtml}
    </div>`;

  // 同步高亮常用技能栏
  document.querySelectorAll('.common-move-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.id === move.id));
  onCalculate();
}

function onCalculate() {
  const creature   = CREATURES[document.getElementById('attacker-select').value];
  const attacker   = { ...creature, ivs: attackerIVs, nature: attackerNature };
  const enemy      = CREATURES[document.getElementById('defender-select').value];
  const move       = MOVES.find(m => m.id === document.getElementById('move-select').value);
  const extraPower = parseFloat(document.getElementById('extra-power').value) || 0;
  const atkBuff    = parseFloat(document.getElementById('atk-buff').value)    || 0;
  const defBuff    = parseFloat(document.getElementById('def-buff').value)    || 0;
  if (!move) return;

  const atkStats  = calcAllStats(attacker);
  const atkStat   = move.category === 'physical' ? atkStats.atk : atkStats.spatk;
  const defStatId = move.category === 'physical' ? 'def' : 'spdef';
  const typeMult  = calcTypeMultiplier(move.type, enemy.types);
  const stabMult  = calcStabMultiplier(move.type, attacker.types);

  // 当前敌方配置结算
  const defStats   = calcAllStats({ ...enemy, ivs: defenderIVs, nature: defenderNature });
  const currentDmg = calcDamage(atkStat, defStats[defStatId], move.power, extraPower, atkBuff, defBuff, typeMult, stabMult);
  const currentPct = defStats.hp > 0 ? (currentDmg / defStats.hp * 100).toFixed(1) : '∞';

  // 9种假设区间
  const scenarios = runCalculation({ attacker, enemy, move, extraPower, atkBuff, defBuff });

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
    const mkOpt = () => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = c.no ? `${c.no} ${c.name}` : c.name;
      return o;
    };
    attackerSel.appendChild(mkOpt());
    defenderSel.appendChild(mkOpt());
  });

  attackerSel.addEventListener('change', onAttackerChange);
  defenderSel.addEventListener('change', onDefenderChange);
  document.getElementById('move-select').addEventListener('change', onMoveChange);
  ['extra-power', 'atk-buff', 'def-buff'].forEach(id =>
    document.getElementById(id).addEventListener('input', onCalculate));

  onAttackerChange();
  onDefenderChange();
});
