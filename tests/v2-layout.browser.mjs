// Run with: python3 -m http.server 18765 --bind 127.0.0.1
// Then: ego-browser nodejs < tests/v2-layout.browser.mjs
const task = await taskSpace('V2 布局 review 与重设计');
const page = task.page('p1');
await page.goto('http://127.0.0.1:18765/v2/');
await page.evaluate(() => document.fonts.ready);
const evidence = [];
for (const width of [320, 390, 760, 768, 1024, 1440, 1920]) {
  await page.cdp('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: width <= 760});
  for (const phase of ['predict', 'wrong', 'modify', 'step', 'miss', 'success', 'expanded', 'help']) {
    await page.evaluate(phase => {
      reset();
      document.querySelector('#traceDetails').open = false;
      document.querySelector('.terms').open = false;
      if (phase === 'wrong') predict(71);
      if (!['predict', 'wrong'].includes(phase)) enterModify();
      if (phase === 'step') document.querySelector('#step').click();
      if (['miss', 'success', 'expanded', 'help'].includes(phase)) {
        document.querySelector('#increment').value = phase === 'miss' ? '1' : '3';
        document.querySelector('#run').click();
      }
      if (phase === 'expanded') document.querySelector('#traceDetails').open = true;
      if (phase === 'help') {
        document.querySelector('#hintButton').click();
        document.querySelector('.terms').open = true;
      }
    }, phase);
    const metric = await page.evaluate(({width, phase}) => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const action = ['predict', 'wrong'].includes(phase) ? '#prediction' : '#toolbar';
      const gap = rect(action).top - rect('.editor').bottom;
      const visible = id => !document.querySelector(id).hidden;
      return {
        width, phase, viewport: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
        codeClipped: [...document.querySelectorAll('.code-row')].some(el => el.scrollWidth > el.clientWidth + 1),
        editorToActionGap: gap,
        floatingControls: getComputedStyle(document.querySelector(action)).position === 'fixed',
        output: document.querySelector('#output').textContent,
        reflection: visible('#reflection'),
        reflectionGap: visible('#reflection') ? rect('#reflection').top - rect('#traceDetails').bottom : null,
      };
    }, {width, phase});
    if (metric.overflow || metric.codeClipped || metric.floatingControls || metric.editorToActionGap > (width <= 760 ? 16 : 48) || metric.editorToActionGap < 0) throw new Error(JSON.stringify(metric));
    if (['success', 'expanded', 'help'].includes(phase) && (!metric.reflection || metric.output !== '10' || metric.reflectionGap > 17)) throw new Error(JSON.stringify(metric));
    evidence.push(metric);
  }
}
// Expanding a trace must not push the run controls away from the code.
const stability = await page.evaluate(() => {
  const trace = document.querySelector('#traceDetails');
  trace.open = false;
  const before = document.querySelector('#toolbar').getBoundingClientRect().top;
  trace.open = true;
  return document.querySelector('#toolbar').getBoundingClientRect().top - before;
});
if (stability !== 0) throw new Error('Trace moved run controls: ' + stability);
const fs = await import('node:fs/promises');
await fs.writeFile('/Users/songhonglei/space/skill-eval/kid-coding/outputs/v2-rework/layout-validation.json', JSON.stringify({states: evidence.length, traceControlShift: stability, evidence}, null, 2));
console.log({states: evidence.length, overflow: 0, clipping: 0, largestDesktopGap: Math.max(...evidence.filter(x => x.width > 760).map(x => x.editorToActionGap)), largestMobileGap: Math.max(...evidence.filter(x => x.width <= 760).map(x => x.editorToActionGap)), traceControlShift: stability});
