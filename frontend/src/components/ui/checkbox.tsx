"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onCheckedChange?: (checked: boolean) => void;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onChange, onCheckedChange, ...props }, ref) => (
    <label className="relative inline-flex h-4 w-4 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-sm border border-input bg-background ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        checked={checked}
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        {...props}
      />
      <span className="pointer-events-none text-primary opacity-0 transition peer-checked:opacity-100 peer-disabled:opacity-50">
        <Check className="h-3 w-3" />
      </span>
    </label>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
