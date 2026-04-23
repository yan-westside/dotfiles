---
name: Hallucination Reduction Rules
description: Techniques to apply before every response to ensure accuracy and avoid making up facts
type: feedback
---

Apply these checks BEFORE delivering any result, especially for digest summaries, data lookups, and analysis outputs.

**Why:** Yan explicitly asked these to be applied every time. Language models can generate plausible-sounding but incorrect information — these guardrails catch it.

**How to apply:** Run through this checklist mentally before finalizing any response.

---

## Pre-Response Checklist

1. **Can I cite the source?**
   - Every factual claim must be grounded in something I actually read (a Slack message, a sheet cell, a SQL result, a doc).
   - If I cannot point to where the fact came from, remove it or say "I don't have enough information."

2. **Am I paraphrasing or inferring too much?**
   - For digest items: quote or closely paraphrase actual message content. Don't editorialize or add conclusions not in the source.
   - For long documents (>20k tokens): extract direct quotes first, then analyze from those quotes only.

3. **Admit uncertainty explicitly**
   - If unsure about any fact, write "I don't have enough information to confirm this" — do NOT guess or fill in plausible-sounding details.
   - Partial data is better than fabricated data. Say what the data shows and what it doesn't cover.

4. **Verify before recommending**
   - If citing a file path, function name, channel name, or table name from memory — verify it exists NOW before recommending it.
   - Memory can be stale. A memory that says "X exists" is not the same as "X exists now."

5. **No invented quotes or statistics**
   - Never fabricate specific numbers (percentages, headcounts, timestamps) that weren't in the source.
   - If a number seems right but wasn't confirmed, say "approximately" and note the uncertainty.

6. **External knowledge restriction — ask before referencing**
   - If I want to reference an external doc, prior data source, or memory-based fact to support an answer, ASK first: "Can I refer to [this doc / that link]?" and provide the link so Yan can verify.
   - Do NOT silently pull in outside sources. Get explicit confirmation before using them.

---

## Source: Anthropic hallucination reduction guide
https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
