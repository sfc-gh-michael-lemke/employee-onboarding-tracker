# Employee Onboarding Tracker

> Live onboarding progress tracking for RevOps new hires, built on Snowflake App Runtime.

A [Snowflake App Runtime](https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime) (Next.js) application deployed on Snowflake.

## What It Does

Tracks new hire onboarding progress through all phases from offer acceptance to CaptivateIQ commission configuration. Provides RevOps managers with a real-time view of each employee's onboarding status, surfacing blockers before they impact the first commission cycle.

## Business Value

| Benefit | Description |
|---------|-------------|
| Visibility | Real-time onboarding stage per employee |
| Blocker detection | Surfaces CiQ/SFDC config gaps before comp delays |
| Accountability | Timestamps each phase transition |
| Scale | Handles multiple concurrent new hires across global theaters |

## Architecture

| Component | Technology |
|-----------|------------|
| Frontend | Next.js (React) |
| Backend | Snowflake Node.js SDK |
| Auth | Caller's-rights token handling |
| Deployment | Snowflake App Runtime (SPCS) |
| Database | Snowflake (`APPS.PUBLIC`) |

## Deployment

Deployed on Snowflake as: `APPS.PUBLIC.EMPLOYEE_ONBOARDING_TRACKER`

```bash
snow app deploy
```

## Local Development

```bash
npm ci --include=dev
npm run dev
```

Reads Snowflake credentials from `~/.snowflake/config.toml` via the default CLI connection.

## Value Realization

This app replaces a manual tracking spreadsheet used by RevOps to monitor new hire onboarding. By surfacing CaptivateIQ and Salesforce configuration gaps in real time, it prevents commission payment delays — a significant source of new-hire friction and RevOps rework.
