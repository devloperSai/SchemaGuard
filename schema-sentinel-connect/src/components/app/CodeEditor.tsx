// Lightweight code editor (line-numbered textarea). Avoids Monaco's SSR/bundle cost.
import { useMemo } from "react";

export function CodeEditor({
  value, onChange, language = "json", minRows = 8, maxRows = 24,
}: {
  value: string;
  onChange: (v: string) => void;
  language?: "json" | "javascript";
  minRows?: number;
  maxRows?: number;
}) {
  const lines = useMemo(() => value.split("\n").length, [value]);
  const rows = Math.min(maxRows, Math.max(minRows, lines));

  return (
    <div className="overflow-hidden rounded-md border border-border bg-[oklch(0.16_0.005_285)] focus-within:border-brand/50">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">{language}</span>
        <span className="text-mono text-[10px] text-muted-foreground">{lines} ln</span>
      </div>
      <div className="flex">
        <pre aria-hidden className="text-mono select-none border-r border-border/60 bg-surface-2/40 px-3 py-3 text-right text-[11px] leading-5 text-muted-foreground/60">
          {Array.from({ length: rows }, (_, i) => i + 1).join("\n")}
        </pre>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          rows={rows}
          className="text-mono w-full resize-none bg-transparent px-3 py-3 text-[12px] leading-5 outline-none placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  );
}
