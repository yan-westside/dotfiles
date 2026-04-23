---
name: DRIVE BPO Table — WIP
description: DRIVE cluster classification (BPO vs in-house) and table structure for Finance <> WFM weekly sync
type: project
---

## Status: NOT STARTED ❌ — Classification researched, awaiting user confirmation + table build

## Source Files (same as other LOBs)
- Current (Apr 14 lock): `1N3AMLqKzar07U85fCoaQOd3C9UPIEfnTt0sPnxH1S90` — DRIVE sheet
- Last week (Apr 6 lock): `1ZtSXnpWheHLltuk8Y_XRAPaChNw3V6iYoBmqS2wdPbg` — DRIVE sheet
- AOP: `18S85YKLNf_5ASoJRZIBeoi9W6ZeyVXw840lqOmIK5SM` — DRIVE sheet

## All DRIVE Clusters (from DRIVE!C73:BQ95, FTE summary section)
Row 0: Production + Nesting + OT FTE (total)
Row 1: Dx Shop Deliver Chat
Row 2: Dx Shop Deliver Phone
Row 3: NBV Cx Chat
Row 4: NBV CX Phone
Row 5: Drive HRO Chat
Row 6: Drive HRO Phone
Row 7: Spanish Drive SaaS Phone
Row 8: Drive SaaS LCE Chat
Row 9: Drive Saas LCE Phone
Row 10: Drive SaaS McDonalds Chat
Row 11: Drive SaaS McDonalds Phone
Row 12: Drive SaaS Parcel Phone
Row 13: Drive SaaS Parcel Chat
Row 14: Spanish Drive HRO Chat
Row 15: Spanish Drive HRO Phone
Row 16: Drive SaaS Chat
Row 17: Drive SaaS Phone
Row 18: Residential Pickup Support Chat
Row 19: Residential Pickup Support Phone
Row 20: Drive Storefront Chat
Row 21: Drive Storefront Phone
Row 22: Placeholder

## Tentative BPO vs In-House Classification (UNCONFIRMED — ask user)
The TTEC vendor sub-section (DRIVE!C241:C263) shows Required FTE demand.
Only these 5 clusters have non-zero TTEC data (= likely BPO/TTEC):
- Dx Shop Deliver Phone
- Drive SaaS Chat
- Drive SaaS Phone
- Drive Storefront Chat
- Drive Storefront Phone

All other 16 clusters show zero TTEC volume (= likely in-house / DoorDash).

**MUST CONFIRM with user before building table.**

## GCP Sheet Structure Notes
- DRIVE sheet has 8,083 rows × 121 columns
- Summary FTE section: DRIVE!C73:BQ95 (22 clusters + total)
- TTEC sub-section (Required FTE summary): DRIVE!C241:BQ263
- Per-cluster detail blocks: start around row 284+ (need to verify exact row for HC Total offset)
- Column date mapping: same as CONSUMER/DASHER (starts 09-29-25 in col D = index 3; Apr13=index 31)

## Pending Next Steps
1. Confirm BPO vs in-house classification with user
2. Find HC Total rows in per-cluster detail for BPO clusters
3. Build HC Total table + FTE table (same format as CONSUMER/DASHER)
4. Write to Google Doc (ask user which tab / where to put DRIVE section)
