import { CopyButton } from "@/components/copy-button";

export const CommandSnippet = ({
  command,
  label,
}: {
  command: string;
  /** Screen-reader context for the copy button, e.g. "install command". */
  label: string;
}) => (
  <div className="bg-card flex min-h-11 max-w-full items-center gap-4 border py-1.5 ps-3.5 pe-1.5 font-mono text-xs sm:text-sm">
    <span className="min-w-0">
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
