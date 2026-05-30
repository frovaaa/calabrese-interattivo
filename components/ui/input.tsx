import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border border-zinc-200/80 bg-white/85 px-4 text-base shadow-sm outline-none backdrop-blur placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/20 sm:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
