# 设计系统主文件

> **逻辑说明：** 构建具体页面时，请先查阅 `design-system/pages/[页面名称].md`。
> 若该文件存在，其规则**优先于**本主文件。
> 若不存在，则严格遵循以下规则。

---

**项目：** Ark Tournament Admin（方舟赛事管理后台）
**生成时间：** 2026-03-15 19:02:35
**分类：** 数据仪表盘

---

## 全局规则

### 色彩方案

| 角色 | 十六进制 | CSS 变量 |
|------|----------|----------|
| 主色 | `#1E40AF` | `--color-primary` |
| 辅色 | `#3B82F6` | `--color-secondary` |
| 强调/行动色 | `#F59E0B` | `--color-cta` |
| 背景色 | `#F8FAFC` | `--color-background` |
| 文字色 | `#1E3A8A` | `--color-text` |

**色彩说明：** 蓝色数据 + 琥珀色高亮

### 字体排版

- **标题字体：** Fira Code
- **正文字体：** Fira Sans
- **风格关键词：** 仪表盘、数据、分析、代码、技术感、精准
- **Google Fonts：** [Fira Code + Fira Sans](https://fonts.google.com/share?selection.family=Fira+Code:wght@400;500;600;700|Fira+Sans:wght@300;400;500;600;700)

**CSS 引入：**
```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
```

### 间距变量

| Token | 值 | 用途 |
|-------|----|------|
| `--space-xs` | `4px` / `0.25rem` | 紧凑间隙 |
| `--space-sm` | `8px` / `0.5rem` | 图标间距、行内间距 |
| `--space-md` | `16px` / `1rem` | 标准内边距 |
| `--space-lg` | `24px` / `1.5rem` | 区块内边距 |
| `--space-xl` | `32px` / `2rem` | 大间距 |
| `--space-2xl` | `48px` / `3rem` | 区块外边距 |
| `--space-3xl` | `64px` / `4rem` | 主视觉区内边距 |

### 阴影层级

| 层级 | 值 | 用途 |
|------|----|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 轻微浮起 |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | 卡片、按钮 |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | 弹窗、下拉菜单 |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | 主视觉图、特色卡片 |

---

## 组件规范

### 按钮

```css
/* 主按钮 */
.btn-primary {
  background: #F59E0B;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 次级按钮 */
.btn-secondary {
  background: transparent;
  color: #1E40AF;
  border: 2px solid #1E40AF;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### 卡片

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### 输入框

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #1E40AF;
  outline: none;
  box-shadow: 0 0 0 3px #1E40AF20;
}
```

### 弹窗

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## 风格指南

**风格：** 深色模式（OLED）

**关键词：** 深色主题、低亮度、高对比度、纯黑、午夜蓝、护眼、OLED、夜间模式、省电

**适用场景：** 夜间模式应用、编程平台、娱乐类、防眼疲劳、OLED 设备、低光环境

**核心效果：** 极简发光（text-shadow: 0 0 10px）、暗到亮过渡、低白光发射、高可读性、可见焦点状态

### 页面布局模式

**模式名称：** 横向滚动旅程

- **转化策略：** 沉浸式产品探索，高参与度，保持导航可见。
- **CTA 位置：** 悬浮固定 CTA 或横向轨道末端
- **区块顺序：** 1. 引言（纵向）、2. 旅程（横向轨道）、3. 细节展示、4. 纵向页脚

---

## 反模式（禁止使用）

- ❌ 默认浅色模式
- ❌ 渲染缓慢

### 额外禁止模式

- ❌ **用 Emoji 代替图标** — 使用 SVG 图标（Heroicons、Lucide、Simple Icons）
- ❌ **缺少 cursor:pointer** — 所有可点击元素必须设置 cursor:pointer
- ❌ **悬停时布局偏移** — 避免导致布局偏移的缩放变换
- ❌ **低对比度文字** — 最低对比度比值 4.5:1
- ❌ **状态瞬间切换** — 始终使用过渡动画（150-300ms）
- ❌ **不可见焦点状态** — 焦点状态必须可见以满足无障碍要求

---

## 交付前检查清单

交付任何 UI 代码前，请确认：

- [ ] 未使用 Emoji 作为图标（改用 SVG）
- [ ] 所有图标来自统一图标集（Heroicons/Lucide）
- [ ] 所有可点击元素设置了 `cursor-pointer`
- [ ] 悬停状态有平滑过渡（150-300ms）
- [ ] 浅色模式：文字对比度最低 4.5:1
- [ ] 焦点状态对键盘导航可见
- [ ] 遵守 `prefers-reduced-motion`
- [ ] 响应式适配：375px、768px、1024px、1440px
- [ ] 内容不被固定导航栏遮挡
- [ ] 移动端无横向滚动
