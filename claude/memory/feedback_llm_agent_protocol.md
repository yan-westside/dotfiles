---
name: LLM-Driven Report / Agent Standard Protocol
description: 4-layer non-negotiable standard for any agent or report that feeds data into an LLM — shared by Rae Pulliam 2026-04-22
type: feedback
---

When building any agent or report that feeds data into an LLM, always implement all 4 layers. No exceptions, even for prototypes.

**Why:** Rae shared this after a real incident where the LLM faithfully reported what was in the context — but the context was wrong (unequal day coverage caused a +61.6% staffing WoW that was a data artifact, not real). The root cause was always bad input, not model hallucination.

**How to apply:** Every time a new agent, report, or LLM-narrative pipeline is built.

---

## Layer 1 — Validate inputs before the prompt
- WoW change >30% for staffing/volume/rates → almost always a data artifact; flag it
- Any SUM-based comparison across unequal time windows → normalize to daily/unit average first
- Zero or near-zero denominator in any metric → flag
- Any percentage from a table not yet fully populated → flag
- Prepend `[DATA QUALITY FLAG]` warnings to the context string so the model sees them before data

## Layer 2 — Embed quality metadata inline with every metric
- Annotate inline, not in footnotes: `Staff%: +61.6% ⚠ (8/12 days in prior — unreliable, do not cite)`
- Use `[PROVISIONAL]` for tables not yet populated for recent dates
- Use `[SMALL SAMPLE — n=X]` for high-variance small samples
- Always SELECT `COUNT(DISTINCT report_date) AS day_count` alongside any SUM used in period comparisons

## Layer 3 — Constrain LLM arithmetic in the system prompt
Every system prompt must include:
> "IMPORTANT: Only cite numbers that appear explicitly in the data context above. Do not compute derived percentages, ratios, or averages from raw numbers in the context. If a metric is labeled [DATA QUALITY FLAG] or ⚠, either omit it entirely or explicitly acknowledge the data quality issue — never present a flagged number as a confirmed fact."

## Layer 4 — Programmatic post-generation analyst notes
- Add an `_analyst_notes_html(metrics, bundle)` function (or equivalent) generated AFTER the LLM narrative
- Flags implausible metrics (same checks as Layer 1)
- Calls out structural weaknesses (small samples, proxy metrics, unverified causal chains)
- Labeled machine-generated, not LLM output
- Renders even with no flags: "No data quality flags for this period" — so readers know the check ran

## Reliability hierarchy (Rae's ranking)
1. Don't let wrong data in — validate inputs, normalize for coverage
2. Label suspect data explicitly — inline quality flags in the context
3. Constrain LLM arithmetic — tell it not to derive new numbers
4. Programmatic post-check — `_analyst_notes_html()` style, on the metrics not the narrative
5. LLM self-check (second pass) — only if stakes justify cost (C-suite, regulatory)

For weekly ops reports: levels 1–4. Level 5 only for patient-facing or regulatory outputs.

**Source:** Rae Pulliam via Slack DM, 2026-04-22. Also baked into ~/.claude/CLAUDE.md.
