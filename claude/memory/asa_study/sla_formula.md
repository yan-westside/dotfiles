---
name: ASA Study — Correct SLA Formula
description: The only correct way to compute SLA% from fact_support_sla_by_queue_cluster; validated against Walter Arias's official dashboard (2026-04-16)
type: reference
---

## Correct SLA Formula for `edw.opex.fact_support_sla_by_queue_cluster`

**Column**: `case_in_sla = TRUE`
**Denominator**: `COUNT(*)` — all contacts, no audience filters
**Validated**: matches Walter Arias's official Cluster SLA dashboard exactly
- VIP Dasher New, 10/31/2025: `case_in_sla=TRUE` → **27,221 / 40,085 = 67.9%** ✅

```sql
COUNT(*) AS n_contacts,
SUM(CASE WHEN case_in_sla = TRUE THEN 1 ELSE 0 END) AS n_met,
ROUND(n_met * 100.0 / n_contacts, 1) AS sla_pct
```

### What NOT to use

| Formula | Why wrong |
|---|---|
| `cluster_missed = 0` | Gives 29,418 vs correct 27,221 — overcounts by ~2,197 |
| `cluster_missed = 0 AND is_short_abandon = FALSE` | Same problem — short abandons (635) don't explain the gap |
| Any filter on `case_customer_type`, `case_origin`, `wait_time_bucket`, `cluster_wait_time` | Excludes the missed contacts disproportionately, inflating SLA (e.g. Halloween: 99.1% filtered vs 67.9% correct) |

### Key insight on audience filters

Yan's view (`v_asa_analysis_data`) applies filters (`case_customer_type IN ('Consumer','Dasher')`, `case_origin IN ('Phone','Chat')`, `cluster_wait_time >= 0`, `wait_time_bucket != '09: [unknown]'`).
These filters are **correct for DWR elasticity analysis** but **wrong for SLA monitoring** — the excluded contacts are disproportionately missed/abandoned, so filtering inflates the SLA %.

### File references

- `sql/01_queue_sla_metrics.sql` — has both columns for comparison: `sla_internal_met_pct` (= `case_in_sla`, ✅ correct) and `sla_external_met_pct` (= `cluster_missed=0`, ❌ wrong for dashboard match)
- `quarterly_analysis.py` — uses `case_in_sla = TRUE` with no audience filters (correct)
- `sql/16_validate_vs_official.sql` — validation query using `case_in_sla = TRUE`
