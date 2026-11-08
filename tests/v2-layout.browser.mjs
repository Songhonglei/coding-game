// The original single-lesson layout QA is superseded by four-lesson browser coverage.
// Serve on 18765 and run: ego-browser nodejs < tests/v2-layout.browser.mjs
const fs=await import('node:fs/promises');
const source=await fs.readFile('/Users/songhonglei/space/skill-eval/kid-coding/tests/v2-course.browser.mjs','utf8');
await eval('(async()=>{'+source+'})()');
