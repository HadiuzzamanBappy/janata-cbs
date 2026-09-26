"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NAV_GROUPS } from "../config/nav-config";

export function DevSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a keyword or page title to search..." />
      <CommandList>
        <CommandEmpty>No matching documentation pages found.</CommandEmpty>
        {NAV_GROUPS.map((group) => (
          <CommandGroup key={group.title} heading={group.title}>
            {group.items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.keywords.join(" ")}`}
                onSelect={() => handleSelect(item.href)}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4 text-primary" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
