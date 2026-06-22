# 编程小达人 — 第2阶（初级）增量 PRD

> **版本**：v1.0
> **编写人**：许清楚（产品经理）
> **日期**：2026-05-24
> **状态**：待评审

---

## 1. 项目信息

| 字段 | 内容 |
|------|------|
| Language | 中文 |
| Programming Language | 单 HTML 文件（HTML + CSS + JS，无外部依赖） |
| Project Name | kids-coding-game（增量开发） |
| 原始需求复述 | 在已上线的第1阶（入门·22题）基础上，新增第2阶（初级·30题），引入"代码阅读题"题型——学生阅读 Python 风格伪代码，预测运行结果。配套阶段解锁机制、阶段选择器、跨阶段进度暂存。 |

---

## 2. 产品定义

### 2.1 产品目标

1. **认知升级**：从第1阶"知道概念是什么"提升到第2阶"能读懂代码并预测结果"，完成从概念认知到代码理解的跨越。
2. **渐进学习**：30题7模块循序渐进，从3行简单代码到10行综合小程序，让学生在不知不觉中提升代码阅读能力。
3. **成就驱动**：通过阶段解锁 + 星级评价 + 模块掌握度可视化，建立持续学习动力。

### 2.2 用户故事

| # | 角色 | 故事 |
|---|------|------|
| US1 | 学生 | 答完第1阶22题后，如果正确率≥60%，系统弹出"恭喜解锁初级阶段"提示 |
| US2 | 学生 | 我可以在阶段选择页面自由切换已解锁的阶段（入门/初级） |
| US3 | 学生 | 第2阶的题目会展示一段 Python 代码，让我预测代码运行后的输出 |
| US4 | 学生 | 答错后能看到代码逐行解析，帮助我理解为什么是这个结果 |
| US5 | 学生 | 我的进度（当前阶段+题号+分数）会被保存，下次打开可以继续 |
| US6 | 学生 | 答完第2阶30题后能看到星级评价和各模块掌握情况 |

---

## 3. 需求池

### P0（必须实现）

| # | 需求 | 描述 |
|---|------|------|
| P0-1 | 30题题库设计 | 7模块30题，每题含 module/concept/question/code/options/answer/explain/visual 字段 |
| P0-2 | 代码阅读题交互 | 题目区展示 Python 伪代码（`<pre><code>` + 语法高亮），问题为"运行后输出什么？"，4选项，反馈区展示逐行解析 |
| P0-3 | 阶段解锁机制 | 第1阶答完后计算正确率，≥60% 解锁第2阶，localStorage 记录 `unlocked` 数组 |
| P0-4 | 阶段选择器 | 开始页显示阶段卡片（入门/初级/中级），已解锁可点击，未解锁灰显+锁图标 |
| P0-5 | 跨阶段进度暂存 | localStorage 升级为 `{ stage, qIndex, score, moduleScore, unlocked }` 结构，续玩恢复到对应阶段 |

### P1（应该实现）

| # | 需求 | 描述 |
|---|------|------|
| P1-1 | 星级评价升级 | 每阶段答完后显示星级：≥90%→⭐⭐⭐ / ≥70%→⭐⭐ / ≥60%→⭐ / <60%→无星 |
| P1-2 | 成绩页阶段总览 | 成绩页显示各阶段总览卡片（阶段名/得分/星级） |
| P1-3 | 新模块插图 | 模块6（代码阅读）：小机器人捧书阅读；模块11（列表）：小机器人面前排彩色格子 |

### P2（可以做）

| # | 需求 | 描述 |
|---|------|------|
| P2-1 | 阶段切换动画 | 切换阶段时的过渡动画 |
| P2-2 | 答题历史回顾 | 查看本次答题的逐题记录 |

---

## 4. 30题题库设计

### 模块分布

| 模块ID | 名称 | 题数 | 核心知识点 |
|--------|------|------|-----------|
| 6 | 代码阅读基础 | 4 | 顺序执行、逐行跟踪、print输出预测 |
| 7 | 变量进阶 | 4 | 变量重新赋值、多变量运算、赋值链、变量交换 |
| 8 | 条件进阶 | 5 | if-else完整逻辑、elif多分支、嵌套if、and/or逻辑运算符 |
| 9 | 循环进阶 | 5 | for遍历、range范围、累加器、循环+条件、while计数 |
| 10 | 函数进阶 | 4 | 带参函数返回值、多参数、函数调用链、print与return区别 |
| 11 | 列表入门 | 4 | 创建列表、索引访问、len()、append() |
| 12 | 综合小案例 | 4 | 猜数字、成绩判断、倒计时、购物计算 |
| | **合计** | **30** | |

> 语法高亮色系沿用现有 CSS：`.kw`(关键字紫色) / `.num`(数字橙色) / `.str`(字符串绿色) / `.fn`(函数名蓝色) / `.cmt`(注释灰色)

---

### 模块6：代码阅读基础（4题）

#### Q1 — 顺序执行：变量赋值 + print

```json
{
  "stage": 2,
  "module": 6,
  "visual": { "type": "reading", "params": { "mode": "basic" } },
  "concept": "读代码就像读故事——从上往下一行一行读。每行代码按顺序执行，前面的结果会影响后面。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">name</span> = <span class=\"str\">\"小明\"</span>\n<span class=\"fn\">print</span>(name)",
  "options": [
    { "letter": "A", "text": "name" },
    { "letter": "B", "text": "小明" },
    { "letter": "C", "text": "print(name)" },
    { "letter": "D", "text": "会报错" }
  ],
  "answer": 1,
  "explain": "第1行把\"小明\"存入变量name，第2行 print(name) 会输出变量name里的值，也就是\"小明\"。注意：print 输出的是变量的值，不是变量名！"
}
```

#### Q2 — 多个 print 的执行顺序

```json
{
  "stage": 2,
  "module": 6,
  "visual": { "type": "reading", "params": { "mode": "sequence" } },
  "concept": "代码从上到下依次执行。每个 print 会单独输出一行，所以三个 print 就是三行输出。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"fn\">print</span>(<span class=\"str\">\"第一\"</span>)\n<span class=\"fn\">print</span>(<span class=\"str\">\"第二\"</span>)\n<span class=\"fn\">print</span>(<span class=\"str\">\"第三\"</span>)",
  "options": [
    { "letter": "A", "text": "第三 第二 第一" },
    { "letter": "B", "text": "第一\\n第二\\n第三（分三行）" },
    { "letter": "C", "text": "第一第二第三（连在一起）" },
    { "letter": "D", "text": "只输出\"第一\"" }
  ],
  "answer": 1,
  "explain": "代码从上到下依次执行，每个 print 输出一行。所以按顺序输出三行：\"第一\"、\"第二\"、\"第三\"。"
}
```

#### Q3 — 变量在 print 中参与运算

```json
{
  "stage": 2,
  "module": 6,
  "visual": { "type": "reading", "params": { "mode": "calc" } },
  "concept": "print 里的表达式会先计算，再输出结果。print(x + y) 不是输出\"x + y\"这几个字，而是输出计算后的数字。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">x</span> = <span class=\"num\">3</span>\n<span class=\"kw\">y</span> = <span class=\"num\">4</span>\n<span class=\"fn\">print</span>(x + y)",
  "options": [
    { "letter": "A", "text": "x + y" },
    { "letter": "B", "text": "7" },
    { "letter": "C", "text": "34" },
    { "letter": "D", "text": "3 + 4" }
  ],
  "answer": 1,
  "explain": "x=3，y=4。print(x+y) 先计算 3+4=7，再输出 7。注意不是\"34\"——那是字符串拼接，而这里是数字加法。"
}
```

#### Q4 — 变量自更新后再输出

```json
{
  "stage": 2,
  "module": 6,
  "visual": { "type": "reading", "params": { "mode": "update" } },
  "concept": "变量可以\"自我更新\"：score = score + 10 的意思是\"在原来的基础上加10\"。要先算右边，再赋值给左边。",
  "question": "上面代码运行后，输出的结果是？",
  "code": "<span class=\"kw\">score</span> = <span class=\"num\">50</span>\n<span class=\"kw\">score</span> = score + <span class=\"num\">10</span>\n<span class=\"fn\">print</span>(score)",
  "options": [
    { "letter": "A", "text": "50" },
    { "letter": "B", "text": "10" },
    { "letter": "C", "text": "60" },
    { "letter": "D", "text": "5010" }
  ],
  "answer": 2,
  "explain": "第1行 score=50。第2行 score=score+10：先算右边 50+10=60，再存回 score。所以最终 score=60。常见错误是选\"5010\"——那是字符串拼接，这里是数字加法。"
}
```

---

### 模块7：变量进阶（4题）

#### Q5 — 变量赋值链（b 跟着 a 变吗？）

```json
{
  "stage": 2,
  "module": 7,
  "visual": { "type": "variable", "params": { "varName": "b", "values": ["5"] } },
  "concept": "b = a 是把 a 当前的值抄一份给 b。之后 a 怎么变，b 都不会跟着变——就像抄完笔记后，原书改了，你的笔记不会自动改。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">a</span> = <span class=\"num\">5</span>\n<span class=\"kw\">b</span> = a\n<span class=\"kw\">a</span> = <span class=\"num\">10</span>\n<span class=\"fn\">print</span>(b)",
  "options": [
    { "letter": "A", "text": "10" },
    { "letter": "B", "text": "5" },
    { "letter": "C", "text": "15" },
    { "letter": "D", "text": "会报错" }
  ],
  "answer": 1,
  "explain": "第1行 a=5，第2行 b=a 所以 b=5（抄了 a 当时的值），第3行 a 变成 10——但 b 已经保存了 5，不会跟着变！所以输出 5。"
}
```

#### Q6 — 多变量运算

```json
{
  "stage": 2,
  "module": 7,
  "visual": { "type": "variable", "params": { "varName": "c", "values": ["12"] } },
  "concept": "多个变量可以一起参与运算。c = a * b 就是把 a 和 b 相乘的结果存入 c。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">a</span> = <span class=\"num\">3</span>\n<span class=\"kw\">b</span> = <span class=\"num\">4</span>\n<span class=\"kw\">c</span> = a * b\n<span class=\"fn\">print</span>(c)",
  "options": [
    { "letter": "A", "text": "7" },
    { "letter": "B", "text": "12" },
    { "letter": "C", "text": "34" },
    { "letter": "D", "text": "a * b" }
  ],
  "answer": 1,
  "explain": "a=3，b=4，c=a*b 即 3×4=12，所以输出 12。干扰项\"34\"是字符串拼接的结果，这里是数字乘法。"
}
```

#### Q7 — 变量交换（经典 temp 法）

```json
{
  "stage": 2,
  "module": 7,
  "visual": { "type": "variable", "params": { "varName": "swap", "values": ["a=2, b=1"] } },
  "concept": "交换两个变量的值需要一个\"临时帮手\"temp。就像两杯水（一杯可乐、一杯果汁）要交换，得先拿一个空杯子倒一下。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">a</span> = <span class=\"num\">1</span>\n<span class=\"kw\">b</span> = <span class=\"num\">2</span>\n<span class=\"kw\">temp</span> = a\n<span class=\"kw\">a</span> = b\n<span class=\"kw\">b</span> = temp\n<span class=\"fn\">print</span>(a, b)",
  "options": [
    { "letter": "A", "text": "1 2" },
    { "letter": "B", "text": "2 1" },
    { "letter": "C", "text": "1 1" },
    { "letter": "D", "text": "2 2" }
  ],
  "answer": 1,
  "explain": "这是经典的变量交换！temp 先保存 a 的值(1)，然后 a 拿走 b 的值(2)，最后 b 从 temp 拿回原来的1。所以 a=2, b=1，输出\"2 1\"。"
}
```

#### Q8 — 变量连续自增

```json
{
  "stage": 2,
  "module": 7,
  "visual": { "type": "variable", "params": { "varName": "n", "values": ["0→1→2→3"] } },
  "concept": "n = n + 1 就像计步器，每走一步加1。执行3次就从0变成3。这种\"每次加1\"的模式在计数时非常常用。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">n</span> = <span class=\"num\">0</span>\n<span class=\"kw\">n</span> = n + <span class=\"num\">1</span>\n<span class=\"kw\">n</span> = n + <span class=\"num\">1</span>\n<span class=\"kw\">n</span> = n + <span class=\"num\">1</span>\n<span class=\"fn\">print</span>(n)",
  "options": [
    { "letter": "A", "text": "0" },
    { "letter": "B", "text": "1" },
    { "letter": "C", "text": "3" },
    { "letter": "D", "text": "111" }
  ],
  "answer": 2,
  "explain": "n 从0开始，每次 n=n+1 让 n 增加1。加了3次：0+1=1，1+1=2，2+1=3。所以输出3。不是\"111\"——那是字符串拼接。"
}
```

---

### 模块8：条件进阶（5题）

#### Q9 — if-else 完整逻辑

```json
{
  "stage": 2,
  "module": 8,
  "visual": { "type": "condition", "params": { "cond": "age >= 18", "takePath": "right" } },
  "concept": "if-else 像岔路口：条件成立走 if，不成立走 else，两条路必选其一。读代码时先判断条件是真是假，再决定走哪条路。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">age</span> = <span class=\"num\">10</span>\n<span class=\"kw\">if</span> age &gt;= <span class=\"num\">18</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"成年\"</span>)\n<span class=\"kw\">else</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"未成年\"</span>)",
  "options": [
    { "letter": "A", "text": "成年" },
    { "letter": "B", "text": "未成年" },
    { "letter": "C", "text": "成年 未成年" },
    { "letter": "D", "text": "什么都不输出" }
  ],
  "answer": 1,
  "explain": "age=10，10>=18 为假(False)，所以执行 else 里的代码，输出\"未成年\"。if 和 else 只会执行其中一个，不会都执行。"
}
```

#### Q10 — elif 多分支

```json
{
  "stage": 2,
  "module": 8,
  "visual": { "type": "condition", "params": { "cond": "elif 链", "takePath": "middle" } },
  "concept": "elif 就像\"再如果\"。从上到下依次检查，找到第一个满足的条件就执行，后面的不再检查。就像考试分等级：先看够不够90，不够再看够不够80……",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">score</span> = <span class=\"num\">85</span>\n<span class=\"kw\">if</span> score &gt;= <span class=\"num\">90</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"优秀\"</span>)\n<span class=\"kw\">elif</span> score &gt;= <span class=\"num\">80</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"良好\"</span>)\n<span class=\"kw\">else</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"加油\"</span>)",
  "options": [
    { "letter": "A", "text": "优秀" },
    { "letter": "B", "text": "良好" },
    { "letter": "C", "text": "加油" },
    { "letter": "D", "text": "优秀 良好 加油" }
  ],
  "answer": 1,
  "explain": "score=85。先检查 >=90？不满足。再检查 >=80？满足！输出\"良好\"，后面的 else 不再执行。elif 从上到下找到第一个满足的就停止。"
}
```

#### Q11 — 嵌套 if

```json
{
  "stage": 2,
  "module": 8,
  "visual": { "type": "condition", "params": { "cond": "嵌套判断", "takePath": "left" } },
  "concept": "if 里面还可以再套 if，就像\"大盒子里装小盒子\"。先过第一关（外层 if），再过第二关（内层 if），两层都满足才执行最里面的代码。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">x</span> = <span class=\"num\">7</span>\n<span class=\"kw\">if</span> x &gt; <span class=\"num\">5</span>:\n    <span class=\"kw\">if</span> x &lt; <span class=\"num\">10</span>:\n        <span class=\"fn\">print</span>(<span class=\"str\">\"在5和10之间\"</span>)\n    <span class=\"kw\">else</span>:\n        <span class=\"fn\">print</span>(<span class=\"str\">\"大于等于10\"</span>)\n<span class=\"kw\">else</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"小于等于5\"</span>)",
  "options": [
    { "letter": "A", "text": "在5和10之间" },
    { "letter": "B", "text": "大于等于10" },
    { "letter": "C", "text": "小于等于5" },
    { "letter": "D", "text": "什么都不输出" }
  ],
  "answer": 0,
  "explain": "x=7。先过第一关 x>5？7>5 为真，进入外层 if。再过第二关 x<10？7<10 为真，输出\"在5和10之间\"。"
}
```

#### Q12 — and 逻辑运算符

```json
{
  "stage": 2,
  "module": 8,
  "visual": { "type": "condition", "params": { "cond": "A and B", "takePath": "left" } },
  "concept": "and 表示\"并且\"——两个条件都满足才为真。就像\"有票并且满12岁才能看这部电影\"，缺一个都不行。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">has_ticket</span> = <span class=\"kw\">True</span>\n<span class=\"kw\">age</span> = <span class=\"num\">12</span>\n<span class=\"kw\">if</span> has_ticket <span class=\"kw\">and</span> age &gt;= <span class=\"num\">12</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"可以入场\"</span>)\n<span class=\"kw\">else</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"不能入场\"</span>)",
  "options": [
    { "letter": "A", "text": "可以入场" },
    { "letter": "B", "text": "不能入场" },
    { "letter": "C", "text": "会报错" },
    { "letter": "D", "text": "什么都不输出" }
  ],
  "answer": 0,
  "explain": "and 要求两个条件都为真。has_ticket=True ✓，age=12>=12 ✓，两个都满足，所以输出\"可以入场\"。如果任意一个不满足，就会走 else。"
}
```

#### Q13 — or 逻辑运算符

```json
{
  "stage": 2,
  "module": 8,
  "visual": { "type": "condition", "params": { "cond": "A or B", "takePath": "left" } },
  "concept": "or 表示\"或者\"——只要有一个条件满足就为真。就像\"周末或者放假就不用上学\"，满足任意一个就行。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">is_weekend</span> = <span class=\"kw\">False</span>\n<span class=\"kw\">is_holiday</span> = <span class=\"kw\">True</span>\n<span class=\"kw\">if</span> is_weekend <span class=\"kw\">or</span> is_holiday:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"不用上学\"</span>)\n<span class=\"kw\">else</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"要上学\"</span>)",
  "options": [
    { "letter": "A", "text": "不用上学" },
    { "letter": "B", "text": "要上学" },
    { "letter": "C", "text": "不用上学 要上学" },
    { "letter": "D", "text": "会报错" }
  ],
  "answer": 0,
  "explain": "or 只要有一个为真就为真。is_weekend=False ✗，但 is_holiday=True ✓，有一个满足就行，所以输出\"不用上学\"。"
}
```

---

### 模块9：循环进阶（5题）

#### Q14 — for 循环遍历输出

```json
{
  "stage": 2,
  "module": 9,
  "visual": { "type": "loop", "params": { "count": 3 } },
  "concept": "for i in range(3) 会让 i 依次取 0、1、2（从0开始，不包含3）。循环体里的 print(i) 会执行3次，每次打印当前的 i 值。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">for</span> i <span class=\"kw\">in</span> <span class=\"fn\">range</span>(<span class=\"num\">3</span>):\n    <span class=\"fn\">print</span>(i)",
  "options": [
    { "letter": "A", "text": "1 2 3" },
    { "letter": "B", "text": "0 1 2" },
    { "letter": "C", "text": "0 1 2 3" },
    { "letter": "D", "text": "3" }
  ],
  "answer": 1,
  "explain": "range(3) 生成 0、1、2 三个数（从0开始，不包含3）。循环3次，i 依次为 0、1、2，所以输出 0、1、2（分三行）。"
}
```

#### Q15 — range(start, end) 范围

```json
{
  "stage": 2,
  "module": 9,
  "visual": { "type": "loop", "params": { "count": 3 } },
  "concept": "range(2, 5) 从2开始到5结束，但不包含5！生成 2、3、4。就像\"从第2页读到第5页前\"——读到第4页就停。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">for</span> i <span class=\"kw\">in</span> <span class=\"fn\">range</span>(<span class=\"num\">2</span>, <span class=\"num\">5</span>):\n    <span class=\"fn\">print</span>(i)",
  "options": [
    { "letter": "A", "text": "2 3 4 5" },
    { "letter": "B", "text": "2 3 4" },
    { "letter": "C", "text": "2 3" },
    { "letter": "D", "text": "0 1 2 3 4" }
  ],
  "answer": 1,
  "explain": "range(2, 5) 从2开始到5结束（不包含5），生成 2、3、4。所以输出 2、3、4。记住口诀：\"包含开头，不包含结尾\"。"
}
```

#### Q16 — 累加器

```json
{
  "stage": 2,
  "module": 9,
  "visual": { "type": "loop", "params": { "count": 3 } },
  "concept": "累加器是编程最常用的模式之一：先用一个变量存0，然后在循环里不断往上加。就像存钱罐，每循环一次就投一枚硬币进去。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">total</span> = <span class=\"num\">0</span>\n<span class=\"kw\">for</span> i <span class=\"kw\">in</span> <span class=\"fn\">range</span>(<span class=\"num\">1</span>, <span class=\"num\">4</span>):\n    total = total + i\n<span class=\"fn\">print</span>(total)",
  "options": [
    { "letter": "A", "text": "6" },
    { "letter": "B", "text": "10" },
    { "letter": "C", "text": "3" },
    { "letter": "D", "text": "0" }
  ],
  "answer": 0,
  "explain": "total 从0开始。range(1,4) 生成 1、2、3。i=1时 total=0+1=1；i=2时 total=1+2=3；i=3时 total=3+3=6。所以输出6。"
}
```

#### Q17 — 循环 + 条件

```json
{
  "stage": 2,
  "module": 9,
  "visual": { "type": "loop", "params": { "count": 5 } },
  "concept": "循环里面可以放 if，就像\"从1数到10，只把偶数说出来\"。每次循环都先判断条件，满足才执行 print。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">for</span> i <span class=\"kw\">in</span> <span class=\"fn\">range</span>(<span class=\"num\">5</span>):\n    <span class=\"kw\">if</span> i &gt; <span class=\"num\">2</span>:\n        <span class=\"fn\">print</span>(i)",
  "options": [
    { "letter": "A", "text": "0 1 2 3 4" },
    { "letter": "B", "text": "3 4" },
    { "letter": "C", "text": "0 1 2" },
    { "letter": "D", "text": "2 3 4" }
  ],
  "answer": 1,
  "explain": "i 依次取 0、1、2、3、4。每次先判断 i>2：0>2✗ 1>2✗ 2>2✗ 3>2✓打印3 4>2✓打印4。所以只输出3和4。"
}
```

#### Q18 — while 循环计数

```json
{
  "stage": 2,
  "module": 9,
  "visual": { "type": "loop", "params": { "count": 3 } },
  "concept": "while 循环在条件为真时一直执行。每次循环体里要让条件逐渐变成假，否则就死循环了。这里 count 每次加1，加到3就不满足 <3 了。",
  "question": "上面代码会打印几次\"嗨\"？",
  "code": "<span class=\"kw\">count</span> = <span class=\"num\">0</span>\n<span class=\"kw\">while</span> count &lt; <span class=\"num\">3</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"嗨\"</span>)\n    count = count + <span class=\"num\">1</span>",
  "options": [
    { "letter": "A", "text": "1次" },
    { "letter": "B", "text": "2次" },
    { "letter": "C", "text": "3次" },
    { "letter": "D", "text": "无限次" }
  ],
  "answer": 2,
  "explain": "count=0：0<3✓ 打印\"嗨\"，count变1。count=1：1<3✓ 打印，count变2。count=2：2<3✓ 打印，count变3。count=3：3<3✗ 停止。共打印3次。"
}
```

---

### 模块10：函数进阶（4题）

#### Q19 — 带参函数返回值

```json
{
  "stage": 2,
  "module": 10,
  "visual": { "type": "function", "params": { "input": "3, 5", "output": "8" } },
  "concept": "调用函数时，参数会被传入函数内部。add(3, 5) 就是把3给a、5给b，函数计算 a+b=8 并 return 返回。调用者用 result 接住返回值。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">def</span> <span class=\"fn\">add</span>(a, b):\n    <span class=\"kw\">return</span> a + b\n\nresult = <span class=\"fn\">add</span>(<span class=\"num\">3</span>, <span class=\"num\">5</span>)\n<span class=\"fn\">print</span>(result)",
  "options": [
    { "letter": "A", "text": "3" },
    { "letter": "B", "text": "5" },
    { "letter": "C", "text": "8" },
    { "letter": "D", "text": "35" }
  ],
  "answer": 2,
  "explain": "调用 add(3, 5)，a=3, b=5，函数返回 3+5=8。result 接住返回值8。print(result) 输出8。不是\"35\"——那是字符串拼接。"
}
```

#### Q20 — 多参数函数

```json
{
  "stage": 2,
  "module": 10,
  "visual": { "type": "function", "params": { "input": "\"小明\", 12", "output": "\"小明12\"" } },
  "concept": "函数可以有多个参数，按顺序对应。name 是第1个参数，age 是第2个。str(12) 把数字12变成文字\"12\"，这样才能和\"小明\"拼在一起。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">def</span> <span class=\"fn\">greet</span>(name, age):\n    <span class=\"kw\">return</span> name + <span class=\"fn\">str</span>(age)\n\n<span class=\"fn\">print</span>(<span class=\"fn\">greet</span>(<span class=\"str\">\"小明\"</span>, <span class=\"num\">12</span>))",
  "options": [
    { "letter": "A", "text": "小明" },
    { "letter": "B", "text": "12" },
    { "letter": "C", "text": "小明12" },
    { "letter": "D", "text": "nameage" }
  ],
  "answer": 2,
  "explain": "调用 greet(\"小明\", 12)，name=\"小明\"，age=12。str(12) 把数字变文字\"12\"，\"小明\"+\"12\"拼接成\"小明12\"。"
}
```

#### Q21 — 函数调用链

```json
{
  "stage": 2,
  "module": 10,
  "visual": { "type": "function", "params": { "input": "3→6→12", "output": "12" } },
  "concept": "函数的返回值可以继续作为另一个函数的输入，就像工厂流水线：第一个工厂的产品送给第二个工厂再加工。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">def</span> <span class=\"fn\">double</span>(n):\n    <span class=\"kw\">return</span> n * <span class=\"num\">2</span>\n\nx = <span class=\"fn\">double</span>(<span class=\"num\">3</span>)\ny = <span class=\"fn\">double</span>(x)\n<span class=\"fn\">print</span>(y)",
  "options": [
    { "letter": "A", "text": "6" },
    { "letter": "B", "text": "12" },
    { "letter": "C", "text": "4" },
    { "letter": "D", "text": "3" }
  ],
  "answer": 1,
  "explain": "double(3) 返回 3×2=6，x=6。double(x) 即 double(6) 返回 6×2=12，y=12。所以输出12。函数的结果可以继续传给下一个函数！"
}
```

#### Q22 — print 与 return 的区别

```json
{
  "stage": 2,
  "module": 10,
  "visual": { "type": "function", "params": { "input": "无", "output": "None" } },
  "concept": "print 是\"显示在屏幕上\"，return 是\"把结果交给调用者\"。没有 return 的函数返回 None（空值）。这是初学者最容易混淆的概念！",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">def</span> <span class=\"fn\">say_hi</span>():\n    <span class=\"fn\">print</span>(<span class=\"str\">\"你好\"</span>)\n\nresult = <span class=\"fn\">say_hi</span>()\n<span class=\"fn\">print</span>(result)",
  "options": [
    { "letter": "A", "text": "你好" },
    { "letter": "B", "text": "你好\\nNone（分两行）" },
    { "letter": "C", "text": "None" },
    { "letter": "D", "text": "会报错" }
  ],
  "answer": 1,
  "explain": "调用 say_hi() 先执行函数内的 print(\"你好\")，输出\"你好\"。但函数没有 return，所以返回 None。result=None，print(result) 输出 None。总共两行：\"你好\"和\"None\"。"
}
```

---

### 模块11：列表入门（4题）

#### Q23 — 创建列表并输出

```json
{
  "stage": 2,
  "module": 11,
  "visual": { "type": "list", "params": { "items": ["苹果", "香蕉", "橘子"] } },
  "concept": "列表就像购物清单——用方括号 [] 把多个数据按顺序放在一起，用逗号隔开。print 输出整个列表时会带上方括号和引号。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">fruits</span> = [<span class=\"str\">\"苹果\"</span>, <span class=\"str\">\"香蕉\"</span>, <span class=\"str\">\"橘子\"</span>]\n<span class=\"fn\">print</span>(fruits)",
  "options": [
    { "letter": "A", "text": "苹果" },
    { "letter": "B", "text": "苹果 香蕉 橘子" },
    { "letter": "C", "text": "['苹果', '香蕉', '橘子']" },
    { "letter": "D", "text": "会报错" }
  ],
  "answer": 2,
  "explain": "print 输出整个列表时，会显示完整的方括号和引号格式。所以输出 ['苹果', '香蕉', '橘子']。"
}
```

#### Q24 — 索引访问（从0开始！）

```json
{
  "stage": 2,
  "module": 11,
  "visual": { "type": "list", "params": { "items": ["红", "黄", "蓝", "绿"], "highlight": 1 } },
  "concept": "列表的编号从0开始！第1个元素是[0]，第2个是[1]，第3个是[2]……这是编程和生活的最大区别——程序员数数从0开始！",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">colors</span> = [<span class=\"str\">\"红\"</span>, <span class=\"str\">\"黄\"</span>, <span class=\"str\">\"蓝\"</span>, <span class=\"str\">\"绿\"</span>]\n<span class=\"fn\">print</span>(colors[<span class=\"num\">1</span>])",
  "options": [
    { "letter": "A", "text": "红" },
    { "letter": "B", "text": "黄" },
    { "letter": "C", "text": "蓝" },
    { "letter": "D", "text": "1" }
  ],
  "answer": 1,
  "explain": "列表索引从0开始！colors[0]=\"红\"，colors[1]=\"黄\"，colors[2]=\"蓝\"。所以 colors[1] 输出\"黄\"。这是初学者最常犯的错——别忘了从0开始数！"
}
```

#### Q25 — len() 获取列表长度

```json
{
  "stage": 2,
  "module": 11,
  "visual": { "type": "list", "params": { "items": ["10", "20", "30", "40", "50"], "showLen": true } },
  "concept": "len() 函数用来数列表里有几个元素。就像数教室里有几个同学一样，len() 帮你数一下列表的长度。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">nums</span> = [<span class=\"num\">10</span>, <span class=\"num\">20</span>, <span class=\"num\">30</span>, <span class=\"num\">40</span>, <span class=\"num\">50</span>]\n<span class=\"fn\">print</span>(<span class=\"fn\">len</span>(nums))",
  "options": [
    { "letter": "A", "text": "5" },
    { "letter": "B", "text": "50" },
    { "letter": "C", "text": "10" },
    { "letter": "D", "text": "150" }
  ],
  "answer": 0,
  "explain": "len() 数的是列表里有几个元素，不是元素的值。nums 有5个元素（10、20、30、40、50），所以 len(nums)=5。"
}
```

#### Q26 — append() 添加元素

```json
{
  "stage": 2,
  "module": 11,
  "visual": { "type": "list", "params": { "items": ["语文", "数学", "英语"], "appendMode": true } },
  "concept": "append() 像往购物车里加东西——在列表末尾添加一个新元素。原列表会被改变，新元素排在最后面。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">books</span> = [<span class=\"str\">\"语文\"</span>, <span class=\"str\">\"数学\"</span>]\nbooks.<span class=\"fn\">append</span>(<span class=\"str\">\"英语\"</span>)\n<span class=\"fn\">print</span>(books)",
  "options": [
    { "letter": "A", "text": "['语文', '数学']" },
    { "letter": "B", "text": "['语文', '数学', '英语']" },
    { "letter": "C", "text": "['英语']" },
    { "letter": "D", "text": "会报错" }
  ],
  "answer": 1,
  "explain": "append() 在列表末尾添加元素。原列表 [\"语文\", \"数学\"]，添加\"英语\"后变成 [\"语文\", \"数学\", \"英语\"]。"
}
```

---

### 模块12：综合小案例（4题）

#### Q27 — 猜数字游戏片段

```json
{
  "stage": 2,
  "module": 12,
  "visual": { "type": "reading", "params": { "mode": "game" } },
  "concept": "猜数字游戏的核心逻辑：用 if-elif-else 判断玩家猜的数和答案的关系。== 是判断相等，< 是判断小于，> 是判断大于。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">answer</span> = <span class=\"num\">7</span>\n<span class=\"kw\">guess</span> = <span class=\"num\">5</span>\n<span class=\"kw\">if</span> guess == answer:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"猜对了\"</span>)\n<span class=\"kw\">elif</span> guess &lt; answer:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"小了\"</span>)\n<span class=\"kw\">else</span>:\n    <span class=\"fn\">print</span>(<span class=\"str\">\"大了\"</span>)",
  "options": [
    { "letter": "A", "text": "猜对了" },
    { "letter": "B", "text": "小了" },
    { "letter": "C", "text": "大了" },
    { "letter": "D", "text": "什么都不输出" }
  ],
  "answer": 1,
  "explain": "answer=7，guess=5。先检查 5==7？不满足。再检查 5<7？满足！输出\"小了\"。这就是猜数字游戏的核心判断逻辑。"
}
```

#### Q28 — 成绩等级判断程序

```json
{
  "stage": 2,
  "module": 12,
  "visual": { "type": "reading", "params": { "mode": "grade" } },
  "concept": "成绩分等级是 elif 的典型应用。从高到低依次判断，找到第一个满足的等级就停止。注意 75 不满足 >=80，但满足 >=60。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">score</span> = <span class=\"num\">75</span>\n<span class=\"kw\">if</span> score &gt;= <span class=\"num\">90</span>:\n    grade = <span class=\"str\">\"A\"</span>\n<span class=\"kw\">elif</span> score &gt;= <span class=\"num\">80</span>:\n    grade = <span class=\"str\">\"B\"</span>\n<span class=\"kw\">elif</span> score &gt;= <span class=\"num\">60</span>:\n    grade = <span class=\"str\">\"C\"</span>\n<span class=\"kw\">else</span>:\n    grade = <span class=\"str\">\"D\"</span>\n<span class=\"fn\">print</span>(grade)",
  "options": [
    { "letter": "A", "text": "A" },
    { "letter": "B", "text": "B" },
    { "letter": "C", "text": "C" },
    { "letter": "D", "text": "D" }
  ],
  "answer": 2,
  "explain": "score=75。>=90? 否。>=80? 否。>=60? 是！grade=\"C\"。elif 从上到下找到第一个满足的就停止，后面的不再检查。"
}
```

#### Q29 — 倒计时程序

```json
{
  "stage": 2,
  "module": 12,
  "visual": { "type": "loop", "params": { "count": 3 } },
  "concept": "range(3, 0, -1) 第3个参数-1表示每次减1。从3开始倒数到1（不包含0），就像火箭发射倒计时！循环结束后再执行外面的 print。",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">for</span> i <span class=\"kw\">in</span> <span class=\"fn\">range</span>(<span class=\"num\">3</span>, <span class=\"num\">0</span>, <span class=\"num\">-1</span>):\n    <span class=\"fn\">print</span>(i)\n<span class=\"fn\">print</span>(<span class=\"str\">\"发射！\"</span>)",
  "options": [
    { "letter": "A", "text": "3 2 1 发射！" },
    { "letter": "B", "text": "3 2 1 0 发射！" },
    { "letter": "C", "text": "1 2 3 发射！" },
    { "letter": "D", "text": "0 1 2 3 发射！" }
  ],
  "answer": 0,
  "explain": "range(3, 0, -1) 从3开始每次减1，到0停止（不包含0），生成 3、2、1。循环打印 3、2、1，循环结束后打印\"发射！\"。注意\"发射！\"在循环外面，只执行一次。"
}
```

#### Q30 — 购物总价计算程序

```json
{
  "stage": 2,
  "module": 12,
  "visual": { "type": "list", "params": { "items": ["5", "3", "8"], "showSum": true } },
  "concept": "这段代码用\"循环 + 累加器\"计算购物总价。for price in prices 会依次取出列表里的每个价格，加到 total 上。这是编程中最实用的模式之一！",
  "question": "上面代码运行后会输出什么？",
  "code": "<span class=\"kw\">prices</span> = [<span class=\"num\">5</span>, <span class=\"num\">3</span>, <span class=\"num\">8</span>]\n<span class=\"kw\">total</span> = <span class=\"num\">0</span>\n<span class=\"kw\">for</span> price <span class=\"kw\">in</span> prices:\n    total = total + price\n<span class=\"fn\">print</span>(total)",
  "options": [
    { "letter": "A", "text": "5 3 8" },
    { "letter": "B", "text": "16" },
    { "letter": "C", "text": "538" },
    { "letter": "D", "text": "3" }
  ],
  "answer": 1,
  "explain": "total 从0开始。price=5时 total=0+5=5；price=3时 total=5+3=8；price=8时 total=8+8=16。所以输出16。这就是\"累加器\"在购物计算中的实际应用！"
}
```

---

## 5. 新题型"代码阅读题"交互设计

### 5.1 页面结构（从上到下）

```
┌─────────────────────────────────────┐
│  [模块标签]              [分数] [🔊] │  ← 顶部状态栏（复用现有）
│  ━━━━━━━━━━━━━━━━━━━━━ 进度条       │
├─────────────────────────────────────┤
│  第 1 题 / 共30题                    │  ← 题号
│                                     │
│  ┌─ 概念提示（浅色卡片）──────────┐  │  ← concept 字段
│  │ 读代码就像读故事——从上往下一行一行读 │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ SVG 漫画插图 ─────────────────┐  │  ← visual 字段
│  │  🤖 捧着书在阅读                │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ 代码块（深色背景 + 语法高亮）──┐  │  ← code 字段
│  │  name = "小明"                  │  │     <pre><code> 渲染
│  │  print(name)                    │  │     左边框模块色
│  └───────────────────────────────┘  │
│                                     │
│  上面代码运行后会输出什么？          │  ← question 字段
│                                     │
│  ┌─────────┐ ┌─────────┐           │  ← 4个选项（复用现有样式）
│  │ A. name │ │ B. 小明 │           │
│  └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐           │
│  │ C. ...  │ │ D. ...  │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  ┌─ 答题反馈区（答后显示）─────────┐  │
│  │ ✅ 答对了 / ❌ 答错了没关系     │  │
│  │ 解析：第一行把"小明"存入变量...  │  │  ← explain 字段
│  │ 🔊 朗读解析                     │  │
│  └───────────────────────────────┘  │
│                                     │
│         [ 下一题 ]                  │
└─────────────────────────────────────┘
```

### 5.2 交互流程

1. **展示阶段**：题目区按顺序渲染 概念提示 → SVG插图 → 代码块 → 问题文字 → 4选项
2. **答题阶段**：点击选项后，正确项标绿、错误项标红，反馈区展开显示解析
3. **反馈阶段**：解析文字使用口语化表达，对代码逐行解释为什么是这个结果
4. **下一题**：点击"下一题"按钮进入下一题；最后一题显示"查看成绩"

### 5.3 代码块渲染

- 复用现有 `.code-block` CSS（深色背景 + 左边框模块色）
- `<pre>` 标签保持代码格式（缩进、换行）
- 语法高亮色系沿用：`.kw` `.num` `.str` `.fn` `.cmt`
- 代码块字体：monospace，字号 0.9rem，行高 1.6
- 移动端：代码块可横向滚动（`overflow-x: auto`），防止长行溢出

---

## 6. 阶段解锁机制

### 6.1 解锁规则

| 当前阶段 | 过关条件 | 解锁结果 |
|---------|---------|---------|
| 第1阶（入门）22题 | 正确率 ≥ 60%（≥14/22） | 解锁第2阶 |
| 第2阶（初级）30题 | 正确率 ≥ 70%（≥21/30） | 解锁第3阶 |
| 第3阶（中级）32题 | 正确率 ≥ 75%（≥24/32） | 全部通关 |

### 6.2 解锁提示弹窗

```
┌─────────────────────────────────┐
│                                 │
│          🎉 恭喜！ 🎉           │
│                                 │
│   你以 18/22 的成绩通过了        │
│       入门阶段！                 │
│                                 │
│   🔓 已解锁：初级阶段            │
│                                 │
│   [ 去初级阶段 ]  [ 再练练 ]     │
│                                 │
└─────────────────────────────────┘
```

- **通过时**：显示庆祝弹窗，两个按钮——"去下一阶段"直接进入新阶段，"再练练"留在成绩页
- **未通过时**：成绩页鼓励语提示"正确率达到60%就能解锁初级阶段，再来一次吧！"，只有"再来一次"按钮

### 6.3 阶段选择器

开始页改造为阶段选择器：

```
┌─────────────────────────────────────┐
│           💻 编程小达人              │
│      知识闯关 · 3大阶段 · 84道题     │
│                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  │  🌱 入门  │  │  📖 初级  │  │  🚀 中级  │
│  │  22题     │  │  30题     │  │  32题     │
│  │  ⭐⭐⭐   │  │  🔓 已解锁 │  │  🔒 未解锁 │
│  └──────────┘  └──────────┘  └──────────┘
│                                     │
│  上次进度：初级阶段 · 第5题 · 3分    │
│  [ 继续闯关 ]  [ 重新开始 ]          │
└─────────────────────────────────────┘
```

- 已解锁阶段：正常色卡片，可点击，显示历史最高星级
- 未解锁阶段：灰显 + 🔒 锁图标，不可点击
- 有存档时：显示"继续闯关"按钮，续玩到对应阶段对应题号

---

## 7. UI 设计稿

### 7.1 阶段选择器页面（改造 renderStart）

```
┌──────────────────────────────────────────┐
│                                          │
│    [logo]  编程小达人                     │
│    知识闯关 · 3大阶段 · 84道题             │
│                                          │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│    │  🌱      │ │  📖      │ │  🚀      │  │
│    │  入门    │ │  初级    │ │  中级    │  │
│    │  22题    │ │  30题    │ │  32题    │  │
│    │  ⭐⭐⭐  │ │  🔓      │ │  🔒      │  │
│    │  已完成  │ │  已解锁  │ │  未解锁  │  │
│    └─────────┘ └─────────┘ └─────────┘  │
│                                          │
│    上次进度：初级 · 第5题 · 3分           │
│    [ 继续闯关 ]    [ 重新开始 ]           │
│                                          │
└──────────────────────────────────────────┘
```

**交互**：
- 点击已解锁阶段卡片 → 进入该阶段（从第1题开始或从存档继续）
- 未解锁卡片灰显，点击无反应或弹出提示"完成上一阶段且正确率达标后解锁"
- "继续闯关"恢复到存档对应的阶段和题号

### 7.2 代码阅读题页面

见第5节线框图。关键差异点（与第1阶题目页对比）：
- 代码块更大、更显眼（第1阶代码只是辅助，第2阶代码是核心）
- 概念提示更简短（第2阶重点是读代码，不是学概念）
- 代码块始终展示（第1阶部分题目 code 为 null，第2阶每题都有 code）

### 7.3 解锁提示弹窗

见第6.2节线框图。弹窗为模态层，遮罩背景半透明黑色，弹窗居中白色卡片。

### 7.4 升级版成绩页（renderSummary 改造）

```
┌─────────────────────────────────────┐
│              🎓                      │
│         闯关完成！                    │
│                                     │
│         25 / 30                     │
│         ⭐⭐⭐                       │
│                                     │
│  ── 模块掌握情况 ──                  │
│  📖 代码阅读   ████░  3/4            │
│  📦 变量进阶   █████  4/4            │
│  ⚖️ 条件进阶   ████░  4/5            │
│  🔄 循环进阶   █████  5/5            │
│  🔧 函数进阶   ████░  3/4            │
│  📋 列表入门   █████  4/4            │
│  🧩 综合案例   ████░  3/4            │
│                                     │
│  ── 阶段总览 ──                      │
│  🌱 入门  20/22 ⭐⭐⭐  已通过        │
│  📖 初级  25/30 ⭐⭐⭐  已通过        │
│  🚀 中级  🔒 未解锁                  │
│                                     │
│  非常扎实！你的代码阅读能力很强！      │
│                                     │
│  [ 再来一次 ]  [ 回到首页 ]           │
└─────────────────────────────────────┘
```

---

## 8. 数据结构建议

### 8.1 MODULES 数组升级

在现有5个模块后追加7个新模块：

```javascript
var MODULES = [
  // ===== 第1阶（现有，不变）=====
  { id: 1, emoji: '📦', name: '变量',       color: '#4361ee', desc: '...', anim: 'variable' },
  { id: 2, emoji: '⚖️', name: '条件判断',    color: '#d62839', desc: '...', anim: 'condition' },
  { id: 3, emoji: '🔄', name: '循环',       color: '#e07b00', desc: '...', anim: 'loop' },
  { id: 4, emoji: '🔧', name: '函数',       color: '#2d9e6b', desc: '...', anim: 'function' },
  { id: 5, emoji: '🔍', name: '调试思维',    color: '#7c3aed', desc: '...', anim: 'bug' },
  // ===== 第2阶（新增）=====
  { id: 6,  emoji: '📖', name: '代码阅读基础', color: '#0ea5e9', desc: '学会像读故事一样读代码，从上到下一行一行理解执行顺序。', anim: 'reading' },
  { id: 7,  emoji: '📦', name: '变量进阶',    color: '#4361ee', desc: '变量可以互相赋值、连续更新，还能交换——来看看变量的进阶用法！', anim: 'variable' },
  { id: 8,  emoji: '⚖️', name: '条件进阶',    color: '#d62839', desc: 'elif 多分支、嵌套 if、and/or 逻辑运算符——让程序做更复杂的判断！', anim: 'condition' },
  { id: 9,  emoji: '🔄', name: '循环进阶',    color: '#e07b00', desc: 'range 范围、累加器、循环里加条件——循环的威力远超你的想象！', anim: 'loop' },
  { id: 10, emoji: '🔧', name: '函数进阶',    color: '#2d9e6b', desc: '带参数、有返回值、函数套函数——函数是代码复用的利器！', anim: 'function' },
  { id: 11, emoji: '📋', name: '列表入门',    color: '#ec4899', desc: '列表就像购物清单，把多个数据排成一排存放。学会创建、访问和添加元素！', anim: 'list' },
  { id: 12, emoji: '🧩', name: '综合小案例',  color: '#7c3aed', desc: '把前面学的知识串起来，读懂完整的小程序——猜数字、成绩判断、倒计时、购物计算！', anim: 'reading' }
];
```

### 8.2 QUESTIONS 数组升级

第2阶题目追加在现有22题之后，每题新增 `stage: 2` 字段：

```javascript
var QUESTIONS = [
  // ===== 第1阶（现有22题，不变）=====
  { module: 1, visual: {...}, concept: '...', question: '...', code: null, options: [...], answer: 1, explain: '...' },
  // ... 共22题 ...

  // ===== 第2阶（新增30题）=====
  {
    stage: 2,
    module: 6,
    visual: { type: 'reading', params: { mode: 'basic' } },
    concept: '读代码就像读故事——从上往下一行一行读...',
    question: '上面代码运行后会输出什么？',
    code: '<span class="kw">name</span> = <span class="str">"小明"</span>\n<span class="fn">print</span>(name)',
    options: [
      { letter: 'A', text: 'name' },
      { letter: 'B', text: '小明' },
      { letter: 'C', text: 'print(name)' },
      { letter: 'D', text: '会报错' }
    ],
    answer: 1,
    explain: '第1行把"小明"存入变量name，第2行 print(name) 会输出变量name里的值...'
  },
  // ... 共30题 ...
];
```

### 8.3 state 对象升级

```javascript
var state = {
  phase: 'start',         // start | stageSelect | intro | question | summary | unlock
  stage: 1,               // 当前阶段：1=入门 2=初级 3=中级
  qIndex: 0,              // 当前题在当前阶段内的索引（0-based）
  moduleIndex: 0,         // 当前模块在 MODULES 中的索引
  score: 0,               // 当前阶段总分
  moduleScore: [0,0,0,0,0,0,0,0,0,0,0,0], // 各模块得分（12个模块）
  answered: false,        // 当前题是否已答
  // 新增字段
  stageScore: { 1: 0, 2: 0, 3: 0 },     // 各阶段历史最高分
  stageStars: { 1: 0, 2: 0, 3: 0 },     // 各阶段历史最高星级
};
```

### 8.4 localStorage 结构升级

```javascript
// SAVE_KEY: 'coding-game-save'
{
  stage: 2,               // 当前阶段
  qIndex: 5,              // 当前题号（阶段内）
  moduleIndex: 7,         // 当前模块索引
  score: 3,               // 当前阶段已得分
  moduleScore: [0,0,0,0,0,0,0,0,0,0,0,0],  // 各模块得分
  unlocked: [1, 2],       // 已解锁的阶段列表
  stageScore: { 1: 20, 2: 3, 3: 0 },   // 各阶段历史最高分
  stageStars: { 1: 3, 2: 0, 3: 0 },    // 各阶段历史最高星级（0-3）
  ts: 1716556800000       // 时间戳
}
```

### 8.5 题目分阶段加载策略

```javascript
// 获取当前阶段的题目
function getStageQuestions(stage) {
  return QUESTIONS.filter(function(q) {
    return (q.stage || 1) === stage;
  });
}

// 获取当前阶段的模块
function getStageModules(stage) {
  if (stage === 1) return MODULES.slice(0, 5);   // 模块1-5
  if (stage === 2) return MODULES.slice(5, 12);   // 模块6-12
  if (stage === 3) return MODULES.slice(12);       // 模块13+（未来）
  return MODULES;
}
```

---

## 9. 新模块插图设计

### 9.1 模块6/12 — 代码阅读插图（新模板 `getReadingVisual`）

**场景**：橙色卡通小机器人捧着一本打开的书/卷轴在阅读，书页上显示代码符号（`<>` `{}` `print`）。

**SVG 参数**：
```javascript
function getReadingVisual(p, m) {
  // p.mode: 'basic' | 'sequence' | 'calc' | 'update' | 'game' | 'grade'
  // 小机器人坐姿/站姿 + 手捧打开的书
  // 书页上根据 mode 显示不同代码符号
  // 背景色调跟随模块色 m.color
}
```

**视觉元素**：
- 小机器人（橙色机身 + 白色屏幕脸 + 圆框眼镜），复用现有角色
- 手中捧着一本打开的书（白色书页 + 深色封面）
- 书页上显示简单代码符号（`>_` `print()` `{}`）
- 头顶有一个 💡 灯泡表示"理解了"
- 背景有浅色代码符号漂浮装饰

### 9.2 模块11 — 列表插图（新模板 `getListVisual`）

**场景**：小机器人面前排着一排彩色格子/抽屉，每个格子里放着不同颜色的球或物品。

**SVG 参数**：
```javascript
function getListVisual(p, m) {
  // p.items: ['苹果', '香蕉', '橘子']  — 格子内容
  // p.highlight: 1  — 高亮第几个格子（索引访问题用）
  // p.showLen: true  — 显示长度标签
  // p.appendMode: true  — 末尾有+号表示添加
  // p.showSum: true  — 显示求和符号
}
```

**视觉元素**：
- 小机器人（复用现有角色）站在左侧
- 面前有3-5个彩色方格（从左到右排列，颜色渐变）
- 每个格子上方标索引号（0, 1, 2, 3...）
- highlight 模式：对应格子高亮发光 + 箭头指向
- appendMode：末尾有一个虚线格 + ➕ 号
- 格子内容用 emoji 或文字表示

### 9.3 其他模块复用现有模板

| 模块 | 复用模板 | 说明 |
|------|---------|------|
| 7 变量进阶 | getVarVisual | 参数调整：展示交换/赋值链场景 |
| 8 条件进阶 | getCondVisual | 参数调整：展示 elif 分支/and/or |
| 9 循环进阶 | getLoopVisual | 参数调整：展示 range/累加器 |
| 10 函数进阶 | getFuncVisual | 参数调整：展示调用链/多参数 |

---

## 10. 关键函数改动清单

| 函数 | 改动类型 | 说明 |
|------|---------|------|
| `renderStart()` | **重写** | 改为阶段选择器，显示3个阶段卡片 |
| `continueGame()` | **修改** | 从存档恢复时加载对应阶段的题目 |
| `startGame()` | **修改** | 参数化：`startGame(stage)` 指定开始哪个阶段 |
| `renderQuestion()` | **微调** | 题号显示改为"阶段内题号/阶段总题数" |
| `goNext()` | **微调** | 阶段内题目切换逻辑，最后一题后调用 renderSummary |
| `renderSummary()` | **重写** | 增加阶段总览卡片、星级评价（3星制）、解锁判断 |
| `saveProgress()` | **修改** | 增加 stage/unlocked/stageScore/stageStars 字段 |
| `loadProgress()` | **修改** | 兼容旧格式（无 stage 字段时默认 stage=1） |
| `getStageQuestions()` | **新增** | 按 stage 过滤 QUESTIONS |
| `getStageModules()` | **新增** | 按 stage 过滤 MODULES |
| `renderUnlock()` | **新增** | 渲染解锁提示弹窗 |
| `renderStageSelect()` | **新增** | 渲染阶段选择器（可合并到 renderStart） |
| `getReadingVisual()` | **新增** | 代码阅读模块的 SVG 插图模板 |
| `getListVisual()` | **新增** | 列表模块的 SVG 插图模板 |
| `getQuestionVisual()` | **修改** | switch 增加 'reading' 和 'list' 分支 |
| `getDefaultVisual()` | **修改** | 增加 module 6-12 的默认视觉 |
| `restart()` | **修改** | 重置时保留 unlocked/stageScore/stageStars |

---

## 11. 待确认问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | **第1阶22题是否需要补 `stage: 1` 字段？** | 影响 `getStageQuestions()` 过滤逻辑 | 建议：给现有22题统一补 `stage: 1`，或在 filter 时默认 `q.stage \|\| 1 === stage` |
| 2 | **第2阶答完后，"再来一次"是重答第2阶还是回到阶段选择器？** | 影响 renderSummary 按钮逻辑 | 建议：两个按钮——"再来一次"重答本阶段，"回到首页"回阶段选择器 |
| 3 | **第1阶未通关时，是否允许直接重答？** | 影响解锁逻辑 | 建议：允许重答，不设限制，鼓励多练 |
| 4 | **已解锁阶段是否允许反复重答刷分？** | 影响 stageScore 存储逻辑 | 建议：允许重答，stageScore 取历史最高分 |
| 5 | **moduleScore 数组是否扩展为12位？** | 影响 state 初始化和存档兼容 | 建议：扩展为12位，loadProgress 时兼容旧的5位数组（补0） |
| 6 | **第3阶（中级）的锁图标是否现在就显示？** | 影响阶段选择器显示 | 建议：显示但灰显+锁图标，让学生知道还有更高挑战 |
| 7 | **代码阅读题是否需要"代码逐行高亮动画"？** | 增加开发量但提升教学效果 | 建议：P2优先级，先不做，反馈区文字解析足够 |
| 8 | **跨阶段续玩时，是否需要确认弹窗？** | 用户体验 | 建议：直接恢复，在阶段选择器显示"继续闯关"按钮即可 |

---

## 12. 实施建议

### 12.1 开发顺序

1. **第一步**：数据层改造 — MODULES 追加7模块 + QUESTIONS 追加30题 + state 升级 + localStorage 升级
2. **第二步**：阶段选择器 — 重写 renderStart + 新增 renderStageSelect
3. **第三步**：代码阅读题渲染 — 微调 renderQuestion（题号显示 + 代码块始终展示）
4. **第四步**：阶段解锁 — 新增 renderUnlock + 修改 renderSummary（星级+解锁判断）
5. **第五步**：新 SVG 模板 — getReadingVisual + getListVisual
6. **第六步**：测试 — 第1阶回归 + 第2阶全流程 + 跨阶段续玩 + localStorage 兼容

### 12.2 兼容性注意

- localStorage 旧格式（无 stage/unlocked 字段）必须兼容，`loadProgress()` 做默认值处理
- 现有22题的 `stage` 字段缺省时默认为1
- `moduleScore` 旧5位数组扩展为12位时，缺省补0
- dark 模式下代码块、新插图需验证配色

### 12.3 文件大小预估

- 现有 index.html 约2300行
- 第2阶增量预估：30题数据 ~400行 + 2个新SVG模板 ~200行 + 函数改动 ~300行 = ~900行
- 总计约3200行，仍在单文件可控范围内
