import { useContext, useEffect, useState } from "react";
import {
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
import { useUserContext } from "../contexts/UserContext";
import LoadingModal from "../components/LoadingModal";
import { Task } from "../../../server/src/shared/types";
import BreadCrumbs from "@/components/BreadCrumbs";

const Projects = () => {
  
  const location = useLocation();
  const fromHome = location.state?.from === "home"; // tracks ownership
  let isOwnBoard = true;

  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!projectId) {
    navigate("/");
    return;
  }

  const userContext = useUserContext();

  const { data: projects, isLoading: projectsIsLoading } =
    trpc.getUserProjects.useQuery({ guestId: userContext.userId ?? "" });

  if (!projects?.some((p) => p.id === projectId)) {
    isOwnBoard = false;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const priority = searchParams.get("priority") || "";
  const assignedTo = searchParams.get("assignedTo") || "";
  const category = searchParams.get("category") || "";

  const [usernameModal, setUsernameModal] = useState(false);
  const [linkCopiedModal, setLinkCopiedModal] = useState(false);

  const actionContext = useContext(ActionContext);

  const isFilterEnabled = priority !== "" || assignedTo !== "" || category !== "";

  const { data: rawData, isLoading } = trpc.getTasks.useQuery({
    id: projectId,
  });
  // handle multiple filter in one factor
  const { data: rawFilteredTasks, isLoading: filteredTasksIsLoading } =
    trpc.filterTask.useQuery(
      {
        id: projectId,
        priority,
        assignedTo,
        category
      },
      {
        enabled: isFilterEnabled,
      }
    );

  const data: Task[] | undefined = (rawData as Task[] | undefined)?.map(
    (rd) => {
      return ({
      ...rd,
      targetStartDate: rd.targetStartDate
        ? new Date(rd.targetStartDate)
        : undefined,
      targetEndDate: rd.targetEndDate ? new Date(rd.targetEndDate) : undefined,
    })}
  );

  const filteredTasks: Task[] | undefined = (
    rawFilteredTasks as Task[] | undefined
  )?.map((rd) => ({
    ...rd,
    targetStartDate: rd.targetStartDate
      ? new Date(rd.targetStartDate)
      : undefined,
    targetEndDate: rd.targetEndDate ? new Date(rd.targetEndDate) : undefined,
  }));

  const columns = isFilterEnabled
    ? filteredTasks && !filteredTasksIsLoading
      ? groupTasksByColumn(filteredTasks)
      : {}
    : data && !isLoading
      ? groupTasksByColumn(data)
      : {};

  const { data: username, isLoading: usernameIsLoading } =
    trpc.getUsername.useQuery({
      id: projectId,
      guestId: userContext.userId ?? "",
    });
  const { data: projectName } = trpc.getProjectNameByKey.useQuery({
    id: projectId,
  });

  // task category options
  const {data: taskCategoryOptions} = trpc.getTaskCategoryOptions.useQuery({projectId})

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

  // need loading screen
  if (
    userContext.isLoading &&
    userContext.userId == null &&
    !userContext.userId
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

      <div className="h-full flex flex-col w-full">     
        {/* bread crumbs */}
        <BreadCrumbs crumbs={[]} />
        {Object.keys(columns).length > 0 ? (
          <Outlet context={{ setUsernameModal, username, columns, taskCategoryOptions }} />
        ) : (
          <p className="text-sm opacity-50 text-center mt-8">
            Loading your tasks...
          </p>
        )}
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
