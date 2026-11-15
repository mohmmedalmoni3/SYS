"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn group/btn relative", {
  variants: {
    variant: {
      primary: "btn-primary btn-shimmer",
      ghost: "btn-ghost",
      outline:
        "border border-line-strong bg-transparent text-fg hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]",
      soft: "bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] text-primary-soft border border-[color-mix(in_oklab,var(--primary)_32%,transparent)] hover:bg-[color-mix(in_oklab,var(--primary)_24%,transparent)]",
      danger:
        "bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-danger border border-[color-mix(in_oklab,var(--danger)_38%,transparent)] hover:bg-[color-mix(in_oklab,var(--danger)_28%,transparent)]",
      success:
        "bg-[color-mix(in_oklab,var(--success)_16%,transparent)] text-success border border-[color-mix(in_oklab,var(--success)_34%,transparent)] hover:bg-[color-mix(in_oklab,var(--success)_24%,transparent)]",
      link: "text-primary-soft underline-offset-4 hover:underline bg-transparent p-0",
    },
    size: {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-10 px-4 text-[0.83rem]",
      lg: "h-12 px-6 text-sm rounded-xl",
      icon: "size-9 p-0 rounded-lg",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span className="opacity-80">{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
