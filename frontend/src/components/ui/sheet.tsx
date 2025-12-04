"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "left" | "right" | "top" | "bottom" }
>(({ side = "left", className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-card shadow-lg outline-none",
        side === "left" && "inset-y-0 left-0 w-72 animate-in slide-in-from-left",
        side === "right" && "inset-y-0 right-0 w-72 animate-in slide-in-from-right",
        side === "top" && "inset-x-0 top-0 h-64 animate-in slide-in-from-top",
        side === "bottom" && "inset-x-0 bottom-0 h-64 animate-in slide-in-from-bottom",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export { Sheet, SheetTrigger, SheetContent };
