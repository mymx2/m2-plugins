#!/usr/bin/env python3
"""Lexical router: TF-IDF cosine over latin tokens + CJK bigrams.

Ranks every trigger prompt in evals/cases/*.json against the 11 skill
descriptions (the router's only input in production). Emits
evals/results/lexical-routing.json with top-1/top-2 per prompt.

Pure stdlib so it runs anywhere Python 3.8+ exists.
"""

import json
import math
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / "evals" / "cases"
OUT = ROOT / "evals" / "results" / "lexical-routing.json"
SKILLS_DIR = ROOT / "plugins" / "dyc" / "skills"

LATIN_RE = re.compile(r"[a-z0-9][a-z0-9.+_/-]*")
CJK_RE = re.compile(r"[一-鿿]")
FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
DESCRIPTION_RE = re.compile(r"^description:\s*(.*)$", re.MULTILINE)


def load_descriptions():
    """现读 11 个 SKILL.md 的 frontmatter description,不存副本。

    早期版本把 description 手抄成内嵌 dict,导致 SKILL.md 改了而 router 用旧文本,
    路由结果悄悄过时。改为从 SKILL.md 解析,单一事实源,改 description 即生效。
    """
    descriptions = {}
    for d in sorted(SKILLS_DIR.iterdir()):
        md = d / "SKILL.md"
        if not (d.is_dir() and md.exists()):
            continue
        m = FRONTMATTER_RE.match(md.read_text(encoding="utf-8"))
        if not m:
            sys.exit(f"{md}: 无 frontmatter")
        dm = DESCRIPTION_RE.search(m.group(1))
        if not dm:
            sys.exit(f"{md}: frontmatter 缺 description 字段")
        descriptions[d.name] = dm.group(1).strip().strip("'\"").strip()
    return descriptions


def tokenize(text):
    """Latin word tokens + CJK character bigrams (unigram fallback for len<2)."""
    text = unicodedata.normalize("NFKC", text).lower()
    tokens = LATIN_RE.findall(text)
    cjk_chars = CJK_RE.findall(text)
    if len(cjk_chars) >= 2:
        tokens += [cjk_chars[i] + cjk_chars[i + 1] for i in range(len(cjk_chars) - 1)]
    else:
        tokens += cjk_chars
    return tokens


def build_tfidf(docs):
    """docs: list of token lists. Returns list of {term: tfidf} dicts (l2-normalized)."""
    n = len(docs)
    df = Counter()
    for tokens in docs:
        for term in set(tokens):
            df[term] += 1
    vecs = []
    for tokens in docs:
        tf = Counter(tokens)
        vec = {}
        norm = 0.0
        for term, count in tf.items():
            # sublinear tf, smoothed idf
            w = (1.0 + math.log(count)) * math.log((1.0 + n) / (1.0 + df[term]))
            vec[term] = w
            norm += w * w
        norm = math.sqrt(norm) or 1.0
        vecs.append({t: w / norm for t, w in vec.items()})
    return vecs


def cosine(a, b):
    # iterate over smaller
    if len(a) > len(b):
        a, b = b, a
    return sum(w * b.get(t, 0.0) for t, w in a.items())


def main():
    descriptions = load_descriptions()
    skills = sorted(descriptions)
    desc_tokens = [tokenize(descriptions[s]) for s in skills]
    desc_vecs = build_tfidf(desc_tokens)

    results = []
    for case_file in sorted(CASES.glob("*.json")):
        case = json.loads(case_file.read_text(encoding="utf-8"))
        skill = case["skill_name"]
        for kind, items in (("positive", case["trigger"]["positive"]), ("negative", case["trigger"]["negative"])):
            for item in items:
                prompt = item["prompt"]
                qv = build_tfidf([tokenize(prompt)] + desc_tokens)[0]
                # NOTE: idf recomputed with the query included, per-query —
                # keeps the router honest (no train/test leakage across prompts).
                scored = sorted(
                    ((cosine(qv, dv), s) for s, dv in zip(skills, desc_vecs)),
                    reverse=True,
                )
                top = [(s, round(c, 4)) for c, s in scored[:3]]
                results.append(
                    {
                        "skill": skill,
                        "kind": kind,
                        "prompt": prompt,
                        "expected_top1": skill if kind == "positive" else item.get("owner"),
                        "lexical_top1": top[0][0],
                        "lexical_top1_score": top[0][1],
                        "lexical_top2": top[1][0],
                        "lexical_top2_score": top[1][1],
                        "lexical_top3": top[2][0],
                        "lexical_top3_score": top[2][1],
                        "expected_rank": next(
                            (
                                i + 1
                                for i, (_, s) in enumerate(top)
                                if s == (skill if kind == "positive" else item.get("owner"))
                            ),
                            None,
                        ),
                        "boundary": item.get("boundary"),
                    }
                )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    pos = [r for r in results if r["kind"] == "positive"]
    neg = [r for r in results if r["kind"] == "negative"]
    pos_hit = sum(1 for r in pos if r["lexical_top1"] == r["skill"])
    # negative passes if the owner outranks the tested skill
    neg_hit = 0
    for r in neg:
        tested = r["skill"]
        owner = r["expected_top1"]
        scores = {
            r["lexical_top1"]: r["lexical_top1_score"],
            r["lexical_top2"]: r["lexical_top2_score"],
            r["lexical_top3"]: r["lexical_top3_score"],
        }
        # owner must appear above tested skill in top-3, or tested absent while owner present
        if owner in scores and tested not in scores:
            neg_hit += 1
        elif owner in scores and tested in scores and scores[owner] > scores[tested]:
            neg_hit += 1
        elif tested not in scores:
            neg_hit += 1  # tested skill not in top-3 at all counts as pass for negative
    print(f"positive top-1 hit: {pos_hit}/{len(pos)}")
    print(f"negative owner-outranks: {neg_hit}/{len(neg)}")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    sys.exit(main())
