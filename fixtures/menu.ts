import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * Canonical CBS Menu Hierarchy Fixture.
 * Normalized clean representation of CBS gRPC menu response (.response/menu.normalized.json).
 * Pure data constant only — no parsers or business logic.
 */
export const STATIC_MENU: GrpcResponse = {
  status: "SUCCESS",
  statusCode: 200,
  idempotencyKey: "",
  message: "record successfully processed!",
  errors: [],
  timestamp: "2026-10-01T09:08:40.738560187Z",
  data: {
    records: [
      {
        id: "n_1786858616121_0",
        menuId: 1,
        label: "Operational",
        command: "",
        isVisible: true,
        children: [
          {
            id: "n_1786858624172_1",
            menuId: 13,
            label: "User Management",
            command: "",
            isVisible: true,
            children: [
              {
                id: "n_1786858673775_5",
                menuId: 14,
                label: "User Request",
                command: "",
                isVisible: true,
                children: [
                  {
                    id: "n_1787137168951_1",
                    menuId: 29,
                    label: "User Request",
                    command: "INQ S GET.EMP.INFO",
                    isVisible: true,
                    children: [],
                  },
                  {
                    id: "n_1786858700779_6",
                    menuId: 15,
                    label: "Create User Request",
                    command: "USER.MGT,NEW1",
                    isVisible: true,
                    children: [],
                  },
                  {
                    id: "n_1786858707338_7",
                    menuId: 16,
                    label: "Unauthrized User Request List",
                    command: "INQ S GET.USER.MGT",
                    isVisible: true,
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            id: "n_1786858625499_2",
            menuId: 3,
            label: "Customer Manage",
            command: "",
            isVisible: true,
            children: [
              {
                id: "n_1786859112388_8",
                menuId: 6,
                label: "Create Customer",
                command: "CUSTOMER",
                isVisible: true,
                children: [],
              },
            ],
          },
          {
            id: "n_1786858625931_3",
            menuId: 4,
            label: "Account Manage",
            command: "",
            isVisible: true,
            children: [
              {
                id: "n_1786859119420_9",
                menuId: 7,
                label: "Create Accouont",
                command: "ACCOUNT",
                isVisible: true,
                children: [],
              },
            ],
          },
          {
            id: "n_1786862427083_1",
            menuId: 10,
            label: "Daily Inquiry",
            command: "",
            isVisible: true,
            children: [
              {
                id: "n_1786862453089_3",
                menuId: 19,
                label: "Today Txn Entry",
                command: "INQ S GET.TODAY.ENTRY",
                isVisible: true,
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
};
