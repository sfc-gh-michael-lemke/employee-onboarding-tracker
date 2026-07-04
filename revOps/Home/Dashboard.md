---
title: RevOps Knowledge Vault
type: dashboard
tags: [home, dashboard, revops]
created: 2026-06-26
---

# RevOps — Commission Plan Onboarding Vault

> Central knowledge base for Snowflake RevOps Commission Plan Onboarding operations.
> Every employee playbook, phase definition, SOP, and data source reference lives here.

---

## Quick Navigation

| Area | Description |
|------|-------------|
| [[Agents/Commission-Onboarding-Agent\|Commission Onboarding Agent]] | Cortex Agent system prompt — run this to generate a playbook |
| [[Templates/Employee-Playbook-Template\|Employee Playbook Template]] | Blank template for a new onboarding engagement |
| [[Data-Sources/Source-Index\|Source Index]] | All connected data sources and their Cortex Search service names |
| [[SOPs/Onboarding-SOP-Index\|SOP Index]] | Process documentation imported from Confluence and Google Docs |

---

## Onboarding Phases

| Phase | Name | Owner | Status |
|-------|------|-------|--------|
| 1 | [[Phases/Phase-1-Pre-Day1-Setup\|Pre-Day-1 Setup]] | HR + RevOps | Reference |
| 2 | [[Phases/Phase-2-Day1-Systems-Access\|Day-1 Systems Access]] | IT + RevOps | Reference |
| 3 | [[Phases/Phase-3-Quota-Territory-Assignment\|Quota and Territory Assignment]] | RevOps | Reference |
| 4 | [[Phases/Phase-4-Plan-Assignment-and-Acknowledgment\|Plan Assignment and Acknowledgment]] | Comp Team | Reference |
| 5 | [[Phases/Phase-5-First-Payroll-Validation\|First Payroll Validation]] | Finance + RevOps | Reference |
| 6 | [[Phases/Phase-6-Ongoing-Compliance\|Ongoing Compliance]] | RevOps | Reference |

---

## Recent Playbooks

> Place generated employee playbooks in [[Playbooks/]] and link them here.

```dataview
TABLE employee, role, hire_date, status
FROM "Playbooks"
SORT hire_date DESC
LIMIT 10
```

---

## People Index

> One note per employee. Auto-linked from their playbook.

```dataview
TABLE role, manager, hire_date, plan_status
FROM "People"
SORT hire_date DESC
```

---

## Data Gap Tracker

> Tracks unresolved gaps surfaced by agent playbook runs.

```dataview
TABLE employee, gap_description, owner, date_flagged
FROM "Playbooks"
WHERE gap = true
SORT date_flagged DESC
```

---

## Vault Structure

```
revOps/
├── Home/               ← You are here
├── Agents/             ← Cortex Agent system prompts
├── Playbooks/          ← Generated per-employee onboarding playbooks
├── Phases/             ← Phase-by-phase process knowledge
├── Templates/          ← Blank templates for new notes
├── People/             ← One note per employee (identity + links)
├── SOPs/               ← Imported process docs from Confluence / Google Docs
├── Data-Sources/       ← Source index, query references, tool configs
└── Archive/            ← Completed and closed playbooks
```
