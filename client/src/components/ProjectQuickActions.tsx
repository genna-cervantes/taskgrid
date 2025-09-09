import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Funnel, KanbanSquare, X } from "lucide-react";
import { trpc } from "@/utils/trpc";
import {
  SetURLSearchParams,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Checkbox } from "./ui/checkbox";
import React, { ReactNode, useEffect, useState } from "react";

const ProjectQuickActions = ({
  taskCategoryOptions,
  setGroupBy,
}: {
  taskCategoryOptions:
    | {
        category: string;
        color: string;
      }[]
    | undefined;
  setGroupBy: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { projectId } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedFilters, setSelectedFilters] = useState({
    priority: searchParams.get("priority")?.split(",") ?? [],
    category: searchParams.get("category")?.split(",") ?? [],
    assignedTo: searchParams.get("assignedTo")?.split(",") ?? [],
  });

  const [selectedGroupBy, setSelectedGroupBy] = useState(localStorage.getItem("groupBy") ?? "progress");

  useEffect(() => {
    // if empty string
    if (searchParams.get("priority") === "") {
      const newParams = new URLSearchParams(searchParams?.toString() || "");
      newParams.delete("priority");
      setSearchParams(newParams);
    }
    if (searchParams.get("category") === "") {
      const newParams = new URLSearchParams(searchParams?.toString() || "");
      newParams.delete("category");
      setSearchParams(newParams);
    }
    if (searchParams.get("assignedTo") === "") {
      const newParams = new URLSearchParams(searchParams?.toString() || "");
      newParams.delete("assignedTo");
      setSearchParams(newParams);
    }

    setSelectedFilters({
      priority: searchParams.get("priority")?.split(",") ?? [],
      category: searchParams.get("category")?.split(",") ?? [],
      assignedTo: searchParams.get("assignedTo")?.split(",") ?? [],
    });
  }, [searchParams]);

  const handleClearFilters = () => {
    setSearchParams({});
  };

  // get task category options
  const { data: usersInProject } = trpc.users.getUsersInProject.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const handleGroupBy = (value: string) => {
    localStorage.setItem("groupBy", value);
    setGroupBy(value);
    setSelectedGroupBy(value);
  };

  return (
    <div className="mb-2 flex gap-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
            <KanbanSquare className="h-3" />
            <p>View: Kanban</p>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 border-none font-jetbrains"
          align="start"
        >
          <DropdownMenuLabel className="text-xs">View By:</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem className="flex justify-between items-center pr-3">
              <div className="flex gap-x-1 h-full items-center">
                  Kanban
              </div>
              <Checkbox />
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between items-center pr-3">
              <div className="flex gap-x-1 h-full items-center">
                  List
              </div>
              <Checkbox />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* GROUP BY */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
            <KanbanSquare className="h-3" />
            <p>Group: {selectedGroupBy.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</p>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 border-none font-jetbrains"
          align="start"
        >
          <DropdownMenuLabel className="text-xs">Group By:</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => handleGroupBy("progress")} className="flex justify-between items-center pr-3">
              <div className="flex gap-x-1 h-full items-center">
                  Progress
              </div>
              <Checkbox checked={selectedGroupBy === "progress"} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGroupBy("priority")} className="flex justify-between items-center pr-3">
              <div className="flex gap-x-1 h-full items-center">
                  Priority
              </div>
              <Checkbox checked={selectedGroupBy === "priority"} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGroupBy("category")} className="flex justify-between items-center pr-3">
              <div className="flex gap-x-1 h-full items-center">
                  Category
              </div>
              <Checkbox checked={selectedGroupBy === "category"} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGroupBy("assignTo")} className="flex justify-between items-center pr-3">
              <div className="flex gap-x-1 h-full items-center">
                  Assign To
              </div>
              <Checkbox checked={selectedGroupBy === "assignTo"} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* FILTER */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
            <Funnel className="h-3" />
            <p>Filter</p>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 border-none font-jetbrains"
          align="start"
        >
          <DropdownMenuLabel className="text-xs">Filter By:</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <FilterOption
                    value={{ filter: "priority", value: "high" }}
                    isSelected={selectedFilters["priority"].includes("high")}
                  >
                    <div className="w-full items-center flex gap-x-2">
                      <div className="flex gap-x-[0.2rem]">
                        <div className={`bg-red-400 h-2 w-[0.15rem]`} />
                        <div className={`bg-red-400 h-2 w-[0.15rem]`} />
                        <div className={`bg-red-400 h-2 w-[0.15rem]`} />
                      </div>
                      High
                    </div>
                  </FilterOption>
                  <FilterOption
                    value={{ filter: "priority", value: "medium" }}
                    isSelected={selectedFilters["priority"].includes("medium")}
                  >
                    <div className="w-full items-center flex gap-x-2">
                      <div className="flex gap-x-[0.15rem]">
                        <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
                        <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
                      </div>
                      Medium
                    </div>
                  </FilterOption>
                  <FilterOption
                    value={{ filter: "priority", value: "low" }}
                    isSelected={selectedFilters["priority"].includes("low")}
                  >
                    <div className="w-full items-center flex gap-x-2">
                      <div className={`bg-green-400 h-2 w-[0.15rem] `} />
                      Low
                    </div>
                  </FilterOption>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            {taskCategoryOptions && taskCategoryOptions.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Category</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="max-h-28 overflow-y-auto super-thin-scrollbar">
                    {taskCategoryOptions.map((tco) => (
                        <React.Fragment key={tco.category}>
                            <FilterOption
                                value={{ filter: "category", value: tco.category }}
                                isSelected={selectedFilters["category"].includes(
                                tco.category
                                )}
                            >
                                <div className="w-full items-center flex gap-x-2">
                                <span
                                    className={`bg-${tco.color}-300/50 h-2 w-2 rounded-full`}
                                ></span>
                                {tco.category}
                                </div>
                            </FilterOption>

                        </React.Fragment>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}
            {usersInProject && usersInProject.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Assign To</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {usersInProject.map((uip) => (
                        <React.Fragment key={uip.username}>
                            <FilterOption
                                value={{ filter: "assignedTo", value: uip.username }}
                                isSelected={selectedFilters["assignedTo"].includes(
                                uip.username
                                )}
                            >
                                {uip.username}
                            </FilterOption>

                        </React.Fragment>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}
            <DropdownMenuItem onClick={handleClearFilters}>
              Clear Filters
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex gap-x-2 overflow-x-auto scrollbar-none">
        {selectedFilters["priority"].length > 0 && (
          <PriorityFilterIndicator
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            selectedPriority={selectedFilters["priority"]}
          />
        )}

        {selectedFilters["category"].length > 0 && (
          <CategoryFilterIndicator
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            selectedCategory={taskCategoryOptions?.filter((c) => selectedFilters['category'].includes(c.category)) ?? []}
          />
        )}

        {selectedFilters["assignedTo"].length > 0 && (
          <AssignedToFilterIndicator
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            selectedAssignedTo={selectedFilters['assignedTo']}
          />
        )}
    
      </div>
    </div>
  );
};

const AssignedToFilterIndicator = ({
  selectedAssignedTo,
  setSearchParams,
  searchParams,
}: {
  selectedAssignedTo: string[];
  setSearchParams: SetURLSearchParams;
  searchParams: URLSearchParams;
}) => {
  const handleClose = (value: string) => {
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    let newParamsValue = selectedAssignedTo.filter((sat) => sat != value)
    newParams.set("assignedTo", newParamsValue.join(","));
    setSearchParams(newParams);
    return;
  };

  return (
    <div className="text-xxs border shrink-0 border-faintWhite rounded-md h-full flex gap-x-1 pl-2 items-center">
      <p className="pr-1">Assigned To:</p>
      {selectedAssignedTo.map((sat) => (
        <div key={sat} className="flex gap-x-1 h-full items-center ml-1 rounded-tr-md rounded-br-md border-r border-faintWhite">
          {sat}
          {/* <div className="h-full w-[2px] py-0 bg-faintWhite ml-1"></div> */}
          <button
            onClick={() => handleClose(sat)}
            className=" text-red-400 border-faintWhite h-full"
          >
            <X className="h-3" strokeWidth={4} />
          </button>
        </div>
      ))}
    </div>
  );
};

const CategoryFilterIndicator = ({
  selectedCategory,
  setSearchParams,
  searchParams,
}: {
  selectedCategory: { category: string; color: string }[];
  setSearchParams: SetURLSearchParams;
  searchParams: URLSearchParams;
}) => {
  const handleClose = (value: string) => {
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    let newParamsValue = selectedCategory.filter((sc) => sc.category != value ? sc.category : null).map((sc) => sc.category);
    newParams.set("category", newParamsValue.join(","));
    setSearchParams(newParams);
    return;
  };

  return (
    <div className="text-xxs border shrink-0 border-faintWhite rounded-md h-full flex gap-x-1 pl-2 items-center">
      <p className="pr-1">Category:</p>
      {selectedCategory.map((sc) => (
        <div key={sc.category} className="flex gap-x-1 h-full items-center ml-1 rounded-tr-md rounded-br-md border-r border-faintWhite">
          <span className={`bg-${sc.color}-300/50 h-2 w-2 rounded-full`}></span>
          {sc.category}
          {/* <div className="h-full w-[2px] py-0 bg-faintWhite ml-1"></div> */}
          <button
            onClick={() => handleClose(sc.category)}
            className=" text-red-400 border-faintWhite h-full"
          >
            <X className="h-3" strokeWidth={4} />
          </button>
        </div>
      ))}
    </div>
  );
};

const PriorityFilterIndicator = ({
  selectedPriority,
  setSearchParams,
  searchParams,
}: {
  selectedPriority: string[];
  setSearchParams: SetURLSearchParams;
  searchParams: URLSearchParams;
}) => {
  const handleClose = (value: string) => {
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    let newParamsValue = selectedPriority.filter((sp) => sp != value);
    newParams.set("priority", newParamsValue.join(","));
    setSearchParams(newParams);
    return;
  };

  return (
    <div className="text-xxs border shrink-0 border-faintWhite rounded-md h-full flex gap-x-1 pl-2 items-center">
      <p className="pr-1">Priority:</p>
      {selectedPriority.includes("low") && (
        <div className="flex gap-x-1 h-full items-center rounded-tr-md rounded-br-md border-r border-faintWhite">
          <div className={`bg-green-400 h-2 w-[0.15rem]`} />
          low
          {/* <div className="h-full w-[2px] py-0 bg-faintWhite ml-1"></div> */}
          <button
            onClick={() => handleClose("low")}
            className=" text-red-400 border-faintWhite h-full"
          >
            <X className="h-3" strokeWidth={4} />
          </button>
        </div>
      )}
      {selectedPriority.includes("medium") && (
        <div className="flex gap-x-1 h-full items-center ml-1 rounded-tr-md rounded-br-md border-r border-faintWhite">
          <div className="flex gap-x-[0.15rem]">
            <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
            <div className={`bg-orange-400 h-2 w-[0.15rem]`} />
          </div>
          medium
          {/* <div className="h-full w-[2px] py-0 bg-faintWhite ml-1"></div> */}
          <button
            onClick={() => handleClose("medium")}
            className=" text-red-400 border-faintWhite h-full"
          >
            <X className="h-3" strokeWidth={5} />
          </button>
        </div>
      )}
      {selectedPriority.includes("high") && (
        <div className="flex gap-x-1 h-full items-center ml-1">
          <div className="flex gap-x-[0.2rem]">
            <div className={`bg-red-400 h-2 w-[0.15rem]`} />
            <div className={`bg-red-400 h-2 w-[0.15rem]`} />
            <div className={`bg-red-400 h-2 w-[0.15rem]`} />
          </div>
          high
          {/* <div className="h-full w-[2px] py-0 bg-faintWhite ml-1"></div> */}
          <button
            onClick={() => handleClose("high")}
            className=" text-red-400 border-faintWhite h-full"
          >
            <X className="h-3" strokeWidth={5} />
          </button>
        </div>
      )}
    </div>
  );
};

const FilterOption = ({
  isSelected,
  value,
  children,
}: {
  isSelected: boolean;
  value: {
    filter: string;
    value: string;
  };
  children: ReactNode;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleToggle = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    value: { filter: string; value: string }
  ) => {
    e.preventDefault();

    const prevParams = searchParams.get(value.filter)?.split(",") ?? [];
    const newParams = new URLSearchParams(searchParams?.toString() || "");

    if (prevParams.includes(value.value)) {
      let newParamsValue = prevParams.filter((pp) => pp != value.value);
      newParams.set(value.filter, newParamsValue.join(","));
      setSearchParams(newParams);
      return;
    }

    let newParamsValue = prevParams.length > 0
      ? `${prevParams},${value.value}`
      : value.value;

    newParams.set(value.filter, newParamsValue);
    setSearchParams(newParams);
  };

  return (
    <DropdownMenuItem
      className="flex justify-between items-center"
      onClick={(e) => handleToggle(e, value)}
    >
      {children}
      <Checkbox checked={isSelected} className=" border-midWhite" />
    </DropdownMenuItem>
  );
};

export default ProjectQuickActions;
