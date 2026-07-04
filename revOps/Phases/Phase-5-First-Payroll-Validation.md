---
title: Phase 5 — First Payroll Validation
phase: 5
type: phase-reference
tags: [phase, payroll, payout, validation, reconciliation]
owner: RevOps, Finance
systems: [CaptivateIQ, Snowhouse, Workday]
created: 2026-06-26
---

# Phase 5 — First Payroll Validation

**Goal:** Employee's first commission payout is accurate, reconciled, and processed on time.
**Timing:** End of the first full measurement period (typically end of month or quarter).

---

## Why This Phase Matters

First payroll errors are the most damaging to employee trust. An error in the first payout
signals systemic problems and creates a dispute backlog. Validating the first payout end-to-end
also verifies that all upstream phases completed correctly.

---

## Task Reference

| Task | Owner | System | Description | Status Signal |
|------|-------|--------|-------------|---------------|
| Pull attainment report | RevOps | Snowhouse | Run attainment calculation for the employee for the measurement period; compare to quota | Query returns non-null attainment pct |
| Verify quota base in CaptivateIQ | Comp Team | CaptivateIQ | Confirm CaptivateIQ is using the correct quota as the denominator for attainment | CaptivateIQ quota field = Snowhouse quota record |
| Confirm credit allocation | RevOps | SFDC / Snowhouse | Verify all opportunities closed during the period are credited to the correct employee | No unattributed or misattributed closed-won opps |
| Calculate expected payout | Comp Team | CaptivateIQ | Run CaptivateIQ payout calculation; compare to manual model | Delta < $1 between CaptivateIQ and manual model |
| Finance approval | Finance | Workday | Finance signs off on the payout amount before submission to payroll | Finance approval email or Workday approval record |
| Payroll submission | Finance | Workday | Payout submitted to payroll for processing in correct pay period | Workday status = "Submitted" |
| Employee payout notification | Comp Team | Email | Employee receives payout summary email from CaptivateIQ | CaptivateIQ statement delivery confirmed |
| Employee confirmation | Employee | CaptivateIQ | Employee reviews statement and raises any disputes within review window | No open dispute after window closes |

---

## Reconciliation Query

```sql
SELECT
  p.name,
  q.annual_quota,
  q.annual_quota / 4 AS quarterly_quota,
  SUM(o.amount) AS booked_acv,
  ROUND(SUM(o.amount) / (q.annual_quota / 4) * 100, 2) AS attainment_pct
FROM payees p
JOIN quotas q ON q.payee_id = p.id
JOIN opportunities o ON o.owner_id = p.sfdc_user_id
  AND o.close_date BETWEEN '{{period_start}}' AND '{{period_end}}'
  AND o.stage = 'Closed Won'
WHERE p.name = '{{employee_name}}'
GROUP BY 1, 2, 3
```

---

## Common Failure Modes

- Quota period mismatch → attainment denominator is wrong
- Opportunities credited to old owner after territory change
- CaptivateIQ and Snowhouse quota out of sync → payout calculated on wrong base

---

## Dependencies

- [[Phase-4-Plan-Assignment-and-Acknowledgment]] — acknowledgment required before payout
- All opportunities from the period must be closed and attributed before calculation

---

## Related Notes

- [[Phase-6-Ongoing-Compliance]] — what happens after this
- [[Data-Sources/Snowhouse-Query-Reference]]
- [[Data-Sources/CaptivateIQ-Reference]]
