import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Blocks, Calendar, ExternalLink, Funnel, House, MessageSquare, SquareKanban } from 'lucide-react';
import { useState } from "react";

const Sidebar = () => {

  const [toggleSidebar, setToggleSidebar] = useState(false)

  if (!toggleSidebar) {
    return (
      <div className="absolute left-0 top-0 z-20 w-[3.25rem] h-full flex flex-col justify-between items-center pt-6 pb-6 dark:bg-backgroundDark border-[1px] dark:border-faintWhite/5 ">
        <div className="flex flex-col gap-y-4 items-center">
          <span className="px-1 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><House className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="px-1 py-2 group hover:bg-faintWhite rounded-md" title="kanban view">
            <Link to="/"><SquareKanban className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="px-1 py-2 group hover:bg-faintWhite rounded-md" title="calendar view">
            <Link to="/"><Calendar className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="px-1 py-2 group hover:bg-faintWhite rounded-md" title="filter">
            <Link to="/"><Funnel className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="px-1 py-2 group hover:bg-faintWhite rounded-md" title="chat with KanifyAI">
            <Link to="/"><MessageSquare className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="px-1 py-2 group hover:bg-faintWhite rounded-md" title="integrations">
            <Link to="/"><Blocks className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="px-1 py-2 group hover:bg-faintWhite rounded-md" title="share">
            <Link to="/"><ExternalLink className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
        </div>
        <button onClick={() => setToggleSidebar(!toggleSidebar)} className="px-1 py-2 group hover:bg-faintWhite rounded-md" title="share">
          <ArrowRight className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} />
        </button>
      </div>
    );
  } else {
    return (
      <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setToggleSidebar(false)}>
        <div className="absolute z-20 top-0 l-0 w-60 h-full flex flex-col justify-between items-center pt-6 pb-6 dark:bg-backgroundDark border-[1px] dark:border-faintWhite/5">
        <div className="flex flex-col gap-y-4 items-center w-full">
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><House className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite group-hover:text-white/90">Home</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><SquareKanban className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite group-hover:text-white/90">Kanban View</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><Calendar className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite group-hover:text-white/90">Calendar View</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><Funnel className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite group-hover:text-white/90">Fitler</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><MessageSquare className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite group-hover:text-white/90">Kanify AI</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><Blocks className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite group-hover:text-white/90">Integrations</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><ExternalLink className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite group-hover:text-white/90">Share Project</p>
          </span>
        </div>
        <button onClick={() => setToggleSidebar(false)} className="flex gap-x-2 items-center w-[90%] px-2 py-2 group hover:bg-faintWhite/10 rounded-md" title="home">
            <Link to="/"><ArrowLeft className="group-hover:text-white/90 text-midWhite h-5" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite group-hover:text-white/90">Close Sidebar</p>
          </button>
      </div>
      </div>
    );
  }
};

export default Sidebar;
