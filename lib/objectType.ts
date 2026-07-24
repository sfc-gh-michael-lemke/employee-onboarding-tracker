export type ObjectType = "employee" | "process" | "role_type"

export interface ObjectTypeInfo {
  value: ObjectType
  label: string
  singular: string
  plural: string
  icon: string
  description: string
}

export const OBJECT_TYPES: ObjectTypeInfo[] = [
  {
    value: "employee",
    label: "Employee",
    singular: "Employee",
    plural: "Employees",
    icon: "👤",
    description: "Track people through an onboarding or enablement process",
  },
  {
    value: "process",
    label: "Process",
    singular: "Process",
    plural: "Processes",
    icon: "↻",
    description: "Track improvement workflows or operational processes",
  },
  {
    value: "role_type",
    label: "Role Type",
    singular: "Role Type",
    plural: "Role Types",
    icon: "🏷",
    description: "Track role types through a setup or configuration workflow",
  },
]

export function getObjectTypeInfo(type: string | undefined | null): ObjectTypeInfo {
  return OBJECT_TYPES.find((t) => t.value === type) ?? OBJECT_TYPES[0]
}
