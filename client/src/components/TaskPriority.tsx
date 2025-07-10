const TaskPriority = ({priority}: {priority: string}) => {

  if (priority === 'low'){
    return <div className={`bg-green-400 h-2 w-[0.15rem] `} />
  }else if (priority === 'medium'){
    return <div className="flex gap-x-[0.15rem]">
      <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
      <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
    </div>
  }else if (priority === 'high'){
    return (<div className="flex gap-x-[0.2rem]">
      <div className={`bg-red-400 h-2 w-[0.15rem]`} />
      <div className={`bg-red-400 h-2 w-[0.15rem]`} />
      <div className={`bg-red-400 h-2 w-[0.15rem]`} />
    </div>)
  }else{
    return <></>
  }
}

export default TaskPriority