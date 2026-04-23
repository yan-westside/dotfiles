---
name: Dasher Pay Study
description: Full context for Dasher pay distribution analysis (Jan 2025 - Mar 2026), including data source, pay metric, key findings, and hypothesis test results
type: project
---

## Location
`team_analytics/personal/yan.jin@doordash.com/dasher_pay_study/`

## Data Source
- **Table**: `EDW.FINANCE.FACT_DELIVERY_ALLOCATION`
- **Date field**: `ACTIVE_DATE` (delivery completed date)
- **Pay metric**: `DRIVER_PAY_ALLOC + COALESCE(TIP_ALLOC, 0)` = total Dasher take-home per delivery
  - `DRIVER_PAY_ALLOC` = base pay + incentive (DASHER_PAY_OTHER) + catch-all (incl. Prop 22 min wage) + accounting adj
  - `TIP_ALLOC` = consumer tip passed through to Dasher
- **Filter**: `driver_pay_alloc > 0` (excludes cancellations/zero-pay)
- **Period**: Jan 2025 – Mar 2026 (15 months)
- **Volume**: ~200–257M deliveries/month

## File Structure
```
dasher_pay_study/
├── dasher_pay_analysis.py          ← main entry (Snowflake pull + analysis)
├── analyze_from_csv.py             ← analysis + charts from saved CSVs (no Snowflake needed)
├── sql/
│   ├── 01_dasher_pay_monthly_percentiles.sql   ← P10-P100 + component breakdown by month
│   └── 02_dasher_pay_decile_buckets.sql        ← global decile buckets by month
└── outputs/
    ├── 01_monthly_percentiles.csv   ← 15 rows (one per month), P10-P100 + tip breakdown
    ├── 02_decile_buckets.csv        ← 150 rows (10 deciles × 15 months)
    ├── 03_mom_deltas.csv            ← MoM delta for each percentile
    ├── 04_decile_anova.csv          ← ANOVA + trend per decile
    ├── 05_percentile_heatmap.png    ← heatmap of raw values + MoM % change
    ├── 06_trend_analysis.png        ← P10/P50/P90 trend lines + pay vs tip stacked
    ├── 07_decile_trend.png          ← slope per decile + all decile lines over time
    └── 08_trend_summary.csv         ← Mann-Kendall results per percentile
```

## Key Findings

### Tip Share
- Tips = **44.8% of total earnings** on average — critical to include

### Pay Trend (Jan 2025 → Mar 2026)
| Percentile | Jan 2025 | Mar 2026 | Change |
|---|---|---|---|
| P10 | $3.99 | $4.15 | +4.0% |
| P50 | $7.00 | $7.50 | +7.1% |
| P90 | $13.21 | $13.17 | −0.3% |

### Hypothesis: "Dashers paid less over time"
**REJECTED** — overall pay is UP, not down.
- P30 significantly UP (p=0.008)
- All other percentiles inconclusive (not significant either direction)
- Avg base pay: significant upward trend (p=0.02, +$0.017/mo)
- Avg tip: slight downward drift (p=0.14, not significant)

### Decile-Level Trends (significant results only)
| Decile | Direction | p-value |
|---|---|---|
| D02 (10–20%) | UP ↑ | 0.006 |
| D04 (30–40%) | UP ↑ | 0.004 |
| D06 (50–60%) | **DOWN ↓** | 0.036 |
| D07 (60–70%) | **DOWN ↓** | 0.008 |

Middle-upper earners (50–70th pct) are being squeezed; lower earners getting more.

## How to Re-run
```bash
cd /home/yanjin/Projects/cursor-analytics
source venv/bin/activate
# Full re-pull from Snowflake (~1hr):
python team_analytics/personal/yan.jin@doordash.com/dasher_pay_study/dasher_pay_analysis.py
# Analysis only from saved CSVs (~5 sec):
python team_analytics/personal/yan.jin@doordash.com/dasher_pay_study/analyze_from_csv.py
```

**Why:** Yan's hypothesis was that Dashers got paid less over time. Data shows the opposite overall, but with nuance: the middle deciles (D06–D07) are declining while lower deciles are rising.
**How to apply:** When continuing this study, build on the decile-level divergence — the story is not "pay went up/down" but "lower earners gained, middle-upper earners softened."
