import { MessageSquareText } from "lucide-react"

const TaskCommentCount = ({commentCount}: {commentCount: number}) => {
   return (
    <span className={`bg-midWhite/10 text-xxs pr-2 rounded-md flex items-center`}><MessageSquareText className="h-[0.65rem]" />{commentCount}</span>
   )
}

export default TaskCommentCount