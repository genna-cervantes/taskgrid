import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Blocks,
  BookText,
  CircleUserRound,
  ExternalLink,
  FolderClosed,
  Funnel,
  Inbox,
  LucideProps,
  Mail,
  MailPlus,
  MessageSquare,
  SidebarClose,
  SidebarOpen,
  SquareKanban,
  Waypoints,
  Workflow,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import kanifyLogo from "/kanify_logo.png";
import { motion } from "framer-motion";
import Mousetrap from "mousetrap";
import MultiSelect from "./MultiSelect";
import { priorityLevels } from "./AddTaskForm";
import { trpc } from "@/utils/trpc";
import { useUserContext } from "@/contexts/UserContext";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";
import { nanoid } from "nanoid";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const Sidebar = ({
  toggleSidebar,
  toggleAIChat,
  setToggleSidebar,
  setToggleAIChat,
}: {
  toggleSidebar: boolean;
  toggleAIChat: boolean;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  setToggleAIChat: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const userContext = useUserContext();

  let location = useLocation();
  const path = location.pathname;

  const isInProject = path.includes("/projects/");
  // const isInWorkspaceOnly = path.startsWith('/workspaces/') && !isInProject;

  let parent = isInProject ? "projects" : "workspaces";

  const ALL_NAV_ITEMS = [
    {
      parent: "workspaces",
      icon: FolderClosed,
      name: "Workspaces",
      func: function () {
        // setActiveIndex(0)
        navigate(`/workspaces/${workspaceId}`);
        setActiveIndex(0);
        if (!toggleSidebar) setToggleSidebar((prev) => !prev);
      },
    },
    {
      parent: "workspaces",
      icon: CircleUserRound,
      name: "Profile",
      func: function () {
        // setActiveIndex(0)
        setActiveIndex(1);
        navigate(`/profile`);
        // setToggleSidebar(())
      },
    },
    {
      parent: "projects",
      icon: BookText,
      name: "General",
      func: function () {
        setActiveIndex(0);
        navigate(`workspaces/${workspaceId}/projects/${projectId}/manage`);
        setToggleSidebar(false);
      },
    },
    {
      parent: "projects",
      icon: Inbox,
      name: "Triage",
      func: function () {
        setActiveIndex(1);
        navigate(`workspaces/${workspaceId}/projects/${projectId}/triage`);
        setToggleSidebar(false);
      },
    },
    {
      parent: "projects",
      icon: SquareKanban,
      name: "Kanban",
      func: function () {
        setActiveIndex(2);
        navigate(`workspaces/${workspaceId}/projects/${projectId}/board`);
        setToggleSidebar(false);
      },
    },
    // {
    //   parent: "projects",
    //   icon: MailPlus,
    //   name: "Inbox",
    //   func: function () {
    //     setActiveIndex(3);
    //     navigate(`workspaces/${workspaceId}/projects/${projectId}/inbox`);
    //   },
    // },
    // {
    //   parent: "projects",
    //   icon: Funnel,
    //   name: "Filter",
    //   func: function () {
    //     setActiveIndex(2);
    //     if (!toggleSidebar) setToggleSidebar(true);
    //   },
    // },
    // {
    //   parent: "projects",
    //   icon: MessageSquare,
    //   name: "Taskan AI",
    //   func: function () {
    //     setActiveIndex(3);
    //     setToggleAIChat(prev => !prev)
    //   },
    // },
    // {
    //   parent: "projects",
    //   icon: Blocks,
    //   name: "Integrations",
    //   func: function () {
    //     setActiveIndex(4);
    //     navigate(
    //       `workspaces/${workspaceId}/projects/${projectId}?view=Integrations`
    //     );
    //   },
    // },
    // {
    //   parent: "projects",
    //   icon: Blocks,
    //   name: "Integrations",
    //   func: function () {
    //     setActiveIndex(3);
    //     navigate(`workspaces/${workspaceId}/projects/${projectId}/integrations`);
    //   },
    // },
    // {
    //   parent: "projects",
    //   icon: ExternalLink,
    //   name: "Share",
    //   func: function () {
    //     setActiveIndex(4);
    //   },
    // },
  ];

  let navItems = isInProject
    ? ALL_NAV_ITEMS.filter((n) => n.parent === "projects")
    : ALL_NAV_ITEMS.filter((n) => n.parent !== "projects");

  const [searchParams, setSearchParams] = useSearchParams();

  // default set to location // if may serach params
  const view = path.split("/")[5] ?? "kanban";  

  useEffect(() => {
    setActiveIndex(
      navItems.findIndex(
        (n) =>
          // isInProject
          n.name.toLowerCase() === view.toLowerCase()
        // : n.name.toLowerCase() === parent
      )
    );
  }, [path]);

  const [activeIndex, setActiveIndex] = useState(
    navItems.findIndex(
      (n) =>
        // isInProject
        n.name.toLowerCase() === view.toLowerCase()
      // : n.name.toLowerCase() === parent
    )
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorTop, setIndicatorTop] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [isActive, setIsActive] = useState<string>("Kanban");

  const [priorityFilter, setPriorityFilter] = useState<
    { id: string; title: string }[]
  >(
    searchParams.get("priority") && searchParams.get("priority") !== ""
      ? [
          {
            id: searchParams.get("priority") ?? "",
            title: searchParams.get("priority") ?? "",
          },
        ]
      : []
  );
  const [assignedToFilter, setAssignedToFilter] = useState<
    { id: string; title: string }[]
  >(
    searchParams.get("assignedTo") && searchParams.get("assignedTo") !== ""
      ? [
          {
            id: searchParams.get("assignedTo") ?? "",
            title: searchParams.get("assignedTo") ?? "",
          },
        ]
      : []
  );
  const [categoryFilter, setCategoryFilter] = useState<
    { id: string; title: string }[]
  >(
    searchParams.get("category") && searchParams.get("category") !== ""
      ? [
          {
            id: searchParams.get("category") ?? "",
            title: searchParams.get("category") ?? "",
          },
        ]
      : []
  );

  // queries
  const { data: userWorkspaces, isLoading: userWorkspacesIsLoading } =
    trpc.workspaces.getUserWorkspaces.useQuery(
      { username: userContext.username ?? "" },
      { enabled: !!userContext.username }
    );

  // mutations
  const insertWorkspace = trpc.workspaces.insertWorkspace.useMutation({
    onSuccess: (data) => {
      // update user context

      utils.workspaces.getUserWorkspaces.invalidate();
      navigate(`/workspaces/${data.workspaceId}`);
    },
  });

  useEffect(() => {
    const index = hoveredIndex ?? activeIndex;
    if (index !== -1 && itemRefs.current[index]) {
      const el = itemRefs.current[index];
      if (el) {
        setIndicatorTop(el.offsetTop);
      }
    }
  }, [hoveredIndex, activeIndex]);

  const handleApplyFilter = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();

    const newParams = new URLSearchParams(searchParams?.toString());

    const chosenFilters = [
      { key: "view", value: "Filter" },
      { key: "priority", value: priorityFilter.map((f) => f.title).join(",") },
      { key: "category", value: categoryFilter.map((f) => f.title).join(",") },
      {
        key: "assignedTo",
        value: assignedToFilter.map((f) => f.title).join(","),
      },
    ];

    chosenFilters.forEach(({ key, value }) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    setSearchParams(newParams);
    setToggleSidebar(false);
  };

  const handleClearFilter = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    setSearchParams({});
    setToggleSidebar(false);
  };

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    item: {
      icon: React.ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
      >;
      name: string;
      func: () => void;
    }
  ) => {
    e.stopPropagation();
    setIsActive(item.name);
    item.func();
  };

  const handleAddWorkspace = () => {
    if (!userContext.username) return;

    const newWorkspaceName = () =>
      `${uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: "-",
        style: "lowerCase",
      })}-workspace`;
    const newWorkspaceId = nanoid(10);

    insertWorkspace.mutate({
      username: userContext.username,
      workspaceId: newWorkspaceId,
      workspaceName: newWorkspaceName(),
    });
  };

  const handleChangeWorkspace = (workspaceId: string) => {
    userContext.setCurrentWorkspace(workspaceId);
    navigate(`/workspaces/${workspaceId}`);
  };

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
    <div
      className={`transition-all h-full duration-200 pt-4 pb-6 ${
        !toggleSidebar
          ? "left-0 top-0 w-[3.25rem] flex flex-col items-center"
          : " top-0 l-0 w-[13.5rem] flex flex-col items-start "
      }`}
    >
      {!toggleSidebar && (
        <div className="transition-all duration-200 w-full">
          <Link
            to="/"
            className="h-6 mb-6 w-full flex justify-center"
            title="share"
          >
            <img src={kanifyLogo} />
          </Link>

          <div className="relative flex flex-col items-center w-full">
            {/* Sliding indicator */}
            {activeIndex !== -1 && (
              <motion.div
                className="absolute left-0 top-2 w-[0.2rem] bg-fadedWhite rounded-tr-sm rounded-br-sm"
                animate={{
                  top: indicatorTop, // `${(hoveredIndex ?? activeIndex) * 52}px`,
                }}
                transition={{ type: "tween", stiffness: 300, damping: 0 }}
                style={{ height: "22px" }}
              />
            )}

            {/* Sidebar nav items */}
            {navItems
              .filter((i) => i.parent === parent)
              .map((item, index) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.name}
                    title={item.name}
                    onClick={(e) => handleClick(e, item)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    className="relative w-full flex justify-center h-11 group/nav items focus:ring-0 focus:border-none focus:outline-none"
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors duration-300 group-hover/nav:text-white group-focus/nav:text-white ${
                        activeIndex === index ? "text-white" : "text-midWhite"
                      }`}
                      strokeWidth={3}
                    />
                  </button>
                );
              })}
          </div>

          <button
            onClick={() => setToggleSidebar(!toggleSidebar)}
            className="px-2 py-2 group rounded-md text-midWhite hover:text-white bottom-4 fixed left-2"
            title="share"
          >
            <SidebarOpen className="h-5" strokeWidth={2} />
          </button>
        </div>
      )}

      {toggleSidebar && (
        <div className="transition-all duration-200 w-full">
          <button onClick={() => navigate("/")} className="h-6 w-6 mb-6 flex gap-x-3 mx-4 hover:cursor-pointer" title="home">
            <img src={kanifyLogo} />
            <p className="font-bold">Taskan</p>
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
                style={{ height: "22px" }}
              />
            )}

            {/* Sidebar nav items */}
            {navItems
              .filter((i) => i.parent === parent)
              .map((item, index) => {
                const Icon = item.icon;

                return (
                  <React.Fragment key={item.name}>
                    <button
                      title={item.name}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={(e) => handleClick(e, item)}
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      className="relative w-full flex items-start mx-4 h-11 gap-x-2 group/nav"
                    >
                      <div className="flex items-center gap-x-2">
                        <Icon
                          className={`h-4 w-4 transition-colors duration-300 group-hover/nav:text-white ${
                            activeIndex === index
                              ? "text-white"
                              : "text-midWhite"
                          }`}
                          strokeWidth={3}
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
                      </div>
                    </button>

                            
                    {isActive === "Workspaces" &&
                      item.name === "Workspaces" && (
                        <div className="w-full flex flex-col gap-y-3 mb-6 px-5">
                          <div className="w-full flex flex-col">
                            <p className="text-xs font-rubik text-midWhite">
                              Workspace:
                            </p>
                            <Select onValueChange={handleChangeWorkspace}>
                              <SelectTrigger className="w-full text-xs border-none truncate bg-transparent shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] px-0 placeholder:text-faintWhite justify-between hover:bg-transparent">
                                Choose a workspace
                              </SelectTrigger>
                              <SelectContent className="flex px-1 flex-col w-[var(--radix-select-trigger-width)] gap-y-1 overflow-y-scroll max-h-60 super-thin-scrollbar py-2 dark:bg-[#1A1A1A] font-jetbrains text-xs focus:outline-none focus:ring-0 focus:border-transparent border-none">
                                {/* userWorkspacesIsLoading */}
                                {userWorkspacesIsLoading ? (
                                  <p>Loading...</p>
                                ) : (
                                  userWorkspaces?.map((w) => (
                                    <SelectItem
                                      key={w.workspaceId}
                                      value={w.workspaceId}
                                      className={`hover:bg-light w-full hover:cursor-pointer px-1 ${
                                        workspaceId === w.workspaceId
                                          ? "bg-light"
                                          : ""
                                      }`}
                                    >
                                      {w.name}
                                    </SelectItem>
                                  ))
                                )}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={handleAddWorkspace}
                                        disabled={
                                          userContext.isGuest &&
                                          (userWorkspaces?.length ?? 0) >= 1
                                        }
                                        className="px-1 py-2 hover:bg-light rounded-md w-full mt-3 disabled:bg-opacity-50 disabled:cursor-not-allowed"
                                      >
                                        + Add Workspace
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-backgroundDark text-fadedWhite mb-1">
                                      <p>Guests get 1 workspace only</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                  </React.Fragment>
                );
              })}

            {}
          </div>

          <button
            onClick={() => setToggleSidebar(!toggleSidebar)}
            className="px-1 mx-2 flex items-center gap-x-2 py-2 group rounded-md text-midWhite hover:text-white bottom-4 fixed"
            title="share"
          >
            <SidebarClose className="h-5" strokeWidth={2} />
            <p className="text-xs">Close Sidebar</p>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
