import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white shadow-sm hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md",
        outline: "border border-zinc-200/80 bg-white/80 text-zinc-900 shadow-sm hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-md",
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
