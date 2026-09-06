"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent whitespace-nowrap transition-colors outline-none select-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mist disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-buttons bg-acid-lime px-4 py-2.5 text-[14px] font-medium tracking-tight text-void shadow-acid hover:brightness-105",
        outline:
          "rounded-buttons border-graphite bg-transparent px-3 py-2 text-[13px] font-normal text-mist hover:border-smoke hover:bg-white/[0.02]",
        secondary:
          "rounded-full bg-white/[0.05] px-3 py-1 text-[13px] font-normal text-mist hover:bg-white/[0.08]",
        ghost:
          "rounded-buttons bg-transparent px-3 py-2 text-[13px] font-normal text-mist hover:bg-white/[0.05] hover:text-paper",
        pill:
          "rounded-full bg-paper px-4 py-2 text-[13px] font-medium text-void hover:bg-bone",
        destructive:
          "rounded-buttons bg-coral-red/15 px-3 py-2 text-[13px] font-normal text-coral-red hover:bg-coral-red/25",
        link: "rounded-none bg-transparent px-0 text-[13px] font-normal text-mist underline-offset-4 hover:text-paper hover:underline",
      },
      size: {
        default: "h-auto gap-2",
        xs: "h-auto gap-1 px-2 py-1 text-[12px]",
        sm: "h-auto gap-1 text-[13px]",
        lg: "h-auto gap-2 px-5 py-3 text-[15px]",
        icon: "size-8 rounded-buttons p-0",
        "icon-xs": "size-6 rounded-buttons p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-buttons p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 rounded-buttons p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
