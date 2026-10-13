export type UserGroupMetaGroupId = "IDENTITY" | "STATUS";

export interface UserGroupMetaFieldDef {
  path: "groupLabel" | "isActive";
  label: string;
  group: UserGroupMetaGroupId;
  type: "text" | "boolean";
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
  width?: "full" | "half" | "compact";
  helperText?: string;
}

export const USER_GROUP_FIELD_GROUPS: Array<{
  id: UserGroupMetaGroupId;
  title: string;
}> = [
  {
    id: "IDENTITY",
    title: "Group Identity & Core Attributes",
  },
  {
    id: "STATUS",
    title: "Operational Status & Lifecycle",
  },
];

/**
 * Declarative Field Registry for User Group (USER.GROUP)
 * Primary Key 'recordId' is strictly excluded (owned by CbsFormHeader)
 */
export const USER_GROUP_META_FIELDS: UserGroupMetaFieldDef[] = [
  {
    path: "groupLabel",
    label: "Group Label",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Branch Frontline Tellers",
    required: true,
    width: "full",
    helperText: "Official descriptive title for the security user group profile",
  },
];
