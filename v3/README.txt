代码探险社 3.0 · 本地体验版

启动：
  cd /Users/songhonglei/space/skill-eval/kid-coding-v3
  python3 -m http.server 18766 --bind 127.0.0.1
访问 http://127.0.0.1:18766/v3/
不要双击 HTML：Worker / WASM 需要 HTTP 服务。

能力升级（对比已发布 v2）：
- v2：一课、仅改一位增量，受限三行模拟。
- v3：六课，自由编辑真实 Python，变量/条件/循环/列表/函数/综合修复。
- 多组输入与函数参数检查，错误行号和解释，执行轨迹回放和真实变量。
- 可停止的 Worker 运行，3000 步/2 秒教学执行预算，主页面8秒强制结束。
- 六课草稿与通关本地保存，作品 JSON 导入/导出，无账号或云同步。
- 本地托管 Pyodide 0.27.7（CPython）；运行时无需外部 CDN。

运行范围：基础 Python；不支持导入库、input()、第三方包；不是完整 IDE。
回放展示预先执行所得的轨迹，并非暂停中的调试会话。
限制用于教学和防止误写死循环，不声称是对抗恶意代码的安全沙箱。
初次加载约14MB运行时，首次启动会花几秒；后续可利用浏览器缓存。

开发代码保留在本地 codex/v3-learning-layout 分支，不推送、不发布。
生产发布白名单仅 index.html 和 v2/，不会意外包含 v3。
待用户体验确认，再添加 /v3 路由与入口并发布。

运行测试：
  python3 -m unittest discover -s tests/v3 -v
  node --test tests/regression.test.cjs

Pyodide 来源及许可：v3/vendor/pyodide/LICENSE、checksums.json。
官方运行时文档：https://pyodide.org/en/0.27.7/usage/downloading-and-deploying.html

本次布局与学习流程优化（2026-11-08）：
- 短代码文本区最少5行，长代码最多12行后滚动；紧凑现场仪表不会推远运行反馈。
- 运行前显示传感器第一组输入，写法说明与分层提示按需展开。
- 错误报告可定位并选中代码行；检查详情与变量回放紧邻操作区。
- 新课需代码检查和理解题都通过，才新增完成记录；旧存档完成记录保留。
- 最后一课完成后回看学习路线，不自动跳回第一课。
- 回放只记录学生代码的首次执行，不混入额外函数测试的调用。
- 阅读 REVIEW-DESIGN.txt 查看设计 review；验证证据位于 outputs/v3-review/。
本次所有修改只在本地，不推送、不部署。
