---
name: In-House HC Plan vs AOP — Known Variances
description: Approved reasons for large plan vs AOP gaps in in-house HC tables
type: project
---

## Benchmark Week Rule
Always use the **latest lock week** as the benchmark (current week column = FM as of Apr 20 lock). When a new lock comes out, FM becomes the new benchmark. Use FM column from AOP file for vs AOP comparison.

## T1 Cx CDMX — 200+ HC starting Jul (vs AOP 165)
**Reason:** Approved DashPass upsell program
**How to apply:** When presenting T1 Cx CDMX H2 forecast, note the +35-57 vs AOP delta is intentional and approved (not a concern).

## Dx Variances vs AOP — Confirmed (as of Apr 20 lock)

### T1 Dx CDMX — ~+7 above AOP across H2
**Reason:** Class upsized for 1/12 (HC target 20 → 24); training attrition came in lower than projected, leaving more HC in production.

### GA Dx CDMX — +5 to +16 above AOP across H2
**Reason:** Attrition assumptions + class pockets; 5 internal transfers to GA Cx team.

### GA Dx PHX — ~+6 above AOP across H2
**Reason:** Two NH classes at start of 2026; training attrition came in lower than projected → production HC above AOP.

### DIP PHX — ~-8 below AOP across H2
**Reason:** Class cancelled for LLM project integration.

**How to apply:** When these variances appear in future weekly lock comparisons, cite these reasons rather than flagging as unexplained gaps.

## Integrity Finance Tab — Cluster Name Mappings (Finance Tab ↔ WFM names)
- **Community Response** = Safety
- **Marketplace Quality** = Authenticity
- **Community Defense** = Compliance
- **Critical Investigations** = PHX-only cluster; FM=17, flat at 17 across H2 (Apr 20 lock); sheet row 77
- T&S section rows 112–123; Fraud rows 126–130 (Apr 20 lock file)

## Integrity Variances vs AOP — Confirmed (as of Apr 20 lock)

### Safety (PHX + CDMX) — PHX ~+2, CDMX ~+5 vs AOP
**Reason:** Shifting HC from PHX to CDMX; overall combined is in line with / below AOP.
**How to apply:** Do not flag individually — look at combined PHX+CDMX total. If combined stays near AOP, the site shift is the explanation.

### Authenticity (PHX -9 ◄, CDMX -5 ◄ vs AOP) — Both below AOP
**Reason:** AHT improvement → fewer FTE needed to handle same volume.
**How to apply:** Below-AOP on Authenticity is intentional and favorable. Not a concern unless volume spikes.

### Compliance — CDMX = 0 in lock (all months), PHX has staffing
**Reason:** No in-house CDMX Compliance staffing planned. Community Defense CDMX = 0 across all months in lock. Confirmed correct — not a data error.
**How to apply:** CDMX Compliance = 0 is expected. No flag needed.

### Fraud — CDMX = 12 in lock (AOP = 0), PHX FM=154
**Reason:** CDMX Fraud ramp is driven by **Dx FP (False Positive) launch**. AOP = 0 (not planned in AOP at time of setting). Confirmed by user 2026-04-20.
**Lock values (Apr 20):** CDMX Fraud Tx FM=12, FL=12; PHX Fraud Tx FM=154, FL=155
**H2 (CDMX Fraud):** Jul=20, Aug=19, Sep=19, Oct=19, Nov=19, Dec=19
**How to apply:** Include in Notes (Part 2) as confirmed variance — not a question. Note text: "Fraud CDMX: new staffing driven by Dx FP (False Positive) launch — not in AOP. Monitoring."

**CRITICAL — Finance Tab row mapping (Apr 20 lock file `1y1F9NULA8WJJ-XfNuo9uhvSbp74-VZLnuOIWb2u9iMs`):**
- Sheet row 121 = **CDMX T&S Tx** (subtotal of Safety+Auth+Compliance CDMX). NOT Fraud.
- Sheet row 129 = **CDMX Fraud Tx** = 12 in Apr 20 lock ← use this for Fraud
- Sheet row 115 = **PHX T&S Tx** (subtotal). NOT Fraud.
- Sheet row 126 = **PHX Fraud Tx** = 154 in Apr 20 lock
- LABS inserted at row 82 (PHX) in Apr 20 file → rows below shift +1 vs earlier lock files

## General Rules — Questions vs Notes
- **Below AOP with no operational concern:** No need to ask questions. Applies to Compliance when below AOP.
- **Below AOP flag threshold (|diff| < 5 HC):** No need to flag or ask, even in H2, unless operationally significant.
