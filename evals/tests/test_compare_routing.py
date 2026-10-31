"""compare_routing 的单元测试。

锁定逐条丢失检测：只改总数会掩盖单条 positive/negative 的退化，
所以这里用合成结果验证 positive 命中、negative owner-outranks 与 case 消失
三类都会被识别，同时确认没有把仍然通过的 negative 误报成丢失。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from compare_routing import case_key, lost_cases, neg_hits, neg_pass, pos_hits  # noqa: E402


def row(kind, skill, prompt, top1, s1, top2="other", s2=0.0, top3="third", s3=0.0, owner=None):
    return {
        "kind": kind,
        "skill": skill,
        "expected_top1": owner or skill,
        "prompt": prompt,
        "lexical_top1": top1,
        "lexical_top1_score": s1,
        "lexical_top2": top2,
        "lexical_top2_score": s2,
        "lexical_top3": top3,
        "lexical_top3_score": s3,
    }


def test_pos_hits_counts_only_owner_top1():
    rows = [
        row("positive", "check", "p1", "check", 1.0),
        row("positive", "check", "p2", "write", 1.0),
        row("negative", "check", "p3", "check", 1.0, owner="write"),
    ]
    assert pos_hits(rows) == 1


def test_neg_pass_owner_absent_or_outranking():
    assert neg_pass(row("negative", "check", "p", "write", 1.0))
    assert neg_pass(row("negative", "check", "p", "write", 1.0, top2="check", s2=0.5, owner="write"))
    assert not neg_pass(row("negative", "check", "p", "check", 1.0, top2="write", s2=0.5, owner="write"))
    assert neg_hits([row("negative", "check", "p", "write", 1.0)]) == 1


def test_lost_cases_reports_positive_and_negative_misses():
    base = [
        row("positive", "check", "p1", "check", 1.0),
        row("negative", "check", "p2", "write", 1.0),
        row("positive", "read", "p3", "read", 1.0),
    ]
    cur = [
        row("positive", "check", "p1", "write", 1.0),
        row("negative", "check", "p2", "check", 1.0, top2="write", s2=0.5, owner="write"),
        row("positive", "read", "p3", "read", 1.0),
    ]
    lost = lost_cases(base, cur)
    assert [item[0] for item in lost] == ["negative", "positive"]
    assert case_key(base[0]) == ("positive", "check", "p1")


def test_lost_cases_reports_removed_case():
    base = [row("positive", "check", "p1", "check", 1.0)]
    assert lost_cases(base, [])[0][0] == "removed case"
