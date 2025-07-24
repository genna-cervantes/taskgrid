import { useContext, useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
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
import Mousetrap from "mousetrap";

const Projects = () => {
  const { workspaceId, projectId } = useParams();

  const userContext = useUserContext();
  const actionContext = useContext(ActionContext);

  const { setToggleSidebar } = useOutletContext<{
    setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  }>();

  const [searchParams, setSearchParams] = useSearchParams();
  const priority = searchParams.get("priority") || "";
  const assignedTo = searchParams.get("assignedTo") || "";
  const category = searchParams.get("category") || "";

  const [linkCopiedModal, setLinkCopiedModal] = useState(false);

  const isFilterEnabled =
    priority !== "" || assignedTo !== "" || category !== "";

  // check if workspace exists
  const { data: workspaceName, isLoading: workspaceExistsIsLoading } =
    trpc.checkWorkspaceId.useQuery(
      { workspaceId: workspaceId!, guestId: userContext.userId! },
      { enabled: userContext.userId !== "" && workspaceId !== "" }
    );

  const { data: rawData, isLoading } = trpc.getTasks.useQuery(
    {
      id: projectId!,
    },
    { enabled: projectId !== "" }
  );
  // handle multiple filter in one factor
  const { data: rawFilteredTasks, isLoading: filteredTasksIsLoading } =
    trpc.filterTask.useQuery(
      {
        id: projectId!,
        priority,
        assignedTo,
        category,
      },
      {
        enabled: isFilterEnabled && projectId !== "",
      }
    );

  const data: Task[] | undefined = (rawData as Task[] | undefined)?.map(
    (rd) => {
      return {
        ...rd,
        targetStartDate: rd.targetStartDate
          ? new Date(rd.targetStartDate)
          : undefined,
        targetEndDate: rd.targetEndDate
          ? new Date(rd.targetEndDate)
          : undefined,
      };
    }
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
    trpc.getUsername.useQuery(
      {
        id: projectId!,
        guestId: userContext.userId ?? "",
      },
      { enabled: projectId !== "" }
    );

  const { data: projectName, isLoading: projectNameIsLoading } = trpc.getProjectNameByKey.useQuery(
    {
      id: projectId!,
    },
    { enabled: projectId !== "" }
  );

  // task category options
  const { data: taskCategoryOptions } = trpc.getTaskCategoryOptions.useQuery(
    { projectId: projectId! },
    { enabled: projectId !== "" }
  );

  // helper functions
  const handleShare = async () => {
    setLinkCopiedModal(true);
  };

  // keyboard shortcuts
  useEffect(() => {
    Mousetrap.bind("ctrl+b", function (e) {
      e.preventDefault();
      setToggleSidebar((prev) => !prev);
    });

    return () => {
      Mousetrap.unbind("ctrl+b");
    };
  }, []);

  // need loading screen
  if (
    userContext.isLoading &&
    userContext.userId == null &&
    !userContext.userId &&
    workspaceExistsIsLoading
  ) {
    console.log('return from this')
    return <LoadingModal />;
  }
  
  if (
    !projectId ||
    projectId === "" || 
    !workspaceId ||
    workspaceId === "" ||
    (!projectName && !projectNameIsLoading) ||
    (!workspaceExistsIsLoading && !workspaceName)
  ) {   
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {usernameIsLoading && <LoadingModal />}
      {linkCopiedModal && (
        <LinkCopiedModal setLinkCopiedModal={setLinkCopiedModal} />
      )}
      {/* {usernameModal && (
        <UserNameModal
          fromHome={fromHome}
          projectId={projectId}
          setUsernameModal={setUsernameModal}
        />
      )} */}

      <div className="h-full flex flex-col w-full">
        {/* bread crumbs */}
        <BreadCrumbs
          crumbs={[
            {
              name: workspaceName as string,
              url: `/workspaces/${workspaceId}`,
            },
            {
              name: projectName as string,
              url: `/workspaces/${workspaceId}/projects/${projectId}`,
            },
          ]}
        />
        {Object.keys(columns).length > 0 ? (
          <Outlet context={{ username, columns, taskCategoryOptions }} />
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
