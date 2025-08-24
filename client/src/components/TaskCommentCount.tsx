import { MessageSquareText } from "lucide-react"

const TaskCommentCount = ({commentCount}: {commentCount: number}) => {
   return (
    <span className={`border border-faintWhite flex text-xxs pr-2 rounded-md items-center`}><MessageSquareText className="h-[0.6rem]" />{commentCount}</span>
   )
}

export default TaskCommentCount