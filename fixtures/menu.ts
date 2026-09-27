import type { MenuItem } from "@/features/workspace";

/**
 * Offline development mock menu hierarchy tree.
 */
export const STATIC_MENU: MenuItem[] = [
  {
    id: "n_1786858616121_0",
    menuId: 1,
    label: "Operational",
    children: [
      {
        id: "n_1786858624172_1",
        menuId: 13,
        label: "User Management",
        children: [
          {
            id: "n_1786858673775_5",
            menuId: 14,
            label: "User Request",
            children: [
              {
                id: "n_1787137168951_1",
                menuId: 29,
                label: "User Request",
                command: "INQ S GET.EMP.INFO",
              },
              {
                id: "n_1786858700779_6",
                menuId: 15,
                label: "Create User Request",
                command: "USER.MGT,NEW1",
              },
              {
                id: "n_1786858707338_7",
                menuId: 16,
                label: "Unauthrized User Request List",
                command: "INQ S GET.USER.MGT",
              },
            ],
          },
        ],
      },
      {
        id: "n_1786858625499_2",
        menuId: 3,
        label: "Customer Manage",
        children: [
          {
            id: "n_1786859112388_8",
            menuId: 6,
            label: "Create Customer",
            command: "CUSTOMER",
          },
        ],
      },
      {
        id: "n_1786858625931_3",
        menuId: 4,
        label: "Account Manage",
        children: [
          {
            id: "n_1786859119420_9",
            menuId: 7,
            label: "Create Accouont",
            command: "ACCOUNT",
          },
        ],
      },
      {
        id: "n_1786858648899_4",
        menuId: 5,
        label: "Funds Manage",
        children: [
          {
            id: "n_1786859124995_10",
            menuId: 8,
            label: "Funds Transfer",
            command: "FUNDS.TRANSFER",
          },
        ],
      },
      {
        id: "n_1786862427083_1",
        menuId: 10,
        label: "Daily Inquiry",
        children: [
          {
            id: "n_1786862443210_2",
            menuId: 17,
            label: "Today Txn Report",
            command: "INQ S GET.TO.TXN",
          },
          {
            id: "n_1786862453089_3",
            menuId: 19,
            label: "Today Txn Entry",
            command: "INQ S GET.TODAY.ENTRY",
          },
        ],
      },
    ],
  },
];
