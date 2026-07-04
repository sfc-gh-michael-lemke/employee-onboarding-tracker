---
title: CaptivateIQ Reference
type: reference
tags: [data-sources, captivateiq, commission, acknowledgment]
updated: 2026-06-26
---

# CaptivateIQ Reference

> Reference guide for the `query_captivateiq` agent tool and manual verification steps.

---

## Key Objects

| Object | Description |
|--------|-------------|
| Payee | The employee record in CaptivateIQ — maps to Snowhouse `payees.captivateiq_id` |
| Plan | The commission plan document assigned to a payee |
| Acknowledgment | The e-signature event that marks the plan as accepted |
| Statement | Monthly or quarterly payout summary sent to the employee |
| Incentive | Individual payout line item (e.g., attainment payout, accelerator) |

---

## API Tool Parameters

```yaml
tool: query_captivateiq
parameters:
  employee_id: string  # CaptivateIQ payee ID — from Snowhouse payees.captivateiq_id
```

---

## Expected Response Shape (Acknowledgment Check)

```json
{
  "payee_id": "...",
  "name": "...",
  "plan_name": "...",
  "plan_version": "...",
  "acknowledgment_status": "acknowledged | pending | not_assigned",
  "acknowledged_at": "2026-01-15T09:32:00Z",
  "effective_date": "2026-01-01",
  "quota": 1200000
}
```

---

## Acknowledgment Status Values

| Status | Meaning |
|--------|---------|
| `not_assigned` | No plan has been pushed to this employee — blocking issue |
| `pending` | Plan assigned but employee has not yet signed |
| `acknowledged` | Employee has e-signed the plan — compliant |

---

## Escalation Thresholds

| Days Since Hire | Action |
|----------------|--------|
| 1–5 | Normal — employee has review window |
| 6 | RevOps sends reminder email |
| 7 | Manager notified via Slack |
| 10+ | HR escalation |

---

## Related Notes

- [[Phases/Phase-4-Plan-Assignment-and-Acknowledgment]]
- [[Phases/Phase-5-First-Payroll-Validation]]
- [[Data-Sources/Source-Index]]
