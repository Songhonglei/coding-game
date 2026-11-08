const REVISION = new URL(import.meta.url).searchParams.get('v') || '20261108-courses1';
const moduleURL = path => {const url=new URL(path,import.meta.url);url.searchParams.set('v',REVISION);return url;};
const {LESSONS,lessonById,validateValues,simulateLesson,evaluateLesson,codeRows,transferAnswer,freshProgress,normalizeSave}=await import(moduleURL('./course-model.mjs'));
const {mountScene,paintScene}=await import(moduleURL('./scenes.mjs'));
const $=id=>document.getElementById(id),STORAGE='kidcoding-v2-course-save';
const make=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
let store;try{store=normalizeSave(JSON.parse(localStorage.getItem(STORAGE)));}catch{store=normalizeSave(null);}
const linked=decodeURIComponent(location.hash.slice(1));if(LESSONS.some(item=>item.id===linked)){store.current=linked;store.view='lesson';}
let lesson=lessonById(store.current),result=null,cursor=0,hintIndex=0;
function progress(){return store.lessons[lesson.id]??(store.lessons[lesson.id]=freshProgress(lesson.id));}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(store));}catch{$('storageNotice').textContent='浏览器无法保存进度，请保持此页面打开。';}}
function setStep(n){for(let i=0;i<3;i++)if(i===n)$('progress'+i).setAttribute('aria-current','step');else $('progress'+i).removeAttribute('aria-current');}
function feedback(text){$('feedback').textContent=text;}
function rawValues(){return Object.fromEntries(lesson.fields.map(field=>[field.key,$(field.key).value]));}
function values(){try{return validateValues(lesson.id,rawValues());}catch(error){feedback(error.message);const bad=lesson.fields.find(field=>!field.options&&($(field.key).value===''||!$(field.key).checkValidity()));$(bad?.key??lesson.fields[0].key).focus();return null;}}
function renderCode(){
  $('codeLines').replaceChildren();
  codeRows(lesson.id,progress().values).forEach((parts,index)=>{
    const row=make('div',undefined,'code-row');row.id='line'+index;row.append(make('span',index+1,'line-no'));
    for(const part of parts){
      if(part.text!==undefined){row.append(document.createTextNode(part.text));continue;}
      const field=lesson.fields.find(item=>item.key===part.field),input=make(field.options?'select':'input');input.id=field.key;
      input.className=field.options?'code-select':'input-number';input.setAttribute('aria-label',field.label+(field.options?'':`，${field.min}到${field.max}的整数`));
      if(field.options)for(const option of field.options){const node=make('option',option);node.value=option;input.append(node);}
      else {input.type='number';input.min=field.min;input.max=field.max;input.step=1;input.inputMode='numeric';}
      input.value=progress().values[field.key];input.disabled=progress().stage==='predict';input.addEventListener(field.options?'change':'input',fieldChanged);row.append(input);
    }
    $('codeLines').append(row);
  });
}
function paint(frame=null){
  document.querySelectorAll('.code-row').forEach(row=>row.classList.toggle('current',!!frame&&row.id==='line'+(frame.line-1)));
  paintScene($('sceneVisual'),lesson.id,frame);$('output').textContent=frame?.output??'—';
}
function renderTrace(){
  $('traceRows').replaceChildren();
  if(!result||!cursor){$('traceRows').append(make('p','运行或单步后，这里会记录每步执行后的值。','trace-empty'));return;}
  result.trace.slice(0,cursor).forEach(frame=>{
    const row=make('div',undefined,'journal-row');row.append(make('code',`第 ${frame.line} 行`),make('span',frame.note),make('strong',Object.entries(frame.variables).map(([name,value])=>`${name}=${value}`).join('，')));$('traceRows').append(row);
  });
}
function clearExecution(){
  result=null;cursor=0;$('goalChecks').hidden=true;$('reflection').hidden=true;$('transfer').hidden=true;
  $('explanation').value='';$('reflectionFeedback').textContent='';$('transferFeedback').textContent='';
  $('sceneState').textContent='运行前';$('step').textContent='单步';paint();renderTrace();
}
function fieldChanged(){
  const p=progress();try{p.values=validateValues(lesson.id,rawValues());}catch{/* Keep the last valid draft when a field is temporarily empty. */}
  p.stage='modify';p.executed=false;clearExecution();feedback('');setStep(1);persist();
}
function updateStage(){
  const p=progress(),predict=p.stage==='predict';$('prediction').hidden=!predict;$('toolbar').hidden=predict;
  $('editorNote').hidden=predict;$('editorNote').textContent='修改黄色标记的参数';
  $('instruction').textContent=predict?lesson.prompt:lesson.task;
  for(const field of lesson.fields)$(field.key).disabled=predict;
  setStep(predict?0:['explain','transfer','done'].includes(p.stage)?2:1);
}
function renderReflection(){
  $('reviewTitle').textContent=lesson.review.title;$('reviewLead').textContent=lesson.review.lead;
  $('explanation').replaceChildren(make('option','选一选'));$('explanation').firstChild.value='';
  lesson.review.choices.forEach(([value,label])=>{const option=make('option',label);option.value=value;$('explanation').append(option);});
}
function renderTransfer(){
  $('reflection').hidden=true;$('transfer').hidden=false;$('transferPrompt').textContent=lesson.transfer.prompt;
  $('transferCode').textContent=codeRows(lesson.id,lesson.transfer.values,lesson.transfer.context).map(parts=>parts.map(part=>part.text??lesson.transfer.values[part.field]).join('')).join('\n');
  $('transferChoices').replaceChildren();
  lesson.transfer.choices.forEach(value=>{const button=make('button',value,'choice');button.dataset.transfer=value;button.onclick=()=>{
    if(value!==transferAnswer(lesson.id)){$('transferFeedback').textContent='按这一题的新输入再算一次，别沿用上一题的输出。';return;}
    progress().stage='done';store.completed[lesson.id]=true;persist();show('recap');
  };$('transferChoices').append(button);});
}
function showChecks(){
  $('goalChecks').hidden=false;$('checksTitle').textContent=result.passed?'任务检查通过':'对照目标，再改一处';$('checkRows').replaceChildren();
  result.checks.forEach(check=>{
    const li=make('li',undefined,check.passed?'check-pass':'check-fail');li.append(make('span',check.passed?'✓':'○','check-mark'));
    const text=make('span',check.label);text.append(make('small',`本次：${check.actual}　目标：${check.expected}`));li.append(text);$('checkRows').append(li);
  });
}
function recordRun(){
  const p=progress();p.executed=true;p.values={...result.values};
  p.runs.push({change:lesson.fields.map(field=>`${field.label} ${result.values[field.key]}`).join('，'),output:result.output});p.runs=p.runs.slice(-20);
  p.stage=result.passed?'explain':'modify';showChecks();$('reflection').hidden=!result.passed;
  if(result.passed){setStep(2);feedback('目标达到了。试着解释这次变化。');}
  else feedback('结果与目标还有差距，看看检查记录，再修改一次。');
  persist();
}
function predict(value){
  if(value!==simulateLesson(lesson.id,lesson.defaults).output){feedback(lesson.hints.predict[0]);return;}
  const p=progress();p.stage='modify';p.executed=false;updateStage();
  result=evaluateLesson(lesson.id,p.values);cursor=result.trace.length;paint(result.trace.at(-1));renderTrace();$('sceneState').textContent='预测已验证';
  feedback(`预测正确。${lesson.task}`);persist();
}
function run(){
  const v=values();if(!v)return;clearExecution();result=evaluateLesson(lesson.id,v);cursor=result.trace.length;
  paint(result.trace.at(-1));renderTrace();$('sceneState').textContent='执行完毕';$('step').textContent='重新单步';recordRun();
}
function step(){
  const v=values();if(!v)return;
  if(!result||cursor>=result.trace.length){clearExecution();progress().stage='modify';progress().executed=false;setStep(1);persist();result=evaluateLesson(lesson.id,v);}
  const frame=result.trace[cursor++];paint(frame);renderTrace();$('traceDetails').open=true;
  $('sceneState').textContent=`第 ${frame.line} 行执行后`;$('step').textContent=cursor===result.trace.length?'重新单步':'下一步';
  if(cursor===result.trace.length){$('sceneState').textContent='执行完毕';recordRun();}
}
function reset(){store.lessons[lesson.id]=freshProgress(lesson.id);hintIndex=0;renderLesson();feedback('已恢复本课起始代码。历史完成记录保留。');persist();}
function renderLesson(){
  const p=progress();$('lessonNumber').textContent=`${String(LESSONS.indexOf(lesson)+1).padStart(2,'0')} / 04`;
  $('lessonConcept').textContent=lesson.concept;$('lessonDuration').textContent=`约 ${lesson.minutes} 分钟`;$('filename').textContent=lesson.file;$('sceneLabel').textContent=lesson.scene;
  $('sceneContext').textContent=lesson.id==='score'?'初始 7 分':lesson.id==='weather'?'rain = 5':lesson.id==='watering'?'每株 2 杯':'每本 3 元 / 4 本';
  mountScene($('sceneVisual'),lesson.id);renderCode();renderReflection();clearExecution();updateStage();
  $('predictionChoices').replaceChildren();lesson.predictions.forEach(value=>{const button=make('button',value,'choice');button.dataset.answer=value;button.onclick=()=>predict(value);$('predictionChoices').append(button);});
  $('termList').replaceChildren();lesson.terms.forEach(([name,text])=>$('termList').append(make('dt',name),make('dd',text)));
  $('hint').hidden=true;$('hintButton').setAttribute('aria-expanded','false');$('hintButton').textContent='需要提示？';hintIndex=0;feedback('');
  if(p.executed){result=evaluateLesson(lesson.id,p.values);cursor=result.trace.length;paint(result.trace.at(-1));renderTrace();showChecks();$('sceneState').textContent='已恢复上次运行';}
  if(p.stage==='explain')$('reflection').hidden=false;
  if(p.stage==='transfer'||p.stage==='done')renderTransfer();
}
function renderCourses(){
  $('courseProgress').textContent=`四节实验课 · 已完成 ${Object.values(store.completed).filter(Boolean).length} / 4`;$('courseRows').replaceChildren();
  LESSONS.forEach((item,index)=>{
    const row=make('div',undefined,'course-row');row.append(make('span',String(index+1).padStart(2,'0'),'n'));
    const description=make('div');description.append(make('h2',item.title),make('p',`${item.concept} · 约 ${item.minutes} 分钟`),make('p',item.description,'course-description'));
    if(store.completed[item.id])description.append(make('span','已完成','completed-label'));
    const stage=store.lessons[item.id]?.stage??'predict';const label=store.completed[item.id]&&stage==='done'?'查看回顾':stage==='predict'?'进入实验':'继续实验';const button=make('button',label,'primary');button.dataset.course=item.id;button.setAttribute('aria-label',`${button.textContent}：${item.title}`);button.onclick=()=>chooseLesson(item.id);row.append(description,button);$('courseRows').append(row);
  });
}
function renderRecap(){
  $('recapLabel').textContent=`实验 ${String(LESSONS.indexOf(lesson)+1).padStart(2,'0')} · 已完成`;$('recapTitle').textContent=lesson.recap;$('recapTakeaway').textContent=lesson.review.takeaway;$('recapTry').textContent=lesson.nextTry;
  $('historyRows').replaceChildren();progress().runs.forEach((run,index)=>{const row=make('tr');[index+1,run.change,run.output].forEach(value=>row.append(make('td',value)));$('historyRows').append(row);});
  $('nextLesson').textContent=LESSONS.indexOf(lesson)===LESSONS.length-1?'回到课程目录':'进入下一课';
}
function show(view){
  if(view==='recap'&&!store.completed[lesson.id])view='lesson';store.view=view;
  ['lesson','courses','recap'].forEach(id=>$(id).hidden=id!==view);$('lessonContext').hidden=view!=='lesson';
  $('pageTitle').textContent=view==='courses'?'课程目录':view==='recap'?'本课回顾':lesson.title;
  $('courseButton').textContent=view==='courses'?'返回当前课':'课程目录';
  if(view==='courses')renderCourses();if(view==='recap')renderRecap();persist();$('pageTitle').focus({preventScroll:true});scrollTo(0,0);
}
function chooseLesson(id){
  lesson=lessonById(id);store.current=id;renderLesson();history.replaceState(null,'','#'+id);show(progress().stage==='done'&&store.completed[id]?'recap':'lesson');
}
$('skip').onclick=()=>{progress().stage='modify';clearExecution();updateStage();feedback(lesson.task);persist();};
$('run').onclick=run;$('step').onclick=step;$('reset').onclick=reset;
$('finish').onclick=()=>{
  if(!result?.passed||progress().stage!=='explain')return;
  if($('explanation').value!==lesson.review.answer){$('reflectionFeedback').textContent=lesson.review.explanation;$('explanation').focus();return;}
  progress().stage='transfer';renderTransfer();persist();$('transfer').scrollIntoView({block:'nearest'});
};
$('hintButton').onclick=()=>{const hints=lesson.hints[progress().stage==='predict'?'predict':'modify'];$('hint').hidden=false;$('hint').textContent=hints[Math.min(hintIndex++,hints.length-1)];$('hintButton').setAttribute('aria-expanded','true');$('hintButton').textContent='再看一点提示';};
$('courseButton').onclick=()=>show(store.view==='courses'?(progress().stage==='done'?'recap':'lesson'):'courses');
$('recapCourses').onclick=()=>show('courses');$('experimentAgain').onclick=()=>{progress().stage='modify';progress().executed=false;renderLesson();show('lesson');$(lesson.fields[0].key).focus();};
$('nextLesson').onclick=()=>{const index=LESSONS.indexOf(lesson);if(index===LESSONS.length-1)show('courses');else chooseLesson(LESSONS[index+1].id);};
$('progress0').onclick=()=>{if(progress().stage==='predict')$('instruction').scrollIntoView({block:'center'});else feedback('已完成预测；点击“重做”可以重新开始本课。');};
$('progress1').onclick=()=>{if(progress().stage==='predict')$('skip').focus();else $(lesson.fields[0].key).focus();};
$('progress2').onclick=()=>{const section=progress().stage==='transfer'?'transfer':'reflection';if(!$(section).hidden)$(section).scrollIntoView({block:'nearest'});else feedback('先完成当前实验目标，再解释你的发现。');};
window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(LESSONS.some(item=>item.id===id)&&id!==lesson.id)chooseLesson(id);});
window.addEventListener('pagehide',persist);
renderLesson();show(progress().stage==='done'&&store.view==='lesson'&&store.completed[lesson.id]?'recap':store.view);
