#!/usr/bin/env python3
"""固化 Tier 3 grading 流程,替代手工逐条判。

两种用法:

  # 1. 打包某个 run 的 grading 输入(打印到 stdout,可直接喂给 LLM 评审员)
  python evals/grade.py pack <run_dir> [--case CASE.json] [--eval-id N]

  # 2. 合并:读 LLM 评审员按提示词产出的 JSON,校验结构、补齐 summary,落盘 results/
  python evals/grade.py merge <run_dir> --input graded.json [--out evals/results/grading-<skill>-<variant>.json]

设计依据:vendor grader.md(agents/grader.md)规定 grading JSON 的字段结构
(expectations[].text/passed/evidence、summary、claims、eval_feedback)。判定本身
需要读 transcript + 产物做语义判断,无法纯脚本化;脚本固化的是"输入打包"
(把 run 目录、case expectations、判定规则拼成可复现的提示词)与"输出校验"
(字段齐全、passed 与 evidence 一致、summary 重新计算),让 6 次 run 的
grading 口径一致、可一键重跑。

只依赖 stdlib,Python 3.8+。
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUNS = ROOT / "evals" / "runs"
CASES = ROOT / "evals" / "cases"
RESULTS = ROOT / "evals" / "results"

RUN_DIR_RE = "{skill}-{variant}"

# 输出 JSON 的必填字段(vendor grader.md Output Format 的子集,与既有 grading-*.json 对齐)
REQUIRED_TOP = ["skill", "variant", "run_dir", "expectations", "summary"]
REQUIRED_EXP = ["text", "passed", "evidence"]


def run_dir_of(arg: str) -> Path:
    d = Path(arg)
    if not d.is_absolute():
        d = ROOT / arg
    if not d.is_dir():
        sys.exit(f"run_dir 不存在: {d}")
    return d


def skill_variant(run_dir: Path):
    name = run_dir.name
    if "-" not in name:
        sys.exit(f"run_dir 命名应为 {RUN_DIR_RE}: {name}")
    skill, variant = name.split("-", 1)
    return skill, variant


def load_case(skill: str):
    p = CASES / f"{skill}.json"
    if not p.exists():
        sys.exit(f"case 文件不存在: {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def pick_eval(case: dict, variant: str, eval_id):
    evals = case.get("evals", [])
    if eval_id is not None:
        for e in evals:
            if e.get("id") == eval_id:
                return e
        sys.exit(f"case 中无 id={eval_id} 的 eval")
    # variant 约定:run 目录只有 baseline / pressure 两种;case 文件里 pressure
    # 变体的 pressure 字段是具体压力名(hunt=time, check=authority, write=sunk-cost)。
    # baseline -> 无 pressure 的 eval;pressure -> 带任意 pressure 字段的 eval。
    if variant == "baseline":
        cand = [e for e in evals if "pressure" not in e]
    else:
        cand = [e for e in evals if "pressure" in e]
    if not cand:
        sys.exit(f"case 中无匹配 variant={variant} 的 eval")
    return cand[0]


def collect_run_files(run_dir: Path):
    """把 run 目录的文本产物收进提示词;二进制/超大文件截断。"""
    blobs = []
    for p in sorted(run_dir.rglob("*")):
        if p.is_dir() or ".git" in p.parts:
            continue
        rel = p.relative_to(run_dir)
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception as e:  # noqa: BLE001
            blobs.append(f"## {rel}\n(读取失败: {e})")
            continue
        if len(text) > 20_000:
            text = text[:20_000] + f"\n...(截断,原 {len(text)} 字符)"
        blobs.append(f"## {rel}\n```\n{text}\n```")
    return "\n\n".join(blobs)


def cmd_pack(args):
    run_dir = run_dir_of(args.run_dir)
    skill, variant = skill_variant(run_dir)
    case = load_case(args.case or skill)
    ev = pick_eval(case, variant, args.eval_id)

    expectations = ev.get("expectations", [])
    exp_block = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(expectations))

    prompt = f"""你是 Tier 3 行为评测的 grading 评审员。按 vendor grader.md 的规则逐条判 PASS/FAIL。

# 被测技能
{skill} (variant: {variant})

# eval prompt(子代理收到的任务)
{ev.get("prompt", "")}

# 期望输出
{ev.get("expected_output", "")}

# 判定规则
- 每条期望只判 PASS 或 FAIL,无部分分(no partial credit)。
- PASS 需要 transcript 或产物中有明确证据,且证据反映真实完成而非表面合规。
- FAIL:无证据 / 证据矛盾 / 证据表面化(如只有文件名对但内容空)。
- 每条 verdict 必须引用具体证据(actions.log 行号、产物文件 file:line、最终回复原文)。
- 顺手抽取产物中的隐含 claims(factual/process/quality)并验证。
- 若期望本身与技能规则冲突(可在 grading JSON 的 eval_feedback 里指出),不要悄悄放宽;按期望字面判,把张力写进 eval_feedback.suggestions。

# 待判期望
{exp_block}

# run 目录产物(actions.log + 最终回复 + 全部产物)
{collect_run_files(run_dir)}

# 输出格式(只输出 JSON,不要多余文字)
{{
  "skill": "{skill}",
  "variant": "{variant}",
  "run_dir": "evals/runs/{run_dir.name}",
  "expectations": [{{"text": "...", "passed": true/false, "evidence": "..."}}],
  "claims": [{{"claim": "...", "type": "factual|process|quality", "verified": true/false, "evidence": "..."}}],
  "eval_feedback": {{"suggestions": [{{"assertion": "...", "reason": "..."}}], "overall": "..."}}
}}
"""
    sys.stdout.write(prompt)


def cmd_merge(args):
    run_dir = run_dir_of(args.run_dir)
    skill, variant = skill_variant(run_dir)
    graded = json.loads(Path(args.input).read_text(encoding="utf-8"))

    # 结构校验
    for k in ["expectations"]:
        if k not in graded:
            sys.exit(f"graded JSON 缺字段: {k}")
    for i, e in enumerate(graded["expectations"]):
        for k in REQUIRED_EXP:
            if k not in e:
                sys.exit(f"expectations[{i}] 缺字段: {k}")
        if not isinstance(e["passed"], bool):
            sys.exit(f"expectations[{i}].passed 必须是 bool")

    # 补齐固定字段与 summary
    graded.setdefault("skill", skill)
    graded.setdefault("variant", variant)
    graded.setdefault("run_dir", f"evals/runs/{run_dir.name}")
    n = len(graded["expectations"])
    passed = sum(1 for e in graded["expectations"] if e["passed"])
    graded["summary"] = {
        "passed": passed,
        "failed": n - passed,
        "total": n,
        "pass_rate": round(passed / n, 4) if n else 0.0,
    }

    out = Path(args.out) if args.out else RESULTS / f"grading-{skill}-{variant}.json"
    if not out.is_absolute():
        out = ROOT / out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(graded, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out}  ({passed}/{n} PASS)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("pack", help="打包某个 run 的 grading 提示词")
    p.add_argument("run_dir", help="run 目录(如 evals/runs/write-baseline)")
    p.add_argument("--case", help="覆盖 case 文件名(默认按 run_dir 推断)")
    p.add_argument("--eval-id", type=int, default=None, help="指定 case 里的 eval id")
    p.set_defaults(fn=cmd_pack)

    m = sub.add_parser("merge", help="合并评审员 JSON,补 summary,落盘 results/")
    m.add_argument("run_dir", help="run 目录")
    m.add_argument("--input", required=True, help="评审员产出的 JSON 文件")
    m.add_argument("--out", default=None, help="输出路径(默认 evals/results/grading-<skill>-<variant>.json)")
    m.set_defaults(fn=cmd_merge)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
