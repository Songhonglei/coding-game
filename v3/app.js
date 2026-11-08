const $ = id => document.getElementById(id);
const STORAGE = 'kidcoding-v3-expedition-v1';
const lessons = await (await fetch(new URL('./lessons.json', import.meta.url))).json();
const ids = new Set(lessons.map(item => item.id));

function cleanState(value) {
  if (!value || value.version !== 1 || !value.drafts || typeof value.drafts !== 'object' || Array.isArray(value.drafts)) throw new Error('这不是代码探险社的作品文件。');
  const drafts = Object.create(null), completed = Object.create(null);
  for (const id of ids) {
    if (typeof value.drafts[id] === 'string' && value.drafts[id].length <= 12000) drafts[id] = value.drafts[id];
    if (value.completed?.[id] === true) completed[id] = true;
  }
  return {version: 1, current: ids.has(value.current) ? value.current : lessons[0].id, drafts, completed};
}
function load() {
  try { const raw = localStorage.getItem(STORAGE); if (raw) return cleanState(JSON.parse(raw)); }
  catch { $('storageNotice').textContent = '原存档无法读取；请导出当前作品，避免丢失。'; }
  return {version: 1, current: lessons[0].id, drafts: Object.create(null), completed: Object.create(null)};
}
let state = load(), lesson = lessons.find(item => item.id === state.current);
let result = null, traceIndex = 0, hintIndex = 0, quizCorrect = false;
let worker = null, ready = false, busy = false, job = 0, loadTimer, runTimer, saveTimer;
const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
function save() {
  state.drafts[lesson.id] = $('code').value;
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); $('saveState').textContent = '草稿已保存'; }
  catch { $('saveState').textContent = '自动保存不可用'; $('storageNotice').textContent = '浏览器无法保存。离开前请在“我的作品”中导出。'; }
}
function setFlow(step) {
  ['flowRead', 'flowCode', 'flowCheck'].forEach((id, index) => {
    if (index === step) $(id).setAttribute('aria-current', 'step'); else $(id).removeAttribute('aria-current');
  });
}
function renderLessons() {
  $('lessons').replaceChildren(); $('lessonPicker').replaceChildren();
  lessons.forEach((item, index) => {
    const done = !!state.completed[item.id];
    const button = make('button', undefined, 'lesson' + (done ? ' done' : ''));
    button.dataset.lesson = item.id; button.disabled = busy;
    if (item.id === lesson.id) button.setAttribute('aria-current', 'step');
    button.append(make('span', done ? '✓' : index + 1, 'number'));
    const name = make('span'); name.append(make('b', item.title), make('small', item.concept + (done ? ' · 已完成' : ''))); button.append(name);
    button.onclick = () => selectLesson(item.id); $('lessons').append(button);
    const option = make('option', `${index + 1}. ${item.title}${done ? ' ✓' : ''}`); option.value = item.id; $('lessonPicker').append(option);
  });
  $('lessonPicker').value = lesson.id; $('lessonPicker').disabled = busy;
  $('courseProgress').textContent = `已完成 ${Object.values(state.completed).filter(Boolean).length} / ${lessons.length} 个任务`;
}
function numbers() {
  const count = $('code').value.split('\n').length;
  $('lineNumbers').replaceChildren(...Array.from({length: count}, (_, index) => {
    const line = make('span', index + 1); line.dataset.line = index + 1; return line;
  }));
  document.querySelector('.editor').style.setProperty('--editor-height', `${Math.max(5, Math.min(12, count)) * 24}px`);
  $('lineNumbers').scrollTop = $('code').scrollTop;
}
function focusLine(line, focus = false) {
  const lines = $('code').value.split('\n');
  const selected = Math.max(1, Math.min(line, lines.length));
  document.querySelectorAll('#lineNumbers span').forEach(node => node.classList.toggle('current', Number(node.dataset.line) === selected));
  const start = lines.slice(0, selected - 1).reduce((n, text) => n + text.length + 1, 0);
  if (focus) { $('code').focus({preventScroll: true}); document.querySelector('.editor').scrollIntoView({block: 'nearest'}); }
  $('code').setSelectionRange(start, start + lines[selected - 1].length);
  $('code').scrollTop = Math.max(0, (selected - 4) * 24); $('lineNumbers').scrollTop = $('code').scrollTop;
}
function paintVariables(variables) {
  $('variables').replaceChildren();
  const names = [...lesson.watch, ...Object.keys(variables)].filter((name, index, all) => all.indexOf(name) === index && variables[name] !== undefined);
  if (!names.length) $('variables').append(make('p', '这一行还没有创建变量。', 'muted'));
  names.forEach(name => { const row = make('div', undefined, 'variable'); row.append(make('code', name), make('strong', variables[name])); $('variables').append(row); });
  let label, value, caption, active = false;
  const energy = Number(variables.energy), hasEnergy = variables.energy !== undefined && Number.isFinite(energy);
  if (['battery', 'charge', 'functions'].includes(lesson.id)) {
    label = '电量 energy'; value = hasEnergy ? `${energy} / 10` : '—';
    caption = hasEnergy ? (energy >= 10 ? '观测屏已亮起。' : '电量还不足 10。') : '运行后读取 energy 的值。'; active = hasEnergy && energy >= 10;
  } else if (lesson.id === 'weather') {
    const rain = Number(variables.rain), known = variables.rain !== undefined && Number.isFinite(rain);
    label = '雨量 rain'; value = known ? String(rain) : '—';
    caption = known ? (rain > 0 ? '传感器检测到降雨，看看程序如何提醒。' : '没有降雨，看看程序选择哪个分支。') : '运行后读取传感器 rain。';
  } else if (lesson.id === 'readings') {
    label = '累计电量 total'; value = variables.total ?? '—'; caption = variables.total === undefined ? '运行后逐项累计 readings。' : '每一轮都可以回放 total 的变化。';
  } else {
    label = '修复记录 repaired'; value = variables.repaired ?? '—'; caption = variables.repaired === undefined ? '运行后查看修复后的设备。' : '保留足够电量，只补足低电量设备。';
  }
  $('metricLabel').textContent = label; $('metricValue').textContent = value; $('stationLabel').textContent = caption;
  $('battery').hidden = !['battery', 'charge', 'functions'].includes(lesson.id); $('battery').replaceChildren();
  for (let index = 0; index < 10; index++) $('battery').append(make('span', undefined, 'cell' + (hasEnergy && index < Math.max(0, Math.min(10, energy)) ? ' on' : '')));
  $('battery').setAttribute('aria-label', hasEnergy ? `电量 ${energy} 格` : '尚未获得电量');
  $('stationWindow')?.setAttribute('fill', active ? '#f6d785' : '#a9c4b5'); $('signal')?.setAttribute('opacity', active ? '1' : '0');
  const title = $('sceneTitle'); if (title) title.textContent = `${label}：${value}。${caption}`;
}
function resetReview() {
  quizCorrect = false; $('completion').hidden = true; $('reviewChoices').replaceChildren();
  $('nextLesson').disabled = true; $('reviewFeedback').textContent = ''; $('reflection').hidden = true;
  $('completion').dataset.review = 'pending';
}
function invalidate() {
  result = null; traceIndex = 0; resetReview();
  $('report').hidden = true; $('error').hidden = true; $('jumpError').hidden = true; $('debugDetails').hidden = true; $('debugDetails').open = false; $('replay').hidden = true;
  $('sceneState').textContent = '等待本次运行'; $('tracePosition').textContent = '最终状态'; $('output').textContent = '请运行更新后的代码';
  document.querySelectorAll('#lineNumbers .current').forEach(node => node.classList.remove('current'));
  paintVariables({});
}
function selectLesson(id, persist = true) {
  if (busy || !ids.has(id)) return;
  if (persist) save();
  lesson = lessons.find(item => item.id === id); state.current = id; hintIndex = 0;
  $('lessonTitle').textContent = lesson.title; $('lessonNumber').textContent = `任务 ${String(lessons.indexOf(lesson) + 1).padStart(2, '0')} / 06`;
  $('concept').textContent = lesson.concept; $('duration').textContent = `约 ${lesson.minutes} 分钟`; $('story').textContent = lesson.story; $('goal').textContent = lesson.goal;
  $('providedInputs').hidden = Object.keys(lesson.inputs).length === 0;
  $('inputValues').textContent = Object.entries(lesson.inputs).map(([name, value]) => `${name} = ${JSON.stringify(value)}`).join('\n');
  $('filename').textContent = lesson.id + '.py'; $('code').value = state.drafts[id] ?? lesson.starter;
  $('explain').textContent = lesson.explain; $('hint').textContent = lesson.hints[0]; $('moreHint').disabled = false; $('moreHint').textContent = '再看一点提示';
  document.querySelectorAll('.learning-tools details').forEach(node => node.open = false);
  numbers(); invalidate(); renderLessons(); setFlow(0);
  $('feedback').textContent = '先运行起始代码，看看输出与目标差在哪里。'; $('output').textContent = '还没有运行'; $('sceneState').textContent = '等待运行'; save();
}
function setBusy(value) {
  busy = value; $('code').readOnly = value; $('run').disabled = value || !ready; $('stop').hidden = !value;
  $('reset').disabled = value; $('importProject').disabled = value; renderLessons();
}
function boot() {
  clearTimeout(loadTimer); clearTimeout(runTimer); worker?.terminate(); ready = false; setBusy(false);
  $('runtimeStatus').textContent = '正在准备 Python…'; $('retryRuntime').hidden = true;
  const current = new Worker(new URL('./worker.js', import.meta.url), {type: 'module'}); worker = current;
  function failed(message) {
    if (worker !== current) return;
    clearTimeout(loadTimer); clearTimeout(runTimer); current.terminate(); ready = false; setBusy(false);
    $('runtimeStatus').textContent = message; $('retryRuntime').hidden = false;
  }
  loadTimer = setTimeout(() => failed('Python 加载超时，草稿已保留。'), 45000);
  current.onerror = () => failed('Python 未能启动，请重新加载。');
  current.onmessage = ({data}) => {
    if (worker !== current) return;
    if (data.type === 'ready') { clearTimeout(loadTimer); ready = true; setBusy(false); $('runtimeStatus').textContent = 'Python 已就绪'; }
    else if (data.type === 'load-error') failed('Python 加载失败，草稿已保留。');
    else if (data.id === job && data.type === 'result') { clearTimeout(runTimer); setBusy(false); result = data.result; showResult(); }
    else if (data.id === job && data.type === 'run-error') { failed('运行中断，请重新加载。'); $('feedback').textContent = data.message.slice(0, 250); }
  };
}
function run() {
  if (!ready || busy) return;
  save(); invalidate(); setBusy(true); setFlow(1); $('feedback').textContent = '正在运行，并检查不同输入下的结果…'; $('sceneState').textContent = '运行中';
  job++; worker.postMessage({id: job, source: $('code').value, lesson: lesson.id});
  const currentJob = job; runTimer = setTimeout(() => { if (currentJob === job && busy) stop('执行超过 8 秒，已停止。请检查循环或减少计算量。'); }, 8000);
}
function stop(message = '已停止本次运行。草稿已保留，可以修改后再试。') {
  job++; clearTimeout(runTimer); worker?.terminate(); ready = false; setBusy(false); invalidate(); $('feedback').textContent = message; setFlow(1); boot();
}
function renderReview() {
  resetReview(); $('completion').hidden = false; $('reviewQuestion').textContent = lesson.review.question;
  lesson.review.choices.forEach((text, index) => {
    const label = make('label', undefined, 'review-choice'), input = make('input');
    input.type = 'radio'; input.name = 'review'; input.value = index;
    input.onchange = () => {
      quizCorrect = index === lesson.review.answer; $('nextLesson').disabled = !quizCorrect;
      $('reviewFeedback').textContent = quizCorrect ? lesson.review.explanation : '再想想：' + lesson.explain;
      $('reflection').hidden = !quizCorrect; $('completion').dataset.review = quizCorrect ? 'passed' : 'pending';
      if (quizCorrect) { state.completed[lesson.id] = true; save(); renderLessons(); }
    };
    label.append(input, make('span', text)); $('reviewChoices').append(label);
  });
  $('reflection').textContent = lesson.reflection;
  $('nextLesson').textContent = lessons.indexOf(lesson) === lessons.length - 1 ? '完成本章，看看学习路线' : '进入下一任务';
}
function showResult() {
  $('report').hidden = false; $('checks').replaceChildren(); $('error').hidden = !result.error;
  const count = result.checks.filter(check => check.passed).length;
  $('checkCount').textContent = result.error ? '执行未完成' : `${count} / ${result.checks.length} 项检查通过`;
  $('checkDetails').hidden = result.checks.length === 0;
  $('jumpError').hidden = !result.error?.line;
  if (result.error) {
    const error = result.error; $('error').textContent = `${error.line ? '第 ' + error.line + ' 行 · ' : ''}${error.type}\n${error.message}\n${error.hint}`;
    $('jumpError').textContent = `去第 ${error.line} 行修改`;
  }
  result.checks.forEach(check => {
    const li = make('li', undefined, check.passed ? 'check-pass' : 'check-fail'); li.append(make('span', check.passed ? '✓' : '○', 'check-icon'));
    const text = make('div', check.label); if (!check.passed) text.append(make('small', `期望：${check.expected}；本次：${check.actual}`)); li.append(text); $('checks').append(li);
  });
  $('reportTitle').textContent = result.passed ? '代码检查通过' : result.error ? '先修正这个问题' : '对照目标，再改一处';
  $('checkDetails').open = !result.passed;
  $('feedback').textContent = result.passed ? '代码通过了。回答下面的小问题，完成这一课。' : result.error ? '代码没有运行完，下面是出错位置与修改方向。' : '已经得到运行结果。对照下方检查，看看还差什么。';
  if (result.passed) renderReview(); else resetReview();
  $('debugDetails').hidden = !result.trace.length; $('replay').hidden = !result.trace.length;
  $('traceSlider').max = Math.max(0, result.trace.length - 1); showTrace(result.trace.length - 1); setFlow(2);
  if (matchMedia('(max-width: 700px)').matches && $('report').getBoundingClientRect().top > innerHeight - 140) $('report').scrollIntoView({block: 'start'});
}
function showTrace(index) {
  if (!result) return;
  if (!result.trace.length) {
    $('sceneState').textContent = result.error ? '尚未执行' : '执行完毕';
    $('output').textContent = result.output || '（未产生输出）';
    $('tracePosition').textContent = '没有执行轨迹'; paintVariables(result.variables); return;
  }
  traceIndex = Math.max(0, Math.min(index, result.trace.length - 1));
  const frame = result.trace[traceIndex] || {line: null, variables: result.variables, output: result.output};
  const last = traceIndex === result.trace.length - 1;
  $('traceSlider').value = traceIndex; $('previous').disabled = traceIndex === 0; $('next').disabled = last;
  $('sceneState').textContent = last ? (result.error ? '运行中断' : '执行完毕') : `第 ${frame.line} 行执行前`;
  $('tracePosition').textContent = last ? '最终状态' : `步骤 ${traceIndex + 1} / ${result.trace.length}${result.traceTruncated ? ' · 前 300 步' : ''}`;
  $('replayLine').textContent = last ? '最终状态' : `第 ${frame.line} 行执行前`;
  $('output').textContent = frame.output || '（还没有输出）'; paintVariables(frame.variables);
  if (!last && frame.line) focusLine(frame.line);
  else document.querySelectorAll('#lineNumbers .current').forEach(node => node.classList.remove('current'));
}
$('lessonPicker').onchange = () => selectLesson($('lessonPicker').value);
$('code').addEventListener('focus', () => { if (!result) setFlow(1); });
$('code').addEventListener('input', () => { numbers(); invalidate(); setFlow(1); $('feedback').textContent = '代码已修改，重新运行后再看检查。'; $('saveState').textContent = '正在保存…'; clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); });
$('code').addEventListener('scroll', () => $('lineNumbers').scrollTop = $('code').scrollTop);
$('code').addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); }
  if (event.key === 'Tab' && !busy) { event.preventDefault(); $('code').setRangeText('    ', $('code').selectionStart, $('code').selectionEnd, 'end'); $('code').dispatchEvent(new Event('input')); }
  if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !busy) {
    event.preventDefault(); const editor = $('code'), before = editor.value.slice(0, editor.selectionStart).split('\n').pop();
    const indent = (before.match(/^ */)?.[0] || '') + (before.trimEnd().endsWith(':') ? '    ' : '');
    editor.setRangeText('\n' + indent, editor.selectionStart, editor.selectionEnd, 'end'); editor.dispatchEvent(new Event('input'));
  }
});
$('run').onclick = run; $('stop').onclick = () => stop(); $('retryRuntime').onclick = boot;
$('jumpError').onclick = () => { if (result?.error?.line) { focusLine(result.error.line, true); setFlow(1); } };
$('moreHint').onclick = () => {
  hintIndex = Math.min(hintIndex + 1, lesson.hints.length - 1); $('hint').textContent = lesson.hints[hintIndex];
  if (hintIndex === lesson.hints.length - 1) { $('moreHint').disabled = true; $('moreHint').textContent = '提示已全部展开'; }
};
$('reset').onclick = () => $('confirmReset').showModal();
$('confirmReset').addEventListener('close', () => { if ($('confirmReset').returnValue === 'reset') { $('code').value = lesson.starter; numbers(); invalidate(); save(); setFlow(0); $('feedback').textContent = '已恢复起始代码，可以重新尝试。'; } });
$('traceSlider').oninput = () => showTrace(Number($('traceSlider').value)); $('previous').onclick = () => showTrace(traceIndex - 1); $('next').onclick = () => showTrace(traceIndex + 1); $('finalState').onclick = () => showTrace(result.trace.length - 1);
$('nextLesson').onclick = () => {
  if (!quizCorrect) return;
  if (lessons.indexOf(lesson) === lessons.length - 1) {
    const count = Object.values(state.completed).filter(Boolean).length;
    $('courseDoneTitle').textContent = count === lessons.length ? '六个任务都完成了' : '这项任务已完成';
    $('courseDoneText').textContent = `已完成 ${count} / ${lessons.length} 个任务。可以继续尝试其他写法，或回到学习路线。`;
    $('courseDone').showModal(); return;
  }
  selectLesson(lessons[lessons.indexOf(lesson) + 1].id); $('lessonTitle').focus({preventScroll: true}); $('lessonTitle').scrollIntoView({block: 'start'});
};
$('keepExploring').onclick = () => $('courseDone').close();
$('returnRoute').onclick = () => { $('courseDone').close(); selectLesson(lessons.find(item => !state.completed[item.id])?.id || lessons[0].id); $('lessonTitle').scrollIntoView({block: 'start'}); };
$('exportProject').onclick = () => {
  save(); $('fileMenu').open = false; const blob = new Blob([JSON.stringify({...state, exportedAt: new Date().toISOString()}, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob), anchor = make('a'); anchor.href = url; anchor.download = '代码探险社-我的作品.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('feedback').textContent = '已导出六课草稿和学习记录。';
};
$('importProject').onclick = () => { $('fileMenu').open = false; $('importFile').click(); };
$('importFile').onchange = async () => {
  const file = $('importFile').files[0]; if (!file) return;
  try {
    if (file.size > 200000) throw new Error('作品文件太大，请选择本工作台导出的 JSON 文件。');
    const incoming = cleanState(JSON.parse(await file.text())); save();
    state.drafts = {...state.drafts, ...incoming.drafts}; state.completed = {...state.completed, ...incoming.completed};
    selectLesson(incoming.current, false); $('feedback').textContent = '已导入作品，确认代码后可点击“运行并检查”。';
  } catch (error) { $('feedback').textContent = '导入失败：' + error.message; }
  $('importFile').value = '';
};
window.addEventListener('pagehide', save);
try { const response = await fetch(new URL('./scene.html', import.meta.url)); if (!response.ok) throw new Error('Scene unavailable'); $('scene').innerHTML = await response.text(); }
catch { $('scene').textContent = '场景未加载，代码与检查仍可使用。'; }
$('code').value = state.drafts[lesson.id] ?? lesson.starter; selectLesson(lesson.id, false); boot();
