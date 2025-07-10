import * as React from "react"
import { format } from "date-fns"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const TargetDatePicker = ({date, setDate}: {date: Date|undefined, setDate: React.Dispatch<React.SetStateAction<Date | undefined>>}) => {

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="flex justify-between shadow-bottom-grey gap-x-1 w-full text-left font-normal bg-lmBackground dark:bg-light text-sm border-faintWhite/30 border-none text-light dark:text-white px-0 py-1 min-h-0 h-9"
        >
          {date ? format(date, "PPP") : <span className="text-faintWhite">Pick a date</span>}
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="rounded-xl w-auto p-0 bg-lmBackground dark:bg-backgroundDark border border-faintWhite/30 dark:border-faintWhite/10">
        <Calendar mode="single" selected={date} onSelect={setDate} className="bg-lmBackground dark:bg-backgroundDark text-light dark:text-fadedWhite" />
      </PopoverContent>
    </Popover>
  )
}

export default TargetDatePicker
