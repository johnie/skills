import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** The page column every section aligns to. */
export const Container = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("mx-auto w-full max-w-5xl px-6", className)} {...props} />
);
