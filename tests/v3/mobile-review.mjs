// Run with an ego-browser Page. Uses a local server or the public /v3 deployment.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
export async function reviewMobile(page, { baseURL, outputDir }) {
  const lessons = JSON.parse(await readFile(new URL('../../v3/lessons.json', import.meta.url)));
  const solutions = JSON.parse(await readFile(new URL('./solutions.json', import.meta.url)));
  const sizes = [[320,700],[360,780],[375,812],[390,844],[430,932],[700,900],[768,1024],[844,390],[1024,768],[1280,900],[390,420]];
  const measurements = [], flows = [];
  const setSize = (width = 375, height = 812) => page.cdp('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:width<=1050});
  await mkdir(outputDir, {recursive:true});
  const key = 'kidcoding-v3-expedition-v1';
  await page.goto(new URL('/', baseURL).href);
  const original = await page.evaluate(key => localStorage.getItem(key), key);
  let restored = false;
  async function measure(phase) {
    for (const [width,height] of sizes) {
      await setSize(width,height);
      const state = await page.evaluate(phase => {
        const rect = s => document.querySelector(s).getBoundingClientRect();
        const visible = n => n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden';
        const code = document.querySelector('#code');
        const dialog = document.querySelector('dialog[open]');
        const d = dialog?.getBoundingClientRect();
        const menu = document.querySelector('#fileMenu[open]>div')?.getBoundingClientRect();
        const checks = [...document.querySelectorAll('button,summary,select,.review-choice')].filter(visible);
        return {
          phase, width:innerWidth, height:innerHeight,
          pageOverflow:document.documentElement.scrollWidth > innerWidth,
          smallTargets:checks.filter(n => n.getBoundingClientRect().height < 43.9).map(n=>n.id || n.textContent.slice(0,20)),
          codeFont:parseFloat(getComputedStyle(code).fontSize), codeHeight:rect('#code').height,
          gutterHeight:rect('#lineNumbers').height,
          editorRunGap:rect('.controls').top-rect('.editor').bottom,
          outputBeforeReport:document.querySelector('#report').hidden || rect('#results').bottom <= rect('#report').top,
          outputRunGap:rect('#results').top-rect('.controls').bottom,
          dialogFits:!d || (d.left>=0 && d.right<=innerWidth && d.top>=0 && d.bottom<=innerHeight && dialog.scrollWidth<=dialog.clientWidth),
          menuFits:!menu || (menu.left>=0 && menu.right<=innerWidth),
          quizOverflow:!document.querySelector('#completion').hidden && document.querySelector('#completion').scrollWidth > document.querySelector('#completion').clientWidth,
        };
      }, phase);
      if (state.pageOverflow || state.smallTargets.length || state.quizOverflow || !state.dialogFits || !state.menuFits || Math.abs(state.codeHeight-state.gutterHeight)>1 || (width<=1050 && state.codeFont<16) || (width<=700 && (!state.outputBeforeReport || state.editorRunGap<0 || state.editorRunGap>16 || state.outputRunGap>140))) {
        throw new Error('Mobile layout regression: '+JSON.stringify(state));
      }
      measurements.push(state);
    }
  }
  async function run(code, passed) {
    await setSize();
    await page.fill('#code',code); await page.click('#run');
    await page.waitForFunction(() => !document.querySelector('#report').hidden && !document.querySelector('#run').disabled, undefined, {timeout:15000});
    const state = await page.evaluate(() => ({passed:!document.querySelector('#completion').hidden, output:document.querySelector('#output').textContent, reportTop:document.querySelector('#report').getBoundingClientRect().top, resultTop:document.querySelector('#results').getBoundingClientRect().top}));
    if (state.passed!==passed) throw new Error('Unexpected code check: '+JSON.stringify(state));
    return state;
  }
  try {
    await page.goto(baseURL);
    await page.waitForFunction(() => document.querySelector('#runtimeStatus')?.textContent.includes('已就绪'),undefined,{timeout:60000});
    await setSize(); await page.selectOption('#lessonPicker','battery');
    await measure('initial');
    await run(lessons[0].starter,false); await measure('wrong-result');
    for (const lesson of lessons) {
      await setSize(); await page.selectOption('#lessonPicker',lesson.id);
      const result = await run(solutions[lesson.id],true);
      if (result.resultTop < -1 || result.resultTop > 812) throw new Error('Mobile run did not reveal output');
      await measure('code-pass-'+lesson.id);
      await setSize();
      const wrong = (lesson.review.answer+1)%lesson.review.choices.length;
      await page.click('input[name="review"][value="'+wrong+'"]');
      if (!await page.evaluate(()=>document.querySelector('#nextLesson').disabled)) throw new Error('Wrong quiz answer passed');
      await page.click('input[name="review"][value="'+lesson.review.answer+'"]');
      if (await page.evaluate(()=>document.querySelector('#nextLesson').disabled)) throw new Error('Correct quiz answer blocked');
      flows.push({lesson:lesson.id,output:result.output,quiz:true});
      if (lesson.id === 'rescue') {
        await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});
        await page.screenshot({path:outputDir+'/phone-result.png',fullPage:true});
        await page.click('#nextLesson');
        if (!await page.evaluate(()=>document.querySelector('#courseDone').open)) throw new Error('Missing course dialog');
        await measure('completion-dialog');
        await page.click('#keepExploring');
      }
    }
    await setSize(); await page.click('#debugDetails summary'); await page.click('#previous');
    await measure('replay');
    await setSize(); await page.evaluate(()=>window.scrollTo(0,0));
    await page.click('#fileMenu summary'); await measure('file-menu'); await page.click('#fileMenu summary');
    await page.click('#reset'); await measure('reset-dialog'); await page.click('#confirmReset button[value="cancel"]');
    await run('energy=3\nprint(missing)',false);
    await measure('error');
    await setSize(); await page.click('#jumpError');
    const jump = await page.evaluate(()=>({focused:document.activeElement.id,selected:document.querySelector('#code').value.slice(document.querySelector('#code').selectionStart,document.querySelector('#code').selectionEnd)}));
    if (jump.focused!=='code' || jump.selected!=='print(missing)') throw new Error('Error jump failed');
    const longCode = 'energy = 3\n# '+ 'long_python_comment_'.repeat(20)+'\n'+Array.from({length:28},(_,i)=>'# line '+i).join('\n');
    await page.fill('#code',longCode); await measure('long-draft');
    await setSize(390,420); await page.focus('#code');
    const editorScroll = await page.evaluate(()=>{const c=document.querySelector('#code');c.scrollTop=200;c.scrollLeft=200;c.dispatchEvent(new Event('scroll'));return {x:c.scrollLeft,y:c.scrollTop,gutterY:document.querySelector('#lineNumbers').scrollTop,pageWidth:document.documentElement.scrollWidth,viewport:innerWidth};});
    if (editorScroll.x<=0 || editorScroll.y<=0 || editorScroll.y!==editorScroll.gutterY || editorScroll.pageWidth>editorScroll.viewport) throw new Error('Long editor scrolling failed');
    await page.click('#run');
    await page.waitForFunction(()=>!document.querySelector('#report').hidden&&!document.querySelector('#run').disabled,undefined,{timeout:15000});
    const outputInShortViewport = await page.evaluate(()=>{const r=document.querySelector('#results').getBoundingClientRect();return r.top>=-1 && r.top<innerHeight;});
    if (!outputInShortViewport) throw new Error('Output hidden in short viewport');
    const proof = {url:baseURL,flows,layoutStates:measurements.length,measurements,errorJump:true,longCodeScroll:editorScroll,shortViewportRun:true};
    await writeFile(outputDir+'/validation.json',JSON.stringify(proof,null,2));
    return {lessons:flows.length,layoutStates:measurements.length,errorJump:true,longCodeScroll:true,shortViewportRun:true};
  } finally {
    await page.goto(new URL('/',baseURL).href);
    await page.evaluate(({key,original})=>original===null?localStorage.removeItem(key):localStorage.setItem(key,original),{key,original});
    restored = await page.evaluate(({key,original})=>localStorage.getItem(key)===original,{key,original});
    if (!restored) throw new Error('Learning record restoration failed');
  }
}
