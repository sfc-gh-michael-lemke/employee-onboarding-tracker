---
title: Source Index
type: reference
tags: [data-sources, cortex-search, tools, index]
updated: 2026-06-26
---

# Source Index

> Running log of all data sources connected to the Commission Onboarding Agent.
> The agent appends a new row to the Sources table below each time it runs a playbook.
> Do not manually delete rows — archive closed rows to the Archive section at the bottom.

---

## Cortex Search Services

| Service Name | Source System | Last Refresh | Status | Owner |
|---|---|---|---|---|
| `EMAIL_ONBOARDING_SEARCH` | Gmail / Outlook | — | Not yet configured | RevOps |
| `SLACK_REVOPS_SEARCH` | Slack (target channels) | — | Not yet configured | RevOps |
| `DOCS_SOP_SEARCH` | Google Docs / Confluence | — | Not yet configured | RevOps |

**Channels indexed by SLACK_REVOPS_SEARCH:**
- `#comp-questions`
- `#revops-ops`
- `#onboarding`
- `#field-ops`
- `#managers`

---

## Live Query Tools

| Tool Name | System | Type | Notes |
|-----------|--------|------|-------|
| `query_snowhouse` | Snowhouse (Snowflake) | Direct SQL | SELECT only; payees, quotas, plan_assignments tables |
| `query_captivateiq` | CaptivateIQ | REST API | Returns plan assignment, acknowledgment status, payout history |
| `query_salesforce` | Salesforce | REST API | Returns user record, territory, manager, opportunity ownership |

---

## Key Snowhouse Tables

| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `payees` | Employee identity and role family | `id` |
| `quotas` | Quota amounts by period | `payee_id, fiscal_year` |
| `plan_assignments` | Which plan version is assigned to which employee | `payee_id, plan_version` |
| `territories` | Territory code to name mapping | `territory_code` |
| `opportunities` | Closed-won bookings for attainment calculation | `sfdc_opportunity_id` |

---

## Sources Log

> This table is appended by the agent each time it runs. One row per source per playbook run.

| Run Date | Employee | Type | Title / Subject | Date of Source | Key Insight |
|----------|----------|------|----------------|----------------|-------------|

---

## Related Notes

- [[Agents/Commission-Onboarding-Agent|Agent Prompt]]
- [[SOPs/Onboarding-SOP-Index|SOP Index]]
- [[Home/Dashboard|Dashboard]]
