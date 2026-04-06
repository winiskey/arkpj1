const samiStageScores = Object.freeze({
  "sa-stage-breath": 50,
  "sa-stage-tree": 50,
  "sa-stage-earthwake": 75,
  "sa-stage-ban": 30,
  "sa-stage-collapse": 30,
  "sa-stage-march": 50,
  "sa-stage-chaos": 50,
  "sa-stage-mountains": 50,
  "sa-stage-instinct": 60,
  "sa-stage-carnival": 80,
  "sa-stage-endpoint": 80,
  "sa-stage-silverpine": 50,
  "sa-stage-statue": 150,
  "sa-stage-entropy": 100,
  "sa-stage-idol": 250,
  "sa-stage-gardener": 150,
  "sa-stage-sentinel": 300,
  "sa-stage-sands": 100,
  "sa-stage-eternity": 180,
});

const sarkazStageScores = Object.freeze({
  "sk-stage-foe": 75,
  "sk-stage-crown": 75,
  "sk-stage-courtyard": 100,
  "sk-stage-chaos": 30,
  "sk-stage-ghost": 40,
  "sk-stage-controversy": 40,
  "sk-stage-rhine": 50,
  "sk-stage-regime": 50,
  "sk-stage-sacred": 40,
  "sk-stage-consensus": 50,
  "sk-stage-heresy": 70,
  "sk-stage-paradise": 90,
});

const suiStageScores = Object.freeze({
  "sui-stage-xye": 30,
  "sui-stage-qiudao": 70,
  "sui-stage-ryw": 50,
  "sui-stage-posz": 0,
  "sui-stage-xzry": 150,
  "sui-stage-tsjy": 50,
  "sui-stage-wxny": 200,
  "sui-stage-msz": 200,
  "sui-stage-ms": 200,
  "sui-stage-xiban": 30,
  "sui-stage-zhangong": 40,
  "sui-stage-butun": 50,
  "sui-stage-liyu": 40,
  "sui-stage-suixing": 30,
  "sui-stage-yinya": 50,
  "sui-stage-fangzhi": 60,
  "sui-stage-lifeng": 50,
  "sui-stage-yanhuo": 70,
  "sui-stage-yueshanhai": 150,
  "sui-stage-yanzhuo": 70,
  "sui-stage-jieli": 40,
  "sui-stage-renzhen": 30,
  "sui-stage-fuyin": 25,
  "sui-stage-xianghe": 25,
  "sui-stage-shifeng": 30,
});

const suiEndingScores = Object.freeze({
  dqk: { base: 400, perf: 200 },
  dqk_dby: { base: 800, perf: 200 },
  zb_hzf: { base: 800, perf: 250 },
  zb_scx: { base: 900, perf: 300 },
  zb_gdy: { base: 800, perf: 250 },
  zb_sjl: { base: 700, perf: 200 },
  zb_yqs: { base: 1200, perf: 0 },
});

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getNumber(snapshot, key) {
  const value = Number(asObject(snapshot)[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function getBoolean(snapshot, key) {
  return Boolean(asObject(snapshot)[key]);
}

function getString(snapshot, key, fallback = "") {
  const value = asObject(snapshot)[key];
  return typeof value === "string" ? value : fallback;
}

function roundScore(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatNumber(value) {
  return roundScore(value).toFixed(2);
}

function sumCheckedScores(snapshot, scoresByKey) {
  return Object.entries(scoresByKey).reduce(
    (sum, [key, value]) => sum + (getBoolean(snapshot, key) ? value : 0),
    0,
  );
}

function buildResult(total, formulaText, extras = {}) {
  return {
    ...extras,
    previewScore: roundScore(total),
    formulaText,
  };
}

function isFinalsEnabled(snapshot) {
  return getBoolean(snapshot, "finals-enabled");
}

export function calculateSamiScore(snapshot) {
  const rawBase =
    getNumber(snapshot, "sa-score")
    + getNumber(snapshot, "sa-items") * 10
    + getNumber(snapshot, "sa-plates") * 5
    + getNumber(snapshot, "sa-6s") * 50
    + getNumber(snapshot, "sa-5s") * 20
    + getNumber(snapshot, "sa-4s") * 10;

  let raw = rawBase + sumCheckedScores(snapshot, samiStageScores);
  raw += getNumber(snapshot, "sa-end-link");

  if (getBoolean(snapshot, "sa-combo")) raw += 50;
  if (getBoolean(snapshot, "sa-gardener-nl")) raw += 50;
  if (getBoolean(snapshot, "sa-sentinel-nl")) raw += 100;
  if (getBoolean(snapshot, "sa-gift")) raw += 70;

  const finalsEnabled = isFinalsEnabled(snapshot);
  const total = raw;

  return buildResult(total, `(${formatNumber(raw)})`, {
    rawScore: roundScore(raw),
    multiplier: 1,
    finalsEnabled,
  });
}

export function calculateSarkazScore(snapshot) {
  let raw =
    getNumber(snapshot, "sk-score")
    + getNumber(snapshot, "sk-items") * 5
    + getNumber(snapshot, "sk-6s") * 50
    + getNumber(snapshot, "sk-5s") * 20
    + getNumber(snapshot, "sk-4s") * 10;

  if (getBoolean(snapshot, "sk-memory-violate")) raw -= 17.5;
  if (getBoolean(snapshot, "sk-babel-miss")) raw -= 500;

  raw += sumCheckedScores(snapshot, sarkazStageScores);

  const hasKarma = getBoolean(snapshot, "sk-karma");
  let ending = 0;

  if (getBoolean(snapshot, "sk-n1-done")) {
    let value = hasKarma ? 120 : 50;
    if (getBoolean(snapshot, "sk-n1-conf")) value += hasKarma ? 50 : 20;
    if (hasKarma && getBoolean(snapshot, "sk-n1-perf")) value += 80;
    ending += value;
  }

  if (getBoolean(snapshot, "sk-n2-done")) {
    let value = hasKarma ? 200 : 50;
    if (getBoolean(snapshot, "sk-n2-conf")) value += hasKarma ? 50 : 20;
    ending += value;
  }

  if (getBoolean(snapshot, "sk-n3-done")) {
    let value = hasKarma ? 300 : 100;
    if (getBoolean(snapshot, "sk-n3-conf")) value += hasKarma ? 50 : 20;
    ending += value;
  }

  if (getBoolean(snapshot, "sk-n5-done")) {
    let value = 500;
    if (getBoolean(snapshot, "sk-n5-conf")) value += 100;
    if (getBoolean(snapshot, "sk-boss")) value += 300;
    ending += value;
  }

  if (getBoolean(snapshot, "sk-n4-done")) {
    let value = 400;
    if (getBoolean(snapshot, "sk-n4-conf")) value += 200;

    const relic = getString(snapshot, "sk-end-relic", "none");
    if (hasKarma) {
      if (relic === "bone") {
        if (getBoolean(snapshot, "sk-n4-perf")) value += 100;
      }
      if (relic === "body") {
        if (getBoolean(snapshot, "sk-n4-perf")) value += 100;
        value *= 1.1;
      }
      if (relic === "reality") {
        if (getBoolean(snapshot, "sk-n4-perf")) value += 150;
        value *= 1.5;
      }
    } else {
      if (relic === "bone") value *= 0.6;
      if (relic === "body") value *= 0.8;
    }

    ending += value;
  }

  if (getBoolean(snapshot, "sk-roll")) {
    ending *= 1.2;
  }

  raw += ending;
  const finalsEnabled = isFinalsEnabled(snapshot);
  const multiplier = finalsEnabled ? 0.85 : 0.75;
  const total = raw * multiplier;

  return buildResult(total, `(${formatNumber(raw)} x ${formatNumber(multiplier)})`, {
    rawScore: roundScore(raw),
    multiplier: roundScore(multiplier),
    finalsEnabled,
  });
}

export function calculateSuiScore(snapshot) {
  const finalsEnabled = isFinalsEnabled(snapshot);
  const items = Math.max(0, getNumber(snapshot, "sui-items"));
  const steps = Math.max(0, getNumber(snapshot, "sui-steps"));
  const enteredJinxi = finalsEnabled && getBoolean(snapshot, "sui-finals-jinxi");
  const itemScoreCap = enteredJinxi ? 80 : 120;

  if (getBoolean(snapshot, "sui-rule-violate") || steps > 150) {
    return buildResult(0, "Rule violation => 0", {
      rawScore: 0,
      multiplier: 0,
      finalsEnabled,
    });
  }

  let raw =
    getNumber(snapshot, "sui-score")
    + Math.min(items, itemScoreCap) * 5
    + getNumber(snapshot, "sui-6s") * 50
    + getNumber(snapshot, "sui-5s") * 20
    + getNumber(snapshot, "sui-4s") * 10;

  raw += sumCheckedScores(snapshot, suiStageScores);

  const hasXm = getBoolean(snapshot, "sui-it-xm");
  const hasWs = getBoolean(snapshot, "sui-it-ws");
  const hasYyq = getBoolean(snapshot, "sui-it-yyq");
  const hasWf = getBoolean(snapshot, "sui-it-wf");

  if (getBoolean(snapshot, "sui-stage-posz")) {
    if (hasXm) raw += 50;
    if (hasWs) raw += 30;
    if (hasYyq) raw += 30;
    if (hasWf) raw += 50;
  }
  if (getBoolean(snapshot, "sui-stage-xzry")) {
    if (hasXm) raw += 100;
    if (hasWs) raw += 50;
    if (hasYyq) raw += 50;
    if (hasWf) raw += 50;
  }
  if (getBoolean(snapshot, "sui-stage-tsjy")) {
    if (hasXm) raw += 50;
    if (hasWs) raw += 30;
  }
  if (getBoolean(snapshot, "sui-stage-wxny")) {
    if (hasXm) raw += 100;
    if (hasWs) raw += 50;
  }
  if (getBoolean(snapshot, "sui-stage-msz")) {
    if (hasXm) raw += 50;
    if (hasWf) raw += 50;
  }
  if (getBoolean(snapshot, "sui-stage-ms")) {
    if (hasXm) raw += 50;
    if (hasWs) raw += 50;
  }

  const ending = getString(snapshot, "sui-ending", "none");
  if (ending !== "none" && suiEndingScores[ending]) {
    raw += suiEndingScores[ending].base;

    if (ending === "zb_yqs") {
      raw += getNumber(snapshot, "sui-beast-loss");
    } else if (getBoolean(snapshot, "sui-end-perf")) {
      raw += suiEndingScores[ending].perf;
    }

    if (hasWs) raw += 100;
    if (hasYyq) raw += 100;
    if (hasWf) raw += 50;
  }

  raw -= Math.max(0, steps - 100) * 1.5;
  raw -= Math.max(0, items - itemScoreCap) * 7.5;

  let multiplier = (finalsEnabled ? 0.5 : 0.4) * (1 + (getBoolean(snapshot, "sui-item-a") ? 0.2 : 0) + (getBoolean(snapshot, "sui-item-b") ? 0.2 : 0));
  if (getBoolean(snapshot, "sui-pen-1")) multiplier *= 0.5;
  if (getBoolean(snapshot, "sui-pen-2")) multiplier *= 0.5;

  const total = raw * multiplier;
  return buildResult(total, `(${formatNumber(raw)} x ${formatNumber(multiplier)})`, {
    rawScore: roundScore(raw),
    multiplier: roundScore(multiplier),
    finalsEnabled,
  });
}

export function calculateTeamScore(snapshot) {
  const scores = [
    getNumber(snapshot, "team-p1"),
    getNumber(snapshot, "team-p2"),
    getNumber(snapshot, "team-p3"),
    getNumber(snapshot, "team-p4"),
  ];

  const pressure = getNumber(snapshot, "team-pressure");
  if (pressure >= 1 && pressure <= 4) {
    scores[pressure - 1] *= 1.2;
  }

  const total = scores.reduce((a, b) => a + b, 0);
  return buildResult(total, `团队总分 = ${formatNumber(total)}`, {
    rawScore: roundScore(total),
    multiplier: 1,
  });
}

export function calculateThemeScore(theme, snapshot) {
  if (theme === "team") return calculateTeamScore(snapshot);
  if (theme === "sami") return calculateSamiScore(snapshot);
  if (theme === "sarkaz") return calculateSarkazScore(snapshot);
  if (theme === "sui") return calculateSuiScore(snapshot);
  throw new Error(`Unsupported theme: ${theme}`);
}
