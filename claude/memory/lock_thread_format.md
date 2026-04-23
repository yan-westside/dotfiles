---
name: Weekly Lock Slack Thread Format
description: 3-part Slack thread format for in-house HC lock updates (Cx, Dx, Integrity) — confirmed from actual Apr 17 Cx thread
type: project
---

## 3-Part Thread Format (Confirmed from actual Apr 17 Cx thread)

**Part 1 — Parent message:**
```
:thread: *[LOB] In-House Apr 20 Lock*
```

**Part 2 — First thread reply (tables + note):**
- Open with `:memo: Note:` + one-line explanation for any approved/known variance (e.g., T1 Cx DashPass)
- `:bar_chart: *[LOB] In-House — Current Week (Apr 20 Lock)*`
- **One combined Current Quarter table** (CDMX + PHX rows together, site prefix in cluster name)
- `◄ = |diff| ≥ 5 HC` at the bottom
- `*H2 Forecast — Current Plan*` + flat table (all clusters × Jul–Dec)
- `*H2 Forecast — AOP*` + flat table (all clusters × Jul–Dec)

**Part 2 note rule:**
- Only include `:memo: Note:` for clusters with **confirmed** explanations — if not confirmed, put it in questions instead
- As of Apr 20 Cx lock: only T1 Cx (DashPass upsell) is confirmed. Everything else goes to questions.

**Part 3 — Second thread reply (questions + cc):**
- Intro line: "A few [LOB] clusters are flagged in the Apr 20 lock — can you help confirm the drivers?"
- One bullet per flagged cluster (|diff| ≥ 5 HC, **both above AND below AOP**, excluding already-confirmed ones)
- Format: `• *CLUSTER (SITE):* +N vs AOP — [short question: "what drove the jump?" / "still the same story?" / "what's driving the shortfall?"]`
- `cc: <@USER_ID|Name> <@USER_ID|Name>`

## CC Tags by LOB
- **Cx:** `<@U02CJU6819B|Travis Billings>` `<@U0A062G08J0|Piero Termignone>`
- **Dx:** `<@U01FX68PQMT>` and `<@U0A062G08J0>`
- **Integrity:** `<@U06J65KRVGU>` and `<@U04P16EM1GV>`

## Current Quarter Table Format
```
Cluster             | Apr 20 | Apr 13 | WoW  | AOP | vs AOP
--------------------|--------|--------|------|-----|-------
CDMX T1 Cx          |    147 |    147 |    0 | 165 |    -18
CDMX DDFB Chat      |     40 |     40 |    0 |  26 |  +14 ◄
...
PHX Social          |     21 |     21 |    0 |  19 |     +2
...
```
- CDMX rows first, then PHX rows — one combined table
- Site prefix in cluster name (e.g., "CDMX T1 Cx", "PHX LOM")
- `◄` flag inline after the vs AOP value (e.g., `+14 ◄`), not `+14◄`

## H2 Table Format
Two separate site tables (CDMX then PHX), each with alternating rows per cluster (Apr 20 / AOP / vs AOP):
```
**H2 Forecast — CDMX**
Cluster                | Jul | Aug | Sep | Oct | Nov | Dec
-----------------------|-----|-----|-----|-----|-----|----
T1 Cx (Apr 20)         | 207 | 216 | 222 | 222 | 222 | 222
T1 Cx (AOP)            | 165 | 165 | 165 | 165 | 165 | 165
T1 Cx (vs AOP)         |  +42|  +51|  +57|  +57|  +57|  +57
...

**H2 Forecast — PHX**
Cluster                | Jul | Aug | Sep | Oct | Nov | Dec
-----------------------|-----|-----|-----|-----|-----|----
Social (Apr 20)        |  19 |  19 |  18 |  18 |  17 |  16
Social (AOP)           |  17 |  17 |  16 |  16 |  15 |  14
Social (vs AOP)        |  +2 |  +2 |  +2 |  +2 |  +2 |  +2
...
```
- Cluster names in tables do NOT need site prefix (already split by table)
- All tables in triple-backtick code blocks (avoids `invalid_blocks` Slack error)
- Three rows per cluster: (Apr 20) / (AOP) / (vs AOP)

## Bold in Slack Messages
- `**text**` (double asterisk) = **bold** ✅ — confirmed by live test 2026-04-18
- `*text*` (single asterisk) = italic (NOT bold)
- `_text_` = also italic
Apply this to all cluster names and section headers in lock thread messages.

## Fraud Cluster Label
- Display as **"Fraud"** in Slack threads — drop the "(Tx)" suffix. Confirmed 2026-04-18.
- Internal CSVs still use "Fraud (Tx)" as cluster name for backward compatibility.

## Apr 20 Lock Status
- **Cx:** ✅ Already posted (Apr 17 thread)
- **Dx:** ✅ Already posted
- **Integrity:** ✅ Sent 2026-04-18 (DM D021SHPTP38) — corrected after CDMX Fraud data error fixed

## No Part 3 When All Flags Confirmed
If every flagged cluster (|diff| ≥ 5 HC) has a confirmed explanation, skip Part 3 entirely. Include all explanations as :memo: Notes in Part 2 instead. Only send Part 3 when there are clusters needing confirmation.

## Apr 20 Lock File Column Mapping
- **FM** = Apr 20 week (current/benchmark) = WK_46132
- **FL** = Apr 13 week (prior lock)
- **EK:EV** = Jan:Dec monthly; H2 = cols 7-12 (Jul:Dec)
- Apr 20 lock file ID: `1y1F9NULA8WJJ-XfNuo9uhvSbp74-VZLnuOIWb2u9iMs`
- AOP file ID: `1bFnQGXeRRCaOlY_XmzMKOJsOlxRIMlJKA9vtIm0ie28`

## Row Offset Note
LABS was added at row 44 (CDMX) and row 82 (PHX) in the Apr 20 file — clusters after those rows are +1 vs AOP file row positions.
