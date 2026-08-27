"""lexical_router 的单元测试。

锁定四类行为,防止重构或 description 来源切换时悄悄改变路由口径:
- tokenize 的 CJK bigram 切分;
- TF-IDF 向量的 L2 归一与余弦对称性;
- load_descriptions 从 SKILL.md frontmatter 现读(无副本,单一事实源);
- 全 0 得分时 sorted(..., reverse=True) 按字母序退化的仲裁行为
  (这是"write 成为词面默认汇"的机制,退化行为本身不能说改就改)。
"""

import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lexical_router import build_tfidf, cosine, load_descriptions, tokenize  # noqa: E402

DESCRIPTIONS = load_descriptions()


class TestTokenize:
    def test_latin_words_lowercased(self):
        assert tokenize("Hello WORLD Foo") == ["hello", "world", "foo"]

    def test_cjk_bigrams(self):
        # 4 个 CJK 字符 -> 3 个 bigram
        assert tokenize("触发路由判定") == ["触发", "发路", "路由", "由判", "判定"]

    def test_cjk_single_char_fallback(self):
        assert tokenize("审") == ["审"]

    def test_mixed_latin_and_cjk(self):
        toks = tokenize("triage 归类")
        assert "triage" in toks
        assert "归类" in toks

    def test_empty(self):
        assert tokenize("") == []


class TestTfidfCosine:
    def test_vectors_l2_normalized(self):
        vecs = build_tfidf([["a", "b", "b"], ["c", "a"]])
        for v in vecs:
            norm = math.sqrt(sum(w * w for w in v.values()))
            assert norm == pytest.approx(1.0)

    def test_cosine_symmetric(self):
        a, b = build_tfidf([["x", "y"], ["y", "z"]])
        assert cosine(a, b) == pytest.approx(cosine(b, a))

    def test_identical_docs_cosine_zero_when_idf_vanishes(self):
        # 两篇文档完全相同时每个词的 idf=ln(3/3)=0,向量全零,cosine=0。
        # 这是该实现的固有性质,不是 bug——同名文档在所有词上都共现。
        a, b = build_tfidf([["same", "tokens"], ["same", "tokens"]])
        assert cosine(a, b) == pytest.approx(0.0)

    def test_shared_token_gives_positive_cosine(self):
        a, b, _ = build_tfidf([["shared", "apple"], ["shared", "zebra"], ["pilot"]])
        assert cosine(a, b) > 0.0

    def test_disjoint_docs_cosine_zero(self):
        a, b = build_tfidf([["apple"], ["zebra"]])
        assert cosine(a, b) == pytest.approx(0.0)


class TestZeroScoreTieBreak:
    def test_all_zero_prefers_alphabetical_last(self):
        """与 description 完全无交集的 query,top-1 退化为字母序最后一个技能。

        sorted(..., reverse=True) 对 (0.0, name) 元组按 name 降序,top-1 是
        sorted(DESCRIPTIONS)[-1](write)。这正是 tier2-routing.md §4 说 write
        成为"词面默认汇"的机制:零分并列时它被顶到最前。若哪天改了仲裁
        (如按 description 长度、或并列时报 unranked),必须显式改这条测试,
        不能无声漂移。
        """
        qv = build_tfidf([tokenize("完全无关的随机词组")] + [tokenize(d) for d in DESCRIPTIONS.values()])[0]
        dv = build_tfidf([tokenize(d) for d in DESCRIPTIONS.values()])
        scored = sorted(
            ((cosine(qv, v), s) for s, v in zip(sorted(DESCRIPTIONS), dv)),
            reverse=True,
        )
        assert scored[0][1] == sorted(DESCRIPTIONS)[-1]
        assert scored[0][0] == pytest.approx(0.0)

    def test_descriptions_has_11_skills(self):
        # load_descriptions 必须与插件目录的 11 个技能一一对应
        assert len(DESCRIPTIONS) == 11
        assert set(DESCRIPTIONS) == {
            "think",
            "check",
            "hunt",
            "ui",
            "read",
            "write",
            "learn",
            "health",
            "forge",
            "chrome",
            "repowiki",
        }

    def test_think_description_contains_triage_cue(self):
        # 单一事实源保护:triage cue 在 SKILL.md 里,load_descriptions 必须读到
        assert "triaging a bundle of mixed requests/feedback" in DESCRIPTIONS["think"]

    def test_every_description_non_empty_and_has_use_when(self):
        for name, desc in DESCRIPTIONS.items():
            assert desc, f"{name}: description 为空"
            assert "Use when" in desc, name
