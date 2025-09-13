import BreadCrumbs from "@/components/BreadCrumbs";
import { trpc } from "@/utils/trpc";
import { useNavigate, useParams } from "react-router-dom";
import TaskCategory from "@/components/TaskCategory";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  ChevronRight,
  Funnel,
  Link,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { useProjectDetailsStore } from "@/zustand/store";
import TaskPriority from "@/components/TaskPriority";
import GenerateTasksModal from "@/components/GenerateTasksModal";
import { useEffect, useMemo, useState } from "react";
import { TriageTask } from "../../../server/src/shared/types";
import { useStream } from "@/hooks/useStream";
import { dedupeById } from "@/utils/utils";
import { ProxyTRPCContextProps } from "@trpc/react-query/shared";

const Triage = () => {
  const { workspaceId, projectId } = useParams();
  const { name } = useProjectDetailsStore();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [generateTasksModal, setGenerateTasksModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [text, setText] = useState("");

  // check if workspace exists
  const { data: workspaceName } = trpc.workspaces.checkWorkspaceId.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId }
  );

  const { data: projectNameQueryData } =
    trpc.projects.getProjectNameByKey.useQuery(
      {
        id: projectId!,
      },
      { enabled: projectId !== "" && name === "" }
    );
  const projectName = name || projectNameQueryData;

  const { data: triageTasks } = trpc.triage.getTriageTasks.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data, startStream, isLoading, firstResponse, isFinished } =
    useStream<TriageTask>(
      "http://localhost:3000/ai-workflows/triage/tasks/generate",
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          projectId: projectId,
          freeText: text,
        }),
      }
    );

  useEffect(() => {
    if (!projectId) return;

    utils.triage.getTriageTasks.setData({ projectId: projectId }, (oldData) => {
      if (!oldData) return [...data];
      return dedupeById([...oldData, ...data]);
    });
  }, [data]);

  const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortedTriageTasks = triageTasks ? triageTasks.sort(
      (a, b) =>
        (rank[a.priority?.toLowerCase()] ?? 99) -
        (rank[b.priority?.toLowerCase()] ?? 99)
    ) : [];

    for (let i = 0; i < 1; i++) {
      if (sortedTriageTasks[i] && sortedTriageTasks[i].enhanceStatus !== "proposed" && sortedTriageTasks[i].enhanceStatus !== "accepted") {
        sortedTriageTasks[i].enhanceStatus = "enhancing";
      }
    }

  // sort the list
  // useeffect on the triage tasks check if the top 5 has changed and if so enhance that top 3
  // -- set enhace status to enhancing ?
  // rendered na ung data nyan eh so may useeffect sa data tapos ung loading is naka state so change string nlng nung state depende sa server res
  // sending request to enhance PER task
  // dont explain, reason
  // stream the response too but just the loading states and when done then update the task

  if (!projectId) {
    console.log("projectId is not defined");
    navigate("/404");
  }

  return (
    <>
      {generateTasksModal && projectId && !firstResponse && (
        <GenerateTasksModal
          setIsGenerating={setIsGenerating}
          setGenerateTasksModal={setGenerateTasksModal}
          text={text}
          setText={setText}
          startStream={startStream}
          isLoading={isLoading}
        />
      )}
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
          {
            name: "triage",
            url: `/workspaces/${workspaceId}/projects/${projectId}/triage`,
          },
        ]}
      />
      <div className="w-full">
        <div className="flex items-center gap-x-4">
          <div className="flex gap-x-2 items-center">
            <p className="text-sm font-semibold">Triage Tasks</p>
            <div className="bg-faintWhite/10 px-2 h-5 flex justify-center items-center font-semibold text-xs capitalize text-center font-noto rounded-full">
              {triageTasks?.length ?? 0}
            </div>
          </div>
          <div className="flex gap-x-2">
            <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
              <ArrowUpDown className="h-3" />
              <p>Sort: Autosort</p>
            </button>
            <button className="text-xxs !border !border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center">
              <Funnel className="h-3" />
              <p>Filter</p>
            </button>
            <button
              onClick={() => setGenerateTasksModal(true)}
              className="text-xxs active:border-fadedWhite transition-colors duration-100 border border-faintWhite rounded-md flex gap-x-1 pl-1 pr-2 py-1 items-center"
            >
              {isGenerating && !isFinished ? (
                <Loader2 className="h-3 animate-spin" />
              ) : (
                <Sparkles className="h-3" />
              )}
              <p>Generate Tasks</p>
            </button>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col gap-y-2 mt-3 overflow-y-auto super-thin-scrollbar pr-2">
        {sortedTriageTasks.map((task) => (
          <TriageTaskBlock            
            key={task.id}
            task={task}
            projectId={projectId!}
          />
        ))}
      </div>
    </>
  );
};

const TriageTaskBlock = ({
  task,
  projectId,
}: {
  task: TriageTask;
  projectId: string;
}) => {
  const utils = trpc.useUtils();
  const [enhancingState, setEnhancingState] = useState<string>("Enhancing");

  const { data, startStream, isLoading, firstResponse, isFinished } =
    useStream<{ state: string }>(
      "http://localhost:3000/ai-workflows/triage/tasks/enhance",
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          projectId: projectId,
          triageTaskId: task.id,
        }),
      }
    );

  useEffect(() => {
    if (task.enhanceStatus === "enhancing") {
      startStream();
    }
  }, [task.enhanceStatus]);

  useEffect(() => {
    if (firstResponse) {
      setEnhancingState(data[data.length - 1].state ?? "Enhancing");
    }

    if (data[data.length - 1]?.state === "done") {
      console.log('should be done')
      utils.triage.getTriageTasks.invalidate();
    }
  }, [data]);

  return (
    <div className="w-full border border-faintWhite rounded-md px-3 py-3">
      <div className="flex justify-between">
        <h1 className="text-sm font-bold">{task.title}</h1>
        <p className="text-xxs text-midWhite mb-2">5d</p>
      </div>
      <div className="flex gap-x-2 items-center mt-1">
        <TaskPriority className="text-sm" priority={task.priority} />
        {task.category && (
          <TaskCategory
            className=""
            category={task.category}
            taskCategoryOptions={[]}
          />
        )}
      </div>

      <p className="text-xs mt-2">{task.description}</p>

      <p className="text-xs mt-2 flex items-center gap-x-0">
        <User className="h-3 ml-[-0.4rem]" /> {task.assignTo.join(", ")}
      </p>

      <div className="flex gap-x-2 mt-3">
        <Button className="text-xs hover:bg-inherit text-white bg-inherit active:border-fadedWhite transition-colors duration-100 border border-faintWhite px-2 py-1">
          Move to Backlog
        </Button>
        <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
          Mark as Duplicate
        </Button>
        <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
          Delete
        </Button>
      </div>
      {task.enhanceStatus === "enhancing" && (
        <div className="w-full flex gap-x-2 bg-purple-300/20 rounded-md px-2 py-2 mt-3 text-xs border-faintWhite border">
          <p className="animate-pulse text-xs text-purple-300 font-bold">{enhancingState}</p>
        </div>
      )}
      {task.enhanceStatus === "proposed" && (
        <>
          {
            <div className="w-full flex gap-x-2 bg-purple-300/20 rounded-md px-2 py-2 mt-3 text-xs border-faintWhite border">
              <div className="w-full">
                <div className="flex gap-x-3 items-center mb-2">
                  <p className="text-xs text-purple-300 font-bold">
                    AI Suggestions
                  </p>

                  <p className="text-xxs text-fadedWhite flex items-center">
                    Show Reasoning <ChevronRight className="h-3" />
                  </p>
                </div>
                <div className="flex gap-x-2 items-center my-1">
                  {task.enhancedPriority && <TaskPriority className="text-sm" priority={task.enhancedPriority} />}
                  {task.enhancedCategory && <TaskCategory
                    className=""
                    category={task.enhancedCategory}
                    taskCategoryOptions={[
                      { category: "feature", color: "green" },
                    ]}
                  />}
                  {task.enhancedDependsOn.length > 0 && <div className="flex items-center gap-x-[1px] border rounded-md border-faintWhite pr-2">
                    <Link className="h-3" />
                    <p className="text-xxs text-white">{task.enhancedDependsOn.map((d) => d.id).join(", ")}</p>
                  </div>}
                </div>
                <div className="whitespace-pre-wrap pl-2 py-1 italic">
                  {task.enhancedDescription}
                </div>

                {task.enhancedAssignTo.length > 0 && <p className="text-xs mt-2 flex items-center gap-x-0">
                  <User className="h-3 ml-[-0.4rem]" />{" "}
                  {task.enhancedAssignTo.join(", ")}
                </p>}
              </div>
              <div className="flex-1 flex items-center gap-x-1">
                <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
                  Accept
                </Button>
                <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
                  Accept & Move to Backlog
                </Button>
                <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
                  Dismiss
                </Button>
              </div>
            </div>
          }
        </>
      )}
    </div>
  );
};
// const TriageTaskBlock = ({task}: {task: TriageTask}) => {
//   return (
//     <div className="w-full border border-faintWhite rounded-md px-3 py-3">
//       <div className="flex justify-between">
//         <h1 className="text-sm font-bold">{task.title}</h1>
//         <p className="text-xxs text-midWhite mb-2">
//           5d
//         </p>
//       </div>
//       <div className="flex gap-x-2 items-center mt-1">
//         <TaskPriority className="text-sm" priority={task.priority} />
//         <TaskCategory
//           className=""
//           category={task.category}
//           taskCategoryOptions={[]}
//         />
//       </div>

//       <p className="text-xs mt-2">
//         {task.description}
//       </p>

//       <p className="text-xs mt-2 flex items-center gap-x-0">
//         <User className="h-3 ml-[-0.4rem]" /> {task.assignTo.join(", ")}
//       </p>

//       <div className="flex gap-x-2 mt-3">
//         <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
//           Move to Backlog
//         </Button>
//         <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
//           Mark as Duplicate
//         </Button>
//         <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">
//           Delete
//         </Button>
//       </div>
//       {task.enhanceStatus === 'proposed' && <div className="w-full flex gap-x-2 bg-purple-300/20 rounded-md px-2 py-1 mt-3 text-xs border-faintWhite border">
//         <div className="w-full">
//           <p className="text-xxs text-purple-300 font-bold mb-1">
//             AI Suggestions
//           </p>
//           <div className="flex gap-x-2 items-center mt-1">
//             <TaskPriority className="text-sm" priority={task.enhancedPriority} />
//             <TaskCategory
//               className=""
//               category={task.enhancedCategory}
//               taskCategoryOptions={[]}
//             />
//           </div>
//           <p>
//             {task.enhancedDescription}
//           </p>
//         </div>
//         <div className="flex-1 flex items-center gap-x-1">
//           <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">Accept</Button>
//           <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">Accept & Move to Backlog</Button>
//           <Button className="text-xs hover:bg-inherit text-white bg-inherit border border-faintWhite px-2 py-1">Dismiss</Button>
//         </div>
//       </div>}
//     </div>
//   );
// };

export default Triage;
