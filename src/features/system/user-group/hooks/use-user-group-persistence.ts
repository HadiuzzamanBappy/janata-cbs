"use client";

import { useCbsPersistence } from "@/lib/cbs-screen";
import type { UserGroupRecord } from "@/lib/data-schemas/user-group-schema";
import { userGroupRecordSchema } from "@/lib/data-schemas/user-group-schema";

export const INITIAL_USER_GROUP: UserGroupRecord = {
  recordId: "",
  groupLabel: "",
  menuIds: [],
  roleIds: [],
  isActive: true,
};

export function useUserGroupPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<UserGroupRecord>({
    initialId,
    tabId,
    initialData: INITIAL_USER_GROUP,
    schema: userGroupRecordSchema,
  });
}
