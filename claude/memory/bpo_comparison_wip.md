---
name: BPO Comparison Table — WIP
description: In-progress work to build BPO FTE/HC comparison table for Finance <> WFM weekly sync
type: project
---

## Status: CONSUMER ✅ | DASHER ✅ | INTEGRITY FTE ✅ | INTEGRITY HC ✅ | DRIVE ✅ — All sent 2026-04-20 (Apr 20 lock)

## Slack Thread Format (confirmed 2026-04-20)
Send as **4 parent messages** (Cx, Dx, Integrity, Drive), each with FTE and HC as thread replies.
- Parent format: `:thread: **{LOB} Apr 20 BPO FTE and HC Lock Comparison**`
- FTE: CQ reply + H2 reply (Integrity: H2 split into Part 1/2 and Part 2/2, split after cluster 15 = Fraud Dx Core Atemporal Appeals Web)
- HC: CQ reply + H2 reply (same Integrity split applies)
- Sent to D021SHPTP38 (Yan's DM)

## Drive Tables — Sent 2026-04-20
- Script: `finance_wfm/data/bpo/build_drive_tables.py`
- Drive FTE Billing (16 clusters incl. Alorica + Drive Bulk Refunds Web at 0)
- Drive HC Total (22 clusters incl. Drive Bulk Refunds Web at 0)
- Drive Bulk Refunds Web: AOP-only (FTE=26, HC=28); 0 in lock — user to follow up with DRI
- Sent to thread `1776734136.099359` in D021SHPTP38

## Three GCP Files
- **AOP**: `18S85YKLNf_5ASoJRZIBeoi9W6ZeyVXw840lqOmIK5SM` — starts 01-05-26 in col D
- **This week (Apr 20 lock)**: `1HWjk86pN_xs_IlpPlZf5h5p4Ow-frUWAhLQ1Ctpx5xY` — starts 09-29-25 in col D
- **Last week (Apr 13 lock)**: `1N3AMLqKzar07U85fCoaQOd3C9UPIEfnTt0sPnxH1S90` — starts 09-29-25 in col D

## Column Index Mappings (as of Apr 20 lock run)

### Lock Files (col E = Sep 29, 2025 = index 1 from col D)
- Apr 20 (this week): index 30 (col AH)
- H2 Jul: 41, 42, 43, 44
- H2 Aug: 45, 46, 47, 48, 49
- H2 Sep: 50, 51, 52, 53
- H2 Oct: 54, 55, 56, 57
- H2 Nov: 58, 59, 60, 61, 62
- H2 Dec: 63, 64, 65, 66

### AOP File (col E = Jan 5, 2026 = index 1 from col D)
- Apr 20 (AOP current week): index 16 (col T)
- H2 Jul: 27, 28, 29, 30
- H2 Aug: 31, 32, 33, 34, 35
- H2 Sep: 36, 37, 38, 39
- H2 Oct: 40, 41, 42, 43
- H2 Nov: 44, 45, 46, 47, 48
- H2 Dec: 49, 50, 51

## Row Structure

### Current/Last Week CONSUMER (A73:BQ103)
- Row index 0: Production + Nesting + OT FTE (total)
- Row index 1: Cx Specialized Pod Chat (CPT)
- Row index 2: Cx Specialized Pod Phone (CPT)
- Row index 3: Cx Whales Proactive Phone (skip - zeroed H2)
- Row index 4: Elite Cancel Prevention Proactive Outreach Phone (skip - zeroed H2)
- Row index 5: Spanish Cx Chat (CPT)
- Row index 6: Spanish Cx Phone (CPT)
- Row index 7: US Cx Chat (CPT)
- Row index 8: US Cx Phone (CPT)
- Row index 9: Cx VIP Phone (CPT)
- Row index 10: CA Cx Chat (CPT)
- Row index 11: CA Cx Phone (CPT)
- Row index 12: Cx VIP Chat (CPT)
- Row index 13: AU Cx Chat (CPT)
- Row index 14: AU Cx Phone (CPT)
- Row index 15: French Chat ← non-CPT
- Row index 16: French Phone ← non-CPT
- Row index 17: Cx Recovery Pod ← EMPTY (all blanks; likely skip — unconfirmed)
- Row index 18: DDFB Phone & Web ← IN-HOUSE (→ PHX DDFB; skip from BPO)
- Row index 19: ACE Web ← IN-HOUSE (→ PHX ACE; skip from BPO)
- Row index 20: DDFB Chat ← IN-HOUSE (→ CDMX DDFB Chat; skip from BPO)
- Row index 21: Elite DR Chat ← ⚠️ UNCONFIRMED (CPT/FTE/in-house? open question in doc 18c4...)
- Row index 22: Elite DR Phone ← ⚠️ UNCONFIRMED (CPT/FTE/in-house? open question in doc 18c4...)
- Row index 23: GA Cx Chat & Web ← IN-HOUSE (→ CDMX/PHX GA Cx; skip from BPO)
- Row index 24: Social Web ← IN-HOUSE (→ PHX Social; skip from BPO)
- Row index 25: Sprint Web ← IN-HOUSE (→ PHX Sprint; skip from BPO)
- Row index 26: Visually Impaired Phone ← IN-HOUSE (→ PHX VI; skip from BPO)
- Row index 27: OTTL ← FTE billing
- Row index 28: Elite PO ← IN-HOUSE (confirmed 2026-04-18; skip from BPO)
- Row index 29: Placeholder

### Current/Last Week DASHER (A73:BQ103)
- Row index 0: Production + Nesting + OT FTE (total)
- Row index 1: AU Dx Chat ← CPT
- Row index 2: AU Dx Phone ← CPT
- Row index 3: CA Dx Chat ← CPT
- Row index 4: CA Dx Phone ← CPT
- Row index 5: Dx Direct and Payment Chat ← CPT
- Row index 6: Dx Direct and Payment Phone ← CPT
- Row index 7: Dx Non-Live Chat ← CPT
- Row index 8: Dx Non-Live Phone ← CPT
- Row index 9: Dx Proactive Outreach Phone ← FTE (billing)
- Row index 10: Dx VIP Chat ← CPT
- Row index 11: Dx VIP Phone ← CPT
- Row index 12: Spanish Dx Chat ← CPT
- Row index 13: Spanish Dx Escalations Chat ← FTE
- Row index 14: Spanish Dx Escalations Phone ← FTE
- Row index 15: Spanish Dx Phone ← CPT
- Row index 16: US DX Chat ← CPT
- Row index 17: US DX Phone ← CPT
- Row index 18: Placeholder
- Row index 19: Dx Tax Web ← FTE
- Row index 20: DIP Web ← IN-HOUSE (skip from BPO)
- Row index 21: Final Dashination Web ← IN-HOUSE (skip from BPO)
- Row index 22: GA Dx Chat & Web ← IN-HOUSE (skip from BPO)
- Row index 23: T3 Dx Web ← IN-HOUSE (skip from BPO; EMPTY — all blanks in current/last week)
- NEW: Dx Reimbursement Pod ← FTE billing; starts Apr 13 lock, first appears in Apr 20 lock file
- Row index 24: Spanish Dx Payments Phone ← CPT
- Row index 25: "last"

### AOP CONSUMER (A73:BC115 needed — has 2-row offset)
- Rows 73-74: placeholder/empty
- Row 75 (index 2): Production + Nesting + OT FTE
- Row 76 (index 3): Cx Specialized Pod Chat
- ... offset by 2 vs current week
- Row 91 (index 18): French Chat ← non-CPT
- Row 92 (index 19): French Phone ← non-CPT
- Row 93 (index 20): Cx Recovery Pod ← non-CPT (all zeros in AOP)
- Row 94 (index 21): DDFB Phone & Web ← non-CPT
- Row 95 (index 22): ACE Web ← non-CPT
- Row 96 (index 23): DDFB Chat ← non-CPT
- Row 97 (index 24): Elite DR Chat ← non-CPT
- Row 98 (index 25): Elite DR Phone ← non-CPT
- Row 99 (index 26): GA Cx Chat & Web ← non-CPT
- Row 100 (index 27): LOPO (skip — not in current/last week)
- Row 101 (index 28): Social Web ← non-CPT
- Row 102 (index 29): Sprint Web ← non-CPT
- Row 103 (index 30): Visually Impaired Phone ← non-CPT
- Row 104 (index 0 of A104:BC115): OTTL ← non-CPT ✅ (confirmed exists)
- **Elite PO: NOT FOUND in AOP** — AOP has "Cx Local Advocates" and "Cx Non-Live Advocate" after OTTL, no Elite PO

### AOP DASHER (A73:BC103)
- Rows 73-74: empty
- Row 75 (index 2): Production + Nesting + OT FTE
- Row 84 (index 11): Dx Proactive Outreach Phone ← FTE
- Row 88 (index 15): Spanish Dx Escalations Chat ← FTE
- Row 89 (index 16): Spanish Dx Escalations Phone ← FTE
- Row 94 (index 21): Dx Tax Web ← FTE
- Row 95 (index 22): DIP Web ← IN-HOUSE (skip)
- Row 96 (index 23): Final Dashination Web ← IN-HOUSE (skip)
- Row 97 (index 24): GA Dx Chat & Web ← IN-HOUSE (skip)
- Row 98 (index 25): T3 Dx Web ← IN-HOUSE (skip; all zeros in AOP)
- Row 99 (index 26): Spanish Dx Payments Phone ← CPT

## INTEGRITY HC Total Section — Ranges
- Lock files: `INTEGRITY!C360:BQ389` (30 rows, same cluster order as FTE compact section)
  - Header at sheet row 359: "INTEGRITY | HC Total"
  - Data rows 360–389
- AOP: `INTEGRITY!C362:BE397` (36 rows including AOP-only clusters)
  - Header at sheet row 361
  - Data rows 362–397

## INTEGRITY Index Conventions (HC and FTE use same offsets)
- Lock: col C = index 0 = name; d[28] = "Apr 13" (step3 convention); LW d[28] = "Apr 6"
- AOP: a = row[1:]; a[14] = Apr 13; a[15] = Apr 20
- H2 lock: Jul d[40:44], Aug d[44:49], Sep d[49:53], Oct d[53:57], Nov d[57:62], Dec d[62:66]
- H2 AOP: Jul a[26:30], Aug a[30:35], Sep a[35:39], Oct a[39:43], Nov a[43:48], Dec a[48:52]

## Key Issues
1. **Elite PO missing from AOP CONSUMER** — AOP baseline is N/A; use "—" in vs-AOP column
2. **OTTL in AOP** is at rows 104-105 (separate read needed when resuming, but data already in hand from A104:BC115 read — row index 0 of that range)
3. **Cx Recovery Pod** in current/last week = all blank (no FTE data); in AOP = all zeros
4. **T3 Dx Web** in current/last week = all blank; in AOP = all zeros
5. **LOPO** in AOP CONSUMER (row 100) = doesn't match any cluster in current/last week files — skip
6. **HC ≠ FTE for Integrity** — step4 must use C360:BQ389 (not C114:BQ143)

## Output Format (same as in-house)
Columns: Cluster | Apr 13 (Cur Wk) | AOP | vs AOP | Apr 6 (Last Wk) | WoW
H2 monthly averages: Jul | Aug | Sep | Oct | Nov | Dec (for both cur wk and AOP)
Flag ◄ at |diff / base| ≥ 5% (percentage threshold, not absolute)

## What's Left
### INTEGRITY HC (next up)
1. ✅ HC source ranges identified: C360:BQ389 (lock files), C362:BE397 (AOP)
2. ✅ All 3 GCP ranges fetched (2026-04-19 session)
3. ⚠️ Rewrite step4_integrity_hc_table.py with correct HC source rows and d[28] convention
4. Run script and append HC table to bpo_fte_billing_apr13.txt
5. Write INTEGRITY tab to Google Doc `18c4-EP-2nk8g4VcMNsMDYfplqu-1b55NQWzDVB1q0iU` tab t.lu12z0xw0jod

### DRIVE
6. Classify DRIVE clusters in-house vs BPO (ask user)
7. Build FTE + HC Total tables same as above
