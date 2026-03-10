import type { LeaderboardEntry, Match, ScheduleDay } from "./types";

export const matches: Match[] = [
  {
    id: "M1",
    phase: "ROUND 1",
    startTime: "19:00",
    status: "IN_PROGRESS",
    teamId: "mygo",
    totalScore: "5,680",
    currentMemberId: "P2",
    currentMemberName: "红白、",
    members: [
      { id: "P1", name: "吃豆腐蘸酱", theme: "探索者的银凇止境", score: 1680, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "红白、", theme: "萨卡兹的无终奇语", score: 4000, multiplier: 0.92, status: "LIVE", queueOrder: 2 },
      { id: "P3", name: "若亭", theme: "岁的界园志异", score: 0, multiplier: 0.7, status: "PENDING", queueOrder: 3 },
      { id: "P4", name: "雪月花", theme: "探索者的银凇止境", score: 0, multiplier: 1.05, status: "PENDING", queueOrder: 4 },
    ],
    note: "主会场当前追踪 mygo：红白、。吃豆腐蘸酱已完成首棒，后两位成员待命。",
  },
  {
    id: "M2",
    phase: "ROUND 1",
    startTime: "20:30",
    status: "PENDING",
    teamId: "tianqi-siqushi",
    totalScore: "0",
    currentMemberId: "P1",
    currentMemberName: "某大叔速水好",
    members: [
      { id: "P1", name: "某大叔速水好", theme: "探索者的银凇止境", score: 0, multiplier: 1, status: "PENDING", queueOrder: 1 },
      { id: "P2", name: "起步之志", theme: "萨卡兹的无终奇语", score: 0, multiplier: 1, status: "PENDING", queueOrder: 2 },
      { id: "P3", name: "忍野忍不下去", theme: "岁的界园志异", score: 0, multiplier: 1, status: "PENDING", queueOrder: 3 },
      { id: "P4", name: "拾壹月的鹤主", theme: "探索者的银凇止境", score: 0, multiplier: 1, status: "PENDING", queueOrder: 4 },
    ],
    playersList: ["某大叔速水好", "起步之志", "忍野忍不下去", "拾壹月的鹤主"],
    note: "赛前检查中，首位待命成员为某大叔速水好。",
  },
  {
    id: "M3",
    phase: "ROUND 1",
    startTime: "22:00",
    status: "PENDING",
    teamId: "siqu-brothers",
    totalScore: "0",
    currentMemberId: "P1",
    currentMemberName: "Aimer",
    members: [
      { id: "P1", name: "Aimer", theme: "探索者的银凇止境", score: 0, multiplier: 1, status: "PENDING", queueOrder: 1 },
      { id: "P2", name: "朝霞", theme: "萨卡兹的无终奇语", score: 0, multiplier: 1, status: "PENDING", queueOrder: 2 },
      { id: "P3", name: "洛齐克", theme: "岁的界园志异", score: 0, multiplier: 1, status: "PENDING", queueOrder: 3 },
      { id: "P4", name: "顾秦", theme: "探索者的银凇止境", score: 0, multiplier: 1, status: "PENDING", queueOrder: 4 },
    ],
    playersList: ["Aimer", "朝霞", "洛齐克", "顾秦"],
    note: "待开赛，四驱兄弟想队名全员已完成上场登记。",
  },
  {
    id: "M0",
    phase: "QUALIFIER",
    startTime: "17:00",
    status: "FINISHED",
    teamId: "strawberry-no1",
    totalScore: "15,200",
    currentMemberId: "P4",
    currentMemberName: "言",
    members: [
      { id: "P1", name: "归零", theme: "探索者的银凇止境", score: 4100, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "浪淘沙尽天涯", theme: "萨卡兹的无终奇语", score: 3900, multiplier: 1, status: "FINISHED", queueOrder: 2 },
      { id: "P3", name: "糖该葡萄糖", theme: "岁的界园志异", score: 3200, multiplier: 1, status: "FINISHED", queueOrder: 3 },
      { id: "P4", name: "言", theme: "探索者的银凇止境", score: 4000, multiplier: 1, status: "FINISHED", queueOrder: 4 },
    ],
    playersList: ["归零", "浪淘沙尽天涯", "糖该葡萄糖", "言"],
    note: "草莓天下第一已完成裁判复核，无额外扣罚。",
  },
];



export const eventSchedule: ScheduleDay[] = [
  {
    date: "3.9",
    weekday: "周一",
    slots: [
      { period: "中", time: "14:00", player: "浪淘沙尽天涯" },
      { period: "晚", time: "19:00", player: "言" },
    ],
  },
  {
    date: "3.10",
    weekday: "周二",
    slots: [
      { period: "中", time: "14:00", player: "忍野忍不下去" },
      { period: "晚", time: "19:00", player: "吃豆腐蘸酱" },
    ],
  },
  {
    date: "3.11",
    weekday: "周三",
    slots: [
      { period: "早", time: "9:00", player: "洛齐克" },
      { period: "中", time: "14:00", player: "圣人又土" },
      { period: "晚", time: "19:00", player: "last要楽奈丶" },
    ],
  },
  {
    date: "3.12",
    weekday: "周四",
    slots: [
      { period: "早", time: "9:00", player: "呃呃啊啊" },
      { period: "中", time: "14:00", player: "DISTANCE若亭" },
      { period: "晚", time: "19:00", player: "归零" },
    ],
  },
  {
    date: "3.13",
    weekday: "周五",
    slots: [
      { period: "早", time: "9:00", player: "生命值" },
      { period: "中", time: "14:00", player: "雪月花" },
      { period: "晚", time: "19:00", player: "顾秦" },
    ],
  },
  {
    date: "3.14",
    weekday: "周六",
    slots: [
      { period: "早", time: "9:00", player: "朝霞" },
      { period: "中", time: "14:00", player: "魔法蜘蛛" },
      { period: "晚", time: "19:00", player: "拾壹月的鹤主" },
    ],
  },
  {
    date: "3.15",
    weekday: "周日",
    slots: [
      { period: "早", time: "9:00", player: "兔头无权为我授" },
      { period: "中", time: "14:00", player: "幻尘" },
      { period: "晚", time: "19:00", player: "布兰卡" },
    ],
  },
  {
    date: "3.16",
    weekday: "周一",
    slots: [
      { period: "中", time: "14:00", player: "红白白" },
      { period: "晚", time: "19:00", player: "快晴" },
    ],
  },
  {
    date: "3.17",
    weekday: "周二",
    slots: [
      { period: "中", time: "14:00", player: "淮南牛肉汤" },
      { period: "晚", time: "19:00", player: "酱香企鹅" },
    ],
  },
  {
    date: "3.18",
    weekday: "周三",
    slots: [
      { period: "中", time: "14:00", player: "某大叔速水好" },
      { period: "晚", time: "19:00", player: "糖该葡萄糖" },
    ],
  },
  {
    date: "3.19",
    weekday: "周四",
    slots: [
      { period: "中", time: "14:00", player: "Aimer" },
      { period: "晚", time: "19:00", player: "白身鱼" },
    ],
  },
  {
    date: "3.20",
    weekday: "周五",
    slots: [
      { period: "晚", time: "19:00", player: "海嗣" },
    ],
  },
];
export const leaderboard: LeaderboardEntry[] = [
  {
    teamId: "strawberry-no1",
    name: "草莓天下第一",
    details: "预选已结束 / 复核完成",
    total: "15,200",
    currentMember: "言",
    currentStatus: "FINISHED",
    teamStatus: "FINISHED",
  },
  {
    teamId: "mygo",
    name: "mygo",
    details: "M1 进行中 / 主会场追踪",
    total: "5,680",
    currentMember: "红白、",
    currentStatus: "LIVE",
    teamStatus: "IN_PROGRESS",
  },
  {
    teamId: "tianqi-siqushi",
    name: "天启四区士",
    details: "20:30 待开赛",
    total: "0",
    currentMember: "某大叔速水好",
    currentStatus: "PENDING",
    teamStatus: "PENDING",
  },
  {
    teamId: "siqu-brothers",
    name: "四驱兄弟想队名",
    details: "22:00 待开赛",
    total: "0",
    currentMember: "Aimer",
    currentStatus: "PENDING",
    teamStatus: "PENDING",
  },
  {
    teamId: "feirenzai",
    name: "非人哉",
    details: "轮次待排 / 已提交名单",
    total: "0",
    currentMember: "呃呃啊啊",
    currentStatus: "PENDING",
    teamStatus: "PENDING",
  },
  {
    teamId: "feixing-xuerong",
    name: "飞行雪绒",
    details: "轮次待排 / 已提交名单",
    total: "0",
    currentMember: "幻尘",
    currentStatus: "PENDING",
    teamStatus: "PENDING",
  },
  {
    teamId: "mofa-strategy",
    name: "魔法战略的集成审判",
    details: "轮次待排 / 已提交名单",
    total: "0",
    currentMember: "兔头无权为我授勋",
    currentStatus: "PENDING",
    teamStatus: "PENDING",
  },
];

export const judgeNotices = [
  "本站提供主会场导览与赛程信息，实际观看请前往哔哩哔哩直播间。",
  "总分 = 四人分数和 × 系数。系数初始为 1.0。",
  "每超时 20 分钟，系数 -0.05。",
  "每有一名重复选择的六星干员，系数 -0.1。",
  "商店取钱每超出 1 块，系数 -0.01。",
  "比赛最终结果以系统实时数据加裁判人工核分共同确认。",
];
