---
title: Archive
type: index
tags: [archive, closed-playbooks]
updated: 2026-06-26
---

# Archive

> Closed and completed employee onboarding playbooks.
> Move a playbook here when all six phases are confirmed complete and the employee's
> first payout has been validated.

---

## How to Archive a Playbook

1. Update the playbook frontmatter: set `status: complete`
2. Move the file from `Playbooks/` to `Archive/`
3. Add a row to the table below
4. Update the employee's People note: set `plan_status: complete`

---

## Archived Playbooks

```dataview
TABLE employee, role, hire_date, generated
FROM "Archive"
WHERE type = "playbook"
SORT hire_date DESC
```

---

## Related Notes

- [[Playbooks/]] — active playbooks
- [[Home/Dashboard|Dashboard]]
