"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RESET_AFTER_MS = 2000;

type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "onClick" | "value"
> & {
  value: string;
  /** Screen-reader context for what gets copied, e.g. "install command for commit". */
  label: string;
};

export const CopyButton = ({
  value,
  label,
  className,
  ...props
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), RESET_AFTER_MS);

    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  };

  return (
    <Button
      variant="outline"
      className={cn("px-3 font-normal", className)}
      onClick={copy}
      {...props}
    >
      <HugeiconsIcon
        icon={copied ? Tick02Icon : Copy01Icon}
        data-icon="inline-start"
      />
      <span aria-live="polite">
        {copied ? "Copied" : "Copy"}
        <span className="sr-only"> {label}</span>
      </span>
    </Button>
  );
};
