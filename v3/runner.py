"""The same lesson runner is tested by CPython and executed by browser Pyodide.
A teaching scope and resource limits, not a security sandbox for hostile Python.
"""
import ast
import builtins
import json
import sys
import time

SPECS = {
    'battery': [({}, '10', {'energy': 10}, '电量和输出都为 10')],
    'weather': [({'rain': 5}, '带伞', {}, '小雨 5'), ({'rain': 0}, '晴天', {}, '无雨 0'), ({'rain': 18}, '带伞', {}, '大雨 18')],
    'charge': [({}, '10', {'energy': 10}, '循环后的电量为 10')],
    'readings': [({'readings': [2, 4, 1, 3]}, '10', {'total': 10}, '观测记录 [2, 4, 1, 3]'), ({'readings': [5, 0, 2]}, '7', {'total': 7}, '观测记录 [5, 0, 2]')],
    'functions': [({}, '10', {'energy': 10}, '示例设备的电量为 10')],
    'rescue': [({'readings': [3, 12, 0, 10]}, '[10, 12, 10, 10]', {'repaired': [10, 12, 10, 10]}, '保留充足电量，补足低电量'), ({'readings': [1, 15, 8]}, '[10, 15, 10]', {'repaired': [10, 15, 10]}, '换一组设备')]
}
REQUIRED = {'weather': (ast.If,), 'charge': (ast.For,), 'readings': (ast.For,), 'functions': (ast.FunctionDef,), 'rescue': (ast.FunctionDef, ast.If, ast.For)}
FRIENDLY = {
    'SyntaxError': '检查这一行的括号、引号，以及 if、for、def 后的冒号。',
    'IndentationError': '同一段代码要对齐。if、for、def 里面的语句通常缩进 4 个空格。',
    'TabError': '请统一使用空格缩进，避免混用 Tab。',
    'NameError': '变量要先赋值再使用，也要检查名字有没有拼错。',
    'TypeError': '检查运算两边的数据类型，或函数参数的个数。',
    'ZeroDivisionError': '除数不能是 0。先检查参与计算的变量。',
    'IndexError': '列表的第一个位置是 0，最后一个位置是 len(列表) - 1。',
    'RuntimeError': '程序运行得太久或输出太多了。检查循环是否能结束。',
    'RecursionError': '函数重复调用自己太多次了。检查是否有结束条件。',
}


def display(value, depth=0):
    if depth > 2:
        return '…'
    if type(value) in (str, int, float, bool, type(None)):
        return repr(value)[:120]
    if type(value) in (list, tuple):
        return '[' + ', '.join(display(v, depth + 1) for v in value[:10]) + (', …' if len(value) > 10 else '') + ']'
    if type(value) is dict:
        return '{' + ', '.join(str(k)[:20] + ': ' + display(v, depth + 1) for k, v in list(value.items())[:6]) + '}'
    return '函数' if callable(value) else type(value).__name__


def visible(namespace):
    return {k: display(v) for k, v in list(namespace.items())[:60] if not k.startswith('_')}


def run_lesson(source, lesson):
    if lesson not in SPECS:
        return {'error': {'type': 'LessonError', 'line': None, 'message': '没有找到这项任务。', 'hint': '请重新选择课程。'}, 'trace': [], 'checks': [], 'output': '', 'variables': {}}
    if not isinstance(source, str) or len(source) > 12000:
        return {'error': {'type': 'CodeLengthError', 'line': None, 'message': '代码不能超过 12000 个字符。', 'hint': '请精简代码后再运行。'}, 'trace': [], 'checks': [], 'output': '', 'variables': {}}
    traces, checks, first_output, first_vars, first_error = [], [], '', {}, None
    try:
        tree = ast.parse(source, filename='expedition.py')
        if any(isinstance(n, (ast.Import, ast.ImportFrom)) for n in ast.walk(tree)):
            raise ValueError('此工作台暂不支持导入库，请使用基础 Python 完成任务。')
        code = compile(tree, 'expedition.py', 'exec')
    except Exception as error:
        return {'error': {'type': type(error).__name__, 'line': getattr(error, 'lineno', None), 'message': str(error).split(' (expedition.py')[0], 'hint': FRIENDLY.get(type(error).__name__, '请使用变量、条件、循环、列表和函数完成任务。')}, 'trace': [], 'checks': [], 'output': '', 'variables': {}}
    nodes = list(ast.walk(tree))
    for node_type in REQUIRED.get(lesson, ()):
        if not any(isinstance(n, node_type) for n in nodes):
            names = {ast.If: 'if 条件判断', ast.For: 'for 循环', ast.FunctionDef: 'def 函数'}
            checks.append({'label': '练习本课的方法：' + names[node_type], 'passed': False, 'expected': names[node_type], 'actual': '还没有使用'})
    for index, (inputs, expected, expected_vars, label) in enumerate(SPECS[lesson]):
        printed, ticks, started = [], 0, time.monotonic()
        recording = True
        namespace = {}

        def lesson_print(*values, sep=' ', end='\n', **kwargs):
            text = sep.join(str(v) for v in values) + end
            if sum(map(len, printed)) + len(text) > 8000:
                raise RuntimeError('输出超过 8000 个字符，请减少输出次数。')
            printed.append(text)

        allowed = 'abs all any bool dict enumerate filter float int isinstance len list map max min next pow range reversed round set sorted str sum tuple zip'.split()
        namespace.update(inputs)
        namespace['__builtins__'] = {name: getattr(builtins, name) for name in allowed}
        namespace['__builtins__']['print'] = lesson_print
        namespace['__name__'] = '__student__'

        def trace(frame, event, arg):
            nonlocal ticks
            if frame.f_code.co_filename == 'expedition.py' and event in ('line', 'call'):
                ticks += 1
                if ticks > 3000 or time.monotonic() - started > 2:
                    raise RuntimeError('已停止：执行超过 3000 步或 2 秒。请检查循环的结束条件。')
                if index == 0 and recording and event == 'line' and len(traces) < 300:
                    scope = {**namespace, **frame.f_locals}
                    traces.append({'line': frame.f_lineno, 'variables': visible(scope), 'output': ''.join(printed)[:8000]})
            return trace

        error_info = None
        try:
            sys.settrace(trace)
            exec(code, namespace)
            recording = False
            if lesson == 'functions':
                fn = namespace.get('recharge')
                for args, want in [((1, 2), 3), ((8, 0), 8), ((0, 5), 5)]:
                    got = fn(*args) if callable(fn) else None
                    checks.append({'label': 'recharge' + str(args), 'passed': type(got) in (int, float) and got == want, 'expected': str(want), 'actual': display(got)})
        except Exception as error:
            tb = error.__traceback__
            line = None
            while tb:
                if tb.tb_frame.f_code.co_filename == 'expedition.py':
                    line = tb.tb_lineno
                tb = tb.tb_next
            error_info = {'type': type(error).__name__, 'line': line, 'message': str(error)[:300], 'hint': FRIENDLY.get(type(error).__name__, '检查当前行的变量和语法，再试一次。')}
        finally:
            sys.settrace(None)
        output = ''.join(printed).strip()
        actual_vars = {k: namespace.get(k) for k in expected_vars}
        ok = error_info is None and output == expected and all(type(actual_vars[k]) is type(v) and actual_vars[k] == v for k, v in expected_vars.items())
        wanted = expected
        actual = error_info['type'] if error_info else output or '没有输出'
        if expected_vars and not ok and error_info is None:
            wanted = '输出 ' + expected + '；' + '，'.join(k + '=' + display(v) for k, v in expected_vars.items())
            actual = '输出 ' + (output or '无') + '；' + '，'.join(k + '=' + display(v) for k, v in actual_vars.items())
        checks.append({'label': label, 'passed': ok, 'expected': wanted, 'actual': actual})
        if index == 0:
            first_output, first_vars, first_error = output, visible(namespace), error_info
            traces.append({'line': None, 'variables': first_vars, 'output': output})
        elif error_info and first_error is None:
            first_error = {**error_info, 'hint': label + '：' + error_info['hint']}
    return {'error': first_error, 'trace': traces, 'traceTruncated': len(traces) > 300, 'checks': checks, 'passed': first_error is None and bool(checks) and all(c['passed'] for c in checks), 'output': first_output, 'variables': first_vars}


def run_json(source, lesson):
    return json.dumps(run_lesson(source, lesson), ensure_ascii=False)
