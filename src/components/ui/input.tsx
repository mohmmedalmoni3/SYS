import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-muted">
            {icon}
          </span>
          <input ref={ref} className={cn("field ps-9", className)} {...props} />
        </div>
      );
    }
    return <input ref={ref} className={cn("field", className)} {...props} />;
  },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn("field min-h-24 resize-y", className)} {...props} />,
);
Textarea.displayName = "Textarea";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("field cursor-pointer appearance-none bg-[var(--surface-2)] pe-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-xs font-medium text-muted", className)} {...props} />;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1 text-[0.7rem] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[0.68rem] text-muted/80">{hint}</p>
      ) : null}
    </div>
  );
}
