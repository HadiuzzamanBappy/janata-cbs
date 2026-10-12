"use client";

import * as React from "react";
import { CommandDialog } from "@/components/ui/command";
import { useCbsAccess } from "@/lib/cbs-access";
import { useSessionStore } from "@/store";
import { CBS_FUNCTION_CODES, CBS_FUNCTION_DEFINITIONS } from "@/types";
import { CommandGuidance } from "./components/command-guidance";
import { SearchFooterHelp } from "./components/search-footer-help";
import { SearchInputBar } from "./components/search-input-bar";
import { SearchResultsList } from "./components/search-results-list";
import { useCommandExecutor } from "./hooks/use-command-executor";
import { useCommandGuide } from "./hooks/use-command-guide";
import { useSearchCommands } from "./hooks/use-search-commands";
import type { GlobalSearchProps, RidashOption } from "./types";
import { filterVisibleCommands, groupCommandsByCategory } from "./utils/search-filter";

export function AppSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { user } = useSessionStore();
  const access = useCbsAccess();

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

  // Hook 2: CBS Command Gateway Execution
  const { handleSelectCommand, handleExecuteRawInput } = useCommandExecutor({
    onClose: () => onOpenChange(false),
  });

  // Filter commands strictly on what's visible on view & group into categories
  const filteredCommands = React.useMemo(() => {
    return filterVisibleCommands(authorizedCommands, searchQuery);
  }, [authorizedCommands, searchQuery]);

  const categories = React.useMemo(() => {
    return groupCommandsByCategory(filteredCommands);
  }, [filteredCommands]);

  // Hook 3: Proactive RIDASH & Space Guidance via Gateway Parser
  const commandGuideInfo = useCommandGuide({
    searchQuery,
    allCommands,
  });

  const RIDASH_OPTIONS: RidashOption[] = React.useMemo(
    () =>
      CBS_FUNCTION_CODES.map((code) => {
        const def = CBS_FUNCTION_DEFINITIONS[code];
        return {
          code,
          label: `${def.label} (${def.description})`,
          right: access.hasFunctionRight(code),
        };
      }).filter((opt) => opt.right),
    [access],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-lg sm:max-w-xl">
      <SearchInputBar
        userHasCommandLine={userHasCommandLine}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filteredCount={filteredCommands.length}
        totalCount={authorizedCommands.length}
        onExecuteRawInput={handleExecuteRawInput}
      />

      {commandGuideInfo && (
        <CommandGuidance
          guideInfo={commandGuideInfo}
          options={RIDASH_OPTIONS}
          permittedRights={access.grantedRights}
          hasRight={access.hasFunctionRight}
          onSelectOption={(code) => {
            setSearchQuery(`${commandGuideInfo.appName} ${code} `);
          }}
        />
      )}

      <SearchResultsList categories={categories} onSelectCommand={handleSelectCommand} />

      <SearchFooterHelp />
    </CommandDialog>
  );
}
