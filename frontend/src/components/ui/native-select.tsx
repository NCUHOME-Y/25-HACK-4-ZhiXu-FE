import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../../lib/helpers/utils"

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div
      className="group/native-select relative w-full has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        className={cn(
          "border border-slate-200 dark:border-slate-800 placeholder:text-muted-foreground bg-background h-9 w-full min-w-0 appearance-none rounded-md px-3 py-2 pr-9 text-sm shadow-none transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus:border-slate-400 dark:focus:border-slate-600 focus:shadow-none",
          "aria-invalid:border-destructive aria-invalid:focus:ring-destructive",
          "[&>option]:rounded-md [&>option]:my-1 [&>option]:px-2 [&>option]:py-1",
          "[&>option:checked]:bg-blue-500 [&>option:checked]:text-white",
          "[&>option:hover]:bg-blue-50 dark:[&>option:hover]:bg-blue-950",
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50 select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({ ...props }: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn(className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
