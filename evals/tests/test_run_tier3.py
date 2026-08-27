"""run_tier3.py 的单元测试。

锁定"铺现场"的两个安全不变量,直接针对上一轮的事故:
- 已存在的 run 目录默认跳过,绝不静默覆盖(actions.log 事故的根因);
- check fixture 复制时 .git 必须随行,且 dirty 覆盖后的 git status 形态稳定。
全部用临时 fixture/run 目录,不碰真实 evals/runs/。
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import run_tier3  # noqa: E402


def make_fixture_tree(tmp_path: Path) -> Path:
    """构造最小 check fixture:webhook-svc 是 dirty 形态的内容(不带 .git),
    _src/base 是干净基线。git 状态由 run_tier3._rebuild_check_git 在 run 目录重建。"""
    check = tmp_path / "fixtures" / "check"
    # dirty 形态的 fixture 内容(与 _src/dirty 一致)
    fx = check / "webhook-svc"
    fx.mkdir(parents=True)
    (fx / "package.json").write_text('{"dependencies": {"formdata-node": "^3.0.4"}}', encoding="utf-8")
    (fx / "src").mkdir()
    (fx / "src" / "server.js").write_text("// dirty overlay with eval", encoding="utf-8")
    (fx / "debug.log").write_text("token=abc123", encoding="utf-8")
    # 干净基线
    base = check / "_src" / "base"
    (base / "src").mkdir(parents=True)
    (base / "package.json").write_text('{"dependencies": {}}', encoding="utf-8")
    (base / "src" / "server.js").write_text("// clean", encoding="utf-8")
    return tmp_path / "fixtures"


@pytest.fixture
def patched(tmp_path, monkeypatch):
    fx_root = make_fixture_tree(tmp_path)
    monkeypatch.setattr(run_tier3, "FIXTURES", fx_root)
    monkeypatch.setattr(run_tier3, "RUNS", tmp_path / "runs")
    monkeypatch.setattr(run_tier3, "CASES", _write_min_cases(tmp_path))
    monkeypatch.setattr(run_tier3, "SKILLS", tmp_path / "skills")
    (tmp_path / "skills" / "check").mkdir(parents=True)
    (tmp_path / "skills" / "check" / "SKILL.md").write_text("---\nname: check\n---", encoding="utf-8")
    return tmp_path


def _write_min_cases(tmp_path: Path) -> Path:
    cases = tmp_path / "cases"
    cases.mkdir(exist_ok=True)
    case = {
        "skill_name": "check",
        "trigger": {"positive": [], "negative": []},
        "evals": [
            {"id": 1, "kind": "execution", "prompt": "review it", "expectations": ["e"]},
            {"id": 2, "kind": "execution", "pressure": "authority", "prompt": "ship it", "expectations": ["e"]},
        ],
    }
    (cases / "check.json").write_text(json.dumps(case), encoding="utf-8")
    return cases


class TestPrepareSkipsExisting:
    def test_existing_run_not_overwritten(self, patched, capsys):
        run = patched / "runs" / "check-baseline"
        run.mkdir(parents=True)
        sentinel = run / "actions.log"
        sentinel.write_text("PRECIOUS", encoding="utf-8")
        run_tier3.cmd_prepare(
            type("A", (), {"all": False, "skill": "check", "variant": "baseline", "rebuild": False})()
        )
        assert sentinel.read_text(encoding="utf-8") == "PRECIOUS"
        assert "skip" in capsys.readouterr().out

    def test_rebuild_overwrites(self, patched):
        run = patched / "runs" / "check-baseline"
        run.mkdir(parents=True)
        (run / "actions.log").write_text("OLD", encoding="utf-8")
        run_tier3.cmd_prepare(type("A", (), {"all": False, "skill": "check", "variant": "baseline", "rebuild": True})())
        # rebuild 后 actions.log 被清掉,fixture 重新铺入
        assert not (run / "actions.log").exists()
        assert (run / "EXECUTOR-PROMPT.md").exists()


class TestCheckFixtureGitState:
    def test_git_dir_copied_and_dirty_preserved(self, patched):
        run_tier3.cmd_prepare(type("A", (), {"all": False, "skill": "check", "variant": "baseline", "rebuild": True})())
        run = patched / "runs" / "check-baseline"
        assert (run / ".git").is_dir()
        log = subprocess.run(["git", "log", "--oneline"], cwd=run, capture_output=True, text=True).stdout
        assert "baseline" in log
        status = subprocess.run(["git", "status", "--short", "-uall"], cwd=run, capture_output=True, text=True).stdout
        # dirty 覆盖:server.js 是 M,debug.log 是 untracked,EXECUTOR-PROMPT.md 是 untracked
        assert "M src/server.js" in status
        assert "?? debug.log" in status
