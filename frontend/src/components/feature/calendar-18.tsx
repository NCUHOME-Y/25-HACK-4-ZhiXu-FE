"use client"

import * as React from "react"

import { Calendar } from "../ui/calendar"

export default function Calendar18() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(2025, 5, 12)
  )

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border border-slate-200 [--cell-size:2.75rem] md:[--cell-size:3rem] dark:border-slate-800"
      buttonVariant="ghost"
    />
  )
}
