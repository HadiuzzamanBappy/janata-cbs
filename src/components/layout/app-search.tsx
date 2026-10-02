"use client";

import * as React from "react";
import { CommandDialog } from "@/components/ui/command";
import { useUserRights } from "@/hooks";
import { useAlertStore, useSessionStore, useWorkbenchStore } from "@/store";

import type { GlobalSearchProps, RidashOption } from "./search/types";
import { filterVisibleCommands, groupCommandsByCategory } from "./search/search-utils";
import { useSearchCommands } from "./search/use-search-commands";
import { useCommandGuide } from "./search/use-command-guide";
import { useCommandExecutor } from "./search/use-command-executor";
import { SearchInputBar } from "./search/search-input-bar";
import { CommandGuidance } from "./search/command-guidance";
import { SearchResultsList } from "./search/search-results-list";
import { SearchFooterHelp } from "./search/search-footer-help";

export function AppSearch({ open, onOpenChange, openSettingsTab }: GlobalSearchProps) {
  const { user, logout } = useSessionStore();
  const { addTab } = useWorkbenchStore();
  const { confirm } = useAlertStore();
  const rights = useUserRights();

  const [searchQuery, setSearchQuery] = React.useState("");
  const userHasCommandLine = user?.commandLine !== false;

  // Clear query on close
  React.useEffect(() => {
    if (!open) setSearchQuery("");
  }, [open]);

  // Hook 1: Fetch and merge all system commands
  const { allCommands, authorizedCommands } = useSearchCommands({
    open,
    userHasCommandLine,
  });

  // Hook 2: CBS Command Grammar Execution
  const { handleSelectCommand, handleExecuteRawInput } = useCommandExecutor({
    user,
    allCommands,
    addTab,
    openSettingsTab,
    logout,
    confirm,
    onClose: () => onOpenChange(false),
  });

  // Filter commands strictly on what's visible on view & group into categories
  const filteredCommands = React.useMemo(() => {
    return filterVisibleCommands(authorizedCommands, searchQuery);
  }, [authorizedCommands, searchQuery]);

  const categories = React.useMemo(() => {
    return groupCommandsByCategory(filteredCommands);
  }, [filteredCommands]);

  // Hook 3: Proactive RIDASH & Space Guidance
  const commandGuideInfo = useCommandGuide({
    searchQuery,
    allCommands,
    userHasCommandLine,
  });

  const RIDASH_OPTIONS: RidashOption[] = React.useMemo(
    () =>
      [
        { code: "I", label: "Input / Create", right: rights.canInput },
        { code: "S", label: "See / View", right: rights.canSee || rights.canRead },
        { code: "A", label: "Amend / Edit", right: rights.canAmend || rights.canAuthorise },
        { code: "D", label: "Delete", right: rights.canDelete },
        { code: "R", label: "Read / Reverse", right: rights.canRead || rights.canReverse },
        { code: "H", label: "Hold Draft", right: rights.canHold },
      ].filter((opt) => opt.right),
    [rights],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-lg sm:max-w-xl">
      <SearchInputBar
        userHasCommandLine={userHasCommandLine}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        authorizedCommands={authorizedCommands}
        filteredCount={filteredCommands.length}
        totalCount={authorizedCommands.length}
        onSelectCommand={handleSelectCommand}
        onExecuteRawInput={handleExecuteRawInput}
      />

      {commandGuideInfo && (
        <CommandGuidance
          guideInfo={commandGuideInfo}
          options={RIDASH_OPTIONS}
          permittedRights={rights.functionRights}
          hasRight={rights.hasRight}
          onSelectOption={(code) => {
            setSearchQuery(`${commandGuideInfo.appName} ${code} `);
          }}
        />
      )}

      <SearchResultsList
        categories={categories}
        onSelectCommand={handleSelectCommand}
      />

      <SearchFooterHelp />
    </CommandDialog>
  );
}
