import { useContext, useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getProjectNameByKey, getUsernameForProject } from "../utils/indexedb";
import UserNameModal from "../components/UserNameModal";
import LinkCopiedModal from "../components/LinkCopiedModal";
import ActionModal from "../components/ActionModal";
import { ActionContext } from "../contexts/ActionContext";
import { trpc } from "../utils/trpc";
import { groupTasksByColumn } from "../utils/utils";
import { Columns } from "../../../server/src/shared/types";

const initialColumns: Columns = {
  backlog: [],
  "in progress": [],
  "for checking": [],
  done: [],
};

const Projects = () => {
  // pag share = true mag jjoin siya ndi kanya so hingin agad ung name
  // pag galing sa home walang share = true so wag na hingin agad ung name

  // UNG SA KAGAYA SA SE NA DAPAT GALING FROM THAT LINK KUNIN UNG STATE IF NDI HINGIN NA AGAD UNG NAME IF WALA NAKASET KASI SHARED UN
  const location = useLocation();
  const fromHome = location.state?.from === "home";

  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!projectId) {
    navigate("/");
    return;
  }

  const [searchParams, setSearchParams] = useSearchParams()

  const priority = searchParams.get("priority") || ""
  const assignedTo = searchParams.get("assignedTo") || ""

  const [usernameModal, setUsernameModal] = useState(false);
  const [linkCopiedModal, setLinkCopiedModal] = useState(false);
  const [userName, setUsername] = useState();
  const [projectName, setProjectName] = useState("");
  const [columns, setColumns] = useState(initialColumns);
  const [filter, setFilter] = useState({
    priority: "",
    assignedTo: ""
  })

  const actionContext = useContext(ActionContext);

  const { data, isLoading, refetch: refetchData } = trpc.getTasks.useQuery({ id: projectId ?? "" });

  useEffect(() => {
    if (data && !isLoading) {
      console.log('called')
      setColumns(groupTasksByColumn(data));
    }
  }, [data, isLoading]);

  
  // check if name is set in storage
  const fetchUsername = async () => {
    const userNameFromIdb = await getUsernameForProject(projectId);
    setUsername(userNameFromIdb);
    return userNameFromIdb;
  };
  
  const fetchProjectName = async () => {
    const projectNameFromIdb = await getProjectNameByKey(projectId);
    setProjectName(projectNameFromIdb ?? "");
  };

  useEffect(() => {
    fetchProjectName();
  }, [projectId]);

  useEffect(() => {
    fetchUsername();
  }, []);

  useEffect(() => {
    const checkUsername = async () => {
      const username = await fetchUsername();
      
      if (!fromHome && (!username || username === "")) {
        console.log(username);
        setUsernameModal(true);
      }
    };

    checkUsername();
  }, []);

  const handleShare = async () => {
    // if not prompt for name
    if (!userName) {
      // set name in indexedb
      setUsernameModal(true);
      return;
      // add name to users in projects db
    }
    
    // copy link to clipboard
    setLinkCopiedModal(true);
  };

  const handleFilterChange = (filters: {key: string, value: string|undefined}[]) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    filters.forEach(({ key, value }) => {
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
    });
    
    setSearchParams(newParams);
  }
  
  
  const { data: filteredTasks, isLoading: filteredTasksIsLoading, refetch: refetchFilteredTasks } =
  trpc.filterTask.useQuery({
    id: projectId,
    priority,
    assignedTo
  }, {
    enabled: priority !== "" || assignedTo !== ""
  });
  
  useEffect(() => {
    if (filteredTasks && !filteredTasksIsLoading){
      setColumns(groupTasksByColumn(filteredTasks));

    }
  }, [filteredTasks, filteredTasksIsLoading])

  const handleApplyFilter = () => {
    handleFilterChange([{key: "priority", value: filter.priority}, {key: "assignedTo", value: filter.assignedTo}])
    // refetchFilteredTasks()
  }
  
  const handleClearFilter = () => {
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams.toString());
      newParams.delete("priority");
      newParams.delete("assignedTo");
      return newParams;
    });

    setFilter({
      priority: "",
      assignedTo: ""
    })

    // refetchData()
    window.location.reload()
  }

  const { data: usersInProject, isLoading: usersLoading } =
    trpc.getUsersInProject.useQuery({
      id: projectId,
    });

  return (
    <>
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
      <div className="h-full flex flex-col">
        <div className="relative flex justify-between px-6 items-center py-4">
          {/* Left side */}
          <div className="flex items-center gap-x-4 max-w-[300px] truncate">
            <Link to="/" className="font-bold whitespace-nowrap">
              TasKan
            </Link>
            <h1 className="truncate text-ellipsis overflow-hidden">
              {projectName}
            </h1>
          </div>

          {/* Center filter */}
          <div className="absolute left-1/2 -translate-x-1/2 bg-[#282828] px-3 py-[0.4rem] rounded-md flex items-center gap-x-3 text-xs">
            <h1 className="text-xs">Filter by:</h1>
            <div className="flex gap-x-2">
              <select
                name="priorityFilter"
                className="text-xs bg-[#282828]"
                onChange={(e) => setFilter((prevFilter) => ({...prevFilter, priority: e.target.value}))}
                value={filter.priority}
              >
                <option value="">priority</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
              <select
                name="assignedToFilter"
                className="text-xs bg-[#282828]"
                onChange={(e) => setFilter((prevFilter) => ({...prevFilter, assignedTo: e.target.value}))}
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
                className="bg-green-400 px-3 py-[0.2rem] rounded-md font-semibold disabled:opacity-50"
                disabled={filter.priority == "" && filter.assignedTo == ""}
              >
                Apply
              </button>
              {(priority !== "" || assignedTo !== "") && <button
                onClick={handleClearFilter}
                className="bg-red-400 px-3 py-[0.2rem] rounded-md font-semibold"
              >
                Clear
              </button>}
            </div>
          </div>

          {/* Right side */}
          <div className="flex justify-end gap-x-4 items-center">
            <h1>{userName}</h1>
            <button
              onClick={handleShare}
              className="px-3 py-1 rounded-md bg-green-400 text-sm font-bold cursor-pointer"
            >
              Share
            </button>
          </div>
        </div>

        <Outlet context={{ setUsernameModal, userName, columns }} />
      </div>
      <div className="w-full flex justify-center">
        {actionContext?.action && (
          <ActionModal projectId={projectId} action={actionContext.action} />
        )}
      </div>
    </>
  );
};

export default Projects;
