# 样式规范设计指南

> 本文档定义了反卷躺平可视化系统的视觉设计规范、配色方案、字体规范和动画标准

## 🎨 设计哲学

### 核心理念
**"舒缓、自然、沉浸"**

- **舒缓**：减少视觉疲劳，营造放松氛围
- **自然**：配色灵感来源于自然元素（森林、海洋、黄昏）
- **沉浸**：深色主题让用户专注于数据探索

### 目标用户
- 追求生活品质的年轻人
- 数字游民和远程工作者
- 对生活压力敏感的城市居民

---

## 🌈 配色方案

### 主色调

```javascript
const primaryColors = {
  // 舒缓绿 - 核心品牌色
  primary: '#5CCEA1',      // 高躺平指数
  primaryLight: '#7DD9B3', // 浅色变体
  primaryDark: '#4AB08A',  // 深色变体
  
  // 暖阳黄 - 强调色
  secondary: '#F6BD16',    // 中等躺平指数
  secondaryLight: '#F8CC4B',
  secondaryDark: '#D4A013',
  
  // 警示红 - 警告色
  accent: '#FF6B6B',       // 低躺平指数
  accentLight: '#FF8E8E',
  accentDark: '#E05A5A',
  
  // 深夜蓝 - 主背景色
  background: '#0A1F3D',   // 主背景
  backgroundLight: '#1A2F4D', // 卡片背景
  backgroundLighter: '#2A3F5D', // 悬停背景
  
  // 中性色
  neutral: {
    900: '#0A0F1A',        // 最深色
    800: '#1A1F2A',
    700: '#2A2F3A',
    600: '#3A3F4A',
    500: '#4A4F5A',        // 中性
    400: '#5A5F6A',
    300: '#7A7F8A',
    200: '#9A9FAA',
    100: '#BABFCA',        // 浅灰
    50: '#EAEFFA',         // 最浅色
  },
  
  // 功能色
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#F5222D',
  info: '#1890FF',
};
```

### 地图专用配色

#### 暗夜主题地图
```javascript
const mapStyle = {
  // 高德地图自定义样式
  style: 'amap://styles/darkblue',
  
  // 城市标记颜色（按躺平指数）
  cityMarker: {
    high: '#5CCEA1',    // 高指数(8-10): 绿色
    medium: '#F6BD16',  // 中等(5-8): 黄色
    low: '#FF6B6B',     // 低指数(0-5): 红色
  },
  
  // 热力图渐变
  heatmap: {
    0.0: '#0A1F3D',     // 透明
    0.3: '#5CCEA1',     // 低热度
    0.5: '#F6BD16',     // 中等热度
    0.7: '#FA8C16',     // 高热度
    1.0: '#FF6B6B',     // 最高热度
  },
  
  // 飞线动画
  flyLine: '#5CCEA1',   // 城市连接线
  
  // 路线规划颜色
  route: {
    train: '#3B82F6',   // 火车: 蓝色
    flight: '#F59E0B',  // 飞机: 橙色
    bus: '#10B981',     // 客车: 绿色
    drive: '#8B5CF6',   // 自驾: 紫色
  },
  
  // 粒子效果
  particle: {
    rain: 'rgba(59, 130, 246, 0.6)',      // 雨滴: 蓝色
    smog: 'rgba(156, 163, 175, 0.6)',    // 雾霾: 灰色
    sunny: 'rgba(246, 189, 22, 0.6)',    // 阳光: 金色
  },
};
```

### 数据可视化配色

#### 图表颜色
```javascript
const chartColors = [
  '#5CCEA1',  // 主色: 舒缓绿
  '#F6BD16',  // 次色: 暖阳黄
  '#3B82F6',  // 辅助: 科技蓝
  '#F59E0B',  // 辅助: 活力橙
  '#8B5CF6',  // 辅助: 神秘紫
  '#10B981',  // 辅助: 自然绿
  '#EF4444',  // 辅助: 警示红
  '#06B6D4',  // 辅助: 清新青
];

// 雷达图
const radarColors = {
  fill: 'rgba(92, 206, 161, 0.3)',  // 填充色(带透明度)
  stroke: '#5CCEA1',                // 边框色
  point: '#F6BD16',                 // 数据点
};

// 柱状图
const barColors = {
  primary: '#5CCEA1',
  secondary: '#F6BD16',
  accent: '#FF6B6B',
};

// 折线图
const lineColors = {
  primary: '#5CCEA1',
  grid: '#2A3F5D',      // 网格线
  axis: '#4A5F7A',      // 坐标轴
};
```

---

## ✍️ 字体规范

### 字体栈

```css
/* 主字体 */
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  
  /* 标题字体 */
  --font-heading: 'Source Han Sans CN', 'Noto Sans CJK', 'PingFang SC', sans-serif;
  
  /* 数据字体（等宽） */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
  
  /* 数字字体 */
  --font-number: 'Inter', 'SF Pro Display', sans-serif;
}
```

### 字体大小

```css
/* 字体大小系统 */
:root {
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
}
```

### 字体应用场景

```css
/* 标题 */
.h1 {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text-primary);
}

.h2 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text-primary);
}

/* 正文 */
.body {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

/* 数据展示 */
.data-large {
  font-family: var(--font-number);
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--color-primary);
}

.data-medium {
  font-family: var(--font-number);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.data-small {
  font-family: var(--font-number);
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* 代码 */
.code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.5;
}

/* 标签 */
.label {
  font-family: var(--font-primary);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}
```

---

## 🎭 动画规范

### 缓动函数

```css
/* 标准缓动 */
:root {
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);  /* Material Design标准 */
  --ease-in: cubic-bezier(0.4, 0.0, 1, 1);
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.4, 1);
  
  /* 弹性缓动 */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* 快速缓动 */
  --ease-fast: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-slow: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### 动画时长

```css
:root {
  /* 微交互 */
  --duration-100: 100ms;  /* 按钮点击 */
  --duration-150: 150ms;  /* 悬停效果 */
  --duration-200: 200ms;  /* 卡片展开 */
  --duration-250: 250ms;  /* 菜单弹出 */
  
  /* 页面级 */
  --duration-300: 300ms;  /* 模态框 */
  --duration-400: 400ms;  /* 页面切换 */
  --duration-500: 500ms;  /* 侧边栏 */
  
  /* 复杂动画 */
  --duration-800: 800ms;  /* 城市飞入 */
  --duration-1000: 1000ms; /* 页面加载 */
  --duration-2000: 2000ms; /* 复杂过渡 */
}
```

### 动画类型

#### 1. 城市标记呼吸动画
```css
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.city-marker {
  animation: breathe 2s ease-in-out infinite;
}

/* 波纹扩散 */
@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

.city-marker::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  animation: ripple 2s ease-out infinite;
}
```

#### 2. 地图飞行动画
```javascript
// 使用高德地图flyTo
map.flyTo({
  center: [lng, lat],
  zoom: 12,
  pitch: 60,
  bearing: 30,
  duration: 2000,  // 2秒
  easing: 'easeInOutCubic'
});
```

#### 3. 数据加载动画
```css
/* 骨架屏 */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-neutral-700) 25%,
    var(--color-neutral-600) 50%,
    var(--color-neutral-700) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

#### 4. 悬停效果
```css
/* 卡片悬停 */
.card {
  transition: all var(--duration-200) var(--ease-out);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* 按钮悬停 */
.button {
  transition: all var(--duration-150) var(--ease-out);
}

.button:hover {
  transform: scale(1.05);
  background: var(--color-primary-light);
}

.button:active {
  transform: scale(0.95);
  transition-duration: var(--duration-100);
}
```

---

## 📱 响应式设计

### 断点系统

```css
:root {
  --breakpoint-sm: 640px;   /* 手机竖屏 */
  --breakpoint-md: 768px;   /* 手机横屏/小平板 */
  --breakpoint-lg: 1024px;  /* 平板/小屏电脑 */
  --breakpoint-xl: 1280px;  /* 标准电脑 */
  --breakpoint-2xl: 1536px; /* 大屏电脑 */
}
```

### 布局适配

```css
/* 移动端优先 */
.container {
  width: 100%;
  padding: 0 1rem;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    max-width: 750px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    max-width: 980px;
    padding: 0 2rem;
  }
}

/* 大屏 */
@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
}
```

### 触摸目标

```css
/* 最小触摸尺寸 */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* 增大移动端触摸区域 */
@media (max-width: 768px) {
  .city-marker {
    min-width: 48px;
    min-height: 48px;
  }
  
  .button {
    padding: 12px 24px;
  }
}
```

---

## 🎪 组件样式规范

### 地图组件

```css
/* 地图容器 */
.map-container {
  width: 100%;
  height: 100vh;
  background: var(--color-background);
}

/* 城市标记 */
.city-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-out);
}

.city-marker:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* 城市详情卡片 */
.city-card {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 380px;
  max-height: 80vh;
  background: var(--color-background-light);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .city-card {
    width: 90%;
    max-width: 380px;
    right: 5%;
    left: 5%;
  }
}
```

### 数据卡片

```css
/* 指标卡片 */
.metric-card {
  background: var(--color-background-light);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-neutral-700);
  transition: all var(--duration-200) var(--ease-out);
}

.metric-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.metric-card .value {
  font-family: var(--font-number);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.metric-card .label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.metric-card .change {
  font-size: var(--text-xs);
  margin-top: 4px;
}

.metric-card .change.positive {
  color: var(--color-success);
}

.metric-card .change.negative {
  color: var(--color-error);
}
```

### 按钮

```css
/* 主要按钮 */
.button-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-out);
}

.button-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.button-primary:active {
  transform: translateY(0);
}

/* 次要按钮 */
.button-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  padding: 12px 24px;
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-out);
}

.button-secondary:hover {
  background: var(--color-primary);
  color: white;
}

/* 幽灵按钮 */
.button-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: 8px 16px;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-out);
}

.button-ghost:hover {
  color: var(--color-primary);
  background: rgba(92, 206, 161, 0.1);
}
```

---

## 📝 使用规范

### CSS变量使用

```css
/* ✅ 正确 */
.card {
  background: var(--color-background-light);
  padding: var(--spacing-4);
}

/* ❌ 错误 */
.card {
  background: #1A2F4D;  /* 硬编码颜色 */
  padding: 16px;        /* 硬编码间距 */
}
```

### 动画使用

```css
/* ✅ 正确 */
.button {
  transition: all var(--duration-150) var(--ease-out);
}

/* ❌ 错误 */
.button {
  transition: all 0.3s ease;  /* 硬编码时长和缓动 */
}
```

### 响应式设计

```css
/* ✅ 正确 */
@media (min-width: 768px) {
  .container {
    max-width: 750px;
  }
}

/* ❌ 错误 */
@media (min-width: 768px) {
  .container {
    width: 750px;  /* 没有使用max-width */
  }
}
```

---

## 🔗 相关资源

### 设计工具
- [Figma](https://www.figma.com/) - UI设计
- [Coolors](https://coolors.co/) - 配色方案生成
- [Font Pair](https://fontpair.co/) - 字体搭配

### 参考网站
- [Material Design](https://material.io/design) - 设计规范
- [Ant Design](https://ant.design/docs/spec/introduce) - 设计语言
- [Tailwind CSS](https://tailwindcss.com/docs) - 实用工具类

### 图标库
- [Heroicons](https://heroicons.com/) - 线性图标
- [Feather Icons](https://feathericons.com/) - 简洁图标
- [Iconify](https://iconify.design/) - 多图标集合

---

*本文档由prd-map-visual.md中的样式章节整理而成*
*最后更新：2025-12-26*
