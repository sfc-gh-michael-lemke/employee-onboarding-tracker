---
title: Phase 2 — Day-1 Systems Access
phase: 2
type: phase-reference
tags: [phase, day1, IT, onboarding]
owner: IT, RevOps, Manager
systems: [SFDC, CaptivateIQ, Clari, Snowhouse, Slack]
created: 2026-06-26
---

# Phase 2 — Day-1 Systems Access

**Goal:** Employee can log into all quota, pipeline, and compensation tools on their first day.
**Timing:** Day 1, during or before onboarding session.

---

## Why This Phase Matters

An employee who cannot see their quota or commission plan in CaptivateIQ cannot acknowledge
the plan — which is a legal and compliance requirement. Delayed access also affects pipeline
hygiene if the employee starts entering opportunities before their territory is locked.

---

## Task Reference

| Task | Owner | System | Description | Status Signal |
|------|-------|--------|-------------|---------------|
| Confirm SFDC login | Manager | Salesforce | Verify employee can log in with SSO and see correct territory | Employee submits first SFDC activity |
| Confirm CaptivateIQ login | RevOps / Comp | CaptivateIQ | Verify employee can access their compensation plan dashboard | CaptivateIQ shows last login date |
| Confirm Clari access | RevOps | Clari | Provision Clari seat and confirm forecast roll-up is linked to correct manager | Clari user appears in manager's team view |
| Confirm Snowhouse read access | RevOps | Snowhouse | Grant employee read access to their quota and attainment views | Employee can run quota self-service query |
| Slack channel enrollment | Manager | Slack | Add employee to relevant channels: #comp-questions, #field-ops, team channels | Employee appears in channel member list |
| Send Day-1 orientation email | HR | Email | HR sends onboarding email with links to all tools and the commission plan FAQ | Email logged in onboarding thread |

---

## Common Failure Modes

- SSO not propagated → employee cannot log into SFDC or CaptivateIQ on Day 1
- Clari seat not provisioned → employee invisible to manager in forecast roll-up
- Employee added to wrong Clari team → forecast attribution errors

---

## Dependencies

- [[Phase-1-Pre-Day1-Setup]] must be fully complete
- IT must have confirmed SSO provisioning before Day 1

---

## Related Notes

- [[Phase-1-Pre-Day1-Setup]] — upstream dependencies
- [[Phase-3-Quota-Territory-Assignment]] — next phase
- [[SOPs/Onboarding-SOP-Index]]
