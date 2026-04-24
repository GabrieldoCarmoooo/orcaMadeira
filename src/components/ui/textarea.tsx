import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-[80px] rounded-lg border-0 border-b-2 border-b-transparent bg-muted px-2.5 py-2 text-base transition-colors outline-none resize-none placeholder:text-muted-foreground/60 focus-visible:border-b-primary focus-visible:bg-muted/80 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive aria-invalid:bg-destructive/5 md:text-sm dark:bg-muted/50 dark:disabled:bg-muted/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
