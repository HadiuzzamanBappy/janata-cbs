import type { ControlCommand, ControlType, MenuItem } from "@/lib/data-schemas";

export const MASTER_COMMAND_DEFINITIONS: readonly ControlCommand[] = [
  {
    command: "SC.MENU.DESIGN",
    title: "Menu Hierarchy",
    aliases: ["MD"],
    controlAction: "SCREEN",
    controlType: "FORM",
  },
  {
    command: "SC.MODEL.CONFIG",
    title: "Model Config",
    aliases: ["MC"],
    controlAction: "SCREEN",
    controlType: "FORM",
  },
  {
    command: "SC.FORM.CONFIG",
    title: "Form Design",
    aliases: ["FC"],
    controlAction: "SCREEN",
    controlType: "FORM",
  },
  {
    command: "SC.INQUIRY.CONFIG",
    title: "Inquiry Design",
    aliases: ["IC"],
    controlAction: "SCREEN",
    controlType: "FORM",
  },
  {
    command: "SETTINGS:PROFILE",
    title: "User Profile Settings",
    aliases: ["PROFILE"],
    controlAction: "SETTINGS",
    controlType: "SETTINGS",
  },
  {
    command: "SETTINGS:APPEARANCE",
    title: "Appearance & Theme",
    aliases: ["THEME"],
    controlAction: "SETTINGS",
    controlType: "SETTINGS",
  },
  {
    command: "SETTINGS:SECURITY",
    title: "Security & Credentials",
    aliases: ["SECURITY"],
    controlAction: "SETTINGS",
    controlType: "SETTINGS",
  },
] as const;

export function getAllRegisteredCommands(): ControlCommand[] {
  return [...MASTER_COMMAND_DEFINITIONS];
}

export function extractMenuCommands(items: MenuItem[]): ControlCommand[] {
  const result: ControlCommand[] = [];

  function traverse(list: MenuItem[]): void {
    for (const item of list) {
      if (item.command) {
        result.push({
          command: item.command,
          title: item.label,
          aliases: [],
          controlAction: item.menuAction ?? "SCREEN",
          controlType: (item.menuType as ControlType) ?? "FORM",
        });
      }
      if (item.children?.length) {
        traverse(item.children);
      }
    }
  }

  traverse(items);
  return result;
}
