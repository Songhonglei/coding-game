const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the real single-file app with a minimal DOM adapter. Browser QA covers layout.
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function app(seed) {
  const storage = new Map(seed === undefined ? [] : [['coding-game-save', typeof seed === 'string' ? seed : JSON.stringify(seed)]]);
  const elements = new Map();
  const options = Array.from({ length: 4 }, () => element());
  const timers = new Map(); let timerId = 0;
  function element() {
    const classes = new Set();
    return { style: {}, className: '', innerHTML: '', textContent: '', disabled: false,
      classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: n => classes.delete(n), contains: n => classes.has(n) },
      setAttribute(name, value) { this[name] = value; }, getAttribute(name) { return this[name]; }, remove() {}, appendChild() {} };
  }
  const document = { documentElement: element(), body: element(), title: '',
    getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
    querySelector(selector) { return selector === '.lang-btn' ? this.getElementById('langBtn') : null; },
    querySelectorAll(selector) { return selector === '.option' ? options : []; },
    createElement: element, addEventListener() {} };
  const ctx = { console, document, navigator: { language: 'zh-CN' }, innerWidth: 1408,
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    speechSynthesis: { speaking: false, pending: false, cancel() {}, speak() {}, pause() {}, resume() {} },
    SpeechSynthesisUtterance: function(text) { this.text = text; },
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
    setInterval() { return 1; }, clearInterval() {}, requestAnimationFrame() {} };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(source, ctx, { timeout: 1000 });
  return { ctx, document, options, storage, timers, run(code) { return vm.runInContext(code, ctx, { timeout: 1000 }); }, save() { return JSON.parse(storage.get('coding-game-save')); } };
}
function playStage(a, stage, correct) {
  a.run(`startGame(${stage}); startQuestions();`);
  const total = a.ctx.getStageQuestions(stage).length;
  for (let i = 0; i < total; i++) {
    if (a.ctx.state.phase === 'intro') a.run('startQuestions()');
    a.run(i < correct ? 'selectOption(QUESTIONS[state.qIndex].answer)' : 'selectOption((QUESTIONS[state.qIndex].answer + 1) % 4)');
    a.run('goNext()');
  }
}

test('language changes and reloads restore one submitted answer without awarding credit again', () => {
  const a = app(); a.run('startGame(1); startQuestions(); selectOption(2); setLang("en"); selectOption(2); setLang("fr")');
  assert.equal(a.ctx.state.score, 1); assert.equal(a.ctx.state.moduleScore[0], 1);
  assert.equal(a.save().stageProgress[1].answers[0], 2);
  const b = app(a.save()); b.run('continueGame(); selectOption(2)');
  assert.equal(b.ctx.state.score, 1); assert.equal(b.ctx.state.answered, true);
  assert.ok(b.options.every(o => o.disabled)); assert.ok(b.document.getElementById('feedback').innerHTML.includes(b.ctx.t('fb_correct_title')));
});
test('an incorrect submitted answer also survives language changes and reload', () => {
  const a = app(); a.run('startGame(1); startQuestions(); selectOption(0); setLang("en"); selectOption(2)');
  const b = app(a.save()); b.run('continueGame(); selectOption(2)');
  assert.equal(b.ctx.state.score, 0); assert.equal(b.ctx.state.answers[0], 0);
});
test('cannot advance without submission or submit an invalid index', () => {
  const a = app(); a.run('startGame(1); startQuestions(); goNext(); selectOption(-1); selectOption(4); selectOption(NaN)');
  assert.equal(a.ctx.state.qIndex, 0); assert.equal(a.ctx.state.score, 0); assert.equal(a.ctx.state.answered, false);
});
test('a completed failed stage is never labeled passed and cannot resume into the next stage', () => {
  const a = app(); playStage(a, 1, 1);
  assert.equal(a.ctx.state.score, 1); assert.equal(a.ctx.loadProgress().active, null);
  assert.deepEqual(a.save().stageCompleted, [1]);
  a.run('renderStart(); continueGame()');
  assert.equal(a.ctx.state.phase, 'start');
  assert.doesNotMatch(a.document.getElementById('content').innerHTML, /stage-passed-badge|continue-info/);
});
test('full stage completion unlocks only available content and respects both thresholds', () => {
  const a = app(); playStage(a, 1, 14);
  assert.ok(a.ctx.state.unlocked.includes(2));
  playStage(a, 2, 20);
  assert.equal(a.ctx.isStagePassed(2, 20), false);
  assert.doesNotMatch(a.document.getElementById('content').innerHTML, /通过啦/);
  playStage(a, 2, 21);
  assert.deepEqual(a.save().unlocked, [1, 2]);
  a.run('startGame(3)'); assert.equal(a.ctx.state.stage, 2);
  assert.equal(a.ctx.getStages()[2].count, 0); assert.equal(a.ctx.getStages()[2].available, false);
});
test('starting a new stage persists achievements on the intro page, and keeps other progress', () => {
  const a = app(); playStage(a, 1, 22); a.run('startGame(1); startQuestions(); selectOption(2); startGame(2)');
  const b = app(a.save()); b.run('continueGame()');
  assert.equal(b.ctx.state.phase, 'intro'); assert.equal(b.ctx.state.stage, 2);
  assert.equal(b.ctx.state.stageScore[1], 22); assert.equal(b.ctx.state.stageProgress[1].score, 1);
  assert.equal(b.ctx.state.stageProgress[2].score, 0);
  b.run('restart()'); const c = app(b.save());
  assert.equal(c.ctx.state.stageScore[1], 22); assert.ok(c.ctx.loadProgress().active);
});
test('module transitions survive refresh before starting the next module', () => {
  const a = app(); a.run('startGame(1); startQuestions()');
  for (let i = 0; i < 5; i++) a.run('selectOption(QUESTIONS[state.qIndex].answer); goNext()');
  const b = app(a.save()); b.run('continueGame()');
  assert.equal(b.ctx.state.phase, 'intro'); assert.equal(b.ctx.state.moduleIndex, 1); assert.equal(b.ctx.state.qIndex, 5); assert.equal(b.ctx.state.score, 5);
});
test('legacy completed, active and invalid saves migrate without cross-stage questions', () => {
  const completed = app({ stage: 1, qIndex: 22, score: 14, stageScore: {1:14}, unlocked: [1,2,3] });
  assert.equal(completed.ctx.loadProgress().active, null);
  assert.deepEqual(completed.run('JSON.stringify(state.unlocked)'), '[1,2]');
  const active = app({ qIndex: 3, score: 2, moduleScore: [2], moduleIndex: 99 }); active.run('continueGame()');
  assert.equal(active.ctx.state.qIndex, 3); assert.equal(active.ctx.state.moduleIndex, 0); assert.equal(active.ctx.state.score, 2); assert.equal(active.ctx.state.moduleScore.length, 12);
  for (const seed of ['{', 'null', '[]', {stage:3,qIndex:0,unlocked:[1,2,3]}, {stage:1,qIndex:-1}, {stage:1,qIndex:22}]) {
    const invalid = app(seed); invalid.run('continueGame()'); assert.equal(invalid.ctx.state.phase, 'start');
  }
});
test('all code-prediction illustrations and read-aloud prompts conceal the final result until submission', () => {
  const a = app(); a.run('startGame(1); state.qIndex=4; renderQuestion()');
  const before = a.ctx.getQuestionPresentation();
  assert.doesNotMatch(before.visual, /变量 x 里放的是 8/);
  assert.notEqual(before.concept, a.ctx.tQ(4, 'concept'));
  a.run('selectOption(QUESTIONS[4].answer)');
  assert.match(a.ctx.getQuestionPresentation().visual, /变量 x 里放的是 8/);
  assert.equal(a.ctx.getQuestionPresentation().concept, a.ctx.tQ(4, 'concept'));
});
test('a pending unlock cannot appear after the user leaves the completed stage', () => {
  const a = app(); playStage(a, 1, 22); a.run('renderStart()');
  for (const fn of a.timers.values()) fn();
  assert.equal(a.ctx.state.phase, 'start'); assert.equal(a.ctx.pendingUnlock, null);
});
test('public counts use released questions in all three languages', () => {
  const a = app(); for (const lang of ['zh','en','fr']) {
    a.run(`setLang('${lang}')`); assert.match(a.ctx.t('app_subtitle'), /52/); assert.doesNotMatch(a.ctx.t('app_subtitle'), /84/);
  }
});

test('read-aloud resumes its current queue, and stale callbacks cannot advance a new narration', () => {
  const a = app(); let spoken = [], resumed = 0;
  a.ctx.speechSynthesis.speak = utterance => spoken.push(utterance);
  a.ctx.speechSynthesis.resume = () => resumed++;
  a.run('startGame(1); startQuestions(); toggleSpeak(); toggleSpeak(); toggleSpeak()');
  assert.equal(resumed, 1); assert.equal(spoken.length, 1);
  const old = spoken[0]; a.run('tts.speak("新的一段。");'); const currentIndex = a.ctx.tts._idx;
  old.onend(); old.onerror(); assert.equal(a.ctx.tts._idx, currentIndex);
  playStage(a, 1, 0); assert.doesNotThrow(() => a.run('toggleSpeak()'));
});
test('an earliest-format completed save retains its score during migration', () => {
  const a = app({qIndex:22,score:14,moduleScore:[5,4,3,2,0]});
  assert.equal(a.ctx.loadProgress().active, null); assert.equal(a.ctx.state.stageScore[1], 14); assert.ok(a.ctx.state.unlocked.includes(2));
});
