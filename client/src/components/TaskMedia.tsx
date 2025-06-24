import { Paperclip } from "lucide-react"

const TaskMediaCount = ({mediaCount}: {mediaCount: number}) => {
   return (
    <span className={`bg-midWhite/10 text-xxs pr-2 rounded-md flex items-center`}><Paperclip className="h-[0.65rem]" />{mediaCount}</span>
   )
}

export default TaskMediaCount