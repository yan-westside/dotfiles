---
name: Diane's WFM Capacity Planning Knowledge
description: WFM/BPO capacity planning terminology, formulas, and sizing frameworks from Diane's training doc (Google Doc 1OmKCdttlEnFOkNLL6FLpNTmEL_4PGhPsP95a4tOMs8w)
type: reference
---

# Diane's WFM Capacity Planning Knowledge

Source: [Google Doc](https://docs.google.com/document/d/1OmKCdttlEnFOkNLL6FLpNTmEL_4PGhPsP95a4tOMs8w/edit)

---

## Key Definitions

- **FTE** = Full Time Equivalent = **40 hours/week** (DoorDash WFM & Finance standard)
- **HC** = Headcount
- **LOB** = Line of Business = Cluster = Pod (interchangeable)
- **Capacity plan** = Staff plan = Partner file = WFP file (interchangeable)
- **HOOP** = Hours of Operation
- **Tx** = Trainee/agent headcount
- **Prod FTE Factor** = Shrinkage % = Planned FTE / Planned HC (YES, same as shrinkage)
- **Nesting FTE Factor** ≠ Shrinkage (vendors use nesting agenda hours, typically no out-of-office assumptions)

---

## Data Dictionary (BPO Staffing Summary Table)

| Column | Description |
|---|---|
| `DATE` | Covers 53 weeks for 2026 |
| `FORECAST_FLAG` | LOCKED / GUIDANCE / NOT RELEASED |
| `VENDOR` | Specific vendors |
| `COUNTRY` | Vendor site mapping |
| `REGION` | Vendor site mapping |
| `SITE` | Specific sites provided by vendors |
| `BILLING_QUEUE` | Billing mapping based on LOB (source: FSQ) |
| `LINE_OF_BUSINESS` | Naming convention used in capacity plan |
| `BILLING_TYPE` | How LOBs are billed |
| `CHANNEL` | Phone / Chat / Web |
| `CUSTOMER_TYPE` | Consumer, Dasher, or Merchant |
| `AUDIENCE` | Consumer, Dasher, Drive, Integrity |
| `LANGUAGE` | English / Spanish |
| `VOLUME_FCST` | Forecast volume used by WFM to calculate requirements |
| `AHT_FCST` | Forecast Average Handle Time per LOB |
| `PLANNED_HC` | Number of Tx in Production State |
| `NESTING_HC` | Number of Tx in Nesting State |
| `TRAINING_HC` | Number of Tx in Training State |
| `PLANNED_FTE` | FTEs in Production including any plotted OT hours |
| `NESTING_FTE` | FTEs in Nesting State |
| `PRODUCTION_FTE` | Planned FTE + Nesting FTE + Overtime |
| `PROD_FTE_FACTOR` | Planned FTE / Planned HC (= Shrinkage %) |
| `NESTING_FTE_FACTOR` | Nesting FTE / Nesting HC |
| `REQUIRED_FTES` | FTE requirement from Erlang or workload approach (source: capacity plan) |
| `REQUIRED_HRS` | Required FTEs × 40 hours |
| `NET_STAFF` | Over/Under FTEs |
| `VOLUME_CAPACITY` | Erlang/workload calc of vendor volume capacity based on Planned FTEs |
| `TOTAL_HEADCOUNT` | Total HC = Production + Nesting + Training |
| `MOVE_IN` | Total HC of Tx moving INTO the LOB |
| `MOVE_OUT` | Total HC of Tx moving OUT OF the LOB |

---

## Core Formulas

### FTE Requirements

**Workload:**
```
FTE Req = (Volume × AHT) / 3600 / Prod FTE STNDRD × (1 + Inflex%)
```

**Erlang Service Level:**
```
FTE Req = Agents(SLA, SV Time, CallsPerHR/HOOP, AHT) × HOOP / Prod FTE STNDRD × (1 + Inflex%)
```

**Erlang ASA:**
```
FTE Req = AgentsASA(ASA, (Locked Vol Fcst × Prod FTE STDRD) / HOOP, AHT Fcst) × HOOP × (1 + Schedule Inflex%)
```

**Erlang Service Level Fractional:**
```
FTE Req = FractionalAgents(SLA, SV Time, CallsPerHR/HOOP, AHT) × HOOP / Prod FTE STNDRD × (1 + Inflex%)
```

### Volume Capacity

**Workload:**
```
Volume Capacity = PRODUCTION_FTE × Prod FTE STNDRD × 3600 / AHT
```

**Erlang:**
```
Volume Capacity = CallCapacity((PRODUCTION_FTE × Prod FTE STNDRD) / HOOP, SVL, ServiceTime, AHT) × HOOP / (1 + Inflex%)
```

### Headcount & FTE Calculations

```
Production HC (Planned HC) = (Prev Week HC − Prev Week Forecast Attrition HC) + Move In + LOA In (Prod Wk1) − Move Out − LOA Out

Nesting HC = Nesting Wk1 + Nesting Wk2

Total HC = Production HC + Nesting HC + Training HC

Production FTE = (Production HC × Vendor Prod FTE STDRD × (1 − Shrinkage%)) / Prod FTE STDRD

Nesting FTE = (Nesting HC × Prod FTE STDRD × (1 − Nesting%)) / Prod FTE STDRD

Production + Nesting + OT FTE = Prod FTE + Nesting FTE + OT FTE

Productive Hours = (Prod + Nesting + OT FTE) × Prod FTE STDRD

OU% = (Prod + Nesting + OT FTE / FTE Req) − 1
```

---

## Sizing Question Frameworks

### Q1 — Erlang Service Level Approach
**Inputs:** HOOP = 98 hrs, SL Target = 95%, Service Time = 90s, Schedule Inflex = 17%

Key analyses this approach covers:
- OU% week over week
- AHT sensitivity (+10% → new requirement)
- New hire class timing recommendations
- Shrinkage seasonality (Apr, Jun, Jul, Sep, Nov, Dec +2% weekly)
- Attrition seasonality (Apr, Jun, Sep, Dec +2% monthly)
- HOOP change to 168 hrs (24/7)
- Inflex reduction from 17% → 10%
- Vendor-level requirement splits using Production FTE as basis
- Overstaffed LOB redeployment to understaffed LOB (same vendor/site, maintain ≥5% OU)
- New hire class planning: 2 weeks training + 2 weeks nesting, assume 1 HC fallout/week
- Vendor sunset planning + requirement redistribution
- Redeployment cost calculation

### Q2 — Workload Approach
**Inputs:** HOOP = 168 hrs (24/7), SL Target = 95%, Service Time = 24 hrs, Schedule Inflex = 0%

Key analyses this approach covers:
- OU% week over week
- New queue ramp modeling (e.g. +12,000 vol/week, AHT=400s)
- AHT glidepath: 500s launch → 20% improvement × 4 weeks → 400s target
- Weighted AHT (existing cluster + new queue)
- Cross-vendor FTE redistribution within same Audience
- Maximum volume capacity per vendor
- Volume distribution % by vendor
- Spreadsheet generation with all formulas for 53 weeks

**Spreadsheet formula set for Q2:**
- FTE Req (Workload)
- Volume Capacity (Workload)
- Production HC, Nesting HC, Total HC
- Production FTE, Nesting FTE, Production+Nesting+OT FTE
- Productive Hours
- OU%
- Locked Forecast (user-provided)

### Q3
*(Placeholder — no content in source doc as of 2026-04-17)*

---

## Notes on Attrition & HC Visibility

- Forecasted attrition % and HC are **not directly visible** in the raw data
- You can **infer** attrition rate from weekly HC changes + Move In/Move Out
- Move In/Move Out affect both current HC and implied attrition sizing
