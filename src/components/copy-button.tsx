"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RESET_AFTER_MS = 2000;

type Status = "idle" | "copied" | "failed";

const statusText: Record<Status, string> = {
  copied: "Copied",
  failed: "Copy failed",
  idle: "Copy",
};

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
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timer = setTimeout(() => setStatus("idle"), RESET_AFTER_MS);

    return () => clearTimeout(timer);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      // Denied permission or an insecure context: say so, then fall back to "Copy" so the retry is obvious.
      setStatus("failed");
    }
  };

  return (
    <Button
      variant="outline"
      className={cn("px-3 font-normal", className)}
      onClick={copy}
      {...props}
    >
      <HugeiconsIcon
        icon={status === "copied" ? Tick02Icon : Copy01Icon}
        data-icon="inline-start"
      />
      <span aria-live="polite">
        {statusText[status]}
        <span className="sr-only"> {label}</span>
      </span>
    </Button>
  );
};
