// Guided lesson models, not a Python interpreter. Run and step use the same trace.
export const LESSONS = [
  {
    id:'score', title:'把比分改成 10', concept:'变量与赋值', minutes:8, file:'scoreboard.py', scene:'校园记分牌',
    description:'用变量记录分数，理解一次赋值如何改变结果。',
    prompt:'运行后，score 是多少？', task:'从 7 分开始，修改增量，让比分变成 10。',
    defaults:{increment:1}, fields:[{key:'increment',label:'增加的分数',min:0,max:9}],
    predictions:['7','8','71'],
    hints:{predict:['先把 7 存进 score，再看看第二行算了什么。','这里是数字相加，不是把两个数字拼在一起。'],modify:['从 7 到 10，还需要增加多少？','把第二行的数字改成 3，再观察 score 的变化。']},
    terms:[['score','变量名，用来保存当前分数。'],['=','赋值：先算右边，再把结果存入左边。'],['print','输出变量当前的值。']],
    review:{title:'为什么 score 变了？',lead:'score = score + 3：先算右边，再把结果',choices:[['store','存回 score'],['compare','与 score 比较'],['print','直接打印']],answer:'store',explanation:'等号右边先得到 10，再把 10 存回 score。',takeaway:'赋值会更新变量保存的值，print 读取当前值。'},
    transfer:{prompt:'换一场比赛，初始分数改成 12，仍增加 3 分。输出是多少？',values:{increment:3},context:{start:12},choices:['12','15','123']},
    recap:'你用赋值更新了一个变量。', nextTry:'再试试增加 0 分，变量会怎样变化？'
  },
  {
    id:'weather',title:'下雨时，发出提醒',concept:'条件判断',minutes:10,file:'weather.py',scene:'操场天气',
    description:'根据雨量选择不同分支，检查边界值是否正确。',
    prompt:'rain 是 5，这段代码输出什么？',task:'有雨就输出“带伞”，没雨输出“晴天”。修正条件，并通过 3 组雨量检查。',
    defaults:{operator:'>',threshold:10},fields:[{key:'operator',label:'比较符号',options:['>','>=']},{key:'threshold',label:'雨量比较值',min:0,max:10}],
    predictions:['带伞','晴天','两句都显示'],
    hints:{predict:['5 大于 10 吗？不成立时会进入 else。','先按代码中的条件判断，不要按天气常识猜。'],modify:['一点点雨也算有雨。再想想 rain 等于 0 的情况。','用 rain > 0，同时检查 0、1、5 三种雨量。']},
    terms:[['if','条件为真时，执行下面缩进的代码。'],['else','条件不成立时，执行这个分支。'],['> / >=','大于和大于等于，在相等时结果不同。']],
    review:{title:'条件不成立时怎么办？',lead:'当 rain 不大于 0，程序会',choices:[['both','两个分支都执行'],['else','执行 else 分支'],['stop','停止整个程序']],answer:'else',explanation:'if 和 else 在这里二选一；没有雨就进入 else。',takeaway:'条件决定执行路径，边界值 0 也要检查。'},
    transfer:{prompt:'修正后，把 rain 改成 0。这一次会输出什么？',values:{operator:'>',threshold:0},context:{rain:0},choices:['带伞','晴天','没有输出']},
    recap:'你让程序根据输入做出选择。',nextTry:'把 > 换成 >=，观察 rain 等于 0 时的变化。'
  },
  {
    id:'watering',title:'给 5 株小苗浇水',concept:'循环',minutes:12,file:'watering.py',scene:'校园种植角',
    description:'用循环重复任务，看懂重复次数与变量的累加。',
    prompt:'这段代码一共用了多少杯水？',task:'每株小苗浇 2 杯水。修改循环次数，给 5 株小苗浇水，总共用 10 杯。',
    defaults:{repetitions:2},fields:[{key:'repetitions',label:'循环重复次数',min:0,max:8}],
    predictions:['2','4','10'],
    hints:{predict:['range(2) 会重复两次，每次在 water 上加 2。','第一次变成 2，第二次变成 4。print 在循环外面。'],modify:['有 5 株小苗，一株对应一次循环。','把 range(2) 改成 range(5)，看看 plant 和 water 的变化。']},
    terms:[['for','把缩进的代码重复执行。'],['range(5)','依次提供 0、1、2、3、4，一共五次。'],['缩进','决定哪些语句属于循环体。']],
    review:{title:'哪些代码被重复执行？',lead:'for 下面带缩进的 water = water + 2 会',choices:[['once','只运行一次'],['repeat','每轮循环都运行'],['after','循环结束后才运行']],answer:'repeat',explanation:'缩进把这行放进循环体，因此每一轮都加 2。',takeaway:'循环次数控制重复多少次，缩进决定重复哪些语句。'},
    transfer:{prompt:'把重复次数改成 3，每株仍用 2 杯。最后输出多少？',values:{repetitions:3},context:{},choices:['3','6','10']},
    recap:'你用循环重复完成了一项任务。',nextTry:'把次数改成 0，观察循环体还会不会执行。'
  },
  {
    id:'debug',title:'修好总价计算',concept:'调试',minutes:12,file:'shop.py',scene:'校园小卖部',
    description:'先复现问题，再定位运算错误，用不同数量验证修复。',
    prompt:'现在买 4 本，代码会输出多少元？',task:'每本 3 元，买 4 本应付 12 元。修正 total 的计算，并用不同数量验证。',
    defaults:{operation:'+'},fields:[{key:'operation',label:'计算总价的运算符',options:['+','*','-']}],
    predictions:['7','12','34'],
    hints:{predict:['现在的代码把单价和数量相加了。先算 3 + 4。','代码能运行，不代表计算方式就是对的。'],modify:['买 4 本相当于 3 + 3 + 3 + 3，什么运算更简洁？','把 total 那一行的 + 改成 *，再看 1、2、4 本的检查结果。']},
    terms:[['total','用来保存总价。'],['*','Python 中的乘法符号。'],['调试','复现问题、定位原因、修改，再验证。']],
    review:{title:'怎样确认问题真的修好了？',lead:'修正运算后，还应该',choices:[['one','只看当前的 12 元'],['cases','用不同数量再检查'],['guess','凭感觉认为正确']],answer:'cases',explanation:'换成 1、2、4 本都正确，比只看一次结果更可靠。',takeaway:'调试不止是改一行，还要用不同输入确认修复。'},
    transfer:{prompt:'现在每本改为 5 元，买 3 本。修好的程序输出多少？',values:{operation:'*'},context:{price:5,count:3},choices:['8','15','53']},
    recap:'你复现并修正了一个计算错误。',nextTry:'再换一组单价和数量，先手算，再比较程序结果。'
  }
];
export function lessonById(id) {
  const lesson=LESSONS.find(item=>item.id===id);if(!lesson)throw new Error('没有找到这节课。');return lesson;
}
export function validateValues(id,raw) {
  const lesson=lessonById(id),values={};
  for(const field of lesson.fields){
    const value=raw?.[field.key];
    if(field.options){if(!field.options.includes(value))throw new Error(`请选择${field.label}。`);values[field.key]=value;}
    else {if(value===''||value===null||!['number','string'].includes(typeof value))throw new Error(`请填写${field.label}，范围 ${field.min}–${field.max}。`);const n=Number(value);if(!Number.isInteger(n)||n<field.min||n>field.max)throw new Error(`${field.label}必须是 ${field.min}–${field.max} 的整数。`);values[field.key]=n;}
  }
  return values;
}
function contextNumber(context,key,fallback){const n=context[key]??fallback;if(!Number.isInteger(n)||n<0||n>30)throw new Error('示例输入超出范围。');return n;}
export function simulateLesson(id,raw,context={}) {
  const values=validateValues(id,raw),trace=[],variables={};let output=null;
  const emit=(line,note)=>trace.push({line,note,variables:{...variables},output});
  if(id==='score'){
    variables.score=contextNumber(context,'start',7);emit(1,'创建 score，存入初始分数');
    const before=variables.score;variables.score+=values.increment;emit(2,`${before} + ${values.increment}，存回 score`);
    output=String(variables.score);emit(3,'print 读取 score 当前的值');
  } else if(id==='weather'){
    variables.rain=contextNumber(context,'rain',5);emit(1,'读取雨量 rain');
    const condition=values.operator==='>'?variables.rain>values.threshold:variables.rain>=values.threshold;
    emit(2,`${variables.rain} ${values.operator} ${values.threshold} 为 ${condition?'真':'假'}`);
    if(condition){output='带伞';emit(3,'条件成立，只执行 if 分支');}
    else {emit(4,'条件不成立，进入 else');output='晴天';emit(5,'只执行 else 中的输出');}
  } else if(id==='watering'){
    variables.water=0;emit(1,'创建 water，从 0 开始累计');
    if(values.repetitions===0)emit(2,'range(0) 不执行循环体');
    for(let plant=0;plant<values.repetitions;plant++){
      variables.plant=plant;emit(2,`第 ${plant+1} 次循环，plant = ${plant}`);
      variables.water+=2;emit(3,`增加 2 杯，现在累计 ${variables.water} 杯`);
    }
    output=String(variables.water);emit(4,'循环结束，输出总用水量');
  } else {
    variables.price=contextNumber(context,'price',3);emit(1,'记录每本的单价');
    variables.count=contextNumber(context,'count',4);emit(2,'记录购买数量');
    const {price,count}=variables;
    variables.total=values.operation==='*'?price*count:values.operation==='+'?price+count:price-count;emit(3,`${price} ${values.operation} ${count} = ${variables.total}`);
    output=String(variables.total);emit(4,'输出 total；再与实际应付金额比较');
  }
  return {values,trace,output,variables:{...variables}};
}
export function evaluateLesson(id,raw) {
  const result=simulateLesson(id,raw),checks=[];
  const add=(label,actual,expected)=>checks.push({label,actual:String(actual),expected:String(expected),passed:String(actual)===String(expected)});
  if(id==='score')add('比分与输出都变成 10',result.output,'10');
  else if(id==='weather')for(const rain of [0,1,5])add(`雨量 rain = ${rain}`,simulateLesson(id,raw,{rain}).output,rain===0?'晴天':'带伞');
  else if(id==='watering'){
    add('给 5 株小苗浇水',result.values.repetitions,5);add('总共使用 10 杯水',result.output,'10');
  }else for(const count of [1,2,4])add(`每本 3 元，买 ${count} 本`,simulateLesson(id,raw,{count}).output,3*count);
  return {...result,checks,passed:checks.every(check=>check.passed)};
}
export function codeRows(id,raw,context={}) {
  const v=validateValues(id,raw),literal=text=>[{text}],field=key=>({field:key});
  if(id==='score')return [literal(`score = ${context.start??7}`),[{text:'score = score + '},field('increment')],literal('print(score)')];
  if(id==='weather')return [literal(`rain = ${context.rain??5}`),[{text:'if rain '},field('operator'),{text:' '},field('threshold'),{text:':'}],literal('    print("带伞")'),literal('else:'),literal('    print("晴天")')];
  if(id==='watering')return [literal('water = 0'),[{text:'for plant in range('},field('repetitions'),{text:'):'}],literal('    water = water + 2'),literal('print(water)')];
  return [literal(`price = ${context.price??3}`),literal(`count = ${context.count??4}`),[{text:'total = price '},field('operation'),{text:' count'}],literal('print(total)')];
}
export function transferAnswer(id){const lesson=lessonById(id);return simulateLesson(id,lesson.transfer.values,lesson.transfer.context).output;}
export function freshProgress(id){return {stage:'predict',values:{...lessonById(id).defaults},executed:false,runs:[]};}
export function normalizeSave(raw) {
  const clean={version:1,current:'score',view:'lesson',completed:{},lessons:{}};
  if(!raw||raw.version!==1)return clean;
  if(LESSONS.some(item=>item.id===raw.current))clean.current=raw.current;
  if(['lesson','courses','recap'].includes(raw.view))clean.view=raw.view;
  for(const lesson of LESSONS){
    if(raw.completed?.[lesson.id]===true)clean.completed[lesson.id]=true;
    const saved=raw.lessons?.[lesson.id];if(!saved)continue;
    try{
      const values=validateValues(lesson.id,saved.values),stage=['predict','modify','explain','transfer','done'].includes(saved.stage)?saved.stage:'predict';
      const runs=Array.isArray(saved.runs)?saved.runs.filter(run=>run&&typeof run.output==='string'&&typeof run.change==='string').slice(-20):[];
      const executed=saved.executed===true,passed=evaluateLesson(lesson.id,values).passed;
      clean.lessons[lesson.id]={stage:['explain','transfer','done'].includes(stage)&&(!executed||!passed)?'modify':stage,values,executed,runs};
      if(stage==='predict')clean.lessons[lesson.id]={...freshProgress(lesson.id),runs};
    }catch{clean.lessons[lesson.id]=freshProgress(lesson.id);}
  }
  if(clean.view==='recap'&&!clean.completed[clean.current])clean.view='lesson';
  return clean;
}
