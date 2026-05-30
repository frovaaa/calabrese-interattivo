import * as React from "react";
import { cn } from "@/lib/utils";

export function Card(props: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn("rounded-3xl border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur", className)}
      {...rest}
    />
  );
}

export function CardHeader(props: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  const { className, ...rest } = props;
  return <div className={cn("p-5 sm:p-6", className)} {...rest} />;
}

export function CardTitle(props: Readonly<React.ComponentProps<"h3">>) {
  const { className, children, ...rest } = props;
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight text-zinc-950", className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardContent(props: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  const { className, ...rest } = props;
  return <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...rest} />;
}
