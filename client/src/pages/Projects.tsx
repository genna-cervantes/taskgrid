import { useContext, useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import UserNameModal from "../components/UserNameModal";
import LinkCopiedModal from "../components/LinkCopiedModal";
import TaskActionToast from "../components/TaskActionToast";
import { ActionContext } from "../contexts/ActionContext";
import { trpc } from "../utils/trpc";
import { groupTasksByColumn } from "../utils/utils";
import { useGuestId } from "../contexts/UserContext";
import useDeviceDetect from "../hooks/useDeviceDetect";
import LoadingModal from "../components/LoadingModal";
import Sidebar from "../components/Sidebar";

const Projects = () => {
  // pag share = true mag jjoin siya ndi kanya so hingin agad ung name
  // pag galing sa home walang share = true so wag na hingin agad ung name

  // UNG SA KAGAYA SA SE NA DAPAT GALING FROM THAT LINK KUNIN UNG STATE IF NDI HINGIN NA AGAD UNG NAME IF WALA NAKASET KASI SHARED UN
  const location = useLocation();
  const fromHome = location.state?.from === "home"; // tracks ownership
  let isOwnBoard = true;

  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!projectId) {
    navigate("/");
    return;
  }

  const userContext = useGuestId();

  const { data: projects, isLoading: projectsIsLoading } =
    trpc.getUserProjects.useQuery({ guestId: userContext.guestId ?? "" });

  if (!projects?.some((p) => p.id === projectId)) {
    isOwnBoard = false;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const priority = searchParams.get("priority") || "";
  const assignedTo = searchParams.get("assignedTo") || "";

  const [usernameModal, setUsernameModal] = useState(false);
  const [linkCopiedModal, setLinkCopiedModal] = useState(false);
  const [filter, setFilter] = useState({
    priority: priority,
    assignedTo: assignedTo,
  });

  const actionContext = useContext(ActionContext);
  const { isMobile } = useDeviceDetect();

  const isFilterEnabled = priority !== "" || assignedTo !== "";

  const { data, isLoading } = trpc.getTasks.useQuery({ id: projectId });
  const { data: filteredTasks, isLoading: filteredTasksIsLoading } =
    trpc.filterTask.useQuery(
      {
        id: projectId,
        priority,
        assignedTo,
      },
      {
        enabled: isFilterEnabled,
      }
    );

  const columns = isFilterEnabled
    ? filteredTasks && !filteredTasksIsLoading
      ? groupTasksByColumn(filteredTasks)
      : {}
    : data && !isLoading
      ? groupTasksByColumn(data)
      : {};

  const { data: usersInProject, isLoading: usersLoading } =
    trpc.getUsernamesInProject.useQuery({
      id: projectId,
    });

  const { data: username, isLoading: usernameIsLoading } =
    trpc.getUsername.useQuery({
      id: projectId,
      guestId: userContext.guestId ?? "",
    });
  const { data: projectName } = trpc.getProjectNameByKey.useQuery({
    id: projectId,
  });

  // if guest id is not registered to project
  useEffect(() => {
    if (
      !projectsIsLoading &&
      !isOwnBoard &&
      !fromHome &&
      !usernameIsLoading &&
      (!username || username === "")
    ) {
      setUsernameModal(true);
    } else {
      setUsernameModal(false);
    }
  }, [fromHome, username, usernameIsLoading, projectsIsLoading]);

  // helper functions
  const handleShare = async () => {
    if (!username) {
      setUsernameModal(true);
      return;
    }

    setLinkCopiedModal(true);
  };

  const handleFilterChange = (
    filters: { key: string; value: string | undefined }[]
  ) => {
    const newParams = new URLSearchParams(searchParams?.toString());

    filters.forEach(({ key, value }) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    setSearchParams(newParams);
  };

  const handleApplyFilter = () => {
    handleFilterChange([
      { key: "priority", value: filter.priority },
      { key: "assignedTo", value: filter.assignedTo },
    ]);
  };

  const handleClearFilter = () => {
    setFilter({
      priority: "",
      assignedTo: "",
    });

    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams?.toString());
      newParams.delete("priority");
      newParams.delete("assignedTo");
      return newParams;
    });
  };

  // need loading screen
  if (
    userContext.isLoading &&
    userContext.guestId == null &&
    !userContext.guestId
  ) {
    return <>Loading Guest ID...</>;
  }

  return (
    <>
      {(projectsIsLoading || usernameIsLoading) && <LoadingModal />}
      {linkCopiedModal && (
        <LinkCopiedModal setLinkCopiedModal={setLinkCopiedModal} />
      )}
      {usernameModal && (
        <UserNameModal
          fromHome={fromHome}
          projectId={projectId}
          setUsernameModal={setUsernameModal}
        />
      )}
      {/* {openSidebar && <Sidebar setOpenSidebar={setOpenSidebar} />} */}
      {/* sidebar */}
      <div className="h-full flex">
        {/* sidebar */}
        <Sidebar />
        <div className="ml-[3.25rem] h-full flex flex-col overflow-y-hidden">
          <div className="relative flex items-center pt-4 md:py-3 px-6">
            {/* Three-column layout with grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 w-full items-center">
              {/* Left side */}
              <div className="max-w-[300px] truncate font-noto">
                <h1 className="truncate text-ellipsis overflow-hidden hidden md:flex font-bold whitespace-nowrap">
                  {projectName}
                </h1>
              </div>

              {/* Center filter - Now properly centered */}
              <div className="hidden md:hidden justify-center font-noto">
                <div className="dark:bg-backgroundDark border-[1px] dark:border-faintWhite/5 border-faintBlack/5 bg-lmMidBackground px-3 py-[0.4rem] rounded-md flex items-center gap-x-3 text-xs">
                  <h1 className="text-xs whitespace-nowrap">Filter by:</h1>
                  <div className="flex gap-x-2">
                    <select
                      name="priorityFilter"
                      className="text-xs dark:bg-backgroundDark bg-lmMidBackground w-20"
                      onChange={(e) =>
                        setFilter((prevFilter) => ({
                          ...prevFilter,
                          priority: e.target.value,
                        }))
                      }
                      value={filter.priority}
                    >
                      <option value="">priority</option>
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                    <select
                      name="assignedToFilter"
                      className="text-xs dark:bg-backgroundDark bg-lmMidBackground w-24"
                      onChange={(e) =>
                        setFilter((prevFilter) => ({
                          ...prevFilter,
                          assignedTo: e.target.value,
                        }))
                      }
                      value={filter.assignedTo}
                    >
                      <option value="">assigned to</option>
                      {!usersLoading &&
                        usersInProject?.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-x-2">
                    <button
                      onClick={handleApplyFilter}
                      className="bg-green-400 text-fadedWhite px-3 py-[0.2rem] rounded-md font-semibold disabled:opacity-50 whitespace-nowrap"
                      disabled={
                        filter.priority === "" && filter.assignedTo === ""
                      }
                    >
                      Apply
                    </button>
                    {(priority !== "" || assignedTo !== "") && (
                      <button
                        onClick={handleClearFilter}
                        className="bg-red-400 text-fadedWhite px-3 py-[0.2rem] rounded-md font-semibold whitespace-nowrap"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex justify-end hidden gap-x-4 items-center font-noto">
                <h1 className="text-sm md:text-base truncate">{username}</h1>
                <button
                  onClick={handleShare}
                  className="px-1 md:px-3 py-1 rounded-md text-white bg-green-400 text-xs md:text-sm font-bold cursor-pointer"
                >
                  {isMobile ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-square-arrow-out-up-right-icon lucide-square-arrow-out-up-right"
                    >
                      <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
                      <path d="m21 3-9 9" />
                      <path d="M15 3h6v6" />
                    </svg>
                  ) : (
                    "Share"
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="w-full flex justify-center">
            <h1 className="truncate text-ellipsis overflow-hidden md:hidden">
              {projectName}
            </h1>
          </div>
          <div className="w-full flex justify-center">
            <div className="flex flex-wrap dark:bg-backgroundDark bg-lmMidBackground border-[1px] dark:border-faintWhite/5 border-faintBlack/5 px-3 my-3 py-2 rounded-md md:hidden items-center gap-x-2 gap-y-2 text-xs">
              <h1 className="text-xs mr-1">Filter by:</h1>

              {/* Priority filter - with fixed width */}
              <div className="relative w-20">
                <select
                  name="priorityFilter"
                  className="w-full appearance-none dark:bg-backgroundDark bg-lmMidBackground rounded px-2 py-1"
                  onChange={(e) =>
                    setFilter((prevFilter) => ({
                      ...prevFilter,
                      priority: e.target.value,
                    }))
                  }
                  value={filter.priority}
                >
                  <option value="">priority</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1">
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Assigned to filter - with fixed width */}
              <div className="relative w-24">
                <select
                  name="assignedToFilter"
                  className="w-full appearance-none dark:bg-backgroundDark bg-lmMidBackground rounded px-2 py-1"
                  onChange={(e) =>
                    setFilter((prevFilter) => ({
                      ...prevFilter,
                      assignedTo: e.target.value,
                    }))
                  }
                  value={filter.assignedTo}
                >
                  <option value="">assigned to</option>
                  {!usersLoading &&
                    usersInProject?.map((u) => (
                      <option key={u} value={u} title={u}>
                        {u.length > 10 ? u.substring(0, 10) + "..." : u}
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1">
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-x-2 ml-auto">
                <button
                  onClick={handleApplyFilter}
                  className="bg-green-400 px-1 md:px-3 py-1 text-fadedWhite rounded-md font-semibold disabled:opacity-50"
                  disabled={filter.priority === "" && filter.assignedTo === ""}
                >
                  {isMobile ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check-icon lucide-check"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    "Apply"
                  )}
                </button>
                {(priority !== "" || assignedTo !== "") && (
                  <button
                    onClick={handleClearFilter}
                    className="bg-red-400 px-1 md:px-3 py-1 text-fadedWhite rounded-md font-semibold"
                  >
                    {isMobile ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-x-icon lucide-x"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    ) : (
                      "Clear"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {Object.keys(columns).length > 0 ? (
            <Outlet context={{ setUsernameModal, username, columns }} />
          ) : (
            <p className="text-sm opacity-50 text-center mt-8">
              Loading your tasks...
            </p>
          )}
        </div>
      </div>
      <div className="w-full flex justify-center">
        {actionContext?.action && (
          <TaskActionToast
            projectId={projectId}
            actionContext={actionContext}
          />
        )}
      </div>
    </>
  );
};

export default Projects;
