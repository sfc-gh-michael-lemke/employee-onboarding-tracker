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
      },
      {
        key: "background_check",
        label: "Background check complete",
        description: "Background screening cleared through the vendor. No adverse actions pending.",
        links: [{ label: "Sterling (BGC)", url: "https://sterlingcheck.com", type: "tool" }],
      },
      {
        key: "system_access",
        label: "System access provisioned (email, Slack, SFDC)",
        description: "IT access ticket resolved. Confirm the rep can log into Salesforce, Slack, and corporate email.",
        links: [
          { label: "IT Helpdesk", url: "#it-helpdesk", type: "tool" },
          { label: "Salesforce", url: "https://snowflake.lightning.force.com", type: "tool" },
        ],
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
      },
      {
        key: "variable_components",
        label: "Variable components defined (OTE, split ratios)",
        description: "Set the OTE amount, base/variable split, and any overlay or kicker structures.",
        links: [
          { label: "Pigment — Quota Model", url: "https://app.pigment.com", type: "tool" },
          { label: "GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW", url: "#sf:SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW", type: "snowflake" },
        ],
      },
      {
        key: "comp_reviewed",
        label: "Comp plan reviewed by manager",
        description: "Manager has signed off on the comp structure before territory or quota work begins.",
        links: [],
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
      },
      {
        key: "account_list_confirmed",
        label: "Geo/account list confirmed",
        description: "Named account list reviewed and accurate in Salesforce. PSE assignments also updated.",
        links: [
          { label: "ETM.PSE_ACCOUNT_ASSIGNMENTS", url: "#sf:SALES_DEV.ETM.PSE_ACCOUNT_ASSIGNMENTS", type: "snowflake" },
        ],
      },
      {
        key: "conflicts_resolved",
        label: "Conflicts resolved with existing reps",
        description: "Any overlapping account ownership disputes resolved before quota is set.",
        links: [
          { label: "ETM.ETM_TERRITORY_DQ_CHECK", url: "#sf:SALES_DEV.ETM.ETM_TERRITORY_DQ_CHECK", type: "snowflake" },
        ],
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
      },
      {
        key: "ramp_schedule",
        label: "Quota ramp schedule set",
        description: "Monthly/quarterly ramp percentages entered. Typically 50/75/100 over 3 months for new hires.",
        links: [
          { label: "GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW", url: "#sf:SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_PLANNING_QUOTA_VW", type: "snowflake" },
        ],
      },
      {
        key: "quota_reviewed",
        label: "Quota reviewed by finance",
        description: "Finance ops has approved the quota against headcount plan and territory model.",
        links: [
          { label: "GKADAM_PLANNING.SNOWHOUSE_QUOTA_OPERATIONAL_VW", url: "#sf:SALES_DEV.GKADAM_PLANNING.SNOWHOUSE_QUOTA_OPERATIONAL_VW", type: "snowflake" },
        ],
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
      },
      {
        key: "letter_reviewed",
        label: "Letter reviewed by HR and manager",
        description: "Both HR and the hiring manager have reviewed for accuracy before sending.",
        links: [],
      },
      {
        key: "letter_sent",
        label: "Letter sent to employee",
        description: "DocuSign envelope sent to employee's personal email. Awaiting countersignature.",
        links: [{ label: "DocuSign", url: "https://www.docusign.com", type: "tool" }],
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
      },
      {
        key: "finance_approval",
        label: "Finance approval obtained",
        description: "Finance ops confirmed quota is within headcount budget and consistent with the annual plan.",
        links: [
          { label: "ATTAINMENT.FY25_FY24_SALES_ATTAINMENT", url: "#sf:SALES_DEV.ATTAINMENT.FY25_FY24_SALES_ATTAINMENT", type: "snowflake" },
        ],
      },
      {
        key: "hr_approval",
        label: "HR approval obtained",
        description: "HR confirmed total compensation is within band and compliant with local regulations.",
        links: [{ label: "Workday", url: "https://wd5.myworkday.com", type: "tool" }],
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
      },
      {
        key: "plan_published",
        label: "Comp plan published in CaptivateIQ",
        description: "The approved comp plan is live in CaptivateIQ and statements are generating correctly.",
        links: [
          { label: "CaptivateIQ — Plans", url: "https://app.captivateiq.com", type: "tool" },
          { label: "ATTAINMENT.CORE_USE_CASE_ATTAINMENT", url: "#sf:SALES_DEV.ATTAINMENT.CORE_USE_CASE_ATTAINMENT", type: "snowflake" },
        ],
      },
      {
        key: "employee_logged_in",
        label: "Employee has logged in and confirmed access",
        description: "Rep has logged into CaptivateIQ and acknowledged their plan. Screenshot or confirmation captured.",
        links: [{ label: "CaptivateIQ", url: "https://app.captivateiq.com", type: "tool" }],
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
