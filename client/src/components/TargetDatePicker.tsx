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

const TargetDatePicker = ({date, setDate, isPage}: {isPage: boolean, date: Date|undefined, setDate: React.Dispatch<React.SetStateAction<Date | undefined>>}) => {

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={`flex justify-between shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] text-fadedWhite gap-x-1 w-full text-left font-normal bg-transparent dark:bg-transparent ${isPage ? "text-base" : "text-sm"} border-none text-light dark:text-white px-0 py-1 min-h-0 h-9`}
        >
          {date ? format(date, "PPP") : <span className="text-faintWhite">Pick a date</span>}
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="rounded-lg w-auto p-0 bg-lmBackground dark:bg-backgroundDark border-none">
        <Calendar mode="single" selected={date} onSelect={setDate} className="bg-lmBackground dark:dark:bg-[#1A1A1A] text-light dark:text-fadedWhite border-none" />
      </PopoverContent>
    </Popover>
  )
}

export default TargetDatePicker
