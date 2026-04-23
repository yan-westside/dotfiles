---
name: Digest Rules & Operational Standards
description: Standing rules for how to build and deliver Yan's daily digest — what to always check, auto-triggers, formatting
type: feedback
---

## Slack Message Formatting Rules
Certain formatting causes `invalid_blocks` errors when sending via MCP — avoid these:
- `---` (horizontal rule markdown) → triggers invalid_blocks; use blank lines or section headers instead
- URLs from `assembled-hq.slack.com` → triggers invalid_blocks; reference the channel name instead
- `*text*` renders as **italic** in Slack (standard markdown), NOT bold — use `**text**` for bold
- `[text](url)` markdown links work fine

**Why:** Discovered on first live digest send (Apr 10, 2026). Bold with `**text**`, emojis in headers, bullet points, and markdown links all render correctly. `---` dividers and assembled-hq URLs break blocks.

**How to apply:** Always send Slack digest as plain text with bare URLs. Test with a short message if uncertain.

---

## Queue Name Conventions
Always use the full, familiar queue name — not abbreviations or developer names.
- "Dx PPOD Phone" or "PPOD" → **Dasher Direct and Payments Phone** (PPOD is unfamiliar shorthand — never use it)
- "CX SPPOD Phone" → **Cx Specialized Phone** (SPPOD = Specialized Pod; use the name as it appears in the thread, not the channel header abbreviation)

**Why:** Yan flagged "Dx PPOD Phone" as a weird short that people won't recognize. Same rule applies to SPPOD — expanded to "Cx Specialized Phone" per Apr 13 thread content (Sheila Pedrosa's formal CIQ alert language).

**How to apply:** When referencing queues, use the display name as it appears in FSQ (NAME column), not the DEVELOPER_NAME or informal abbreviations.

---

## Day-of-Week Verification
Always verify the correct day of week before writing the digest header. Do not guess.

**Reference:** April 9, 2026 = **Thursday**. April 10, 2026 = **Friday**.

**How to apply:** Use `currentDate` from context or calculate from a known anchor. Never write "Wednesday" when it's Thursday.

---

## Auto-Trigger: Yan-Named Docs
Any Google Doc or Sheet that has Yan's name tagged (as editor, commenter, or in content) → automatically trigger a full summary + deep dive + cross-check against other related docs/sheets.

**Why:** Yan's own docs often contain the most important operational state (e.g., staffing outlook, network report) that won't surface in Slack alone.

**How to apply:** In every digest session, search recently modified docs for yan.jin@doordash.com as owner/editor. Read and summarize those proactively, not just when linked from Slack.

---

## Incident Handling: Always Check Resolution
If any incident is unresolved at time of digest building, always check:
1. Email (Gmail) for any OT or action thread
2. Slack channels mentioned in the incident thread
3. Related channels (e.g., #assembled-wfm, vendor-specific channels)
Before reporting — find resolution status AND ETA if still open.

**Why:** Yan called out that reporting "search rate limit blocked 181 agents" without checking resolution was unhelpful — it was already resolved by Han Yan with Alorica confirming green at 9:56pm EDT April 9.

**How to apply:** Never report an incident as "ongoing" without confirming current status. If resolved, note when + by whom. If unresolved, note last known ETA.

---

## Email Cross-Check for OT
Always check Yan's Gmail for "OT Opening" or "Overtime" threads before finalizing the digest.

**Why:** Yan personally authorizes OT for TaskUs and other BPOs via email. These authorizations won't appear in Slack and are critical operational decisions.

**How to apply:** Search Gmail for "OT Opening" and check the most recent thread state before including any OT-related item.

---

## Slack Links Required
Every digest item must include a direct Slack thread permalink — NOT a channel link.

**Why:** Yan needs to click through to see full context. A channel link (e.g. `archives/G016T3ZR86T`) is not sufficient — it dumps Yan at the channel, not the specific thread. Every item needs its own `p{timestamp}` permalink.

**How to apply:** Find the exact Slack thread permalink for every item. Format: `https://doordash.enterprise.slack.com/archives/{channel_id}/p{ts_no_dot}`. If a message is in a thread, use `?thread_ts=X&cid=Y`. Search for the specific message using `slack_search_public_and_private` with keywords from the item + `in:channel-name` + date filter. Do NOT reuse a channel link for multiple items.

---

## #in-house-capacityplan-changes Channel
This private channel (ID: C03FQTDQQ3F) is used for communicating any changes to in-house new hire class capacity plans — additions, cancellations, modifications.

**Why:** Yan asked to check this channel when the Authenticity (T&S MQ) NH class appeared to be cancelled — this is where class cancellation decisions are communicated by Training/Recruitment.

**How to apply:** When any in-house NH class cancellation, reduction, or rescheduling appears in digest context, check this channel for official notice and date.

---

## Key Document Reference Points
These locations are where specific metrics live — link directly when mentioning them:

- **Tx DWR (Team DWR, GSIO-wide)**: Integrity WBR doc `1oYB_SKzAbchcFldYkf0ut4EWGWYQuhi-FyPy5v3EUz4`, Company WBR Metrics table, row 8. "Tx" = Teammate (support agent), DWR = Did We Resolve.
- **Chargebacks AOP gap**: Same Integrity WBR doc, Integrity Workstream Updates section. Root cause = DV misfiring in Selective Contesting model.
- **ASA as H2 lever**: H2 GSIO Planning Readiness doc `17xEFoF84eZPQ0OKKqVxv8ruH2lCh1YRiodEzdUEYeb0` — Ken/Juan guidance explicitly names ASA reduction as one of 4 PI levers (alongside Tx DWR, AQA, transfer reduction).
- **PHX/CDMX T1 CX**: Integrity only has T1 CX at CDMX, NOT PHX. Any reference to PHX T1 CX is incorrect.

---

## Unix Timestamp Calculation for Slack (CRITICAL)
When using `slack_read_channel` with `oldest=` parameter, always calculate Unix timestamps correctly for 2026 dates. Off-by-one-year errors will silently return 2025 data.

**Reference values:**
- April 8, 2026 00:00 UTC = `1775606400`
- April 9, 2026 00:00 UTC = `1775692800`
- April 10, 2026 00:00 UTC = `1775779200`
- April 11, 2026 00:00 UTC = `1775865600`
- April 12, 2026 00:00 UTC = `1775952000`
- Formula: Each day = previous + 86400

**Why:** Used `1744070400` (April 8, **2025**) instead of `1775606400` (April 8, **2026**), causing all `slack_read_channel` calls to silently return year-old data. WFT error, Dx payment issue, In-house NH flags, fraud forecast miss, and MX Web surge items all appeared in the April 9, 2026 digest but were actually 2025 content.

**How to apply:** Before every `slack_read_channel` call, verify the `oldest` timestamp resolves to the correct year. Use `slack_search_public_and_private` with `after:YYYY-MM-DD` as a cross-check — search uses date strings, not Unix timestamps, so year errors are impossible.

---

## FSQ Weekly Update Rule (Every Friday)
Diego Ardura posts FSQ queue changes to `#xfn-support-ops-main-channel` (C0323CNPKUL) — timing varies (observed: Thursday 5pm PST for Apr 9 batch). The message includes:
- Count of updated queues (modifications → FSQ Updates Sigma workbook)
- Count of new queues (new creations → Google Sheet `1hC36rQ1FXz835IYkOAQ6U1Tunc591ycRSLiK1hgThEI`)
- Next batch date

**For the digest:** Read the message, then go into the Google Sheet and check what new queues were created that week (each request is a separate tab, most recent tab = newest request). Note queue name, BILLING_QUEUE, CUSTOMER_TYPE, and TARGET_WAIT_TIME for each new queue. For modifications, reference the FSQ Updates Sigma workbook.

**Why:** Yan explicitly asked to always check the sheet for "what has been updated or created" and flagged this as a weekly Friday AM task.

**How to apply:** Every Friday AM digest run, check #xfn-support-ops-main-channel for Diego's update and read the attached Google Sheet (`1F9m7x40esCfODAwwYTCn78OCBGRCZgni-JyIL_dCc7Q` — "2026 - Weekly Uploads Review - FSQ Table"). Read the `MM/DD/YY Updates` and `MM/DD/YY New` tabs for the current week.

**Output format** — always present FSQ changes as two sections with the following structure:

Section 1: Updates — group by requester, list queue name + change type (deactivated / field changed + what changed)
Section 2: New queues — table with columns: Queue | WFP DRI | OPS DRI | Notes (platform, SLA, cluster if notable)

Highlight if Yan (yan.jin@doordash.com) is listed as WFP DRI on any new queue — he may not be aware.
Note: 342,000s SLA = ~4-day back-office async review pattern.

---

## Assembled Weekly Queue Notification (Every Friday ~6pm EDT)
After Diego's FSQ batch is processed, **Dylan Anderson-Lee** posts to `#workforce-strategy-hub` (C08QH1UMDPU) listing net-new queues added to Assembled, grouped by WFP DRI. This is the Assembled-side action notification for schedulers (add to Tx profiles) and planners (set staffing parameters).

**Key rule:** Check #workforce-strategy-hub every Friday. If Yan Jin is listed as DRI for any new queues, create an action item: "Set staffing parameters for X new queues in Assembled before Monday."

**Why:** The Apr 9 FSQ batch resulted in 7 queues assigned to Yan Jin — Dylan's Apr 10 post was the action trigger, not Diego's original post.

---

## Cross-Digest Rule (Google/Gmail/Assembled reference Slack)
Every sub-digest after Slack (Gmail, Docs+Sheets, Assembled, Final Readout) must cross-reference the day's Slack digest action items and alerts:
- **Gmail:** Check if any open Slack action items have email threads (e.g., OT authorization, vendor follow-ups)
- **Docs+Sheets:** Check if any Slack-flagged incidents or queue changes have corresponding doc updates
- **Assembled:** Check if Slack-flagged staffing gaps or new queues appear in Assembled data
- **Final Readout:** Deduplicate — reference sub-digest items, don't repeat full summaries

**Why:** Yan asked "I want that daily digest to learn from the Slack digest too" (Apr 11 session).

---

## Cron Auto-Digest Limitations
Auto-digest cron (job ID: a042fc1d) fires at 9am local time daily but has hard limits:
- **Requires Claude Code to be open** — missed recurring fires are NOT caught up automatically
- **Auto-expires after 7 days** — re-create weekly
- If Claude Code is closed at 9am: Yan asks manually ("run today's digest") — Claude runs it on demand
- Cron prompt always shows draft preview before sending; never auto-sends without Yan's approval

---

## Command Center Thread Reading (CRITICAL)
`slack_read_channel` returns only thread *starters* (subject lines like "Thread on Dx Chat | April 12") — NOT the content inside threads. To get actual operational data (CIQ counts, LWT, SA%, AHOD moves, TCDs, OT solicited, resolution status), you MUST call `slack_read_thread` on each relevant thread after reading the channel.

**Why:** First live digest missed all command center operational content (Dx Chat active alert, DSD Phone absenteeism, Drive SaaS CIQs, Safety T1 Chat, CA Dx Chat OOH gap, Dx VIP Phone, Cx SPOD Phone) because only channel headers were read, not threads.

**How to apply:** For every command center channel, after reading the channel to get thread starters, read each operationally significant thread individually. Prioritize: any thread with "AHOD", "CIQ", "OT", active resolution threads, and threads with many replies (>5). Read the thread to extract: CIQ count, LWT, SA%, TCDs, AHOD moves, OT status, resolution time.

---

## Digest Title Format
- Do NOT include "Sub-digest N of 5" or "N of 5" in the digest title/header
- Do NOT include "(CORRECTED)" or similar amendment labels in digest titles
- Title format: "📅 [Day] [Month DD] — Slack Digest"

**Why:** Yan flagged these as unnecessary metadata in the title.

---

## Doc Cross-Check Rule
When summarizing a Google Doc in the digest:
1. Search for related docs/sheets that discuss the same topic
2. Note if there are conflicting numbers or additional context
3. Cross-reference Yan's own planning docs (staffing outlook, network report) for alignment

**Why:** Single-doc summaries miss the broader picture. Yan's staffing outlook doc often has forward-looking risks not in the weekly report.

---

## Tier 2 Scan — Required Every Run
Always check `#incident` and `#doordash-is-down` for S0/S1 incidents, even if no other Tier 2 channels are scanned. S0/S1 incidents belong in the 🔧 TOOLS section of the digest.

**Why:** Skipped entire Tier 2 scan on Apr 15 digest. No S0/S1 found that day, but the gap could miss real incidents on other days.

**How to apply:** After reading command center channels, always search `#incident` and `#doordash-is-down` with the date filter before finalizing TOOLS section.

---

## Vendor/BPO Metrics Must Include Timestamp
When reporting SA%, AHT%, or OT in the 👥 VENDOR/BPO section, always include the time of the snapshot (e.g., "as of 9:30pm EDT").

**Why:** Yan asked which time range the numbers applied to — point-in-time metrics without a timestamp are ambiguous.

**How to apply:** Pull from the most complete vendor update in #shift-leads-private (usually the evening summary), and label it with the time of that post.

---

## #shift-leads-private Is the Richest Operational Source
`G016T3ZR86T` — treat this as a **primary source** alongside command centers, not secondary.

Unlike command centers (which have CIQ alerts), #shift-leads-private has:
- **Vendor-level SA%/AHT%/OT commits** (Alorica 94% SA / TaskUs 142% SA — not blended totals)
- **IVR decisions** ("IVR disabled, queue cleared, staffing positive until 9pm")
- **Formal RTA update cadence** with named vendors and timestamps
- **Capacity experiments** announced here (e.g., Phone HOOP Reduction experiment)
- **Cross-queue movement decisions** with specific TM counts

**Why:** Discovered Apr 14 by reading Yan's thread curation doc. He bookmarked 4 of 11 Apr 14 links from this channel — more than any single command center.

**How to apply:** Read #shift-leads-private in full alongside command centers. Pull vendor-level SA%/AHT%/OT from here whenever available (not from command center thread estimates). For queues where both sources have data, #shift-leads-private wins.

---

## Yan's Thread Curation Doc (Pre-Digest Check)
**Doc ID:** `144E_qKMws_Sy-Ne5dUMKl2cVir_l8IRqAXcPwXwOgSI`

Yan manually pastes Slack thread links into this Google Doc throughout the day — it is his personal curation of "what matters today." Reading it before building the digest tells you exactly which threads Yan has flagged as important.

**Why:** Discovered Apr 14. When Yan has already read and bookmarked threads, those threads are guaranteed to be relevant. Missing them means the digest misses Yan's own priorities.

**How to apply:** At the start of every Slack sub-digest build, read this doc first. For each linked thread, read the thread content and include it in the digest. This supplements (does not replace) the standard channel scan.

---

## Digest Section Structure (UPDATED)
Always include these sections in order. Add only sections with content — omit empty ones.

1. **🔴 YOUR N ACTION ITEMS** — tasks requiring Yan's decision or follow-up
2. **🚨 OPERATIONAL ALERTS** — active/unresolved CIQ events with vendor breakdown
3. **📡 EXPERIMENTS & ROUTING CHANGES** — any new experiments, HOOP changes, IVR changes, NLP routing experiments starting or ending
4. **📦 QUEUE & CAPACITY** — queue movements, dual-skilling decisions, resolved CIQs
5. **👥 VENDOR/BPO** — vendor-level absenteeism, AHT drivers, OT commits by vendor
6. **✅ RESOLVED TODAY** — incidents that opened AND closed within the same day
7. **🔧 TOOLS** — platform issues (THQ bugs, Amazon Connect, S1 incidents, tool access gaps)

**Why:** Yan's curation doc revealed two missing sections: Experiments/Routing Changes (captured HOOP Reduction experiment) and non-CIQ tools issues (captured THQ auto-resolve bug). Prior digests had no home for these.

---

## Cross-Day Incident Continuity
When an incident was flagged as "open/unresolved" in a prior digest, check if it resurfaces in today's threads. If it does, note the continuity explicitly.

**Example:** Apr 13 parcel delivery incident (#urgent-escalations) → resurfaced in HRO Phone Apr 14 as a Walgreens driver issue connecting to multiple queues.

**Why:** Yan explicitly connected the Apr 13 parcel incident to Apr 14 HRO Phone by bookmarking both. The digest should make these connections visible.

**How to apply:** Before finalizing the digest, scan for mentions of prior-day incidents by keyword (Walgreens, parcel, order not delivered, etc.) across today's threads. If found, add a continuity note: "🔁 Carry-over from [date]: [incident summary] — now also affecting [queue]."

---

## HRO Phone Is In Scope
Drive HRO Phone is a high-signal queue that belongs in the digest.

**Why:** Apr 13 Drive HRO Phone had 50 replies and a Walgreens-driven volume spike — but was omitted from that day's digest. Apr 14 it resurfaced with the same root cause.

**How to apply:** When reading #drive-command-center, always include HRO Phone threads with >10 replies alongside DSD Phone and Drive SaaS Phone.

---

## Crimson/Savanna Access Restriction = Provisioning Gap, Not Staffing Gap
When PPOD Phone threads say "movement not feasible due to tool restriction" or "Crimson/Savanna access blocking movements" — this is a **provisioning gap**, not a capacity or scheduling gap. Agents may be trained and scheduled but still can't support PPOD without Crimson access.

**Why:** Apr 14 and Apr 15 both had Alorica and TaskUs explicitly cite Crimson/Savanna restriction as the reason no movement was possible on PPOD Phone — even when those agents were listed as cross-trained. The other session's Apr 15 digest identified this as a persistent pattern across the full day.

**How to apply:** When this appears in the digest, flag it in 🔧 TOOLS as a provisioning gap (not a staffing issue). Note it warrants a dedicated WFM + ops follow-up on tool provisioning. Do NOT list it only under VENDOR/BPO — it needs WFM action.

---

## NLP Agents Deployed to PPOD Need Crimson Profile Verification
When NLP agents are flexed to PPOD Phone, their Crimson profiles may have been reverted — even if they are skilled in the queue. Skilled ≠ Crimson-provisioned.

**Why:** Apr 15 Dx NLP → Mainline/VIP experiment: 73 Tx flexed to Dx Mainline/VIP but found their Crimson profiles had been reverted. They could not support PPOD even with skill access. Experiment was fully reverted at 11:21pm EDT.

**How to apply:** When an NLP routing experiment to PPOD is announced, flag in the digest as an experiment AND note the Crimson provisioning dependency. After the experiment, check if any Crimson profile reversions are reported.

---

## SPA Dx Chat Has a Known Structural Overnight Gap (4am–4:30am PST)
SPA Dx Chat is structurally understaffed during the 4:00–4:30am PST interval — only 1 HC committed. This causes predictable CIQ every morning.

**Why:** Kharl Ivan Oblena explicitly flagged Apr 14: "This is very likely to happen this week every start of day until 4:30 AM PST interval." This is a scheduling/forecast issue, not an ops execution gap.

**How to apply:** When SPA Dx Chat appears in morning threads with CIQ, note it as a "known structural gap" — do NOT frame it as a vendor failure. It is a WFM scheduling issue. Flag as a capacity/planning item, not an operational alert.

---

## Cx Canada Chat Has a HOOP — OOH Cases Need Manual Intervention
Cx Canada Chat operates within a HOOP (Hours of Operation). Cases that arrive outside the HOOP sit in queue and require a TL or SME to manually close them.

**Why:** Apr 14 thread showed "1 waiting case outside the HOOP of Cx Canada Chat" — Kharl had to request a TL/SME to close it manually.

**How to apply:** When "outside HOOP" appears for Cx Canada Chat in threads, flag it as an action item: "[Queue] has OOH case — TL/SME manual closure needed." Don't leave these as low-priority.

---

## Crimson Maintenance Notifications = Call Driver, Not Tool Outage
When Dashers see a "Crimson Scheduled Maintenance" notification in their app, they call PPOD Phone to inquire — even when there is no actual maintenance or outage. This is a recurring call driver that inflates PPOD Phone volume.

**Why:** Apr 14 PPOD Phone spike was partly driven by Dashers calling about a cosmetic maintenance notification. Maria Erika confirmed: "this is just only a call driver as dashers are inquiring details about the maintenance on their app notification."

**How to apply:** When PPOD Phone CIQ mentions "Crimson maintenance," classify as CALL DRIVER in the digest (not in 🔧 TOOLS). Do not flag as a Crimson outage. Note the call driver in 🚨 OPERATIONAL ALERTS alongside the CIQ data.

---

## HOOP Reduction Experiment — WFM Actions Are Specific
When a Phone HOOP Reduction experiment is running (consumer or Dasher), WFM and vendors have specific actions:
- **Do NOT** adjust schedules (need normal scheduling in case of revert)
- **Do** cross-skill available agents to Chat (Cx Chat preferred)
- **Do** offer VTO if occupancy drops below acceptable threshold
- **Monitor** overnight customer experience closely
- **Excluded queues** (not impacted): CA Consumer, AU Consumer, NZ, SaaS-Storefront, Drive SaaS McDonalds, Drive SaaS, Drive SaaS LCE, CSS Phone Pizza Hut, CSS Phone McDonalds Storefront, Starbucks

**Why:** Piero Termignone's Apr 14 announcement in #shift-leads-private had all of these instructions. If WFM adjusts schedules during the experiment, there will be no coverage buffer for revert scenarios.

**How to apply:** When a HOOP Reduction experiment appears in the digest under 📡 EXPERIMENTS, always include the WFM action note: "Do not adjust schedules; cross-skill to Chat; offer VTO if high availability."

---

## Multi-IVR Days on PPOD = Sustained Demand Problem
If PPOD Phone has 3+ IVR activations in a single day, this is a **sustained demand problem**, not a one-time spike. Track and report the count of IVR activations across the day.

**Why:** Apr 14 had 3 IVR activations; Apr 15 had 4+, with the queue still unresolved at 2am Apr 16. Each activation was treated independently in real-time, but the pattern reveals a systemic capacity gap.

**How to apply:** In the PPOD Phone thread, count IVR activations (look for "IVR activated/initiated" and "IVR deactivated/disabled" messages). If ≥3 in a day, flag as "Sustained demand pattern — N IVR activations." This is different from a single spike.

---

## DSD Phone Has a Known ~2am PT Overnight Spike Pattern
DSD Phone consistently spikes around 2:00–2:15am PT (5–5:15am EDT). This is a recurring pattern tied to overnight staffing deficits and Walgreens-related call drivers.

**Why:** Apr 13, Apr 14, and Apr 15 all showed DSD Phone CIQ starting at ~2am PT with 8 CIQs / 8-min LWT. Apr 14 and 15 both confirmed Walgreens + Red Card + Pickup/Dropoff as TCDs.

**How to apply:** When reading DSD Phone threads in morning digests, always check if there was an overnight spike. If the thread opened between midnight–3am PT, that is the overnight spike window. Note it separately from daytime spikes.

---

## OT Incentive Weekends — Flag as Action Item, Check Authorization
When Sheila Pedrosa (or other ops leads) posts a weekend OT incentive (e.g., "$3/hr for Apr 18–19, target 200hrs Sat / 100hrs Sun"), flag it as an 🔴 ACTION ITEM.

**Why:** Apr 15 other-session digest captured a weekend OT incentive for Dx Non-Live Phone (Apr 18–19) that the morning digest missed entirely. These are posted 2–3 days in advance and require WFM to confirm: (1) who authorized it — planning or ops?, (2) is the target HC reasonable given forecast?

**How to apply:** When reading #shift-leads-private and #dx-command-center, look for weekend OT incentive posts. Flag in the digest with the specific hours, target HC, and a note: "Confirm whether planning owns the authorization or if it came from ops."

---

## Digest Should Be Run EOD, Not Morning
Running the digest mid-morning (9am EDT) only captures overnight and early morning events. Full-day digests must be run at EOD (6–8pm EDT minimum) to capture the operational picture.

**Why:** Apr 15 morning digest missed: PPOD Phone 4 IVR activations through the day, Dx Chat evening CIQ, DSD Phone evening spike + 7-Eleven Pasay outage, Cx Specialized Phone evening CIQ, Dx NLP experiment reversal, OT incentive weekend announcement, and Crimson/Savanna provisioning pattern. The other session ran later and captured all of these.

**How to apply:** Default to EOD run. If user asks for a mid-day digest, note in the output: "Partial day — run again at EOD for full coverage." Never present a morning digest as the full daily picture.

---

## 7-Eleven Pasay Site Outages → DSD Phone → #urgent-escalations
When DSD Phone CIQ is driven by 7-Eleven merchant issues at the Pasay site (Philippines), the incident moves to #urgent-escalations. Agents see "7-Eleven system down" and the workaround is to cancel the order.

**Why:** Apr 15 digest (other session) captured "7-Eleven system down at Pasay site — 16 HC affected, workaround: cancel order" at 11:35pm EDT. This pattern is consistent with other merchant-side system outages that surface in DSD Phone.

**How to apply:** When DSD Phone has unusual TCDs mentioning 7-Eleven, McDonald's, or other specific merchants AND it goes to #urgent-escalations, include it in 🔧 TOOLS (not just 🚨 OPERATIONAL ALERTS) as a merchant system issue.

---

## THQ Auto-Solve = Expected ENG Behavior (Not a Bug to Escalate)
When cases auto-solve after a THQ refresh without agent tagging, this is **expected behavior** per an ENG client update — not a tool bug.

**Why:** Apr 14 #cx-command-center thread: clicking Solved now auto-resolves cases without proceeding to the tagging step. Vendors initially treated it as a bug. ENG confirmed: "this is expected to happen" per a client update that went live.

**How to apply:** If vendors report "THQ auto-solving cases without tagging," do NOT flag in 🔧 TOOLS as an outage. Note in the digest as a behavioral change: "THQ Solved button now auto-resolves without tagging step (ENG change, expected). No SLA impact per ENG." Separate this from actual THQ latency or tagging panel bugs.
