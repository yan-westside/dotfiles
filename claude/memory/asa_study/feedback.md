---
name: ASA Study — User Feedback & Approach Corrections
description: Critical feedback from user on what to avoid and what to do in the ASA analysis
type: feedback
---

# What NOT to Do (Corrections from User)

## Analysis Approach
- **Don't analyze by queue cluster as the unit** — use wait time bins as the unit, then segment by cluster
- **Don't jump to experiment design** — get high quality findings first; experiment only if observational data is insufficient
- **Don't limit ASA direction to only increasing** — it can go both ways (tighten or relax), as long as finding is novel
- **Don't give generic recommendations** — all recommendations must be backed by real data with specific numbers
- **Why**: User explicitly said previous work was "bad quality — no results, no implication study"

## Finance Metrics
- **Don't limit to C&R only** — also include: defect ratio, 28D order frequency, reorder probability, abandoned rate
- **Don't stub or assume unavailability** — check Snowflake tables for what's actually there
- **Why**: Full picture requires all financial and behavioral metrics, not just one

## Visualizations
- **Don't create messy multi-panel charts** — clean, focused, one chart per insight
- **Why**: Previous 4-panel visualization was described as "super messy"

## Filtering
- **Always exclude integrity/fraud queues** — filter by customer_type IN ('Consumer','Dasher') AND case_origin IN ('Phone','Chat')
- **Why**: User flagged "Fraud Live RQ" showing up in previous results

## Results Format
- **Lead with results and numbers** — not methodology descriptions
- **Include specific implications**: "if we do X, DWR goes from A% to B%, C&R changes by $Z"
- **Fewer details, more findings** — previous report was too heavy on methodology, too light on insight
- **Why**: User said "you gave way too much details while so little on results"

# What TO Do (Validated Approaches)

## Segmentation
- Divide by 4 segments: Chat Cx, Chat Dx, Phone Cx, Phone Dx
- Use top 15 high-volume clusters (confirmed by user)
- Live clusters only

## ASA Study Objective (Revised)
- Goal: understand wait time distributions and identify levers to **center performance at 120 seconds**
- Distribution analysis: mean, median, skewness, std dev per cluster×segment
- Gap analysis: current center vs 120s target
- Constraint diagnosis: staffing, routing, demand patterns

## DWR Guardrail
- Target: ≥70% (negotiable by segment — ask user to confirm per segment floor)
- It's a guardrail, not the primary metric
