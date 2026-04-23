---
name: Queue Operational Patterns
description: LOB-specific IVR availability, cross-skill constraints, recurring patterns, and mitigation rules learned from 4/14–4/17 shift-leads and command center threads
type: project
---

Learned from reading all 57 threads in Yan's curation doc (4/14–4/17).

**Why:** These are non-obvious operational constraints. Wrong mitigations (e.g. suggesting IVR for DSD Phone) waste time. Digest should flag the right escalation path for each LOB.
**How to apply:** When surfacing a CIQ incident in digest, use the correct mitigation options for that LOB. Never suggest a mitigation that isn't available.

---

## IVR Availability by LOB

| LOB | IVR Available? | Notes |
|---|---|---|
| Dx DSD Phone | ❌ NO | Confirmed 4/16: "We currently do not have a IVR for this LOB" |
| Dasher Direct and Payments Phone | ✅ YES | Activated by Gerson De La Barrera (U09NBANNLR1) or Adena Glasper (UK7V3MHFX). Trigger: LWT >10min. |
| Dx Direct PPOD Phone | ✅ YES | Same LOB as "Dasher Direct and Payments Phone" in some threads. IVR activated/deactivated 4/17. |
| Dasher Direct and Payments (evening, 4/17) | ✅ YES | Agnes Manalo requests; Gerson activates. Deactivated when avail restored. |
| Consumer Cx Chat (HOOP reduction) | ✅ YES | IVR for overnight HOOP reduction; message routes to app/chat self-service |
| AU Dx/Cx Phone/Chat, CX Chat, NBV, CX VIP Chat | ✅ YES | Activated during 4/15 multi-system outage |
| DSD Phone (Drive) | ❌ NO | |

---

## Cross-Skill Constraints

| LOB | Movement Options | Constraint |
|---|---|---|
| Dx DSD Phone | Alorica ↔ Dx VIP (when not in AHOD) | Alorica structural gap: Required 54 vs ~42 actual at 8pm |
| Drive SaaS Phone | Drive SaaS McDonalds + SaaS Regular (Alorica dual-skilled) | No flex when all agents dual-skilled |
| CSS Chat Parcel (Drive) | Phone TMs NOT trained for chat | OT solicitation only |
| Dx VIP Phone | Cross-skill from Dx NLP possible | Only when NLP shifts haven't ended |
| SPA Dx Chat | SPA Dx IB Phone NOT trained for SPA Dx Chat | No cross-skill; OT only |
| AU Cx Chat | Dual-skill with CA Cx Chat | Activated 4/17 due to absenteeism |
| Sendbird CX DashPass VIP | "RP reverted" = routing profile temp change | Revert when CIQ cleared |

---

## Recurring CIQ Patterns

- **Dx DSD Phone**: Spikes 3× daily — early morning (~2am PT), midday, ~8pm. Structural Alorica understaffing. NOT isolated incidents.
- **CA Cx Chat HOOP**: Closes at 8PM. WFM flags 1hr and 3min before to clear CIQs. OOH cases need manual TL/SME closure.
- **Sendbird CX DashPass VIP**: Multiple RP-revert cycles throughout the day; 3+ spikes = normal pattern, not escalation-worthy.
- **Dx Web backlog**: Not a realtime queue. Can hit 500+ CIQs with 17hr LWT. Leverage high-availability windows to move TMs. Need 10+ reps to trim LWT.
- **SPA Dx Chat**: Structural overnight gap 4am–4:30am PST (scheduling gap, not ops failure).
- **NBV Phone**: Recurring evening spikes (7pm, 8pm, 9pm). Flag OOAs and high HT.
- **Cx SPod Phone**: Evening CIQ buildups. AHOD + flag OOAs.
- **ANZ (AU/NZ) Cx Chat**: Same TMs handle AU + NZ queues. Failing SLA when absenteeism hits. Buffer is minimal. Roxana Urena Ortega (U096ERPTTJS) monitors these and wants separate threads per queue in #cx-command-center.

---

## Known App/Tool Incidents → Queue Impact

- **Walgreens outage** → HRO Phone + DSD Phone spike. Walgreens reps confused about order handling. Escalation path: #urgent-escalations.
- **7-Eleven system down at Pasay site** → DSD Phone demand spike. 16 HCs impacted. Workaround: cancel order.
- **"Unable to accept/see orders in app" / "white screen after pickup"** → affects ALL US Dx Phone + Dx VIP + Spanish Dx simultaneously. Escalate to #urgent-escalations immediately.
- **4/15 multi-system outage** (THQ latency + Dx payments not showing + NBV auto-completing): IVR activated across AU Dx/Cx Phone/Chat, CX Chat, NBV, CX VIP Chat. Resolved 3:21AM PST.
- **THQ auto-solve after refresh** = expected ENG behavior (not a bug); no escalation needed.
- **Amazon Connect Aux change bug** (TaskUs) = LOLI BTS procedure; local IT fix. Classify as 🔧 TOOLS.

---

## Daily Operational Threads (Low Digest Priority)

- **Skill Change Request** threads: Open at SOD in every command center. RTAs submit CMP skill changes; WFM group (@S09HZ2S4Q83) executes. "LOLI" = log out/log in after skill refresh. Flag only if delays >4hrs or if a critical LOB skilling is blocked.
- **General Notification** threads: Mixed ops updates + tool/access issues. Read fully — Crimson profile reconfigs and SME provisioning requests land here.
- **AHOD Implementation** thread: Opened in #dx-command-center when AHOD declared. RTAs must log to Google Sheet (1w7Xax6y4muT1PSnCLns6rUD-7lOPGOuDFQtQg4uwdXg). Flag in digest if AHOD declared but form not referenced.

---

## CIQ Mitigation Checklist (Standard Steps by Priority)

1. AHOD activated (all offline activities cancelled)
2. Flag unauthorized AUX / OOAs to ops
3. Cancel coaching/meetings immediately
4. Solicit OT from vendor
5. Check cross-skill movements (see constraint table above)
6. IVR activation (if available for that LOB)
7. Escalate to #urgent-escalations if app-level issue confirmed

---

## Capacity Update Format (Sheila/Agnes standard)

When an LOB is in CIQ, WFM expects vendors to report:
- TCD (Top Call Drivers) — flag if unusual
- Abs% with drivers
- AHT% with drivers
- Movements (what's possible / roadblocks)
- Total OT takers (hours)
- AHOD Implementation form filled

---

## Mystery Queues in CMP (Not in Assembled)

- **Sendbird Cx Wesupport - DoorDash**: CMP only, no Assembled mapping. Mitigation: tap Sendbird-CX-CDMX.
- **Sendbird CX VXI(CMP)**: Appeared 4/15; unrecognized by WFM. Cases visible in CMP.
- **Sendbird - Cx - Australia / New Zealand**: Same TMs, low buffer. Failing SLA when absenteeism hits.

---

## Key People (Operational)

| Person | Role | Notes |
|---|---|---|
| Antonette Adame (U03N26ZCL2X) | #cx-command-center SOD lead | Opens General Notification + Skill Change Request threads; manages AHOD form |
| Piero Termignone (U0A062G08J0) | Phone HOOP Reduction experiment owner | Cx HOOP reduction started 4/14; 5%→25%→50% ramp |
| Roxana Urena Ortega (U096ERPTTJS) | Stakeholder monitoring ANZ Chat SLA | Wants separate per-queue threads in #cx-command-center |
| Adrian Armenta (U05PPAGKPRA) | WFM manager/director | In #shift-leads-private; asks about Dx queue movements |
| Gerson De La Barrera (U09NBANNLR1) | IVR activator | Activates/deactivates Dx Direct & Payments IVR |
| Adena Glasper (UK7V3MHFX) | IVR activator | Also activates Dx Direct & Payments IVR |
| Jun Pineda (U05764VB7L0) | Dx queue manager | Posts structured Dx Phone CIQ updates with SA/AHT/OT |
| Agnes Manalo (U03PX1C745Q) | Senior RTA | Manages Cx queues; posts full CIQ status updates |
| Sheila Pedrosa (U01J40JECSJ) | Shift lead | Tracks individual TM ACW; coordinates IVR; runs #shift-leads-private updates |
| Season San Diego (U03N28GEBDY) | WFM RTA | Cross-channel coordinator for Drive/Dx |
