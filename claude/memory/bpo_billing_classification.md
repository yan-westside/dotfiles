---
name: BPO Billing Classification — CPT vs FTE vs In-House
description: Which BPO queue clusters bill as CPT, FTE, or are in-house (skip from BPO); tech cost vendor mapping; open items to remind user
type: project
---

## ⚠️ CRITICAL: HC ≠ FTE — These Are Different Numbers

**HC (Headcount)** = Production + Nesting + OT headcount = **actual bodies on floor**, including agents in nesting/ramp who are not yet at full billing productivity.

**FTE (Full-Time Equivalent)** = billing FTE = **what the vendor charges** = productive agents only, excludes nesting ramp.

**HC ≥ FTE always.** The delta = nesting headcount still in ramp.

Confirmed examples (AOP, week of 4/20):
| Cluster | Tab | HC | FTE | Delta (nesting) |
|---|---|---|---|---|
| IDV Core | INTEGRITY | 358 | 290 | 68 |
| US Cx Chat | CONSUMER | 1,572 | 1,300 | 272 |
| Dx Tax Web | DASHER | 12 | 9 | 3 |

**Where to read in AOP GCP file:**
- FTE compact section: near top of each tab (CONSUMER ~rows 75–103, DASHER ~rows 75–103, INTEGRITY rows 116–191)
- HC compact section: further down (INTEGRITY rows 362–397; CONSUMER/DASHER HC compact TBD)
- Full detail rows: much further down (e.g., CONSUMER!S2617 = US Cx Chat HC; DASHER!S7237 = Dx Tax Web HC; INTEGRITY!S121 = C&R Holding Tank FTE; INTEGRITY!S2472 = C&R Holding Tank HC)

**For the BPO tables: always use the correct section for the metric being reported.**
- FTE Billing tables → read FTE compact section
- HC Total tables → read HC compact section

---

## Consumer BPO

### CPT Billing (12 clusters)
AU Cx Chat, AU Cx Phone, CA Cx Chat, CA Cx Phone, Cx Specialized Pod Chat, Cx Specialized Pod Phone,
Cx VIP Chat, Cx VIP Phone, Spanish Cx Chat, Spanish Cx Phone, US Cx Chat, US Cx Phone

### FTE Billing (7 clusters)
Cx Whales Proactive Phone, OTTL, Elite Cancel Prevention Proactive Outreach Phone,
French Chat, French Phone, Cx Local Advocates, Cx Non-Live Advocate

Notes:
- Cx Local Advocates and Cx Non-Live Advocate appear in AOP only — not in Apr 13 / Apr 6 lock files
- Cx Proactive Outreach DP Churn OHAR Phone — AOP only, status unconfirmed (likely sunset); open question in doc 18c4-EP-2nk8g4VcMNsMDYfplqu-1b55NQWzDVB1q0iU tab t.0

### In-House — Skip from BPO Tracking (9 clusters)
These appear in the BPO GCP file but map to in-house Partner File LOBs. Do NOT double-count.
- DDFB Phone & Web → PHX DDFB (in-house)
- DDFB Chat → CDMX DDFB Chat (in-house)
- ACE Web → PHX ACE (in-house)
- GA Cx Chat & Web → CDMX + PHX GA Cx (in-house)
- Social Web → PHX Social (in-house)
- Sprint Web → PHX Sprint (in-house)
- Visually Impaired Phone → PHX VI (in-house)
- Elite PO → in-house (confirmed 2026-04-18 via doc 18c4...)
- LOPO → in-house (confirmed 2026-04-20; tracked in Partner File CDMX row 6)

### ⚠️ Unconfirmed — Remind User (open questions added to doc 18c4... tab t.0)
- **Elite DR Chat** — BPO (CPT or FTE?) or in-house? Awaiting confirmation.
- **Elite DR Phone** — BPO (CPT or FTE?) or in-house? Awaiting confirmation.
- **Cx Recovery Pod** — all blank in GCP; likely skip entirely. Confirm.

---

## Dasher BPO

### CPT Billing (15 clusters)
AU Dx Chat, AU Dx Phone, CA Dx Chat, CA Dx Phone,
Dx Direct and Payment Chat, Dx Direct and Payment Phone,
Dx Non-Live Chat, Dx Non-Live Phone,
Dx VIP Chat, Dx VIP Phone,
Spanish Dx Chat, Spanish Dx Phone,
US DX Chat, US DX Phone,
Spanish Dx Payments Phone

### FTE Billing (5 clusters)
Dx Proactive Outreach Phone, Spanish Dx Escalations Chat, Spanish Dx Escalations Phone, Dx Tax Web
**Dx Reimbursement Pod** — NEW as of Apr 13 lock; will first appear in Apr 20 lock file. FTE billing. (confirmed 2026-04-18)

### In-House — Skip from BPO Tracking
DIP Web, Final Dashination Web, GA Dx Chat & Web, T3 Dx Web

---

## Integrity BPO

All 30 BPO Integrity clusters = **FTE billing**.
See integrity_hc_table.md for full cluster list and AOP row mappings.

## Integrity In-House (from Partner File / Finance Tab)
CDMX: Critical Inv, Safety (CR), Authenticity (MQ), Compliance (CD) = 0 in AOP, Fraud = 0 in AOP
PHX:  Critical Inv, Safety (CR), Authenticity (MQ), Compliance (CD), Fraud

**Naming rule**: Always display as **"Fraud"** — never "Fraud (Tx)". The "(Tx)" is the Finance Tab internal name only; never show it in tables or messages.

---

## Drive BPO
Classification paused — do not build table until confirmed with user.

---

## Technology Cost — Vendor Billing Name Mapping
Tech vendors (e.g., Sendbird) bill per-interaction or per-seat separately from FTE/CPT labor costs.
These billing names map to in-house LOBs as follows (confirmed via doc 18c4... tab t.0, 2026-04-18):

| Vendor Billing Name | Maps To In-House LOB |
|---|---|
| DDFB - Cx | DDFB |
| DDFB-Support | DDFB |
| Sendbird - Cx - DDFB T3 VIP - DoorDash (CMP) | DDFB Chat |
| Sendbird - Cx - 05 Elite T3 Inbound - DoorDash (CMP) | Elite Project |
| 0.5% Elite Consumers | Elite Project |
| Sendbird CX Dashpass VIP - DoorDash | Elite Project |
| Support - Visually impaired OP | Visually Impaired (VI) |
| Delphi_xp (LOM) | LOM |
| Drone (LABS) | Not in Partner File — LABS project (confirm if HC tracked) |
| CityHopper (LABS) | Not in Partner File — LABS project (confirm if HC tracked) |

**Why**: Richard needs to reconcile tech vendor billing with in-house LOBs for cost attribution in Finance <> WFM sync.

---

## ⚠️ Open Questions to Remind User (added to doc 18c4... tab t.0)
1. Elite DR Chat — BPO billing type or in-house?
2. Elite DR Phone — BPO billing type or in-house?
3. Cx Recovery Pod — skip entirely?
4. Cx Local Advocates / Cx Non-Live Advocate / Cx Proactive Outreach DP Churn OHAR Phone — sunset or H2 ramp?
5. LOPO CDMX +10 vs AOP — Travis/Tere update pending
6. Drone (LABS) / CityHopper (LABS) — should these be added to Partner File as tracked HC?
