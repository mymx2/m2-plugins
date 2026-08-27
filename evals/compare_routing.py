#!/usr/bin/env python3
"""对比两次 lexical-routing.json,判定词面路由是否退化。供 CI 门禁用。

用法:
  # 先跑 lexical_router.py 生成当前结果,再与入库基线对比
  python evals/lexical_router.py
  python evals/compare_routing.py evals/results/lexical-routing.baseline.json evals/results/lexical-routing.json

退出码:有任何退化(命中数下降、think triage prompt 的 owner 从 think 掉走)为 1,否则 0。

"退化"定义(只拦确定性的坏变化,不拦描述改进带来的合理重排):
- positive top-1 命中总数下降;
- negative owner-outranks 总数下降;
- think 的 triage prompt(归归类那条)的语义 owner 必须是 think:
  词面层该 prompt 全中文对全英文 description 恒 0 分,这里只校验它在结果里
  仍被标记为 think 的 positive(防 case 文件被改丢),不校验词面 rank。
"""

import json
import sys
from pathlib import Path


def load(p: str):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def pos_hits(rows):
    return sum(1 for r in rows if r["kind"] == "positive" and r["lexical_top1"] == r["skill"])


def neg_hits(rows):
    """与 lexical_router.py 的 negative 判定口径保持一致。"""
    n = 0
    for r in rows:
        if r["kind"] != "negative":
            continue
        tested, owner = r["skill"], r["expected_top1"]
        scores = {
            r["lexical_top1"]: r["lexical_top1_score"],
            r["lexical_top2"]: r["lexical_top2_score"],
            r["lexical_top3"]: r["lexical_top3_score"],
        }
        if owner in scores and tested not in scores:
            n += 1
        elif owner in scores and tested in scores and scores[owner] > scores[tested]:
            n += 1
        elif tested not in scores:
            n += 1
    return n


def main():
    if len(sys.argv) != 3:
        sys.exit("用法: python evals/compare_routing.py <baseline.json> <current.json>")
    base, cur = load(sys.argv[1]), load(sys.argv[2])

    bp, cp = pos_hits(base), pos_hits(cur)
    bn, cn = neg_hits(base), neg_hits(cur)
    print(f"positive top-1: baseline {bp}/{len([r for r in base if r['kind'] == 'positive'])} -> current {cp}")
    print(f"negative owner-outranks: baseline {bn} -> current {cn}")

    regressions = []
    if cp < bp:
        regressions.append(f"positive top-1 命中下降 {bp} -> {cp}")
    if cn < bn:
        regressions.append(f"negative owner-outranks 下降 {bn} -> {cn}")

    # think triage prompt 仍是 think 的 positive(case 文件没把它改丢)
    triage = [r for r in cur if "归归类" in r.get("prompt", "")]
    if not triage:
        regressions.append("think 的 triage prompt 在结果中消失(case 文件可能被改)")
    elif any(r["skill"] != "think" or r["kind"] != "positive" for r in triage):
        regressions.append("think 的 triage prompt 归属/类别被改")

    if regressions:
        print("\nREGRESSION:")
        for r in regressions:
            print(f"  - {r}")
        return 1
    print("\nOK: 无词面路由退化")
    return 0


if __name__ == "__main__":
    sys.exit(main())
