import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Blocks, Calendar, ExternalLink, Funnel, House, MessageSquare, SquareKanban } from 'lucide-react';
import { useState } from "react";
import kanifyLogo from '/kanify_logo.png'

const Sidebar = () => {

  const [toggleSidebar, setToggleSidebar] = useState(false)

  const selected = 'kanban'

  if (!toggleSidebar) {
    return (
      <div className="absolute left-0 top-0 z-20 w-[3.25rem] h-full flex flex-col justify-between items-center pt-2 pb-6 dark:bg-backgroundDark border-[1px] dark:border-faintWhite/5 ">
        <div className="flex flex-col gap-y-5 items-center w-full">
          <span className="px-1 py-2" title="home">
            <Link to="/"><img src={kanifyLogo} className="h-6 w-6" /></Link>
          </span>
          <span className={`w-full ${selected === 'kanban' ? 'border-l-fadedWhite' : ''} py-1 border-l-[3px] border-l-transparent hover:border-l-fadedWhite pl-[0.65rem] transition-opacity duration-300`} title="kanban view">
            <Link to="/"><SquareKanban className={`${selected ? 'text-fadedWhite' : 'text-midWhite'} h-5`} strokeWidth={2} /></Link>
          </span>
          <span className="w-full py-1 border-l-[3px] border-l-transparent hover:border-l-fadedWhite pl-[0.65rem] transition-opacity duration-300" title="calendar view">
            <Link to="/"><Calendar className=" text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="w-full py-1 border-l-[3px] border-l-transparent hover:border-l-fadedWhite pl-[0.65rem] transition-opacity duration-300" title="filter">
            <Link to="/"><Funnel className=" text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="w-full py-1 border-l-[3px] border-l-transparent hover:border-l-fadedWhite pl-[0.65rem] transition-opacity duration-300" title="chat with KanifyAI">
            <Link to="/"><MessageSquare className=" text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="w-full py-1 border-l-[3px] border-l-transparent hover:border-l-fadedWhite pl-[0.65rem] transition-opacity duration-300" title="integrations">
            <Link to="/"><Blocks className=" text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
          <span className="w-full py-1 border-l-[3px] border-l-transparent hover:border-l-fadedWhite pl-[0.65rem] transition-opacity duration-300" title="share">
            <Link to="/"><ExternalLink className=" text-midWhite h-5" strokeWidth={2} /></Link>
          </span>
        </div>
        <button onClick={() => setToggleSidebar(!toggleSidebar)} className="px-1 py-2 group rounded-md" title="share">
          <ArrowRight className=" text-midWhite h-4" strokeWidth={2} />
        </button>
      </div>
    );
  } else {
    return (
      <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setToggleSidebar(false)}>
        <div className="absolute z-20 top-0 l-0 w-60 h-full flex flex-col justify-between items-center pt-6 pb-6 dark:bg-backgroundDark border-[1px] dark:border-faintWhite/5">
        <div className="flex flex-col gap-y-4 items-center w-full">
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group rounded-md" title="home">
            <Link to="/"><House className=" text-midWhite h-4" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite ">Home</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group rounded-md" title="home">
            <Link to="/"><SquareKanban className=" text-midWhite h-4" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite ">Kanban View</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group rounded-md" title="home">
            <Link to="/"><Calendar className=" text-midWhite h-4" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite ">Calendar View</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group rounded-md" title="home">
            <Link to="/"><Funnel className=" text-midWhite h-4" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite ">Fitler</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group rounded-md" title="home">
            <Link to="/"><MessageSquare className=" text-midWhite h-4" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite ">Kanify AI</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group rounded-md" title="home">
            <Link to="/"><Blocks className=" text-midWhite h-4" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite ">Integrations</p>
          </span>
          <span className="flex gap-x-2 items-center w-[90%] px-2 py-2 group rounded-md" title="home">
            <Link to="/"><ExternalLink className=" text-midWhite h-4" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite ">Share Project</p>
          </span>
        </div>
        <button onClick={() => setToggleSidebar(false)} className="flex gap-x-2 items-center w-[90%] px-2 py-2 group rounded-md" title="home">
            <Link to="/"><ArrowLeft className=" text-midWhite h-4" strokeWidth={2} /></Link>
            <p className="text-xs text-midWhite ">Close Sidebar</p>
          </button>
      </div>
      </div>
    );
  }
};

export default Sidebar;
