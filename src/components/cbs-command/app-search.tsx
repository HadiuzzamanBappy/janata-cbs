"use client";

import * as React from "react";
import { Command, CommandDialog } from "@/components/ui/command";
import { useCbsAccess } from "@/hooks";
import { cbsCommand } from "@/lib/cbs-command";
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
  const [selectedValue, setSelectedValue] = React.useState("__none__");
  const userHasCommandLine = user?.commandLine !== false;

  // Clear query & list highlight on close so opening focuses only the input
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedValue("__none__");
    }
  }, [open]);

  // Hook 1: Fetch and merge all system commands
  const { allCommands, authorizedCommands } = useSearchCommands({
    open,
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

  // Only allow direct terminal execution when commandLine is permitted, no menu item matched, and syntax is valid
  const rawCommandInput = React.useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!userHasCommandLine || !trimmed || filteredCommands.length > 0) {
      return null;
    }
    return cbsCommand.parse(trimmed).isValid ? trimmed : null;
  }, [filteredCommands.length, searchQuery, userHasCommandLine]);

  // Hook 3: Proactive RIDASH & Space Guidance via Gateway Parser
  const commandGuideInfo = useCommandGuide({
    searchQuery,
    allCommands,
  });

  // No row selected on initial empty open; auto-select top match while typing
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSelectedValue("__none__");
      return;
    }
    if (filteredCommands.length > 0) {
      setSelectedValue(filteredCommands[0].command);
    } else if (rawCommandInput) {
      setSelectedValue(`__exec__:${rawCommandInput}`);
    } else {
      setSelectedValue("__none__");
    }
  }, [searchQuery, filteredCommands, rawCommandInput]);

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
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="top-12 sm:top-16 translate-y-0 w-[95vw] sm:w-full max-w-lg sm:max-w-xl p-0 overflow-hidden"
    >
      <Command shouldFilter={false} value={selectedValue} onValueChange={setSelectedValue}>
        <SearchInputBar
          userHasCommandLine={userHasCommandLine}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          filteredCount={filteredCommands.length}
          totalCount={authorizedCommands.length}
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

        <SearchResultsList
          categories={categories}
          onSelectCommand={handleSelectCommand}
          rawCommandInput={rawCommandInput}
          onExecuteRawInput={handleExecuteRawInput}
        />

        <SearchFooterHelp />
      </Command>
    </CommandDialog>
  );
}
