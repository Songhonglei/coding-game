import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,validateValues,simulateLesson,evaluateLesson,transferAnswer,freshProgress,normalizeSave,codeRows} from '../v2/course-model.mjs';
const SOLUTIONS={score:{increment:3},weather:{operator:'>',threshold:0},watering:{repetitions:5},debug:{operation:'*'}};
test('all four lessons have a working lesson, explanation and independent transfer problem',()=>{
  assert.equal(LESSONS.length,4);
  for(const lesson of LESSONS){
    assert.equal(evaluateLesson(lesson.id,lesson.defaults).passed,false);
    assert.equal(evaluateLesson(lesson.id,SOLUTIONS[lesson.id]).passed,true);
    assert.ok(lesson.predictions.includes(simulateLesson(lesson.id,lesson.defaults).output));
    assert.ok(lesson.review.choices.some(([value])=>value===lesson.review.answer));
    assert.ok(lesson.transfer.choices.includes(transferAnswer(lesson.id)));
    assert.notEqual(transferAnswer(lesson.id),simulateLesson(lesson.id,SOLUTIONS[lesson.id]).output);
  }
});
test('score update handles every permitted increment including zero',()=>{
  for(let increment=0;increment<=9;increment++){
    const result=simulateLesson('score',{increment});assert.equal(result.output,String(7+increment));assert.deepEqual(result.trace.map(frame=>frame.variables.score),[7,7+increment,7+increment]);
  }
});
test('weather checks both branch paths and the zero boundary',()=>{
  for(const rain of [0,1,5,30]){
    const r=simulateLesson('weather',SOLUTIONS.weather,{rain});assert.equal(r.output,rain>0?'带伞':'晴天');
    const lines=r.trace.map(frame=>frame.line);assert.equal(lines.includes(rain>0?5:3),false);
  }
  assert.equal(evaluateLesson('weather',{operator:'>=',threshold:0}).passed,false);
  assert.deepEqual(evaluateLesson('weather',{operator:'>',threshold:10}).checks.map(c=>c.passed),[true,false,false]);
});
test('watering repeats exactly n times and prints only after the loop',()=>{
  for(let repetitions=0;repetitions<=8;repetitions++){
    const r=simulateLesson('watering',{repetitions});assert.equal(r.output,String(repetitions*2));
    assert.equal(r.trace.filter(f=>f.line===3).length,repetitions);assert.ok(r.trace.slice(0,-1).every(f=>f.output===null));
    assert.deepEqual(r.trace.filter(f=>f.line===3).map(f=>f.variables.water),Array.from({length:repetitions},(_,i)=>(i+1)*2));
  }
});
test('debugging multiplication works across quantities and addition is rejected',()=>{
  for(const count of [0,1,2,4,8])assert.equal(simulateLesson('debug',SOLUTIONS.debug,{count}).output,String(3*count));
  assert.equal(evaluateLesson('debug',{operation:'+'}).passed,false);assert.equal(evaluateLesson('debug',{operation:'-'}).passed,false);
});
test('trace snapshots remain independent and their last output is the run result',()=>{
  for(const lesson of LESSONS){const r=simulateLesson(lesson.id,SOLUTIONS[lesson.id]);assert.equal(r.trace.at(-1).output,r.output);r.trace.at(-1).variables.injected=1;assert.equal(r.trace[0].variables.injected,undefined);}
});
test('invalid numeric fields and unapproved operators are rejected',()=>{
  for(const increment of ['',null,true,undefined,[],[3],{},-1,10,1.5,'1e100'])assert.throws(()=>validateValues('score',{increment}));
  for(const operator of ['==','<','javascript:alert(1)'])assert.throws(()=>validateValues('weather',{operator,threshold:0}));
  assert.throws(()=>simulateLesson('debug',SOLUTIONS.debug,{count:1.5}));assert.throws(()=>simulateLesson('unknown',{}));
});
test('fresh lessons do not share mutable values or run history',()=>{
  const a=freshProgress('score'),b=freshProgress('score');a.values.increment=8;a.runs.push({});assert.equal(b.values.increment,1);assert.equal(b.runs.length,0);
});
test('normalization restores per-lesson data without touching other course namespaces',()=>{
  const raw={version:1,current:'weather',view:'courses',completed:{score:true,unknown:true},lessons:{score:{stage:'explain',values:SOLUTIONS.score,executed:true,runs:[{output:'10',change:'增加3'}]},weather:{stage:'modify',values:{operator:'>',threshold:0},executed:false,runs:[]}}};
  const save=normalizeSave(raw);assert.equal(save.current,'weather');assert.equal(save.lessons.score.stage,'explain');assert.equal(save.lessons.weather.values.threshold,0);assert.deepEqual(save.completed,{score:true});assert.deepEqual(raw.lessons.score.values,SOLUTIONS.score);
});
test('broken or stale saved results cannot reopen a successful stage',()=>{
  for(const stage of ['explain','transfer','done'])assert.equal(normalizeSave({version:1,lessons:{score:{stage,values:{increment:1},executed:true}}}).lessons.score.stage,'modify');
  assert.equal(normalizeSave({version:1,lessons:{weather:{stage:'done',values:{operator:'evil',threshold:0}}}}).lessons.weather.stage,'predict');
  assert.equal(normalizeSave({version:1,current:'debug',view:'recap'}).view,'lesson');
  assert.equal(normalizeSave({version:999}).current,'score');
});
test('history is bounded and invalid stored rows are discarded',()=>{
  const runs=Array.from({length:40},()=>({change:'增加3',output:'10'}));runs.push(null,{output:4});
  assert.equal(normalizeSave({version:1,lessons:{score:{stage:'modify',values:{increment:3},runs}}}).lessons.score.runs.length,20);
});
test('fixed code examples have real indentation and valid field references',()=>{
  for(const lesson of LESSONS){for(const row of codeRows(lesson.id,lesson.defaults))for(const part of row)if(part.field)assert.ok(lesson.fields.some(f=>f.key===part.field));}
  assert.equal(codeRows('weather',LESSONS[1].defaults)[2][0].text,'    print("带伞")');
});

test('a restored prediction always shows the original example',()=>{
 const save=normalizeSave({version:1,lessons:{score:{stage:'predict',values:{increment:3},executed:true,runs:[]}}});
 assert.equal(save.lessons.score.values.increment,1);assert.equal(save.lessons.score.executed,false);
});
