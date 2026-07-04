---
title: Snowhouse Query Reference
type: reference
tags: [data-sources, snowhouse, SQL, queries]
updated: 2026-06-26
---

# Snowhouse Query Reference

> Curated SQL queries for verifying onboarding status at each phase.
> All queries are SELECT only. Substitute `{{employee_name}}` and `{{fiscal_year}}` with actual values.

---

## Identity Resolution

```sql
-- Verify payee record exists
SELECT
  id            AS payee_id,
  name,
  role_family,
  hire_date,
  territory_code,
  manager_id,
  active
FROM payees
WHERE name ILIKE '%{{employee_name}}%'
  AND active = TRUE;
```

---

## Quota Verification

```sql
-- Confirm quota is set correctly
SELECT
  p.name,
  p.role_family,
  q.annual_quota,
  q.effective_date,
  q.fiscal_year,
  q.period_type
FROM payees p
JOIN quotas q ON q.payee_id = p.id
WHERE p.name ILIKE '%{{employee_name}}%'
  AND q.fiscal_year = '{{fiscal_year}}';
```

---

## Plan Assignment Verification

```sql
-- Confirm plan is assigned and acknowledged
SELECT
  p.name,
  pa.plan_name,
  pa.plan_version,
  pa.assigned_date,
  pa.acknowledgment_status,
  pa.acknowledged_at,
  pa.effective_date
FROM payees p
JOIN plan_assignments pa ON pa.payee_id = p.id
WHERE p.name ILIKE '%{{employee_name}}%'
ORDER BY pa.assigned_date DESC
LIMIT 5;
```

---

## Attainment Calculation (First Payout Validation)

```sql
SELECT
  p.name,
  q.annual_quota,
  ROUND(q.annual_quota / 4, 2)                          AS quarterly_quota,
  SUM(o.amount)                                          AS booked_acv,
  ROUND(SUM(o.amount) / (q.annual_quota / 4) * 100, 2)  AS attainment_pct
FROM payees p
JOIN quotas q
  ON q.payee_id = p.id
  AND q.fiscal_year = '{{fiscal_year}}'
JOIN opportunities o
  ON o.owner_payee_id = p.id
  AND o.close_date BETWEEN '{{period_start}}' AND '{{period_end}}'
  AND o.stage = 'Closed Won'
WHERE p.name ILIKE '%{{employee_name}}%'
GROUP BY 1, 2, 3;
```

---

## Related Notes

- [[Data-Sources/Source-Index|Source Index]]
- [[Phases/Phase-3-Quota-Territory-Assignment]]
- [[Phases/Phase-5-First-Payroll-Validation]]
