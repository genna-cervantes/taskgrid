import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  Calendar,
  ExternalLink,
  Funnel,
  House,
  LucideProps,
  MessageSquare,
  SquareKanban,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import kanifyLogo from "/kanify_logo.png";
import { motion } from "framer-motion";
import Mousetrap from "mousetrap";
import MultiSelect from "./MultiSelect";
import { priorityLevels } from "./AddTaskForm";
import { trpc } from "@/utils/trpc";

const Sidebar = () => {
  const { projectId } = useParams();
  const navigate = useNavigate()

  const navItems = [
    {
      icon: SquareKanban,
      name: "Kanban",
      func: function (){
        setActiveIndex(0)
        navigate(`/projects/${projectId}`)
        setToggleSidebar(false)
      }
    },
    {
      icon: Calendar,
      name: "Calendar",
      func: function (){
        setActiveIndex(1)
        navigate(`/calendar/${projectId}`)
      }
    },
    {
      icon: Funnel,
      name: "Filter",
      func: function (){
        setActiveIndex(2)
        setToggleSidebar(!toggleSidebar)
      }
    },
    {
      icon: MessageSquare,
      name: "KanifyAI",
      func: function (){
        setActiveIndex(3)
        navigate(`/ai/${projectId}`)
      }
    },
    {
      icon: Blocks,
      name: "Integrations",
      func: function (){
        setActiveIndex(4)
        navigate(`/integrations/${projectId}`)
      }
    },
    {
      icon: ExternalLink,
      name: "Share",
      func: function (){
        setActiveIndex(5)
        navigate(`/external/${projectId}`)
      }
    },
  ];
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // default set to location // if may serach params
  const view = searchParams.get("view") ?? "kanban"
  
  const [activeIndex, setActiveIndex] = useState(navItems.findIndex((n) => n.name.toLowerCase() === view.toLowerCase()));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorTop, setIndicatorTop] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const [isActive, setIsActive] = useState<string>("Kanban");
  
  const [priorityFilter, setPriorityFilter] = useState<{id: string, title: string}[]>(searchParams.get("priority") && searchParams.get("priority") !== "" ? [{id: searchParams.get("priority") ?? "", title: searchParams.get("priority") ?? ""}] : [])
  const [assignedToFilter, setAssignedToFilter] = useState<{id: string, title: string}[]>(searchParams.get("assignedTo") && searchParams.get("assignedTo") !== "" ? [{id: searchParams.get("assignedTo") ?? "", title: searchParams.get("assignedTo") ?? ""}] : [])
  const [categoryFilter, setCategoryFilter] = useState<{id: string, title: string}[]>(searchParams.get("category") && searchParams.get("category") !== "" ? [{id: searchParams.get("category") ?? "", title: searchParams.get("category") ?? ""}] : [])

  const {data: usersInProject, isLoading: usersInProjectIsLoading} = trpc.getUsersInProject.useQuery({id: projectId ?? ""}, {enabled: !!projectId})
  const {data: taskCategoryOptions, isLoading: taskCategoryOptionsIsLoading} = trpc.getTaskCategoryOptions.useQuery({projectId: projectId ?? ""}, {enabled: !!projectId})

  useEffect(() => {
    const index = hoveredIndex ?? activeIndex;
    if (index !== -1 && itemRefs.current[index]) {
      const el = itemRefs.current[index];
      if (el) {
        setIndicatorTop(el.offsetTop);
      }
    }
  }, [hoveredIndex, activeIndex]);
  
  const handleApplyFilter = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();

    const newParams = new URLSearchParams(searchParams?.toString());

    const chosenFilters = [
      {key: "view", value: "Filter"},
      {key: "priority", value: priorityFilter.map((f) => f.title).join(",")},
      {key: "category", value: categoryFilter.map((f) => f.title).join(",")},
      {key: "assignedTo", value: assignedToFilter.map((f) => f.title).join(",")}
    ]
  
    chosenFilters.forEach(({ key, value }) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
  
    setSearchParams(newParams);
    setToggleSidebar(false);
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, item: {
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
    name: string;
    func: () => void;
}) => {
    e.stopPropagation();
    setIsActive(item.name);
    item.func()
  }

  useEffect(() => {
    Mousetrap.bind("esc", function (e) {
      e.preventDefault();
      setToggleSidebar(false);
    });

    return () => {
      Mousetrap.unbind("esc");
    };
  }, []);

  return (
    <div className="relative z-20">
      {/* Backdrop */}
      {toggleSidebar && (
        <div
          onClick={() => {
            setToggleSidebar(false)
            // setForceActive("")
          }}
          className="fixed inset-0 bg-black/50 transition-opacity duration-200"
        />
      )}
      <div
        className={`transition-all duration-200 ${
          !toggleSidebar
            ? "absolute left-0 top-0 z-20 w-[3.25rem] h-full flex flex-col items-center pt-4 pb-6 dark:bg-backgroundDark border-[1px] dark:border-faintWhite/5"
            : "absolute z-20 top-0 l-0 w-64 h-full flex flex-col items-start pt-4 pb-6 dark:bg-backgroundDark border-[1px] dark:border-faintWhite/5"
        }`}
      >
        {!toggleSidebar && (
          <div className="transition-all duration-200 w-full">
            <button className="h-6 mb-6 w-full flex justify-center" title="share">
              <img src={kanifyLogo} />
            </button>

            <div className="relative flex flex-col items-center w-full">
              {/* Sliding indicator */}
              {activeIndex !== -1 && (
                <motion.div
                  className="absolute left-0 top-2 w-[0.2rem] bg-fadedWhite rounded-tr-sm rounded-br-sm"
                  animate={{
                    top: indicatorTop // `${(hoveredIndex ?? activeIndex) * 52}px`,
                  }}
                  transition={{ type: "tween", stiffness: 300, damping: 0 }}
                  style={{ height: "24px" }}
                />
              )}

              {/* Sidebar nav items */}
              {navItems.map((item, index) => {
                const Icon = item.icon;

                return (                  
                    <button
                      key={item.name}
                      title={item.name}
                      onClick={(e) => handleClick(e, item)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      ref={(el) => (itemRefs.current[index] = el)}
                      className="relative w-full flex justify-center h-12 group/nav items focus:ring-0 focus:border-none focus:outline-none"
                    >
                      <Icon
                        className={`h-5 w-5 transition-colors duration-300 group-hover/nav:text-white group-focus/nav:text-white ${
                          activeIndex === index
                            ? "text-white"
                            : "text-midWhite"
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                );
              })}
            </div>

            <button
              onClick={() => setToggleSidebar(!toggleSidebar)}
              className="px-1 py-2 group rounded-md text-midWhite hover:text-white bottom-4 fixed left-2"
              title="share"
            >
              <ArrowRight className="h-4" strokeWidth={2} />
            </button>
          </div>
        )}

        {toggleSidebar && (
          <div className="transition-all duration-200 w-full">
            <button className="h-6 w-6 mb-6 flex gap-x-3 mx-4" title="share">
              <img src={kanifyLogo} />
              <p>Taskan</p>
            </button>

            <div className="relative flex flex-col items-start w-full">
              {/* Sliding indicator */}
              {activeIndex !== -1 && (
                <motion.div
                  className="absolute left-0 top-2 w-[0.2rem] bg-fadedWhite rounded-tr-sm rounded-br-sm"
                  animate={{
                    top: indicatorTop,
                  }}
                  transition={{ type: "tween", stiffness: 300, damping: 0 }}
                  style={{ height: "24px" }}
                />
              )}

              {/* Sidebar nav items */}
              {navItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <>
                    <button
                      key={item.name}
                      title={item.name}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={(e) => handleClick(e, item)}
                      ref={(el) => (itemRefs.current[index] = el)}
                      className="relative w-full flex mx-4 h-12 gap-x-2 group/nav"
                    >
                      <Icon
                        className={`h-5 w-5 transition-colors duration-300 group-hover/nav:text-white ${
                          activeIndex === index
                            ? "text-white"
                            : "text-midWhite"
                        }`}
                        strokeWidth={2}
                      />
                      <p
                        className={`text-xs pt-[2px] group-hover/nav:text-white ${
                          activeIndex === index
                            ? "text-white"
                            : "text-midWhite"
                        }`}
                      >
                        {item.name}
                      </p>
                    </button>
                    {isActive === "Filter" && item.name === "Filter" && <div className="w-full flex flex-col gap-y-3 mb-6 px-5">
                      <div className="w-full flex flex-col">
                        <p className="text-xs font-rubik text-midWhite">Priority:</p>
                        <MultiSelect value={priorityFilter} setValue={setPriorityFilter} placeholder="Choose priority" choices={priorityLevels.map((v) => ({id: v, title: v}))} />
                      </div>

                      <div className="w-full flex flex-col">
                        <p className="text-xs font-rubik text-midWhite">Assigned To:</p>
                        <MultiSelect value={assignedToFilter} setValue={setAssignedToFilter} placeholder="Choose assigned to" choices={usersInProjectIsLoading || !usersInProject ? [] : usersInProject?.map((u) => ({id: u.username, title: u.username}))} />
                      </div>

                      <div className="w-full flex flex-col">
                        <p className="text-xs font-rubik text-midWhite">Category:</p>
                        <MultiSelect value={categoryFilter} setValue={setCategoryFilter} placeholder="Choose category" choices={taskCategoryOptionsIsLoading || !taskCategoryOptions ? [] : taskCategoryOptions?.map((t) => ({id: t.category, title: t.category}))} />
                      </div>

                      <button onClick={(e) => handleApplyFilter(e)} className="text-xs w-full py-2 bg-light flex justify-center rounded-md">Apply Filters</button>
                      {(priorityFilter.length > 0 || assignedToFilter.length > 0) && <button onClick={(e) => handleApplyFilter(e)} className="text-xs w-full py-2 bg-red-400 flex justify-center rounded-md">Clear Filters</button>}
                    </div>
                    }
                  </>
                );
              })}
            </div>

            <button
              onClick={() => setToggleSidebar(!toggleSidebar)}
              className="px-1 mx-2 flex gap-x-2 py-2 group rounded-md text-midWhite hover:text-white bottom-4 fixed"
              title="share"
            >
              <ArrowLeft className="h-4" strokeWidth={2} />
              <p className="text-xs">Close Sidebar</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
