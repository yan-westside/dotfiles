---
name: BPO Table Rules — LOPO Exclusion + H2 Format
description: Critical rules for BPO Slack table formatting — LOPO is in-house (exclude), H2 must have 4 rows per cluster (Lock/AOP/vs AOP int/vs AOP%)
type: feedback
---

## Rule 1: LOPO is IN-HOUSE — NEVER include in BPO tables

LOPO appears in the AOP GCP file under Consumer clusters but is an **in-house** cluster, not BPO.
It must be **excluded entirely** from all BPO Consumer FTE Billing and Consumer HC Total tables.

**Why:** Repeatedly included as AOP-only row (all dashes) — this is wrong. LOPO has no place in BPO comparison tables.

**How to apply:**
- Remove from `CONSUMER_FTE` and `CONSUMER_HC` lists in `build_bpo_tables.py`
- Do not include in any Slack BPO messages
- Do not show as "—" row — just omit entirely

---

## Rule 2: H2 Section MUST have 4 rows per cluster

The BPO H2 table must show: Lock values, AOP targets, integer gap, AND percentage gap.

**Format:**
```
ClusterName (Lock)      |  Jul |  Aug |  Sep |  Oct |  Nov |  Dec
ClusterName (AOP)       |  Jul |  Aug |  Sep |  Oct |  Nov |  Dec
ClusterName (vs AOP)    |   +N |   -N |   +N |   +N |   -N |   +N     ← integer diff, ◄ flag
ClusterName (vs AOP%)   | +5.0%| -3.2%| ...                           ← percentage diff, ◄ flag
```

**Why:** Integer gap alone gives no context on how large the miss is. Richard needs both absolute and % to judge severity.

**How to apply:**
- CSVs must include `aop_Jul..aop_Dec` columns (extracted from AOP GCP file using H2 index ranges)
- The Slack formatter must output 4 rows per cluster in H2: Lock / AOP / vs AOP (int) / vs AOP% (pct)
- AOP index ranges (0-based): Jul=27-30, Aug=31-35, Sep=36-39, Oct=40-43, Nov=44-48, Dec=49-51
- ◄ flag on both rows when |diff / AOP| >= 5%
