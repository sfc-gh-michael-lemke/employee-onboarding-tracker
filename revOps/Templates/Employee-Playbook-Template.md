---
title: "{{employee_name}} — Commission Onboarding Playbook"
type: playbook
employee: "{{employee_name}}"
role: "{{role}}"
hire_date: "{{hire_date}}"
manager: "{{manager_name}}"
territory: "{{territory}}"
plan_version: "{{plan_version}}"
status: in-progress
gap: false
generated: "{{generated_date}}"
tags: [playbook, onboarding, commission]
---

# {{employee_name}} — Commission Plan Onboarding Playbook

**Role:** {{role}}
**Hire Date:** {{hire_date}}
**Manager:** [[People/{{manager_name}}|{{manager_name}}]]
**Territory:** {{territory}}
**Commission Plan:** {{plan_version}}
**Generated:** {{generated_date}}

---

## Phase 1 — Pre-Day-1 Setup

*Reference: [[Phases/Phase-1-Pre-Day1-Setup]]*

| Task | Owner | Status | Notes | Source |
|------|-------|--------|-------|--------|
| Create SFDC user record | IT / SalesOps | | | |
| Create Snowhouse payee record | RevOps | | | |
| Assign commission plan version | Comp Team | | | |
| Set quota in Snowhouse | RevOps | | | |
| Push plan to CaptivateIQ | Comp Team | | | |
| Notify manager of checklist | RevOps | | | |

---

## Phase 2 — Day-1 Systems Access

*Reference: [[Phases/Phase-2-Day1-Systems-Access]]*

| Task | Owner | Status | Notes | Source |
|------|-------|--------|-------|--------|
| Confirm SFDC login | Manager | | | |
| Confirm CaptivateIQ login | RevOps / Comp | | | |
| Confirm Clari access | RevOps | | | |
| Confirm Snowhouse read access | RevOps | | | |
| Slack channel enrollment | Manager | | | |
| Send Day-1 orientation email | HR | | | |

---

## Phase 3 — Quota and Territory Assignment

*Reference: [[Phases/Phase-3-Quota-Territory-Assignment]]*

| Task | Owner | Status | Notes | Source |
|------|-------|--------|-------|--------|
| Lock SFDC territory assignment | SalesOps / RevOps | | | |
| Set annual quota in Snowhouse | RevOps | | | |
| Confirm quota in Pigment | RevOps | | | |
| Sync quota to Clari | RevOps | | | |
| Manager quota acknowledgment | Manager | | | |
| Notify employee of quota | Comp Team | | | |

---

## Phase 4 — Plan Assignment and Acknowledgment

*Reference: [[Phases/Phase-4-Plan-Assignment-and-Acknowledgment]]*

| Task | Owner | Status | Notes | Source |
|------|-------|--------|-------|--------|
| Verify plan visible in CaptivateIQ | Comp Team | | | |
| Employee reviews plan | Employee | | | |
| Employee e-signs plan | Employee | | | |
| RevOps confirms acknowledgment | RevOps | | | |
| Archive plan version | Comp Team | | | |
| Notify manager of completion | RevOps | | | |

---

## Phase 5 — First Payroll Validation

*Reference: [[Phases/Phase-5-First-Payroll-Validation]]*

| Task | Owner | Status | Notes | Source |
|------|-------|--------|-------|--------|
| Pull attainment report | RevOps | | | |
| Verify quota base in CaptivateIQ | Comp Team | | | |
| Confirm credit allocation | RevOps | | | |
| Calculate expected payout | Comp Team | | | |
| Finance approval | Finance | | | |
| Payroll submission | Finance | | | |
| Employee payout notification | Comp Team | | | |
| Employee confirmation | Employee | | | |

---

## Phase 6 — Ongoing Compliance

*Reference: [[Phases/Phase-6-Ongoing-Compliance]]*

| Task | Owner | Status | Notes | Source |
|------|-------|--------|-------|--------|
| Document change rationale | RevOps | | | |
| Update Snowhouse record | RevOps | | | |
| Update SFDC territory | SalesOps | | | |
| Push amended plan to CaptivateIQ | Comp Team | | | |
| Employee re-acknowledges | Employee | | | |
| Notify Finance | RevOps | | | |
| Archive prior plan version | Comp Team | | | |

---

## Data Gaps

| Task | Missing Source | Tool Queried | What Would Confirm It |
|------|---------------|--------------|----------------------|

---

## Source Index

| Type | Title / Subject | Date | Key Insight |
|------|----------------|------|-------------|

---

## Confidence Summary

| Phase | Confidence | Notes |
|-------|-----------|-------|
| Phase 1 — Pre-Day-1 Setup | | |
| Phase 2 — Day-1 Systems Access | | |
| Phase 3 — Quota and Territory | | |
| Phase 4 — Plan Acknowledgment | | |
| Phase 5 — First Payroll | | |
| Phase 6 — Ongoing Compliance | | |

---

## Recommendations

*(List any process gaps, missing steps, or deviations from standard SOP.)*

---

## Links

- [[People/{{employee_name}}|Employee Profile]]
- [[Data-Sources/Source-Index|Source Index]]
- [[SOPs/Onboarding-SOP-Index|SOP Index]]
