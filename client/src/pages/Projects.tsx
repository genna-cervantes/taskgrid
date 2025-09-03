import { useContext, useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
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
import ProjectQuickActions from "@/components/ProjectQuickActions";
import {
  useProjectDetailsStore,
  useTaskCategoryOptionsStore,
  useTasksStore,
  useUsersInProjectStore,
} from "@/zustand/store";

const Projects = () => {
  const { workspaceId, projectId } = useParams();

  const userContext = useUserContext();
  const actionContext = useContext(ActionContext);

  const { setToggleSidebar, setToggleAIChat, toggleAIChat } = useOutletContext<{
    toggleAIChat: boolean;
    setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
    setToggleAIChat: React.Dispatch<React.SetStateAction<boolean>>;
  }>();

  const { setProjectDetails } = useProjectDetailsStore();
  const { setUsersInProject } = useUsersInProjectStore();
  const { setTaskCategoryOptions } = useTaskCategoryOptionsStore()
  const { tasks: tasksStoreData, setTasks } = useTasksStore();

  const [searchParams] = useSearchParams();
  const priority = searchParams.get("priority") || "";
  const assignedTo = searchParams.get("assignedTo") || "";
  const category = searchParams.get("category") || "";
  const projectTaskIds = searchParams.get("projectTaskIds") || "";

  const [linkCopiedModal, setLinkCopiedModal] = useState(false);

  const isFilterEnabled =
    priority !== "" ||
    assignedTo !== "" ||
    category !== "" ||
    projectTaskIds !== "";

  // check if workspace exists
  const { data: workspaceName, isLoading: workspaceExistsIsLoading } =
    trpc.workspaces.checkWorkspaceId.useQuery(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    );

  // CENTRALIZED FETCHING
  // raw tasks
  const { data: rawData, isLoading } = trpc.tasks.getTasks.useQuery(
    {
      id: projectId!,
    },
    { enabled: projectId !== "",
      onSuccess: (data) => setTasks(data)
     }
  );

  // project details
  const { data: projectDetails, isLoading: projectDetailsIsLoading } =
    trpc.projects.getProjectDetails.useQuery(
      { projectId: projectId! },
      {
        enabled: projectId !== "",
        onSuccess: (data) => setProjectDetails(data),
      }
    );

  // users in project
  trpc.users.getUsersInProject.useQuery(
    { id: projectId! },
    {
      enabled: projectId !== "",
      onSuccess: (data) => setUsersInProject(data)
    }
  );

  // task category options
  const { data: taskCategoryOptions } =
    trpc.tasks.getTaskCategoryOptions.useQuery(
      { projectId: projectId! },
      { enabled: projectId !== "",
        onSuccess: (data) => setTaskCategoryOptions(data)
       }
    );

  // handle multiple filter in one factor
  const rawFilteredTasksStoreData = isFilterEnabled ? tasksStoreData.filter((task: Task) => {
    if (priority === "" && assignedTo === "" && category === "" && projectTaskIds === "") {
      return true;
    }
    
    if (priority !== "" && !priority.split(",").includes(task.priority)) {
      return false;
    }
    if (assignedTo !== "" && !task.assignTo.some((at) => assignedTo.split(',').includes(at))) {
      return false;
    }
    if (category !== "" && !category.split(",").includes(task.category ?? "")) {
      return false;
    }
    if (projectTaskIds !== "" && !projectTaskIds.split(",").includes(task.projectTaskId.toString())) {
      return false;
    }
    
    return true;
  }) : [];
  const filterTaskQueryEnabled = isFilterEnabled && projectId !== "" && tasksStoreData.length === 0;
  const { data: rawFilteredTasksQueryData, isLoading: filteredTasksIsLoading } =
    trpc.tasks.filterTask.useQuery(
      {
        id: projectId!,
        priority,
        assignedTo,
        category,
        projectTaskIds,
      },
      {
        enabled: filterTaskQueryEnabled,
      }
    );
  const rawFilteredTasks = rawFilteredTasksStoreData || rawFilteredTasksQueryData;

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
    ? filteredTasks && (!filterTaskQueryEnabled || !filteredTasksIsLoading)
      ? groupTasksByColumn(filteredTasks)
      : {}
    : data && !isLoading
    ? groupTasksByColumn(data)
    : {};


  // keyboard shortcuts
  useEffect(() => {
    Mousetrap.bind("ctrl+b", function (e) {
      e.preventDefault();
      setToggleSidebar((prev) => !prev);
    });

    Mousetrap.bind("ctrl+alt+b", function (e) {
      e.preventDefault();
      setToggleAIChat((prev) => !prev);
    });

    return () => {
      Mousetrap.unbind("ctrl+b");
    };
  }, []);

  // need loading screen
  if (
    userContext.isLoading &&
    userContext.username == null &&
    !userContext.username &&
    workspaceExistsIsLoading
  ) {
    console.log("return from this");
    return <LoadingModal />;
  }

  if (
    !projectId ||
    projectId === "" ||
    !workspaceId ||
    workspaceId === "" ||
    (!projectDetails?.name && !projectDetailsIsLoading) ||
    (!workspaceExistsIsLoading && !workspaceName)
  ) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
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

      <div className="h-full flex flex-col w-full super-thin-scrollbar">
        {/* bread crumbs */}
        <div className="w-full flex justify-between">
          <BreadCrumbs
            crumbs={[
              {
                name: workspaceName as string,
                url: `/workspaces/${workspaceId}`,
              },
              {
                name: projectDetails?.name as string,
                url: `/workspaces/${workspaceId}/projects/${projectId}`,
              },
              {
                name: "board",
                url: `/workspaces/${workspaceId}/projects/${projectId}`,
              },
            ]}
          />
          <button
            onClick={() => setToggleAIChat((prev) => !prev)}
            className="text-xs my-0 h-6 bg-gradient-to-r from-purple-300 to-pink-300 flex-shrink-0 rounded-md px-4 font-bold leading-none py-0 text-backgroundDark "
          >
            {/* <MessageSquare /> */}
            {toggleAIChat ? "Close AI Assistant" : "Try TasKan AI Assistant"}
          </button>
        </div>

        {/* quick actions */}
        <ProjectQuickActions taskCategoryOptions={taskCategoryOptions} />

        {Object.keys(columns).length > 0 ? (
          <Outlet
            context={{
              username: userContext.username,
              columns,
              taskCategoryOptions,
            }}
          />
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
