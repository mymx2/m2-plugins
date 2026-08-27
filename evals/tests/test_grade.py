"""grade.py 的单元测试。

锁定 grading 的输入打包与输出校验,防止改脚本时悄悄放宽/收紧口径:
- merge 的字段校验(缺 text/passed/evidence 必须拒);
- summary 的重算(pass_rate = passed/total,不信任输入);
- pack 的 eval 分派(baseline vs pressure);
- 全部在临时目录构造 run/case,不碰真实 evals/runs/。
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import grade  # noqa: E402


def make_run(tmp_path: Path, name: str, files: dict) -> Path:
    run = tmp_path / name
    run.mkdir()
    for rel, content in files.items():
        p = run / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    return run


def make_case(tmp_path: Path, skill: str) -> Path:
    """在临时 CASES 目录写一份最小 case,并把 grade.CASES 指过去。"""
    cases_dir = tmp_path / "cases"
    cases_dir.mkdir(exist_ok=True)
    case = {
        "skill_name": skill,
        "trigger": {"positive": [], "negative": []},
        "evals": [
            {"id": 1, "kind": "execution", "prompt": "base", "expectations": ["e1", "e2"]},
            {"id": 2, "kind": "execution", "pressure": "sunk-cost", "prompt": "press", "expectations": ["p1"]},
        ],
    }
    (cases_dir / f"{skill}.json").write_text(json.dumps(case), encoding="utf-8")
    return cases_dir


class TestPickEval:
    def test_baseline_picks_no_pressure(self, tmp_path, monkeypatch):
        monkeypatch.setattr(grade, "CASES", make_case(tmp_path, "write"))
        case = grade.load_case("write")
        assert grade.pick_eval(case, "baseline", None)["id"] == 1

    def test_pressure_variant_picks_pressure_eval(self, tmp_path, monkeypatch):
        # run 目录的 variant 是 "pressure",应匹配带任意 pressure 字段的 eval
        monkeypatch.setattr(grade, "CASES", make_case(tmp_path, "write"))
        case = grade.load_case("write")
        assert grade.pick_eval(case, "pressure", None)["id"] == 2

    def test_explicit_eval_id_wins(self, tmp_path, monkeypatch):
        monkeypatch.setattr(grade, "CASES", make_case(tmp_path, "write"))
        case = grade.load_case("write")
        assert grade.pick_eval(case, "baseline", 2)["id"] == 2

    def test_unknown_eval_id_exits(self, tmp_path, monkeypatch):
        monkeypatch.setattr(grade, "CASES", make_case(tmp_path, "write"))
        case = grade.load_case("write")
        with pytest.raises(SystemExit):
            grade.pick_eval(case, "baseline", 99)


class TestSkillVariant:
    def test_splits_on_first_dash(self):
        assert grade.skill_variant(Path("evals/runs/write-baseline")) == ("write", "baseline")

    def test_variant_keeps_rest(self):
        assert grade.skill_variant(Path("runs/hunt-pressure-x")) == ("hunt", "pressure-x")

    def test_no_dash_exits(self):
        with pytest.raises(SystemExit):
            grade.skill_variant(Path("runs/writebaseline"))


class TestMerge:
    def _args(self, run_dir: Path, infile: Path, out: Path):
        return type(
            "A",
            (),
            {"run_dir": str(run_dir), "input": str(infile), "out": str(out)},
        )()

    def test_merge_computes_summary(self, tmp_path, monkeypatch):
        monkeypatch.setattr(grade, "RESULTS", tmp_path / "results")
        run = make_run(tmp_path, "hunt-baseline", {"actions.log": "x\n"})
        infile = tmp_path / "g.json"
        infile.write_text(
            json.dumps(
                {
                    "expectations": [
                        {"text": "e1", "passed": True, "evidence": "a"},
                        {"text": "e2", "passed": False, "evidence": "b"},
                        {"text": "e3", "passed": True, "evidence": "c"},
                    ]
                }
            ),
            encoding="utf-8",
        )
        out = tmp_path / "out.json"
        grade.cmd_merge(self._args(run, infile, out))
        d = json.loads(out.read_text(encoding="utf-8"))
        assert d["summary"]["passed"] == 2
        assert d["summary"]["failed"] == 1
        assert d["summary"]["total"] == 3
        # 实现对 pass_rate 做 round(x, 4),比对时按同样的舍入口径
        assert d["summary"]["pass_rate"] == round(2 / 3, 4)
        assert d["skill"] == "hunt" and d["variant"] == "baseline"

    @pytest.mark.parametrize(
        "bad_exp",
        [
            {"passed": True, "evidence": "a"},  # 缺 text
            {"text": "e", "evidence": "a"},  # 缺 passed
            {"text": "e", "passed": True},  # 缺 evidence
            {"text": "e", "passed": "yes", "evidence": "a"},  # passed 非 bool
        ],
    )
    def test_merge_rejects_bad_expectation(self, tmp_path, monkeypatch, bad_exp):
        monkeypatch.setattr(grade, "RESULTS", tmp_path / "results")
        run = make_run(tmp_path, "write-baseline", {"actions.log": "x\n"})
        infile = tmp_path / "g.json"
        infile.write_text(json.dumps({"expectations": [bad_exp]}), encoding="utf-8")
        with pytest.raises(SystemExit):
            grade.cmd_merge(self._args(run, infile, tmp_path / "out.json"))
