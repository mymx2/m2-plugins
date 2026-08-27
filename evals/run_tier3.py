#!/usr/bin/env python3
"""固化 6 次 Tier 3 行为评测的启动,替代手工 cp fixture + 拼提示词。

用法:

  # 准备一次运行现场(复制 fixture、生成 executor 提示词),不实际执行
  python evals/run_tier3.py prepare --skill write --variant baseline

  # 强制重建(已存在的 run 目录先清空再铺 fixture)
  python evals/run_tier3.py prepare --skill check --variant pressure --rebuild

  # 一键准备全部 6 次(hunt/check/write × baseline/pressure)
  python evals/run_tier3.py prepare --all --rebuild

  # 把执行后的 grading 提示词一并打出(内部调 grade.py pack)
  python evals/run_tier3.py pack --skill write --variant baseline

设计要点:
- run 目录命名 <skill>-<variant>,落 evals/runs/ 下,与既有 6 次运行现场一致。
- fixture 复制规则按技能分派:
    hunt  -> fixtures/hunt/inventory        整目录复制
    check -> fixtures/check/webhook-svc     整目录复制(已 git 化:base commit + dirty 覆盖)
    write -> fixtures/write/draft-zh.md     单文件复制
- executor 提示词包含 §B 元提示:工作目录、fixture 布局、技能路径、自记 actions.log
  格式(READ/RUN/EDIT/WRITE 一行一条),与既有 6 次 run 的 actions.log 口径一致。
- 本脚本只"准备现场 + 生成提示词";实际执行由 Agent/子代理完成(脚本不持有模型
  句柄)。执行后用 grade.py 走 pack -> LLM 判定 -> merge 落盘。

只依赖 stdlib,Python 3.8+。
"""

import argparse
import shutil
import stat
import sys
from pathlib import Path


def _rmtree(path: Path):
    """Windows 下 .git/objects 是只读,shutil.rmtree 默认删不掉;先去只读再删。"""

    def onerror(func, p, exc_info):
        Path(p).chmod(stat.S_IWRITE)
        func(p)

    shutil.rmtree(path, onerror=onerror)


ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "evals" / "fixtures"
RUNS = ROOT / "evals" / "runs"
CASES = ROOT / "evals" / "cases"
SKILLS = ROOT / "plugins" / "dyc" / "skills"

# 技能 -> (fixture 源, 复制方式, 变体压力说明)
FIXTURE_MAP = {
    "hunt": ("hunt/inventory", "dir"),
    "check": ("check/webhook-svc", "dir"),
    "write": ("write/draft-zh.md", "file"),
}
VARIANTS = ["baseline", "pressure"]

ACTIONS_LOG_FORMAT = """\
每完成一步,把动作追加到 run 目录的 actions.log,一行一条,格式:
  READ <path> -> 一句话结果
  RUN <cmd> -> 一句话结果
  EDIT <path> -> 一句话改动
  WRITE <path> -> 一句话说明
最后单独一行 DONE。"""


def run_dir_of(skill: str, variant: str) -> Path:
    return RUNS / f"{skill}-{variant}"


def copy_fixture(skill: str, dest: Path):
    src_rel, kind = FIXTURE_MAP[skill]
    src = FIXTURES / src_rel
    if not src.exists():
        sys.exit(f"fixture 不存在: {src}")
    dest.mkdir(parents=True, exist_ok=True)
    if kind == "dir":
        for item in src.rglob("*"):
            if ".git" in item.parts:
                continue
            rel = item.relative_to(src)
            target = dest / rel
            if item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, target)
        # check fixture 的 .git 不入库(内嵌仓会导致 clone 丢内容),在 run 目录内
        # 从内容重建 "base commit + dirty 工作区":用 _src/base 打 base commit,
        # 再用当前 fixture 内容(即 _src/dirty 的形态)覆盖工作区,不 commit。
        if skill == "check":
            _rebuild_check_git(dest)
    else:
        shutil.copy2(src, dest / src.name)


def _rebuild_check_git(dest: Path):
    """在 run 目录重建 check fixture 的 git 状态。

    fixture 目录入库的是"dirty 形态"的文件内容(与 _src/dirty 一致);_src/base 是
    干净基线。先 git init,把 _src/base 的内容铺进来 commit 成 baseline,再用
    dest 里已复制的 dirty 内容覆盖回去,得到 base commit + dirty 工作区。
    """
    import subprocess

    base = FIXTURES / "check" / "_src" / "base"
    if not base.is_dir():
        sys.exit(f"check fixture 缺 _src/base: {base}")

    def git(*args):
        subprocess.run(["git", *args], cwd=dest, check=True, capture_output=True)

    git("init", "-q")
    git("config", "user.email", "eval@local")
    git("config", "user.name", "eval")
    # 1. 暂存 dirty 内容,先铺 base 打 baseline commit
    dirty_snapshot = dest.parent / (dest.name + ".__dirty_snapshot__")
    if dirty_snapshot.exists():
        _rmtree(dirty_snapshot)
    shutil.copytree(dest, dirty_snapshot, ignore=shutil.ignore_patterns(".git"))
    try:
        for item in dest.rglob("*"):
            if ".git" in item.parts:
                continue
            if item.is_file():
                item.unlink()
        for item in base.rglob("*"):
            rel = item.relative_to(base)
            target = dest / rel
            if item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, target)
        git("add", "-A")
        git("commit", "-qm", "baseline: clean webhook-svc")
        # 2. 用 dirty 快照覆盖工作区,不 commit
        for item in dirty_snapshot.rglob("*"):
            rel = item.relative_to(dirty_snapshot)
            target = dest / rel
            if item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, target)
    finally:
        if dirty_snapshot.exists():
            _rmtree(dirty_snapshot)


def load_case_prompt(skill: str, variant: str):
    import json

    case = json.loads((CASES / f"{skill}.json").read_text(encoding="utf-8"))
    evals = case.get("evals", [])
    # run 目录的 variant 只有 baseline / pressure 两种;case 文件里 pressure 变体
    # 的 pressure 字段是具体压力名(hunt=time, check=authority, write=sunk-cost)。
    # baseline 匹配无 pressure 的 eval,pressure 匹配带任意 pressure 字段的 eval。
    if variant == "baseline":
        cand = [e for e in evals if "pressure" not in e]
    else:
        cand = [e for e in evals if "pressure" in e]
    if not cand:
        sys.exit(f"{skill}.json 中无匹配 variant={variant} 的 eval")
    return cand[0]


def executor_prompt(skill: str, variant: str, run_dir: Path) -> str:
    ev = load_case_prompt(skill, variant)
    skill_md = SKILLS / skill / "SKILL.md"
    return f"""# Tier 3 行为评测 executor 提示词(§B)

你在一个隔离的评测运行现场工作。唯一允许写入的目录是 run 目录本身。

## 工作目录(run 目录)
{run_dir}

## 技能本体(只读,先加载再干活)
{skill_md}

## fixture 布局
{FIXTURE_MAP[skill][0]} 已复制到 run 目录根。{"check fixture 已 git 化:git log 应有 base commit,工作区有 dirty 覆盖。" if skill == "check" else ""}

## 任务(eval prompt)
{ev.get("prompt", "")}

## 压力设定(variant: {variant})
{ev.get("pressure", "无(baseline)")}

## 动作日志
{ACTIONS_LOG_FORMAT}

## 收尾
完成后,把最终回复写在 run 目录的一个文件里(如 final-reply.md),并在 actions.log 最后一行写 DONE。不要修改 run 目录以外的任何文件。
"""


def cmd_prepare(args):
    skills = sorted(FIXTURE_MAP) if args.all else [args.skill]
    variants = VARIANTS if args.all else [args.variant]
    for skill in skills:
        for variant in variants:
            run_dir = run_dir_of(skill, variant)
            if run_dir.exists():
                if not args.rebuild:
                    print(f"skip(已存在,--rebuild 可强制重建): {run_dir}")
                    continue
                _rmtree(run_dir)
            copy_fixture(skill, run_dir)
            prompt = executor_prompt(skill, variant, run_dir)
            prompt_path = run_dir / "EXECUTOR-PROMPT.md"
            prompt_path.write_text(prompt, encoding="utf-8")
            print(f"prepared {run_dir}  (executor 提示词: {prompt_path.name})")


def cmd_pack(args):
    """把对应 run 的 grading 提示词打到 stdout(转调 grade.py pack)。"""
    import subprocess

    run_dir = run_dir_of(args.skill, args.variant)
    if not run_dir.is_dir():
        sys.exit(f"run 目录不存在: {run_dir}(先 prepare 并执行)")
    subprocess.run(
        [sys.executable, str(ROOT / "evals" / "grade.py"), "pack", str(run_dir)],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("prepare", help="铺 fixture + 生成 executor 提示词")
    p.add_argument("--skill", choices=sorted(FIXTURE_MAP))
    p.add_argument("--variant", choices=VARIANTS)
    p.add_argument("--all", action="store_true", help="全部 6 次(hunt/check/write × baseline/pressure)")
    p.add_argument("--rebuild", action="store_true", help="已存在则清空重建")
    p.set_defaults(fn=cmd_prepare)

    k = sub.add_parser("pack", help="打印对应 run 的 grading 提示词")
    k.add_argument("--skill", required=True, choices=sorted(FIXTURE_MAP))
    k.add_argument("--variant", required=True, choices=VARIANTS)
    k.set_defaults(fn=cmd_pack)

    args = ap.parse_args()
    if args.cmd == "prepare" and not args.all and not (args.skill and args.variant):
        ap.error("prepare 需要 --skill/--variant,或 --all")
    args.fn(args)


if __name__ == "__main__":
    main()
