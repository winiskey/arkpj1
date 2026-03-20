import type { LeaderboardEntry, Match, ScheduleDay } from "./types";

export const matches: Match[] = [
  {
    id: "M1",
    phase: "ROUND 1",
    startTime: "",
    status: "FINISHED",
    teamId: "mygo",
    totalScore: "8275.7",
    members: [
      { id: "P1", name: "吃豆腐蘸酱", theme: "探索者的银凇止境", score: 3725, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "雪月花", theme: "萨卡兹的无终奇语", score: 3845.7, multiplier: 1, status: "FINISHED", queueOrder: 2 },
      { id: "P3", name: "红白白", theme: "萨卡兹的无终奇语", score: 705, multiplier: 1, status: "FINISHED", queueOrder: 3 },
      { id: "P4", name: "若亭", theme: "岁的界园志异", score: 0, multiplier: 1, status: "FINISHED", queueOrder: 4 },
    ],
  },
  {
    id: "M2",
    phase: "ROUND 1",
    startTime: "",
    status: "FINISHED",
    teamId: "tianqi-siqushi",
    totalScore: "9595.3",
    members: [
      { id: "P1", name: "某大叔速水好", theme: "探索者的银凇止境", score: 2375, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "拾壹月的鹤主", theme: "萨卡兹的无终奇语", score: 3137.25, multiplier: 1, status: "FINISHED", queueOrder: 2 },
      { id: "P3", name: "忍野忍不下去", theme: "萨卡兹的无终奇语", score: 0, multiplier: 1, status: "FINISHED", queueOrder: 3 },
      { id: "P4", name: "起步之志", theme: "岁的界园志异", score: 4083.072, multiplier: 1, status: "FINISHED", queueOrder: 4 },
    ],
    playersList: ["某大叔速水好", "起步之志", "忍野忍不下去", "拾壹月的鹤主"],
  },
  {
    id: "M3",
    phase: "ROUND 1",
    startTime: "",
    status: "FINISHED",
    teamId: "siqu-brothers",
    totalScore: "5040.9",
    members: [
      { id: "P1", name: "朝霞", theme: "探索者的银凇止境", score: 3254, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "Aimer", theme: "萨卡兹的无终奇语", score: 0, multiplier: 1, status: "FINISHED", queueOrder: 2 },
      { id: "P3", name: "洛齐克", theme: "萨卡兹的无终奇语", score: 158.25, multiplier: 1, status: "FINISHED", queueOrder: 3 },
      { id: "P4", name: "顾秦", theme: "岁的界园志异", score: 1628.64, multiplier: 1, status: "FINISHED", queueOrder: 4 },
    ],
    playersList: ["Aimer", "朝霞", "洛齐克", "顾秦"],
  },
  {
    id: "M4",
    phase: "ROUND 1",
    startTime: "",
    status: "FINISHED",
    teamId: "strawberry-no1",
    totalScore: "12692.0",
    members: [
      { id: "P1", name: "浪淘沙尽天涯", theme: "探索者的银凇止境", score: 3653, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "言", theme: "萨卡兹的无终奇语", score: 1821.75, multiplier: 1, status: "FINISHED", queueOrder: 2 },
      { id: "P3", name: "糖该葡萄糖", theme: "萨卡兹的无终奇语", score: 3233.25, multiplier: 1, status: "FINISHED", queueOrder: 3 },
      { id: "P4", name: "归零", theme: "岁的界园志异", score: 3983.952, multiplier: 1, status: "FINISHED", queueOrder: 4 },
    ],
    playersList: ["归零", "浪淘沙尽天涯", "糖该葡萄糖", "言"],
  },
  {
    id: "M5",
    phase: "ROUND 1",
    startTime: "",
    status: "FINISHED",
    teamId: "feirenzai",
    totalScore: "9186.7",
    members: [
      { id: "P1", name: "last要楽奈丶", theme: "探索者的银凇止境", score: 3123, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "呃呃啊啊", theme: "萨卡兹的无终奇语", score: 2718, multiplier: 1, status: "FINISHED", queueOrder: 2 },
      { id: "P3", name: "海嗣", theme: "萨卡兹的无终奇语", score: 0, multiplier: 1, status: "FINISHED", queueOrder: 3 },
      { id: "P4", name: "圣人又土", theme: "岁的界园志异", score: 3345.72, multiplier: 1, status: "FINISHED", queueOrder: 4 },
    ],
    playersList: ["呃呃啊啊", "last要楽奈丶", "圣人又土", "海嗣"],
  },
  {
    id: "M6",
    phase: "ROUND 1",
    startTime: "",
    status: "FINISHED",
    teamId: "feixing-xuerong",
    totalScore: "7862.0",
    members: [
      { id: "P1", name: "幻尘", theme: "探索者的银凇止境", score: 4105.2, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "快晴", theme: "萨卡兹的无终奇语", score: 871.5, multiplier: 1, status: "FINISHED", queueOrder: 2 },
      { id: "P3", name: "魔法蜘蛛", theme: "萨卡兹的无终奇语", score: 2885.25, multiplier: 1, status: "FINISHED", queueOrder: 3 },
      { id: "P4", name: "白身鱼", theme: "岁的界园志异", score: 0, multiplier: 1, status: "FINISHED", queueOrder: 4 },
    ],
    playersList: ["幻尘", "快晴", "白身鱼", "魔法蜘蛛"],
  },
  {
    id: "M7",
    phase: "ROUND 1",
    startTime: "",
    status: "FINISHED",
    teamId: "mofa-strategy",
    totalScore: "6122.4",
    members: [
      { id: "P1", name: "兔头无权为我授勋", theme: "探索者的银凇止境", score: 689, multiplier: 1, status: "FINISHED", queueOrder: 1 },
      { id: "P2", name: "酱香企鹅", theme: "萨卡兹的无终奇语", score: 249, multiplier: 1, status: "FINISHED", queueOrder: 2 },
      { id: "P3", name: "淮南牛肉汤", theme: "萨卡兹的无终奇语", score: 1368.75, multiplier: 1, status: "FINISHED", queueOrder: 3 },
      { id: "P4", name: "布兰卡", theme: "岁的界园志异", score: 3815.616, multiplier: 1, status: "FINISHED", queueOrder: 4 },
    ],
    playersList: ["兔头无权为我授勋", "布兰卡", "淮南牛肉汤", "酱香企鹅"],
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
      { period: "早", time: "9:00", player: "兔头无权为我授勋" },
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
    details: "轮次待排 / 已提交名单",
    total: "12691.952000000001",
    currentStatus: "FINISHED",
    teamStatus: "FINISHED",
  },
  {
    teamId: "mygo",
    name: "mygo",
    details: "轮次待排 / 已提交名单",
    total: "8275.7",
    currentStatus: "FINISHED",
    teamStatus: "FINISHED",
  },
  {
    teamId: "tianqi-siqushi",
    name: "天启四区士",
    details: "轮次待排 / 已提交名单",
    total: "9595.322",
    currentStatus: "FINISHED",
    teamStatus: "FINISHED",
  },
  {
    teamId: "siqu-brothers",
    name: "四驱兄弟想队名",
    details: "轮次待排 / 已提交名单",
    total: "5040.89",
    currentStatus: "FINISHED",
    teamStatus: "FINISHED",
  },
  {
    teamId: "feirenzai",
    name: "非人哉",
    details: "轮次待排 / 已提交名单",
    total: "9186.72",
    currentStatus: "FINISHED",
    teamStatus: "FINISHED",
  },
  {
    teamId: "feixing-xuerong",
    name: "飞行雪绒",
    details: "轮次待排 / 已提交名单",
    total: "7861.95",
    currentStatus: "FINISHED",
    teamStatus: "FINISHED",
  },
  {
    teamId: "mofa-strategy",
    name: "魔法战略的集成审判",
    details: "轮次待排 / 已提交名单",
    total: "6122.366",
    currentStatus: "FINISHED",
    teamStatus: "FINISHED",
  },
];

export const judgeNotices = [
  "本站提供主会场导览与赛程信息，实际观看请前往哔哩哔哩直播间。",
  "总分 = 四人分数和 × 系数。系数初始为 1.0。",
  "每超时 20 分钟，系数 -0.05。",
  "每有一名重复招募的六星干员，系数 -0.1。",
  "商店取钱每超出 1 源石锭，系数 -0.01。",
  "比赛最终结果以系统实时数据加裁判人工核分共同确认。",
];
