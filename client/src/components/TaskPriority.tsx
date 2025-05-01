import React from 'react'

const TaskPriority = ({priority}: {priority: string}) => {

    if (priority === 'low'){
        return (
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            {/* <span className="w-2 h-2 rounded-full bg-[#F5F5F5] inline-block" />
            <span className="w-2 h-2 rounded-full bg-[#F5F5F5] inline-block" /> */}
          </div>
        )
    }
    if (priority === 'medium'){
        return (
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            {/* <span className="w-2 h-2 rounded-full bg-[#F5F5F5] inline-block" /> */}
          </div>
        )
    }
    if (priority === 'high'){
        return (
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          </div>
        )

    }
}

export default TaskPriority