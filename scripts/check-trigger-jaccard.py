#!/usr/bin/env python3
"""独立复核 dyc 全部技能的 when_to_use 触发词两两 Jaccard 相似度。

校验器(validate-skill.ts 门6)在单技能校验时已做此检查,但只报 <0.5 的通过/失败。
本脚本打印全部技能对的实际 Jaccard 值,便于蒸馏时主动避让撞车。

用法: python scripts/check-trigger-jaccard.py
退出码: 有任何一对 >= 0.5 时为 1,否则 0。
"""

import re
import sys
from pathlib import Path

SKILLS_DIR = Path(__file__).resolve().parent.parent / "plugins" / "dyc" / "skills"
THRESHOLD = 0.5


def parse_when_to_use(skill_md: Path) -> set[str]:
    text = skill_md.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not m:
        return set()
    fm = m.group(1)
    wm = re.search(r"^when_to_use:\s*(.*)$", fm, re.MULTILINE)
    if not wm:
        return set()
    raw = wm.group(1).strip().strip("'\"")
    # 半角逗号切分(校验器口径),去空白小写
    return {k.strip().lower() for k in raw.split(",") if k.strip()}


def jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def main() -> int:
    skills = {}
    for d in sorted(SKILLS_DIR.iterdir()):
        md = d / "SKILL.md"
        if d.is_dir() and md.exists():
            skills[d.name] = parse_when_to_use(md)

    names = sorted(skills)
    worst = 0.0
    bad = []
    print(f"{'skill A':<12} {'skill B':<12} {'jaccard':>7}  shared")
    for i, a in enumerate(names):
        for b in names[i + 1 :]:
            j = jaccard(skills[a], skills[b])
            shared = sorted(skills[a] & skills[b])
            if j > 0:
                print(f"{a:<12} {b:<12} {j:>7.3f}  {shared}")
            if j >= THRESHOLD:
                bad.append((a, b, j))
            worst = max(worst, j)
    print(f"\nworst pairwise jaccard: {worst:.3f} (threshold {THRESHOLD})")
    if bad:
        print("FAIL: pairs above threshold:")
        for a, b, j in bad:
            print(f"  {a} vs {b} = {j:.3f}")
        return 1
    print("OK: all pairs below threshold")
    return 0


if __name__ == "__main__":
    sys.exit(main())
