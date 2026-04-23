---
name: Finance <> WFM Weekly Sync — HC Comparison & Channel Learnings
description: Finance <> WFM working group context: AOP vs current/prior Partner Files (in-house H2 + BPO), weekly table format, flag thresholds, and ongoing Finance<>WFM alignment learnings from #support-finance-working-group (C06R99ART6D)
type: project
---

## In-House HC Comparison (Finance Tab, Partner Files)

**AOP Partner File ID**: `1bFnQGXeRRCaOlY_XmzMKOJsOlxRIMlJKA9vtIm0ie28` (frozen 2026 baseline)
**Apr 20 Partner File ID**: `1y1F9NULA8WJJ-XfNuo9uhvSbp74-VZLnuOIWb2u9iMs` (current as of 4/20/26)
**Apr 13 Partner File ID**: `1Yem0MQpmNdWoQiP6mmbtFqtLHCUT9K_f5IagaWX1w5s` (prior week)
**Apr 6 Partner File ID**: `1_ZOfQvR0oERqfW2yJ66lfN3fc3ZDdAPDoQhOGb-ZLO4` (two weeks ago)
**Tab**: **Finance Tab** (gid=619641624) — confirmed authoritative by Richard Lam (4/13/26). NOT FinanceImport.

### Finance Tab Structure
- **H2 monthly columns**: EQ=Jul, ER=Aug, ES=Sep, ET=Oct, EU=Nov, EV=Dec (rows 27–95)
- **Monthly values are weighted averages** by working days — NOT simple means of weekly values
- **CDMX LOBs**: rows 27–54 (col C labels); **PHX LOBs**: rows 64–90 (col C labels)
- **Q1/Q2 weekly data range**: EW:FX (starting WK_46027=Jan 5, 2026 at col EX; col EW is blank)
- **Current week column**: **FM = WK_46132 = Apr 20, 2026**; prior week = FL = Apr 13. Update each week.
- **H2 weekly data range**: FX:GW (26 weeks); FX3=WK_46209=7/6/26; GW3=WK_46384=12/28/26
- **CRITICAL — Monthly column reads**: ALWAYS read **EK:EV** (Jan:Dec, 12 cols) and extract cols 7–12 for H2 (Jul:Dec). Do NOT read EQ:EV directly — direct EQ:EV reads return wrong values (confirmed 2026-04-18: LOM CDMX Dec was 84 via EQ:EV, correct value is 81 via EK:EV cols 7-12)

### Approved Table Format (updated 4/18/26 — memorize this!)
Two tables per site:
1. **Current Quarter**: `Cluster | Apr 20 | Apr 13 | WoW | AOP | vs AOP`
   - Apr 20 = FM col from Apr 20 lock file (current week)
   - Apr 13 = FM col from Apr 13 lock file (its projection for same week = Apr 20 week)
   - WoW = Apr 20 − Apr 13 (same week, different lock files)
   - AOP = AOP frozen baseline (cur wk col)
   - vs AOP = Apr 20 − AOP
2. **H2 Forecast**: Three rows per cluster — Apr 20, AOP, vs AOP × Jul–Dec
   - AOP H2 values are frozen (never change)
   - Flag ◄ when |delta| ≥ 5 HC

**Local CSV files** (authoritative; do NOT re-read sheets):
- `finance_wfm/data/in_house/aop.csv` — AOP frozen baseline
- `finance_wfm/data/in_house/2026-04-20.csv` — Apr 20 lock (cur wk + WoW vs Apr 13)
- `finance_wfm/data/in_house/2026-04-13.csv` — Apr 13 lock (FM col for Apr 20 week + H2)
- `finance_wfm/data/in_house/2026-04-06.csv` — Apr 6 lock (FM col for Apr 20 week + H2)
- `finance_wfm/data/bpo/` — BPO data folder (empty, to be populated)
- All H2 values sourced from EK:EV reads (corrected 2026-04-18)

### Row → LOB Mapping (Finance Tab, 1-indexed from row 27)
**CDMX** (rows 27–54): 1=T1 Cx, 2=T1 Dx, 3=Cx VIP(depr), 4=DDFB, 5=DDFB Chat, 6=LOPO, 7=Drive, 8=Drive LOF(depr), 9=Dx Final Dash(0), 10=Mx Menu, 11=Mx POS, 12=Mx VIP, 13=Critical Inv, 14=LOM, 15=ACE(0), 16=NV, 17=Sprint(empty), 18=Tablets, 19=T1 Mx, 20=T3 Cx, 21=T3 Dx, 22=T3 Mx, 23=Voice Ord, 24=Elite Proj, 25=VI(0), 26=GA Cx, 27=GA Dx, 28=GA Mx
**PHX** (rows 64–90, data rows 38–64): 38=Social, 39=DIP, 40=Cx VIP(depr), 41=DDFB, 42=DDFB Chat(0), 43=LOPO(0), 44=Drive, 45=Drive LOF(depr), 46=Dx Final Dash, 47=Mx Menu, 48=Mx POS, 49=Mx VIP, 50=Critical Inv, 51=LOM, 52=ACE, 53=NV, 54=Sprint, 55=T1 Mx, 56=T3 Cx, 57=T3 Dx, 58=T3 Mx, 59=Voice Ord, 60=Elite Proj(0), 61=VI, 62=GA Cx, 63=GA Dx, 64=GA Mx

### CDMX — H2 Monthly (Apr 20 lock vs AOP, corrected from EK:EV reads 2026-04-18)

| Cluster | | Cur Wk | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **T1 Cx** | Apr 20 | 147 | 207 | 216 | 222 | 222 | 222 | 215 |
| | AOP | 165 | 165 | 165 | 165 | 165 | 165 | 160 |
| | vs AOP | **-18◄** | **+42◄** | **+51◄** | **+57◄** | **+57◄** | **+57◄** | **+55◄** |
| **DDFB Chat** | Apr 20 | 40 | 43 | 46 | 45 | 44 | 43 | 41 |
| | AOP | 26 | 26 | 26 | 31 | 29 | 28 | 26 |
| | vs AOP | **+14◄** | **+17◄** | **+20◄** | **+14◄** | **+15◄** | **+15◄** | **+15◄** |
| **LOPO** | Apr 20 | 53 | 53 | 53 | 53 | 53 | 53 | 51 |
| | AOP | 53 | 53 | 53 | 53 | 53 | 53 | 51 |
| | vs AOP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **LOM** | Apr 20 | 65 | 81 | 81 | 80 | 79 | 79 | 81 |
| | AOP | 68 | 72 | 72 | 71 | 70 | 70 | 73 |
| | vs AOP | -3 | **+9◄** | **+9◄** | **+9◄** | **+9◄** | **+9◄** | **+8◄** |
| **LABS** | Apr 20 | 14 | 10 | 9 | 8 | 7 | 6 | 5 |
| | AOP | — | — | — | — | — | — | — |
| **Elite Proj** | Apr 20 | 80 | 87 | 86 | 84 | 85 | 85 | 80 |
| | AOP | 55 | 50 | 49 | 47 | 48 | 48 | 45 |
| | vs AOP | **+25◄** | **+37◄** | **+37◄** | **+37◄** | **+37◄** | **+37◄** | **+35◄** |
| **GA Cx** | Apr 20 | 37 | 43 | 45 | 46 | 54 | 53 | 50 |
| | AOP | 35 | 37 | 39 | 40 | 48 | 47 | 44 |
| | vs AOP | +2 | **+6◄** | **+6◄** | **+6◄** | **+6◄** | **+6◄** | **+6◄** |
| **T1 Dx** | Apr 20 | 118 | 125 | 130 | 136 | 135 | 143 | 140 |
| | AOP | 111 | 118 | 123 | 129 | 128 | 136 | 133 |
| | vs AOP | **+7◄** | **+7◄** | **+7◄** | **+7◄** | **+7◄** | **+7◄** | **+7◄** |
| **GA Dx** | Apr 20 | 86 | 82 | 83 | 92 | 102 | 96 | 92 |
| | AOP | 73 | 69 | 73 | 80 | 86 | 83 | 80 |
| | vs AOP | **+13◄** | **+13◄** | **+10◄** | **+12◄** | **+16◄** | **+13◄** | **+12◄** |
| **Critical Inv** | Apr 20 | 47 | 53 | 53 | 53 | 53 | 53 | 51 |
| | AOP | 49 | 49 | 49 | 49 | 49 | 49 | 47 |
| | vs AOP | -2 | +4 | +4 | +4 | +4 | +4 | +4 |
| **Safety (CR)** | Apr 20 | 149 | 143 | 143 | 150 | 147 | 152 | 154 |
| | AOP | 142 | 128 | 132 | 139 | 134 | 140 | 135 |
| | vs AOP | **+7◄** | **+15◄** | **+11◄** | **+11◄** | **+13◄** | **+12◄** | **+19◄** |
| **Authenticity (MQ)** | Apr 20 | 125 | 111 | 109 | 107 | 105 | 103 | 101 |
| | AOP | 140 | 141 | 138 | 141 | 139 | 136 | 133 |
| | vs AOP | **-15◄** | **-30◄** | **-29◄** | **-34◄** | **-34◄** | **-33◄** | **-32◄** |
| **Fraud (Tx)** | Apr 20 | 274 | 254 | 252 | 257 | 252 | 256 | 255 |
| | AOP | 282 | 269 | 270 | 280 | 273 | 276 | 267 |
| | vs AOP | -8 | **-15◄** | **-18◄** | **-23◄** | **-21◄** | **-20◄** | **-12◄** |

### PHX — H2 Monthly (Apr 20 lock vs AOP, corrected from EK:EV reads 2026-04-18)

| Cluster | | Cur Wk | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **Social** | Apr 20 | 21 | 19 | 19 | 18 | 18 | 17 | 16 |
| | AOP | 19 | 17 | 17 | 16 | 16 | 15 | 14 |
| | vs AOP | +2 | +2 | +2 | +2 | +2 | +2 | +2 |
| **DDFB** | Apr 20 | 25 | 29 | 28 | 27 | 25 | 24 | 23 |
| | AOP | 19 | 16 | 15 | 14 | 12 | 11 | 10 |
| | vs AOP | **+6◄** | **+13◄** | **+13◄** | **+13◄** | **+13◄** | **+13◄** | **+13◄** |
| **LOM** | Apr 20 | 51 | 48 | 47 | 46 | 45 | 44 | 41 |
| | AOP | 40 | 37 | 36 | 35 | 35 | 40 | 37 |
| | vs AOP | **+11◄** | **+11◄** | **+11◄** | **+11◄** | **+10◄** | +4 | +4 |
| **ACE** | Apr 20 | 22 | 22 | 22 | 22 | 23 | 30 | 28 |
| | AOP | 17 | 17 | 17 | 17 | 17 | 17 | 16 |
| | vs AOP | **+5◄** | **+5◄** | **+5◄** | **+5◄** | **+6◄** | **+13◄** | **+12◄** |
| **Sprint** | Apr 20 | 48 | 46 | 46 | 50 | 49 | 49 | 51 |
| | AOP | 56 | 54 | 54 | 58 | 57 | 57 | 59 |
| | vs AOP | **-8◄** | **-8◄** | **-8◄** | **-8◄** | **-8◄** | **-8◄** | **-8◄** |
| **LABS** | Apr 20 | 23 | 23 | 23 | 23 | 23 | 23 | 22 |
| | AOP | — | — | — | — | — | — | — |
| **VI** | Apr 20 | 42 | 48 | 47 | 46 | 46 | 54 | 50 |
| | AOP | 57 | 52 | 51 | 50 | 49 | 48 | 46 |
| | vs AOP | **-15◄** | -4 | -4 | -4 | -3 | **+6◄** | +4 |
| **GA Cx** | Apr 20 | 20 | 19 | 18 | 17 | 16 | 15 | 14 |
| | AOP | 30 | 28 | 27 | 26 | 25 | 24 | 23 |
| | vs AOP | **-10◄** | **-9◄** | **-9◄** | **-9◄** | **-9◄** | **-9◄** | **-9◄** |
| **DIP** | Apr 20 | 15 | 21 | 20 | 19 | 18 | 17 | 16 |
| | AOP | 23 | 29 | 28 | 27 | 26 | 25 | 24 |
| | vs AOP | **-8◄** | **-8◄** | **-8◄** | **-8◄** | **-8◄** | **-8◄** | **-8◄** |
| **Dx Final Dash** | Apr 20 | 19 | 15 | 15 | 14 | 13 | 12 | 11 |
| | AOP | 13 | 10 | 10 | 9 | 8 | 7 | 6 |
| | vs AOP | **+6◄** | **+5◄** | **+5◄** | **+5◄** | **+5◄** | **+5◄** | **+5◄** |
| **GA Dx** | Apr 20 | 86 | 80 | 79 | 77 | 76 | 74 | 70 |
| | AOP | 80 | 74 | 73 | 71 | 70 | 68 | 65 |
| | vs AOP | **+6◄** | **+6◄** | **+6◄** | **+6◄** | **+6◄** | **+6◄** | **+5◄** |
| **Critical Inv** | Apr 20 | 17 | 17 | 17 | 17 | 17 | 17 | 16 |
| | AOP | 21 | 21 | 21 | 21 | 21 | 21 | 20 |
| | vs AOP | -4 | -4 | -4 | -4 | -4 | -4 | -4 |
| **Safety (CR)** | Apr 20 | 132 | 140 | 142 | 141 | 158 | 156 | 155 |
| | AOP | 129 | 134 | 126 | 118 | 132 | 128 | 123 |
| | vs AOP | +3 | **+6◄** | **+16◄** | **+23◄** | **+26◄** | **+28◄** | **+32◄** |
| **Authenticity (MQ)** | Apr 20 | 94 | 86 | 84 | 82 | 80 | 78 | 76 |
| | AOP | 101 | 95 | 93 | 91 | 89 | 87 | 85 |
| | vs AOP | **-7◄** | **-9◄** | **-9◄** | **-9◄** | **-9◄** | **-9◄** | **-9◄** |
| **Compliance (CD)** | Apr 20 | 108 | 103 | 102 | 103 | 103 | 102 | 100 |
| | AOP | 112 | 111 | 109 | 111 | 115 | 115 | 113 |
| | vs AOP | -4 | **-8◄** | **-7◄** | **-8◄** | **-12◄** | **-13◄** | **-13◄** |
| **Fraud (Tx)** | Apr 20 | 154 | 160 | 160 | 159 | 162 | 165 | 164 |
| | AOP | 142 | 143 | 142 | 141 | 147 | 148 | 146 |
| | vs AOP | **+12◄** | **+17◄** | **+18◄** | **+18◄** | **+15◄** | **+17◄** | **+18◄** |

### Key In-House Findings (as of 4/20/26)

**WoW changes (Apr 20 vs Apr 13, ≥5 HC flagged ◄):**
- LOPO CDMX: 63→53 **-10◄** (returned to AOP=53; vs AOP went from +10◄ to 0)
- GA Dx CDMX: 80→86 **+6◄** (vs AOP jumped from +7◄ to +13◄)
- Compliance PHX: 99→108 **+9◄** (vs AOP improved from -13◄ to -4)

**Apr 20 Cur Wk vs AOP flags:**
- CDMX: T1 Cx **-18◄**, DDFB Chat **+14◄**, Elite Proj **+25◄**, T1 Dx **+7◄**, GA Dx **+13◄**
- CDMX Integrity: Safety **+7◄**, Authenticity **-15◄**, Fraud **+12◄**
- PHX: LOM **+11◄**, ACE **+5◄**, Sprint **-8◄**, GA Cx **-10◄**, DIP **-8◄**, GA Dx **+6◄**
- PHX Integrity: Authenticity **-7◄**, Fraud **+12◄**

**LABS row offset (Apr 20 lock file only):**
- LABS inserted at CDMX row 44 and PHX row 82
- All rows ≥ row 44 shifted +1 (CDMX LABS); rows ≥ row 82 shifted another +1 (PHX LABS)
- Total +2 offset for Integrity section rows (110+) vs AOP row numbers

### WoW Methodology (as of 4/20/26)
**IMPORTANT**: WoW = FM col from Apr 20 lock − FM col from Apr 13 lock (same week = Apr 20 week, different lock files).
Do NOT compare FL column from Apr 13 file vs FL column from Apr 6 file (old approach).
Apr 13 lock FM values (projection for Apr 20 week) are in `finance_wfm/data/2026-04-13.csv`.

> **Note**: Elite Project CDMX +37 vs AOP — verify scope/definition change.
> **Note**: ◄ = exceeds ±5 HC threshold. Compliance (=Community Defense) is PHX-only; CDMX row 118 = 0 (not staffed).
> **Excluded**: Mx (T1 Mx, T3 Mx, Mx Menu, Mx POS, Mx VIP, GA Mx, MxP/MSS), Drive, Drive LOF, Tablets, T3 Cx/Dx, Voice Ordering, NV, deprecated LOBs

### Integrity Name Mapping (Finance Tab → User Names)
**All 5 are INTEGRITY** — display them together in a separate integrity section, NOT with LOBs.
| User Name | Finance Tab Name | CDMX Row | PHX Row |
|---|---|---|---|
| Critical Investigations | Critical Investigations | 39 | 76 |
| Safety | Community Response (CR) | 116 | 110 |
| Authenticity | Marketplace Quality (MQ) | 117 | 111 |
| Compliance | Community Defense (CD) | 118 (=0, not staffed) | 112 |
| Fraud | Fraud (Tx) | 127 | 124 |

### Approved Display Format (user confirmed 4/14/26, H2 format updated 4/17/26 — memorize this!)
Two separate tables per site:
1. **Current Quarter table**: Cluster | Apr 13 | Apr 6 | WoW | AOP | vs AOP
2. **H2 Forecast table**: Three rows per cluster — Apr 13 row, AOP row, vs AOP row
   | Cluster | | Jul | Aug | Sep | Oct | Nov | Dec |
   | Safety PHX | Apr 13 | ... | ... | ... | ... | ... | ... |
   | | AOP | ... | ... | ... | ... | ... | ... |
   | | vs AOP | ... | ... | ... | ... | ... | ... |
   - AOP H2 values are frozen (set last year, never change)
   - Flag ◄ on vs AOP when |delta| ≥ 5 HC (in-house threshold)
User explicitly said "i like this view!!!! week and then H2" (4/14) and confirmed Option A two-rows-per-cluster for H2 (4/17)

### Cx Flag Explanations — confirmed by Travis Billings (4/14/26)

- **T1 Cx CDMX WoW H2 +11**: Added new class of 15 (a planned class of 25 was converted to Elite; only the net 15 were added — no other classes added)
- **DDFB Chat CDMX H2 +14–20**: Confirmed — increased volume + catering volume now routed there; two planned 6-person classes consolidated into one class of 12
- **LOPO CDMX +10 vs AOP**: Travis checking with Tere — no explanation yet
- **Elite Proj CDMX +37 vs AOP**: Confirmed — from **DashPass expansion** (not a scope error)
- **GA Cx CDMX +6**: Acknowledged; no additional detail
- **GA Cx PHX -9**: Confirmed — class cancelled back in Feb; see [#in-house-capacityplan-changes thread](https://doordash.slack.com/archives/C03FQTDQQ3F/p1770242261910939)

### Dx Flag Explanations — confirmed by Luis Medina (4/14/26)
- **T1 Dx CDMX +7 vs AOP**: Increase in target HC for 1/12 class (from 20 to 24) + training attrition projected higher than actual terms
- **GA Dx CDMX +5–9 vs AOP**: Attrition assumptions + class pockets + 5 internal transfers to GA Cx team
- **GA Dx PHX +8 vs AOP**: Two NH classes at beginning of 2026 where training attrition expected more terms than actual; production HC ended up similar to target HC
- **DIP PHX -8 vs AOP**: Placeholder class was cancelled in favor of LLM project integration (confirmed by Luis)

---

## BPO Planned FTE Comparison

### File IDs
| File | Spreadsheet ID | Notes |
|---|---|---|
| **AOP BPO** | `18S85YKLNf_5ASoJRZIBeoi9W6ZeyVXw840lqOmIK5SM` | Frozen baseline; dates start 01-05-26 in col D; 4/6/26 = col Q (index 13) |
| **Latest GCP copy (04-09)** | `1SBCzZhbgVD4eU0JYEIxE06odJECu_sDdwdj1qruRHRM` | Dates start 09-29-25 in col D; 4/6/26 = col AE (index 27); period index 30 |
| **Second-to-latest GCP (04-07)** | `1kJ8Z_s9E6Avk9hBaFsQMvx9IvXbxUSz9c_dSw0iwFn4` | Same structure as 04-09 copy |

### Row Structure
- **AOP BPO file**: Row 3 = weekly dates; Row 75 = "Production + Nesting + OT FTE" (Planned FTE total); Rows 76+ = queue-level Planned FTE
- **GCP cap plan copies**: Row 3 = weekly dates; Row 73 = "Production + Nesting + OT FTE" (Planned FTE total); Rows 74+ = queue-level (e.g., row 74 = Cx Specialized Pod Chat, row 75 = Cx Specialized Pod Phone)

### Period Definitions (GCP copies, 0-indexed from col D)
- 4/6/26 = index 30 (col AE)
- Q3 (7/6–9/28) = indices 40–52
- Q4 (10/5–12/28) = indices 53–65
- Zeros begin at index 66 (2027 weeks — stop averaging here)

### CONSUMER Planned FTE
| Period | AOP | Latest (04-09) | vs AOP | Second-to-Latest (04-07) | WoW |
|---|---:|---:|---:|---:|---:|
| 4/6/26 snapshot | 4,179 | 3,565 | **-614** | 3,599 | -34 |
| Full-yr avg (4/6–12/28) | 3,959 | 4,120 | +161 | 4,023 | +97 |
| Q3 avg (7/6–9/28) | 3,967 | 4,060 | +93 | 3,944 | +116 |
| Q4 avg (10/5–12/28) | 3,782 | 4,449 | **+667** | 4,265 | +184 |

### DASHER Planned FTE
| Period | AOP | Latest (04-09) | vs AOP | Second-to-Latest (04-07) | WoW |
|---|---:|---:|---:|---:|---:|
| 4/6/26 snapshot | 5,624 | 4,408 | **-1,216** | 4,410 | -2 |
| Full-yr avg (4/6–12/28) | 5,442 | 4,847 | -595 | 4,749 | +98 |
| Q3 avg (7/6–9/28) | 5,443 | 4,782 | **-661** | 4,666 | +116 |
| Q4 avg (10/5–12/28) | 5,282 | 5,247 | -35 | 5,080 | +167 |

### Combined Cx+Dx BPO Planned FTE
| Period | AOP | Latest (04-09) | vs AOP | WoW |
|---|---:|---:|---:|---:|
| 4/6/26 snapshot | 9,803 | 7,973 | **-1,830** | -36 |
| Full-yr avg | 9,401 | 8,967 | -434 | +195 |
| Q3 avg | 9,410 | 8,842 | -568 | +232 |
| Q4 avg | 9,064 | 9,696 | **+632** | +351 |

### Key BPO Findings
- **Currently -1,830 FTE below AOP** at 4/6 snapshot (Dasher -1,216, Consumer -614)
- **Plan ramps aggressively**: By Q4, current plan is +632 ABOVE AOP (holiday ramp)
- **WoW signal**: 04-09 file added ~+232 Q3 and +351 Q4 FTE vs 04-07 (capacity added between Apr 7–9)
- **Sunsetting queues**: Cx Whales Proactive Phone, Elite Cancel Prevention Proactive Outreach Phone, Dx Proactive Outreach Phone all zeroed out ~3/23/26 (not in AOP; GCP copies reflect this)
- **No internal snapshot date** in GCP files — filename is the only date identifier; verified 4/6/26 = col AE in both copies

**Why**: Yan tracks AOP vs current (in-house + BPO) to flag staffing gaps for Finance/WFM weekly sync.
**How to apply**: For weekly #support-finance-working-group message: read from local CSVs in `finance_wfm/data/` (NOT from Google Sheets directly — saves time). H2 monthly from EK:EV (cols 7-12 = Jul:Dec). Approved format: two tables (Current Quarter + H2 Forecast) per site; columns = Apr 20 | Apr 13 | WoW | AOP | vs AOP for current quarter; Apr 20 row, AOP row, vs AOP row for H2. Flag ◄ when |delta| ≥ 5 HC. Richard wants weekly current-quarter + monthly H2 averages (Jul–Dec).

---

## Finance <> WFM Channel Learnings

**Slack channel**: #support-finance-working-group (C06R99ART6D)
**Key people**: Richard Lam (Finance), Piero Termignone (WFM), Pamela Gapasin (WFM), Travis Billings (WFM), Gale Yamson (WFM), Dianara Purisima (BPO Ops)

### LOB Ownership for HC Questions (confirmed 2026-04-14)

When asking about HC gaps, route by LOB to the right WFM owner:

| Owner | LOBs |
|---|---|
| **Travis Billings** | All Cx LOBs (T1 Cx, DDFB Chat, LOPO, Elite Proj, GA Cx CDMX/PHX) + **LOM PHX, DDFB PHX, Sprint PHX** |
| **Gale Yamson** | T1 Dx, GA Dx CDMX, GA Dx PHX, DIP PHX — works with **Luis** on these |

**Source**: Gale replied to Apr 14 DM: *"let me run the first four with Luis; LOM, DDFB and Sprint are Travis's"*

**Why this matters**: LOM, DDFB PHX, Sprint PHX look like Dx/ops LOBs but are Travis's scope, not Gale's. Don't send those to Gale.

---

### 2026-04-14 — TTEC Drive Queues: GCP vs Billing Gap

**What happened**: Richard flagged that GCP showed 0 Production FTE for TTEC Drive queues in March, but TTEC still billed ~$194k that month:
- Drive Storefront Chat: 8.9k hrs / $104k
- Drive DSD: 3k hrs / $35k
- Drive SaaS Chat: 2.7k hrs / $32k
- Drive SaaS Phone: 17.6k hrs / $23k

**Root cause**: WFM intentionally removed TTEC Drive clusters from GCP for planning purposes (TTEC exit plan). Finance wasn't told — they assumed GCP = true capacity picture.

**Resolution**: Piero committed to flagging future Px exits to Finance proactively. Richard wants to add Px-Cluster-level task volume guardrails to catch billing vs GCP divergence earlier.

**Key learning for future work**:
- **GCP ≠ vendor billing** when a Px is in exit plan — WFM may zero out a vendor before they fully exit
- For cost forecasting, Richard's team needs vendor cap plans (not just GCP) during Px exits
- If you see a gap between GCP and Finance cost actuals, check whether any Px is in a quiet exit/wind-down
- **Always flag WFM plan changes (Px exit, scope removal) to Finance** — don't assume Finance will catch it from the GCP
