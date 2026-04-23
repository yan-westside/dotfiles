---
name: FTE Summary Tab — Canonical Source for FTE and HC
description: FTE Summary tab structure, column mappings, and row offsets for reading FTE and HC across all LOBs from all 3 GCP files
type: project
---

## Why This Tab (Not Individual LOB Tabs)
- Individual INTEGRITY/CONSUMER/DASHER tabs have dropdown-controlled sections (e.g., C361 = HC Total dropdown in INTEGRITY). A different dropdown selection would return wrong data.
- FTE Summary tab is static — no dropdown dependency. Single source for all LOBs.
- Validated 2026-04-19: US Cx Chat (FTE=1,300 / HC=1,572), Dx Tax Web (FTE=9 / HC=12), IDV Core (FTE=290 / HC=358) all confirmed against known cell references.

## Tab Structure

### Column Layout
- Col D = cluster name (always)
- Col E = first data week (different start dates per file — see below)
- Data is weekly, one week per column

### Row Structure — Dynamic, Not Fixed
**⚠️ Do NOT hardcode row numbers.** New clusters can be added at any time, shifting section boundaries.

**Correct approach each run:**
1. Read col B:D from a wide range covering the full FTE section (e.g., B460:D660) and HC section (e.g., B815:D1010)
2. Use col C (LOB label: Consumer / Dasher / Drive / Integrity / Merchant / Placeholder) to find section start/end rows dynamically
3. If row counts differ from prior run → flag to user ("Integrity section grew by N rows — new cluster detected") before proceeding
4. Extract cluster names from col D and match against known FTE-billed cluster lists

**Reference row numbers as of 2026-04-19 (AOP file, may change):**
| Section | FTE Rows | HC Rows |
|---|---|---|
| Header (total row) | 472 | 826 |
| Consumer | 473–501 | 827–855 |
| Dasher | 502–525 | 856–879 |
| Drive | 526–546 | 880–900 — SKIP |
| Integrity | 547–622 | 901–976 |
| Merchant | 623–636 | 977–990 — SKIP |
| Placeholder | 637–647 | 991–1002 — SKIP |

HC offset from FTE = **+354 rows** (verified 2026-04-19: US Cx Chat FTE row 479 → HC row 833)

**If lock files differ from AOP row counts** — flag it, do not assume same offsets apply.

## Column Mappings by File

### AOP File (`18S85YKLNf_5ASoJRZIBeoi9W6ZeyVXw840lqOmIK5SM`)
- Col E = Jan 5, 2026 (first week)
- **Apr 13 = col S** ← benchmark for current tables
- Apr 20 = col T ← update to this when Apr 20 lock is available
- H2 Jul: AE, AF, AG, AH
- H2 Aug: AI, AJ, AK, AL, AM
- H2 Sep: AN, AO, AP, AQ
- H2 Oct: AR, AS, AT, AU
- H2 Nov: AV, AW, AX, AY, AZ
- H2 Dec: BA, BB, BC (3 weeks only — AOP sheet ends at col BC)

### Lock Files (Apr 13 lock `1N3AMLqKzar07U85fCoaQOd3C9UPIEfnTt0sPnxH1S90` and Apr 6 lock `1ZtSXnpWheHLltuk8Y_XRAPaChNw3V6iYoBmqS2wdPbg`)
- Col E = Sep 29, 2025 (first week)
- Apr 6 = col AF
- **Apr 13 = col AG** ← read this column from BOTH lock files (WoW = Apr13lock AG − Apr6lock AG)
- H2 Jul: AS, AT, AU, AV
- H2 Aug: AW, AX, AY, AZ, BA
- H2 Sep: BB, BC, BD, BE
- H2 Oct: BF, BG, BH, BI
- H2 Nov: BJ, BK, BL, BM, BN
- H2 Dec: BO, BP, BQ, BR

**⚠️ Lock file column mapping (col AG = Apr 13) is calculated, not yet verified against known values. Verify on first read by checking IDV Core FTE row 581 col AG against expected ~287.**

## WoW Methodology
- WoW = Apr 13 lock col AG − Apr 6 lock col AG
- Both files read at the SAME WEEK (Apr 13 column), different lock snapshots
- This measures plan revision, not time passage

## AOP Benchmark
- Current benchmark = Apr 13 (col S in AOP)
- When Apr 20 lock file is available → update benchmark to Apr 20 (col T in AOP)
- vs AOP = (cur_apr13 − aop_apr13) / aop_apr13 × 100%; flag ◄ when |diff| ≥ 5%

## Scope Rules
- **Include**: Consumer, Dasher, Integrity
- **Skip**: Drive (adding next week when user has more clarity), Merchant, Placeholder
- **FTE Billing table**: only FTE-billed clusters (not CPT, not in-house) — see bpo_billing_classification.md
- **HC Total table**: all BPO clusters (Consumer + Dasher + Integrity), including CPT
- **Dx Reimbursement Pod**: skip for Apr 13 run; first appears in Apr 20 lock file

## H2 Monthly Averaging
- Jul: 4-week avg
- Aug: 5-week avg
- Sep: 4-week avg
- Oct: 4-week avg
- Nov: 5-week avg
- Dec (lock files): 4-week avg; Dec (AOP): 3-week avg (sheet ends at BC)
- Source: Apr 13 lock file for "current plan" H2; AOP file for "AOP" H2
