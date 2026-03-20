export type CalculatorTheme = "sami" | "sarkaz" | "sui";
export type CalculatorTab = "team" | CalculatorTheme;
export type SnapshotValue = boolean | number | string;
export type ThemeSnapshot = Record<string, SnapshotValue>;

export interface NumberField {
  key: string;
  label: string;
}

export interface CheckboxField {
  key: string;
  label: string;
  badge?: string;
  tone?: "default" | "danger";
}

export interface SelectFieldOption {
  label: string;
  value: string;
}

export interface SelectField {
  key: string;
  label: string;
  options: SelectFieldOption[];
}

export const TAB_LABELS: Record<CalculatorTab, string> = {
  team: "战队总览",
  sami: "探索者的银淞止境",
  sarkaz: "萨卡兹的无终奇语",
  sui: "岁的界园志异",
};

export const THEME_LABELS: Record<CalculatorTheme, string> = {
  sami: TAB_LABELS.sami,
  sarkaz: TAB_LABELS.sarkaz,
  sui: TAB_LABELS.sui,
};

export function inferThemeCodeFromMemberTheme(themeLabel: string | null | undefined): CalculatorTheme | null {
  if (!themeLabel) {
    return null;
  }

  if (themeLabel.includes("萨卡兹")) {
    return "sarkaz";
  }

  if (themeLabel.includes("界园") || themeLabel.includes("岁")) {
    return "sui";
  }

  if (themeLabel.includes("萨米") || themeLabel.includes("银淞")) {
    return "sami";
  }

  return null;
}

const defaultThemeSnapshots: Record<CalculatorTheme, ThemeSnapshot> = {
  sami: {
    "sa-score": 0,
    "sa-items": 0,
    "sa-plates": 0,
    "sa-6s": 0,
    "sa-5s": 0,
    "sa-4s": 0,
    "sa-gift": false,
    "sa-combo": false,
    "sa-gardener-nl": false,
    "sa-sentinel-nl": false,
    "sa-end-link": "0",
    "sa-stage-breath": false,
    "sa-stage-tree": false,
    "sa-stage-earthwake": false,
    "sa-stage-ban": false,
    "sa-stage-collapse": false,
    "sa-stage-march": false,
    "sa-stage-chaos": false,
    "sa-stage-mountains": false,
    "sa-stage-instinct": false,
    "sa-stage-carnival": false,
    "sa-stage-endpoint": false,
    "sa-stage-silverpine": false,
    "sa-stage-statue": false,
    "sa-stage-entropy": false,
    "sa-stage-idol": false,
    "sa-stage-gardener": false,
    "sa-stage-sentinel": false,
    "sa-stage-sands": false,
    "sa-stage-eternity": false,
  },
  sarkaz: {
    "sk-score": 0,
    "sk-items": 0,
    "sk-6s": 0,
    "sk-5s": 0,
    "sk-4s": 0,
    "sk-karma": false,
    "sk-memory-violate": false,
    "sk-babel-miss": false,
    "sk-stage-foe": false,
    "sk-stage-crown": false,
    "sk-stage-courtyard": false,
    "sk-stage-chaos": false,
    "sk-stage-ghost": false,
    "sk-stage-controversy": false,
    "sk-stage-rhine": false,
    "sk-stage-regime": false,
    "sk-stage-sacred": false,
    "sk-stage-consensus": false,
    "sk-stage-heresy": false,
    "sk-stage-paradise": false,
    "sk-end-relic": "none",
    "sk-roll": false,
    "sk-n1-done": false,
    "sk-n1-conf": false,
    "sk-n1-perf": false,
    "sk-n2-done": false,
    "sk-n2-conf": false,
    "sk-n3-done": false,
    "sk-n3-conf": false,
    "sk-n5-done": false,
    "sk-n5-conf": false,
    "sk-boss": false,
    "sk-n4-done": false,
    "sk-n4-conf": false,
    "sk-n4-perf": false,
  },
  sui: {
    "sui-score": 0,
    "sui-items": 0,
    "sui-steps": 0,
    "sui-6s": 0,
    "sui-5s": 0,
    "sui-4s": 0,
    "sui-rule-violate": false,
    "sui-item-a": false,
    "sui-item-b": false,
    "sui-pen-1": false,
    "sui-pen-2": false,
    "sui-it-xm": false,
    "sui-it-ws": false,
    "sui-it-yyq": false,
    "sui-it-wf": false,
    "sui-ending": "none",
    "sui-end-perf": false,
    "sui-beast-loss": "0",
    "sui-stage-xye": false,
    "sui-stage-qiudao": false,
    "sui-stage-ryw": false,
    "sui-stage-posz": false,
    "sui-stage-xzry": false,
    "sui-stage-tsjy": false,
    "sui-stage-wxny": false,
    "sui-stage-msz": false,
    "sui-stage-ms": false,
    "sui-stage-xiban": false,
    "sui-stage-zhangong": false,
    "sui-stage-butun": false,
    "sui-stage-liyu": false,
    "sui-stage-suixing": false,
    "sui-stage-yinya": false,
    "sui-stage-fangzhi": false,
    "sui-stage-lifeng": false,
    "sui-stage-yanhuo": false,
    "sui-stage-yueshanhai": false,
    "sui-stage-yanzhuo": false,
    "sui-stage-jieli": false,
    "sui-stage-renzhen": false,
    "sui-stage-fuyin": false,
    "sui-stage-xianghe": false,
    "sui-stage-shifeng": false,
  },
};

export function getDefaultThemeSnapshot(theme: CalculatorTheme): ThemeSnapshot {
  return { ...defaultThemeSnapshots[theme] };
}

export function createDefaultSnapshots(): Record<CalculatorTheme, ThemeSnapshot> {
  return {
    sami: getDefaultThemeSnapshot("sami"),
    sarkaz: getDefaultThemeSnapshot("sarkaz"),
    sui: getDefaultThemeSnapshot("sui"),
  };
}

export function hydrateThemeSnapshot(theme: CalculatorTheme, incoming: Record<string, unknown> | null | undefined): ThemeSnapshot {
  const defaults = defaultThemeSnapshots[theme];
  const nextSnapshot: ThemeSnapshot = { ...defaults };

  for (const [key, fallback] of Object.entries(defaults)) {
    const candidate = incoming?.[key];

    if (typeof fallback === "boolean") {
      nextSnapshot[key] = Boolean(candidate);
      continue;
    }

    if (typeof fallback === "number") {
      const parsed = Number(candidate);
      nextSnapshot[key] = Number.isFinite(parsed) ? parsed : fallback;
      continue;
    }

    nextSnapshot[key] = typeof candidate === "string" ? candidate : fallback;
  }

  return nextSnapshot;
}

export const SAMI_BASE_ROWS: NumberField[][] = [
  [
    { key: "sa-score", label: "结算分" },
    { key: "sa-items", label: "藏品数（+10/个）" },
    { key: "sa-plates", label: "密文板（+5/个）" },
  ],
  [
    { key: "sa-6s", label: "临时六星（+50）" },
    { key: "sa-5s", label: "临时五星（+20）" },
    { key: "sa-4s", label: "临时四星（+10）" },
  ],
];

export const SAMI_SPECIAL_FIELDS: CheckboxField[] = [
  { key: "sa-gift", label: "无垠赠礼且过 5 层 boss", badge: "+70" },
  { key: "sa-combo", label: "三藏品联动通过时光/永恒", badge: "+50" },
  { key: "sa-gardener-nl", label: "园丁无漏额外", badge: "+50" },
  { key: "sa-sentinel-nl", label: "哨兵无漏额外", badge: "+100" },
];

export const SAMI_END_LINK_FIELD: SelectField = {
  key: "sa-end-link",
  label: "结局联动加分",
  options: [
    { value: "0", label: "无" },
    { value: "50", label: "冬夜 + 深处 双达成（+50）" },
    { value: "150", label: "234 连打（+150）" },
  ],
};

export const SAMI_STAGE_FIELDS: CheckboxField[] = [
  { key: "sa-stage-breath", label: "呼吸", badge: "+50" },
  { key: "sa-stage-tree", label: "夺树者", badge: "+50" },
  { key: "sa-stage-earthwake", label: "大地醒转", badge: "+75" },
  { key: "sa-stage-ban", label: "禁区", badge: "+30" },
  { key: "sa-stage-collapse", label: "坍缩体的午后", badge: "+30" },
  { key: "sa-stage-march", label: "亡者行军", badge: "+50" },
  { key: "sa-stage-chaos", label: "混乱的表象", badge: "+50" },
  { key: "sa-stage-mountains", label: "何处无山海", badge: "+50" },
  { key: "sa-stage-instinct", label: "本能污染", badge: "+60" },
  { key: "sa-stage-carnival", label: "人造物狂欢节", badge: "+80" },
  { key: "sa-stage-endpoint", label: "生灵的终点", badge: "+80" },
  { key: "sa-stage-silverpine", label: "巍峨银凇", badge: "+50" },
  { key: "sa-stage-statue", label: "深寒造像", badge: "+150" },
  { key: "sa-stage-entropy", label: "萨米之熵", badge: "+100" },
  { key: "sa-stage-idol", label: "虚无之偶", badge: "+250" },
  { key: "sa-stage-gardener", label: "园丁（基础）", badge: "+150" },
  { key: "sa-stage-sentinel", label: "哨兵（基础）", badge: "+300" },
  { key: "sa-stage-sands", label: "时光之沙", badge: "+100" },
  { key: "sa-stage-eternity", label: "迈入永恒", badge: "+180" },
];

export const SARKAZ_KEY_FIELDS: CheckboxField[] = [
  { key: "sk-karma", label: "持有阿纳萨羯磨" },
  { key: "sk-memory-violate", label: "违规选无主回忆", badge: "-17.5", tone: "danger" },
  { key: "sk-babel-miss", label: "无巴别塔誓言", badge: "-500", tone: "danger" },
];

export const SARKAZ_BASE_ROWS: NumberField[][] = [
  [
    { key: "sk-score", label: "结算分" },
    { key: "sk-items", label: "收藏品（+5/个）" },
  ],
  [
    { key: "sk-6s", label: "临时六星（+50）" },
    { key: "sk-5s", label: "临时五星（+20）" },
    { key: "sk-4s", label: "临时四星（+10）" },
  ],
];

export const SARKAZ_STAGE_FIELDS: CheckboxField[] = [
  { key: "sk-stage-foe", label: "赴敌者", badge: "+75" },
  { key: "sk-stage-crown", label: "王冠之下", badge: "+75" },
  { key: "sk-stage-courtyard", label: "离歌的庭院", badge: "+100" },
  { key: "sk-stage-chaos", label: "混沌", badge: "+30" },
  { key: "sk-stage-ghost", label: "神出鬼没", badge: "+40" },
  { key: "sk-stage-controversy", label: "争议频发", badge: "+40" },
  { key: "sk-stage-rhine", label: "莱茵卫士", badge: "+50" },
  { key: "sk-stage-regime", label: "建制", badge: "+50" },
  { key: "sk-stage-sacred", label: "神圣的渴求", badge: "+40" },
  { key: "sk-stage-consensus", label: "谋求共识", badge: "+50" },
  { key: "sk-stage-heresy", label: "外道", badge: "+70" },
  { key: "sk-stage-paradise", label: "洞天福地", badge: "+90" },
];

export const SARKAZ_RELIC_FIELD: SelectField = {
  key: "sk-end-relic",
  label: "不容拒绝终结藏品",
  options: [
    { value: "none", label: "无" },
    { value: "bone", label: "终结的骨架" },
    { value: "body", label: "终结的躯体" },
    { value: "reality", label: "终结的实相" },
  ],
};

export const SARKAZ_ROLL_FIELD: CheckboxField = {
  key: "sk-roll",
  label: "滚动先祖（所有结局关 ×120%）",
};

export const SARKAZ_ENDING_GROUPS: Array<{ title: string; fields: CheckboxField[] }> = [
  {
    title: "思维矫正",
    fields: [
      { key: "sk-n1-done", label: "完成" },
      { key: "sk-n1-conf", label: "思绪混乱" },
      { key: "sk-n1-perf", label: "无漏" },
    ],
  },
  {
    title: "朝谒",
    fields: [
      { key: "sk-n2-done", label: "完成" },
      { key: "sk-n2-conf", label: "思绪混乱" },
    ],
  },
  {
    title: "魂灵朝谒",
    fields: [
      { key: "sk-n3-done", label: "完成" },
      { key: "sk-n3-conf", label: "思绪混乱" },
    ],
  },
  {
    title: "授法",
    fields: [
      { key: "sk-n5-done", label: "完成" },
      { key: "sk-n5-conf", label: "思绪混乱" },
      { key: "sk-boss", label: "击杀奎隆" },
    ],
  },
  {
    title: "不容拒绝",
    fields: [
      { key: "sk-n4-done", label: "完成" },
      { key: "sk-n4-conf", label: "思绪混乱" },
      { key: "sk-n4-perf", label: "无漏" },
    ],
  },
];

export const SUI_BASE_ROWS: NumberField[][] = [
  [
    { key: "sui-score", label: "结算分" },
    { key: "sui-items", label: "藏品数（+5/个，最多 120）" },
    { key: "sui-steps", label: "步数（>150 直接 0 分）" },
  ],
  [
    { key: "sui-6s", label: "临时六星（+50）" },
    { key: "sui-5s", label: "临时五星（+20）" },
    { key: "sui-4s", label: "临时四星（+10）" },
  ],
];

export const SUI_RULE_FIELD: CheckboxField = {
  key: "sui-rule-violate",
  label: "违规（节点次数/热水壶等） -> 本主题 0 分",
  tone: "danger",
};

export const SUI_MULTIPLIER_FIELDS: CheckboxField[] = [
  { key: "sui-item-a", label: "持有不息（+20%）" },
  { key: "sui-item-b", label: "持有不赦（+20%）" },
  { key: "sui-pen-1", label: "未获得追忆仪（-50%）", tone: "danger" },
  { key: "sui-pen-2", label: "未获得云与漆与无墨长卷（-50%）", tone: "danger" },
];

export const SUI_RELIC_FIELDS: CheckboxField[] = [
  { key: "sui-it-xm", label: "小磨叽" },
  { key: "sui-it-ws", label: "忘生珍珑" },
  { key: "sui-it-yyq", label: "云与漆" },
  { key: "sui-it-wf", label: "无封长盒" },
];

export const SUI_ENDING_FIELD: SelectField = {
  key: "sui-ending",
  label: "结局选择",
  options: [
    { value: "none", label: "无" },
    { value: "dqk", label: "定乾坤 +400" },
    { value: "dqk_dby", label: "定本源·定乾坤 +800" },
    { value: "zb_hzf", label: "止变·化镇抚 +800" },
    { value: "zb_scx", label: "止变·溯承形 +900" },
    { value: "zb_gdy", label: "止变·改对弈 +800" },
    { value: "zb_sjl", label: "止变·塑旧历 +700" },
    { value: "zb_yqs", label: "止变·役群兽 +1200" },
  ],
};

export const SUI_ENDING_PERF_FIELD: CheckboxField = {
  key: "sui-end-perf",
  label: "无漏（役群兽除外）",
};

export const SUI_BEAST_LOSS_FIELD: SelectField = {
  key: "sui-beast-loss",
  label: "仅役群兽：损失目标生命加分",
  options: [
    { value: "0", label: "不加分" },
    { value: "500", label: "无漏（0 损）+500" },
    { value: "300", label: "(0,5] +300" },
    { value: "200", label: "(5,50] +200" },
  ],
};

export const SUI_STAGE_FIELDS: CheckboxField[] = [
  { key: "sui-stage-xye", label: "夕娥忆", badge: "+30" },
  { key: "sui-stage-qiudao", label: "求道", badge: "+70" },
  { key: "sui-stage-ryw", label: "仁义武", badge: "+50" },
  { key: "sui-stage-posz", label: "破岁阵祀", badge: "+0" },
  { key: "sui-stage-xzry", label: "昔字如烟", badge: "+150" },
  { key: "sui-stage-tsjy", label: "天数将易", badge: "+50" },
  { key: "sui-stage-wxny", label: "往昔难忆", badge: "+200" },
  { key: "sui-stage-msz", label: "谋岁者", badge: "+200" },
  { key: "sui-stage-ms", label: "末狩", badge: "+200" },
  { key: "sui-stage-xiban", label: "赶场戏班", badge: "+30" },
  { key: "sui-stage-zhangong", label: "峥嵘战功", badge: "+40" },
  { key: "sui-stage-butun", label: "忍气不吞声", badge: "+50" },
  { key: "sui-stage-liyu", label: "离域检查", badge: "+40" },
  { key: "sui-stage-suixing", label: "岁醒天时被投出", badge: "+30" },
  { key: "sui-stage-yinya", label: "往事喑哑", badge: "+50" },
  { key: "sui-stage-fangzhi", label: "邙山镇地方志", badge: "+60" },
  { key: "sui-stage-lifeng", label: "砺锋", badge: "+50" },
  { key: "sui-stage-yanhuo", label: "不成烟火", badge: "+70" },
  { key: "sui-stage-yueshanhai", label: "越山海", badge: "+150" },
  { key: "sui-stage-yanzhuo", label: "炎灼", badge: "+70" },
  { key: "sui-stage-jieli", label: "借力打力", badge: "+40" },
  { key: "sui-stage-renzhen", label: "人镇", badge: "+30" },
  { key: "sui-stage-fuyin", label: "遍地福音", badge: "+25" },
  { key: "sui-stage-xianghe", label: "相合", badge: "+25" },
  { key: "sui-stage-shifeng", label: "时封", badge: "+30" },
];
