import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border-0 border-b-2 border-b-transparent bg-muted px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:border-b-primary focus-visible:bg-muted/80 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive aria-invalid:bg-destructive/5 md:text-sm dark:bg-muted/50 dark:disabled:bg-muted/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
