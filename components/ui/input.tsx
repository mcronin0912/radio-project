import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-auto w-full min-w-0 rounded-inputs border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 text-[14px] font-normal tracking-tight text-mist outline-none transition-colors placeholder:text-fog focus-visible:border-mist disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
}

export { Input };
