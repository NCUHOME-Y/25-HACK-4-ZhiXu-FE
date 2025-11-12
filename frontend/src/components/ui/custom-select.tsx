import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "../../lib/helpers/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function CustomSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  className,
  disabled = false,
  ...props
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")

  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  const selectedOption = options.find(option => option.value === selectedValue)

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue)
    onValueChange?.(optionValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between border border-slate-200 dark:border-slate-800 bg-background h-9 px-3 py-2 text-sm shadow-none transition-colors outline-none",
            "focus:border-slate-400 dark:focus:border-slate-600 focus:shadow-none",
            "hover:bg-accent hover:text-accent-foreground",
            disabled && "pointer-events-none opacity-50",
            className
          )}
          disabled={disabled}
          {...props}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
        {options.map((option) => (
          <div
            key={option.value}
            className={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "hover:bg-blue-50 dark:hover:bg-blue-950",
              selectedValue === option.value && "bg-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-400"
            )}
            onClick={() => handleSelect(option.value)}
          >
            <span className="flex-1">{option.label}</span>
            {selectedValue === option.value && (
              <Check className="ml-2 h-4 w-4" />
            )}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export { CustomSelect, type SelectOption }