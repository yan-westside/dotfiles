---
name: Drive BPO Classification & Data Sources
description: Drive CPT/FTE cluster lists, Drive SaaS McDonalds Phone Alorica split, FTE Summary row ranges, vendor section rows
type: project
---

## Drive is 100% BPO — No In-House Clusters to Skip

## CPT Billing (6 clusters)
1. NBV Cx Chat
2. NBV Cx Phone
3. Dx Shop Deliver Chat
4. Dx Shop Deliver Phone
5. Spanish Drive HRO Chat
6. Spanish Drive HRO Phone

## FTE Billing (14 clusters)
1. Drive HRO Chat
2. Drive HRO Phone
3. Drive SaaS Parcel Phone
4. Drive SaaS LCE Chat
5. Drive SaaS LCE Phone
6. Spanish Drive SaaS Phone
7. Residential Pickup Support Chat
8. Residential Pickup Support Phone
9. Drive SaaS McDonalds Chat
10. Drive SaaS Chat
11. Drive SaaS Phone
12. Drive Storefront Chat
13. Drive Storefront Phone
14. Drive SaaS Parcel Chat

## ⚠️ Special Case: Drive SaaS McDonalds Phone (FTE only — HC is total)

- Multiple vendors serve this cluster
- **Alorica** → FTE billing model
- **Other vendors** → CPT billing model
- Drive is 100% BPO, so this cluster appears in both FTE and HC tables
- **FTE table**: Report ONLY Alorica's FTE (not total FTE Summary value)
  - AOP total FTE (FTE Summary cell S536) = 105 — do NOT use this
  - AOP Alorica FTE (row 1723) = 17 ← use this for FTE table
  - Lock file Alorica vendor section: ~rows 1690–1751 (check ±a few rows)
- **HC table**: Same logic — use Alorica vendor section for HC, not total HC Summary

## Data Sources

### FTE (Total — all vendors combined)
- Tab: FTE Summary
- Row range: ~472–648 (spreadsheet rows, 1-indexed) — scan column C dynamically, do NOT fix row numbers (small WoW shifts expected)
- Drive clusters identified by column C label
- AOP Drive SaaS McDonalds Phone total: cell S536 = 105 (⚠️ DO NOT use for FTE table — Alorica only)
- Drive SaaS McDonalds Chat: single FTE vendor, no billing split — use FTE Summary total directly

### FTE (Alorica only — for McDonalds Phone)
- AOP: row 1723
- Lock files: ~rows 1690–1751 (check a few rows before/after)

### HC (Total — all vendors combined, including McDonalds Phone)
- FTE Summary tab HC section — same process as Cx/Dx/Integrity
- HC does NOT split by billing model — always use total HC regardless of vendor
- Drive SaaS McDonalds Phone HC = total HC from FTE Summary (no Alorica-only split)

## Tables to Build
- **Drive FTE Billing**: 14 FTE clusters (Drive SaaS McDonalds Phone = Alorica portion only)
- **Drive HC Total**: all 20 clusters (6 CPT + 14 FTE; McDonalds Phone = Alorica HC only)
