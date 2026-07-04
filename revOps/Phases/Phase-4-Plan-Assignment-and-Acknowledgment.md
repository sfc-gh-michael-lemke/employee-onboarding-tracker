---
title: Phase 4 — Plan Assignment and Acknowledgment
phase: 4
type: phase-reference
tags: [phase, commission-plan, acknowledgment, CaptivateIQ, compliance]
owner: Comp Team, Employee
systems: [CaptivateIQ, Email]
created: 2026-06-26
---

# Phase 4 — Plan Assignment and Acknowledgment

**Goal:** The commission plan is assigned in CaptivateIQ, the employee has read and
electronically signed it, and RevOps has confirmed receipt.
**Timing:** Employee must acknowledge within 5 business days of hire.

---

## Why This Phase Matters

An unacknowledged plan is a legal compliance gap. CaptivateIQ tracks the e-signature
date as the plan effective date for dispute resolution. If the employee disputes a
payout, the acknowledgment record is the primary source of truth.

---

## Task Reference

| Task | Owner | System | Description | Status Signal |
|------|-------|--------|-------------|---------------|
| Verify plan is visible in CaptivateIQ | Comp Team | CaptivateIQ | Confirm employee can see the plan document and quota summary in their CaptivateIQ dashboard | CaptivateIQ shows plan status as "Pending Acknowledgment" |
| Employee reviews plan | Employee | CaptivateIQ | Employee reads the full plan document and clicks through all sections | CaptivateIQ logs view time on each section |
| Employee e-signs plan | Employee | CaptivateIQ | Employee clicks Accept and completes the e-signature flow | CaptivateIQ status changes to "Acknowledged"; timestamp recorded |
| RevOps confirms acknowledgment | RevOps | CaptivateIQ | RevOps team verifies acknowledgment date is within compliance window | Acknowledgment date field is populated; status = "Acknowledged" |
| Archive plan version | Comp Team | CaptivateIQ / Vault | Archive the specific plan PDF version the employee signed in the [[Archive/]] folder | PDF stored in Archive with employee name and date in filename |
| Notify manager of completion | RevOps | Slack / Email | RevOps sends manager a confirmation that the plan is acknowledged | Message sent in manager's DM or onboarding Slack thread |

---

## Compliance Verification Query

```sql
SELECT
  e.name,
  p.plan_name,
  p.plan_version,
  p.acknowledgment_status,
  p.acknowledged_at,
  p.effective_date
FROM payees e
JOIN plan_assignments p ON p.payee_id = e.id
WHERE e.name = '{{employee_name}}'
```

Expected result: `acknowledgment_status = 'acknowledged'` and `acknowledged_at` is not null.

---

## Escalation Path

If employee has not acknowledged within 5 business days:
1. RevOps sends reminder email directly to employee
2. Manager notified on Day 6 via Slack
3. HR escalation on Day 10

---

## Dependencies

- [[Phase-3-Quota-Territory-Assignment]] must be complete — quota must appear in plan view
- CaptivateIQ plan push (from [[Phase-1-Pre-Day1-Setup]]) must be confirmed

---

## Related Notes

- [[Phase-5-First-Payroll-Validation]] — acknowledgment required before first payout
- [[Data-Sources/CaptivateIQ-Reference]]
- [[SOPs/Onboarding-SOP-Index]]
