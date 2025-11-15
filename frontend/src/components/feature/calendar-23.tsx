"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"

interface Calendar23Props {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
}

export default function Calendar23({ value, onChange }: Calendar23Props) {
  const [range, setRange] = React.useState<DateRange | undefined>(value)

  React.useEffect(() => {
    setRange(value)
  }, [value])

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange)
    onChange?.(newRange)
  }

  return (
    <div className="flex flex-col gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="dates"
            className="w-full justify-between font-normal"
          >
            {range?.from && range?.to
              ? `${range.from.toLocaleDateString('zh-CN')} - ${range.to.toLocaleDateString('zh-CN')}`
              : range?.from
              ? `${range.from.toLocaleDateString('zh-CN')}`
              : "选择日期范围"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            captionLayout="dropdown"
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
