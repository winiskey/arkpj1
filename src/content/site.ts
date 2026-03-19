import type { SiteMeta } from "./types";

export const siteMeta: SiteMeta = {
  eventName: "荆楚歌 #2",
  eventCode: "JINGCHU SONG // SEASON 02",
  subtitle: "湖北高校集成战略赛事官网",
  description: "",
  startDate: "2026-03-08",
  locationLabel: "线上开赛",
  prizePool: [
    { label: "冠军战队", value: "648 元" },
    { label: "亚军战队", value: "328 元" },
    { label: "其他队伍", value: "120 元 / 队" },
  ],
  highlights: [],
  ctaLinks: [
    { label: "进入赛事大厅", href: "/live", kind: "internal" },
    { label: "查看完整规则", href: "/rules", kind: "internal" },
  ],
};

export const overviewPanels = [
  {
    title: "赛制核心",
    label: "FORMAT",
    content:
      "四名选手分别挑战不同集成战略主题，以修正后的个人结算分汇总为战队总分。",
  },
  {
    title: "判定逻辑",
    label: "COEFFICIENT",
    content:
      "战队最终系数从 1.0 起算，每超时 20 分钟、重复抓六星或额外取源石锭都会造成扣减。",
  },
  {
    title: "赛事节奏",
    label: "TIMELINE",
    content:
      "2026 年 3 月 8 日开赛，是否设置决赛将视报名战队数量决定。",
  },
];
