// Local QA only. Run while serving this worktree on 18767; keeps the review TaskSpace for visual checks.
const fs = await import('node:fs/promises');
const root = '/Users/songhonglei/space/skill-eval/kid-coding-v3';
const lessons = JSON.parse(await fs.readFile(root + '/v3/lessons.json', 'utf8'));
const solutions = JSON.parse(await fs.readFile(root + '/tests/v3/solutions.json', 'utf8'));
const task = await taskSpace('V3 本地布局与学习流程 review');
const page = task.page('p1');
await page.goto('http://localhost:18767/v3/?review=flows');
await page.waitForFunction(() => document.querySelector('#runtimeStatus').textContent.includes('已就绪'), undefined, {timeout:45000});
const results = [];
const measurements = [];
async function measure(phase) {
  for (const width of [320, 390, 700, 768, 1050, 1100, 1440, 1920]) {
    await page.cdp('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:width<=700});
    const value = await page.evaluate(({width,phase}) => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      return {
        width, phase, overflow:document.documentElement.scrollWidth>innerWidth,
        codeToRun:rect('.controls').top-rect('.editor').bottom,
        reportGap:document.querySelector('#report').hidden ? null : rect('#report').top-rect('.controls').bottom,
        codeHeight:rect('#code').height,
        reflectionOverflow:document.querySelector('#completion').scrollWidth>document.querySelector('#completion').clientWidth && !document.querySelector('#completion').hidden,
      };
    }, {width,phase});
    if (value.overflow || value.reflectionOverflow || value.codeToRun < 0 || value.codeToRun > (width<=700 ? 16:70) || value.reportGap > 110 || value.codeHeight > 289) throw new Error(JSON.stringify(value));
    measurements.push(value);
  }
  await page.cdp('Emulation.clearDeviceMetricsOverride');
}
for (const item of lessons) {
  await page.click('[data-lesson="'+item.id+'"]');
  await page.fill('#code', item.starter); await page.click('#run');
  await page.waitForFunction(() => !document.querySelector('#report').hidden && !document.querySelector('#run').disabled, undefined, {timeout:12000});
  if (await page.evaluate(() => !document.querySelector('#completion').hidden)) throw new Error('Starter incorrectly passed: '+item.id);
  if (item.id === 'battery') await measure('wrong-result');
  const before = await page.evaluate(() => document.querySelector('#courseProgress').textContent);
  await page.fill('#code',solutions[item.id]); await page.click('#run');
  await page.waitForFunction(() => !document.querySelector('#completion').hidden && !document.querySelector('#run').disabled, undefined, {timeout:12000});
  const pending = await page.evaluate(() => ({disabled:document.querySelector('#nextLesson').disabled,progress:document.querySelector('#courseProgress').textContent}));
  if (!pending.disabled || pending.progress !== before) throw new Error('Completed before understanding check: '+item.id);
  if (item.id === 'battery') await measure('code-pass');
  const wrong = (item.review.answer+1)%item.review.choices.length;
  await page.click('input[name="review"][value="'+wrong+'"]');
  if (!await page.evaluate(() => document.querySelector('#nextLesson').disabled)) throw new Error('Wrong understanding answer passed');
  await page.click('input[name="review"][value="'+item.review.answer+'"]');
  if (await page.evaluate(() => document.querySelector('#nextLesson').disabled)) throw new Error('Correct understanding answer blocked');
  results.push(await page.evaluate(id => ({id,output:document.querySelector('#output').textContent,review:document.querySelector('#completion').dataset.review,checks:document.querySelector('#checkCount').textContent}),item.id));
  if (item.id === 'battery') {
    await measure('understood');
    await page.click('#debugDetails summary');
    const original = await page.evaluate(() => document.querySelector('.controls').getBoundingClientRect().top + scrollY);
    await page.click('#previous');await page.click('#previous');
    const replay = await page.evaluate(() => ({value:document.querySelector('#metricValue').textContent,window:document.querySelector('#stationWindow').getAttribute('fill')}));
    if (replay.value !== '3 / 10' || replay.window === '#f6d785') throw new Error('Replay uses final completion state: '+JSON.stringify(replay));
    const now = await page.evaluate(() => document.querySelector('.controls').getBoundingClientRect().top + scrollY);
    if (now !== original) throw new Error('Replay moved run controls');
    await page.click('#finalState');await measure('replay');await page.click('#debugDetails summary');
  }
  await page.click('#nextLesson');
  if (item.id === 'rescue') {
    if (!await page.evaluate(() => document.querySelector('#courseDone').open)) throw new Error('Missing chapter wrap-up');
    await page.click('#keepExploring');
  }
}
await page.reload();await page.waitForFunction(() => document.querySelector('#runtimeStatus').textContent.includes('已就绪'), undefined, {timeout:45000});
if (!await page.evaluate(() => document.querySelector('#courseProgress').textContent.includes('6 / 6'))) throw new Error('Completion not restored');
await page.click('[data-lesson="battery"]');await page.fill('#code','energy=3\nprint(missing)');await page.click('#run');
await page.waitForFunction(() => !document.querySelector('#error').hidden, undefined, {timeout:10000});
await page.click('#jumpError');
if (!await page.evaluate(() => document.activeElement.id==='code' && document.querySelector('#code').value.slice(document.querySelector('#code').selectionStart,document.querySelector('#code').selectionEnd)==='print(missing)')) throw new Error('Error jump failed');
await measure('name-error');
await page.fill('#code','if True\n    print(1)');await page.click('#run');await page.waitForFunction(() => !document.querySelector('#error').hidden, undefined, {timeout:10000});
if (await page.evaluate(() => document.querySelector('#sceneState').textContent.includes('null'))) throw new Error('Invalid syntax produced a fake replay step');
await measure('syntax-error');
await page.fill('#code',solutions.battery);await page.click('#run');await page.waitForFunction(() => !document.querySelector('#completion').hidden, undefined, {timeout:10000});
await page.fill('#code','energy=2\nprint(energy)');
if (!await page.evaluate(() => document.querySelector('#report').hidden && document.querySelector('#nextLesson').disabled)) throw new Error('Edited code kept stale completion');
await measure('edited');
await page.fill('#code','print(sum(range(1000000000)))');await page.click('#run');await page.click('#stop');
await page.waitForFunction(() => document.querySelector('#runtimeStatus').textContent.includes('已就绪'),undefined,{timeout:45000});
if (!await page.evaluate(() => document.querySelector('#feedback').textContent.includes('已停止'))) throw new Error('Stop did not preserve feedback');
await page.fill('#code',solutions.battery);await page.click('#run');await page.waitForFunction(() => !document.querySelector('#completion').hidden,undefined,{timeout:10000});
const proof={lessons:results,layoutStates:measurements.length,measurements,restoredProgress:true,errorJump:true,stopAndRerun:true,editedInvalidatesQuiz:true,finalChapterDialog:true};
await fs.writeFile(root+'/outputs/v3-review/browser-validation.json',JSON.stringify(proof,null,2));
console.log({lessons:results.length,layoutStates:measurements.length,largestRunGap:Math.max(...measurements.map(x=>x.codeToRun)),largestReportGap:Math.max(...measurements.map(x=>x.reportGap||0)),errorJump:true,stopAndRerun:true});
