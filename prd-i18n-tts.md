# 增量PRD：编程小达人 — 国际化（中/英/法三语）+ TTS朗读升级（Puter.js）

> **文档类型**：增量PRD（基于现有 index.html 约3622行单文件）
> **编写人**：产品经理 许清楚
> **日期**：2026-05-24
> **主文件**：`/Users/songhonglei/WorkBuddy/2026-05-24-21-59-26/output/kids-coding-game/index.html`
> **部署地址**：https://kidcoding-virid.vercel.app/
> **本地预览**：http://localhost:8765/

---

## 1. 产品目标

| # | 目标 | 衡量标准 |
|---|------|----------|
| G1 | **三语无缝切换**：用户可在中文/English/Français间随时切换，所有界面文案、题目内容、SVG标签即时响应 | 切换语言后无刷新，0处遗漏文案；三语覆盖率100%（code字段除外） |
| G2 | **TTS语音自然度跃升**：从浏览器原生Web Speech API升级到Puter.js，朗读效果更自然，且朗读语言自动跟随界面语言 | Puter.js为主引擎时朗读成功率>95%；语言切换后TTS语言自动对应 |
| G3 | **零依赖降级保障**：网络不可用或Puter.js加载失败时自动回退到Web Speech API，功能不中断 | 离线场景下朗读按钮仍可用（Web Speech API兜底） |

---

## 2. 用户故事

1. **As a** 中文小学生，**I want** 用母语学习和闯关，**so that** 能轻松理解编程概念。
2. **As an** 英语/法语母语小学生（或国际学校学生），**I want** 切换到English/Français界面，**so that** 能用自己的语言学习编程。
3. **As a** 学生，**I want** 朗读语音跟界面语言一致，**so that** 听到的和看到的是同一种语言，不会混淆。
4. **As a** 学生，**I want** 语音朗读更自然好听（不像机器人），**so that** 学习体验更愉快、更专注。
5. **As a** 学生，**I want** 网络不好时朗读依然能用，**so that** 不会因为网络问题影响学习。

---

## 3. 需求池

### P0 — Must Have

| ID | 需求 | 说明 |
|----|------|------|
| P0-1 | 语言切换器 | 顶部栏新增语言切换器，支持 中文/English/Français 三选一 |
| P0-2 | UI文案三语化 | 所有界面字符串（开始页/阶段选择/题目页/成绩页/解锁弹窗/按钮/提示语）支持三语动态切换 |
| P0-3 | 题目数据三语化 | 52题的 concept/question/options/explain 四字段三语版本；code字段不翻译 |
| P0-4 | MODULES模块信息三语化 | 12个模块的 name/desc 三语 |
| P0-5 | 阶段信息三语化 | 入门/初级/中级的 name/desc 三语 |
| P0-6 | 语言偏好持久化 | 语言选择保存到 localStorage，刷新后保留 |
| P0-7 | TTS升级到Puter.js | 引入Puter.js脚本，朗读优先使用 `puter.ai.txt2speech()` |
| P0-8 | TTS语言联动 | 朗读语言跟随当前界面语言（zh-CN/en-US/fr-FR） |
| P0-9 | TTS Fallback策略 | Puter.js不可用时自动降级到Web Speech API |
| P0-10 | iOS分段队列适配 | Puter.js返回audio对象，需实现队列播放管理（替代原SpeechSynthesisUtterance队列） |

### P1 — Should Have

| ID | 需求 | 说明 |
|----|------|------|
| P1-1 | SVG插图标签三语化 | 动画展示区和题目SVG插图中的文字标签（如"变量msg""带伞""第N圈"等）随语言切换 |
| P1-2 | 自动语言检测 | 首次访问根据 `navigator.language` 自动检测语言，fallback到中文 |
| P1-3 | TTS加载状态提示 | Puter.js首次加载/语音生成中的loading状态提示 |
| P1-4 | Puter.js引擎选择 | 优先使用Neural引擎（更自然），fallback到Standard |

### P2 — Nice to Have（本期暂不考虑）

| ID | 需求 | 说明 |
|----|------|------|
| P2-1 | 更多语言扩展（日语/韩语/西语等） | 架构预留扩展能力，但本期不实现 |
| P2-2 | 语言包懒加载/分包 | 本期为单HTML文件，语言包内联，暂不考虑分包 |
| P2-3 | 用户自选TTS引擎/语音 | 暂不暴露引擎选择给用户 |
| P2-4 | 题目翻译众包/编辑后台 | 本期翻译直接写死在数据中 |

---

## 4. 国际化系统设计

### 4.1 i18n架构方案

采用 **语言包对象 + t() 翻译函数** 方案，所有翻译内联在单HTML文件中（保持零外部依赖）。

```
i18n 架构:
┌─────────────────────────────────────────────┐
│  LANGS = ['zh', 'en', 'fr']                 │  支持的语言列表
│  currentLang = 'zh' | 'en' | 'fr'           │  当前语言（全局状态）
│                                             │
│  I18N = {                                   │  语言包（UI文案）
│    zh: { key: '中文值', ... },               │
│    en: { key: 'English value', ... },       │
│    fr: { key: 'Valeur française', ... }     │
│  }                                          │
│                                             │
│  function t(key) → 返回 I18N[currentLang][key]  翻译函数
│  function tQ(qIndex, field) → 返回当前语言对应题目字段
│  function tM(moduleIndex, field) → 返回当前语言对应模块字段
│  function setLang(lang) → 切换语言 + 持久化 + 重新渲染
└─────────────────────────────────────────────┘
```

#### 语言包结构

```javascript
// 语言代码 → Puter TTS语言映射
var TTS_LANG_MAP = {
  'zh': 'zh-CN',
  'en': 'en-US',
  'fr': 'fr-FR'
};

// UI文案语言包
var I18N = {
  zh: {
    app_title: '编程小达人',
    app_subtitle: '知识闯关 · 3大阶段 · 84道题',
    app_subtitle2: '从认识概念到读懂代码',
    // ... 完整key列表见第6节对照表
  },
  en: { /* ... */ },
  fr: { /* ... */ }
};

// 阶段信息（三语）
var STAGES_I18N = {
  zh: [
    { id:1, emoji:'🌱', name:'入门', count:22, desc:'认识5大编程基础概念' },
    { id:2, emoji:'📖', name:'初级', count:30, desc:'读懂代码，预测运行结果' },
    { id:3, emoji:'🚀', name:'中级', count:32, desc:'综合应用（即将开放）' }
  ],
  en: [ /* ... */ ],
  fr: [ /* ... */ ]
};

// 模块信息（三语）
var MODULES_I18N = {
  zh: [
    { name:'变量', desc:'变量就像贴了标签的盒子...' },
    // 12个模块
  ],
  en: [ /* ... */ ],
  fr: [ /* ... */ ]
};
```

#### 翻译函数

```javascript
var currentLang = 'zh'; // 默认中文

// UI文案翻译
function t(key) {
  var pack = I18N[currentLang] || I18N.zh;
  return pack[key] != null ? pack[key] : (I18N.zh[key] != null ? I18N.zh[key] : key);
}

// 题目字段翻译
// 题目数据结构升级见 4.2
function tQ(qIndex, field) {
  var q = QUESTIONS[qIndex];
  var i18nField = q.i18n && q.i18n[currentLang] && q.i18n[currentLang][field];
  return i18nField != null ? i18nField : q[field]; // fallback到原字段（中文）
}

// 模块字段翻译
function tM(moduleIndex, field) {
  var pack = MODULES_I18N[currentLang] || MODULES_I18N.zh;
  var m = pack[moduleIndex];
  return m && m[field] != null ? m[field] : (MODULES_I18N.zh[moduleIndex] && MODULES_I18N.zh[moduleIndex][field]);
}

// 阶段信息
function getStages() {
  return STAGES_I18N[currentLang] || STAGES_I18N.zh;
}
```

#### 切换逻辑

```javascript
var LANG_KEY = 'coding-game-lang';

function setLang(lang) {
  if (LANGS.indexOf(lang) < 0) lang = 'zh';
  currentLang = lang;
  // 1. 持久化
  try { localStorage.setItem(LANG_KEY, lang); } catch(e) {}
  // 2. 更新<html lang="...">
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  // 3. 停止当前朗读（语言变了，正在读的语音作废）
  if (window.tts) window.tts.stop();
  // 4. 重新渲染当前页面
  rerenderCurrent();
  // 5. 更新语言切换器UI状态
  updateLangSwitcher();
}

// 根据当前phase重新渲染
function rerenderCurrent() {
  switch(state.phase) {
    case 'start':       renderStart(); break;
    case 'stageSelect': renderStart(); break;
    case 'intro':       renderIntro(); break;
    case 'question':    renderQuestion(); break;
    case 'summary':     renderSummary(); break;
    case 'unlock':      /* 解锁弹窗保持，底层成绩页已渲染 */ break;
  }
}
```

### 4.2 题目数据结构升级方案

**方案：在每题增加 `i18n` 字段，存储 en/fr 翻译版本。中文保持原字段不变（向后兼容）。**

```javascript
// 升级后的题目结构示例
{
  module: 1,
  stage: 1,  // 第1阶无stage字段默认为1
  visual: { type: 'variable', params: { varName: "x", values: ["8"] } },
  concept: '变量就像一个贴了标签的盒子，可以把数据放进去...',  // 中文（原字段）
  question: '在编程中，"变量"最像下面哪个东西？',           // 中文（原字段）
  code: '<span class="kw">x</span> = <span class="num">12</span>',  // 不翻译
  options: [                                              // 中文选项（原字段）
    { letter: 'A', text: '一本书' },
    { letter: 'B', text: '一扇门' },
    { letter: 'C', text: '一个贴了标签的盒子' },
    { letter: 'D', text: '一张地图' }
  ],
  answer: 2,
  explain: '变量就像一个贴了标签的盒子...',                  // 中文解析（原字段）
  // ===== 新增：多语言字段 =====
  i18n: {
    en: {
      concept: 'A variable is like a labeled box that can store data...',
      question: 'In programming, what is a "variable" most like?',
      options: [
        { letter: 'A', text: 'A book' },
        { letter: 'B', text: 'A door' },
        { letter: 'C', text: 'A labeled box' },
        { letter: 'D', text: 'A map' }
      ],
      explain: 'A variable is like a labeled box that can store various types of data...'
    },
    fr: {
      concept: 'Une variable est comme une boîte étiquetée qui peut stocker des données...',
      question: 'En programmation, à quoi ressemble le plus une « variable » ?',
      options: [
        { letter: 'A', text: 'Un livre' },
        { letter: 'B', text: 'Une porte' },
        { letter: 'C', text: 'Une boîte étiquetée' },
        { letter: 'D', text: 'Une carte' }
      ],
      explain: 'Une variable est comme une boîte étiquetée qui peut stocker divers types de données...'
    }
  }
}
```

**设计要点**：
- `code` 字段不放入 `i18n`——Python伪代码是通用的
- `visual.params` 中如果有文字标签（如 `cond: "score > 60"`），代码表达式部分不翻译，纯文字描述部分需翻译
- `answer` 索引不变（三语选项顺序一致）
- `letter` (A/B/C/D) 不翻译
- 中文作为默认/fallback，`tQ()` 函数在找不到当前语言翻译时回退到原字段

### 4.3 语言切换器UI设计

**位置**：顶部栏右侧，与主题切换按钮并排（或整合为一组）。

```
顶部栏布局（题目页）:
┌──────────────────────────────────────────────────────────┐
│ [📦 变量]  [🔊]                    [🌐 中]  [🌙]  [0 分]│
│  moduleTag  speakBtn              langBtn themeBtn scoreBox│
└──────────────────────────────────────────────────────────┘

开始页（topbar隐藏）：语言切换器浮动在右上角，与主题按钮一组
```

**交互设计**：
- 点击 🌐 按钮弹出下拉菜单，显示三个选项：`中文` / `English` / `Français`
- 当前选中语言有 ✓ 标记
- 选择后立即切换，下拉菜单消失
- 移动端：语言切换器缩小为图标，点击展开

```html
<!-- 语言切换器HTML结构 -->
<div class="lang-switcher">
  <button class="lang-btn" onclick="toggleLangMenu()" title="切换语言 / Language / Langue">
    <span class="lang-icon">🌐</span>
    <span class="lang-label" id="langLabel">中</span>
  </button>
  <div class="lang-menu" id="langMenu" style="display:none;">
    <button onclick="setLang('zh')">✓ 中文</button>
    <button onclick="setLang('en')">&nbsp; English</button>
    <button onclick="setLang('fr')">&nbsp; Français</button>
  </div>
</div>
```

**CSS要点**：
- 与 `.theme-btn` 风格统一（44×44px触摸目标，border + bg）
- 下拉菜单绝对定位，z-index与主题按钮同级
- 移动端缩小图标

### 4.4 localStorage语言偏好持久化

```javascript
var LANG_KEY = 'coding-game-lang';

// 初始化时读取
function initLang() {
  var saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch(e) {}
  if (saved && LANGS.indexOf(saved) >= 0) {
    currentLang = saved;
  } else {
    // P1-2: 自动检测浏览器语言
    currentLang = detectLang();
  }
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : currentLang;
}

// 自动检测（P1）
function detectLang() {
  var bl = (navigator.language || navigator.userLanguage || 'zh').toLowerCase();
  if (bl.indexOf('fr') === 0) return 'fr';
  if (bl.indexOf('en') === 0) return 'en';
  return 'zh'; // 默认中文
}
```

### 4.5 自动语言检测逻辑（P1）

```
首次访问流程:
1. 读取 localStorage['coding-game-lang']
   ├─ 有值且合法 → 使用该语言
   └─ 无值 → 进入步骤2
2. 检测 navigator.language
   ├─ 以 'fr' 开头 → Français
   ├─ 以 'en' 开头 → English
   └─ 其他（含zh/未匹配）→ 中文（默认）
3. 用户手动切换后，覆盖保存到 localStorage
```

---

## 5. TTS升级设计

### 5.1 Puter.js集成方案

#### 脚本引入

在 `<head>` 中、现有 `<style>` 之前引入：

```html
<script src="https://js.puter.com/v2/"></script>
```

#### TTS对象重构

将现有 `tts` 对象（行2319-2414）升级为支持双引擎架构：

```javascript
var tts = {
  speaking: false,
  paused: false,
  _engine: 'web',          // 'puter' | 'web'  当前使用的引擎
  _puterReady: false,      // Puter.js是否加载完成
  _queue: [],              // 分段队列
  _idx: 0,
  _onEnd: null,
  _currentAudio: null,     // Puter返回的audio对象

  // 初始化检测Puter.js是否可用
  init: function() {
    var self = this;
    if (typeof puter !== 'undefined' && puter.ai && puter.ai.txt2speech) {
      this._puterReady = true;
      this._engine = 'puter';
    } else {
      // 脚本加载失败或未就绪，等DOMContentLoaded后再检测
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof puter !== 'undefined' && puter.ai && puter.ai.txt2speech) {
          self._puterReady = true;
          self._engine = 'puter';
        }
      });
    }
  },

  // 获取当前语言对应的TTS语言代码
  _getTTSLang: function() {
    return TTS_LANG_MAP[currentLang] || 'zh-CN';
  },

  // 文本分段（复用现有逻辑）
  _chunk: function(text) {
    var clean = text.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '');
    var chunks = clean.match(/[^。！？.!?]+[。！？.!?]?/g) || [clean];
    var finalChunks = [];
    chunks.forEach(function(c) {
      if (c.length > 180) {
        var sub = c.match(/[^，,]+[，,]?/g) || [c];
        sub.forEach(function(s) { if (s.trim()) finalChunks.push(s.trim()); });
      } else if (c.trim()) {
        finalChunks.push(s.trim());
      }
    });
    if (finalChunks.length === 0) finalChunks = [clean];
    return finalChunks;
  },

  speak: function(text, onEnd) {
    this.stop();
    var chunks = this._chunk(text);
    this._queue = chunks;
    this._idx = 0;
    this._onEnd = onEnd;
    this.speaking = true;
    this.paused = false;
    this.updateBtn();

    if (this._puterReady) {
      this._playWithPuter();
    } else {
      this._playWithWebSpeech();
    }
  },

  // ===== Puter.js引擎播放 =====
  _playWithPuter: function() {
    var self = this;
    var lang = this._getTTSLang();

    function playNext() {
      if (self._idx >= self._queue.length) {
        self._finish();
        return;
      }
      var text = self._queue[self._idx];
      // 单次文本≤3000字符限制（已分段，通常不会超）
      puter.ai.txt2speech(text, lang)
        .then(function(audio) {
          self._currentAudio = audio;
          audio.onended = function() {
            self._idx++;
            playNext();
          };
          audio.onerror = function() {
            self._idx++;
            playNext();
          };
          audio.play();
        })
        .catch(function(err) {
          // Puter调用失败，降级到Web Speech API
          console.warn('Puter TTS failed, falling back to Web Speech:', err);
          self._engine = 'web';
          self._playWithWebSpeech();
        });
    }
    playNext();
  },

  // ===== Web Speech API引擎播放（fallback） =====
  _playWithWebSpeech: function() {
    var self = this;
    var lang = this._getTTSLang();

    function playNext() {
      if (self._idx >= self._queue.length) {
        self._finish();
        return;
      }
      var u = new SpeechSynthesisUtterance(self._queue[self._idx]);
      u.lang = lang;        // 原来硬编码 'zh-CN'，改为动态
      u.rate = 0.88;
      u.pitch = 1.0;
      u.onend = function() { self._idx++; playNext(); };
      u.onerror = function() { self._idx++; playNext(); };
      speechSynthesis.speak(u);
    }
    playNext();
  },

  _finish: function() {
    this.speaking = false;
    this.paused = false;
    this._queue = [];
    this._currentAudio = null;
    this.updateBtn();
    if (this._onEnd) this._onEnd();
  },

  stop: function() {
    this._queue = [];
    this._idx = 0;
    // 停止Puter audio
    if (this._currentAudio) {
      try { this._currentAudio.pause(); this._currentAudio.currentTime = 0; } catch(e) {}
      this._currentAudio = null;
    }
    // 停止Web Speech
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
    this.speaking = false;
    this.paused = false;
    this.updateBtn();
  },

  toggle: function(text) {
    // Puter audio 的暂停/恢复
    if (this._engine === 'puter' && this._currentAudio) {
      if (this.speaking && !this.paused) {
        this._currentAudio.pause();
        this.paused = true;
        this.updateBtn();
        return 'paused';
      } else if (this.paused) {
        this._currentAudio.play();
        this.paused = false;
        this.updateBtn();
        return 'resumed';
      }
    }
    // Web Speech 的暂停/恢复
    if (this._engine === 'web') {
      if (this.speaking && !this.paused) {
        speechSynthesis.pause();
        this.paused = true;
        this.updateBtn();
        return 'paused';
      } else if (this.paused) {
        speechSynthesis.resume();
        this.paused = false;
        this.updateBtn();
        return 'resumed';
      }
    }
    this.speak(text);
    return 'speaking';
  },

  updateBtn: function() {
    // 复用现有逻辑
    var btns = document.querySelectorAll('.speak-btn, .fb-speak-btn');
    btns.forEach(function(btn) {
      if (tts.speaking && !tts.paused) {
        btn.classList.add('speaking');
      } else if (tts.paused) {
        btn.classList.add('speaking');
      } else {
        btn.classList.remove('speaking');
      }
    });
  }
};

// 初始化检测
tts.init();
```

### 5.2 TTS语言联动逻辑

```
界面语言 → TTS语言映射:
  zh → 'zh-CN' (Puter.js & Web Speech API)
  en → 'en-US'
  fr → 'fr-FR'

联动时机:
1. 用户切换语言(setLang) → 立即停止当前朗读(tts.stop())
2. 下次点击朗读按钮 → 使用新语言的TTS语音
3. _getTTSLang() 实时读取 currentLang，保证一致性
```

### 5.3 Fallback策略

```
朗读请求:
├─ Puter.js已就绪(this._puterReady === true)
│   ├─ puter.ai.txt2speech() 调用成功 → 播放audio对象
│   └─ puter.ai.txt2speech() 调用失败(catch) → 降级到Web Speech API
│       └─ 降级后本次会话继续用Web Speech（不再重试Puter）
└─ Puter.js未就绪/加载失败
    └─ 直接使用Web Speech API

触发降级的场景:
- 网络不可用（Puter.js脚本未加载）
- Puter.ai.txt2speech() 返回错误
- 用户Puter账户问题（User-Pays模型限制）
```

### 5.4 iOS分段队列适配

**问题**：iOS Safari 对 Web Speech API 有单utterance约200字符截断限制（已有分段逻辑）。Puter.js返回的是audio对象，机制不同，但仍需队列管理。

**适配方案**：
- 保留现有 `_chunk()` 分段逻辑，两种引擎共用
- Puter模式：每段调用 `puter.ai.txt2speech()` 获取audio，`onended` 回调播放下一段
- Web Speech模式：保留原 `SpeechSynthesisUtterance` 队列
- 队列状态（`_queue`/`_idx`/`_onEnd`）两种引擎共用，保证 `stop()`/`toggle()` 行为一致

### 5.5 加载状态处理（P1-3）

```javascript
// Puter.js首次加载可能延迟，朗读按钮需反馈状态
speak: function(text, onEnd) {
  // ...
  if (this._puterReady) {
    // 显示"语音加载中..."提示
    this._showLoading();
    this._playWithPuter();
  }
  // ...
},

_showLoading: function() {
  var btns = document.querySelectorAll('.speak-btn, .fb-speak-btn');
  btns.forEach(function(btn) {
    btn.classList.add('tts-loading');
  });
},
// audio.play() 成功后移除loading
```

CSS:
```css
.speak-btn.tts-loading, .fb-speak-btn.tts-loading {
  opacity: 0.6;
  pointer-events: none;
}
.speak-btn.tts-loading::after {
  content: '...';
  /* 或用spinner动画 */
}
```

---

## 6. 翻译策略

### 6.1 翻译风格指南

| 原则 | 说明 | 示例 |
|------|------|------|
| **面向小学生** | 用词简单，避免学术化表达 | "布尔值" → 可保留但加括号解释 "Boolean value (true/false)" |
| **口语化** | 像老师对学生说话，亲切自然 | "恭喜通过入门阶段！" → "Great job! You passed the Beginner stage!" |
| **代码术语统一** | Python关键字保留英文，概念用各语言解释 | `if`/`else`/`for`/`while`/`def`/`return`/`print` 不翻译 |
| **鼓励语积极** | 多用鼓励性表达 | "再来一次吧！相信你能做到！" → "Try again! You can do it!" |
| **法语自然** | 法语翻译注意阴阳性、冠词 | "变量" → "Une variable"（阴性） |

### 6.2 UI文案三语对照表

> 以下为**完整**的UI字符串对照表，工程师实施时直接使用。key对应 `I18N` 对象的键名。

#### 6.2.1 开始页

| key | 中文 (zh) | English (en) | Français (fr) |
|-----|-----------|--------------|---------------|
| `app_title` | 编程小达人 | Coding Star Kids | Petits Pros du Code |
| `app_subtitle` | 知识闯关 · 3大阶段 · 84道题 | Quiz Adventure · 3 Stages · 84 Questions | Aventure Quiz · 3 Niveaux · 84 Questions |
| `app_subtitle2` | 从认识概念到读懂代码 | From concepts to reading code | Des concepts à la lecture de code |
| `stage_beginner` | 入门 | Beginner | Débutant |
| `stage_elementary` | 初级 | Elementary | Élémentaire |
| `stage_intermediate` | 中级 | Intermediate | Intermédiaire |
| `stage1_desc` | 认识5大编程基础概念 | Learn 5 core programming concepts | Découvrir 5 concepts de base |
| `stage2_desc` | 读懂代码，预测运行结果 | Read code, predict the output | Lire le code, prédire le résultat |
| `stage3_desc` | 综合应用（即将开放） | Comprehensive practice (Coming soon) | Pratique globale (Bientôt disponible) |
| `unit_questions` | 题 | Questions | Questions |
| `passed_badge` | ✓ 已通过 | ✓ Passed | ✓ Réussi |
| `best_score` | 最高 {score}/{total} | Best {score}/{total} | Meilleur {score}/{total} |
| `status_unlocked` | 已解锁 | Unlocked | Déverrouillé |
| `status_locked` | 未解锁 | Locked | Verrouillé |
| `continue_info` | 上次进度：{stage}阶段 · 第{n}题 · {score}分 | Last progress: {stage} · Q{n} · {score} pts | Dernière progression : {stage} · Q{n} · {score} pts |
| `btn_continue` | 继续闯关 | Continue | Continuer |
| `btn_reselect` | 重新选择 | Choose Again | Choisir à nouveau |
| `btn_start` | 开始答题 | Start | Commencer |

#### 6.2.2 顶部栏 & 题目页

| key | 中文 (zh) | English (en) | Français (fr) |
|-----|-----------|--------------|---------------|
| `unit_score` | 分 | pts | pts |
| `q_number` | 第 {n} 题 / 共{total}题 | Question {n} / {total} | Question {n} / {total} |
| `btn_next` | 下一题 | Next | Suivante |
| `btn_view_results` | 查看成绩 | View Results | Voir les résultats |
| `speak_tooltip` | 朗读题目 | Read question | Lire la question |
| `speak_explain` | 🔊 朗读解析 | 🔊 Read explanation | 🔊 Lire l'explication |

#### 6.2.3 选项反馈

| key | 中文 (zh) | English (en) | Français (fr) |
|-----|-----------|--------------|---------------|
| `fb_correct_title` | 答对了 | Correct! | Correct ! |
| `fb_wrong_title` | 答错了，没关系 | Not quite, that's okay! | Pas tout à fait, ce n'est pas grave ! |
| `fb_summary_label` | 知识点小结： | Key point: | Point clé : |
| `fb_explain_label` | 解析： | Explanation: | Explication : |
| `fb_correct_answer` | 正确答案是 | The correct answer is | La bonne réponse est |

#### 6.2.4 模块介绍页

| key | 中文 (zh) | English (en) | Français (fr) |
|-----|-----------|--------------|---------------|
| `intro_title_prefix` | 第 {id} 关： | Stage {id}: | Niveau {id} : |
| `btn_start_quiz` | 开始答题 | Start Quiz | Commencer le quiz |

#### 6.2.5 成绩页

| key | 中文 (zh) | English (en) | Français (fr) |
|-----|-----------|--------------|---------------|
| `summary_module_tag` | 闯关完成 | Stage Complete | Niveau terminé |
| `summary_title` | {stage}阶段 闯关完成 | {stage} Stage Complete! | Niveau {stage} terminé ! |
| `btn_retry_stage` | 重答本阶段 | Retry Stage | Recommencer |
| `btn_back_to_stages` | 回阶段选择 | Back to Stages | Retour aux niveaux |
| `encourage_s1_3star` | 太棒了！你对编程基础概念掌握得非常扎实，可以去挑战初级阶段了！ | Awesome! You've mastered the basics. Time to challenge the Elementary stage! | Génial ! Tu maîtrises les bases. C'est l'heure du niveau Élémentaire ! |
| `encourage_s1_pass` | 恭喜通过入门阶段！正确率达到60%就能解锁初级阶段。再多练几次会更扎实！ | Congrats on passing! 60% unlocks Elementary. Practice more to get even better! | Bravo ! 60% déverrouille l'Élémentaire. Entraîne-toi encore ! |
| `encourage_s1_fail` | 正确率达到60%就能解锁初级阶段，再来一次吧！相信你能做到！ | Score 60% to unlock the next stage. Try again — you can do it! | Atteins 60% pour déverrouiller la suite. Réessaye, tu peux le faire ! |
| `encourage_s2_3star` | 非常扎实！你的代码阅读能力很强！ | Excellent! Your code-reading skills are strong! | Excellent ! Tu lis très bien le code ! |
| `encourage_s2_pass` | 做得不错！大部分代码都能读懂了，继续加油！ | Well done! You can read most code now. Keep it up! | Bien joué ! Tu comprends la plupart du code. Continue ! |
| `encourage_s2_low_pass` | 通过啦！代码阅读需要练习，多读几遍会更熟练。 | You passed! Code reading takes practice — read more to improve. | Réussi ! La lecture demande de la pratique. Continue à lire ! |
| `encourage_s2_fail` | 代码阅读需要多练习，把每道题的解析认真读一遍，再来一次会有很大提升！ | Code reading takes practice. Read each explanation carefully and try again! | La lecture de code demande de la pratique. Lis bien les explications et réessaye ! |

#### 6.2.6 解锁弹窗

| key | 中文 (zh) | English (en) | Français (fr) |
|-----|-----------|--------------|---------------|
| `unlock_title` | 恭喜过关！ | Congratulations! | Félicitations ! |
| `unlock_score_label` | 本阶段成绩： | Stage score: | Score du niveau : |
| `unlock_accuracy` | 正确率 | Accuracy | Précision |
| `unlock_unlocked` | 已解锁： | Unlocked: | Déverrouillé : |
| `unlock_go_next` | 去{stage}阶段 | Go to {stage} | Aller au {stage} |
| `unlock_practice` | 再练练 | Practice More | S'entraîner encore |

#### 6.2.7 语言切换器

| key | 中文 (zh) | English (en) | Français (fr) |
|-----|-----------|--------------|---------------|
| `lang_tooltip` | 切换语言 | Switch Language | Changer de langue |
| `lang_zh` | 中文 | Chinese | Chinois |
| `lang_en` | English | English | Anglais |
| `lang_fr` | Français | French | Français |

#### 6.2.8 模块名称与描述（12个模块）

| 模块ID | key | 中文 (zh) | English (en) | Français (fr) |
|--------|-----|-----------|--------------|---------------|
| 1 | `mod_1_name` | 变量 | Variables | Variables |
| 1 | `mod_1_desc` | 变量就像贴了标签的盒子，用来存放数据。让我们一起来认识它吧！ | Variables are like labeled boxes for storing data. Let's learn about them! | Les variables sont comme des boîtes étiquetées pour stocker des données. Découvrons-les ! |
| 2 | `mod_2_name` | 条件判断 | Conditionals | Conditions |
| 2 | `mod_2_desc` | 如果……就……！条件判断让程序学会做选择，就像走到分叉路口。 | If... then...! Conditionals let programs make choices, like reaching a fork in the road. | Si... alors... ! Les conditions permettent au programme de faire des choix, comme à un carrefour. |
| 3 | `mod_3_name` | 循环 | Loops | Boucles |
| 3 | `mod_3_desc` | 重复的事情交给循环！不用复制粘贴，几行代码就能重复执行很多次。 | Let loops handle repetition! No copy-pasting — a few lines repeat many times. | Les boucles gèrent la répétition ! Quelques lignes suffisent pour répéter. |
| 4 | `mod_4_name` | 函数 | Functions | Fonctions |
| 4 | `mod_4_desc` | 函数是一个可以反复使用的小工具，定义一次，随时调用，让代码整洁有序。 | Functions are reusable tools — define once, call anytime, keep code tidy. | Les fonctions sont des outils réutilisables — définies une fois, appelées à volonté. |
| 5 | `mod_5_name` | 调试思维 | Debugging | Débogage |
| 5 | `mod_5_desc` | 程序出错了怎么办？学会像侦探一样分析错误，一步步找出并修复 Bug！ | Program has a bug? Learn to analyze errors like a detective and fix them step by step! | Un bug dans le programme ? Apprends à analyser les erreurs comme un détective ! |
| 6 | `mod_6_name` | 代码阅读基础 | Reading Code Basics | Bases de lecture de code |
| 6 | `mod_6_desc` | 学会像读故事一样读代码，从上到下一行一行理解执行顺序。 | Learn to read code like a story — line by line, top to bottom. | Apprends à lire le code comme une histoire — ligne par ligne. |
| 7 | `mod_7_name` | 变量进阶 | Variables Advanced | Variables avancées |
| 7 | `mod_7_desc` | 变量可以互相赋值、连续更新，还能交换——来看看变量的进阶用法！ | Variables can copy, update, and swap values — explore advanced uses! | Les variables peuvent se copier, s'actualiser, s'échanger — explorons ! |
| 8 | `mod_8_name` | 条件进阶 | Conditionals Advanced | Conditions avancées |
| 8 | `mod_8_desc` | elif 多分支、嵌套 if、and/or 逻辑运算符——让程序做更复杂的判断！ | elif chains, nested if, and/or operators — for more complex decisions! | chaînes elif, if imbriqués, opérateurs and/or — des décisions complexes ! |
| 9 | `mod_9_name` | 循环进阶 | Loops Advanced | Boucles avancées |
| 9 | `mod_9_desc` | range 范围、累加器、循环里加条件——循环的威力远超你的想象！ | range, accumulators, if-inside-loop — loops are more powerful than you think! | range, accumulateurs, if dans boucle — les boucles sont puissantes ! |
| 10 | `mod_10_name` | 函数进阶 | Functions Advanced | Fonctions avancées |
| 10 | `mod_10_desc` | 带参数、有返回值、函数套函数——函数是代码复用的利器！ | Parameters, return values, nested calls — functions are reuse powerhouses! | Paramètres, valeurs de retour, appels imbriqués — les fonctions sont puissantes ! |
| 11 | `mod_11_name` | 列表入门 | Lists Intro | Intro aux listes |
| 11 | `mod_11_desc` | 列表就像购物清单，把多个数据排成一排存放。学会创建、访问和添加元素！ | Lists are like shopping lists — store multiple items in a row. Create, access, add! | Les listes sont comme des listes de courses — stocke plusieurs éléments. Crée, accède, ajoute ! |
| 12 | `mod_12_name` | 综合小案例 | Mini Projects | Mini projets |
| 12 | `mod_12_desc` | 把前面学的知识串起来，读懂完整的小程序——猜数字、成绩判断、倒计时、购物计算！ | Put it all together — read complete programs: guessing game, grading, countdown, shopping! | Tout rassembler — lis des programmes complets : devinettes, notes, compte à rebours, courses ! |

#### 6.2.9 SVG插图标签（P1）

以下SVG文字标签需要三语化（分布在 `getAnimHTML()` 和 `getXXXVisual()` 函数中）：

| 位置 | key | 中文 (zh) | English (en) | Français (fr) |
|------|-----|-----------|--------------|---------------|
| variable动画 | `svg_var_label` | 变量 msg | Variable msg | Variable msg |
| variable动画 | `svg_var_hint` | 值可以随时替换 | Value can change anytime | La valeur peut changer |
| variable插图 | `svg_var_caption` | 变量 {name} 里放的是 {value} | Variable {name} holds {value} | La variable {name} contient {value} |
| condition动画 | `svg_cond_ask` | if 下雨? | if raining? | si pluie ? |
| condition动画 | `svg_cond_left` | 带伞 | Bring umbrella | Prendre parapluie |
| condition动画 | `svg_cond_right` | 不带 | No umbrella | Pas de parapluie |
| condition插图 | `svg_cond_true` | 条件成立 → 走左边 | Condition true → go left | Condition vraie → à gauche |
| condition插图 | `svg_cond_false` | 条件不成立 → 走右边 | Condition false → go right | Condition fausse → à droite |
| loop动画 | `svg_loop_hint` | 重复执行，无需复制代码 | Repeat without copying code | Répéter sans copier le code |
| loop插图 | `svg_loop_lap` | 第 {n} 圈 | Lap {n} | Tour {n} |
| loop插图 | `svg_loop_caption` | 重复执行 {n} 次 | Repeat {n} times | Répéter {n} fois |
| function动画 | `svg_func_label` | 函数 | Function | Fonction |
| function插图 | `svg_func_caption` | 函数：原料 → 加工 → 成品 | Function: input → process → output | Fonction : entrée → traitement → sortie |
| bug动画 | `svg_bug_fixed` | Bug 已修复 | Bug fixed! | Bug corrigé ! |
| bug插图 | `svg_bug_caption` | 找虫 · 分析 · 修复 · 验证 | Find · Analyze · Fix · Verify | Trouver · Analyser · Corriger · Vérifier |
| reading动画 | `svg_reading_hint` | 从上到下 · 逐行阅读 · 预测结果 | Top to bottom · Read line by line · Predict | De haut en bas · Lire ligne par ligne · Prédire |
| reading插图 | `svg_reading_caption` | 读代码 · 理解 · 预测结果 | Read · Understand · Predict | Lire · Comprendre · Prédire |
| list动画 | `svg_list_hint` | 有序排列 · 索引从0开始 | Ordered · Index starts at 0 | Ordonné · L'index commence à 0 |
| list插图 | `svg_list_caption` | 列表 · 有序排列 · 索引从0开始 | List · Ordered · Index from 0 | Liste · Ordonné · Index dès 0 |

### 6.3 题目翻译说明

- **翻译字段**：`concept` / `question` / `options[].text` / `explain` — 四字段三语
- **不翻译字段**：`code`（Python伪代码HTML）、`options[].letter`（A/B/C/D）、`answer`（索引）、`module` / `stage` / `visual`
- **翻译数量**：52题 × 4字段 × 2外语 = 416条翻译（不含中文，中文为原字段）
- **翻译策略**：由工程师在题目数据的 `i18n` 字段中填入翻译，翻译来源见对照表风格指南
- **选项顺序**：三语选项顺序与 `answer` 索引保持一致，不重排

---

## 7. 函数改动清单

> 行号基于当前 index.html（约3622行），实施时可能有偏移，以函数名为准。

### 7.1 新增函数/对象

| 函数/对象 | 位置 | 说明 |
|-----------|------|------|
| `I18N` 对象 | `<script>` 开头，MODULES之前 | UI文案三语语言包 |
| `MODULES_I18N` 对象 | MODULES之后 | 12模块name/desc三语 |
| `STAGES_I18N` 对象 | MODULES之后 | 阶段信息三语 |
| `TTS_LANG_MAP` 对象 | tts对象之前 | 语言代码→TTS语言映射 |
| `LANGS` 常量 | 顶部 | `['zh', 'en', 'fr']` |
| `currentLang` 变量 | 顶部 | 当前语言状态 |
| `LANG_KEY` 常量 | 顶部 | localStorage键名 |
| `t(key)` 函数 | 辅助函数区 | UI文案翻译 |
| `tQ(qIndex, field)` 函数 | 辅助函数区 | 题目字段翻译 |
| `tM(moduleIndex, field)` 函数 | 辅助函数区 | 模块字段翻译 |
| `getStages()` 函数 | 辅助函数区 | 获取当前语言阶段信息 |
| `initLang()` 函数 | 辅助函数区 | 初始化语言（读取localStorage+自动检测） |
| `detectLang()` 函数 | 辅助函数区 | 浏览器语言检测（P1） |
| `setLang(lang)` 函数 | 辅助函数区 | 切换语言+持久化+重新渲染 |
| `rerenderCurrent()` 函数 | 辅助函数区 | 按当前phase重新渲染 |
| `toggleLangMenu()` 函数 | 辅助函数区 | 语言切换器下拉菜单开关 |
| `updateLangSwitcher()` 函数 | 辅助函数区 | 更新语言切换器UI状态 |
| 语言切换器HTML/CSS | topbar区域 | 🌐按钮+下拉菜单 |

### 7.2 修改函数

| 函数名 | 当前行号 | 改动内容 |
|--------|----------|----------|
| `<head>` | 行1-8 | 添加 `<script src="https://js.puter.com/v2/"></script>`；`<html lang>` 动态化 |
| `<body>` topbar | 行1234-1241 | 添加语言切换器HTML；moduleTag/scoreBox文案改为 `t()` |
| `MODULES` 数组 | 行1256-1354 | name/desc改为从 `MODULES_I18N` 动态读取（或保留原值作为fallback） |
| `QUESTIONS` 数组 | 行1358-2194 | 每题增加 `i18n: { en: {...}, fr: {...} }` 字段 |
| `tts` 对象 | 行2319-2414 | 整体重构为双引擎架构（Puter.js + Web Speech API），详见第5节 |
| `toggleSpeak()` | 行2418-2428 | 朗读文本从 `q.concept + q.question` 改为 `tQ(state.qIndex,'concept') + tQ(state.qIndex,'question')` |
| `speakExplain()` | 行2431-2433 | `_explainText` 改为使用 `tQ(state.qIndex,'explain')` |
| `renderStart()` | 行2453-2525 | 所有硬编码中文改为 `t()` 调用；stages数组改为 `getStages()`；continue-info文案i18n化 |
| `renderIntro()` | 行2530-2550 | moduleTag、intro-title、desc、按钮文案改为 `t()`/`tM()` |
| `getAnimHTML()` | 行2553-2621 | SVG标签文字改为 `t()` 调用（P1） |
| `renderQuestion()` | 行2637-2685 | q-number、concept、question、options、按钮文案改为 `tQ()`/`t()`；speakText用tQ |
| `selectOption()` | 行2688-2733 | feedback文案（答对了/答错了/知识点小结/解析/正确答案是）改为 `t()`；explain用 `tQ()`；options text用 `tQ()` |
| `renderSummary()` | 行2766-2903 | moduleTag、summary-title、鼓励语、阶段名称、按钮文案、总览卡片文案改为 `t()`/`tM()` |
| `renderUnlock()` | 行2908-2988 | 弹窗所有文案（恭喜过关/本阶段成绩/正确率/已解锁/去X阶段/再练练）改为 `t()` |
| `closeUnlockAndStart()` | 行2995-2998 | 无文案改动 |
| `getVarVisual()` | 行3222-3254 | SVG `<text>` 标签改为 `t()`（P1） |
| `getCondVisual()` | 行3257-3294 | SVG `<text>` 标签改为 `t()`（P1） |
| `getLoopVisual()` | 行3297-3329 | SVG `<text>` 标签改为 `t()`（P1） |
| `getFuncVisual()` | 行3332-3379 | SVG `<text>` 标签改为 `t()`（P1） |
| `getBugVisual()` | 行3382-3415 | SVG `<text>` 标签改为 `t()`（P1） |
| `getReadingVisual()` | 行3423-3459 | SVG `<text>` 标签改为 `t()`（P1） |
| `getListVisual()` | 行3462-3518 | SVG `<text>` 标签改为 `t()`（P1） |
| `startGame()` | 行3520-3543 | 无文案改动，但需确保 `currentLang` 不被重置 |
| `renderStart()` 初始化调用 | 行3616 | 在 `renderStart()` 前调用 `initLang()` |
| CSS `<style>` | 行9-1209 | 新增 `.lang-switcher` / `.lang-btn` / `.lang-menu` / `.tts-loading` 样式 |

### 7.3 不需要修改的函数

| 函数名 | 行号 | 原因 |
|--------|------|------|
| `saveProgress()` / `loadProgress()` / `clearProgress()` | 行2221-2254 | 不涉及语言（语言单独存储） |
| `getStageQuestions()` / `getStageModules()` / `getStageStartIndex()` 等 | 行2261-2299 | 纯逻辑函数 |
| `calcStars()` / `getPassThreshold()` | 行2302-2317 | 纯计算 |
| `shade()` / `_esc()` / `_shade()` 等SVG辅助函数 | 行2624-2632等 | 纯工具函数 |
| `toggleTheme()` | 行3606-3611 | 主题切换与语言无关 |

---

## 8. 待确认问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| Q1 | Puter.js的"User-Pays"模型是否需要用户登录Puter账户才能使用TTS？如果需要，未登录用户体验如何？ | TTS可用性 | 需实测验证。若需登录，建议未登录时直接用Web Speech API，不弹登录提示 |
| Q2 | Puter.js `txt2speech()` 的Neural引擎是否需要额外参数指定？还是默认就是Neural？ | TTS实现细节 | 需查阅Puter.js文档确认API签名。建议：优先尝试Neural，失败降级Standard |
| Q3 | 法语环境下，部分Python代码示例中的中文字符串（如 `print("小明")`）是否需要改为法语/英语人名？ | 翻译完整性 | 建议code字段中的字符串内容也做适度本地化（如"小明"→"Emma"），但代码结构不变。需确认翻译范围 |
| Q4 | 题目中 `visual.params` 的文字标签（如 `cond: "score > 60"`）中，纯代码表达式部分不翻译，但如果有纯中文描述（如 `cond: "如果…就…"`）是否需要翻译？ | SVG标签翻译 | 建议拆分：代码表达式保留，纯文字描述翻译。需逐题排查 |
| Q5 | 52题的三语翻译由谁完成？是否需要专业翻译人员/教育专家审校？ | 翻译质量 | 建议英语/法语翻译由双语教育背景人员完成，面向小学生用词需审校 |
| Q6 | 语言切换器在开始页（topbar隐藏）时放在哪里？是否需要单独浮动？ | UI布局 | 建议开始页时语言切换器与主题按钮一起浮动在右上角 |
| Q7 | 现有 `score-box` 有 `margin-right: 46px`（行117，给主题按钮留空间），新增语言切换器后空间是否足够？是否需要调整topbar布局？ | UI布局 | 需调整topbar间距，可能需要将主题按钮+语言切换器打包为一组 |
| Q8 | Puter.js脚本加载约多大？对首屏性能影响如何？是否需要defer/async？ | 性能 | 建议用 `defer` 或在 `DOMContentLoaded` 后加载，不阻塞首屏渲染 |
| Q9 | 题目数据量较大（52题×3语），单HTML文件是否会过大影响加载？ | 性能 | 预估增加约50-80KB（纯文本），可接受。若过大可考虑语言包懒加载（P2） |
| Q10 | 第3阶（中级）当前标注"即将开放"，三语中是否统一标注Coming soon？ | 文案一致性 | 统一处理：zh="即将开放" / en="Coming soon" / fr="Bientôt disponible" |

---

## 附录：实施优先级建议

```
Phase 1 (P0核心):
  1. 搭建i18n架构（I18N对象 + t()/tQ()/tM() 函数 + currentLang状态）
  2. 语言切换器UI + localStorage持久化
  3. UI文案三语化（renderStart/renderQuestion/renderSummary/renderUnlock等）
  4. MODULES + STAGES 三语化
  5. 题目数据增加 i18n 字段（先填翻译）
  6. TTS升级（Puter.js引入 + tts对象重构 + Fallback）
  7. TTS语言联动

Phase 2 (P1增强):
  8. 自动语言检测（navigator.language）
  9. SVG插图标签三语化（getAnimHTML + getXXXVisual）
  10. TTS加载状态提示
  11. Puter.js引擎选择优化（Neural优先）

测试验证:
  12. 三语切换完整性测试（逐页检查无遗漏）
  13. TTS双引擎测试（在线Puter / 离线Web Speech）
  14. iOS分段队列播放测试
  15. 移动端语言切换器UI测试
```
