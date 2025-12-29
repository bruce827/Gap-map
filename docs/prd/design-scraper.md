# 爬虫架构设计规范

> 本文档整合了反卷躺平可视化系统的所有爬虫技术方案，包括架构设计、实现细节和最佳实践

## 🎯 爬虫技术选型

### 核心技术栈

#### 1. Playwright ✅ 强烈推荐
**选择理由**：
- ✅ **现代化**：支持最新浏览器（Chrome、Firefox、WebKit）
- ✅ **反反爬能力强**：内置反检测机制
- ✅ **多语言支持**：Node.js、Python、Java、C#
- ✅ **截图功能**：完美配合AI识别方案
- ✅ **社区活跃**：微软维护，文档完善

**与其他工具对比**：
| 特性 | Playwright | Puppeteer | Selenium |
|------|-----------|----------|---------|
| 反反爬能力 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 截图功能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| API设计 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 学习曲线 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

#### 2. AI识别方案 ✨ 创新推荐
**截图+AI识别**：
- ✅ **绕过反爬**：截图而非解析HTML，难以被检测
- ✅ **处理复杂页面**：无需解析JavaScript渲染内容
- ✅ **成本低廉**：AI API费用约$2-5/月
- ✅ **维护简单**：无需频繁更新选择器

---

## 🏗️ 爬虫架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    反卷躺平系统爬虫架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────┐  │
│  │  前端界面    │  │  后端API     │  │        爬虫服务              │  │
│  │  (SvelteKit) │  │  (Express)    │  │      (Playwright)           │  │
│  └─────┬───────┘  └─────┬────────┘  └─────────┬─────────────────────┘  │
│        │              │                │             │  │
│   ┌────▼────┐   ┌──────▼──────┐   ┌───────▼───────┐  │
│   │ 手动触发  │   │   定时任务   │   │   AI识别服务   │  │
│   └──────────┘   └──────────────┘   └────────────────┘  │
│        │              │                │             │  │
│   ┌──────▼────┐   ┌──────▼──────┐   ┌───────▼──────┐  │
│   │  爬虫管理  │   │  │  数据库     │  │   │  缓存     │  │
│   └──────────┘   │  │  (PostgreSQL) │  │   │ (Redis)   │  │
│        │              │                │             │  │
│   ┌──────▼────┐   ┌──────▼──────┐   ┌───────▼──────┐  │
│   │  日志系统  │   │  │  监控告警   │  │  │ 代理池     │  │
│   └──────────┘   │  │  │ (Sentry)    │  │  │ (可选)    │  │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
project-root/
├── src/
│   └── routes/api/
│       └── scraper/
│           +page.svelte      # 爬虫管理界面
│           +page.svelte      # 爬虫日志
│
├── scripts/                    # 爬虫脚本目录
│   ├── index.js               # 爬虫主入口
│   ├── config.js              # 配置文件
│   ├── utils.js               # 工具函数
│   │
│   ├── weather.js              # 天气爬虫
│   ├── housing.js              # 房价爬虫
│   ├── xiaohongshu.js          # 小红书爬虫
│   ├── weibo.js                # 微博爬虫
│   ├── news.js                 # 新闻爬虫
│   └── ai-scraper.js           # AI识别爬虫
│
│   ├── screenshots/            # 爬虫截图存储
│   │   ├── xiaohongshu/
│   │   ├── weibo/
│   │   └── housing/
│   │
│   └── logs/                  # 爬虫日志
│       ├── scraper.log
│       └── error.log
│
├── lib/
│   ├── scraper.js              # 爬虫核心库
│   ├── ai-recognizer.js         # AI识别服务
│   ├── proxy-manager.js         # 代理管理
│   └── scheduler.js            # 定时任务
│
└── prisma/schema.prisma         # 数据库模型
```

---

## 🔧 核心爬虫实现

### 1. 基础爬虫框架

```javascript
// scripts/utils.js
import { chromium } from 'playwright';
import { config } from './config';

/**
 * 创建浏览器实例
 */
export async function createBrowser() {
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--user-agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: config.userAgent,
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();
  
  // 设置请求拦截
  await page.route('**/*.{png,jpg,jpeg,gif,svg,css,js,font}', route => route.abort());
  
  return { browser, context, page };
}

/**
 * 安全关闭浏览器
 */
export async function closeBrowser(browser, context) {
  if (context) await context.close();
  if (browser) await browser.close();
}

/**
 * 随机延迟
 */
export function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 记录爬虫日志
 */
export async function logScraperEvent(scraperName, status, details = {}) {
  const logData = {
    scraper_name: scraperName,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  
  console.log(`[${scraperName}] ${status}:`, details);
  
  // 存储到数据库
  try {
    await fetch('/api/scraper/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
  } catch (error) {
    console.error('Failed to log scraper event:', error);
  }
}
```

### 2. AI识别爬虫框架

```javascript
// scripts/ai-recognizer.js
import { config } from './config';

/**
 * AI识别服务
 */
class AIRecognizer {
  constructor() {
    this.apiKey = config.aiApiKey;
    this.cache = new Map(); // 24小时缓存
  }

  /**
   * 识别图片中的文本
   */
  async recognizeImage(imageBuffer, prompt) {
    const cacheKey = this.generateCacheKey(imageBuffer, prompt);
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return cached.result;
      }
    }

    try {
      // 转换为base64
      const base64 = imageBuffer.toString('base64');
      
      // 调用AI API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: base64
                  }
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const result = data.content[0].text;
      
      // 缓存结果
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
      
    } catch (error) {
      console.error('AI recognition failed:', error);
      throw new Error(`AI识别失败: ${error.message}`);
    }
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(imageBuffer, prompt) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    hash.update(imageBuffer);
    hash.update(prompt);
    return hash.digest('hex');
  }
}

export const aiRecognizer = new AIRecognizer();
```

### 3. 小红书爬虫实现

```javascript
// scripts/xiaohongshu.js
import { createBrowser, closeBrowser, randomDelay, logScraperEvent } from './utils.js';
import { aiRecognizer } from './ai-recognizer.js';

/**
 * 小红书笔记爬虫
 */
export async function scrapeXiaohongshu(cityName, limit = 20) {
  const scraperName = 'xiaohongshu';
  let browser, context, page;
  
  try {
    // 记录开始
    await logScraperEvent(scraperName, 'running', {
      city: cityName,
      limit
    });

    // 创建浏览器
    ({ browser, context, page } = await createBrowser());
    
    // 访问小红书搜索页面
    const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(cityName)}生活`;
    await page.goto(searchUrl);
    
    // 等待搜索结果加载
    await page.waitForSelector('.note-item', { timeout: 10000 });
    
    // 获取笔记列表
    const notes = await page.$$('.note-item');
    const results = [];
    
    for (let i = 0; i < Math.min(notes.length, limit); i++) {
      try {
        const note = notes[i];
        
        // 提取基本信息
        const title = await note.$eval(el => el.querySelector('.title').innerText);
        const likes = await note.$eval(el => {
          const likesEl = el.querySelector('.likes');
          return likesEl ? parseInt(likesEl.innerText) : 0;
        });
        const author = await note.$eval(el => {
          const authorEl = el.querySelector('.author-name');
          return authorEl ? authorEl.innerText.trim() : '';
        });
        
        // 截图
        const screenshot = await note.screenshot({
          path: `./screenshots/xiaohongshu/${cityName}_${i}.png`
        });
        
        // AI识别详细信息
        const aiPrompt = `
          请从这个小红书笔记截图中提取以下信息：
          1. 笔记标题（如果有）
          2. 作者名称
          3. 点赞数
          4. 简短内容摘要（前100字）
          5. 标签（如果有）
          
          请以JSON格式返回，字段包括：title, author, likes, content, tags
        `;
        
        const imageBuffer = await screenshot.screenshot();
        const aiResult = await aiRecognizer.recognizeImage(imageBuffer, aiPrompt);
        
        let extraInfo = {};
        try {
          extraInfo = JSON.parse(aiResult);
        } catch (error) {
          console.warn('AI解析失败，使用基础信息');
        }
        
        results.push({
          city: cityName,
          platform: 'xiaohongshu',
          title: title,
          likes: likes,
          author: author,
          content: extraInfo.content || '',
          tags: extraInfo.tags || [],
          screenshot: screenshotPath,
          timestamp: new Date().toISOString(),
          scraped_at: new Date().toISOString()
        });
        
        // 随机延迟
        await randomDelay(2000, 5000);
        
      } catch (error) {
        console.error(`处理笔记 ${i} 时出错:`, error);
        continue;
      }
    }
    
    // 记录成功
    await logScraperEvent(scraperName, 'success', {
      city: cityName,
      count: results.length,
      items: results.map(r => ({
        title: r.title,
        likes: r.likes
      }))
    });
    
    return results;
    
  } catch (error) {
    await logScraperEvent(scraperName, 'failure', {
      error: error.message
    });
    throw error;
    
  } finally {
    await closeBrowser(browser, context);
  }
}
```

### 4. 微博爬虫实现

```javascript
// scripts/weibo.js
import { createBrowser, closeBrowser, randomDelay, logScraperEvent } from './utils.js';

/**
 * 微博搜索爬虫
 */
export async function scrapeWeibo(cityName, limit = 20) {
  const scraperName = 'weibo';
  let browser, context, page;
  
  try {
    await logScraperEvent(scraperName, 'running', {
      city: cityName,
      limit
    });

    ({ browser, context, page } = await createBrowser());
    
    // 访问微博搜索页面
    const searchUrl = `https://s.weibo.com/search?q=${encodeURIComponent(cityName)}生活&type=user`;
    await page.goto(searchUrl);
    
    // 等待搜索结果加载
    await page.waitForSelector('.card-wrap', { timeout: 10000 });
    
    const results = [];
    const posts = await page.$$('.card-wrap');
    
    for (let i = 0; i < Math.min(posts.length, limit); i++) {
      try {
        const post = posts[i];
        
        // 提取微博信息
        const content = await post.$eval(el => el.querySelector('.content').innerText);
        const author = await post.$eval(el => {
          const authorEl = el.querySelector('.name');
          return authorEl ? authorEl.innerText.trim() : '';
        });
        const stats = await post.$eval(el => {
          const actions = el.querySelectorAll('.card-act');
          return {
            reposts: actions[0]?.innerText || '0',
            comments: actions[1]?.innerText || '0',
            likes: actions[2]?.innerText || '0'
          };
        });
        
        results.push({
          city: cityName,
          platform: 'weibo',
          content: content,
          author: author,
          reposts: parseInt(stats.reposts),
          comments: parseInt(stats.comments),
          likes: parseInt(stats.likes),
          timestamp: new Date().toISOString(),
          scraped_at: new Date().toISOString()
        });
        
        await randomDelay(1500, 3000);
        
      } catch (error) {
        console.error(`处理微博 ${i} 时出错:`, error);
        continue;
      }
    }
    
    await logScraperEvent(scraperName, 'success', {
      city: cityName,
      count: results.length
    });
    
    return results;
    
  } catch (error) {
    await logScraperEvent(scraperName, 'failure', {
      error: error.message
    });
    throw error;
    
  } finally {
    await closeBrowser(browser, context);
  }
}
```

### 5. 房价爬虫实现

```javascript
// scripts/housing.js
import { createBrowser, closeBrowser, randomDelay, logScraperEvent } from './utils.js';

/**
 * 贝壳房价爬虫
 */
export async function scrapeHousing(cityName, districts = []) {
  const scraperName = 'housing';
  let browser, context, page;
  
  try {
    await logScraperEvent(scraperName, 'running', {
      city: cityName,
      districts
    });

    ({ browser, context, page } = await createBrowser());
    
    // 访问贝壳城市页面
    const cityUrl = `https://${cityName}.ke.com/ershoufang/`;
    await page.goto(cityUrl);
    
    // 等待页面加载
    await page.waitForSelector('.listContent', { timeout: 10000 });
    
    const results = [];
    
    // 如果没有指定区域，获取所有区域
    if (districts.length === 0) {
      const districtElements = await page.$('.listContent .filter');
      districts = await Promise.all(
        districtElements.map(el => el.$eval(el => el.innerText.trim()))
      );
    }
    
    for (const district of districts) {
      try {
        // 点击区域
        await page.click(`text="${district}"`);
        await page.waitForTimeout(2000);
        
        // 获取价格信息
        const priceElement = await page.$('.total .total');
        const price = priceElement ? 
          parseInt(priceElement.innerText.replace(/[^0-9]/g, '')) : 0;
        
        // 获取房源数量
        const countElement = await page.$('.list .total');
        const count = countElement ? 
          parseInt(countElement.innerText.replace(/[^0-9]/g, '')) : 0;
        
        if (price > 0) {
          results.push({
            city: cityName,
            district: district,
            price: price,
            count: count,
            date: new Date().toISOString().split('T')[0],
            scraped_at: new Date().toISOString()
          });
        }
        
        await randomDelay(1000, 2000);
        
      } catch (error) {
        console.error(`处理区域 ${district} 时出错:`, error);
        continue;
      }
    }
    
    await logScraperEvent(scraperName, 'success', {
      city: cityName,
      districts: districts.length,
      results: results.length
    });
    
    return results;
    
  } catch (error) {
    await logScraperEvent(scraperName, 'failure', {
      error: error.message
    });
    throw error;
    
  } finally {
    await closeBrowser(browser, context);
  }
}
```

---

## 🛡️ 反反爬策略

### 1. 浏览器伪装

```javascript
// scripts/utils.js
export const browserConfig = {
  // 随机用户代理
  userAgent: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ],
  
  // 随机视窗大小
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 }
  ],
  
  // 随机语言和时区
  locales: ['zh-CN', 'en-US'],
  
  // 随机时区
  timezones: ['Asia/Shanghai', 'America/New_York', 'Europe/London']
};

/**
 * 获取随机配置
 */
export function getRandomConfig() {
  const config = {
    userAgent: browserConfig.userAgents[
      Math.floor(Math.random() * browserConfig.userAgents.length)
    ],
    viewport: browserConfig.viewports[
      Math.floor(Math.random() * browserConfig.viewports.length)
    ],
    locale: browserConfig.locales[
      Math.floor(Math.random() * browserConfig.locales.length)
    ]
  };
  
  return config;
}
```

### 2. 请求频率控制

```javascript
// scripts/config.js
export const config = {
  // 请求间隔（毫秒）
  delays: {
    xiaohongshu: { min: 2000, max: 5000 },
    weibo: { min: 1500, max: 3000 },
    housing: { min: 1000, max: 2000 },
    news: { min: 500, max: 1500 }
  },
  
  // 每日最大请求数
  dailyLimits: {
    xiaohongshu: 100,
    weibo: 200,
    housing: 50,
    news: 500
  },
  
  // 代理池配置
  proxyPool: [
    'http://proxy1.example.com:8080',
    'http://proxy2.example.com:8080',
    'http://proxy3.example.com:8080'
  ],
  
  // 失败重试配置
  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000
  }
};

/**
 * 检查是否达到每日限制
 */
export function checkDailyLimit(scraperName) {
  const today = new Date().toISOString().split('T')[0];
  const key = `scraper_${scraperName}_${today}`;
  
  const used = parseInt(localStorage.getItem(key) || '0');
  const limit = config.dailyLimits[scraperName] || Infinity;
  
  if (used >= limit) {
    throw new Error(`每日限制已达到: ${limit}/${used}`);
  }
  
  localStorage.setItem(key, used + 1);
  return { used: used + 1, limit };
}
```

### 3. 代理IP轮换

```javascript
// scripts/proxy-manager.js
class ProxyManager {
  constructor(proxyList) {
    this.proxies = proxyList;
    this.currentIndex = 0;
    this.failedProxies = new Set();
  }

  /**
   * 获取下一个可用代理
   */
  getNextProxy() {
    const availableProxies = this.proxies.filter(p => !this.failedProxies.has(p));
    
    if (availableProxies.length === 0) {
      throw new Error('所有代理都不可用');
    }
    
    const proxy = availableProxies[this.currentIndex % availableProxies.length];
    this.currentIndex++;
    
    return proxy;
  }

  /**
   * 标记代理失败
   */
  markProxyFailed(proxy) {
    this.failedProxies.add(proxy);
    console.warn(`代理失败: ${proxy}`);
  }

  /**
   * 重置失败状态
   */
  resetFailedProxies() {
    this.failedProxies.clear();
    this.currentIndex = 0;
  }

  /**
   * 获取代理配置
   */
  getProxyConfig(proxy) {
    return {
      proxy: {
        server: proxy,
        bypass: ['localhost', '127.0.0.1']
      }
    };
  }
}

export const proxyManager = new ProxyManager(config.proxyPool);
```

### 4. 验证码处理

```javascript
// scripts/captcha-handler.js
import { createBrowser } from './utils.js';

class CaptchaHandler {
  constructor() {
    this.ocrSpace = 'https://api.ocr.space/parse/image';
  }

  /**
   * 识别验证码
   */
  async recognizeCaptcha(imageBuffer) {
    try {
      const formData = new FormData();
      formData.append('file', imageBuffer, 'captcha.png');
      
      const response = await fetch(this.ocrSpace, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      return result.ParsedResults[0]?.ParsedText || '';
      
    } catch (error) {
      console.error('验证码识别失败:', error);
      return null;
    }
  }

  /**
   * 处理滑块验证码
   */
  async handleSlider(page, selector) {
    try {
      // 等待滑块出现
      await page.waitForSelector(selector, { timeout: 10000 });
      
      // 获取滑块元素
      const slider = await page.$(selector);
      
      // 获取滑块轨道
      const track = await slider.$eval(el => {
        const trackEl = el.querySelector('.nc_iconfont');
        const trackRect = trackEl.getBoundingClientRect();
        const sliderEl = el.querySelector('.nc_iconfont');
        const sliderRect = sliderEl.getBoundingClientRect();
        return {
          track: { x: trackRect.left, width: trackRect.width },
          slider: { x: sliderRect.left, width: sliderRect.width }
        };
      });
      
      // 计算目标位置（通常滑块需要滑到最右端）
      const targetX = track.track.x + track.width - track.slider.width / 2;
      
      // 拖动滑块
      await slider.hover();
      await page.mouse.move(targetX, track.track.y);
      await page.mouse.up();
      
      // 等待验证
      await page.waitForTimeout(2000);
      
      return true;
      
    } catch (error) {
      console.error('滑块验证失败:', error);
      return false;
    }
  }
}

export const captchaHandler = new CaptchaHandler();
```

---

## ⚡ 性能优化

### 1. 并发控制

```javascript
// scripts/scheduler.js
import { checkDailyLimit } from './config.js';

class ScraperScheduler {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.running = [];
    this.queue = [];
  }

  /**
   * 添加爬虫任务
   */
  addTask(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * 处理队列
   */
  async processQueue() {
    if (this.running.length >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const { task, resolve, reject } = this.queue.shift();
    this.running.push({ task, resolve, reject });
    
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      const index = this.running.findIndex(item => item.task === task);
      if (index > -1) {
        this.running.splice(index, 1);
      }
      this.processQueue();
    }
  }

  /**
   * 等待所有任务完成
   */
  async waitForAll() {
    while (this.running.length > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export const scheduler = new ScraperScheduler();
```

### 2. 缓存策略

```javascript
// scripts/cache-manager.js
const cache = new Map();

export const cacheManager = {
  /**
   * 设置缓存
   */
  set(key, value, ttl = 24 * 60 * 60 * 1000) {
    const expiry = Date.now() + ttl;
    cache.set(key, { value, expiry });
  },

  /**
   * 获取缓存
   */
  get(key) {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    
    return item.value;
  },

  /**
   * 删除缓存
   */
  delete(key) {
    cache.delete(key);
  },

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of cache.entries()) {
      if (now > item.expiry) {
        cache.delete(key);
      }
    }
  }
};

// 定期清理过期缓存
setInterval(() => {
  cacheManager.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次
```

### 3. 错误处理和重试

```javascript
// scripts/retry-handler.js
export async function withRetry(fn, maxAttempts = 3, backoff = 'exponential') {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const delay = backoff === 'exponential' 
        ? Math.min(1000 * Math.pow(2, attempt - 1), 30000)
        : 1000 * attempt;
      
      console.log(`第 ${attempt} 次尝试失败，${delay}ms后重试`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * 指数退避算法
 */
function exponentialBackoff(attempt, baseDelay = 1000, maxDelay = 30000) {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
}
```

---

## 📊 监控和日志

### 1. 爬虫日志表设计

```sql
CREATE TABLE scraper_logs (
  id SERIAL PRIMARY KEY,
  scraper_name VARCHAR(100) NOT NULL,
  city_id INTEGER REFERENCES cities(id),
  
  status VARCHAR(20),  -- running/success/failure/timeout
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER,  -- 耗时(秒)
  
  items_scraped INTEGER DEFAULT 0,
  pages_scraped INTEGER DEFAULT 0,
  
  error_message TEXT,
  error_trace TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_at DATE  -- 分区键
);

-- 索引
CREATE INDEX idx_logs_scraper ON scraper_logs(scraper_name);
CREATE INDEX idx_logs_status ON scraper_logs(status);
CREATE INDEX idx_logs_date ON scraper_logs(created_at DESC);
```

### 2. 日志服务

```javascript
// scripts/logger.js
class ScraperLogger {
  constructor() {
    this.logLevel = process.env.SCRAPER_LOG_LEVEL || 'info';
  }

  log(level, scraperName, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      scraper: scraperName,
      message,
      data,
      stack: new Error().stack
    };

    console.log(`[${level.toUpperCase()}] [${scraperName}] ${message}`, data);

    // 发送到监控系统
    this.sendToMonitoring(logEntry);
  }

  info(scraperName, message, data) {
    this.log('info', scraperName, message, data);
  }

  error(scraperName, error, data) {
    this.log('error', scraperName, error.message, {
      ...data,
      stack: error.stack
    });
  }

  warn(scraperName, message, data) {
    this.log('warn', scraperName, message, data);
  }

  debug(scraperName, message, data) {
    this.log('debug', scraperName, message, data);
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex >= currentLevelIndex;
  }

  sendToMonitoring(logEntry) {
    // 发送到监控系统（如Sentry）
    if (process.env.SENTRY_DSN) {
      // Sentry集成代码
    }
  }
}

export const logger = new ScraperLogger();
```

### 3. 告警系统

```javascript
// scripts/alerting.js
class AlertManager {
  constructor() {
    this.thresholds = {
      errorRate: 0.1,      // 错误率10%
      failureCount: 5,     // 连续失败5次
      duration: 300000     // 超时5分钟
    };
  }

  /**
   * 检查告警条件
   */
  async checkAlerts(scraperName, metrics) {
    // 检查错误率
    if (metrics.errorRate > this.thresholds.errorRate) {
      await this.sendAlert('error_rate', {
        scraper: scraperName,
        errorRate: metrics.errorRate,
        threshold: this.thresholds.errorRate
      });
    }

    // 检查连续失败
    if (metrics.consecutiveFailures >= this.thresholds.failureCount) {
      await this.sendAlert('consecutive_failures', {
        scraper: scraperName,
        count: metrics.consecutiveFailures,
        threshold: this.thresholds.failureCount
      });
    }

    // 检查超时
    if (metrics.avgDuration > this.thresholds.duration) {
      await this.sendAlert('long_duration', {
        scraper: scraperName,
        avgDuration: metrics.avgDuration,
        threshold: this.thresholds.duration
      });
    }
  }

  /**
   * 发送告警
   */
  async sendAlert(type, data) {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      severity: type === 'error_rate' ? 'critical' : 'warning',
      message: this.formatMessage(type, data),
      data
    };

    // 发送到通知系统
    await this.notify(alert);
    
    // 发送到监控系统
    await this.monitoring(alert);
  }

  formatMessage(type, data) {
    switch (type) {
      case 'error_rate':
        return `爬虫错误率过高: ${data.scraper} 错误率 ${(data.errorRate * 100).toFixed(1)}%`;
      case 'consecutive_failures':
        return `爬虫连续失败: ${data.scraper} 已连续失败 ${data.count} 次`;
      case 'long_duration':
        return `爬耗时长: ${data.scraper} 平均耗时 ${Math.round(data.avgDuration / 1000)}秒`;
      default:
        return `爬虫告警: ${JSON.stringify(data)}`;
    }
  }

  async notify(alert) {
    // 发送邮件、钉钉、企业微信等
    console.log('🚨 ALERT:', alert.message);
  }

  async monitoring(alert) {
    // 发送到监控系统
    console.log('📊 MONITOR:', alert);
  }
}

export const alertManager = new AlertManager();
```

---

## 🚀 部署方案

### 1. 本地部署

```bash
# package.json scripts
{
  "scripts": {
    "scrape": "node scripts/index.js",
    "scrape:schedule": "node scripts/scheduler.js",
    "scrape:logs": "node scripts/logger.js"
  }
}

# 启动定时任务
npm run scrape:schedule
```

### 2. GitHub Actions部署

```yaml
# .github/workflows/scraper.yml
name: 爬虫定时任务

on:
  schedule:
  # 每天凌晨2点运行
  - cron: '0 2 * * *'
  # 手动触发
  - workflow_dispatch

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 安装依赖
        run: |
          npm install
          npx playwright install chromium

      - name: 运行爬虫
        run: |
          npm run scrape
          
      - name: 上传截图到GitHub
        uses: actions/upload-artifact@v4
        with:
          name: scraper-screenshots
          path: scripts/screenshots/
```

### 3. 云服务器部署

```bash
# docker-compose.yml
version: '3.8'
services:
  scraper:
    build: .
    environment:
      - NODE_ENV=production
      - AI_API_KEY=${AI_API_KEY}
    volumes:
      - ./screenshots:/app/screenshots
      - ./logs:/app/logs
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
```

---

## 📋 使用示例

### 1. 单个爬虫运行

```javascript
// 运行小红书爬虫
import { scrapeXiaohongshu } from './scripts/xiaohongshu.js';

const results = await scrapeXiaohongshu('成都', 20);
console.log(`获取到 ${results.length} 条小红书笔记`);
```

### 2. 批量爬虫运行

```javascript
// 运行所有爬虫
import { scrapeXiaohongshu } from './scripts/xiaohongshu.js';
import { scrapeWeibo } from './scripts/weibo.js';
import { scrapeHousing } from './scripts/housing.js';

const cities = ['成都', '大理', '厦门', '青岛', '杭州'];

for (const city of cities) {
  try {
    const [xiaohongshu, weibo, housing] = await Promise.all([
      scrapeXiaohongshu(city, 20),
      scrapeWeibo(city, 20),
      scrapeHousing(city)
    ]);
    
    console.log(`${city} 爬虫完成: 小红书${xiaohongsum.length}条, 微博${weibo.length}条, 房价${housing.length}个区`);
  } catch (error) {
    console.error(`${city} 爬虫失败:`, error.message);
  }
}
```

### 3. 定时任务运行

```javascript
// scripts/scheduler.js
import { scheduler } from './scheduler';
import { scrapeXiaohongshu } from './scripts/xiaohongshu';

// 添加每日任务
scheduler.addTask(async () => {
  const cities = ['成都', '大理', '厦门'];
  
  for (const city of cities) {
    await scrapeXiaohongshu(city, 10);
  }
});

// 启动调度器
setInterval(() => {
  scheduler.processQueue();
}, 60000); // 每分钟检查一次队列
```

---

## ⚠️ 最佳实践

### 1. 代码规范

```javascript
// ✅ 好的实践
class HousingScraper {
  constructor() {
    this.name = 'housing';
  }

  async scrape(cityName) {
    try {
      await this.logEvent('start', { city: cityName });
      const results = await this.doScrape(cityName);
      await this.logEvent('success', { count: results.length });
      return results;
    } catch (error) {
      await this.logEvent('error', { error: error.message });
      throw error;
    }
  }

  async logEvent(status, details) {
    await logScraperEvent(this.name, status, details);
  }

  async doScrape(cityName) {
    // 实现具体爬虫逻辑
  }
}

// ❌ 避免的实践
async function scrapeXiaohongshu(cityName) {
  // 缺少错误处理
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 硬编码延迟
  await page.waitForTimeout(3000);
  
  // 没有日志记录
  const notes = await page.$$('.note-item');
  
  // 没有异常处理
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const title = await note.$eval(el => el.querySelector('.title').innerText);
    results.push({ title });
  }
  
  await browser.close();
  return results;
}
```

### 2. 错误处理

```javascript
// ✅ 正确的错误处理
async function scrapeWithRetry(scraperName, city) {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await scrapeXiaohongshu(city);
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`爬虫失败 (尝试${maxRetries}次): ${error.message}`);
      }
      
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log(`第${attempt}次尝试失败，${delay}ms后重试`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ❌ 避免的错误处理
async function scrapeXiaohongshu(cityName) {
  try {
    return await doScrape(cityName);
  } catch (error) {
    console.error('爬虫失败:', error);
    return [];
  }
}
```

### 3. 配置管理

```javascript
// ✅ 使用配置文件
// scripts/config.js
export const config = {
  apiKeys: {
    weather: process.env.WEATHER_API_KEY,
    ai: process.env.AI_API_KEY
  },
  delays: {
    default: { min: 1000, max: 3000 },
    xiaohongshu: { min: 2000, max: 5000 }
  }
};

// ❌ 硬编码配置
const API_KEY = 'your_api_key_here';
const DELAY = 2000;
```

---

## 📚 参考资源

### 官方文档
- [Playwright文档](https://playwright.dev/docs)
- [Playwright爬虫教程](https://playwright.dev/docs/intro)
- [Playwright示例](https://github.com/microsoft/playwright/tree/main/examples)

### 技术博客
- [Playwright反反爬技巧](https://playwright.dev/docs/troubleshooting)
- [AI识别爬虫方案](https://www.anthropic.com/claude)
- [Node.js爬虫最佳实践](https://nodejs.dev/learn/web-scraping)

### 开源项目
- [Playwright爬虫模板](https://github.com/microsoft/playwright-examples)
- [Node.js爬虫框架](https://github.com/ory/joes)
- [Python爬虫框架](https://github.com/scrapy/scrapy)

---

*本文档由prd-product.md和prd-technical.md中的爬虫章节整理而成*
*最后更新：2025-12-26*