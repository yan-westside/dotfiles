---
name: dr-impact-calc
description: >
  Calculate Defect Ratio (DR) experiment impact using L1/L2/L3 booking rules.
  Run one experiment at a time. Guides the user through inputs, computes impact,
  compares methodologies, outputs to spreadsheet + Slack. Use when the user asks
  to calculate DR impact, apply booking rules, verify defect ratio for an
  experiment, or says "dr-impact-calc".
user-invocable: true
disable-model-invocation: true
---

# DR Impact Calculator

Calculate Defect Ratio (DR) experiment impact using L1/L2/L3 booking rules.
Run one experiment at a time. Guides the user through inputs, computes impact,
compares methodologies, outputs to spreadsheet + Slack.

Use this skill when the user asks to calculate DR impact, apply booking rules,
verify defect ratio for an experiment, or says "dr-impact-calc".

## Pipeline Location

Python module: `dr_pipeline/` (bundled in this skill folder)

## Interactive Flow

Follow these steps in order. Use AskUserQuestion at each decision point.

### Step 1: Get Curie DR Analysis Link

Ask: "Paste the Curie link for the Defect Ratio analysis (e.g., `https://ops.doordash.team/decision-systems/experiments/{exp_id}?analysisId={analysis_id}`), or type 'none' if this is an observational initiative."

**Do NOT use AskUserQuestion with multiple-choice options for this step.** The user needs to paste a URL — use a simple text prompt instead.

- **User provides URL** → Parse `experiment_id` and `analysis_id` from the URL
- **User says "none" / no link** → This is likely an observational initiative (e.g., Catering, Atlas).
  - Respond: "Observational initiatives need diff-in-diff analysis. Consult with your analytics partner."
  - **END FLOW**

Note: HQDR metrics (core_quality_*) are included in the same DR Curie analysis — no separate HQDR link needed.

### Step 2: Check Data Availability

Working directory: the skill folder (where this SKILL.md lives).

Run: `python3 -c "from dr_pipeline.pull import check_data_exists; print(check_data_exists('{analysis_id}'))"`

- **True** → proceed
- **False** → Tell user: "No data found. Curie analyses take ~24 hours to populate after creation. Please refresh the analysis in Curie, then rerun /dr-impact-calc."
  - **END FLOW**

### Step 3: Get Treatment Variant

Run to list available variants:
```bash
python3 -c "
from dr_pipeline.pull import pull_metrics, list_variants
df = pull_metrics('{analysis_id}')
print(list_variants(df))
"
```

Ask user: "Which treatment variant should we use?" Show the available variants.
- User must select one. If no input → **END FLOW**

### Step 4: Get Scale Percentage

First, try to infer coverage from Curie data:
```bash
python3 -c "
from dr_pipeline.pull import pull_metrics, infer_coverage
df = pull_metrics('{analysis_id}')
cov = infer_coverage(df, '{variant}')
print(cov)
"
```

If inference returns a value (not None), present it as the suggested default:

Ask: "Inferred coverage from Curie: **{cov*100:.1f}%** (global_lift / absolute_impact). Use this as the rollout scale, or enter a different percentage?"
- User accepts → use inferred value
- User provides a different number → convert to decimal (68 → 0.68)

If inference returns None (not enough data), fall back to manual input:

Ask: "What is the rollout scale percentage? (e.g., 68 for 68%, 100 for full rollout)"
- User provides number → convert to decimal (68 → 0.68)
- No input → default to 1.0 (100%) with warning

### Step 5: Get Experiment Metadata

Ask for:
- **Initiative name** (for column A)
- **Launch date** (for column E, optional)

### Step 6: Compute Impact

Run the full pipeline:
```bash
python3 -m dr_pipeline.compare {analysis_id} {variant} {scale_pct}
```

Working directory: the skill folder (where this SKILL.md lives).

This outputs:
- L1 value (always, regardless of sig)
- L3 all metrics + sig sum
- Missing metrics warnings
- Pak Tao vs DxLx methodology comparison

**Present the full output to the user** — don't summarize or skip metrics.

If there are **missing metrics**, warn the user:
"⚠ {N} expected metrics are missing from this analysis. The metric pack may be outdated. Check that your Curie analysis includes the metrics listed in the levels spreadsheet."

### Step 7: Output to Spreadsheet

Append one row to the **"Impact tracker for Claude"** tab in spreadsheet `1C5zWrOt0j0VbfNOUACqLD9bfUCFqftGbuS9zZdilpZ4`.

**Important — use the raw Sheets API**, not `gws sheets +append` (which doesn't support sheet tab names and defaults to `USER_ENTERED` parsing that breaks values like `+1.32 (not sig)`).

Use this command pattern:
```bash
gws sheets spreadsheets values append \
  --params '{"spreadsheetId":"1C5zWrOt0j0VbfNOUACqLD9bfUCFqftGbuS9zZdilpZ4","range":"Impact tracker for Claude!A:V","valueInputOption":"RAW"}' \
  --json '{"values":[["col A","col B",...,"col V"]]}'
```

Key details:
- `range` must include the tab name: `Impact tracker for Claude!A:V`
- `valueInputOption` must be `RAW` (not `USER_ENTERED`) — values like `+0.47 (not sig)` start with `+` which Sheets misinterprets as a formula, causing `#ERROR!`
- **Never overwrite existing rows.**

Column mapping (A through V) — matches actual spreadsheet headers:

| Col | Header | Value |
|-----|--------|-------|
| A | Initiative | Initiative name |
| B | Run by | Current user's email (run `gws auth info --format json` and extract the email field) |
| C | Run date | Today's date (YYYY-MM-DD) |
| D | Reference Docs | DR Curie link |
| E | Launch Date | Launch date (or blank) |
| F | Defect Ratio Curie Link | DR Curie link (same as D) |
| G | % of US vol exposed | Scale % as decimal (e.g., 0.68) |
| H | core_quality_late20 | bps value; always fill, add "(not sig)" if not sig |
| I | core_quality_cancellation | bps value; always fill, add "(not sig)" if not sig |
| J | core_quality_mi | bps value; always fill, add "(not sig)" if not sig |
| K | core_quality_nd | bps value; always fill, add "(not sig)" if not sig |
| L | core_quality_is_pfq | bps value; always fill, add "(not sig)" if not sig |
| M | core_quality_hqdr | HQDR L1 bps; always fill, add "(not sig)" if not sig |
| N | HQDR scaled impact | M × G (use numeric M value for calculation) |
| O | Defect Ratio Overall (L1) | L1 defect_ratio_overall bps; always fill, add "(not sig)" if not sig |
| P | Defect Ratio org level (L2) | L2 sig sum bps (blank if no sig L2) |
| Q | Defect Ratio individual Defects (L3) | L3 sig sum bps (blank if no sig L3) |
| R | Defect Ratio Pak Tao's method | Pak Tao booked bps raw |
| S | Defect Ratio Pak Tao's method scaled | R × G |
| T | Defect Ratio DxLx method | DxLx booked bps raw (L1 if sig, else larger of L1 vs L3 sig sum) |
| U | Defect Ratio DxLx scaled | T × G |
| V | Do they match? | "Yes" if R==T, else "No — {reason}" |

**Rule: For columns O (DR overall), M (HQDR L1), and H-L (HQDR L2), always fill the bps value. Append "(not sig)" if p >= 0.05. For columns P/Q (L2/L3 sig sums), only sum sig metrics. For booking columns R-U, use numeric values only.**

### Step 8: Slack Announcement (DEFERRED)

**TODO for future**: Draft and send announcement to `#dr-ship-decisions-bps-banking` (channel ID: `C0A7A7X8FJQ`).
This step is currently disabled. Skip it and inform the user that Slack announcement is deferred.

## Methodology Reference

**Metric levels source** (fetched dynamically each run):
https://docs.google.com/spreadsheets/d/1iuahqPU14BGfjpGJ0MVZoHAXTl7fgJLKXrfIa-i7iR0/edit?gid=779872748

**Both methods share step 1:** If L1 is stat sig (p < 0.05) → book L1 directly. L2 is skipped entirely.

**When L1 is NOT stat sig, the methods diverge:**

**Pak Tao (CXI) method:**
Book the **smaller** of L1 and L3 sig sum: `min(abs(L1), abs(L3_sig_sum))`

**DxLx method (ours):**
Book the **larger** of L1 and L3 sig sum: `max(abs(L1), abs(L3_sig_sum))`

**Sign convention:** DR decrease = positive bps (improvement). DR increase = negative bps (degradation).

**HQDR sign convention exception:** `core_quality_mi` (missing items) is a **lower-is-better** metric. A negative bps value means fewer missing items, which is an **improvement** — directionally aligned with a positive HQDR L1. Do not describe a negative `core_quality_mi` as a degradation.

**Stat sig threshold:** p < 0.05. Only book sig metrics.

## HQDR Metrics (included in DR Curie analysis)

HQDR metrics (`core_quality_*`) are part of the same DR Curie analysis — no separate link needed.
Extract them from the same pulled data using prefix `core_quality_`.

- L1: `core_quality_hqdr`
- L2: `core_quality_nd`, `core_quality_mi`, `core_quality_late20`, `core_quality_cancellation`, `core_quality_is_pfq`, etc.

If L1 sig → use it. Otherwise, sum sig L2 components.

Always report HQDR metrics in the output and fill them in the spreadsheet.
