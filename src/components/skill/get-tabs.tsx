"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface GetTab {
  value: string;
  label: string;
  /** What the copy button in the tab bar copies while this tab is open. */
  command: string;
  /** Server-rendered; only the open tab's panel is mounted. */
  panel: ReactNode;
}

/** The ways to get a skill, one tab each, with a single copy button that follows the open tab. */
export const GetTabs = ({
  skill,
  tabs,
  className,
}: {
  skill: string;
  tabs: GetTab[];
  className?: string;
}) => {
  const [active, setActive] = useState(tabs[0]?.value);
  const current = tabs.find((tab) => tab.value === active) ?? tabs[0];

  return (
    <Tabs
      value={active}
      onValueChange={(value: string) => setActive(value)}
      className={cn("gap-0 border", className)}
    >
      <div className="bg-card flex items-center justify-between gap-4 border-b pr-1.5">
        <TabsList variant="line" className="h-10 gap-0 p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-full flex-none border-r px-4 font-mono font-normal group-data-horizontal/tabs:after:-bottom-px"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {current !== undefined && (
          <CopyButton
            value={current.command}
            label={`${current.label} command for ${skill}`}
            variant="ghost"
            size="sm"
          />
        )}
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="min-w-0">
          {tab.panel}
        </TabsContent>
      ))}
    </Tabs>
  );
};
