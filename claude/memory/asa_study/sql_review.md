---
name: ASA Study — SQL Query Review (13_tail_raw_data.sql)
description: Detailed review of the tail analysis query — what was fixed, what remains, and lessons learned from iterative review
type: project
---

# SQL Review: 13_tail_raw_data.sql

**File**: `team_analytics/personal/yan.jin@doordash.com/asa_friction_study/sql/13_tail_raw_data.sql`
**Purpose**: Single query feeding all 6 sections of asa_report_v2.html
**Grain**: LOB × queue_cluster × issue_category × wait_bin_10s (capped 600s) × week_start
**Date range**: 2026-01-05 → 2026-04-07
**Tables**: `edw.opex.fact_support_sla_by_queue_cluster`, `fact_support_contact_sot`, `fact_support_dwr_survey_responses`

---

## Bugs Found & Fixed (Across 3 Iterations)

| Issue | Status |
|---|---|
| `VIP Consumer` duplicated in both Cx Phone AND Dx Phone in lob_clusters → 4x fan-out | ✅ Fixed |
| No 600s cap on wait bins → unbounded sparse tail | ✅ Fixed (`LEAST(..., 600)`) |
| No minimum N threshold → noisy dwr_rate from sparse cells | ✅ Fixed (`CASE WHEN COUNT(d.dwr) >= 30`) |
| No partial week flag → WoW comparisons at edges misleading | ✅ Fixed (`week_completeness` CTE) |
| Redundant `DIV0(x, NULLIF(y,0))` pattern | ✅ Fixed |
| `dwr_data` date range open-ended (no upper bound) | ✅ Tightened to BETWEEN |

---

## Remaining Issues (As of 2026-04-11)

### MODERATE — dwr_data upper bound too tight
```sql
AND created_date_pst BETWEEN '2026-01-05' AND '2026-04-07'
```
DWR surveys arrive days after contact. Contacts in late March/early April will have their surveys silently excluded if submitted after Apr 7.
**Fix**: Extend upper bound by 7-14 days: `AND '2026-04-21'`

### LOW — `contact_id IS NOT NULL` missing in sla_base
The ~2% Salesforce cases with NULL contact_id still pass through `sla_base`, appearing in `n_contacts` but never matching the left joins. Slight inflation of n_contacts, suppression of survey_coverage.
**Fix**: Add `AND s.contact_id IS NOT NULL` to sla_base WHERE clause.

### LOW — Double JOIN to lob_clusters is fragile
`sla_base` joins lob_clusters for filtering but drops `lob`. Outer query re-joins to get `lob`. Works correctly now (no duplicates), but any future duplicate entry would silently fan-out counts.
**Better design**: Pass `lc.lob` through `sla_base`, remove the second JOIN.

### LOW — week_completeness scans full SLA table (no cluster filter)
Second full table scan of `fact_support_sla_by_queue_cluster` without the 43-cluster restriction. Works correctly but is a performance concern on large tables.

---

## Overclaimed Issues (Retracted)

- **contact_meta deduplication**: I said SOT tables "frequently have multiple rows." SOT = Source of Truth, typically 1-row per entity by design. Verify the grain, but don't assume duplicates.
- **dwr_data dedup via is_last_response_per_case**: This flag is designed to deduplicate. Concern was overstated.
- **Partial first week**: I incorrectly said Snowflake truncates to Sunday. Snowflake uses ISO standard (Monday). Jan 5, 2026 IS a Monday → first week is complete. Only the last week (Apr 6-7) is partial.

---

## Key Design Lessons

- Always check `lob_clusters` VALUES list for duplicate entries — fan-out is silent and fatal
- DWR survey date filter needs a buffer beyond the contact date range (surveys arrive late)
- `week_completeness` CTE approach (COUNT(DISTINCT day) = 7) correctly handles partial weeks
- `LEAST(FLOOR(wait / 10) * 10, 600)` is the right pattern for capped 10s bins
- NULL out dwr_rate when survey_count < 30 (done correctly)

---

## 43 Clusters in Scope

- **Cx Phone (9)**: Cx Specialized Pod, Customer, VIP Consumer, Cx-NBV-Phone-Pod, Cx P2P, Spanish Cx, French Cx, AU Consumer, CA Consumer
- **Cx Chat (11)**: Sendbird - Cx, VIP, NBV Pod, P2P Support, Specialized Pod, Canada, Australia, 0.5 Elite, US(ES), DDfB T3 VIP, Alorica CMP
- **Dx Chat (13)**: Sendbird - Dx VIP, Dx, US(ES), DSD Support, Canada, Australia, Drive HRO, Canada(FR), Payment, New Zealand, Drive HRO(ES), Alorica CMP, CDMX Dasher
- **Dx Phone (10)**: Dx DsD, Dasher X-mainline, Spanish Dx, VIP Dasher New, Dx Non-Live, Dasher Direct and Payments, French Dx, AU Dasher, CA Dasher, Spanish Dx Payments
