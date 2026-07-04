---
title: Phase 1 — Pre-Day-1 Setup
phase: 1
type: phase-reference
tags: [phase, pre-day1, HR, IT, RevOps]
owner: HR, IT, RevOps
systems: [Workday, SFDC, Snowhouse, CaptivateIQ]
created: 2026-06-26
---

# Phase 1 — Pre-Day-1 Setup

**Goal:** All systems provisioned and commission plan assigned before the employee's first day.
**Timing:** Initiated upon offer acceptance, completed by EOD on the hire date.

---

## Why This Phase Matters

If any task in Phase 1 is incomplete, the employee will begin work without a payee record,
without SFDC access, or without a plan assigned — which blocks accurate attribution of
pipeline from Day 1 and delays first-payroll eligibility.

---

## Task Reference

| Task | Owner | System | Description | Status Signal |
|------|-------|--------|-------------|---------------|
| Create SFDC user record | IT / SalesOps | Salesforce | Provision the new hire in SFDC with correct role, profile, and manager hierarchy | SFDC user ID exists and is active |
| Create Snowhouse payee record | RevOps | Snowhouse | Insert payee record with correct role family, hire date, manager, and territory code | `SELECT * FROM payees WHERE name = '...'` returns one active row |
| Assign commission plan version | Comp Team | Snowhouse / CaptivateIQ | Select the correct plan version based on role family and effective date; link to payee record | Plan version appears in CaptivateIQ under the employee's profile |
| Set quota in Snowhouse | RevOps | Snowhouse | Enter the approved annual quota amount; confirm quota period aligns with fiscal year | Quota record exists with correct amount and effective date |
| Push plan to CaptivateIQ | Comp Team | CaptivateIQ | Sync the plan assignment so the employee can view and sign on Day 1 | CaptivateIQ shows plan in "Pending Acknowledgment" state |
| Notify manager of checklist | RevOps | Email / Slack | Send manager the Day-1 checklist and confirm they have SFDC access to verify the new hire's territory | Manager replies confirming receipt |

---

## Common Failure Modes

- Payee record created with wrong role family → incorrect plan version assigned
- SFDC user created in wrong territory → pipeline attribution errors from Day 1
- Plan push to CaptivateIQ delayed past Day 1 → employee cannot acknowledge plan

---

## Dependencies

- Offer letter must be countersigned before provisioning begins
- Manager must be identified and active in SFDC before hierarchy can be set

---

## Related Notes

- [[Phase-2-Day1-Systems-Access]] — what happens next
- [[Phases/Phase-4-Plan-Assignment-and-Acknowledgment]] — acknowledgment tracked here
- [[SOPs/Onboarding-SOP-Index]] — full SOP from HR / Confluence
- [[Data-Sources/Snowhouse-Query-Reference]] — queries to verify payee and quota records
