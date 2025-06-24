const TaskPriority = ({priority}: {priority: string}) => {

  let bgColor = ''
  switch (priority) {
    case 'high': 
      bgColor = 'bg-red-500/30'
      break;
    case 'medium':
      bgColor = 'bg-orange-500/30'
      break;
    case 'low':
      bgColor = 'bg-green-500/30'
      break;
    default:
      bgColor = 'bg-midWhite/50'
  }

   return (
    <span className={`${bgColor} text-xxs px-2 rounded-md`}>{priority}</span>
   )
}

export default TaskPriority