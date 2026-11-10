"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { Container } from "@/components/container";
import { SkillRow } from "@/components/home/skill-row";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryIds, categoryLabels } from "@/lib/skill-metadata";
import type { CategoryId } from "@/lib/skill-metadata";
import type { Skill } from "@/lib/skill-schema";

type Filter = CategoryId | "all";

const matches = (skill: Skill, filter: Filter, query: string) => {
  if (filter !== "all" && skill.category !== filter) {
    return false;
  }

  const needle = query.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return Object.values(skill).some((field) =>
    field.toLowerCase().includes(needle)
  );
};

const useSlashToFocus = (ref: RefObject<HTMLInputElement | null>) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const { target } = event;

      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));

      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        typing
      ) {
        return;
      }

      event.preventDefault();
      ref.current?.focus();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [ref]);
};

export const SkillDirectory = ({ skills }: { skills: readonly Skill[] }) => {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useSlashToFocus(searchRef);

  const tabs: { value: Filter; label: string; count: number }[] = [
    { count: skills.length, label: "All", value: "all" },
    ...categoryIds
      .map((id) => ({
        count: skills.filter((skill) => skill.category === id).length,
        label: categoryLabels[id],
        value: id,
      }))
      .filter((tab) => tab.count > 0),
  ];

  const visible = skills.filter((skill) => matches(skill, filter, query));

  return (
    <section id="skills" aria-labelledby="skills-title" className="scroll-mt-6">
      <Container className="pt-8 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2
            id="skills-title"
            className="font-heading text-5xl tracking-tight"
          >
            Skills
          </h2>
          <InputGroup className="bg-card h-9 w-full sm:w-72">
            <InputGroupInput
              ref={searchRef}
              type="search"
              placeholder="Search"
              aria-label="Search skills"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setQuery("");
                }
              }}
              className="text-sm md:text-sm"
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="border bg-transparent font-mono">/</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Tabs
          value={filter}
          onValueChange={(value: Filter) => setFilter(value)}
          className="mt-8 gap-0"
        >
          <TabsList
            variant="line"
            className="h-10 w-full justify-start gap-2 overflow-x-auto overflow-y-hidden border-b p-0 sm:gap-4"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-none px-2 text-sm font-normal group-data-horizontal/tabs:after:-bottom-px"
              >
                {tab.label}
                <span className="text-muted-foreground font-mono text-xs">
                  {tab.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={filter}>
            {visible.length > 0 ? (
              <ol>
                {visible.map((skill) => (
                  <SkillRow
                    key={skill.name}
                    skill={skill}
                    position={skills.indexOf(skill) + 1}
                  />
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground border-b py-12 text-center text-sm">
                No skills match “{query.trim()}”.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </Container>
    </section>
  );
};
