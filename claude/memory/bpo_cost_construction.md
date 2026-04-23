---
name: BPO Cost Construction — FTE Billing + Technology Cost
description: Two-component BPO cost framework: FTE billing (individual cluster rows, Cx/Dx/Integrity) and technology cost (HC from FTE summary tab, all BPO clusters)
type: project
---

## Two Cost Components

### Component 1: FTE Billing
- **Source**: Individual cluster rows from GCP Consumer / Dasher / Integrity tabs (NOT the "Production + Nesting + OT FTE" total row — that's a grand total)
- **Scope**: Only clusters with FTE billing model (see bpo_billing_classification.md for lists)
- **Drive**: Paused — do not build FTE billing table for Drive until confirmed
- **Tables**: Three separate tables — Consumer FTE clusters | Dasher FTE clusters | Integrity FTE clusters
- **FTE ≠ HC**: FTE and HC are fundamentally different numbers. HC = actual bodies on floor (Production + Nesting + OT headcount, includes agents in nesting ramp not yet at full productivity). FTE = billing FTE = what vendor charges = productive agents only. HC ≥ FTE always. Confirmed examples (AOP, week of 4/20): IDV Core HC=358 / FTE=290; US Cx Chat HC=1,572 / FTE=1,300; Dx Tax Web HC=12 / FTE=9. See bpo_billing_classification.md for full detail.

### Component 2: Technology Cost (HC)
- **Source**: FTE Summary tab in each GCP file (AOP / Apr 13 lock / Apr 6 lock)
- **ALSO the canonical source for FTE** — see fte_summary_tab.md for full structure
- **Section**: Row 826 header "OVERALL HC", then per-cluster HC rows 827–1002 (same cluster order as FTE section, +354 row offset)
  - Consumer: rows 827–855; Dasher: 856–879; Drive: 880–900 (skip); Integrity: 901–976; Merchant: skip
- **Metric**: HC (headcount), NOT FTE — HC ≥ FTE always; delta = nesting headcount
- **Column layout**: AOP col E = Jan 5 2026, Apr 13 = col S; Lock files col E = Sep 29 2025, Apr 13 = col AG
- **Full detail**: see fte_summary_tab.md

---

## Table Format (Same Two-Table Structure as In-House)

### Table 1 — Current Quarter
Cluster | Apr 13 | Apr 6 | WoW | AOP | vs AOP

- **Apr 13**: from Apr 13 lock file, at Apr 13 week column position
- **Apr 6**: from Apr 6 lock file, at Apr 13 week column position (position 29 = index 29 of numeric cols)
  - ⚠️ **Data gap**: raw_apr6_*.csv files only captured position 28 (Apr 6 week), NOT position 29 (Apr 13 week). Need re-pull from GCP before building these tables.
- **WoW** = Apr 13 − Apr 6 (same week, different lock files — reflects plan revision, not time passage)
- **AOP**: from AOP file, at Apr 13 week column position (curwk_aop_apr13 = position 15)
- **vs AOP**: (Apr13 − AOP) / AOP × 100%; flag ◄ when |diff / base| ≥ 5%

### Table 2 — H2 Forecast (Monthly Averages)
Columns: Jul | Aug | Sep | Oct | Nov | Dec

## H2 Monthly Averaging Method (Document for Stakeholders)
GCP stores weekly staffing data; there is no native monthly view. Monthly averages computed as:
- **Jul**: average of 4 weekly columns
- **Aug**: average of 5 weekly columns
- **Sep**: average of 4 weekly columns
- **Oct**: average of 4 weekly columns
- **Nov**: average of 5 weekly columns
- **Dec (lock files)**: average of 4 weekly columns
- **Dec (AOP file)**: average of 3 weekly columns (AOP sheet ends at col BC, one fewer week)

This method is consistent across Consumer, Dasher, Integrity, and Drive.

---

## Flag Threshold
BPO flag: ◄ at |vs AOP| ≥ 5% (percentage, not absolute HC — different from in-house which uses ±5 HC)

---

## Pending Before Building
1. ⚠️ Re-pull Apr 6 lock files for position 29 (Apr 13 week) — raw_apr6_consumer.csv and raw_apr6_dasher.csv currently stop at position 28
2. Check FTE summary tab structure in AOP GCP file (sheet `18S85YKLNf_5ASoJRZIBeoi9W6ZeyVXw840lqOmIK5SM`) to understand HC data layout before building tech cost tables
3. Drive FTE billing: paused; Drive HC included in tech cost once FTE summary tab is checked
