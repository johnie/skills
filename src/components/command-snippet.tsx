import { CopyButton } from "@/components/copy-button";

export const CommandSnippet = ({
  command,
  label,
}: {
  command: string;
  /** Screen-reader context for the copy button, e.g. "install command". */
  label: string;
}) => (
  <div className="bg-card flex h-11 max-w-full items-center gap-4 border pr-1.5 pl-3.5 font-mono text-xs whitespace-nowrap sm:text-sm">
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
