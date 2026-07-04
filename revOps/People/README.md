---
title: People Index
type: index
tags: [people, employees, index]
updated: 2026-06-26
---

# People Index

> One note per employee. Notes are created by the Commission Onboarding Agent when a
> new playbook is generated. You can also create a note manually using the
> [[Templates/Employee-Profile-Template|Employee Profile Template]].

---

## Active Employees

```dataview
TABLE role, manager, hire_date, plan_status
FROM "People"
WHERE type = "person"
SORT hire_date DESC
```

---

## How to Create a New Employee Note Manually

1. Duplicate [[Templates/Employee-Profile-Template|Employee-Profile-Template.md]]
2. Rename to `People/Employee-Name.md` (use hyphens for spaces)
3. Fill in all frontmatter fields
4. Link to the employee's playbook once generated

---

## Related Notes

- [[Home/Dashboard|Dashboard]]
- [[Templates/Employee-Profile-Template|Employee Profile Template]]
