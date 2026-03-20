# 荆楚歌 #2 — 运维档案

> **项目代号**: `jingchu-song-2-site`  
> **版本**: `0.1.0`  
> **最后更新**: 2026-03-13  
> **负责人**: ──────（请填写）

---

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器 (客户端)                        │
│  React 18 SPA · TailwindCSS · GSAP 动画 · React Router v6   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP
                ┌───────────┴───────────┐
                │ Vite Dev Proxy (:3000) │  ← 开发环境
                │   /api → :8787        │
                └───────────┬───────────┘
                            │
               ┌────────────┴────────────┐
               │  Node.js HTTP API (:8787)│  ← 后端服务
               │  纯 ESM · 零框架依赖     │
               └────────────┬────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   public-content.json  ops-state.json  score-sheets.json
          │                 │                 │
          └─────────────────┴─────────────────┘
                   server/data/ (JSON 文件存储)
```

### 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 前端框架 | React | ^18.3.1 |
| 路由 | React Router DOM | ^6.30.1 |
| 动画引擎 | GSAP + @gsap/react | ^3.14.2 |
| 图标 | Lucide React | ^0.468.0 |
| 样式 | TailwindCSS | ^3.4.17 |
| 构建工具 | Vite | ^5.4.11 |
| 类型 | TypeScript | ^5.7.2 |
| 后端运行时 | Node.js (ESM) | ≥18 (需支持 top-level await) |
| 后端存储 | JSON 文件 | — |

---

## 2. 目录结构

```
ArkProject/
├── index.html                 # SPA 入口
├── package.json               # 依赖与脚本
├── tailwind.config.js         # Tailwind 配置（设计系统）
├── tsconfig.json              # TypeScript 配置
├── postcss.config.js          # PostCSS（Tailwind 集成）
│
├── public/                    # 静态资源（不经 Vite 处理）
│   ├── logo.svg               # 站点 Logo
│   ├── title-bitmap.svg       # 标题位图
│   ├── admin/                 # 后台管理面板静态文件
│   └── contestants/           # 选手头像
│
├── src/                       # 前端源码
│   ├── main.tsx               # React 入口 → GSAP 插件注册
│   ├── App.tsx                # 路由 + 布局
│   ├── styles.css             # 全局样式 + Tailwind 指令
│   ├── components/            # UI 组件（18 个）
│   ├── pages/                 # 页面组件（4 个）
│   │   ├── HomePage.tsx       # 首页
│   │   ├── LivePage.tsx       # 赛事大厅
│   │   ├── TeamsPage.tsx      # 队伍情报
│   │   └── RulesPage.tsx      # 赛事手册
│   ├── content/               # 前端静态内容数据
│   │   ├── types.ts           # 类型定义
│   │   ├── index.ts           # 统一导出
│   │   ├── site.ts            # 基本信息
│   │   ├── live.ts            # 直播配置
│   │   ├── matches.ts         # 比赛数据
│   │   ├── teams.ts           # 队伍数据
│   │   └── rules.ts           # 规则文本
│   ├── context/               # React Context
│   │   └── SiteDataContext.tsx # 全局数据提供
│   └── lib/                   # 工具库
│       ├── logo.ts            # Logo 路径常量
│       ├── motion.ts          # 动画偏好检测
│       └── useParallaxLogo.ts # 视差 Logo Hook
│
├── server/                    # 后端源码
│   ├── index.mjs              # 服务器启动入口
│   ├── app/
│   │   ├── config.mjs         # 环境配置解析
│   │   ├── create-server.mjs  # HTTP 服务器 + 路由注册
│   │   ├── http.mjs           # HTTP 工具（CORS、路由、认证）
│   │   ├── service.mjs        # 业务服务层
│   │   ├── domain.mjs         # 领域逻辑（927行核心）
│   │   ├── scoring.mjs        # 三主题计分引擎
│   │   ├── validators.mjs     # API 输入验证器
│   │   ├── json-file-store.mjs# 原子性 JSON 文件存储
│   │   └── *.test.mjs         # 测试文件（3 个）
│   └── data/                  # 运行时数据（⚠️ 需备份）
│       ├── public-content.json# 公开内容 (~43KB)
│       ├── ops-state.json     # 运维状态 (~2KB)
│       └── score-sheets.json  # 计分表 (动态)
│
└── scripts/                   # 脚本工具
    ├── dev.mjs                # Vite 开发服务器（含 API 代理）
    ├── dev-all.mjs            # 前后端同时启动
    └── export-content.mjs     # 从 src/content → server/data
```

---

## 3. 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `API_HOST` | `127.0.0.1` | 后端监听地址 |
| `API_PORT` | `8787` | 后端监听端口 |
| `API_BODY_LIMIT_BYTES` | `1048576` (1MB) | 请求体大小限制 |
| `API_CORS_ORIGINS` | `""` (空 = 拒绝跨域) | 允许的源，逗号分隔。`*` 为全部放行 |
| `ADMIN_TOKEN` | `""` (空 = 管理接口无需认证) | 管理 API 认证 Token |

> ⚠️ **生产环境必须设置**: `ADMIN_TOKEN`（非空值）和 `API_CORS_ORIGINS`

---

## 4. 命令速查

### 日常操作

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器 (:3000)，自动代理 `/api` 到 `:8787` |
| `npm run api` | 单独启动后端 API 服务器 (:8787) |
| `npm run dev:all` | **一键启动**前端 + 后端（推荐开发用） |
| `npm run build` | TypeScript 检查 + Vite 生产构建 → `dist/` |
| `npm run preview` | 预览生产构建结果 |
| `npm run sync:content` | 将 `src/content/` 的数据导出到 `server/data/public-content.json` |

### 测试

```bash
# 运行全部后端测试（17 个）
node --test server/app/scoring.test.mjs server/app/service.test.mjs server/app/rules-content.test.mjs

# 运行单个测试文件
node --test server/app/scoring.test.mjs
```

### 类型检查

```bash
npx tsc --noEmit
```

---

## 5. API 接口清单

### 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查（返回 `{ok: true, time}`) |
| `GET` | `/api/public/bootstrap` | 前端初始化数据（所有公开内容） |
| `GET` | `/api/public/rule-config` | 规则版本 + 赛制配置 |

### 管理接口（需 `X-Admin-Token` 或 `Authorization: Bearer <token>`）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/admin/ops/bootstrap` | 管理端完整数据引导 |
| `GET` | `/api/admin/calculator/bootstrap` | 计算器专用数据引导 |
| `GET` | `/api/admin/public-content` | 获取全部公开内容 |
| `PUT` | `/api/admin/public-content` | **整体替换**公开内容 |
| `PATCH` | `/api/admin/live-broadcast` | 更新直播信息 |
| `PATCH` | `/api/admin/matches/:matchId` | 更新单场比赛 |
| `GET` | `/api/admin/teams/:teamId/compliance` | 获取队伍合规状态 |
| `PATCH` | `/api/admin/teams/:teamId/compliance` | 更新合规信息 |
| `GET` | `/api/admin/teams/:teamId/aggregate` | 获取队伍聚合数据 |
| `POST` | `/api/admin/teams/:teamId/publish` | 发布队伍成绩 |
| `GET` | `/api/admin/score-sheets` | 查询计分表 (支持 `?teamId&memberId&theme&status&matchId`) |
| `POST` | `/api/admin/score-sheets/upsert` | 创建/更新计分表（服务端重算分数） |
| `PATCH` | `/api/admin/score-sheets/:sheetId/status` | 更新计分表状态 |
| `POST` | `/api/admin/teams/:teamId/operators` | 添加干员选择记录 |
| `DELETE` | `/api/admin/teams/:teamId/operators/:recordId` | 删除干员选择记录 |
| `POST` | `/api/admin/teams/:teamId/calls` | 添加教练电话记录 |
| `DELETE` | `/api/admin/teams/:teamId/calls/:recordId` | 删除教练电话记录 |

---

## 6. 数据文件说明

### `server/data/public-content.json`（~43KB）

前端所有展示数据的唯一来源：

| 字段 | 内容 |
|------|------|
| `siteMeta` | 赛事元信息（名称、日期、地点、奖池） |
| `liveBroadcast` | 直播状态和链接 |
| `matches[]` | 各场比赛详情和成员状态 |
| `eventSchedule[]` | 赛程表（按日/时段） |
| `leaderboard[]` | 排行榜 |
| `teams[]` | 队伍信息（含成员、雷达图数据) |
| `ruleSections[]` | 规则章节 |
| `themeRules[]` | 三主题计分规则 |

### `server/data/ops-state.json`（~2KB）

运维状态，按队伍存储：

| 字段 | 内容 |
|------|------|
| `complianceByTeam` | 各队合规记录（压力位、源石锭、超时、干员选择、教练电话） |

### `server/data/score-sheets.json`

计分表存储，包含各选手的快照、预览分数、公式、审核状态。

> ⚠️ **这三个文件是整个系统的持久化数据，必须定期备份。**

---

## 7. 数据流

### 前端初始化

```
SiteDataContext 挂载
  → fetch("/api/public/bootstrap")
    → 成功 → 使用 API 数据
    → 失败 → 回退到 src/content/ 静态数据（离线模式）
```

### 内容更新流程

```
编辑 src/content/ 静态数据
  → npm run sync:content
    → 将 TypeScript 内容编译导出到 server/data/public-content.json
      → 后端 API 自动提供最新数据
```

### 管理端录分流程

```
管理员提交计分快照
  → POST /api/admin/score-sheets/upsert
    → 服务端忽略客户端 previewScore（防篡改）
    → 根据 theme 调用 calculateThemeScore(snapshot) 重算
    → 存入 score-sheets.json
      → 返回实际分数 + 团队聚合数据
```

### 成绩发布流程

```
POST /api/admin/teams/:teamId/publish
  → 检查合规（压力位、人数、教练电话限制）
  → 检查所有成员计分表为 final
  → 将 final 状态改为 published
  → 重算所有队伍聚合 → 更新排名
  → 写入 public-content.json（前端自动刷新）
```

---

## 8. 赛制规则参数

以下参数硬编码于 `server/app/domain.mjs`，修改后需重启后端：

```javascript
{
  roster: {
    teamSize: 4,                // 每队人数
    requiredPressureRoleCount: 1,// 压力位数量
    totalBattleHours: 14,       // 总比赛时长
  },
  sharedIngots: {
    maxNetSpend: 200,           // 共享源石锭最大净支出
  },
  coachCalls: {
    maxCount: 3,                // 教练电话最大次数
    maxMinutesPerCall: 3,       // 单次最大时长（分钟）
  },
  uniqueSixStars: {
    enabled: true,              // 六星干员唯一性检查
    excludeTemporaryRecruit: true,// 临时招募豁免
  },
  coefficientTracking: {
    initialValue: 1,            // 系数初始值
    overtimeStepMinutes: 20,    // 超时惩罚步长（分钟）
    overtimePenaltyPerStep: 0.05,// 每步超时惩罚
    duplicateSixStarPenalty: 0.1,// 重复六星惩罚
    extraShopSpendPenalty: 0.01, // 超额购物惩罚（每源石锭）
  },
}
```

### 总分计算公式

```
团队总分 = (四人基础分之和 + 压力位加成) × 系数

压力位加成 = 压力位选手基础分 × 0.2
系数 = 1 - 超时惩罚 - 重复六星惩罚 - 超额购物惩罚
```

### 三主题计分

| 主题 | 代号 | 标识符 | 最终乘数 |
|------|------|--------|----------|
| 探索者的银淞止境 | Sami | `sami` | ×1.0 |
| 萨卡兹的无终奇语 | Sarkaz | `sarkaz` | ×0.75 |
| 岁的界园志异 | Sui | `sui` | ×0.4~0.64（动态） |

---

## 9. 部署指南

### 生产构建

```bash
# 1. 安装依赖
npm ci

# 2. 构建前端
npm run build
# 产出 dist/ 目录

# 3. 同步内容（如果在前端编辑了 src/content/）
npm run sync:content
```

### 启动后端

```bash
# 设置环境变量
export ADMIN_TOKEN="your-secret-token"
export API_CORS_ORIGINS="https://your-domain.com"
export API_HOST="0.0.0.0"
export API_PORT="8787"

# 启动
node server/index.mjs
```

### 前端部署

`dist/` 是纯静态 SPA，部署到任意静态服务器或 CDN 即可。需配置：

1. **所有路由重写到 `index.html`**（SPA 路由需要）
2. **API 代理**: 将 `/api/*` 代理到后端地址

#### Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /srv/ark-site/dist;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 10. 备份与恢复

### 需要备份的文件

| 文件 | 重要性 | 频率 |
|------|--------|------|
| `server/data/public-content.json` | 🟡 中 | 内容变更后 |
| `server/data/ops-state.json` | 🔴 高 | 每小时 |
| `server/data/score-sheets.json` | 🔴 高 | 每次录分后 |

### 备份命令

```bash
# 手动备份（在服务器上执行）
cp -r /var/www/arkproject/current/server/data/ /var/www/arkproject/backup/data-$(date +%Y%m%d-%H%M%S)/
```

### 设置自动备份（cron）

```bash
# 编辑 crontab
crontab -e

# 添加以下行：每30分钟备份一次，保留48个快照（滚动覆盖）
*/30 * * * * cp -r /var/www/arkproject/current/server/data/ /var/www/arkproject/backup/data-$(date +\%H\%M)/ 2>/dev/null
```

> 💡 建议赛前在服务器上配置好 cron，赛后再清理历史快照。

### 恢复

```bash
# 停止服务
# 替换 server/data/ 中的文件
# 重启服务
node server/index.mjs
```

> `public-content.json` 也可以通过 `npm run sync:content` 从前端源码重新生成。

---

## 11. 故障排查

### 前端不显示数据

1. 检查 API 是否运行: `curl http://127.0.0.1:8787/api/health`
2. 检查 CORS 配置: `API_CORS_ORIGINS` 是否包含前端域名
3. 前端有离线回退: 即使 API 不可用，仍会使用 `src/content/` 静态数据

### 管理接口 401

1. 检查 `ADMIN_TOKEN` 环境变量是否设置
2. 请求时需携带: `X-Admin-Token: <token>` 或 `Authorization: Bearer <token>`
3. ⚠️ `ADMIN_TOKEN` 为空时，服务会**拒绝启动**（`process.exit(1)`），请确保 env 文件中已填写

### 计分不正确

1. 服务端会根据 `snapshot` 重新计算，忽略客户端传入的 `previewScore`
2. 检查 `scoring.mjs` 中对应主题的计算逻辑
3. 运行计分测试验证: `node --test server/app/scoring.test.mjs`

### 发布失败 (Team is not ready to publish)

检查 `publishBlockingIssues`（通过 GET aggregate 接口查看）:
- "Pressure role is not assigned." → 未分配压力位
- "Roster is short by N member(s)." → 队伍人数不对
- "Coach call count exceeds the rule limit." → 教练电话超 3 次
- "At least one coach call exceeds the per-call duration limit." → 单次通话超 3 分钟

### 数据文件损坏

1. 从备份恢复，或
2. 使用 `npm run sync:content` 重新生成 `public-content.json`
3. `ops-state.json` 和 `score-sheets.json` 开机时会自动初始化（如果不存在）

---

## 12. 安全注意事项

| 事项 | 说明 |
|------|------|
| 🔑 Admin Token | **必须设置非空值**，否则服务拒绝启动。生成示例：`openssl rand -hex 32` |
| 🌐 CORS | 不要在生产环境使用 `*`，明确指定允许的域名（如 `https://yourdomain.com`） |
| 💾 数据文件 | `server/data/` 已通过 `.gitignore` 排除，不会提交到 Git，但需手动定期备份 |
| 🔒 HTTPS | 生产环境必须启用 HTTPS（在 nginx 反向代理层配置 SSL） |
| 📝 错误信息 | 500 错误目前会返回内部错误信息（低危，赛后如有需要可改为通用提示） |
| 🔐 Token 比较 | 当前使用 `!==` 字符串比较（理论时序攻击风险极低，小型赛事可接受） |

---

## 13. 设计系统速查

### 色板

| Token | 色值 | 用途 |
|-------|------|------|
| `canvas` | `#070809` | 页面背景 |
| `surface1` | `#111317` | 一级面板 |
| `surface2` | `#171b20` | 二级面板 |
| `surface3` | `#20252d` | 三级面板 |
| `brand` | `#d6c08a` | 品牌金色 |
| `brandStrong` | `#e7d7ad` | 强调金色 |
| `text1` | `#f4efe5` | 主要文字 |
| `text2` | `#b9b2a6` | 次要文字 |
| `text3` | `#7c766b` | 辅助文字 |
| `live` | `#c75b47` | 直播红 |

### 字体

| Token | 字族 | 用途 |
|-------|------|------|
| `font-title` | Noto Serif SC | 标题 |
| `font-display` | Rajdhani | 数据展示 |
| `font-sans` | Noto Sans SC | 正文 |

---

## 14. 前端组件索引

| 组件 | 文件 | 用途 |
|------|------|------|
| `ClipButton` | `ClipButton.tsx` | 主按钮（支持涟漪效果） |
| `CountUp` | `CountUp.tsx` | 数字动画计数器 |
| `EventScheduleBoard` | `EventScheduleBoard.tsx` | 赛程表 |
| `FullPageLoader` | `FullPageLoader.tsx` | 全页加载骨架屏 |
| `GSAPRouterTransition` | `GSAPRouterTransition.tsx` | 页面路由过渡动画 |
| `LiveHeroCard` | `LiveHeroCard.tsx` | 直播页主卡片 |
| `MagneticWrapper` | `MagneticWrapper.tsx` | 磁性跟随效果容器 |
| `MobileMenu` | `MobileMenu.tsx` | 移动端菜单 |
| `PageBackground` | `PageBackground.tsx` | 共享视差背景装饰 |
| `PageFrame` | `PageFrame.tsx` | 页面内容框架 |
| `ParallelStatusCard` | `ParallelStatusCard.tsx` | 成员状态卡片 |
| `RadarChart` | `RadarChart.tsx` | SVG 雷达图 |
| `ScheduleBoard` | `ScheduleBoard.tsx` | 比赛日程展示 |
| `ScrollReveal` | `ScrollReveal.tsx` | 滚动渐入动画 |
| `SectionHeader` | `SectionHeader.tsx` | 章节标题组件 |
| `SpatialNavbar` | `SpatialNavbar.tsx` | 主导航栏 |
| `SpotlightCard` | `SpotlightCard.tsx` | 聚光灯卡片 |
| `SubNav` | `SubNav.tsx` | 页内子导航 |
| `TeamLeaderboard` | `TeamLeaderboard.tsx` | 队伍排行榜 |

---

## 15. 联系方式

| 角色 | 联系方式 |
|------|----------|
| 技术负责人 | ——（请填写） |
| 裁判组 | ——（请填写） |
| 内容编辑 | ——（请填写） |

---

*本文档应与项目代码同步更新。如有架构变更，请及时修订。*
