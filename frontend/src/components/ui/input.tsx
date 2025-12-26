import * as React from "react"

import { cn } from "../../lib/helpers/helpers"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-background border border-slate-200 dark:border-slate-800 h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-none transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-slate-400 dark:focus:border-slate-600 focus:shadow-none",
        "aria-invalid:border-destructive aria-invalid:focus:ring-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }