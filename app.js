const STAT_NAMES = { hp: 'HP', atk: '物攻', def: '物防', spatk: '魔攻', spdef: '魔抗', spd: '速度' };
const STAT_IDS   = ['hp', 'atk', 'def', 'spatk', 'spdef', 'spd'];

// 我方可交互状态
let attackerNature = { boost: null, reduce: null };
let attackerIVs    = {};

function renderAttackerStatGrid(creature) {
  const stats = calcAllStats({ ...creature, ivs: attackerIVs, nature: attackerNature });
  const container = document.getElementById('attacker-stats');

  container.innerHTML =
    `<p class="stat-label">${creature.name}　${creature.types.join(' / ')}</p>` +
    STAT_IDS.map(id => {
      const isBoost  = attackerNature.boost  === id;
      const isReduce = attackerNature.reduce === id;
      const hasIV    = !!attackerIVs[id];
      const modClass = isBoost ? 'stat--boost' : isReduce ? 'stat--reduce' : '';
      return `
        <div class="stat-row stat-row--interactive">
          <div class="nature-btns">
            <button class="nature-btn nature-btn--plus  ${isBoost  ? 'active' : ''}" data-stat="${id}" data-type="boost">＋</button>
            <button class="nature-btn nature-btn--minus ${isReduce ? 'active' : ''}" data-stat="${id}" data-type="reduce">－</button>
          </div>
          <span class="stat-name ${modClass}">${STAT_NAMES[id]}</span>
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
  container.innerHTML =
    `<p class="stat-label">${creature.name}　${creature.types.join(' / ')}　（无个体基准）</p>` +
    Object.entries(baseRef).map(([k, v]) =>
      `<div class="stat-row"><span>${STAT_NAMES[k]}</span><span>${v}</span></div>`
    ).join('');
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
      o.textContent = c.name;
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
