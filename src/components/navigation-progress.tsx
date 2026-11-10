"use client";

import { useNavigation } from "@rshono/core/client";

import { cn } from "@/lib/utils";

/**
 * A bar along the top edge while a soft navigation waits on the server. It fades in after 150ms, so a click
 * answered from the prefetch cache never shows it, and fills the width as it fades out.
 */
export const NavigationProgress = () => {
  const { router } = useNavigation();

  return (
    <div
      aria-hidden
      className={cn(
        "bg-foreground pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left transition-opacity",
        router.pending
          ? "animate-navigation-progress opacity-100 delay-150 motion-reduce:animate-none"
          : "opacity-0 duration-300"
      )}
    />
  );
};
