import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[96px] w-full rounded-2xl border border-zinc-200/80 bg-white/85 px-4 py-3 text-sm shadow-sm outline-none backdrop-blur placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
