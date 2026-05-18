const STAT_NAMES = { hp: 'HP', atk: '物攻', def: '物防', spatk: '魔攻', spdef: '魔抗', spd: '速度' };
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

// CSS color fallbacks for types without downloaded icons
const TYPE_COLORS = {
  '普通': '#a8a878', '草': '#78c850', '火': '#f08030', '水': '#6890f0',
  '光': '#f8d030', '地': '#e0c068', '冰': '#98d8d8', '龙': '#7038f8',
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

// 我方可交互状态
let attackerNature = { boost: null, reduce: null };
let attackerIVs    = {};

function renderAttackerStatGrid(creature) {
  const stats = calcAllStats({ ...creature, ivs: attackerIVs, nature: attackerNature });
  const container = document.getElementById('attacker-stats');

  const typeTagsHtml = creature.types.map(typeTag).join('');
  const imgHtml = creature.image
    ? `<div class="creature-img-wrap"><img class="creature-img" src="${creature.image}" alt="${creature.name}"></div>`
    : '';

  container.innerHTML =
    `<p class="stat-label">${creature.name}　${typeTagsHtml}</p>` +
    imgHtml +
    STAT_IDS.map(id => {
      const isBoost  = attackerNature.boost  === id;
      const isReduce = attackerNature.reduce === id;
      const hasIV    = !!attackerIVs[id];
      const modClass = isBoost ? 'stat--boost' : isReduce ? 'stat--reduce' : '';
      const icon     = STAT_ICONS[id] ? `<img class="stat-icon" src="${STAT_ICONS[id]}" alt="">` : '';
      return `
        <div class="stat-row stat-row--interactive">
          <div class="nature-btns">
            <button class="nature-btn nature-btn--plus  ${isBoost  ? 'active' : ''}" data-stat="${id}" data-type="boost">＋</button>
            <button class="nature-btn nature-btn--minus ${isReduce ? 'active' : ''}" data-stat="${id}" data-type="reduce">－</button>
          </div>
          <span class="stat-name ${modClass}">${icon}${STAT_NAMES[id]}</span>
          <span class="stat-value ${modClass}">${stats[id]}</span>
          <button class="iv-btn ${hasIV ? 'active' : ''}" data-stat="${id}">个</button>
        </div>`;
    }).join('');

  container.querySelectorAll('.nature-btn').forEach(btn => btn.addEventListener('click', onNatureClick));
  container.querySelectorAll('.iv-btn').forEach(btn => btn.addEventListener('click', onIVToggle));
}

function onNatureClick(e) {
  const statId = e.currentTarget.dataset.stat;
  const type   = e.currentTarget.dataset.type;

  if (type === 'boost') {
    attackerNature.boost = attackerNature.boost === statId ? null : statId;
    if (attackerNature.boost === statId && attackerNature.reduce === statId) {
      attackerNature.reduce = null;
    }
  } else {
    attackerNature.reduce = attackerNature.reduce === statId ? null : statId;
    if (attackerNature.reduce === statId && attackerNature.boost === statId) {
      attackerNature.boost = null;
    }
  }

  renderAttackerStatGrid(CREATURES[document.getElementById('attacker-select').value]);
}

function onIVToggle(e) {
  const statId  = e.currentTarget.dataset.stat;
  if (attackerIVs[statId]) {
    delete attackerIVs[statId];
  } else if (Object.keys(attackerIVs).length < 3) {
    attackerIVs[statId] = 60;
  }
  renderAttackerStatGrid(CREATURES[document.getElementById('attacker-select').value]);
}

function onAttackerChange() {
  attackerNature = { boost: null, reduce: null };
  attackerIVs    = {};
  const creature = CREATURES[document.getElementById('attacker-select').value];
  renderAttackerStatGrid(creature);
  populateMoves(creature);
}

function onDefenderChange() {
  const creature = CREATURES[document.getElementById('defender-select').value];
  const neutral  = { boost: null, reduce: null };
  const baseRef  = {};
  for (const id of STAT_IDS) {
    baseRef[id] = calcStat(id, creature.baseStats[id], 0, neutral);
  }
  const container = document.getElementById('defender-stats');
  const typeTagsHtml = creature.types.map(typeTag).join('');
  const imgHtml = creature.image
    ? `<div class="creature-img-wrap"><img class="creature-img" src="${creature.image}" alt="${creature.name}"></div>`
    : '';

  container.innerHTML =
    `<p class="stat-label">${creature.name}　${typeTagsHtml}　<span style="font-size:0.75rem;color:#6b7280">无个体基准</span></p>` +
    imgHtml +
    Object.entries(baseRef).map(([k, v]) => {
      const icon = STAT_ICONS[k] ? `<img class="stat-icon" src="${STAT_ICONS[k]}" alt="">` : '';
      return `<div class="stat-row"><span>${icon}${STAT_NAMES[k]}</span><span>${v}</span></div>`;
    }).join('');
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
  document.getElementById('move-info').textContent =
    `威力 ${move.power} · ${move.category === 'physical' ? '物理' : '魔法'} · ${move.type}属性`;
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

  const results = runCalculation({ attacker, enemy, move, extraPower, atkBuff, defBuff });
  renderResultBars(results);
  document.getElementById('result-panel').hidden = false;
}

function renderResultBars(results) {
  const container = document.getElementById('result-bars');
  container.innerHTML = results.map(r => {
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
