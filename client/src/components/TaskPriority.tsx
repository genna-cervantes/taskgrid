const TaskPriority = ({priority}: {priority: string}) => {

    if (priority === 'low'){
        return (
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up-icon lucide-chevron-up text-green-400 inline-block rotate-180"><path d="m18 15-6-6-6 6"/></svg>
          </div>
        )
    }
    if (priority === 'medium'){
        return (
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up-icon lucide-chevron-up text-orange-400 inline-block"><path d="m18 15-6-6-6 6"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up-icon lucide-chevron-up text-orange-400 inline-block"><path d="m18 15-6-6-6 6"/></svg>
          </div>
        )
    }
    if (priority === 'high'){
        return (
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up-icon lucide-chevron-up text-red-400 inline-block"><path d="m18 15-6-6-6 6"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up-icon lucide-chevron-up text-red-400 inline-block"><path d="m18 15-6-6-6 6"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up-icon lucide-chevron-up text-red-400 inline-block"><path d="m18 15-6-6-6 6"/></svg>
          </div>
        )

    }
}

export default TaskPriority