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

  container.innerHTML =
    `<p class="stat-label">${creature.name}　${typeTagsHtml}</p>` +
    imgHtml +
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
}

function onAttackerChange() {
  const creature = CREATURES[document.getElementById('attacker-select').value];
  loadCreatureDefaults('attacker', creature);
  renderStatGrid('attacker', creature);
  populateMoves(creature);
}

function onDefenderChange() {
  const creature = CREATURES[document.getElementById('defender-select').value];
  loadCreatureDefaults('defender', creature);
  renderStatGrid('defender', creature);
}

function populateMoves(creature) {
  const sel = document.getElementById('move-select');
  const commonIds = new Set(creature.commonMoves);
  sel.innerHTML = '';

  const addGroup = (label, moves) => {
    if (!moves.length) return;
    const grp = document.createElement('optgroup');
    grp.label = label;
    moves.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name}（${m.power} · ${m.category === 'physical' ? '物理' : '魔法'} · ${m.type}）`;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  };

  addGroup('常用技能', MOVES.filter(m => commonIds.has(m.id)));
  addGroup('全部技能', MOVES.filter(m => !commonIds.has(m.id)));
  onMoveChange();
}

function onMoveChange() {
  const move = MOVES.find(m => m.id === document.getElementById('move-select').value);
  if (!move) return;
  const iconHtml = move.icon ? `<img class="move-icon" src="${move.icon}" alt="">` : '';
  const noteHtml = move.note ? ` · <span class="move-note">${move.note}</span>` : '';
  document.getElementById('move-info').innerHTML =
    `${iconHtml}威力 ${move.power} · ${move.category === 'physical' ? '物理' : '魔法'} · ${move.type}属性${noteHtml}`;
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
  document.getElementById('calc-btn').addEventListener('click', onCalculate);

  onAttackerChange();
  onDefenderChange();
});
