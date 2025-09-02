import { cn } from "@/utils/utils"

const TaskPriority = ({priority, className}: {priority: string, className?: string}) => {

  if (priority === 'low'){
    return <div className={cn(`bg-green-400 h-2 w-[0.15rem]`, className)} />
  }else if (priority === 'medium'){
    return <div className={cn(`flex gap-x-[0.15rem]`, className)}>
      <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
      <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
    </div>
  }else if (priority === 'high'){
    return (<div className={cn(`flex gap-x-[0.2rem]`, className)}>
      <div className={`bg-red-400 h-2 w-[0.15rem]`} />
      <div className={`bg-red-400 h-2 w-[0.15rem]`} />
      <div className={`bg-red-400 h-2 w-[0.15rem]`} />
    </div>)
  }else{
    return <></>
  }
}

export default TaskPriority