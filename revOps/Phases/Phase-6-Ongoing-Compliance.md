---
title: Phase 6 — Ongoing Compliance
phase: 6
type: phase-reference
tags: [phase, compliance, amendments, quota-changes, ongoing]
owner: RevOps, Comp Team, Manager
systems: [Snowhouse, CaptivateIQ, Email]
created: 2026-06-26
---

# Phase 6 — Ongoing Compliance

**Goal:** Any quota changes, plan amendments, or territory adjustments made after initial
onboarding are documented, re-acknowledged, and versioned correctly.
**Timing:** Triggered by any change event throughout the fiscal year.

---

## Why This Phase Matters

Post-onboarding changes are the most common source of payout disputes. A quota change
without a re-acknowledgment is legally ambiguous. A territory change without SFDC update
causes attribution drift.

---

## Triggered By

- Mid-year quota ramp completion or adjustment
- Territory reassignment or account transfer
- Role change (promotion, transfer, realignment)
- Plan amendment (new product line, changed accelerator structure)

---

## Task Reference

| Task | Owner | System | Description | Status Signal |
|------|-------|--------|-------------|---------------|
| Document change rationale | RevOps | Snowhouse / Notes | Record the reason for the change with supporting approval (email, manager sign-off) | Change record linked to payee in Snowhouse |
| Update Snowhouse record | RevOps | Snowhouse | Update quota, effective date, and territory code with correct versioning | New record row with correct effective date; prior row not deleted |
| Update SFDC territory | SalesOps | Salesforce | Reflect any territory change in SFDC to prevent attribution mismatch | SFDC territory field matches Snowhouse territory code |
| Push amended plan to CaptivateIQ | Comp Team | CaptivateIQ | Create plan amendment in CaptivateIQ with updated quota or structure | CaptivateIQ shows amendment version as "Pending Acknowledgment" |
| Employee re-acknowledges | Employee | CaptivateIQ | Employee reviews and signs the plan amendment | CaptivateIQ acknowledgment timestamp on amendment version |
| Notify Finance | RevOps | Email | Finance notified of any quota change that affects the current period payout | Finance email confirmation logged |
| Archive prior plan version | Comp Team | Archive | Move superseded plan PDF to [[Archive/]] with date-stamped filename | Old version file present in Archive/ |

---

## Versioning Convention

Plan amendments in CaptivateIQ should follow this naming convention:

```
[Role Family]-[Fiscal Year]-v[Version].[Amendment Number]
Example: AE-FY26-v1.2
```

Snowhouse quota records should never be deleted — always insert a new row with an
effective date and leave prior rows intact for audit history.

---

## Common Failure Modes

- Quota change effective date set incorrectly → retroactive recalculation required
- SFDC territory not updated to match Snowhouse → split credit disputes
- Amendment not re-acknowledged → legally ambiguous payout period

---

## Related Notes

- [[Phase-4-Plan-Assignment-and-Acknowledgment]] — original acknowledgment pattern
- [[Phase-5-First-Payroll-Validation]] — reconciliation approach applies to amended periods
- [[Data-Sources/Snowhouse-Query-Reference]]
- [[Archive/README]]
