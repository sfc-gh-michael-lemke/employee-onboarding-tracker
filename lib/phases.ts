export interface Link {
  label: string
  url: string
  type: "tool" | "snowflake" | "doc"
}

export interface ChecklistItem {
  key: string
  label: string
  description?: string
  links?: Link[]
  suggestedQuery?: string
}

export interface Phase {
  key: string
  label: string
  description: string
  links?: Link[]
  items: ChecklistItem[]
}

export const PHASES: Phase[] = [
  {
    key: "new_hire",
    label: "New Hire",
    description: "Confirm all administrative prerequisites are in place before any comp or territory work begins.",
    links: [
      { label: "Workday (HR)", url: "https://wd5.myworkday.com", type: "tool" },
      { label: "IT Onboarding Portal", url: "#it-onboarding", type: "tool" },
    ],
    items: [
      {
        key: "offer_accepted",
        label: "Offer accepted and countersigned",
        description: "DocuSign packet sent and returned by candidate. Check Workday for signed document.",
        links: [{ label: "DocuSign", url: "https://www.docusign.com", type: "tool" }],
        suggestedQuery: `-- Verify employee record exists in Snowflake (indicates HR has processed the hire)
SELECT SFDC_USER_NAME, ETM_ROLE, TERRITORY_NAME, IS_ACTIVE
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_USERS_VW
WHERE LOWER(TRIM(SFDC_USER_NAME)) = LOWER(':email')
LIMIT 1`,
      },
      {
        key: "background_check",
        label: "Background check complete",
        description: "Background screening cleared through the vendor. No adverse actions pending.",
        links: [{ label: "Sterling (BGC)", url: "https://sterlingcheck.com", type: "tool" }],
        suggestedQuery: `-- Verify background check is marked complete in the onboarding tracker
SELECT e.FULL_NAME, c.IS_CHECKED, c.CHECKED_AT
FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES e
JOIN TEMP.MLEMKE.ONBOARDING_CHECKLIST c ON c.EMPLOYEE_ID = e.ID
WHERE LOWER(TRIM(e.EMAIL)) = LOWER(':email')
  AND c.PHASE_KEY = 'new_hire'
  AND c.ITEM_KEY  = 'background_check'`,
      },
      {
        key: "system_access",
        label: "System access provisioned (email, Slack, SFDC)",
        description: "IT access ticket resolved. Confirm the rep can log into Salesforce, Slack, and corporate email.",
        links: [
          { label: "IT Helpdesk", url: "#it-helpdesk", type: "tool" },
          { label: "Salesforce", url: "https://snowflake.lightning.force.com", type: "tool" },
        ],
        suggestedQuery: `-- Check that rep has at least one active territory association in SFDC (confirms SFDC access)
SELECT SFDC_USER_NAME, ETM_ROLE, TERRITORY_NAME, TERRITORY_TYPE, IS_ACTIVE,
       START_DATE_FOR_ASSOCIATION
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_USERS_VW
WHERE LOWER(TRIM(SFDC_USER_NAME)) = LOWER(':email')
  AND IS_ACTIVE = TRUE
ORDER BY TERRITORY_TYPE`,
      },
    ],
  },
  {
    key: "establish_comp_plan",
    label: "Establish Comp Plan",
    description: "Define the compensation structure — OTE split, variable components, and any accelerators. Source of truth is Pigment.",
    links: [
      { label: "Pigment Planning", url: "https://app.pigment.com", type: "tool" },
      { label: "ATTAINMENT.BOOKINGS_COMP_NEUTRALITY", url: "#sf:SALES_DEV.ATTAINMENT.BOOKINGS_COMP_NEUTRALITY", type: "snowflake" },
    ],
    items: [
      {
        key: "template_selected",
        label: "Comp plan template selected",
        description: "Choose the correct plan template based on role (AE, SE, SDR, Specialist, etc.) in Pigment.",
        links: [{ label: "Pigment — Plan Templates", url: "https://app.pigment.com", type: "tool" }],
        suggestedQuery: `-- Verify a comp plan template has been assigned to the rep in Pigment
SELECT SDR_NAME, SDR_EMAIL, PLAN_NAME, PLAN_TYPE, COMP_TYPE, PLAN_MIX
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW
WHERE LOWER(TRIM(SDR_EMAIL)) = LOWER(':email')
  AND ACTIVE_COMP_RECORD = TRUE
  AND PLAN_NAME IS NOT NULL`,
      },
      {
        key: "variable_components",
        label: "Variable components defined (OTE, split ratios)",
        description: "Set the OTE amount, base/variable split, and any overlay or kicker structures.",
        links: [
          { label: "Pigment — Quota Model", url: "https://app.pigment.com", type: "tool" },
          { label: "GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW", url: "#sf:SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW", type: "snowflake" },
        ],
        suggestedQuery: `-- Confirm variable quota components (meeting, SQO, use-case) are set in Pigment
SELECT SDR_NAME, SDR_EMAIL,
       FULL_MEETINGS_QUOTA, ACTUAL_MEETING_QUOTA, M1_WEIGHT,
       FULL_SQO_QUOTA,      ACTUAL_SQO_QUOTA,     M2_WEIGHT,
       FULL_USE_CASE_QUOTA, ACTUAL_USE_CASE_QUOTA, M3_WEIGHT,
       IS_RAMPING, RAMPING_PERCENT
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW
WHERE LOWER(TRIM(SDR_EMAIL)) = LOWER(':email')
  AND ACTIVE_COMP_RECORD = TRUE`,
      },
      {
        key: "comp_reviewed",
        label: "Comp plan reviewed by manager",
        description: "Manager has signed off on the comp structure before territory or quota work begins.",
        links: [],
        suggestedQuery: `-- Check COMP_APPROVED flag in Pigment (set by manager during review workflow)
SELECT SDR_NAME, SDR_EMAIL, COMP_APPROVED, COMP_START_DATE,
       MANAGER_NAME, MANAGER_EMAIL
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW
WHERE LOWER(TRIM(SDR_EMAIL)) = LOWER(':email')
  AND ACTIVE_COMP_RECORD = TRUE`,
      },
    ],
  },
  {
    key: "configure_territory",
    label: "Configure Territory",
    description: "Assign the rep's named accounts, segment, and geo. Source of truth is the ETM (Enterprise Territory Model) in Salesforce/Anaplan.",
    links: [
      { label: "ETM.SFDC_TERRITORY_HIERARCHY", url: "#sf:SALES_DEV.ETM.SFDC_TERRITORY_HIERARCHY", type: "snowflake" },
      { label: "ETM.ANAPLAN_TERRITORY_CHANGE_LOG", url: "#sf:SALES_DEV.ETM.ANAPLAN_TERRITORY_CHANGE_LOG", type: "snowflake" },
      { label: "Salesforce Territory Mgmt", url: "https://snowflake.lightning.force.com", type: "tool" },
    ],
    items: [
      {
        key: "segment_assigned",
        label: "Territory segment assigned",
        description: "Rep is assigned to a territory node in Salesforce. Verify against the ETM hierarchy.",
        links: [
          { label: "ETM.SFDC_TERRITORY_HIERARCHY", url: "#sf:SALES_DEV.ETM.SFDC_TERRITORY_HIERARCHY", type: "snowflake" },
        ],
        suggestedQuery: `-- Verify rep has an active patch-level territory assignment in the ETM
SELECT u.SFDC_USER_NAME, u.ETM_ROLE,
       u.TERRITORY_NAME, u.TERRITORY_TYPE, u.IS_ACTIVE,
       th.PATCH, th.DISTRICT, th.REGION, th.THEATER, th.MARKET,
       u.START_DATE_FOR_ASSOCIATION
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_USERS_VW u
LEFT JOIN SALES_DEV.GKADAM_ETM.SFDC_TERRITORY_HIERARCHY th
  ON LOWER(th.NAME) = LOWER(u.TERRITORY_NAME)
 AND th.TERRITORY_TYPE = 'Patch'
WHERE LOWER(TRIM(u.SFDC_USER_NAME)) = LOWER(':email')
  AND u.IS_ACTIVE = TRUE
  AND u.TERRITORY_TYPE = 'Patch'`,
      },
      {
        key: "account_list_confirmed",
        label: "Geo/account list confirmed",
        description: "Named account list reviewed and accurate in Salesforce. PSE assignments also updated.",
        links: [
          { label: "ETM.PSE_ACCOUNT_ASSIGNMENTS", url: "#sf:SALES_DEV.ETM.PSE_ACCOUNT_ASSIGNMENTS", type: "snowflake" },
        ],
        suggestedQuery: `-- Compare Pigment territory vs SFDC territory to confirm they are aligned
SELECT
    p.SDR_NAME, p.SDR_EMAIL,
    p.DISTRICT  AS pig_district,  th.DISTRICT  AS sfdc_district,
    p.REGION    AS pig_region,    th.REGION    AS sfdc_region,
    p.THEATER   AS pig_theater,   th.THEATER   AS sfdc_theater,
    IFF(LOWER(p.DISTRICT) = LOWER(th.DISTRICT)
     AND LOWER(p.REGION)  = LOWER(th.REGION),  'MATCH', 'MISMATCH') AS alignment
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW p
JOIN SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_USERS_VW u
  ON LOWER(TRIM(u.SFDC_USER_NAME)) = LOWER(TRIM(p.SDR_EMAIL))
 AND u.IS_ACTIVE = TRUE AND u.TERRITORY_TYPE = 'Patch'
JOIN SALES_DEV.GKADAM_ETM.SFDC_TERRITORY_HIERARCHY th
  ON LOWER(th.NAME) = LOWER(u.TERRITORY_NAME) AND th.TERRITORY_TYPE = 'Patch'
WHERE LOWER(TRIM(p.SDR_EMAIL)) = LOWER(':email')
  AND p.ACTIVE_COMP_RECORD = TRUE`,
      },
      {
        key: "conflicts_resolved",
        label: "Conflicts resolved with existing reps",
        description: "Any overlapping account ownership disputes resolved before quota is set.",
        links: [
          { label: "ETM.ETM_TERRITORY_DQ_CHECK", url: "#sf:SALES_DEV.ETM.ETM_TERRITORY_DQ_CHECK", type: "snowflake" },
        ],
        suggestedQuery: `-- Check for overlapping territory flags on the rep's active assignments
SELECT u.SFDC_USER_NAME, u.TERRITORY_NAME, u.ETM_ROLE,
       u.OVERLAPPING_TERRITORY, u.OVERLAPPING_USER, u.OVERLAPPING_ROLES_ON_TERRITORY
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_USERS_VW u
WHERE LOWER(TRIM(u.SFDC_USER_NAME)) = LOWER(':email')
  AND u.IS_ACTIVE = TRUE
  AND (u.OVERLAPPING_TERRITORY = 1
    OR u.OVERLAPPING_USER      = 1
    OR u.OVERLAPPING_ROLES_ON_TERRITORY = 1)`,
      },
    ],
  },
  {
    key: "set_quota",
    label: "Set Quota",
    description: "Establish the rep's quota including ramp schedule. Source of truth is Pigment; operational view in Snowflake.",
    links: [
      { label: "Pigment — Quota Planning", url: "https://app.pigment.com", type: "tool" },
      { label: "GKADAM_PLANNING.SNOWHOUSE_QUOTA_OPERATIONAL_VW", url: "#sf:SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_QUOTA_OPERATIONAL_VW", type: "snowflake" },
      { label: "GKADAM_ETM.QUOTA_TERRITORY_HIERARCHY", url: "#sf:SALES_DEV.GKADAM_ETM.QUOTA_TERRITORY_HIERARCHY", type: "snowflake" },
    ],
    items: [
      {
        key: "quota_determined",
        label: "Quota amount determined",
        description: "Annual quota set in Pigment based on territory potential, segment, and role.",
        links: [
          { label: "GKADAM_PLANNING.SNOWHOUSE_QUARTERLY_TARGETS_VW", url: "#sf:SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_QUARTERLY_TARGETS_VW", type: "snowflake" },
        ],
        suggestedQuery: `-- Verify quota amounts are set in the operational quota view
SELECT *
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_QUOTA_OPERATIONAL_VW
WHERE LOWER(EMAIL) = LOWER(':email')
ORDER BY FISCAL_QUARTER DESC
LIMIT 8`,
      },
      {
        key: "ramp_schedule",
        label: "Quota ramp schedule set",
        description: "Monthly/quarterly ramp percentages entered. Typically 50/75/100 over 3 months for new hires.",
        links: [
          { label: "GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW", url: "#sf:SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW", type: "snowflake" },
        ],
        suggestedQuery: `-- Check ramp schedule is configured in Pigment (IS_RAMPING=true + RAMPING_PERCENT set)
SELECT SDR_NAME, SDR_EMAIL, IS_RAMPING, RAMPING_PERCENT,
       COMP_START_DATE, COMP_START_MONTH_CQ,
       ACTUAL_MEETING_QUOTA, ACTUAL_SQO_QUOTA
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW
WHERE LOWER(TRIM(SDR_EMAIL)) = LOWER(':email')
  AND ACTIVE_COMP_RECORD = TRUE`,
      },
      {
        key: "quota_reviewed",
        label: "Quota reviewed by finance",
        description: "Finance ops has approved the quota against headcount plan and territory model.",
        links: [
          { label: "GKADAM_PLANNING.SNOWHOUSE_QUOTA_OPERATIONAL_VW", url: "#sf:SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_QUOTA_OPERATIONAL_VW", type: "snowflake" },
        ],
        suggestedQuery: `-- Check planning quota vs operational quota for consistency (finance sign-off indicator)
SELECT *
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW
WHERE LOWER(EMAIL) = LOWER(':email')
ORDER BY FISCAL_QUARTER DESC
LIMIT 8`,
      },
    ],
  },
  {
    key: "issue_letter",
    label: "Issue Letter",
    description: "Generate and deliver the compensation letter to the employee via DocuSign.",
    links: [
      { label: "DocuSign", url: "https://www.docusign.com", type: "tool" },
      { label: "CaptivateIQ — Letter Templates", url: "https://app.captivateiq.com", type: "tool" },
    ],
    items: [
      {
        key: "letter_generated",
        label: "Comp letter generated",
        description: "Letter produced from the approved template in CaptivateIQ or the comp letter generator.",
        links: [{ label: "CaptivateIQ", url: "https://app.captivateiq.com", type: "tool" }],
        suggestedQuery: `-- Confirm comp plan is approved (prerequisite for letter generation)
SELECT SDR_NAME, SDR_EMAIL, COMP_APPROVED, PLAN_NAME, COMP_TYPE,
       ACTUAL_MEETING_QUOTA, ACTUAL_SQO_QUOTA, COMP_START_DATE
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW
WHERE LOWER(TRIM(SDR_EMAIL)) = LOWER(':email')
  AND ACTIVE_COMP_RECORD = TRUE
  AND COMP_APPROVED = TRUE`,
      },
      {
        key: "letter_reviewed",
        label: "Letter reviewed by HR and manager",
        description: "Both HR and the hiring manager have reviewed for accuracy before sending.",
        links: [],
        suggestedQuery: `-- Check letter review is marked complete in the onboarding tracker
SELECT e.FULL_NAME, c.IS_CHECKED, c.CHECKED_AT, c.CHECKED_BY
FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES e
JOIN TEMP.MLEMKE.ONBOARDING_CHECKLIST c ON c.EMPLOYEE_ID = e.ID
WHERE LOWER(TRIM(e.EMAIL)) = LOWER(':email')
  AND c.PHASE_KEY = 'issue_letter'
  AND c.ITEM_KEY  = 'letter_reviewed'`,
      },
      {
        key: "letter_sent",
        label: "Letter sent to employee",
        description: "DocuSign envelope sent to employee's personal email. Awaiting countersignature.",
        links: [{ label: "DocuSign", url: "https://www.docusign.com", type: "tool" }],
        suggestedQuery: `-- Check letter_sent and full issue_letter phase completion in onboarding tracker
SELECT e.FULL_NAME,
       MAX(IFF(c.ITEM_KEY = 'letter_generated', c.IS_CHECKED, NULL)) AS generated,
       MAX(IFF(c.ITEM_KEY = 'letter_reviewed',  c.IS_CHECKED, NULL)) AS reviewed,
       MAX(IFF(c.ITEM_KEY = 'letter_sent',      c.IS_CHECKED, NULL)) AS sent
FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES e
JOIN TEMP.MLEMKE.ONBOARDING_CHECKLIST c ON c.EMPLOYEE_ID = e.ID
WHERE LOWER(TRIM(e.EMAIL)) = LOWER(':email')
  AND c.PHASE_KEY = 'issue_letter'
GROUP BY e.FULL_NAME`,
      },
    ],
  },
  {
    key: "approvals",
    label: "Approvals",
    description: "All required approvals collected before the plan is published in CaptivateIQ.",
    links: [],
    items: [
      {
        key: "manager_approval",
        label: "Manager approval obtained",
        description: "Hiring manager has approved the comp plan, territory, and quota in the approval workflow.",
        links: [],
        suggestedQuery: `-- Check COMP_APPROVED in Pigment (manager approval triggers this flag)
SELECT SDR_NAME, SDR_EMAIL, COMP_APPROVED, COMP_START_DATE,
       MANAGER_NAME, MANAGER_EMAIL, ROLLUP_NAME
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW
WHERE LOWER(TRIM(SDR_EMAIL)) = LOWER(':email')
  AND ACTIVE_COMP_RECORD = TRUE`,
      },
      {
        key: "finance_approval",
        label: "Finance approval obtained",
        description: "Finance ops confirmed quota is within headcount budget and consistent with the annual plan.",
        links: [
          { label: "ATTAINMENT.FY25_FY24_SALES_ATTAINMENT", url: "#sf:SALES_DEV.ATTAINMENT.FY25_FY24_SALES_ATTAINMENT", type: "snowflake" },
        ],
        suggestedQuery: `-- Cross-check planning quota vs operational quota (finance approval aligns these)
SELECT p.SDR_NAME, p.SDR_EMAIL,
       p.ACTUAL_MEETING_QUOTA AS pig_meeting_quota,
       p.ACTUAL_SQO_QUOTA     AS pig_sqo_quota,
       p.COMP_APPROVED
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW p
WHERE LOWER(TRIM(p.SDR_EMAIL)) = LOWER(':email')
  AND p.ACTIVE_COMP_RECORD = TRUE`,
      },
      {
        key: "hr_approval",
        label: "HR approval obtained",
        description: "HR confirmed total compensation is within band and compliant with local regulations.",
        links: [{ label: "Workday", url: "https://wd5.myworkday.com", type: "tool" }],
        suggestedQuery: `-- Verify HR approval by checking all approval-phase items in onboarding tracker
SELECT e.FULL_NAME,
       MAX(IFF(c.ITEM_KEY = 'manager_approval', c.IS_CHECKED, NULL)) AS manager_approved,
       MAX(IFF(c.ITEM_KEY = 'finance_approval', c.IS_CHECKED, NULL)) AS finance_approved,
       MAX(IFF(c.ITEM_KEY = 'hr_approval',      c.IS_CHECKED, NULL)) AS hr_approved
FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES e
JOIN TEMP.MLEMKE.ONBOARDING_CHECKLIST c ON c.EMPLOYEE_ID = e.ID
WHERE LOWER(TRIM(e.EMAIL)) = LOWER(':email')
  AND c.PHASE_KEY = 'approvals'
GROUP BY e.FULL_NAME`,
      },
    ],
  },
  {
    key: "configured_in_ciq",
    label: "Configured in CaptivateIQ",
    description: "Rep is fully set up in CaptivateIQ with the correct plan, so they can track their own attainment from day one.",
    links: [
      { label: "CaptivateIQ Admin", url: "https://app.captivateiq.com", type: "tool" },
      { label: "ATTAINMENT.CORE_USE_CASE_ATTAINMENT", url: "#sf:SALES_DEV.ATTAINMENT.CORE_USE_CASE_ATTAINMENT", type: "snowflake" },
    ],
    items: [
      {
        key: "employee_created",
        label: "Employee created in CaptivateIQ",
        description: "Rep's user account created in CaptivateIQ with correct email, role, and manager.",
        links: [{ label: "CaptivateIQ — Users", url: "https://app.captivateiq.com", type: "tool" }],
        suggestedQuery: `-- Check COMMISSIONS_PROCESSED flag in Pigment (set when CaptivateIQ employee record is live)
SELECT SDR_NAME, SDR_EMAIL, COMMISSIONS_PROCESSED, COMP_APPROVED,
       COMP_START_DATE, PLAN_NAME
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW
WHERE LOWER(TRIM(SDR_EMAIL)) = LOWER(':email')
  AND ACTIVE_COMP_RECORD = TRUE`,
      },
      {
        key: "plan_published",
        label: "Comp plan published in CaptivateIQ",
        description: "The approved comp plan is live in CaptivateIQ and statements are generating correctly.",
        links: [
          { label: "CaptivateIQ — Plans", url: "https://app.captivateiq.com", type: "tool" },
          { label: "ATTAINMENT.CORE_USE_CASE_ATTAINMENT", url: "#sf:SALES_DEV.ATTAINMENT.CORE_USE_CASE_ATTAINMENT", type: "snowflake" },
        ],
        suggestedQuery: `-- Confirm COMMISSIONS_PROCESSED = TRUE in Pigment (indicates plan is live in CIQ)
SELECT SDR_NAME, SDR_EMAIL, COMMISSIONS_PROCESSED,
       COMP_APPROVED, PLAN_NAME, COMP_START_DATE
FROM SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_FY26_SDR_ROSTER_VW
WHERE LOWER(TRIM(SDR_EMAIL)) = LOWER(':email')
  AND ACTIVE_COMP_RECORD = TRUE
  AND COMMISSIONS_PROCESSED = TRUE`,
      },
      {
        key: "employee_logged_in",
        label: "Employee has logged in and confirmed access",
        description: "Rep has logged into CaptivateIQ and acknowledged their plan. Screenshot or confirmation captured.",
        links: [{ label: "CaptivateIQ", url: "https://app.captivateiq.com", type: "tool" }],
        suggestedQuery: `-- Check full CaptivateIQ phase completion in onboarding tracker
SELECT e.FULL_NAME, e.EMAIL,
       MAX(IFF(c.ITEM_KEY = 'employee_created',  c.IS_CHECKED, NULL)) AS employee_created,
       MAX(IFF(c.ITEM_KEY = 'plan_published',     c.IS_CHECKED, NULL)) AS plan_published,
       MAX(IFF(c.ITEM_KEY = 'employee_logged_in', c.IS_CHECKED, NULL)) AS employee_logged_in
FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES e
JOIN TEMP.MLEMKE.ONBOARDING_CHECKLIST c ON c.EMPLOYEE_ID = e.ID
WHERE LOWER(TRIM(e.EMAIL)) = LOWER(':email')
  AND c.PHASE_KEY = 'configured_in_ciq'
GROUP BY e.FULL_NAME, e.EMAIL`,
      },
    ],
  },
]

export const TOTAL_ITEMS = PHASES.reduce((sum, p) => sum + p.items.length, 0)

export function getCurrentPhase(checklist: Record<string, Record<string, boolean>>): string {
  for (const phase of PHASES) {
    const allChecked = phase.items.every((item) => checklist[phase.key]?.[item.key] === true)
    if (!allChecked) return phase.key
  }
  return "done"
}
