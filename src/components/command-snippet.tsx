import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

/** A shell command with a copy button, as shown in the hero and on each skill page. */
export const CommandSnippet = ({
  command,
  label,
  className,
}: {
  command: string;
  /** Screen-reader context for the copy button, e.g. "install command". */
  label: string;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-card flex h-11 max-w-full items-center gap-4 border pr-1.5 pl-3.5 font-mono text-xs whitespace-nowrap sm:text-sm",
      className
    )}
  >
    <span className="overflow-x-auto">
      <span className="text-muted-foreground">$</span> {command}
    </span>
    <CopyButton
      value={command}
      label={label}
      variant="ghost"
      className="bg-background"
    />
  </div>
);
