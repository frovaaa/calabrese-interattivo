"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  className?: string;
};

export function ShareLinkButton(props: Readonly<Props>) {
  const { className } = props;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const href = window.location.href;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(href);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = href;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button onClick={copy} variant="outline" className={`gap-2 ${className ?? ""}`}>
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copied!" : "Copy share link"}
    </Button>
  );
}
