// statId: "hp"|"atk"|"def"|"spatk"|"spdef"|"spd"
function calcStat(statId, base, iv, nature) {
  const natureBoost = nature.boost === statId ? 0.2
                    : nature.reduce === statId ? -0.1
                    : 0;
  if (statId === 'hp') {
    return Math.round(Math.round((1.7 * base + iv * 0.85 + 70)) * (1 + natureBoost)) + 100;
  }
  return Math.round(Math.round((1.1 * base + iv * 0.55 + 10)) * (1 + natureBoost)) + 50;
}

function calcAllStats(creature) {
  const result = {};
  for (const statId of ['hp', 'atk', 'def', 'spatk', 'spdef', 'spd']) {
    const base = creature.baseStats[statId];
    const iv   = (creature.ivs && creature.ivs[statId]) || 0;
    result[statId] = calcStat(statId, base, iv, creature.nature);
  }
  return result;
}

// 克制：命中1个×2，命中2个×3（最高×3）
// 抵抗：被1个抵抗×0.5，被2个抵抗×0.25
// 同时存在时相乘
function calcTypeMultiplier(moveType, defenderTypes) {
  const superEff = TYPE_CHART[moveType]   || [];
  const resists  = RESIST_CHART[moveType] || [];

  const superHits  = defenderTypes.filter(t => superEff.includes(t)).length;
  const resistHits = defenderTypes.filter(t => resists.includes(t)).length;

  const superMult  = superHits  >= 2 ? 3    : superHits  === 1 ? 2   : 1;
  const resistMult = resistHits >= 2 ? 0.25 : resistHits === 1 ? 0.5 : 1;

  return superMult * resistMult;
}

function calcStabMultiplier(moveType, attackerTypes) {
  return attackerTypes.includes(moveType) ? 1.25 : 1;
}

// 伤害 = 我方攻 / 敌方防 × 0.9 × (技能威力 + 额外威力)
//        × (1 + 攻击buff) / (1 + 防守buff) × 属性克制 × 本系加成
function calcDamage(atkStat, defStat, movePower, extraPower, atkBuff, defBuff, typeMult, stabMult, abilityMult = 1) {
  return Math.round(
    (atkStat / defStat)
    * 0.9
    * (movePower + extraPower)
    * (1 + atkBuff)
    / (1 + defBuff)
    * typeMult
    * stabMult
    * abilityMult
  );
}

function calcEnemyScenarios(enemy, defStatId) {
  const neutral  = { boost: null,      reduce: null      };
  const boostHp  = { boost: 'hp',      reduce: null      };
  const boostDef = { boost: defStatId, reduce: null      };
  const MAX_IV = 60;

  const hp  = (iv, nat) => calcStat('hp',      enemy.baseStats.hp,          iv, nat);
  const def = (iv, nat) => calcStat(defStatId, enemy.baseStats[defStatId],  iv, nat);

  return [
    { label: "① 血满个体+性格 / 防满个体",      hp: hp(MAX_IV, boostHp),  def: def(MAX_IV, neutral)   },
    { label: "② 血满个体 / 防满个体+性格",      hp: hp(MAX_IV, neutral),  def: def(MAX_IV, boostDef)  },
    { label: "③ 血满个体 / 防满个体",           hp: hp(MAX_IV, neutral),  def: def(MAX_IV, neutral)   },
    { label: "④ 血满个体 / 防无个体",           hp: hp(MAX_IV, neutral),  def: def(0,      neutral)   },
    { label: "⑤ 血无个体 / 防满个体",           hp: hp(0,      neutral),  def: def(MAX_IV, neutral)   },
    { label: "⑥ 无个体无性格",                  hp: hp(0,      neutral),  def: def(0,      neutral)   },
  ];
}

function runCalculation(params) {
  const { attacker, enemy, move, extraPower, atkBuff, defBuff, abilityMult = 1, defAbilityMult = 1, totalHits = 1 } = params;
  const atkStats  = calcAllStats(attacker);
  const atkStat   = move.category === 'physical' ? atkStats.atk : atkStats.spatk;
  const defStatId = move.category === 'physical' ? 'def' : 'spdef';
  const typeMult  = calcTypeMultiplier(move.type, enemy.types);
  const stabMult  = calcStabMultiplier(move.type, attacker.types);

  return calcEnemyScenarios(enemy, defStatId).map(s => {
    const dmg = calcDamage(atkStat, s.def, move.power, extraPower, atkBuff, defBuff, typeMult, stabMult, abilityMult) * totalHits * defAbilityMult;
    const pct = s.hp > 0 ? (dmg / s.hp * 100).toFixed(1) : '∞';
    return { ...s, dmg, pct };
  });
}
