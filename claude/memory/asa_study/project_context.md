---
name: ASA Study — Project Context
description: Full project context for the ASA (Average Speed of Answer) study — objectives, scope, data sources, and current status
type: project
---

# ASA Study Project Context

**Owner**: yan.jin@doordash.com
**Team**: Zoe He (data), Coki Metcalfe, Rae Pulliam
**Location**: `team_analytics/personal/yan.jin@doordash.com/asa_friction_study/`
**GSIO Doc**: `docs/GSIO - ASA analysis.md`

---

## Objective (Revised 2026-04-02)

Understand wait time distributions across clusters and identify levers to **center performance at 120 seconds**. This is an operational/WFM study — not just a financial impact analysis.

Key questions:
- Why are distributions left-skewed (most waits <<120s)?
- What staffing/routing/demand constraints keep waits short?
- What levers exist to shift distributions toward 120s (in BOTH directions)?

---

## Scope

- **Clusters**: Top 15 by volume (confirmed by user, see below)
- **Segmentation**: 4 groups — Chat Cx, Chat Dx, Phone Cx, Phone Dx
- **Filter**: Live clusters only, Phone + Chat, no outbound
- **Period**: Last 12 months
- **Unit**: Wait time distribution per cluster×segment

---

## Top 15 Confirmed Clusters

From query on `edw.opex.fact_support_sla_by_queue_cluster`, last 12 months:

| Cluster | Contacts (12mo) | Median Wait | P90 Wait |
|---|---|---|---|
| Sendbird - Cx | 14.9M | 19s | 114s |
| Sendbird - Dx - VIP | 11.8M | 24s | 194s |
| VIP Dasher New | 7.7M | 11s | 94s |
| Customer | 7.1M | 10s | 139s |
| Sendbird - Dx | 7.1M | 22s | 183s |
| Cx Specialized Pod | 6.3M | 24s | 91s |
| Spanish Dx | 6.3M | 7s | 107s |
| Dasher X-mainline | 5.4M | 11s | 224s |
| Sendbird - Dx - United States (ES) | 4.3M | 25s | 229s |
| Dasher Direct and Payments | 3.8M | 7s | 127s |
| Sendbird - Cx - NBV Pod | 3.5M | 26s | 172s |
| Sendbird - Cx - VIP | 3.2M | 24s | 136s |
| Dx DsD | 3.1M | 7s | 243s |
| Sendbird - Dx - DSD Support | 1.7M | 24s | 271s |
| Drive SaaS McD - Chat | 1.6M | 19s | 284s |

---

## Data Sources

| Table | Purpose |
|---|---|
| `edw.opex.fact_support_sla_inputs_sot` | Wait times, queue assignments, contact flags |
| `edw.opex.fact_support_contact_sot` | Customer type, case origin, issue type, delivery linkage |
| `edw.opex.fact_support_dwr_survey_responses` | DWR satisfaction scores |
| `edw.opex.fact_credits_refunds_issued` | C&R cost |
| `edw.opex.fact_defect_ratio_base` | Defect data |
| `edw.finance.dimension_deliveries` | Delivery metadata / customer linkage |

Pre-aggregated table Zoe built (Jan 2026 only, may be dropped):
`proddb.zoehe.gsio_asa_wait_time_onecasecontact_group_260101_260128`

---

## Zoe's Key SQL Logic

- **Single-contact filter**: only cases with exactly 1 contact (`cv` CTE, HAVING COUNT(DISTINCT contact_id)=1)
- **Wait time binning**: `ROUND(wait_time, -1)` = 10-second bins
- **Abandon flag**: `is_missed=TRUE AND is_short_abandon=FALSE AND phone_accepted_callback=FALSE AND missed_reason NOT ILIKE '%error%' AND chat_status!='Completed' AND phone_connected_agent!=TRUE`
- **Live flag**: `CASE WHEN queue_cluster_name ILIKE '%Non-Live%' THEN 'Non-live' ELSE 'Live' END`
- **Integrity exclusion**: filter by `customer_type IN ('Consumer','Dasher')` and `case_origin IN ('Phone','Chat')` — excludes fraud/integrity queues

---

## Key Findings from Zoe's Mar 6 Analysis

| Metric | <10s | 10-90s | >210s |
|---|---|---|---|
| DWR | 74% | ~69% | <65% |
| Abandon % | 0.1% | 0.3-0.5% | 1%+ |
| C&R delivery ratio | Favourable | FLAT | FLAT |
| 28D order frequency | — | FLAT | FLAT |

- **C&R by issue**: mixed correlation — "Completed Order - Cx" has r=-0.765 (negative), "Delivery-Related Issues" r=+0.371 (positive)
- **Dx → Cx cascade**: Dx demand is 1-hour leading indicator of Cx demand (r=0.907)

---

## Analysis Deliverables (Current Sprint)

1. **Cluster list** — confirmed (15 clusters, 4 segments) ✅
2. **Wait time distributions** — per cluster×segment (histogram + summary stats)
3. **Gap analysis vs 120s** — mean, median, skewness vs target
4. **Constraint identification** — why distributions center below 120s
5. **Levers to shift distribution** — staffing, routing, demand management

---

## Scripts

| File | Purpose |
|---|---|
| `query_distributions.py` | Pull wait time distributions for 15 clusters × 4 segments |
| `identify_clusters.py` | Top cluster identification query |
| `asa_friction_study/analysis.py` | Previous (incorrect) friction analysis — do not reuse |
| `asa_friction_study/asa_analysis.py` | Main analysis engine (v4) — reads from Snowflake view, generates charts |
| `asa_friction_study/generate_report.py` | Report generator — outputs HTML report |
| `asa_friction_study/load_data.py` | Data loader — pulls from Snowflake view into CSV |

## Output Files
- `asa_friction_study/outputs/13_tail_analysis_raw.csv` — 1,196,436 rows, 61 complete weeks from Snowflake view
- `asa_friction_study/outputs/asa_report_v4.html` — Full 61-week report (Feb 3, 2025 – Mar 30, 2026), 1,317 KB
- `asa_friction_study/outputs/asa_report_v3.html` — Previous 13-week report, `%%` bug fixed in-place, 796 KB

---

## Snowflake View (Created 2026-04-16)

**View**: `proddb.yanjin.v_asa_analysis_data`
**Source**: `edw.opex.fact_support_sla_by_queue_cluster`
**Actual data range**: Feb 3, 2025 – Mar 30, 2026 (61 complete weeks) — source table only has data from 2025-02-01 onward despite view start date of 2024-01-01
**SQL file**: `asa_friction_study/sql/15_create_asa_view.sql`
**Grant**: `GRANT SELECT ON VIEW proddb.yanjin.v_asa_analysis_data TO ROLE PUBLIC`

---

## v4 Report Key Changes (2026-04-16)

- **Data**: 61 complete weeks (1.2M rows) vs previous 13-week run
- **`%%` bug fixed**: `fmt_pct()` already returns strings with `%`; templates were appending a second `%`. Fixed via regex + targeted replacements.
- **WoW chart redesign**: 61 stacked bars → dual-line time-series (% ≤30s fast and % >120s tail) with monthly x-axis labels
- **LOB findings (61 wks)**: Cx Chat 51.9% fast, Cx Phone 52.0%, Dx Chat 65.1%, Dx Phone 72.0%
- **Notable anomaly**: Summer 2025 multi-LOB tail surge (all 4 LOBs spiked simultaneously)
