import { loadPyodide } from './vendor/pyodide/pyodide.mjs';
let pyodide;
async function init() {
  pyodide = await loadPyodide({indexURL: new URL('./vendor/pyodide/', import.meta.url).href});
  const runnerURL = new URL('./runner.py', import.meta.url);
  runnerURL.searchParams.set('v', new URL(import.meta.url).searchParams.get('v') || '20261108-v3-review1');
  const response = await fetch(runnerURL);
  if (!response.ok) throw new Error('任务检查器加载失败');
  pyodide.runPython(await response.text());
  self.postMessage({type:'ready'});
}
const ready=init().catch(error=>self.postMessage({type:'load-error',message:error.message}));
self.onmessage=async ({data})=>{
  await ready;
  if(!pyodide) return;
  try {
    const run=pyodide.globals.get('run_json');
    try { self.postMessage({type:'result',id:data.id,result:JSON.parse(run(data.source,data.lesson))}); }
    finally { run.destroy(); }
  } catch(error) {self.postMessage({type:'run-error',id:data.id,message:error.message});}
};
