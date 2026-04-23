---
name: INTEGRITY BPO HC Table
description: INTEGRITY BPO FTE cluster list, AOP mapping, data references — FTE ✅ done; HC Total ✅ data fetched, script pending
type: project
---

## Status
- FTE TABLE: ✅ computed 2026-04-19, saved to bpo_fte_billing_apr13.txt. Google Doc tab t.lu12z0xw0jod NOT WRITTEN.
- HC TOTAL TABLE: ✅ all 3 GCP ranges fetched (2026-04-19). step4 script must be REWRITTEN — old version used wrong FTE source rows. Script rewrite pending.

## CRITICAL: HC ≠ FTE for Integrity
- FTE = billing FTE (what vendor charges) — compact section at INTEGRITY rows 113–143
- HC = Production + Nesting + OT headcount (actual bodies, includes nesting ramp) — compact section at INTEGRITY rows 359–389
- Example: Fraud Cx C&R Holding Tank Web week of 4/20 → FTE=207 (AOP cell S121), HC=267 (AOP cell S2472)
- HC > FTE because nesting headcount is included but not yet at full billing productivity

## GCP Ranges — FTE Billing (step3, done)
- **Current (Apr 14 lock)**: `1N3AMLqKzar07U85fCoaQOd3C9UPIEfnTt0sPnxH1S90` — `INTEGRITY!C114:BQ143`
- **Last week (Apr 6 lock)**: `1ZtSXnpWheHLltuk8Y_XRAPaChNw3V6iYoBmqS2wdPbg` — `INTEGRITY!C114:BQ143`
- **AOP**: `18S85YKLNf_5ASoJRZIBeoi9W6ZeyVXw840lqOmIK5SM` — `INTEGRITY!C116:BE191`

## GCP Ranges — HC Total (step4, data fetched 2026-04-19)
- **Current (Apr 14 lock)**: `1N3AMLqKzar07U85fCoaQOd3C9UPIEfnTt0sPnxH1S90` — `INTEGRITY!C360:BQ389` (30 rows)
- **Last week (Apr 6 lock)**: `1ZtSXnpWheHLltuk8Y_XRAPaChNw3V6iYoBmqS2wdPbg` — `INTEGRITY!C360:BQ389` (30 rows)
- **AOP**: `18S85YKLNf_5ASoJRZIBeoi9W6ZeyVXw840lqOmIK5SM` — `INTEGRITY!C362:BE397` (36 rows, includes AOP-only clusters)

## Index Mappings — HC Total (0-based, d[0] = cluster name)
### Current / Last Week (C360:BQ389)
- Col C = index 0 = cluster name
- Col D = Sep 29 2025 = index 1
- **Apr 13 (this week): d[28]** (step3 convention — index 28 from CUR file)
- **Apr 6 (last week): d[28]** (from LW file)
- H2 Jul: d[40:44], Aug: d[44:49], Sep: d[49:53], Oct: d[53:57], Nov: d[57:62], Dec: d[62:66]

### AOP (C362:BE397)
- Col C = index 0 = cluster name; a = row[1:] strips name
- Col D = Jan 5 2026 = a[0]
- **Apr 13 AOP: a[14]**
- **Apr 20 AOP: a[15]** (confirmed: C&R Holding Tank a[15]=267 matches AOP cell S2472=267 ✓)
- H2 Jul: a[26:30], Aug: a[30:35], Sep: a[35:39], Oct: a[39:43], Nov: a[43:48], Dec: a[48:52]

## AOP_MAP — IDENTICAL for HC and FTE (same cluster ordering in both compact sections)
`[20, 1, 15, 0, 2, 4, 5, 8, 18, 19, None, 10, 11, 12, 16, 17, None, 13, 14, None, 21, 22, 23, None, 25, 26, 29, 31, 33, 34]`

AOP-only rows in HC section (skip): indices 3, 6, 7, 9, 24, 27, 28, 30, 32, 35

## Flag Threshold
|diff / base| ≥ 5%. If base=0 and cur=0: no flag. If base=0 and cur>0: flag ◄.

## 30 BPO/FTE Clusters (current rows 0–29) → AOP Array Index (a_row = 0-based row in AOP data)

| # | Current Cluster Name | AOP Row Index | Notes |
|---|---|---|---|
| 0 | Fraud Cx Payments Risk Type Tagging | a_row[20] | AOP name: "Fraud Payments Risk Type Tagging" |
| 1 | Fraud Cx Containment Queues Web | a_row[1] | |
| 2 | Fraud Mx SSMO - Documents Review Web | a_row[15] | |
| 3 | Fraud Cx Payments DDR Web | a_row[0] | Wound down to 0 in current |
| 4 | Fraud Cx CSS Web | a_row[2] | |
| 5 | Fraud Cx C&R False Positive Review Web | a_row[4] | |
| 6 | Fraud Cx C&R Holding Tank Web | a_row[5] | |
| 7 | Fraud Cx ML Block and Review Web | a_row[8] | Wound down to 0 |
| 8 | Fraud Live RQ Help (Pilot) | a_row[18] | |
| 9 | Fraud Cx Protection & Review Hub | a_row[19] | |
| 10 | Fraud CX Gift card review/FP | **NO AOP** | New cluster; use "—" |
| 11 | Fraud Dx Core Time-Based Appeals Web | a_row[10] | |
| 12 | Fraud Dx Special Handling Delivery Web | a_row[11] | |
| 13 | Fraud Dx Time-Based Delivery Web | a_row[12] | |
| 14 | Fraud Dx Core Atemporal Appeals Web | a_row[16] | Wound down to 0 |
| 15 | Fraud Dx Non Time-Based Delivery Web | a_row[17] | |
| 16 | Fraud Mx ATO Offshore and SSMO Web | **NO AOP** | New cluster; use "—" |
| 17 | Fraud Mx ATO Offshore Review Web | a_row[13] | Wound down to 0 |
| 18 | Fraud Mx SSMO Web | a_row[14] | Wound down to 0 |
| 19 | Fraud Mx IDV ATO | **NO AOP** | New cluster; use "—" |
| 20 | HSL Chat | a_row[21] | |
| 21 | HSL Escalation Web | a_row[22] | |
| 22 | HSL Phone | a_row[23] | |
| 23 | T2FS | **NO AOP** | New cluster; use "—" |
| 24 | TnS Safety Hotline Phone | a_row[25] | |
| 25 | HSL Escalation Chat | a_row[26] | AOP name: "Trust & Safety Live Escalations Chat" |
| 26 | TIN Appeals | a_row[29] | |
| 27 | RDD | a_row[31] | |
| 28 | IDV+ | a_row[33] | |
| 29 | IDV Core | a_row[34] | |

## AOP-only clusters (NOT in current/last week)
Skip: Fraud Cx Account Review Web (a_row[3]), Fraud Cx Cancellation Holding Tank Web (a_row[6]), Fraud Cx Live Card Scan Web (a_row[7]), Fraud Cx Reactivation Review (a_row[9]), Spanish HSL Escalation Web (a_row[24]), Dx ID Verification Web (a_row[27]), Dx IDV Adhoc (a_row[28]), Canada IDV/reIDV (a_row[30]), AAPP (a_row[32]), Fraud - Summary 2025 (a_row[35])

## Quick-Ref: Apr 13 HC Spot-Checks (d[28] from CUR INTEGRITY!C360:BQ389)
- Fraud Cx C&R Holding Tank Web: **244** (vs FTE 193 — HC > FTE ✓; LW HC = 248)
- IDV Core: **~362** (AOP a[14]≈362, a[15]=358 for Apr 20)
- Fraud CX Gift card review/FP (row 11): all zeros through d[31], then 15/30/57... (ramp later)

## Quick-Ref: Apr 13 FTE (d[28] from FTE section, INTEGRITY!C114:BQ143)
- Fraud Cx Payments Risk Type Tagging: **20**
- Fraud Cx Containment Queues Web: **13**
- Fraud Mx SSMO - Documents Review Web: **10**
- Fraud Cx Payments DDR Web: **0** (wound down)
- Fraud Cx CSS Web: **17**
- Fraud Cx C&R False Positive Review Web: **93**
- Fraud Cx C&R Holding Tank Web: **193**
- Fraud Cx ML Block and Review Web: **0** (wound down)
- Fraud Live RQ Help (Pilot): **41**
- Fraud Cx Protection & Review Hub: **18**
- Fraud CX Gift card review/FP: **0**
- Fraud Dx Core Time-Based Appeals Web: **39**
- Fraud Dx Special Handling Delivery Web: **51**
- Fraud Dx Time-Based Delivery Web: **113**
- Fraud Dx Core Atemporal Appeals Web: **0** (wound down)
- Fraud Dx Non Time-Based Delivery Web: **140**
- Fraud Mx ATO Offshore and SSMO Web: **4**
- Fraud Mx ATO Offshore Review Web: **0** (wound down)
- Fraud Mx SSMO Web: **0** (wound down)
- Fraud Mx IDV ATO: **0** (new cluster)
- HSL Chat: **24**
- HSL Escalation Web: **36**
- HSL Phone: **57**
- T2FS: **42**
- TnS Safety Hotline Phone: **42**
- HSL Escalation Chat: **69**
- TIN Appeals: **70**
- RDD: **11**
- IDV+: **59**
- IDV Core: **278**

## AOP HC Quick-Ref (a[14] = Apr 13, a[15] = Apr 20 from INTEGRITY!C362:BE397)
- Fraud Cx C&R Holding Tank Web: a[14]=269, a[15]=267
- Fraud Payments Risk Type Tagging: a[14]≈33
- IDV Core: a[14]=362, a[15]=358

## Confirmed AOP HC Values (week of 4/20, a[15])
- IDV Core INTEGRITY: **358**
- Dx Tax Web DASHER: **9** (from DASHER!S94)
- US Cx Chat CONSUMER: **1,300** (from CONSUMER!S82)

## Script Notes
- **step4_integrity_hc_table.py** must be REWRITTEN — old version used wrong source (FTE rows C114:BQ143, wrong index cur_row[29])
- Correct sources: CUR_HC/LW_HC from C360:BQ389; AOP from C362:BE397
- Use d[28] for "Apr 13" (step3 convention), d[28] from LW file for "Apr 6"
- AOP_MAP is identical to FTE; H2 ranges same as FTE

## Pending Next Steps
1. ✅ CONSUMER FTE table — complete
2. ✅ DASHER HC Total + FTE tables — complete
3. ✅ INTEGRITY FTE table — computed (2026-04-19), saved to bpo_fte_billing_apr13.txt
4. ⚠️ INTEGRITY HC table — data fetched ✅, step4 script rewrite pending
5. ❌ DRIVE BPO tables — not started
6. ⚠️ Google Doc INTEGRITY tab — NOT WRITTEN: user skipped (2026-04-19). Tab t.lu12z0xw0jod is empty/stale. Write when user is ready.
