import * as React from "react"

import { cn } from "../../lib/helpers/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-base placeholder:text-muted-foreground shadow-none transition-colors outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }