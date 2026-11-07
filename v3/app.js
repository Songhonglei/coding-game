const $=id=>document.getElementById(id);
const STORAGE='kidcoding-v3-expedition-v1';
const lessons=await (await fetch(new URL('./lessons.json',import.meta.url))).json();
const ids=new Set(lessons.map(lesson=>lesson.id));
let storageOK=true;
function cleanState(value){
  if(!value||value.version!==1||typeof value.drafts!=='object'||!value.drafts||Array.isArray(value.drafts))throw new Error('这不是代码探险社的作品文件。');
  const drafts=Object.create(null),completed=Object.create(null);
  for(const id of ids){
    if(typeof value.drafts[id]==='string'&&value.drafts[id].length<=12000)drafts[id]=value.drafts[id];
    if(value.completed?.[id]===true)completed[id]=true;
  }
  return {version:1,current:ids.has(value.current)?value.current:lessons[0].id,drafts,completed};
}
function load(){
  try{const raw=localStorage.getItem(STORAGE);if(raw)return cleanState(JSON.parse(raw));}
  catch{storageOK=false;$('storageNotice').textContent='原存档无法读取；请导出当前作品，避免丢失。';}
  return {version:1,current:lessons[0].id,drafts:Object.create(null),completed:Object.create(null)};
}
let state=load(),lesson=lessons.find(item=>item.id===state.current),hintIndex=0,result=null,traceIndex=0,worker=null,ready=false,busy=false,job=0,loadTimer,runTimer;
function save(){
  state.drafts[lesson.id]=$('code').value;
  try{localStorage.setItem(STORAGE,JSON.stringify(state));$('saveState').textContent='草稿已保存';}
  catch{storageOK=false;$('saveState').textContent='自动保存不可用';$('storageNotice').textContent='浏览器无法保存。离开前请导出作品。';}
}
function make(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function renderLessons(){
  $('lessons').replaceChildren();
  lessons.forEach((item,index)=>{
    const button=make('button',undefined,'lesson'+(state.completed[item.id]?' done':''));
    button.dataset.lesson=item.id;button.disabled=busy;
    if(item.id===lesson.id)button.setAttribute('aria-current','step');
    button.append(make('span',state.completed[item.id]?'✓':index+1,'number'));
    const name=make('span');name.append(make('b',item.title),make('small',item.concept+(state.completed[item.id]?' · 已通过':'')));button.append(name);
    button.onclick=()=>selectLesson(item.id);$('lessons').append(button);
  });
  $('courseProgress').textContent=`已完成 ${Object.values(state.completed).filter(Boolean).length} / ${lessons.length} 个任务`;
}
function numbers(){
  const total=$('code').value.split('\n').length;
  $('lineNumbers').textContent=Array.from({length:total},(_,i)=>i+1).join('\n');
  $('lineNumbers').scrollTop=$('code').scrollTop;
}
function initialVariables(){return {};}
function paintVariables(variables){
  $('variables').replaceChildren();
  const entries=Object.entries(variables||{});
  if(!entries.length)$('variables').append(make('p','运行后，这里会出现变量的真实值。','muted'));
  const preferred=[...lesson.watch,...entries.map(([name])=>name)].filter((name,i,all)=>all.indexOf(name)===i&&variables[name]!==undefined);
  preferred.forEach(name=>{const row=make('div',undefined,'variable');row.append(make('code',name),make('strong',variables[name]));$('variables').append(row);});
  const energy=Number(variables.energy),hasEnergy=variables.energy!==undefined&&Number.isFinite(energy);
  $('battery').replaceChildren();
  for(let i=0;i<10;i++)$('battery').append(make('span',undefined,'cell'+(hasEnergy&&i<Math.max(0,Math.min(10,energy))?' on':'')));
  $('battery').setAttribute('aria-label',hasEnergy?`电量 ${energy} 格`:'尚未获得电量');
  $('stationLabel').textContent=hasEnergy?`energy = ${energy} · ${energy>=10?'观测屏已亮起':'等待充足电量'}`:variables.rain!==undefined?`雨量 rain = ${variables.rain}`:variables.repaired!==undefined?'修复后的记录已生成':variables.total!==undefined?`观测总量 total = ${variables.total}`:'等待代码中的观测记录';
  const active=hasEnergy?energy>=10:!!result?.passed;
  document.getElementById('stationWindow')?.setAttribute('fill',active?'#f6d785':'#a9c4b5');
  document.getElementById('signal')?.setAttribute('opacity',active?'1':'0');
  const title=document.getElementById('sceneTitle');if(title)title.textContent=$('stationLabel').textContent;
}
function invalidate(){
  result=null;traceIndex=0;$('report').hidden=true;$('completion').hidden=true;$('replay').hidden=true;$('error').hidden=true;$('sceneState').textContent='代码已修改，等待运行';$('tracePosition').textContent='本次运行的最终状态';$('output').textContent='代码已修改，请重新运行';paintVariables(initialVariables());
}
function selectLesson(id,persist=true){
  if(busy||!ids.has(id))return;
  if(persist)save();lesson=lessons.find(item=>item.id===id);state.current=id;hintIndex=0;result=null;
  $('lessonTitle').textContent=lesson.title;$('lessonNumber').textContent=`任务 ${String(lessons.indexOf(lesson)+1).padStart(2,'0')} / 06`;$('concept').textContent=lesson.concept;$('duration').textContent=`约 ${lesson.minutes} 分钟`;
  $('story').textContent=lesson.story;$('goal').textContent=lesson.goal;$('filename').textContent=lesson.id+'.py';$('code').value=state.drafts[id]??lesson.starter;
  $('hint').textContent=lesson.hints[0];$('moreHint').disabled=false;$('moreHint').textContent='再看一点提示';document.querySelector('.help').open=false;
  $('report').hidden=true;$('feedback').textContent='先运行一次，看看代码现在会做什么。';$('output').textContent='还没有运行';$('sceneState').textContent='等待运行';$('tracePosition').textContent='本次运行的最终状态';
  numbers();renderLessons();paintVariables({});save();
}
function setBusy(value){busy=value;$('code').readOnly=value;$('run').disabled=value||!ready;$('stop').disabled=!value;$('reset').disabled=value;$('importProject').disabled=value;renderLessons();}
function boot(){
  clearTimeout(loadTimer);clearTimeout(runTimer);worker?.terminate();ready=false;setBusy(false);
  $('runtimeStatus').textContent='正在准备 Python 引擎…';$('retryRuntime').hidden=true;
  const current=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});worker=current;
  function failed(message){if(worker!==current)return;clearTimeout(loadTimer);clearTimeout(runTimer);current.terminate();ready=false;setBusy(false);$('runtimeStatus').textContent=message;$('retryRuntime').hidden=false;}
  loadTimer=setTimeout(()=>failed('Python 加载超时。点击重新加载；草稿已保留。'),45000);
  current.onerror=()=>failed('Python 引擎未能启动。请使用本地 HTTP 地址打开，并检查运行时文件。');
  current.onmessage=({data})=>{
    if(worker!==current)return;
    if(data.type==='ready'){clearTimeout(loadTimer);ready=true;setBusy(false);$('runtimeStatus').textContent='Python 已就绪 · 代码只在浏览器运行';}
    else if(data.type==='load-error'){failed('Python 加载失败。请重新加载；草稿已保留。');}
    else if(data.id===job&&data.type==='result'){clearTimeout(runTimer);setBusy(false);result=data.result;showResult();}
    else if(data.id===job&&data.type==='run-error'){failed('运行中断。请重新加载 Python 后再试。');$('feedback').textContent=data.message.slice(0,250);}
  };
}
function run(){
  if(!ready||busy)return;save();invalidate();setBusy(true);$('feedback').textContent='正在运行，并用任务数据检查代码…';$('sceneState').textContent='运行中';
  job++;worker.postMessage({id:job,source:$('code').value,lesson:lesson.id});
  const currentJob=job;runTimer=setTimeout(()=>{if(currentJob===job&&busy)stop('执行超过 8 秒，已停止。请检查循环或减少计算量。');},8000);
}
function stop(message='已停止本次运行。修改代码后可以再试。'){
  job++;clearTimeout(runTimer);worker?.terminate();ready=false;setBusy(false);invalidate();$('feedback').textContent=message;boot();
}
function showResult(){
  $('report').hidden=false;$('checks').replaceChildren();$('error').hidden=!result.error;
  if(result.error){const e=result.error;$('error').textContent=`${e.line?'第 '+e.line+' 行 · ':''}${e.type}\n${e.message}\n${e.hint}`;}
  result.checks.forEach(check=>{const li=make('li',undefined,check.passed?'check-pass':'check-fail');li.append(make('span',check.passed?'✓':'○','check-icon'));const text=make('div',check.label);if(!check.passed)text.append(make('small',`期望：${check.expected}；本次：${check.actual}`));li.append(text);$('checks').append(li);});
  $('reportTitle').textContent=result.passed?'本次检查全部通过':'检查一下，还差哪里';$('completion').hidden=!result.passed;
  $('feedback').textContent=result.passed?'这次代码通过了所有检查。可以回放变量变化，再进入下一项任务。':result.error?'代码遇到了问题。下方报告指出了行号和修正方向。':'程序运行结束，还有检查没有通过。看看实际结果与目标差在哪里。';
  $('reflection').textContent=lesson.reflection;
  if(result.passed){state.completed[lesson.id]=true;save();renderLessons();}
  $('nextLesson').textContent=lessons.indexOf(lesson)===lessons.length-1?'回到第一课，再试不同写法':'进入下一任务';
  $('replay').hidden=result.trace.length===0;$('traceSlider').max=Math.max(0,result.trace.length-1);$('traceSlider').value=result.trace.length-1;
  showTrace(result.trace.length-1);
}
function showTrace(index){
  if(!result)return;
  traceIndex=Math.max(0,Math.min(index,result.trace.length-1));
  const frame=result.trace[traceIndex]||{line:null,variables:result.variables,output:result.output};
  $('traceSlider').value=traceIndex;$('previous').disabled=traceIndex===0;$('next').disabled=traceIndex>=result.trace.length-1;
  const last=traceIndex===result.trace.length-1;
  $('sceneState').textContent=last?(result.error?'运行中断':result.passed?'任务通过':'执行完毕'):`第 ${frame.line} 行执行前`;
  $('tracePosition').textContent=last?'本次运行的最终状态':`步骤 ${traceIndex+1} / ${result.trace.length}${result.traceTruncated?' · 前 300 步':''}`;
  $('output').textContent=frame.output||'（还没有输出）';paintVariables(frame.variables);
  if(!last&&frame.line){
    const lines=$('code').value.split('\n');const start=lines.slice(0,frame.line-1).reduce((n,line)=>n+line.length+1,0);
    $('code').setSelectionRange(start,start+(lines[frame.line-1]?.length||0));
    $('code').scrollTop=Math.max(0,(frame.line-4)*26);$('lineNumbers').scrollTop=$('code').scrollTop;
  }
}
let saveTimer;
$('code').addEventListener('input',()=>{numbers();invalidate();$('saveState').textContent='正在保存…';clearTimeout(saveTimer);saveTimer=setTimeout(save,300);});
$('code').addEventListener('scroll',()=>{$('lineNumbers').scrollTop=$('code').scrollTop;});
$('code').addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();run();}
  if(event.key==='Tab'&&!busy){event.preventDefault();const editor=$('code');editor.setRangeText('    ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}
  if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey&&!busy){
    event.preventDefault();const editor=$('code'),before=editor.value.slice(0,editor.selectionStart).split('\n').pop();
    const indent=(before.match(/^ */)?.[0]||'')+(before.trimEnd().endsWith(':')?'    ':'');
    editor.setRangeText('\n'+indent,editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));
  }
});
$('run').onclick=run;$('stop').onclick=()=>stop();$('retryRuntime').onclick=boot;
$('moreHint').onclick=()=>{hintIndex=Math.min(hintIndex+1,lesson.hints.length-1);$('hint').textContent=lesson.hints[hintIndex];if(hintIndex===lesson.hints.length-1){$('moreHint').disabled=true;$('moreHint').textContent='提示已全部展开';}};
$('reset').onclick=()=>$('confirmReset').showModal();
$('confirmReset').addEventListener('close',()=>{if($('confirmReset').returnValue==='reset'){$('code').value=lesson.starter;numbers();invalidate();save();$('feedback').textContent='已恢复本课起始代码，可以重新尝试。';}});
$('traceSlider').oninput=()=>showTrace(Number($('traceSlider').value));$('previous').onclick=()=>showTrace(traceIndex-1);$('next').onclick=()=>showTrace(traceIndex+1);$('finalState').onclick=()=>showTrace(result.trace.length-1);
$('nextLesson').onclick=()=>{selectLesson(lessons[(lessons.indexOf(lesson)+1)%lessons.length].id);$('lessonTitle').scrollIntoView({block:'start'});$('code').focus({preventScroll:true});};
$('exportProject').onclick=()=>{
  save();const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='代码探险社-我的作品.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('feedback').textContent='已导出六课的草稿和学习记录。可以在另一台电脑导入。';
};
$('importProject').onclick=()=>$('importFile').click();
$('importFile').onchange=async()=>{
  const file=$('importFile').files[0];if(!file)return;
  try{
    if(file.size>200000)throw new Error('作品文件太大，请选择本工作台导出的 JSON 文件。');
    const incoming=cleanState(JSON.parse(await file.text()));
    // Merge only the supplied lesson drafts; completed tasks are kept on both sides.
    save();state.drafts={...state.drafts,...incoming.drafts};state.completed={...state.completed,...incoming.completed};
    selectLesson(incoming.current,false);$('feedback').textContent='已导入作品。代码尚未运行，确认后可点击“运行代码”。';
  }catch(error){$('feedback').textContent='导入失败：'+error.message;}
  $('importFile').value='';
};
window.addEventListener('pagehide',save);
try {const response=await fetch(new URL('./scene.html',import.meta.url));$('scene').innerHTML=await response.text();}
catch{$('scene').textContent='场景加载失败，代码仍可运行。';}
// Render the first lesson without overwriting a restored draft.
$('code').value=state.drafts[lesson.id]??lesson.starter;
selectLesson(lesson.id);boot();
