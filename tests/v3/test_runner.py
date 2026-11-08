import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('runner', ROOT / 'v3/runner.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
SOLUTIONS = json.loads((ROOT / 'tests/v3/solutions.json').read_text())

class RunnerTests(unittest.TestCase):
    def test_all_six_lessons_and_starters(self):
        lessons = json.loads((ROOT/'v3/lessons.json').read_text())
        self.assertEqual(len(lessons), 6)
        for lesson in lessons:
            with self.subTest(lesson=lesson['id']):
                self.assertFalse(runner.run_lesson(lesson['starter'], lesson['id'])['passed'])
                result = runner.run_lesson(SOLUTIONS[lesson['id']], lesson['id'])
                self.assertTrue(result['passed'], result)
                self.assertTrue(result['trace'])
                self.assertIsNone(result['trace'][-1]['line'])
    def test_cannot_pass_with_only_print(self):
        for lesson in ('battery', 'charge', 'functions'):
            self.assertFalse(runner.run_lesson('print(10)', lesson)['passed'])
    def test_other_inputs_reject_hard_coded_answers(self):
        result=runner.run_lesson('if rain > 10:\n print("带伞")\nelse:\n print("晴天")', 'weather')
        self.assertEqual([c['passed'] for c in result['checks']], [False,True,True])
        self.assertFalse(runner.run_lesson('def recharge(energy, amount):\n return 10\nenergy=10\nprint(energy)', 'functions')['passed'])
    def test_names_do_not_leak_across_runs(self):
        runner.run_lesson('energy=10\nprint(energy)', 'battery')
        self.assertEqual(runner.run_lesson('print(energy)', 'battery')['error']['type'], 'NameError')
    def test_error_location_and_guidance(self):
        for code, kind, line in [('energy=3\nprint(missing)', 'NameError', 2), ('if True\n print(1)', 'SyntaxError', 1), ('energy=1/0', 'ZeroDivisionError', 1)]:
            result=runner.run_lesson(code, 'battery')
            self.assertEqual(result['error']['type'], kind)
            self.assertEqual(result['error']['line'], line)
            self.assertTrue(result['error']['hint'])
    def test_infinite_loop_and_recursion_stop(self):
        self.assertEqual(runner.run_lesson('while True:\n pass', 'battery')['error']['type'], 'RuntimeError')
        self.assertIn(runner.run_lesson('def f():\n return f()\nf()', 'battery')['error']['type'], ('RuntimeError','RecursionError'))
    def test_output_and_input_limits(self):
        self.assertIsNotNone(runner.run_lesson('print("x" * 8001)', 'battery')['error'])
        self.assertIsNotNone(runner.run_lesson('x'*12001, 'battery')['error'])
    def test_trace_has_real_before_line_variables(self):
        result=runner.run_lesson(SOLUTIONS['battery'], 'battery')
        self.assertEqual(result['trace'][1]['variables']['energy'],'3')
        self.assertEqual(result['trace'][2]['variables']['energy'],'10')
    def test_lesson_guidance_matches_engine_inputs(self):
        lessons=json.loads((ROOT/'v3/lessons.json').read_text())
        for lesson in lessons:
            self.assertEqual(lesson['inputs'], runner.SPECS[lesson['id']][0][0])
            review=lesson['review']
            self.assertIn(review['answer'], range(len(review['choices'])))
            self.assertEqual(len(set(review['choices'])),len(review['choices']))
            self.assertTrue(lesson['explain'] and review['explanation'])
    def test_variable_check_names_the_actual_value(self):
        result=runner.run_lesson('energy=3\nprint(10)', 'battery')
        self.assertFalse(result['passed'])
        self.assertIn('energy=3',result['checks'][-1]['actual'])
        self.assertIn('energy=10',result['checks'][-1]['expected'])
    def test_trace_excludes_hidden_function_checks(self):
        result=runner.run_lesson(SOLUTIONS['functions'],'functions')
        amounts={frame['variables']['amount'] for frame in result['trace'] if 'amount' in frame['variables']}
        self.assertEqual(amounts, {'7'})
    def test_import_is_explained_and_json_safe(self):
        self.assertIn('暂不支持',runner.run_lesson('import os', 'battery')['error']['message'])
        self.assertIsInstance(json.loads(runner.run_json(SOLUTIONS['battery'], 'battery')),dict)

if __name__ == '__main__':
    unittest.main()
