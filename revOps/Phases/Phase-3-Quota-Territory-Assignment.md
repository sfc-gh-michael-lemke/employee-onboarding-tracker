---
title: Phase 3 — Quota and Territory Assignment
phase: 3
type: phase-reference
tags: [phase, quota, territory, RevOps, SFDC]
owner: RevOps, Manager
systems: [Snowhouse, SFDC, Clari, Pigment]
created: 2026-06-26
---

# Phase 3 — Quota and Territory Assignment

**Goal:** Employee's quota is set, territory is locked in SFDC, and all downstream systems
(Clari, Pigment, Snowhouse) reflect the same values.
**Timing:** Complete within first 5 business days.

---

## Why This Phase Matters

Quota and territory are the foundation for attainment calculation. Any misalignment between
Snowhouse, SFDC, and CaptivateIQ will produce incorrect payout amounts. Territory errors
in SFDC cause account ownership to route incorrectly from Day 1.

---

## Task Reference

| Task | Owner | System | Description | Status Signal |
|------|-------|--------|-------------|---------------|
| Lock SFDC territory assignment | SalesOps / RevOps | Salesforce | Assign employee to correct territory segment; verify no overlapping territory conflicts | Territory appears under employee's SFDC profile |
| Set annual quota in Snowhouse | RevOps | Snowhouse | Enter approved quota amount, effective date, and fiscal year period | Snowhouse quota record matches offer letter amount |
| Confirm quota in Pigment | RevOps | Pigment | Verify Pigment roster reflects correct quota for planning purposes | Pigment shows employee with correct quota and territory |
| Sync quota to Clari | RevOps | Clari | Confirm Clari attainment tracking reflects Snowhouse quota | Clari quota field matches Snowhouse |
| Manager quota acknowledgment | Manager | Email / DocuSign | Manager reviews and approves the quota amount in writing | Signed acknowledgment email or document in record |
| Notify employee of quota | Comp Team | Email | Send employee formal quota communication with context on how it was set | Email logged in CaptivateIQ or onboarding thread |

---

## Quota Verification Query

Run this in Snowhouse to confirm quota is set correctly:

```sql
SELECT
  p.name,
  p.role_family,
  p.hire_date,
  p.territory_code,
  q.annual_quota,
  q.effective_date,
  q.fiscal_year
FROM payees p
JOIN quotas q ON q.payee_id = p.id
WHERE p.name = '{{employee_name}}'
  AND q.fiscal_year = '{{fiscal_year}}'
```

---

## Common Failure Modes

- Quota entered in wrong fiscal year → attainment calculation off for entire year
- Territory code mismatch between SFDC and Snowhouse → split credit disputes
- Pigment not updated → planning numbers diverge from actuals

---

## Dependencies

- [[Phase-2-Day1-Systems-Access]] must be complete (SFDC access required)
- Quota must be approved by manager before entry

---

## Related Notes

- [[Phase-4-Plan-Assignment-and-Acknowledgment]] — plan must reference correct quota
- [[Data-Sources/Snowhouse-Query-Reference]]
- [[SOPs/Onboarding-SOP-Index]]
