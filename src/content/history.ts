export interface HistoryEvent {
  id: string;
  name: string;
  season: string;
  date: string;
  champion: { teamName: string; teamTag: string };
  runnerUp?: { teamName: string; teamTag: string };
  summary: string;
  highlights: string[];
}

export const historyEvents: HistoryEvent[] = [
  {
    id: "jcg-s1",
    name: "荆楚歌 #1",
    season: "SEASON 01",
    date: "2025-09",
    champion: { teamName: "初代冠军队", teamTag: "S1C" },
    runnerUp: { teamName: "初代亚军队", teamTag: "S1R" },
    summary:
      "首届荆楚歌集成战略赛事，七支湖北高校队伍参赛。赛事采用四人接力制，选手分别挑战不同肉鸽主题，最终以修正后总分决出胜负。首届赛事奠定了系数扣减、超时惩罚等核心规则框架。",
    highlights: [
      "首次采用四人轮转接力赛制",
      "确立系数扣减机制（超时、重复六星、源石锭超支）",
      "单场最高个人得分纪录诞生",
      "赛事全程通过哔哩哔哩直播",
    ],
  },
];
