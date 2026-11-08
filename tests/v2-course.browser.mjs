// Serve this repository on 18765, then run: ego-browser nodejs < tests/v2-course.browser.mjs
// Keeps the one TaskSpace active for visual review; the caller finishes it after release QA.
const task=await taskSpace('V2 四课内容补齐与发布'),page=task.page('p1');
await page.goto('http://127.0.0.1:18765/v2/?qa=courses');
await page.waitForFunction(()=>document.querySelector('#increment')!==null,undefined,{timeout:10000});
const cases=[
 {id:'score',prediction:'8',wrong:'71',fields:{increment:'3'},review:'store',transfer:'15',output:'10',checks:1},
 {id:'weather',prediction:'晴天',wrong:'带伞',fields:{operator:'>',threshold:'0'},review:'else',transfer:'晴天',output:'带伞',checks:3},
 {id:'watering',prediction:'4',wrong:'2',fields:{repetitions:'5'},review:'repeat',transfer:'6',output:'10',checks:2},
 {id:'debug',prediction:'7',wrong:'12',fields:{operation:'*'},review:'cases',transfer:'15',output:'12',checks:3}
];
const evidence=[],layouts=[];
async function layout(phase,id){
 for(const width of [320,390,760,768,1024,1440]){
  await page.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=760});
  const r=await page.evaluate(({phase,id})=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect();
   const action=document.querySelector('#prediction').hidden?'#toolbar':'#prediction';
   return {id,phase,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,codeClipped:[...document.querySelectorAll('.code-row')].some(n=>n.scrollWidth>n.clientWidth+1),gap:rect(action).top-rect('.editor').bottom};
  },{phase,id});
  if(r.overflow||r.codeClipped||r.gap<0||r.gap>(width<=760?16:50))throw new Error(JSON.stringify(r));layouts.push(r);
 }
 await page.cdp('Emulation.clearDeviceMetricsOverride');
}
for(const item of cases){
 await page.click('#courseButton');await page.click('[data-course="'+item.id+'"]');
 if(await page.evaluate(()=>!document.querySelector('#recap').hidden))await page.click('#experimentAgain');
 if(await page.evaluate(()=>document.querySelector('#prediction').hidden))await page.click('#reset');
 await layout('predict',item.id);
 await page.click('[data-answer="'+item.wrong+'"]');
 if(await page.evaluate(()=>document.querySelector('#prediction').hidden))throw new Error('Wrong prediction advanced '+item.id);
 await page.click('[data-answer="'+item.prediction+'"]');
 for(const [key,value] of Object.entries(item.fields)){
  if(['operator','operation'].includes(key))await page.selectOption('#'+key,value);else await page.fill('#'+key,value);
 }
 await page.click('#run');
 const passed=await page.evaluate(()=>({output:document.querySelector('#output').textContent,reflection:!document.querySelector('#reflection').hidden,checks:document.querySelectorAll('#checkRows .check-pass').length}));
 if(passed.output!==item.output||!passed.reflection||passed.checks!==item.checks)throw new Error(JSON.stringify({item,passed}));
 await layout('goal-passed',item.id);
 // Restoring an unfinished lesson must keep its fields and successful run, but not mark it complete.
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#reflection').hidden,undefined,{timeout:10000});
 if(!await page.evaluate(fields=>Object.entries(fields).every(([key,value])=>document.getElementById(key).value===value),item.fields))throw new Error('Fields did not restore '+item.id);
 await page.click('#finish');
 if(!await page.evaluate(()=>document.querySelector('#transfer').hidden))throw new Error('Empty explanation advanced');
 await page.selectOption('#explanation',item.review);await page.click('#finish');
 await layout('transfer',item.id);
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#transfer').hidden,undefined,{timeout:10000});
 await page.click('[data-transfer="'+item.transfer+'"]');
 if(!await page.evaluate(()=>!document.querySelector('#recap').hidden))throw new Error('Transfer did not finish '+item.id);
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#recap').hidden,undefined,{timeout:10000});
 evidence.push({id:item.id,...passed,explanation:true,transfer:true,refresh:true});
}
await page.click('#recapCourses');
if(!await page.evaluate(()=>document.querySelector('#courseProgress').textContent.includes('4 / 4')))throw new Error('Missing course completion history');
await page.click('[data-course="score"]');await page.click('#experimentAgain');await page.fill('#increment','');await page.click('#run');
if(!await page.evaluate(()=>document.querySelector('#feedback').textContent.includes('请填写')))throw new Error('Empty field was accepted');
await page.fill('#increment','0');await page.click('#run');
if(!await page.evaluate(()=>document.querySelector('#output').textContent==='7'&&document.querySelector('#reflection').hidden))throw new Error('Old successful explanation survived new values');
await page.click('#reset');await page.click('#skip');
for(let i=0;i<3;i++)await page.click('#step');
if(!await page.evaluate(()=>document.querySelector('#output').textContent==='8'))throw new Error('Step and run disagree');
await page.fill('#increment','3');await page.click('#step');await page.reload();
await page.waitForFunction(()=>document.querySelector('#increment')!==null,undefined,{timeout:10000});
if(!await page.evaluate(()=>document.querySelector('#reflection').hidden))throw new Error('Partial step restored a stale success');
const fs=await import('node:fs/promises');await fs.writeFile('/Users/songhonglei/space/skill-eval/kid-coding/outputs/v2-courses/browser-validation.json',JSON.stringify({courses:evidence,layouts,completed:4,partialStepSafe:true,invalidFields:true,isolatedProgress:true},null,2));
console.log({courses:evidence.length,layoutStates:layouts.length,maxGap:Math.max(...layouts.map(x=>x.gap)),refresh:true,completed:4,partialStepSafe:true});
